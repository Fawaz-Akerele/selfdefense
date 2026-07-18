type CircuitState = "closed" | "open" | "half-open";

interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeoutMs?: number;
}

export class CircuitBreaker {
  private failures = 0;
  private lastFailure = 0;
  private state: CircuitState = "closed";
  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetTimeoutMs = options.resetTimeoutMs ?? 30_000;
  }

  getState(): CircuitState {
    if (
      this.state === "open" &&
      Date.now() - this.lastFailure >= this.resetTimeoutMs
    ) {
      this.state = "half-open";
    }
    return this.state;
  }

  async execute<T>(fn: () => Promise<T>, fallback: () => T | Promise<T>): Promise<T> {
    const state = this.getState();

    if (state === "open") {
      return fallback();
    }

    try {
      const result = await fn();
      this.failures = 0;
      this.state = "closed";
      return result;
    } catch {
      this.failures += 1;
      this.lastFailure = Date.now();

      if (this.failures >= this.failureThreshold) {
        this.state = "open";
      }

      return fallback();
    }
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxAttempts?: number; delayMs?: number } = {}
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3;
  const delayMs = options.delayMs ?? 500;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, delayMs * attempt));
      }
    }
  }

  throw lastError;
}

export const dbCircuit = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeoutMs: 15_000,
});
