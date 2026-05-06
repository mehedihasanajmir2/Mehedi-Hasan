# Security Specification - MH Studio

## Data Invariants
1.  **Global Settings**: Only one document at `settings/global`.
2.  **Projects**: Each project must have a title, description, tech stack, and image.
3.  **Experience**: Each experience entry must have a company, role, period, and description.
4.  **Admin Access**: Only authorized emails can write to the database.

## Identity & Access Control
-   **Read**: Public access to all core collections (`settings`, `projects`, `experience`).
-   **Write**: Restricted to administrative users (verified email `mehedihasanajmir2@gmail.com`).

## The "Dirty Dozen" Payloads (Denial Expected)
1.  **Anonymous Write to Settings**: Attempting to update `settings/global` without being signed in.
2.  **Non-Admin Update to Projects**: Authenticated but non-admin user attempting to edit a project.
3.  **Invalid Project Schema**: Creating a project missing the `tech` array.
4.  **Malicious ID Injected**: Using a huge string (1KB+) as a project ID.
5.  **Extra Fields (Shadow Update)**: Adding a `isVerified: true` field to a project document.
6.  **Type Mismatch**: Sending a string for a number field (e.g., `order` as "first").
7.  **Email Spoofing**: Attempting to write as an admin but with an unverified email.
8.  **Empty ID**: Attempting to write to a project with an empty string ID.
9.  **Scale Attack**: Sending a project with 100+ tech tags.
10. **Terminal State Lock Bypass**: (If applicable, not in this app yet).
11. **PII Leak**: (No PII in public collections, only email in settings which is public).
12. **Recursive Cost Attack**: Attempting to list collections with heavy filter logic.

## Conflict Report
| Collection | Identity Spoofing | State Shortcutting | Resource Poisoning |
| :--- | :--- | :--- | :--- |
| `settings` | Protected (isAdmin) | N/A | Protected (isValidSettings) |
| `projects` | Protected (isAdmin) | N/A | Protected (isValidProject) |
| `experience`| Protected (isAdmin) | N/A | Protected (isValidExperience) |
