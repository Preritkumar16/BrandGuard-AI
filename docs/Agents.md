# BrandGuard AI — AI Audit Modules / Agent Design

## 1. Design decision
The MVP uses a specialist audit pipeline coordinated by one backend orchestrator. These modules may be called specialist agents in product explanations, but a multi-agent framework is not required. Prioritise deterministic, testable modules over orchestration complexity.

## 2. Audit sequence
1. Extract content and preserve text locations.
2. Identify applicable brand profile and approved source set.
3. Extract candidate claims and terminology.
4. Retrieve relevant approved source passages.
5. Run deterministic checks and model-assisted semantic checks.
6. Build structured candidate findings.
7. Validate findings in the backend.
8. Persist validated findings and audit metadata.

## 3. Specialist modules
### Claim extraction
Input: submitted text and content metadata.  
Output: claim spans and types (price, performance, guarantee, ranking, statistic, feature). Preserve exact offsets where possible. Do not decide truth by itself.

### Evidence retrieval
Input: claim, server-derived tenant context, brand profile and approved-source filters.  
Output: ranked source passages with source/version IDs. Qdrant results are candidate evidence, not authoritative approval state.

### Fact and claim assessment
Output categories: `SUPPORTED`, `UNSUPPORTED`, `CONTRADICTED`, `OUTDATED`, `AMBIGUOUS_RULE`, `REVIEW_UNAVAILABLE`. Missing evidence is not contradiction. Include uncertainty and explanation.

### Tone and terminology
Use deterministic exact-term checks where possible. Model-assisted tone assessment must reference an applicable rule. This is secondary to fact and claim correctness in the MVP.

### Suggestion
Generate a minimal replacement or action that preserves original intent. Never invent numbers, rankings, guarantees or factual claims. Suggestions are not automatically applied or approved.

### Citation validation
Backend checks:
1. Source belongs to authenticated tenant.
2. Source is approved and applicable.
3. Passage exists in authoritative records.
4. Span matches the submitted asset version.
5. Semantic support is sufficiently clear; uncertain cases become `UNVERIFIED`.

## 4. Structured output example
```json
{
  "category": "CONTRADICTED",
  "severity": "HIGH",
  "span": {"start": 52, "end": 56, "text": "₹999"},
  "explanation": "The applicable approved price list states ₹1,499.",
  "evidence": [
    {"source_version_id": "price_list_v2", "passage_id": "paragraph_8"}
  ],
  "suggested_action": "Correct the price after reviewer confirmation."
}
```

## 5. Prompt safety
Treat drafts and uploaded documents as untrusted data. Delimit them from system instructions. Model output cannot change roles, permissions, tenant IDs or approval state. Validate schema and source IDs. Store model and prompt versions.

## 6. MVP priority
Build claim extraction, retrieval, fact/claim assessment, terminology checks, citation validation and suggestions first. Add tone scoring only when the core audit is stable.
