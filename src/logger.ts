import * as winston from 'winston'
import 'winston-daily-rotate-file'
import { PathHelper } from './PathHelper'
import { CustomLogTransport } from './services/log/CustomLogTransport'

const logger = (
  process.env.NODE_ENV === 'test'
    ? Object.assign(console, {
        emerg: console.error.bind(console),
        alert: console.error.bind(console),
        crit: console.error.bind(console),
        warning: console.warn.bind(console),
        notice: console.log.bind(console),
        debug: console.log.bind(console),
      })
    : winston.createLogger({
        //   levels: {
        //       emerg: 0,
        //       alert: 1,
        //       crit: 2,
        //       error: 3,
        //       warning: 4,
        //       warn: 5,
        //       notice: 6,
        //       info: 7,
        //       debug: 8,
        //   },
        level: 'debug',
        defaultMeta: { service: 'codiny' },
        transports: [
          // new winston.transports.Console(),
          new CustomLogTransport({
            level: 'debug',
          }),
          // new winston.transports.DailyRotateFile({
          //   filename: 'aimk-%DATE%.log',
          //   datePattern: 'YYYYMMDD',
          //   zippedArchive: false,
          //   maxSize: '20mb',
          //   maxFiles: '7d',
          //   dirname: PathHelper.logPath(),
          //   level: 'info',
          // }),
        ],
        exceptionHandlers: [
          new winston.transports.DailyRotateFile({
            filename: 'aimk-error-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: false,
            maxSize: '20mb',
            maxFiles: '14d',
            dirname: PathHelper.logPath(),
          }),
        ],
        format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
      })
) as winston.Logger

export { logger }
