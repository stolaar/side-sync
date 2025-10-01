package main

import (
	"fmt"
	"os"

	tea "github.com/charmbracelet/bubbletea"
	"side-sync/pkg/tui"
)

func main() {
	apiURL := os.Getenv("API_URL")
	if apiURL == "" {
		apiURL = "http://localhost:8080"
	}

	p := tea.NewProgram(tui.NewModel(apiURL))
	if _, err := p.Run(); err != nil {
		fmt.Printf("Error: %v\n", err)
		os.Exit(1)
	}
}
