# BrandGuard AI — MCP Connection Decision

## 1. Current decision
MCP (Model Context Protocol) is **not required for the Round 2 MVP**. The Round 1 proposal does not commit to an MCP server or external MCP integration. With a 30-hour build window, implementing MCP before the core product works adds scope and security risk.

## 2. Potential future use
A controlled MCP server could expose selected operations to approved AI clients:
- Search approved brand guidance.
- Retrieve an authorised source passage.
- Start a content audit.
- Read findings for an authorised asset.
- Create a draft revision suggestion.

## 3. Security requirements if added
- Authenticate every client.
- Derive tenant scope from authenticated identity.
- Expose least-privilege tools only.
- Do not expose arbitrary file-system, database or unrestricted retrieval tools.
- Require human approval for state-changing actions.
- Validate arguments and outputs.
- Log calls with actor, tenant, resource and timestamp.
- Avoid unnecessary exposure of confidential source text.

## 4. Conceptual tool names
- `search_brand_guidelines(query, brand_profile)`
- `get_approved_source_passage(source_version_id, passage_id)`
- `run_content_audit(asset_version_id)`
- `get_audit_findings(asset_version_id)`

These are conceptual, not implemented tools.

## 5. Round 2 scope
Do not claim MCP support unless an MCP server/client integration is actually implemented and tested. The primary product interface remains the web application and REST API.
