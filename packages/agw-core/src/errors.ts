export interface AgwCliErrorEnvelope {
  error: {
    code: string;
    message: string;
  };
}

export class AgwCliError extends Error {
  readonly code: string;
  readonly exitCode: number;

  constructor(code: string, message: string, exitCode = 1) {
    super(message);
    this.code = code;
    this.exitCode = exitCode;
  }
}

export function toErrorEnvelope(error: unknown): AgwCliErrorEnvelope {
  if (error instanceof AgwCliError) {
    return {
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }

  return {
    error: {
      code: "UNKNOWN_ERROR",
      message: error instanceof Error ? error.message : String(error),
    },
  };
}
