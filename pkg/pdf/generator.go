package pdf

import (
	"bytes"
	"fmt"
	"strings"
	"time"

	"side-sync/pkg/models"

	"github.com/jung-kurt/gofpdf/v2"
)

type Generator struct{}

type ReportConfig struct {
	Project        models.Project
	TimeEntries    []models.TimeEntry
	Settings       models.Settings
	IncludePricing bool
	DateFrom       string
	DateTo         string
	BillableFilter string
}

func NewGenerator() *Generator {
	return &Generator{}
}

func formatAmount(amount float64) string {
	return fmt.Sprintf("%.2f", amount)
}

func formatCurrency(amount float64, currencyCode string) string {
	return fmt.Sprintf("%.2f %s", amount, currencyCode)
}

func (g *Generator) GenerateTimeReport(config ReportConfig) (*bytes.Buffer, error) {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.AddPage()

	g.addHeader(pdf, config.Project)

	totalHours, billableHours, _, billableCost, effectiveRate, currency := g.calculateTotals(config)
	g.addSummary(pdf, config, totalHours, billableHours, billableCost, effectiveRate, currency)

	g.addTimeEntriesTable(pdf, config, effectiveRate, currency)

	g.addFooter(pdf)

	var buf bytes.Buffer
	err := pdf.Output(&buf)
	if err != nil {
		return nil, fmt.Errorf("failed to generate PDF: %v", err)
	}

	return &buf, nil
}

func (g *Generator) addHeader(pdf *gofpdf.Fpdf, project models.Project) {
	pdf.SetFont("Arial", "B", 20)
	pdf.SetTextColor(52, 152, 219)
	pdf.Cell(190, 15, "TIME TRACKING REPORT")
	pdf.Ln(12)

	pdf.SetFont("Arial", "B", 16)
	pdf.SetTextColor(0, 0, 0)
	pdf.Cell(190, 10, fmt.Sprintf("Project: %s", project.Name))
	pdf.Ln(10)

	if project.Description != "" {
		pdf.SetFont("Arial", "", 12)
		pdf.SetTextColor(100, 100, 100)
		pdf.Cell(190, 6, project.Description)
		pdf.Ln(10)
	}

	pdf.SetFont("Arial", "", 10)
	pdf.SetTextColor(150, 150, 150)
	pdf.Cell(190, 5, fmt.Sprintf("Generated on %s", time.Now().Format("January 2, 2006 at 3:04 PM")))
}

func (g *Generator) calculateTotals(config ReportConfig) (float64, float64, float64, float64, float64, string) {
	var totalHours, billableHours, totalCost, billableCost float64
	var effectiveRate float64
	currency := "EUR"

	if config.Project.HourlyRate != nil {
		effectiveRate = *config.Project.HourlyRate
	} else if config.Settings.DefaultHourlyRate != nil {
		effectiveRate = *config.Settings.DefaultHourlyRate
	}

	if config.Settings.Currency != "" {
		currency = config.Settings.Currency
	}

	for _, entry := range config.TimeEntries {
		if entry.Duration != nil {
			hours := float64(*entry.Duration) / 3600
			totalHours += hours
			if entry.Billable {
				billableHours += hours
				billableCost += hours * effectiveRate
			}
			totalCost += hours * effectiveRate
		}
	}

	return totalHours, billableHours, totalCost, billableCost, effectiveRate, currency
}

func (g *Generator) addSummary(pdf *gofpdf.Fpdf, config ReportConfig, totalHours, billableHours, billableCost, effectiveRate float64, currency string) {
	_, currentY := pdf.GetXY()
	summaryY := currentY + 8

	pdf.SetFont("Arial", "B", 14)
	pdf.SetXY(10, summaryY)
	pdf.Cell(190, 8, "SUMMARY")

	rateY := summaryY + 12
	if effectiveRate > 0 && config.IncludePricing {
		pdf.SetFont("Arial", "", 10)
		pdf.SetXY(10, rateY)
		pdf.Cell(190, 5, fmt.Sprintf("Rate: %s/hr - All amounts in %s", formatAmount(effectiveRate), currency))
		rateY += 8
	}

	pdf.SetFont("Arial", "B", 12)
	pdf.SetFillColor(240, 248, 255)

	yPos := rateY + 5

	pdf.Rect(10, float64(yPos), 40, 20, "F")
	pdf.SetXY(12, float64(yPos+3))
	pdf.Cell(35, 5, "Total Hours")
	pdf.SetFont("Arial", "B", 14)
	pdf.SetXY(12, float64(yPos+10))
	pdf.Cell(35, 5, fmt.Sprintf("%.1f", totalHours))

	pdf.SetFont("Arial", "B", 12)
	pdf.Rect(60, float64(yPos), 40, 20, "F")
	pdf.SetXY(62, float64(yPos+3))
	pdf.Cell(35, 5, "Billable Hours")
	pdf.SetFont("Arial", "B", 14)
	pdf.SetXY(62, float64(yPos+10))
	pdf.Cell(35, 5, fmt.Sprintf("%.1f", billableHours))

	pdf.SetFont("Arial", "B", 12)
	pdf.Rect(110, float64(yPos), 40, 20, "F")
	pdf.SetXY(112, float64(yPos+3))
	pdf.Cell(40, 5, "Non-Billable Hours")
	pdf.SetFont("Arial", "B", 14)
	pdf.SetXY(112, float64(yPos+10))
	pdf.Cell(40, 5, fmt.Sprintf("%.1f", totalHours-billableHours))

	if effectiveRate > 0 && config.IncludePricing {
		pdf.SetFont("Arial", "B", 12)
		pdf.Rect(160, float64(yPos), 40, 20, "F")
		pdf.SetXY(162, float64(yPos+3))
		pdf.Cell(35, 5, "Billable Amount")
		pdf.SetFont("Arial", "B", 14)
		pdf.SetXY(162, float64(yPos+10))
		pdf.Cell(35, 5, formatCurrency(billableCost, currency))
	}
}

