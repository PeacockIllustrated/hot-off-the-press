/**
 * Errors carry a machine code and a human sentence. Postgres raises them as
 * `HOTP_CODE: message`; the demo dataset raises them directly.
 */
export class HotpError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "HotpError";
    this.code = code;
  }
}
