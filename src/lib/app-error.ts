/** Error type for server functions. Carries a statusCode so the global
 * request error middleware (src/start.ts) re-throws it as-is instead of
 * converting it into a generic HTML error page — the client-side caller
 * needs the real `error.message` to show in a toast. */
export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
  }
}
