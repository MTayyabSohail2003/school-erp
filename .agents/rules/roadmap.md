---
trigger: always_on
---

# School ERP: Project Roadmap & Architecture Flows

This document serves as our definitive guide and master roadmap for the entire School Management System. It outlines how data flows through the system and the strict order in which we will build each module. 

We must not skip phases. Each phase relies on the data foundation of the previous one.

## Core System Architecture
*   **Frontend:** Next.js (App Router), React 19, Tailwind CSS v4, shadcn/ui.
*   **State & Data Fetching:** Tanstack Query (Optimistic Updates).
*   **Backend & Database:** Supabase (PostgreSQL).
*   **Security:** Supabase Auth + Row Level Security (RLS).
*   **File Storage:** Supabase Buckets (B-Forms, Certificates).

---

## The Master Roadmap (Development Phases)

### Phase 1: Database Architecture & Core Relationships
*   **Goal:** Before UI, the "Relational Intelligence" must be built in Supabase.
*   **Key Items:**
    *   **Multi-Role Schema:** Design tables for profiles (Admin, Teacher, Parent) with strict Row Level Security (RLS).
    *   **Academic Structure:** Setup `classes`, `sections`, and `subjects` tables as the base.
    *   **Student-Parent Link:** Create a 1:M (one-to-many) relationship allowing one parent to manage multiple children.
    *   **Missing Entity - Concessions:** Add a `fee_concessions` table to store discounts (e.g., Kinship, Merit) per student.

### Phase 2: Admin Control & Digital Vault
*   **Goal:** Establishing the management's power and cloud storage.
*   **Key Items:**
    *   **Smart Registration:** Build the multi-step student registration form with Zod validation.
    *   **Digital Vault (Supabase Storage):** Implement secure document uploading for B-Forms and ID cards.
    *   **Staff Directory:** Create teacher accounts and link them to specific classes/subjects.
    *   **Missing Flow - Staff Payroll:** Setup the ledger to track teacher salaries and monthly payouts.

### Phase 3: Academic Operations & Real-time Attendance
*   **Goal:** Daily classroom activities and instant communication.
*   **Key Items:**
    *   **Teacher Dashboard:** Create a focused view for teachers to see only their assigned classes.
    *   **Smart Attendance:** Mobile-friendly attendance marking for teachers.
    *   **Missing Syncing - SMS/Notice:** Integration of a trigger where marking a student 'Absent' sends an automated SMS to the Parent portal.
    *   **Academic Blocks:** Set up `exam_terms` (Mid, Final) and `mark_sheets` for score entry.

### Phase 4: Advanced Financial Engine (Automated Finance)
*   **Goal:** This is where the software becomes a "Management Tool."
*   **Key Items:**
    *   **Fee Rule Engine:** Define tuition, lab, and transport fees for each class.
    *   **Missing Logic - Arrears & Fines:** Implement logic to carry forward "Unpaid Balances" from the previous month to the next challan.
    *   **Bulk Auto-Challan:** A single-click system to generate electronic fee slips for the entire school.
    *   **Defaulter Tracking:** A real-time list of unpaid challans after the "Due Date".

### Phase 5: Results & Communication Portal
*   **Goal:** Finalizing data and delivering it to parents.
*   **Key Items:**
    *   **Automated Report Cards:** Logic to calculate grades (A, B, C) and percentages from entered marks.
    *   **Parent Portal:** A restricted view for parents to see attendance calendars and download PDF report cards.
    *   **Missing Flow - Leave Requests:** Implement a feature where parents submit leaves, and upon Admin/Teacher approval, the attendance updates to 'L' automatically.
    *   **PDF Generation:** Server-side generation of Fee Challans and Report Cards for printing.

### Phase 6: Maintenance & PWA Transformation
*   **Goal:** Software lifecycle and installability.
*   **Key Items:**
    *   **Missing Flow - Batch Promotion:** A year-end utility to promote all students from one class to the next in one click.
    *   **PWA Setup:** Configuring `manifest.json` and service workers for desktop and mobile installation.
    *   **Global Notice Board:** A "Broadcast" system using Supabase Realtime to push announcements to all active users.
