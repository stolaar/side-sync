package tui

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"side-sync/pkg/models"
)

type Client struct {
	baseURL    string
	httpClient *http.Client
}

func NewClient(baseURL string) *Client {
	return &Client{
		baseURL:    baseURL,
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
}

func (c *Client) GetProjects() ([]models.Project, error) {
	resp, err := c.httpClient.Get(c.baseURL + "/api/projects")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to fetch projects: status %d", resp.StatusCode)
	}

	var projects []models.Project
	if err := json.NewDecoder(resp.Body).Decode(&projects); err != nil {
		return nil, err
	}

	return projects, nil
}

func (c *Client) CreateTimeEntry(entry models.TimeEntry) (*models.TimeEntry, error) {
	data, err := json.Marshal(entry)
	if err != nil {
		return nil, err
	}

	resp, err := c.httpClient.Post(
		c.baseURL+"/api/time-entries",
		"application/json",
		bytes.NewBuffer(data),
	)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		return nil, fmt.Errorf("failed to create time entry: status %d", resp.StatusCode)
	}

	var createdEntry models.TimeEntry
	if err := json.NewDecoder(resp.Body).Decode(&createdEntry); err != nil {
		return nil, err
	}

	return &createdEntry, nil
}
