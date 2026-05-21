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
- Supabase (prepared in `src/lib/supabase.ts`)

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

This project now includes a simple Express backend in `backend/index.js`.

### Run the backend server

```bash
npm run backend
```

The backend is available at `http://localhost:4000` and provides these endpoints:

- `GET /api/employees` — list of employees
- `GET /api/payroll` — payroll summary
- `POST /api/payslips` — create a new payslip

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
- If using Supabase, configure environment variables and the `src/lib/supabase.ts` client.

## License

This repository is provided as-is. Customize it for your own payroll application.
