export class PseudoFsError extends Error {

  code?: string;
  errno?: number;
  syscall?: string;

  constructor(message: string, code?: string, syscall?: string) {
    super(message);
    this.name = 'PseudoFsError'; // もしくは 'SystemError' としても良いが、Node.jsのとは別物
    if (code) {
      this.code = code;
    }
    if (syscall) {
      this.syscall = syscall;
    }
    // 例外のスタックトレースからこのコンストラクタを隠す
    Error.captureStackTrace(this, PseudoFsError);
  }
}
