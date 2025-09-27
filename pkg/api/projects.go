package api

import (
	"encoding/json"
	"fmt"
	"net/http"

	"side-sync/pkg/models"
)

func (s *Server) GetProjects(w http.ResponseWriter, r *http.Request) {
	var projects []models.Project
	err := s.db.Select(&projects, "SELECT id, name, description, user_id, hourly_rate, created_at, updated_at FROM projects ORDER BY created_at DESC")
	if err != nil {
		http.Error(w, "Failed to fetch projects", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(projects)
}

func (s *Server) CreateProject(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var project models.Project
	if err := json.NewDecoder(r.Body).Decode(&project); err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	query := `INSERT INTO projects (name, description, user_id, hourly_rate) VALUES ($1, $2, $3, $4) RETURNING id, created_at, updated_at`
	err := s.db.QueryRow(query, project.Name, project.Description, project.UserID, project.HourlyRate).Scan(&project.ID, &project.CreatedAt, &project.UpdatedAt)
	if err != nil {
		fmt.Printf("Error creating project: %v\n", err)
		http.Error(w, "Failed to create project", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(project)
}

func (s *Server) GetProject(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	projectID := r.URL.Query().Get("id")
	if projectID == "" {
		http.Error(w, "Project ID is required", http.StatusBadRequest)
		return
	}

	var project models.Project
	query := "SELECT id, name, description, user_id, hourly_rate, created_at, updated_at FROM projects WHERE id = $1"
	err := s.db.Get(&project, query, projectID)
	if err != nil {
		fmt.Printf("Error fetching project: %v\n", err)
		http.Error(w, "Project not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(project)
}

func (s *Server) UpdateProject(w http.ResponseWriter, r *http.Request) {
	if r.Method != "PUT" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	projectID := r.URL.Query().Get("id")
	if projectID == "" {
		http.Error(w, "Project ID is required", http.StatusBadRequest)
		return
	}

	var project models.Project
	if err := json.NewDecoder(r.Body).Decode(&project); err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	query := `UPDATE projects SET name = $1, description = $2, hourly_rate = $3, updated_at = NOW() WHERE id = $4 RETURNING id, created_at, updated_at`
	err := s.db.QueryRow(query, project.Name, project.Description, project.HourlyRate, projectID).Scan(&project.ID, &project.CreatedAt, &project.UpdatedAt)
	if err != nil {
		fmt.Printf("Error updating project: %v\n", err)
		http.Error(w, "Failed to update project", http.StatusInternalServerError)
		return
	}

	var userID int
	s.db.Get(&userID, "SELECT user_id FROM projects WHERE id = $1", projectID)
	project.UserID = userID

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(project)
}

func (s *Server) DeleteProject(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	projectID := r.URL.Query().Get("id")
	if projectID == "" {
		http.Error(w, "Project ID is required", http.StatusBadRequest)
		return
	}

	query := `DELETE FROM projects WHERE id = $1`
	_, err := s.db.Exec(query, projectID)
	if err != nil {
		fmt.Printf("Error deleting project: %v\n", err)
		http.Error(w, "Failed to delete project", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Project deleted",
	})
}

