# BrandGuard AI — API Specification

**Base path:** `/api/v1`  
**Transport:** JSON, except multipart file uploads.  
**Authentication:** bearer access token.  
**Tenant context:** derived server-side from authenticated identity.

## 1. Authentication
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/register` | Bootstrap organisation/admin or create invited user |
| POST | `/auth/login` | Authenticate and issue token |
| GET | `/auth/me` | Current user and role |

## 2. Sources
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/sources` | Upload source file and metadata |
| GET | `/sources` | List tenant sources |
| GET | `/sources/{source_id}` | Source details and versions |
| POST | `/sources/{source_id}/versions` | Upload new version |
| POST | `/sources/{source_id}/versions/{version_id}/approve` | Approve source version |
| POST | `/sources/{source_id}/versions/{version_id}/supersede` | Supersede source version |

## 3. Assets
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/assets` | Create asset from text or upload |
| GET | `/assets` | List tenant assets |
| GET | `/assets/{asset_id}` | Asset details and versions |
| GET | `/assets/{asset_id}/versions/{version_id}` | Read exact version |
| POST | `/assets/{asset_id}/versions` | Create a new revision |

## 4. Audit
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/assets/{asset_id}/versions/{version_id}/audit` | Run audit |
| GET | `/assets/{asset_id}/versions/{version_id}/findings` | List validated findings |
| POST | `/findings/{finding_id}/suggestion/accept` | Apply suggestion as a new revision |
| POST | `/findings/{finding_id}/dismiss` | Dismiss with reason |

## 5. Review
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/assets/{asset_id}/versions/{version_id}/submit-review` | Submit exact version |
| GET | `/reviews/queue` | Reviewer queue |
| POST | `/assets/{asset_id}/versions/{version_id}/comments` | Add comment |
| POST | `/assets/{asset_id}/versions/{version_id}/decision` | Approve, request changes or reject |
| GET | `/assets/{asset_id}/versions/{version_id}/history` | Revision and review history |

## 6. Governance
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/dashboard/summary` | Tenant dashboard metrics |
| GET | `/assets/review-required` | Assets requiring re-review |
| POST | `/approvals/{approval_id}/verify` | Verify approval integrity |

## 7. Response envelope
```json
{
  "data": {},
  "error": null,
  "request_id": "uuid"
}
```
Error responses include a stable error code and concise user-safe message.

## 8. Status codes
`200` success; `201` created; `400` invalid request; `401` unauthenticated; `403` unauthorised; `404` not found within tenant scope; `409` state/version conflict; `413` file too large; `422` validation/parsing error; `429` rate limit; `500` unexpected error.

## 9. API rules
- Validate inputs with typed schemas.
- Enforce tenant and role permissions in backend dependencies/services.
- Never expose private storage keys or secrets.
- Use transactions for version and approval transitions.
- For source-version actions, verify that `version_id` belongs to the path `source_id` and authenticated organisation.
- Make source-update processing idempotent.
- Never return `COMPLIANT` after a partial or failed audit.
- Include request IDs and safe structured logs.
