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

### Phase 1: Foundation & Security (The Engine)
*   **Goal:** Set up the database, authentication, and the core Next.js application shell.
*   **Flows:**
    1.  User registers/logs in -> Supabase Auth issues JWT.
    2.  JWT is verified by Supabase Database (RLS checks the User Role: Admin, Teacher, Parent).
*   **Deliverables:**
    *   Database Schema applied with Foreign Keys.
    *   RLS Policies active.
    *   Next.js project configured with Tailwind + shadcn.
    *   Auth Context and Login Screen built.

### Phase 2: Core Entities (The People)
*   **Goal:** Build the CRUD (Create, Read, Update, Delete) interfaces for the people in the school.
*   **Dependency:** Requires the `users` and `classes` tables from Phase 1.
*   **Flows:**
    1.  Admin adds a Student -> Saved to `students` table.
    2.  Admin uploads Student B-Form -> Saved to Supabase Buckets -> URL saved to `students` table.
    3.  Admin adds a Teacher -> Saved to `users` and linked to `teacher_profiles`.
*   **Deliverables:**
    *   Student Profiles & Document Vault UI.
    *   Teacher Profiles UI.
    *   Class/Section management UI.

### Phase 3: Daily Academic Operations (The Process)
*   **Goal:** Implement features teachers use every day.
*   **Dependency:** Requires Students and Teachers from Phase 2.
*   **Flows:**
    1.  Teacher selects Class -> Marks Attendance -> Saved to `attendance` table.
    2.  *Rule:* If marked ABSENT -> Trigger automated SMS to Parent.
    3.  Admin creates Exam -> Teacher enters Marks -> Saved to `exam_marks` table.
    4.  System reads Marks -> Generates Report Card PDF.
*   **Deliverables:**
    *   Daily Attendance Module & SMS Hook.
    *   Exam Creation Module.
    *   Mark Sheet Data Entry Grid.
    *   Automated Report Card Generator.

### Phase 4: Financial Engine (The Revenue)
*   **Goal:** Automate fee generation and track defaults.
*   **Dependency:** Requires Students and Classes from Phase 2.
*   **Flows:**
    1.  Admin sets Fee Structure for Class 10.
    2.  *Cron Job (1st of month):* System reads all Students in Class 10 -> Generates Challans in `fee_challans` table.
    3.  Parent views/pays Challan -> Status updates to PAID.
    4.  Admin views dashboard -> Sees OVERDUE list filtered from `fee_challans`.
*   **Deliverables:**
    *   Fee Structure Configurator.
    *   Monthly Auto-Challan Engine.
    *   Defaulter Tracking UI.
    *   Staff Payroll & Salary UI.

### Phase 5: The Command Center (The Polish)
*   **Goal:** Bring everything together into high-level dashboards and make the app installable.
*   **Dependency:** Requires data flowing from Phases 3 and 4.
*   **Flows:**
    1.  Principal logs in -> Sees aggregate total revenue, absent count, and expenses.
    2.  Parent accesses URL on mobile -> Prompts "Add to Home Screen" (PWA).
*   **Deliverables:**
    *   Admin Analytics Dashboard.
    *   Teacher "My Class" Dashboard.
    *   PWA Manifest and Service Worker implementation.
