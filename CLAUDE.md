# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

iSchool is a comprehensive School Management System (SMS) with a Next.js frontend and Laravel backend. The system features a premium UI with a modern-institutional aesthetic using Tailwind CSS and Shadcn UI components.

## Technology Stack

### Frontend
- **Framework**: Next.js 14+ (App Router & Server Components)
- **Styling**: Tailwind CSS with Indigo & Slate color palette
- **UI Components**: Shadcn UI (Radix UI Primitives)
- **Icons**: Lucide React
- **State Management**: React hooks with mock data integration
- **HTTP Client**: Axios with interceptors for auth
- **PDF Generation**: jsPDF with jspdf-autotable
- **Charts**: Recharts
- **Real-time**: MSW (Mock Service Worker) for development

### Backend
- **Framework**: Laravel PHP
- **Database**: MySQL/SQLite
- **Authentication**: JWT tokens
- **API**: RESTful endpoints

## Development Commands

### Frontend
```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

### Backend (from backend directory)
```bash
# Start development server
php artisan serve

# Run migrations
php artisan migrate

# Generate application key
php artisan key:generate

# Install dependencies
composer install

# Run tests
php artisan test
```

## Architecture

### Frontend Structure
- **src/app/**: Next.js App Router pages with dashboard sections
- **src/components/**: Reusable UI components organized by feature
  - `ui/`: Base Shadcn UI components
  - `layout/`: Layout components (sidebar, header, navigation)
  - `dashboard/`: Dashboard-specific components
  - `cards/`: Card components for data display
  - `charts/`: Chart components using Recharts
- **src/lib/**: Core utilities and configurations
  - `api.ts`: Axios instance with auth interceptors
  - `mock-data.ts`: Mock data for development
  - `utils.ts`: Utility functions
- **src/hooks/**: Custom React hooks
- **src/mocks/**: MSW mock handlers for API mocking

### Key Features

#### Dashboard Organization
The application is organized into main dashboard sections:
- Academics (classes, subjects, timetables, exams)
- Attendance (student/staff attendance, leave management)
- Finance (fees collection, expenses, reporting)
- HR (staff directory, payroll, leaves)
- Library (books, members, circulation)
- System Settings (configuration, branches, notifications)
- Reports (comprehensive reporting across all modules)

#### Authentication
- JWT-based authentication
- Token stored in localStorage
- Automatic redirect on 401 errors
- Protected routes with auth checks

#### Data Flow
1. Frontend uses API client (axios) for backend communication
2. MSW provides mock responses in development
3. State management through React hooks
4. Real-time updates through periodic data fetching

## Important Patterns

### Component Organization
- Use atomic design principles
- Components in `src/components/ui` are base components
- Feature-specific components in respective directories
- Reuse components from `src/components/layout` for consistency

### Styling Conventions
- Use Tailwind CSS classes
- Color palette: Indigo primary, Slate neutral
- Glassmorphic effects for overlays
- Smooth transitions (hover:scale-105)

### API Integration
- All API calls go through the configured axios instance
- Automatic token attachment and error handling
- Base URL: `http://127.0.0.1:8000/api/v1` (configurable via env)

### Mock Data Development
- Use `src/lib/mock-data.ts` for development
- MSW handlers in `src/mocks` for API mocking
- Real API integration requires backend Laravel server

### File Organization
- Dashboard pages follow URL patterns
- Components are modular and reusable
- Utility functions centralized in `src/lib/utils.ts`
- Type definitions follow TypeScript conventions

## Environment Setup

### Frontend
```bash
# Install dependencies
npm install

# Create .env.local with:
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1
```

### Backend
```bash
# Copy environment file
cp backend/.env.example backend/.env

# Install dependencies
composer install

# Run migrations
php artisan migrate

# Generate application key
php artisan key:generate
```

## Testing

### Frontend
- ESLint for code quality
- TypeScript for type safety
- MSW for API mocking during development

### Backend
- PHPUnit for testing
- Laravel testing helpers
- Database migrations for schema management

## Design System

The project uses a custom design system with:
- Indigo primary color (#6366f1)
- Slate neutral colors
- Glassmorphic overlays
- Smooth animations and transitions
- Professional institutional aesthetic

Components are built on top of Radix UI primitives for accessibility and consistency.

## Agent Skills & Modes

- **Caveman Mode**: You can invoke caveman mode (e.g. "caveman mode ultra") to force ultra-compressed, terse communication. This saves token usage while maintaining technical accuracy. Rules are defined in `.agents/skills/caveman/SKILL.md`.