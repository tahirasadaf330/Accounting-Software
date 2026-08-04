/**
 * Internal error types. These never reach the agent directly — the runner maps
 * them to one of the three approved response strings (Guide 5.1 / A.6).
 */

/** Thrown by the SQL guard / masking checks. Maps to the guard-reject string. */
export class GuardRejectError extends Error {
  constructor(public readonly reason: string) {
    super('guard-reject');
    this.name = 'GuardRejectError';
  }
}
