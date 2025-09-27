# Side Sync - Time Tracking App

A full-stack time tracking and reporting application built with Go, PostgreSQL, React, and TailwindCSS.

## Project Structure

```
side-sync/
├── cmd/                    # Go application entry points
│   └── server/            # API server entry point
├── pkg/                   # Go backend packages
│   ├── api/              # HTTP handlers and routes
│   ├── db/               # Database connection and queries
│   └── models/           # Domain models and structs
├── src/                  # React frontend application
│   ├── components/       # React components (named exports)
│   ├── pages/           # Application pages
│   ├── hooks/           # Custom React hooks
│   ├── utils/           # Utility functions
│   └── types.ts         # TypeScript type definitions
├── migrations/          # Database migration files
├── docker-compose.yml   # Docker services configuration
├── Dockerfile          # Backend container definition
├── go.mod             # Go module dependencies
├── package.json       # Frontend package configuration
├── .prettierrc        # Prettier configuration
└── eslint.config.js   # ESLint configuration
```

## Quick Start

### Prerequisites
- Go 1.21+
- Node.js 18+
- Docker and Docker Compose
- Yarn package manager

### Development Setup

1. **Start the database:**
   ```bash
   docker-compose up postgres -d
   ```

2. **Install frontend dependencies:**
   ```bash
   yarn install
   ```

3. **Run the backend:**
   ```bash
   yarn dev:backend
   # or directly: go run cmd/server/main.go
   ```

4. **Run the frontend:**
   ```bash
   yarn dev
   # or: yarn dev:frontend
   ```

### Full Stack with Docker

```bash
# Start all services (backend + database)
yarn docker:up

# In another terminal, start frontend
yarn dev:frontend
```

### Code Quality

```bash
# Run linter
yarn lint

# Type checking
yarn typecheck

# Build for production
yarn build
```

## API Endpoints

- `GET /healthz` - Health check endpoint
- `GET /api/users` - Get all users
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create a new project
- `PUT /api/projects/single?id={id}` - Update a project
- `DELETE /api/projects/single?id={id}` - Delete a project
- `GET /api/time-entries` - Get all time entries
- `POST /api/time-entries` - Create a new time entry
- `PUT /api/time-entries/single?id={id}` - Update a time entry
- `DELETE /api/time-entries/single?id={id}` - Delete a time entry
- `POST /api/time-entries/import` - Import time entries from CSV
- `GET /api/settings` - Get application settings
- `PUT /api/settings` - Update application settings

## Environment Variables

Create a `.env` file in the root directory:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=timetracker
DB_PASSWORD=password
DB_NAME=timetracker_db
DB_SSL_MODE=disable
SERVER_PORT=8080
```

## Features

- **Project Management:** Create, edit, and manage projects with hourly rates
- **Time Tracking:** Add, edit, and delete time entries with start/end times
- **CSV Import/Export:** Import time entries from CSV files and export reports
- **Billable Tracking:** Mark time entries as billable or non-billable
- **Currency Support:** Multi-currency support with configurable rates
- **Responsive Design:** Modern UI built with TailwindCSS
- **Form Validation:** Client-side validation using Zod schemas
- **Type Safety:** Full TypeScript support throughout the application

## Tech Stack

- **Backend:** Go (net/http), sqlx, PostgreSQL
- **Frontend:** React 19, TypeScript, Vite, TailwindCSS
- **State Management:** TanStack Query (React Query)
- **Form Handling:** React Hook Form with Zod validation
- **Routing:** React Router DOM
- **Code Quality:** ESLint, Prettier, TypeScript
- **Infrastructure:** Docker, Docker Compose