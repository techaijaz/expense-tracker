import nodemailer from 'nodemailer'
import config from '../config/config.js'

const transporter = nodemailer.createTransport({
    host: config.EMAIL.HOST,
    port: config.EMAIL.PORT,
    secure: config.EMAIL.PORT === 465, // true for 465, false for other ports
    auth: {
        user: config.EMAIL.USER,
        pass: config.EMAIL.PASS,
    },
})

export default {
    sendVerificationEmail: async (email, firstName, token) => {
        const verificationUrl = `${config.FRONTEND_URL}/verify-email?token=${token}`
        const mailOptions = {
            from: `"Aiexpenser" <${config.EMAIL.FROM}>`,
            to: email,
            subject: 'Verify Your Email - Aiexpenser',
            html: `
                <div style="font-family: 'Sora', sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #141928; border-radius: 16px; background-color: #080B12; color: #EEF0F8;">
                    <h2 style="color: #5B8DEF;">Welcome to Aiexpenser, ${firstName}!</h2>
                    <p style="font-size: 16px; line-height: 1.6;">Thank you for joining our community of financial architects. To start building your wealth, please verify your email address by clicking the button below:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationUrl}" style="background-color: #5B8DEF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: 600; display: inline-block;">Verify Email Address</a>
                    </div>
                    <p style="font-size: 14px; color: #8892B0;">This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
                    <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.12); margin: 20px 0;" />
                    <p style="font-size: 12px; color: #4A5578; text-align: center;">© ${new Date().getFullYear()} Aiexpenser. All rights reserved.</p>
                </div>
            `,
        }
        return transporter.sendMail(mailOptions)
    },

    sendResetPasswordEmail: async (email, firstName, token) => {
        const resetUrl = `${config.FRONTEND_URL}/reset-password?token=${token}`
        const mailOptions = {
            from: `"Aiexpenser" <${config.EMAIL.FROM}>`,
            to: email,
            subject: 'Reset Your Password - Aiexpenser',
            html: `
                <div style="font-family: 'Sora', sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #141928; border-radius: 16px; background-color: #080B12; color: #EEF0F8;">
                    <h2 style="color: #FF6B6B;">Password Reset Request</h2>
                    <p style="font-size: 16px; line-height: 1.6;">Hello ${firstName}, we received a request to reset your password. No worries, it happens to the best of us! Click the button below to set a new password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" style="background-color: #5B8DEF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: 600; display: inline-block;">Reset Password</a>
                    </div>
                    <p style="font-size: 14px; color: #8892B0;">This link will expire in 1 hour for your security. If you didn't request this, please ignore this email or contact support if you're concerned.</p>
                    <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.12); margin: 20px 0;" />
                    <p style="font-size: 12px; color: #4A5578; text-align: center;">© ${new Date().getFullYear()} Aiexpenser. All rights reserved.</p>
                </div>
            `,
        }
        return transporter.sendMail(mailOptions)
    },
}
