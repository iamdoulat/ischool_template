# 🎓 iSchool — Comprehensive School Management System (SMS)

> **Empowering Education through Intelligent Automation, Modern UX, and Seamless Institutional Workflow.**
>
> **iSchool** is a full-featured, enterprise-grade School Management System built with **Next.js 16**, **TypeScript**, **Tailwind CSS v4**, **Shadcn UI**, and **Laravel 12 REST API**. It equips educational institutions with end-to-end administration tools, student information systems, academic management, automated attendance, finance collection, exam suites, and AI-powered smart terminals.

---

## 📑 Table of Contents

- [✨ Key System Features](#-key-system-features)
- [🛠 Tech Stack & Architecture](#-tech-stack--architecture)
- [🏁 Step-by-Step System Workflow & Functionality](#-step-by-step-system-workflow--functionality)
  - [1. Authentication & Role-Based Access Control](#1-authentication--role-based-access-control)
  - [2. System Settings & Custom Branding](#2-system-settings--custom-branding)
  - [3. Student Information & Admission Engine](#3-student-information--admission-engine)
  - [4. Academics & Class Timetables](#4-academics--class-timetables)
  - [5. Examination & Result Evaluation Suite](#5-examination--result-evaluation-suite)
  - [6. Fees Collection & Financial Management](#6-fees-collection--financial-management)
  - [7. Human Resource (HR) & Staff Payroll](#7-human-resource-hr--staff-payroll)
  - [8. Multi-Mode & AI Smart Attendance](#8-multi-mode--ai-smart-attendance)
  - [9. Online Course & Live Virtual Classes](#9-online-course--live-virtual-classes)
  - [10. Communicate & Multi-Channel Notifications](#10-communicate--multi-channel-notifications)
  - [11. Front Office & Public CMS Engine](#11-front-office--public-cms-engine)
  - [12. Facilities: Library, Transport, Hostel & Inventory](#12-facilities-library-transport-hostel--inventory)
  - [13. Student CV & Behaviour Management](#13-student-cv--behaviour-management)
  - [14. Comprehensive Reporting & Data Export](#14-comprehensive-reporting--data-export)
- [🚀 Quick Start & Installation Guide](#-quick-start--installation-guide)
- [💻 Scripts & Commands](#-scripts--commands)
- [🎨 Design System & Theme Customization](#-design-system--theme-customization)
- [📄 License & Credits](#-license--credits)

---

## ✨ Key System Features

* **Responsive 2-Column Responsive Layout**: Modern split-view desktop login and dynamic dashboard views.
* **37+ Specialized Dashboard Modules**: Comprehensive administrative coverage spanning every department of a modern educational institution.
* **Smart AI & Biometric Attendance**: Support for Day-wise, Period-wise, QR-Code Scanner, and `face-api.js` Face Recognition terminals.
* **Dual Examination Suite**: End-to-end support for traditional exams, CBSE report card templates, and Online Examinations with Question Banks.
* **Integrated Online Learning**: Dedicated modules for course creation, video enrollment, Google Meet, and Zoom Live Classes.
* **Granular Branding & Theme Customization**: Custom school logo, print logo, app logo, background images, HSL primary colors, light/dark modes, and skin variants (`shadow` / `bordered`).
* **Multi-Format Data Export**: Standardized single-click Export toolbars for **Excel (.xlsx)**, **PDF (.pdf)**, **CSV (.csv)**, and **Direct Printing** across all tables.

---

## 🛠 Tech Stack & Architecture

### **Frontend Framework**
- **Next.js 16** (App Router & Server External Packages)
- **React 19** (Hooks, Context Providers, Component Architecture)
- **TypeScript 5** (Strict Type Safety & Interface Definitions)

### **Styling & UI Components**
- **Tailwind CSS v4** (`@import "tailwindcss"` with custom PostCSS setup)
- **Shadcn UI** (Radix UI Accessible Primitives)
- **Lucide React** (Modern SVG Vector Iconography)
- **Framer Motion** (Smooth Micro-Animations & Page Transitions)

### **Backend Integration & APIs**
- **Laravel 12 API** (Sanctum Token Authentication via HTTP Bearer Header)
- **Axios Interceptor** (Centralized API handling with automatic 401 redirect)
- **MSW (Mock Service Worker)** (Seamless fallback for auth & system settings in development)

### **Key Utility Libraries**
- **Spreadsheets & PDF**: `xlsx`, `papaparse`, `jspdf`, `jspdf-autotable`
- **Charts & Data Visualization**: `recharts`
- **AI & Scanning**: `face-api.js`, `jsqr`, `qrcode`, `html2canvas`
- **Drag and Drop**: `@hello-pangea/dnd`
- **Rich Text & Pickers**: `react-quill-new`, `react-day-picker`

---

## 🏁 Step-by-Step System Workflow & Functionality

```mermaid
flowchart LR
    A[1. Auth & Login] --> B[2. General & System Settings]
    B --> C[3. Student Admission & HR Setup]
    C --> D[4. Academics & Timetables]
    D --> E[5. Attendance & Daily Tracking]
    E --> F[6. Exams, Fees & Online Classes]
    F --> G[7. Analytics & Export Reports]
```

### 1. Authentication & Role-Based Access Control
1. **Multi-Role Login**: Switch between **Admin Login** and **Student/Parent** login panels.
2. **Quick Demo Shortcuts**: Instant credential fill for **Super Admin**, **Admin**, **Teacher**, **Accountant**, **Receptionist**, **Librarian**, **Student**, and **Parent**.
3. **Captcha Security**: Dynamic mathematical captcha verification for enhanced brute-force protection.
4. **Session Persistence**: Automatic Sanctum Bearer token storage in `localStorage` with auto-route redirection by role (`/dashboard` vs `/user/dashboard`).

### 2. System Settings & Custom Branding
1. **General Setting**: Configure school name, slogan, description, address, contact info, session start month, timezone, and date/time formats.
2. **Logo Management**: Upload and manage high-res **Print Logo** (for invoice receipts), **Admin Logo**, **Admin Small Logo**, and **App Logo**.
3. **Backend Theme & Skins**: Switch theme modes (Light/Dark), Primary Accent Colors (Indigo, Blue, Amber, Emerald, Red), Sidebar States (Expanded/Collapsed), and Container Skins (`shadow`/`bordered`).
4. **Notification Settings**: Configure Email, SMS, and WhatsApp Gateway API credentials and automated event triggers.

### 3. Student Information & Admission Engine
1. **Student Admission**: Multi-step student registration with auto-generated Admission Numbers, document uploads, guardian details, and fee structure assignment.
2. **Student Directory**: Searchable, filterable directory with class, section, and keyword filters.
3. **Student History & Details**: Deep-dive profile pages with academic history, attendance record, discipline log, timeline, and fee status.
4. **Categorization & Houses**: Organize students by Student Houses (e.g., Red, Blue, Green), Categories (General, OBC, SC/ST), and Disable Reasons.

### 4. Academics & Class Timetables
1. **Class & Section Management**: Define academic classes (e.g., Class 1 to Class 12) and section splits (A, B, C).
2. **Subject Allocation**: Assign Theory/Practical subjects and assign designated subject teachers per section.
3. **Timetable Builder**: Construct drag-and-drop weekly class schedules and individual teacher timetables.
4. **Assign Class Teachers**: Delegate supervisory class teachers to sections.

### 5. Examination & Result Evaluation Suite
1. **Exam Groups & Schedules**: Group exams by term (e.g., Mid-Term, Annual) and set start/end times, room allocations, and passing marks.
2. **Marks Entry**: Batch mark entry for teachers per subject with auto-grade calculation.
3. **CBSE Examination Suite**: Dedicated CBSE term assessment, co-scholastic observations, and automated CBSE-compliant report card generator.
4. **Online Examinations**: Create timed online exams, build reusable Question Banks, and publish auto-graded results to student portals.
5. **Admit Cards & Marksheet Templates**: Customize admit cards and marksheet header/footer layouts with print preview support.

### 6. Fees Collection & Financial Management
1. **Collect Fees**: Search student accounts, view pending dues, apply discounts, and collect payments (Cash, Cheque, Bank Transfer, Online Gateway).
2. **Fees Setup**: Create Fee Groups, Fee Masters, Fee Types, and Fee Discounts (e.g., Merit Scholarship, Sibling Discount).
3. **Thermal Receipt Printing**: Generate single-page compact thermal receipts for Office Copy, Student Copy, and Bank Copy.
4. **Income & Expense Tracking**: Categorize institutional incomes/expenses with invoice auto-generation and financial ledger logs.

### 7. Human Resource (HR) & Staff Payroll
1. **Staff Directory**: Centralized repository for teaching and non-teaching staff with role assignment.
2. **Staff Attendance**: Daily staff attendance logging with present, late, half-day, and absent classifications.
3. **Payroll Processing**: Automated monthly salary computation based on base pay, earnings, deductions, and tax rules.
4. **Leave Management**: Staff leave applications, approval workflows, leave type configuration, and dynamic leave calendar widgets.

### 8. Multi-Mode & AI Smart Attendance
1. **Day-wise & Period-wise Attendance**: Mark class attendance daily or period-by-period with bulk toggle buttons.
2. **QR-Code Scanner Terminal**: Built-in webcam scanner for instant student/staff ID badge scanning (`jsqr`).
3. **Smart Face Recognition**: Real-time AI face recognition terminal powered by `face-api.js` for hands-free biometric attendance marking.

### 9. Online Course & Live Virtual Classes
1. **Online Course Platform**: Teachers create video courses, upload lesson chapters, and assign quizzes.
2. **Gmeet & Zoom Live Classes**: Schedule virtual live classes, generate instant join links, and track student live attendance duration.

### 10. Communicate & Multi-Channel Notifications
1. **Notice Board**: Post school-wide notices, target specific roles (Teachers, Students, Parents), and pin urgent announcements.
2. **Send Credentials**: One-click bulk login credential dispatcher via Email, SMS, or WhatsApp.
3. **Message Templates**: Customizable templates for fees reminders, exam schedules, and holiday announcements.

### 11. Front Office & Public CMS Engine
1. **Front Office**: Manage visitor logs, phone call logs, postal dispatches/receives, and admission enquiries with status tracking.
2. **Front CMS Website**: Manage the public institution website, landing page sliders, event galleries, news articles, and custom pages.

### 12. Facilities: Library, Transport, Hostel & Inventory
1. **Library Management**: Catalog books, track ISBNs, issue books to students/staff, and calculate overdue fines.
2. **Transport**: Manage vehicle fleets, driver profiles, route stops, and assign transport fees per route.
3. **Hostel**: Configure hostels, room types, bed capacities, and allocate rooms to resident students.
4. **Inventory**: Stock management, item store allocation, supplier tracking, and item issuance.

### 13. Student CV & Behaviour Management
1. **Student CV Generator**: Auto-generate professional student resumes/CVs highlighting academic records and extracurricular achievements.
2. **Behaviour Records**: Log student merit points and disciplinary incidents with review workflows.

### 14. Comprehensive Reporting & Data Export
1. **Departmental Reports**: 30+ built-in reports covering Finance, Attendance, Audit Trail, Homework, Library, Transport, and User Logs.
2. **Universal Export Toolbar**: Every table includes instant **Copy**, **Excel (.xlsx)**, **PDF (.pdf)**, and **Print** buttons.

---

## 🚀 Quick Start & Installation Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Package Manager**: `npm` (configured with `legacy-peer-deps=true` in `.npmrc`)
- **Backend Service**: PHP 8.2+ with Laravel 12 & MySQL database

### 1. Clone Repository
```bash
git clone https://github.com/iamdoulat/ischool_template.git
cd ischool_template
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000`.

---

## 💻 Scripts & Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Next.js development server using Webpack compiler (`next dev --webpack`) |
| `npm run build` | Builds optimized production bundle (`next build`) |
| `npm run start` | Launches Next.js production server (`next start`) |
| `npm run lint` | Runs ESLint for code quality and style validation |

---

## 🎨 Design System & Theme Customization

iSchool uses **Tailwind CSS v4** and CSS variable design tokens defined in `src/app/globals.css`.

- **Primary Accent**: Indigo `#6366F1`
- **Secondary Gradient Buttons**: `bg-gradient-to-r from-[#FF9800] to-[#6366F1]` (Orange to Indigo)
- **Dark Mode**: Fully supported dark background palette (`bg-slate-900` / `bg-slate-800`) with backdrop blur glassmorphism (`backdrop-blur-xl`).
- **Typography**: Clean, accessible sans-serif font stack.

---

## 📄 License & Credits

Distributed under the **MIT License**.

Designed and developed with ❤️ for modern educational institutions.
