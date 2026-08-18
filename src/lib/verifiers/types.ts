import { Bounty, Submission, VerificationResult } from "@prisma/client";

export interface VerificationOutcome {
  passed: boolean;
  rawResult: Record<string, unknown>;
  details?: string;
  externalRef?: string;
}

export interface CodeFixConfig {
  repoUrl: string;
  baseBranch: string;
  failingTestCommand?: string;
  testFilePaths?: string[];
  workflowName?: string;
}

export interface CodeFixPayload {
  prUrl: string;
  prNumber?: number;
  branch: string;
  commitSha: string;
}

/**
 * Pluggable verifier interface for outcome-based bounties.
 * Allows CodeFixVerifier now, and LeadGenVerifier, AppointmentVerifier, ContentVerifier later.
 */
export interface Verifier<TConfig = unknown, TPayload = unknown> {
  readonly taskType: string;

  /**
   * Called immediately when a submission is received to trigger or register verifications.
   */
  onSubmissionReceived(
    submission: Submission,
    bounty: Bounty,
    config: TConfig,
    payload: TPayload
  ): Promise<void>;

  /**
   * Called when an external webhook payload is received (e.g. GitHub check_suite / check_run event).
   * Returns a resolved VerificationOutcome if this webhook resolves a pending submission, or null otherwise.
   */
  handleWebhook(
    payload: unknown,
    headers?: Record<string, string | string[] | undefined>
  ): Promise<{
    submissionId: string;
    outcome: VerificationOutcome;
  } | null>;
}
