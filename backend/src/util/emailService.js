import nodemailer from 'nodemailer'
import config from '../config/config.js'
import logger from './loger.js'

/**
 * Email Service
 * Handles sending emails with optional attachments.
 */
const sendEmail = async ({ to, subject, text, html, attachments = [] }) => {
    try {
        // Create a transporter using the configured email settings
        // If SERVICE is provided (e.g., 'gmail'), nodemailer handles the host/port
        const transportConfig = config.EMAIL.SERVICE 
            ? { service: config.EMAIL.SERVICE }
            : {
                host: config.EMAIL.HOST,
                port: config.EMAIL.PORT,
                secure: config.EMAIL.PORT === 465, // true for 465, false for other ports
            }

        // Add authentication
        transportConfig.auth = {
            user: config.EMAIL.USER,
            pass: config.EMAIL.PASS,
        }

        const transporter = nodemailer.createTransport(transportConfig)

        // Verify connection configuration
        // await transporter.verify()

        const mailOptions = {
            from: config.EMAIL.FROM,
            to,
            subject,
            text,
            html,
            attachments,
        }

        const info = await transporter.sendMail(mailOptions)
        logger.info(`Email sent: ${info.messageId}`)
        return { success: true, messageId: info.messageId }
    } catch (error) {
        logger.error('Error sending email:', error)
        return { success: false, error: error.message }
    }
}

export default {
    sendEmail,
}
