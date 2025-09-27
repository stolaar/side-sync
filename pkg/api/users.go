package api

import (
	"encoding/json"
	"fmt"
	"net/http"

	"side-sync/pkg/models"
)

func (s *Server) GetUsers(w http.ResponseWriter, r *http.Request) {
	var users []models.User
	err := s.db.Select(&users, "SELECT id, email, name, created_at, updated_at FROM users ORDER BY created_at DESC")
	if err != nil {
		fmt.Println(err)
		http.Error(w, "Failed to fetch users", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}