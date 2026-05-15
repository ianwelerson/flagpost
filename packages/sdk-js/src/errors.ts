export class FlagpostError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FlagpostError';
  }
}

export class FlagpostFetchError extends FlagpostError {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'FlagpostFetchError';
  }
}

export class FlagpostValidationError extends FlagpostError {
  constructor(
    message: string,
    public readonly issues: string[] = [],
  ) {
    const detail = issues.length ? `${message}:\n  - ${issues.join('\n  - ')}` : message;
    super(detail);
    this.name = 'FlagpostValidationError';
  }
}

export class FlagpostNotLoadedError extends FlagpostError {
  constructor() {
    super('Flagpost.load() must be called before reading flags');
    this.name = 'FlagpostNotLoadedError';
  }
}
