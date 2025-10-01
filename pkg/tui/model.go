package tui

import (
	"fmt"
	"time"

	"side-sync/pkg/models"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

type state int

const (
	stateSelectProject state = iota
	stateTimer
	stateConfirm
	stateSuccess
	stateError
)

type Model struct {
	client           *Client
	projects         []models.Project
	selectedProject  int
	state            state
	startTime        time.Time
	elapsed          time.Duration
	running          bool
	description      string
	err              error
	quitting         bool
	cursor           int
	confirmSelection int
}

func NewModel(apiURL string) Model {
	return Model{
		client:           NewClient(apiURL),
		state:            stateSelectProject,
		confirmSelection: 0,
	}
}

type projectsLoadedMsg []models.Project
type tickMsg time.Time
type errorMsg error
type successMsg struct{}

func loadProjectsCmd(client *Client) tea.Cmd {
	return func() tea.Msg {
		projects, err := client.GetProjects()
		if err != nil {
			return errorMsg(err)
		}
		return projectsLoadedMsg(projects)
	}
}

func tickCmd() tea.Cmd {
	return tea.Tick(time.Second, func(t time.Time) tea.Msg {
		return tickMsg(t)
	})
}

func (m Model) Init() tea.Cmd {
	return loadProjectsCmd(m.client)
}

func (m Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "ctrl+c", "q":
			m.quitting = true
			return m, tea.Quit

		case "up", "k":
			if m.state == stateSelectProject && m.cursor > 0 {
				m.cursor--
			} else if m.state == stateConfirm && m.confirmSelection > 0 {
				m.confirmSelection--
			}

		case "down", "j":
			if m.state == stateSelectProject && m.cursor < len(m.projects)-1 {
				m.cursor++
			} else if m.state == stateConfirm && m.confirmSelection < 1 {
				m.confirmSelection++
			}

		case "enter":
			switch m.state {
			case stateSelectProject:
				if len(m.projects) > 0 {
					m.selectedProject = m.cursor
					m.state = stateTimer
				}
			case stateTimer:
				if m.running {
					m.running = false
					m.elapsed += time.Since(m.startTime)
					m.state = stateConfirm
				} else {
					m.startTime = time.Now()
					m.running = true
					return m, tickCmd()
				}
			case stateConfirm:
				if m.confirmSelection == 0 {
					return m, m.saveTimeEntry()
				} else {
					m.state = stateTimer
					m.confirmSelection = 0
				}
			case stateSuccess, stateError:
				m.state = stateSelectProject
				m.elapsed = 0
				m.running = false
				m.err = nil
				m.confirmSelection = 0
			}

		case "esc":
			if m.state == stateTimer && !m.running {
				m.state = stateSelectProject
				m.elapsed = 0
			} else if m.state == stateConfirm {
				m.state = stateTimer
				m.confirmSelection = 0
			}
		}

	case tickMsg:
		if m.running {
			return m, tickCmd()
		}

	case projectsLoadedMsg:
		m.projects = []models.Project(msg)

	case successMsg:
		m.state = stateSuccess

	case errorMsg:
		m.err = error(msg)
		m.state = stateError
	}

	return m, nil
}

func (m Model) View() string {
	if m.quitting {
		return "Goodbye!\n"
	}

	switch m.state {
	case stateSelectProject:
		return m.viewProjectSelection()
	case stateTimer:
		return m.viewTimer()
	case stateConfirm:
		return m.viewConfirm()
	case stateSuccess:
		return m.viewSuccess()
	case stateError:
		return m.viewError()
	}

	return ""
}

func (m Model) viewProjectSelection() string {
	s := titleStyle.Render("Select a Project") + "\n\n"

	if len(m.projects) == 0 {
		s += "No projects available. Press 'q' to quit.\n"
		return s
	}

	var projectOptions []string
	for i, project := range m.projects {
		cursor := " "
		style := unselectedStyle
		if m.cursor == i {
			cursor = ">"
			style = selectedStyle
		}
		projectOptions = append(projectOptions, style.Render(fmt.Sprintf("%s %s\n", cursor, project.Name)))
	}

	s += lipgloss.JoinVertical(lipgloss.Top, projectOptions...)

	s += helpStyle.Render("\nUse ↑/↓ to navigate, Enter to select, q to quit")

	return s
}

func (m Model) viewTimer() string {
	project := m.projects[m.selectedProject]
	s := titleStyle.Render(fmt.Sprintf("Time Tracking: %s", project.Name)) + "\n\n"

	elapsed := m.elapsed
	if m.running {
		elapsed += time.Since(m.startTime)
	}

	hours := int(elapsed.Hours())
	minutes := int(elapsed.Minutes()) % 60
	seconds := int(elapsed.Seconds()) % 60

	s += timerStyle.Render(fmt.Sprintf("%02d:%02d:%02d", hours, minutes, seconds)) + "\n\n"

	if m.running {
		s += buttonActiveStyle.Render("Stop Timer") + "\n"
	} else {
		s += buttonStyle.Render("Start Timer") + "\n"
	}

	s += helpStyle.Render("\nPress Enter to start/stop timer, Esc to go back, q to quit")

	return s
}

func (m Model) viewConfirm() string {
	project := m.projects[m.selectedProject]
	s := titleStyle.Render("Confirm Time Entry") + "\n\n"

	s += fmt.Sprintf("Project: %s\n", project.Name)
	s += fmt.Sprintf("Duration: %s\n\n", formatDuration(m.elapsed))

	options := []string{"✓ Save", "✗ Cancel"}
	for i, option := range options {
		if m.confirmSelection == i {
			s += selectedStyle.Render("> " + option + "\n")
		} else {
			s += unselectedStyle.Render("  " + option + "\n")
		}
	}

	s += helpStyle.Render("\nUse ↑/↓ to navigate, Enter to confirm, Esc to go back")

	return s
}

func (m Model) viewSuccess() string {
	s := titleStyle.Render("Time Entry Saved!") + "\n\n"
	s += successStyle.Render("✓ Time entry successfully saved") + "\n\n"
	s += helpStyle.Render("Press Enter to start a new timer, q to quit")
	return s
}

func (m Model) viewError() string {
	s := titleStyle.Render("Error") + "\n\n"
	s += errorStyle.Render(fmt.Sprintf("✗ Failed to save time entry: %v", m.err)) + "\n\n"
	s += helpStyle.Render("Press Enter to try again, q to quit")
	return s
}

func (m Model) saveTimeEntry() tea.Cmd {
	return func() tea.Msg {
		project := m.projects[m.selectedProject]
		startTime := time.Now().Add(-m.elapsed)
		endTime := time.Now()
		durationSeconds := int(m.elapsed.Seconds())

		entry := models.TimeEntry{
			ProjectID:   project.ID,
			UserID:      1,
			Description: "Tracked via TUI",
			StartTime:   startTime,
			EndTime:     &endTime,
			Duration:    &durationSeconds,
			Billable:    true,
		}

		_, err := m.client.CreateTimeEntry(entry)
		if err != nil {
			return errorMsg(err)
		}

		return successMsg{}
	}
}

func formatDuration(d time.Duration) string {
	hours := int(d.Hours())
	minutes := int(d.Minutes()) % 60
	seconds := int(d.Seconds()) % 60
	return fmt.Sprintf("%02d:%02d:%02d", hours, minutes, seconds)
}
