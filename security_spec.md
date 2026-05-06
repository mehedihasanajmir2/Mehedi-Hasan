# Security Spec for MH.Studio Portfolio

## 1. Data Invariants
- `settings/global`: Only one document exists. It contains site-wide config like name, bio, and hero image.
- `projects`: Each project must have a title, type (web/app/other), and image URL.
- `experience`: Each experience entry must have a period and role.
- All writes are restricted to the authorized admin (`mehedihasanajmir2@gmail.com`).

## 2. The "Dirty Dozen" Payloads (Deny cases)
1. **Unauthenticated Write**: Attempting to update `settings/global` without logging in.
2. **Identity Spoofing**: Logged-in user with different email trying to update projects.
3. **Ghost Field in Settings**: Adding `isAdmin: true` to the settings document.
4. **Invalid Project Type**: Setting project type to `secret_project`.
5. **Huge ID Mutation**: Attempting to create a project with a 2KB document ID.
6. **Bypassing Validation**: Creating a project without a title.
7. **Invalid Array Type**: Putting an object inside the `tech` array of a project.
8. **Malicious Link**: Injecting a `javascript:` payload into a project link.
9. **Tampering with Timestamps**: Setting `updatedAt` to a future time.
10. **State Shortcut**: (N/A for this simple CRUD app, but maybe for 'order' field).
11. **PII Leak**: Unauthorized user trying to read private admin metadata (if any).
12. **Denial of Wallet**: Sending 1MB of text in the `bio` field.

## 3. Test Runner (Conceptual)
All tests check for `PERMISSION_DENIED` on any write if `request.auth.token.email != 'mehedihasanajmir2@gmail.com'`.
Read access is allowed for everyone (public portfolio).
