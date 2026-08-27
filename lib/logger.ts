export class Logger {
  private static formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaString = meta ? ` | Meta: ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaString}`;
  }

  static info(message: string, meta?: any) {
    console.log(this.formatMessage('INFO', message, meta));
  }

  static warn(message: string, meta?: any) {
    console.warn(this.formatMessage('WARN', message, meta));
  }

  static error(message: string, error?: any, meta?: any) {
    const errorDetails = error 
      ? ` | Error: ${error.message || error} ${error.stack ? `\nStack: ${error.stack}` : ''}` 
      : '';
    console.error(this.formatMessage('ERROR', message, meta) + errorDetails);
  }
}

export default Logger;
