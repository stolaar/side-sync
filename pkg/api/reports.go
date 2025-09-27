package api

import (
	"fmt"
	"net/http"
	"strconv"

	"side-sync/pkg/models"
	"side-sync/pkg/pdf"
)

func (s *Server) GeneratePDFReport(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	projectID := r.URL.Query().Get("project_id")
	if projectID == "" {
		http.Error(w, "Project ID is required", http.StatusBadRequest)
		return
	}

	dateFrom := r.URL.Query().Get("date_from")
	dateTo := r.URL.Query().Get("date_to")
	billableFilter := r.URL.Query().Get("billable")
	includePricing := r.URL.Query().Get("include_pricing") != "false"

	var project models.Project
	err := s.db.Get(&project, "SELECT id, name, description, user_id, hourly_rate, created_at, updated_at FROM projects WHERE id = $1", projectID)
	if err != nil {
		http.Error(w, "Project not found", http.StatusNotFound)
		return
	}

	var settings models.Settings
	err = s.db.Get(&settings, "SELECT id, default_hourly_rate, currency, created_at, updated_at FROM settings LIMIT 1")
	if err != nil {
		fmt.Printf("Error fetching settings: %v\n", err)
	}

	query := "SELECT id, project_id, user_id, description, start_time, end_time, duration, billable, created_at, updated_at FROM time_entries WHERE project_id = $1"
	args := []interface{}{projectID}
	argIndex := 2

	if dateFrom != "" {
		query += fmt.Sprintf(" AND DATE(start_time) >= $%d", argIndex)
		args = append(args, dateFrom)
		argIndex++
	}

	if dateTo != "" {
		query += fmt.Sprintf(" AND DATE(start_time) <= $%d", argIndex)
		args = append(args, dateTo)
		argIndex++
	}

	if billableFilter == "billable" {
		query += fmt.Sprintf(" AND billable = $%d", argIndex)
		args = append(args, true)
	} else if billableFilter == "non-billable" {
		query += fmt.Sprintf(" AND billable = $%d", argIndex)
		args = append(args, false)
	}

	query += " ORDER BY start_time ASC"

	var timeEntries []models.TimeEntry
	err = s.db.Select(&timeEntries, query, args...)
	if err != nil {
		fmt.Printf("Error fetching time entries: %v\n", err)
		http.Error(w, "Failed to fetch time entries", http.StatusInternalServerError)
		return
	}

	generator := pdf.NewGenerator()
	config := pdf.ReportConfig{
		Project:        project,
		TimeEntries:    timeEntries,
		Settings:       settings,
		IncludePricing: includePricing,
		DateFrom:       dateFrom,
		DateTo:         dateTo,
		BillableFilter: billableFilter,
	}

	buf, err := generator.GenerateTimeReport(config)
	if err != nil {
		fmt.Printf("Error generating PDF: %v\n", err)
		http.Error(w, "Failed to generate PDF", http.StatusInternalServerError)
		return
	}

	filename := generator.GetFilename(project.Name)

	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	w.Header().Set("Content-Length", strconv.Itoa(buf.Len()))

	w.Write(buf.Bytes())
}

