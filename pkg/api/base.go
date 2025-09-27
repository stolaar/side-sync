package api

import (
	"side-sync/pkg/db"
)

type Server struct {
	db *db.DB
}

func NewServer(database *db.DB) *Server {
	return &Server{db: database}
}