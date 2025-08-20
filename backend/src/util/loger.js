import { createLogger, format, transports } from 'winston'
import util from 'util'
import 'winston-mongodb'
import { fileURLToPath } from 'url'
import config from '../config/config.js'
import { EApplicationEnvionment } from '../constent/application.js'
import path from 'path'
import * as sourceMapSupport from 'source-map-support'
import { blue, green, magenta, red, yellow } from 'colorette'

//Linking trace support
sourceMapSupport.install()

const coloriseLevel = (level) => {
    switch (level) {
        case 'ERROR':
            return red(level)
        case 'INFO':
            return blue(level)
        case 'WARN':
            return yellow(level)
        default:
            return level
    }
}

const consoleFormate = format.printf((info) => {
    const { level, message, timestamp, meta } = info
    const customLevel = coloriseLevel(level.toUpperCase())
    const customTimestamp = green(timestamp)
    const customMeta = util.inspect(meta, {
        showHidden: false,
        depth: null,
        colors: true,
    })

    const customLog = `${customLevel} [${customTimestamp}] ${message} \n ${magenta('META')} ${customMeta}\n`
    return customLog
})

const consoleTransport = () => {
    if (config.ENV === EApplicationEnvionment.DEVELOPMENT) {
        return [
            new transports.Console({
                level: 'info',
                format: format.combine(format.timestamp(), consoleFormate),
            }),
        ]
    }
    return []
}

const fileFormate = format.printf((info) => {
    const { level, message, timestamp, meta } = info
    const logMeta = {}
    for (const [key, value] of Object.entries(meta)) {
        if (value instanceof Error) {
            logMeta[key] = {
                name: value.name,
                message: value.message,
                stack: value.stack || null,
            }
        } else {
            logMeta[key] = value
        }
    }

    const logData = {
        level: level.toUpperCase(),
        message,
        timestamp,
        meta: logMeta,
    }

    return JSON.stringify(logData, null, 4)
})
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const fileTransport = () => {
    return [
        new transports.File({
            filename: path.join(__dirname, '../', '../', 'logs', `${config.ENV}.log`),
            level: 'info',
            format: format.combine(format.timestamp(), fileFormate),
        }),
    ]
}

const mongodbTransport = () => {
    return [
        new transports.MongoDB({
            level: 'info',
            db: config.DATABASE_URL,
            metaKey: 'meta',
            expireAfterSeconds: 60 * 60 * 24 * 30,
            options: {
                useUnifiedTopology: true,
            },
            collection: 'application-logs',
        }),
    ]
}

export default createLogger({
    defaultMeta: {
        meta: {},
    },
    transports: [...fileTransport(), ...mongodbTransport(), ...consoleTransport()],
})
