# Payroll Salary System

A modern, responsive payroll management dashboard built with React, TypeScript, and Vite.

## Features

- Employee management and payroll overview
- Timesheet and attendance tracking
- Payroll processing and payslip generation
- Reporting and security settings
- Responsive layout with sidebar navigation

## Technologies

- React
- TypeScript
- Vite
- Tailwind CSS
- Express backend

## Getting Started

### Install dependencies

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Open the local development URL shown in the terminal to view the app.

### Build for production

```bash
npm run build
```

### Preview the production build

```bash
npm run preview
```

## Backend

This project now uses PostgreSQL as the backend database with Express in `backend/index.js`.

### Environment variables

Create a `.env` file in the repository root with:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/payroll_system
PORT=4000
```

If you do not have PostgreSQL installed, the backend will still start in fallback in-memory mode for local testing.

### Run the backend server

```bash
npm run backend
```

Be sure to start the backend before running the frontend.

If port `4000` is already in use, stop the other process or set `PORT` to another value in `.env`.

Alternatively, start the database, backend, and frontend together with Docker Compose:

```bash
docker compose up --build
```

> Note: Docker must be installed and available on your PATH to run this command.
> On Windows, install Docker Desktop and restart your terminal.

This starts:
- `db` on `localhost:5432`
- `backend` on `http://localhost:4000`
- `frontend` on `http://localhost:5173`

Open the frontend at `http://localhost:5173` after the services are ready.

Docker Compose includes health checks for Postgres and the backend, so the stack can report readiness more reliably.

The backend is available at `http://localhost:4000` and provides these endpoints:

- `GET /api/employees` — list all employees
- `GET /api/employees/:id` — fetch a single employee profile
- `POST /api/employees` — create a new employee
- `PUT /api/employees/:id` — update an employee profile
- `DELETE /api/employees/:id` — delete an employee
- `GET /api/payroll` — list all payroll records
- `POST /api/payroll-records` — create payroll records
- `PUT /api/payroll-records/:id` — update payroll record status
- `GET /api/leave-requests` — list leave requests
- `POST /api/leave-requests` — submit a new leave request
- `PUT /api/leave-requests/:id` — update leave request status
- `GET /api/attendance` — list attendance data
- `POST /api/attendance` — add an attendance record
- `GET /api/audit-logs` — list audit logs
- `POST /api/audit-logs` — create an audit entry
- `POST /api/payslips` — create a payslip payload

## Project Structure

- `src/` – application source files
- `src/components/` – UI and payroll components
- `src/contexts/` – React context providers
- `src/data/` – sample payroll data
- `src/hooks/` – custom hooks
- `src/lib/` – utility modules and third-party integrations
- `src/pages/` – page components and routes

## Notes

- Update the app metadata in `index.html` as needed.
- The frontend now uses the local backend instead of Supabase.

## Upcoming Enhancements

- Real Login System
- Employee Portal
- Clock In System

## License

This repository is provided as-is. Customize it for your own payroll application.
