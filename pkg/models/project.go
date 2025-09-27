package models

import "time"

type Project struct {
	ID          int        `json:"id" db:"id"`
	Name        string     `json:"name" db:"name"`
	Description string     `json:"description" db:"description"`
	UserID      int        `json:"user_id" db:"user_id"`
	HourlyRate  *float64   `json:"hourly_rate" db:"hourly_rate"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at" db:"updated_at"`
}