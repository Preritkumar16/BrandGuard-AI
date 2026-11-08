# BrandGuard AI — Product and UX Design

## 1. Design principles
- Evidence before verdict.
- Human decision-making remains authoritative.
- Preserve creator intent with targeted suggestions.
- Show uncertainty clearly.
- Make source, asset and approval versions traceable.
- Prioritise high-severity findings and the next useful action.

## 2. Information architecture
1. Sign in
2. Organisation workspace
3. Overview dashboard
4. Brand Knowledge Hub
5. Content submissions
6. Audit results
7. Review queue
8. Asset/version history
9. Users and roles (admin only)
10. Settings and processing mode (if implemented)

## 3. Primary screens
### Dashboard
Show drafts, in-review, approved, rejected and review-required counts; recent submissions; and common finding categories. Clearly label seeded demo data.

### Knowledge Hub
Show source name, type, owner, version, status and effective date. Allow authorised users to upload, inspect extracted text, approve or supersede a source and view version history.

### New submission
Capture title, content type, brand profile and text/file input. Explain supported formats and limits. Show parsing/audit progress. If extraction fails, do not run an empty audit.

### Audit results
Show overall review state and issue counts. Group findings by severity/category. Highlight the exact text span and display explanation, evidence passage, source/version, suggested action and validation state.

### Revision editor
Show original and revised content side by side. Accepting a suggestion creates a new revision; original content remains recoverable.

### Review queue
Show assigned reviewer, submission date, exact asset version and issue summary. Reviewer can comment, request changes, approve or reject. Creator self-approval is blocked.

### Version history
Show versions, author, timestamp, hash, findings, review events, approvals and source dependencies.

## 4. Interaction rules
- Never communicate status through colour alone.
- Provide keyboard navigation, visible focus and labelled controls.
- Provide loading, empty, success and failure states.
- Confirm irreversible source actions.
- Display AI text as a suggestion, not a verified fact.
- Explain uncertain and unavailable results.

## 5. Visual direction
Use a clean enterprise workspace with restrained navy/blue tones, high contrast, compact tables, readable typography and clear status labels. The primary experience is a structured audit and approval workspace, not a chat-only interface.

## 6. Build order
Login → Dashboard shell → Knowledge Hub → Submit content → Audit results → Revision editor → Review queue → Version history.
