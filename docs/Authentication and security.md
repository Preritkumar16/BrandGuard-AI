# BrandGuard AI — Authentication and Security

## 1. Authentication
- Use Argon2id or bcrypt for password hashing.
- Never store plaintext passwords.
- Use short-lived access tokens; if refresh tokens exist, rotate and revoke them safely.
- Enforce authentication on protected backend routes.
- Hiding frontend links is not authorisation.

## 2. Role-based access
| Action | Admin | Source Owner | Creator | Reviewer |
|---|---:|---:|---:|---:|
| Manage users/roles | Yes | No | No | No |
| Manage brand sources | Yes | Yes | No | No |
| Submit content | Yes | Yes | Yes | Yes, if allowed |
| Comment on review | Yes | Yes | Yes | Yes |
| Approve content | If authorised | No by default | No | Yes |
| Approve own asset | No | No | No | No |

Check permissions in backend services using authenticated identity and resource ownership.

## 3. Tenant isolation
- Derive organisation ID from authenticated context.
- Scope every database query.
- Apply tenant filter to Qdrant queries on the server.
- Verify ownership before serving file downloads.
- Avoid revealing whether another tenant's resource exists.
- Test direct API access, not only UI behaviour.

## 4. File security
- Restrict file types and size.
- Validate MIME type and file signature where practical.
- Store originals privately with non-guessable keys.
- Do not execute uploaded content.
- Treat extracted text as untrusted.
- Disclose if malware scanning is not implemented.

## 5. Prompt injection and model output
- Treat drafts and source text as untrusted data.
- Delimit user content from system instructions.
- Model output cannot change roles, tenant IDs, permissions or approval state.
- Validate structured output and every citation.
- Apply deterministic business rules in backend.
- Show uncertainty; missing evidence is not contradiction.

## 6. Approval integrity
Create a canonical payload containing asset content hash, asset version ID, source-set digest, reviewer ID, decision and timestamp. Compute HMAC-SHA256 using a secret held outside the database and source repository. Store a key version identifier and define rotation/verification behaviour.

HMAC is a keyed integrity/authentication mechanism, not a public-key digital signature. It does not replace reviewer authentication or audit logs.

## 7. Confidential processing
- Use external inference only after checking provider retention, training, region and security terms.
- Confidential mode must use local inference and local/private retrieval/storage if advertised as no external traffic.
- Never silently fall back from local mode to cloud inference.
- Test outbound network behaviour before claiming zero leakage.
- Do not claim zero data retention without verifying the actual account and contract.

## 8. Secrets and logging
- Use environment variables or a secret manager.
- Commit `.env.example`, not `.env`.
- Never log passwords, tokens, API keys or confidential content.
- Use request IDs and safe error messages.

## 9. Minimum security tests
- Unauthenticated request denied.
- Creator self-approval denied.
- Tenant A cannot access tenant B's records/files.
- Qdrant cannot return another tenant's chunk.
- Prompt injection cannot alter permissions or approval.
- Invalid citation is rejected or unverified.
- Modified approval payload fails HMAC verification.
- Audit timeout never returns compliant.
