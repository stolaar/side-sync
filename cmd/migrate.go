package main

import (
	"flag"
	"fmt"
	"log"

	"side-sync/pkg/db"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	var (
		migrationsPath = flag.String("path", "migrations/postgres", "Path to migrations directory")
		direction      = flag.String("direction", "up", "Migration direction: up, down")
		steps          = flag.Int("steps", 0, "Number of migration steps (0 = all)")
		version        = flag.Uint("version", 0, "Migrate to specific version")
	)
	flag.Parse()

	database, err := db.NewConnection()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.Close()

	driver, err := postgres.WithInstance(database.DB.DB, &postgres.Config{})
	if err != nil {
		log.Fatalf("Failed to create postgres driver: %v", err)
	}

	m, err := migrate.NewWithDatabaseInstance(
		fmt.Sprintf("file://%s", *migrationsPath),
		"postgres",
		driver,
	)
	if err != nil {
		log.Fatalf("Failed to create migrate instance: %v", err)
	}

	switch *direction {
	case "up":
		if *version > 0 {
			err = m.Migrate(*version)
		} else if *steps > 0 {
			err = m.Steps(*steps)
		} else {
			err = m.Up()
		}
	case "down":
		if *version > 0 {
			err = m.Migrate(*version)
		} else if *steps > 0 {
			err = m.Steps(-*steps)
		} else {
			err = m.Down()
		}
	default:
		log.Fatalf("Invalid direction: %s. Use 'up' or 'down'", *direction)
	}

	if err != nil && err != migrate.ErrNoChange {
		log.Fatalf("Migration failed: %v", err)
	}

	if err == migrate.ErrNoChange {
		fmt.Println("No migration changes to apply")
	} else {
		fmt.Printf("Migration %s completed successfully\n", *direction)
	}
}

