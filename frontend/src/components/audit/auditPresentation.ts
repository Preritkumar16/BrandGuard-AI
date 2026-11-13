import { AssetVersion } from '../../types';

export type AuditAttemptState = 'pending' | 'rejected' | 'unknown';

export interface AuditPresentation {
  kind: 'server' | 'local' | 'unknown' | 'unavailable' | 'not-run' | 'unverified' | 'pending' | 'rejected';
  label: string;
  message: string;
}

export function getAuditPresentation(
  version: AssetVersion,
  attempt?: AuditAttemptState
): AuditPresentation {
  if (attempt === 'pending') {
    return {
      kind: 'pending',
      label: 'Check in progress',
      message: 'Any previous result remains visible until this check completes.',
    };
  }
  if (attempt === 'rejected') {
    return {
      kind: 'rejected',
      label: 'Latest check rejected',
      message: 'The server rejected the latest request. Any previous result remains unchanged.',
    };
  }
  if (attempt === 'unknown') {
    return {
      kind: 'unknown',
      label: 'Latest check outcome unconfirmed',
      message: 'The server outcome could not be confirmed. Any displayed findings are not a confirmed result of this attempt.',
    };
  }
  if (version.audit_source === 'unavailable'
    || version.audit_server_outcome === 'rejected'
    || version.audit_status === 'unavailable'
    || version.audit_status === 'failed') {
    return {
      kind: 'unavailable',
      label: version.audit_server_outcome === 'rejected' ? 'Server request rejected' : 'Check unavailable',
      message: version.audit_server_outcome === 'confirmed'
        ? 'The server reported that this check failed or was unavailable; no completed result is confirmed.'
        : 'No completed result is confirmed for this version.',
    };
  }
  if (version.audit_source === 'local') {
    return {
      kind: 'local',
      label: 'Local rule check',
      message: 'These rule-based results are not server- or AI-verified. The server audit outcome is unconfirmed.',
    };
  }
  if (version.audit_source === 'api' && version.audit_server_outcome === 'confirmed' && version.audit_summary) {
    return {
      kind: 'server',
      label: 'Confirmed server check',
      message: 'The server confirmed this result. The response does not identify whether AI was used.',
    };
  }
  if (version.audit_source === 'api') {
    return {
      kind: 'unknown',
      label: 'Server outcome unconfirmed',
      message: 'A server result is not confirmed for this version.',
    };
  }
  if (version.audit_summary) {
    return {
      kind: 'unverified',
      label: 'Result source not recorded',
      message: 'A result is present, but its source is unknown. It may be legacy or demo data and is not verified as a server or AI result.',
    };
  }
  return {
    kind: 'not-run',
    label: 'Brand check not run',
    message: 'No brand-check result is recorded for this version.',
  };
}
