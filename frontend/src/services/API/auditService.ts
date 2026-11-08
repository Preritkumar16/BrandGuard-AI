/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuditFinding, ComplianceStatus } from '../../types';
import { MOCK_FINDINGS, MOCK_ASSETS } from './mockData';
import { sourcesService } from './sourcesService';
import { apiFetch } from './client';

const inMemoryFindings: Record<string, AuditFinding[]> = { ...MOCK_FINDINGS };

export const auditService = {
  async getFindings(assetId: string, versionId: string): Promise<AuditFinding[]> {
    try {
      return await apiFetch<AuditFinding[]>(`/assets/${assetId}/versions/${versionId}/findings`);
    } catch {
      return inMemoryFindings[versionId] || [];
    }
  },

  getAllFindingsSync(): Record<string, AuditFinding[]> {
    return inMemoryFindings;
  },

  /**
   * Run enterprise brand governance audit against all active brand sources.
   * Dynamically loads all active brand sources (including custom registered sources).
   */
  async triggerAudit(assetId: string, versionId: string): Promise<{
    status: ComplianceStatus;
    findings: AuditFinding[];
    summary: {
      total_findings: number;
      breaches: number;
      warnings: number;
      compliant_checks: number;
      engine_version: string;
      audit_date: string;
    };
  }> {
    try {
      return await apiFetch(`/assets/${assetId}/versions/${versionId}/audit`, {
        method: 'POST',
      });
    } catch {
      // Find asset & version
      const asset = MOCK_ASSETS.find(a => a.id === assetId);
      const version = asset?.versions.find(v => v.version_id === versionId);
      const content = version?.content || '';

      const allActiveSources = await sourcesService.getSources();
      const generatedFindings: AuditFinding[] = [];

      // 1. Trademark checks
      const tmSource = allActiveSources.find(s => s.category === 'trademark') || allActiveSources[2];
      if (/sentinelmesh\b/i.test(content) && !content.includes('SentinelMesh™') && !content.includes('SentinelMesh')) {
        generatedFindings.push({
          id: `fnd-tm-${Date.now().toString(36)}`,
          version_id: versionId,
          category: 'Trademark & Brand Mark',
          severity: 'breach',
          title: 'Incorrect Brand Mark Syntax',
          description: 'SentinelMesh must use proper CamelCase and the ™ symbol on prominent first appearance.',
          flagged_text: 'sentinelmesh',
          suggested_replacement: 'SentinelMesh™',
          evidence: {
            source_id: tmSource?.id || 'src-trademark-01',
            source_title: tmSource?.title || 'Trademark Guidelines',
            source_version: tmSource?.current_version || 'v1.8',
            passage_id: tmSource?.versions[0]?.passages[0]?.id || 'pas-tm-01',
            section: tmSource?.versions[0]?.passages[0]?.section || 'Section 1.2: Product Casing & Syntax',
            excerpt: tmSource?.versions[0]?.passages[0]?.text || 'SentinelMesh must always be spelled as camelCase with a capital S and M, followed by the trademark symbol ™.',
            match_confidence: 0.99,
          },
          status: 'open',
        });
      }

      // 2. Banned Superlatives (Tone of voice)
      const toneSource = allActiveSources.find(s => s.category === 'tone_voice') || allActiveSources[1];
      const hypeTerms = ['revolutionary', 'game-changing', 'miraculous', 'unprecedented'];
      for (const term of hypeTerms) {
        if (content.toLowerCase().includes(term)) {
          generatedFindings.push({
            id: `fnd-tone-${term}-${Date.now().toString(36)}`,
            version_id: versionId,
            category: 'Brand Tone & Voice',
            severity: 'warning',
            title: `Banned Superlative Term: "${term}"`,
            description: `Enterprise editorial standards prohibit subjective hype terms like "${term}".`,
            flagged_text: term,
            suggested_replacement: 'authoritative and verified',
            evidence: {
              source_id: toneSource?.id || 'src-tone-01',
              source_title: toneSource?.title || 'Brand Tone Guidelines',
              source_version: toneSource?.current_version || 'v2.4',
              passage_id: toneSource?.versions[0]?.passages[0]?.id || 'pas-tone-01',
              section: toneSource?.versions[0]?.passages[0]?.section || 'Section 2.1: Banned Superlatives',
              excerpt: toneSource?.versions[0]?.passages[0]?.text || 'Avoid unsubstantiated marketing hype including "revolutionary", "game-changing", "miraculous", and "unprecedented".',
              match_confidence: 0.96,
            },
            status: 'open',
          });
        }
      }

      // 3. Absolute Security claims
      const secSource = allActiveSources.find(s => s.category === 'security') || allActiveSources[3];
      if (/100%\s*(unhackable|invulnerable|secure)|bulletproof/i.test(content)) {
        generatedFindings.push({
          id: `fnd-sec-${Date.now().toString(36)}`,
          version_id: versionId,
          category: 'Security & Compliance',
          severity: 'breach',
          title: 'Forbidden Absolute Security Assertion',
          description: 'Claims of 100% invulnerability violate CISO compliance policies.',
          flagged_text: '100% unhackable security',
          suggested_replacement: 'defense-in-depth architecture validated under SOC 2 Type II controls',
          evidence: {
            source_id: secSource?.id || 'src-sec-01',
            source_title: secSource?.title || 'Data Security Assertions',
            source_version: secSource?.current_version || 'v2.1',
            passage_id: secSource?.versions[0]?.passages[0]?.id || 'pas-sec-01',
            section: secSource?.versions[0]?.passages[0]?.section || 'Section 3.1: Absolute Security Claims',
            excerpt: secSource?.versions[0]?.passages[0]?.text || 'Phrases such as "100% unhackable", "bulletproof security", or "zero-risk architecture" violate CISO compliance standards.',
            match_confidence: 0.99,
          },
          status: 'open',
        });
      }

      // 4. Unsubstantiated ROI
      const legalSource = allActiveSources.find(s => s.category === 'legal') || allActiveSources[0];
      if (/guaranteed\s*\d+x\s*roi/i.test(content)) {
        generatedFindings.push({
          id: `fnd-roi-${Date.now().toString(36)}`,
          version_id: versionId,
          category: 'Legal & Regulatory',
          severity: 'breach',
          title: 'Unsubstantiated Performance Multiplier',
          description: 'Prohibited from stating guaranteed ROI multipliers without audited third-party study footnote.',
          flagged_text: 'guaranteed 10x ROI in under 30 days',
          suggested_replacement: 'up to 3.8x reduction in governance overhead*',
          evidence: {
            source_id: legalSource?.id || 'src-legal-01',
            source_title: legalSource?.title || 'Performance Disclaimers',
            source_version: legalSource?.current_version || 'v3.2',
            passage_id: legalSource?.versions[0]?.passages[0]?.id || 'pas-leg-01',
            section: legalSource?.versions[0]?.passages[0]?.section || 'Section 4.1: Performance Projections',
            excerpt: legalSource?.versions[0]?.passages[0]?.text || 'Specific return-on-investment (ROI) claims such as "guaranteed 10x ROI" or "instant cost savings" are strictly prohibited.',
            match_confidence: 0.97,
          },
          status: 'open',
        });
      }

      // 5. Dynamic scan of all passages in newly created sources
      for (const customSource of allActiveSources) {
        for (const ver of customSource.versions) {
          for (const passage of ver.passages) {
            // Check if passage rule title or words exist in content
            if (passage.rule_type === 'prohibited_phrase' && passage.rule_title) {
              const ruleKeyword = passage.rule_title.toLowerCase().replace(/claim|prohibition|rule|forbidden/g, '').trim();
              if (ruleKeyword.length > 3 && content.toLowerCase().includes(ruleKeyword)) {
                generatedFindings.push({
                  id: `fnd-custom-${passage.id}`,
                  version_id: versionId,
                  category: customSource.category.toUpperCase(),
                  severity: passage.severity || 'warning',
                  title: passage.rule_title,
                  description: `Content triggers policy rule defined in ${customSource.title}.`,
                  flagged_text: ruleKeyword,
                  suggested_replacement: 'compliant phrasing adhering to guideline specifications',
                  evidence: {
                    source_id: customSource.id,
                    source_title: customSource.title,
                    source_version: customSource.current_version,
                    passage_id: passage.id,
                    section: passage.section,
                    excerpt: passage.text,
                    match_confidence: 0.95,
                  },
                  status: 'open',
                });
              }
            }
          }
        }
      }

      // If existing mock findings existed for this version and we found none dynamically, retain baseline
      const finalFindings = generatedFindings.length > 0 
        ? generatedFindings 
        : (inMemoryFindings[versionId] || []);

      inMemoryFindings[versionId] = finalFindings;

      const breaches = finalFindings.filter(f => f.severity === 'breach').length;
      const warnings = finalFindings.filter(f => f.severity === 'warning').length;
      
      let overallStatus: ComplianceStatus = 'approved';
      if (breaches > 0) {
        overallStatus = 'breach';
      } else if (warnings > 0) {
        overallStatus = 'review_required';
      }

      const summary = {
        total_findings: finalFindings.length,
        breaches,
        warnings,
        compliant_checks: 18,
        engine_version: 'bg-sentinel-engine-4.1.0',
        audit_date: new Date().toISOString(),
      };

      if (version) {
        version.audit_status = overallStatus;
        version.audit_summary = summary;
      }
      if (asset) {
        asset.current_status = overallStatus;
      }

      return {
        status: overallStatus,
        findings: finalFindings,
        summary,
      };
    }
  },

  async updateFindingStatus(findingId: string, status: 'open' | 'accepted' | 'dismissed'): Promise<void> {
    for (const list of Object.values(inMemoryFindings)) {
      const match = list.find(f => f.id === findingId);
      if (match) {
        match.status = status;
        break;
      }
    }
  },
};