func (g *Generator) addTimeEntriesTable(pdf *gofpdf.Fpdf, config ReportConfig, effectiveRate float64, currency string) {
	_, currentY := pdf.GetXY()
	tableY := currentY + 10

	pdf.SetFont("Arial", "B", 14)
	pdf.SetXY(10, tableY)
	pdf.Cell(190, 8, "TIME ENTRIES")

	pdf.SetFillColor(52, 152, 219)
	pdf.SetTextColor(255, 255, 255)
	pdf.SetFont("Arial", "B", 9)

	headerY := tableY + 10
	pdf.SetXY(10, float64(headerY))
	pdf.Rect(10, float64(headerY), 190, 8, "F")

	if effectiveRate > 0 && config.IncludePricing {
		pdf.Cell(22, 8, "Date")
		pdf.Cell(65, 8, "Description")
		pdf.Cell(22, 8, "Duration")
		pdf.Cell(18, 8, "Billable")
		pdf.Cell(18, 8, "Hours")
		pdf.Cell(22, 8, "Rate")
		pdf.Cell(23, 8, "Cost")
	} else {
		pdf.Cell(30, 8, "Date")
		pdf.Cell(80, 8, "Description")
		pdf.Cell(30, 8, "Duration")
		pdf.Cell(25, 8, "Billable")
		pdf.Cell(25, 8, "Hours")
	}

	pdf.SetTextColor(0, 0, 0)
	pdf.SetFont("Arial", "", 8)
	y := headerY + 8

	for _, entry := range config.TimeEntries {
		pdf.SetXY(10, float64(y))

		if y > 270 {
			pdf.AddPage()
			y = 20
			pdf.SetXY(10, float64(y))
		}

		var entryHours float64
		var entryCost float64
		if entry.Duration != nil {
			entryHours = float64(*entry.Duration) / 3600
			if effectiveRate > 0 {
				entryCost = entryHours * effectiveRate
			}
		}

		if effectiveRate > 0 && config.IncludePricing {
			date := entry.StartTime.Format("01-02")
			pdf.Cell(22, 6, date)

			description := entry.Description
			if len(description) > 32 {
				description = description[:29] + "..."
			}
			pdf.Cell(65, 6, description)

			var durationText string
			if entry.Duration != nil {
				hours := *entry.Duration / 3600
				minutes := (*entry.Duration % 3600) / 60
				durationText = fmt.Sprintf("%02d:%02d", hours, minutes)
			} else {
				durationText = "00:00"
			}
			pdf.Cell(22, 6, durationText)

			billableText := "No"
			if entry.Billable {
				billableText = "Yes"
			}
			pdf.Cell(18, 6, billableText)

			pdf.Cell(18, 6, fmt.Sprintf("%.1f", entryHours))

			if entry.Billable {
				pdf.Cell(22, 6, formatAmount(effectiveRate))
			} else {
				pdf.Cell(22, 6, "-")
			}

			if entry.Billable {
				pdf.Cell(23, 6, formatAmount(entryCost))
			} else {
				pdf.Cell(23, 6, "-")
			}
		} else {
			date := entry.StartTime.Format("2006-01-02")
			pdf.Cell(30, 6, date)

			description := entry.Description
			if len(description) > 45 {
				description = description[:42] + "..."
			}
			pdf.Cell(80, 6, description)

			var durationText string
			if entry.Duration != nil {
				hours := *entry.Duration / 3600
				minutes := (*entry.Duration % 3600) / 60
				durationText = fmt.Sprintf("%02d:%02d", hours, minutes)
			} else {
				durationText = "00:00"
			}
			pdf.Cell(30, 6, durationText)

			billableText := "No"
			if entry.Billable {
				billableText = "Yes"
			}
			pdf.Cell(25, 6, billableText)

			pdf.Cell(25, 6, fmt.Sprintf("%.1f", entryHours))
		}

		y += 6
	}
}

func (g *Generator) addFooter(pdf *gofpdf.Fpdf) {
	_, y := pdf.GetXY()

	footerY := y + 20
	if footerY > 280 {
		footerY = 280
	}
	pdf.SetFont("Arial", "I", 8)
	pdf.SetXY(10, footerY)
	pdf.Cell(190, 4, fmt.Sprintf("Generated on %s | Side Sync Time Tracking", time.Now().Format("January 2, 2006 at 3:04 PM")))
}

func (g *Generator) GetFilename(projectName string) string {
	return fmt.Sprintf("%s-time-report-%s.pdf",
		strings.ReplaceAll(strings.ToLower(projectName), " ", "-"),
		time.Now().Format("2006-01-02"))
}
