package api

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"side-sync/pkg/models"
)

func (s *Server) GetTimeEntries(w http.ResponseWriter, r *http.Request) {
	var timeEntries []models.TimeEntry
	err := s.db.Select(&timeEntries, "SELECT id, project_id, user_id, description, start_time, end_time, duration, billable, created_at, updated_at FROM time_entries ORDER BY start_time DESC")
	if err != nil {
		fmt.Println(err)
		http.Error(w, "Failed to fetch time entries", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(timeEntries)
}

func (s *Server) CreateTimeEntry(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var timeEntry models.TimeEntry
	if err := json.NewDecoder(r.Body).Decode(&timeEntry); err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	query := `INSERT INTO time_entries (project_id, user_id, description, start_time, end_time, duration, billable) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, created_at, updated_at`
	err := s.db.QueryRow(query, timeEntry.ProjectID, timeEntry.UserID, timeEntry.Description, timeEntry.StartTime, timeEntry.EndTime, timeEntry.Duration, timeEntry.Billable).Scan(&timeEntry.ID, &timeEntry.CreatedAt, &timeEntry.UpdatedAt)
	if err != nil {
		fmt.Printf("Error creating time entry: %v\n", err)
		http.Error(w, "Failed to create time entry", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(timeEntry)
}

func (s *Server) GetTimeEntriesByProject(w http.ResponseWriter, r *http.Request) {
	projectID := r.URL.Query().Get("project_id")
	if projectID == "" {
		http.Error(w, "Project ID is required", http.StatusBadRequest)
		return
	}

	dateFrom := r.URL.Query().Get("date_from")
	dateTo := r.URL.Query().Get("date_to")
	billableFilter := r.URL.Query().Get("billable")

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

	query += " ORDER BY start_time DESC"

	var timeEntries []models.TimeEntry
	err := s.db.Select(&timeEntries, query, args...)
	if err != nil {
		fmt.Printf("Error fetching time entries: %v\n", err)
		http.Error(w, "Failed to fetch time entries", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(timeEntries)
}

func (s *Server) UpdateTimeEntryBillable(w http.ResponseWriter, r *http.Request) {
	if r.Method != "PUT" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	timeEntryID := r.URL.Query().Get("id")
	if timeEntryID == "" {
		http.Error(w, "Time entry ID is required", http.StatusBadRequest)
		return
	}

	var requestBody struct {
		Billable bool `json:"billable"`
	}

	if err := json.NewDecoder(r.Body).Decode(&requestBody); err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	query := `UPDATE time_entries SET billable = $1, updated_at = NOW() WHERE id = $2`
	_, err := s.db.Exec(query, requestBody.Billable, timeEntryID)
	if err != nil {
		fmt.Printf("Error updating time entry billable status: %v\n", err)
		http.Error(w, "Failed to update time entry", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":  true,
		"billable": requestBody.Billable,
	})
}

func (s *Server) ImportTimeEntriesCSV(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	err := r.ParseMultipartForm(10 << 20)
	if err != nil {
		http.Error(w, "Failed to parse form", http.StatusBadRequest)
		return
	}

	projectIDStr := r.FormValue("project_id")
	if projectIDStr == "" {
		http.Error(w, "Project ID is required", http.StatusBadRequest)
		return
	}

	projectID, err := strconv.Atoi(projectIDStr)
	if err != nil {
		http.Error(w, "Invalid project ID", http.StatusBadRequest)
		return
	}

	file, _, err := r.FormFile("csv_file")
	if err != nil {
		http.Error(w, "Failed to get uploaded file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	reader := csv.NewReader(file)
	records, err := reader.ReadAll()
	if err != nil {
		http.Error(w, "Failed to parse CSV file", http.StatusBadRequest)
		return
	}

	if len(records) < 2 {
		http.Error(w, "CSV file must have header and at least one data row", http.StatusBadRequest)
		return
	}

	var timeEntries []models.TimeEntry
	for i, record := range records[1:] {
		if len(record) < 2 {
			fmt.Printf("Skipping row %d: insufficient columns\n", i+2)
			continue
		}

		dateStr := strings.TrimSpace(record[0])
		date, err := time.Parse("2006-01-02", dateStr)
		if err != nil {
			fmt.Printf("Skipping row %d: invalid date format '%s'\n", i+2, dateStr)
			continue
		}

		durationStr := strings.TrimSpace(record[1])
		durationHours, err := strconv.ParseFloat(durationStr, 64)
		if err != nil || durationHours <= 0 {
			fmt.Printf("Skipping row %d: invalid duration '%s'\n", i+2, durationStr)
			continue
		}

		durationSeconds := int(durationHours * 3600)

		startTime := time.Date(date.Year(), date.Month(), date.Day(), 17, 0, 0, 0, date.Location())

		endTime := startTime.Add(time.Duration(durationSeconds) * time.Second)

		timeEntry := models.TimeEntry{
			ProjectID:   projectID,
			UserID:      1,
			Description: "Imported from CSV",
			StartTime:   startTime,
			EndTime:     &endTime,
			Duration:    &durationSeconds,
			Billable:    true,
		}

		timeEntries = append(timeEntries, timeEntry)
	}

	var createdCount int
	for _, entry := range timeEntries {
		query := `INSERT INTO time_entries (project_id, user_id, description, start_time, end_time, duration, billable) VALUES ($1, $2, $3, $4, $5, $6, $7)`
		_, err := s.db.Exec(query, entry.ProjectID, entry.UserID, entry.Description, entry.StartTime, entry.EndTime, entry.Duration, entry.Billable)
		if err != nil {
			fmt.Printf("Error inserting time entry: %v\n", err)
			continue
		}
		createdCount++
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":        true,
		"message":        fmt.Sprintf("Successfully imported %d time entries", createdCount),
		"imported_count": createdCount,
	})
}

func (s *Server) GetTimeEntry(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	timeEntryID := r.URL.Query().Get("id")
	if timeEntryID == "" {
		http.Error(w, "Time entry ID is required", http.StatusBadRequest)
		return
	}

	var timeEntry models.TimeEntry
	query := "SELECT id, project_id, user_id, description, start_time, end_time, duration, billable, created_at, updated_at FROM time_entries WHERE id = $1"
	err := s.db.Get(&timeEntry, query, timeEntryID)
	if err != nil {
		fmt.Printf("Error fetching time entry: %v\n", err)
		http.Error(w, "Time entry not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(timeEntry)
}

func (s *Server) UpdateTimeEntry(w http.ResponseWriter, r *http.Request) {
	if r.Method != "PUT" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	timeEntryID := r.URL.Query().Get("id")
	if timeEntryID == "" {
		http.Error(w, "Time entry ID is required", http.StatusBadRequest)
		return
	}

	var timeEntry models.TimeEntry
	if err := json.NewDecoder(r.Body).Decode(&timeEntry); err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	query := `UPDATE time_entries SET project_id = $1, description = $2, start_time = $3, end_time = $4, duration = $5, billable = $6, updated_at = NOW() WHERE id = $7 RETURNING id, created_at, updated_at`
	err := s.db.QueryRow(query, timeEntry.ProjectID, timeEntry.Description, timeEntry.StartTime, timeEntry.EndTime, timeEntry.Duration, timeEntry.Billable, timeEntryID).Scan(&timeEntry.ID, &timeEntry.CreatedAt, &timeEntry.UpdatedAt)
	if err != nil {
		fmt.Printf("Error updating time entry: %v\n", err)
		http.Error(w, "Failed to update time entry", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(timeEntry)
}

func (s *Server) DeleteTimeEntry(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	timeEntryID := r.URL.Query().Get("id")
	if timeEntryID == "" {
		http.Error(w, "Time entry ID is required", http.StatusBadRequest)
		return
	}

	query := `DELETE FROM time_entries WHERE id = $1`
	_, err := s.db.Exec(query, timeEntryID)
	if err != nil {
		fmt.Printf("Error deleting time entry: %v\n", err)
		http.Error(w, "Failed to delete time entry", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Time entry deleted",
	})
}

