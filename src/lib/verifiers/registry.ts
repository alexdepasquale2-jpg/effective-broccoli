import { Verifier } from "./types";

class VerifierRegistry {
  private verifiers: Map<string, Verifier> = new Map();

  register(verifier: Verifier): void {
    if (this.verifiers.has(verifier.taskType)) {
      console.warn(`Overwriting verifier for taskType: ${verifier.taskType}`);
    }
    this.verifiers.set(verifier.taskType, verifier);
  }

  get(taskType: string): Verifier | undefined {
    return this.verifiers.get(taskType);
  }

  has(taskType: string): boolean {
    return this.verifiers.has(taskType);
  }

  listSupportedTaskTypes(): string[] {
    return Array.from(this.verifiers.keys());
  }
}

export const verifierRegistry = new VerifierRegistry();
