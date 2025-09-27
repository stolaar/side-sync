package models

import "time"

type Settings struct {
	ID                  int       `json:"id" db:"id"`
	DefaultHourlyRate   *float64  `json:"default_hourly_rate" db:"default_hourly_rate"`
	Currency            string    `json:"currency" db:"currency"`
	CreatedAt           time.Time `json:"created_at" db:"created_at"`
	UpdatedAt           time.Time `json:"updated_at" db:"updated_at"`
}