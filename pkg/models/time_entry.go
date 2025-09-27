package models

import "time"

type TimeEntry struct {
	ID          int        `json:"id" db:"id"`
	ProjectID   int        `json:"project_id" db:"project_id"`
	UserID      int        `json:"user_id" db:"user_id"`
	Description string     `json:"description" db:"description"`
	StartTime   time.Time  `json:"start_time" db:"start_time"`
	EndTime     *time.Time `json:"end_time" db:"end_time"`
	Duration    *int       `json:"duration" db:"duration"`
	Billable    bool       `json:"billable" db:"billable"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at" db:"updated_at"`
}