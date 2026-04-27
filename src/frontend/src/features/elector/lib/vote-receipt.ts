export interface ElectorVoteReceipt {
  electionId: string;
  candidateId: string;
  confirmedAt: string;
  confirmationCode: string;
  electionTitle?: string;
  candidateName?: string;
}

const RECEIPT_STORAGE_KEY = 'elector.vote.receipt';

function isValidReceipt(value: unknown): value is ElectorVoteReceipt {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.electionId === 'string' &&
    candidate.electionId.length > 0 &&
    typeof candidate.candidateId === 'string' &&
    candidate.candidateId.length > 0 &&
    typeof candidate.confirmationCode === 'string' &&
    candidate.confirmationCode.length > 0 &&
    typeof candidate.confirmedAt === 'string' &&
    candidate.confirmedAt.length > 0
  );
}

export function saveElectorVoteReceipt(receipt: ElectorVoteReceipt) {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(RECEIPT_STORAGE_KEY, JSON.stringify(receipt));
}

export function getElectorVoteReceipt(): ElectorVoteReceipt | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.sessionStorage.getItem(RECEIPT_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return isValidReceipt(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function clearElectorVoteReceipt() {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.removeItem(RECEIPT_STORAGE_KEY);
}
