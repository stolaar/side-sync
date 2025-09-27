package api

import (
	"encoding/json"
	"fmt"
	"net/http"

	"side-sync/pkg/models"
)

func (s *Server) GetSettings(w http.ResponseWriter, r *http.Request) {
	var settings models.Settings
	query := "SELECT id, default_hourly_rate, currency, created_at, updated_at FROM settings LIMIT 1"
	err := s.db.Get(&settings, query)
	if err != nil {
		fmt.Printf("Error fetching settings: %v\n", err)
		http.Error(w, "Failed to fetch settings", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(settings)
}

func (s *Server) UpdateSettings(w http.ResponseWriter, r *http.Request) {
	if r.Method != "PUT" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var settings models.Settings
	if err := json.NewDecoder(r.Body).Decode(&settings); err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	query := `UPDATE settings SET default_hourly_rate = $1, currency = $2, updated_at = NOW() WHERE id = 1 RETURNING id, created_at, updated_at`
	err := s.db.QueryRow(query, settings.DefaultHourlyRate, settings.Currency).Scan(&settings.ID, &settings.CreatedAt, &settings.UpdatedAt)
	if err != nil {
		fmt.Printf("Error updating settings: %v\n", err)
		http.Error(w, "Failed to update settings", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(settings)
}

func (s *Server) GetSupportedCurrencies(w http.ResponseWriter, r *http.Request) {
	currencies := []map[string]string{
		{"code": "EUR", "symbol": "€", "name": "Euro"},
		{"code": "USD", "symbol": "$", "name": "US Dollar"},
		{"code": "GBP", "symbol": "£", "name": "British Pound"},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(currencies)
}