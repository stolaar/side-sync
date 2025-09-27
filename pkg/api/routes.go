package api

import (
	"net/http"
)

func (s *Server) SetupRoutes() *http.ServeMux {
	mux := http.NewServeMux()

	mux.HandleFunc("/healthz", s.HealthCheck)
	mux.HandleFunc("/api/users", s.GetUsers)
	mux.HandleFunc("/api/projects", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			s.GetProjects(w, r)
		case http.MethodPost:
			s.CreateProject(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})
	mux.HandleFunc("/api/time-entries", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			s.GetTimeEntries(w, r)
		case http.MethodPost:
			s.CreateTimeEntry(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})
	mux.HandleFunc("/api/time-entries/project", s.GetTimeEntriesByProject)
	mux.HandleFunc("/api/time-entries/billable", s.UpdateTimeEntryBillable)
	mux.HandleFunc("/api/time-entries/import", s.ImportTimeEntriesCSV)
	mux.HandleFunc("/api/time-entries/single", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			s.GetTimeEntry(w, r)
		case http.MethodPut:
			s.UpdateTimeEntry(w, r)
		case http.MethodDelete:
			s.DeleteTimeEntry(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})
	mux.HandleFunc("/api/settings", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			s.GetSettings(w, r)
		case http.MethodPut:
			s.UpdateSettings(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})
	mux.HandleFunc("/api/projects/single", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			s.GetProject(w, r)
		case http.MethodPut:
			s.UpdateProject(w, r)
		case http.MethodDelete:
			s.DeleteProject(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})
	mux.HandleFunc("/api/reports/pdf", s.GeneratePDFReport)
	mux.HandleFunc("/api/currencies", s.GetSupportedCurrencies)

	return mux
}