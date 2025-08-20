import os from 'os'
import config from '../config/config.js'
import bcrypt from 'bcrypt'
import { v4 } from 'uuid'
import jwt from 'jsonwebtoken'
import dayjs from 'dayjs'
import { randomInt } from 'crypto'

export default {
    getSystemHealth: () => {
        return {
            cpuUsage: os.loadavg(),
            totalMemory: `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB ${(((os.totalmem() - os.freemem()) / os.totalmem()) * 100).toFixed(2)} %`,
            freeMemory: `${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
            usedMemory: `${((os.totalmem() - os.freemem()) / 1024 / 1024 / 1024).toFixed(2)} GB`,
        }
    },
    getApplicationHealth: () => {
        return {
            enviornment: config.ENV,
            uptime: `${process.uptime().toFixed(2)} seconds`,
            memoryUsage: {
                heapTotal: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`,
                heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
            },
        }
    },
    hashedPassword: (password) => {
        return bcrypt.hash(password, 10)
    },
    comparePassword: (password, hashedPassword) => {
        return bcrypt.compare(password, hashedPassword)
    },
    generateRandumId: () => v4(),
    generateOtp: (length) => {
        const min = Math.pow(10, length - 1)
        const max = Math.pow(10, length) - 1
        return randomInt(min, max).toString()
    },
    genrateToken: (payload, secret, expiry) => {
        return jwt.sign(payload, secret, { expiresIn: expiry })
    },
    verifyToken: (token, secret) => {
        return jwt.verify(token, secret)
    },
    getDomainFromUrl: (requesturl) => {
        try {
            const url = new URL(requesturl, config.SERVER_URL)
            return url.hostname
        } catch (error) {
            throw error
        }
    },
    generateResetPasswordExpiry: (minute) => {
        return dayjs().valueOf() + minute * 60 * 1000
    }
}
