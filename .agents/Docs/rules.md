# School ERP: Coding Standards & Rules

These are the strict, non-negotiable coding standards for the School ERP development process. All code must adhere to these rules to ensure scalability, maintainability, and consistency.

## 1. Paradigm & Architecture
*   **100% Functional Programming:** Do NOT use Object-Oriented Programming (OOP) paradigms. No `class` definitions or the `this` keyword.
*   **Pure Functions:** Logic must be deterministic, pure, and easy to test without side effects.
*   **Strict Modularity:** Code must be highly modular and reusable. Single Responsibility Principle (SRP) applies strictly—every function does exactly one thing.

## 2. Configuration & Constants
*   **Centralized Constants:** Never hardcode strings, Magic Numbers, or configuration parameters in UI components or business logic.
*   **Dedicated Config Files:** Use dedicated files (`constants/`, `config/`) for all system-wide mappings, statuses, themes, route paths, and feature flags.

## 3. Typing & Data Consistency
*   **Extreme Type Safety:** Strict TypeScript everywhere. Use explicit return types and parameter definitions. No `any` or loose typing.
*   **Single Source of Truth:** Centralize completely. Shared data models (e.g., via Zod) must drive both the UI validation and database types to ensure consistency across the entire stack.

## 4. Performance & UX Optimizations
*   **Optimistic UI Updates:** Utilize Tanstack Query's optimistic updates heavily. The UI should respond instantly by predicting the database result while the mutation occurs in the background.
*   **Lean Dependencies:** Keep the bundle size small. Only import what is necessary. Rely on native browser APIs where possible.

## 5. Readability & Simplicity
*   **Simple is Better than Clever:** Write code that is trivial for a junior developer to understand. Avoid convoluted one-liners in favor of clear, spaced-out logic.
*   **Predictable Naming:** Variables, files, and functions must express exactly what they do (e.g., `calculateStudentGrade`, `FEE_STATUS_OVERDUE`). Domain-driven terminology is mandatory.

## 6. Structure
*   **Separation of Concerns:** Strictly separate UI (React/shadcn), State (Tanstack Query), Business Logic (Hooks/Utils), and Infrastructure/DB (Supabase calls).
*   **Colocation:** Keep related feature files together (e.g., `features/students/hooks`, `features/students/components`, `features/students/api`).
