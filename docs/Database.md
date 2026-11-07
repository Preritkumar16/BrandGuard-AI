# BrandGuard AI — Database Design

**Primary database:** PostgreSQL  
**Vector index:** Qdrant  
**File storage:** private object storage

## 1. Core entities
### organisations
`id`, `name`, `created_at`.

### users
`id`, `organisation_id`, `name`, `email`, `password_hash`, `role`, `is_active`, timestamps. Roles: `ADMIN`, `SOURCE_OWNER`, `CREATOR`, `REVIEWER`, `COMPLIANCE_REVIEWER`.

### brand_sources
`id`, `organisation_id`, `name`, `source_type`, `owner_user_id`, `current_version_id`, timestamps.

### source_versions
`id`, `organisation_id`, `source_id`, `version_number`, `effective_from`, optional `effective_to`, `status`, `file_object_key`, `content_hash`, extracted-text reference, `created_by`, `approved_by`, timestamps. Status: `DRAFT`, `APPROVED`, `SUPERSEDED`, `ARCHIVED`.

### source_chunks
`id`, `organisation_id`, `source_version_id`, `chunk_index`, `passage_id`, `text`, page/paragraph locator, metadata, Qdrant point ID.

### assets
`id`, `organisation_id`, `title`, `created_by`, `current_version_id`, timestamps.

### asset_versions
`id`, `organisation_id`, `asset_id`, `version_number`, `content_hash`, `content_text`, optional `file_object_key`, `status`, `created_by`, timestamps. Status: `DRAFT`, `IN_REVIEW`, `APPROVED`, `REJECTED`, `REVIEW_REQUIRED`.

### findings
`id`, `organisation_id`, `asset_version_id`, `category`, `severity`, `span_start`, `span_end`, `span_text`, `explanation`, `suggested_action`, optional `suggested_replacement`, `validation_status`, `model_name`, `prompt_version`, timestamps.

### evidence_links
`id`, `finding_id`, `source_version_id`, `passage_id`, optional page/paragraph locator.

### dependencies
`id`, `organisation_id`, `asset_version_id`, `source_version_id`, `dependency_status`, timestamps.

### review_events
`id`, `organisation_id`, `asset_version_id`, `actor_user_id`, `event_type`, `comment`, metadata, timestamp.

### approvals
`id`, `organisation_id`, `asset_version_id`, `reviewer_user_id`, `decision`, `source_set_digest`, `canonical_payload`, `hmac_tag`, `key_version`, timestamp.

## 2. Relationships
- Organisation has many users, sources and assets.
- Brand source has many immutable source versions.
- Asset has many immutable asset versions.
- Asset version has findings, evidence links, review events and dependencies.
- Approval applies to one exact asset version and source-set digest.

## 3. Constraints
- Unique `(organisation_id, email)` for users.
- Unique `(source_id, version_number)`.
- Unique `(asset_id, version_number)`.
- Every tenant-owned row includes `organisation_id`.
- Foreign keys prevent orphan records.
- Approval must reference an authorised reviewer and same-tenant asset version.
- Backend blocks creator self-approval.
- Never overwrite old version content; create a new version.

## 4. Qdrant payload example
```json
{
  "organisation_id": "server-derived-tenant-id",
  "source_id": "source-uuid",
  "source_version_id": "source-version-uuid",
  "passage_id": "paragraph_8",
  "status": "APPROVED",
  "effective_from": "2026-01-01",
  "chunk_index": 8
}
```
The backend creates the tenant filter from authenticated context. Do not accept arbitrary tenant filters from the browser.

## 5. MVP simplification
Implement the workflow-critical tables together: organisations, users, brand_sources, source_versions, source_chunks, assets, asset_versions, findings, evidence_links, dependencies, review_events and approvals. These are not optional for the promised source retrieval and source-change re-review flow. Dashboard aggregates can be deferred.
