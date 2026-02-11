import winston from 'winston';

const LOG_LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
} as const;

const LOG_COLORS = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

winston.addColors(LOG_COLORS);

const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
        const ctx = context ? `[${context as string}]` : '';
        const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
        return `${timestamp as string} ${level} ${ctx} ${message as string}${metaStr}`;
    }),
);

const jsonFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
);

/**
 * Production-grade structured logger wrapping Winston.
 * Each instance has an associated context name for log categorization.
 */
export class Logger {
    private readonly logger: winston.Logger;
    private readonly context: string;

    constructor(context: string) {
        this.context = context;

        const level = process.env.LOG_LEVEL || 'info';

        const transports: winston.transport[] = [
            new winston.transports.Console({
                format: process.env.NODE_ENV === 'production' ? jsonFormat : consoleFormat,
            }),
        ];

        if (process.env.LOG_FILE) {
            transports.push(
                new winston.transports.File({
                    filename: process.env.LOG_FILE,
                    format: jsonFormat,
                    maxsize: 5242880, // 5MB
                    maxFiles: 5,
                }),
            );

            transports.push(
                new winston.transports.File({
                    filename: process.env.LOG_FILE?.replace('.log', '.error.log'),
                    level: 'error',
                    format: jsonFormat,
                    maxsize: 5242880,
                    maxFiles: 5,
                }),
            );
        }

        this.logger = winston.createLogger({
            level,
            levels: LOG_LEVELS,
            transports,
            exitOnError: false,
        });
    }

    public info(message: string, meta?: Record<string, unknown>): void {
        this.logger.info(message, { context: this.context, ...meta });
    }

    public error(message: string, meta?: Record<string, unknown>): void {
        this.logger.error(message, { context: this.context, ...meta });
    }

    public warn(message: string, meta?: Record<string, unknown>): void {
        this.logger.warn(message, { context: this.context, ...meta });
    }

    public debug(message: string, meta?: Record<string, unknown>): void {
        this.logger.debug(message, { context: this.context, ...meta });
    }

    public http(message: string, meta?: Record<string, unknown>): void {
        this.logger.http(message, { context: this.context, ...meta });
    }

    /**
     * Create a child logger with a sub-context.
     */
    public child(subContext: string): Logger {
        return new Logger(`${this.context}:${subContext}`);
    }
}
