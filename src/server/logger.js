import winston from 'winston';
import moment from 'moment-timezone';

const customFormat = winston.format.printf(({ level, message, timestamp, ...meta }) => {
    const levelStr = winston.format.colorize().colorize(level, `[${level.toUpperCase()}]`);
    const messageStr = winston.format.colorize().colorize(level, message || '');
    const metaStr = Object.keys(meta).length ? `\n\t${JSON.stringify(meta, null, 2)}` : '';

    return `${levelStr} ${timestamp} - ${messageStr} ${metaStr}`;
});

const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp({
            format: () => moment().tz('Asia/Taipei').format('MM/DD hh:mm:ss'),
        }),
        customFormat
    ),
    transports: [
        new winston.transports.Console()
    ],
});

export default logger;
