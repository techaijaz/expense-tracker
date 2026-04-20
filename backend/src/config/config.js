import dotenvFlow from 'dotenv-flow'

dotenvFlow.config()

export default {
    //genral
    ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    SERVER_URL: process.env.SERVER_URL,

    //Database
    DATABASE_URL: process.env.DATABASE_URL,

    //fruntend
    FRONTEND_URL: process.env.FRONTEND_URL,

    //email service
    EMAIL: {
        SERVICE: process.env.EMAIL_SERVICE, // e.g., 'gmail'
        HOST: process.env.EMAIL_HOST,
        PORT: process.env.EMAIL_PORT || 587,
        USER: process.env.EMAIL_USER,
        PASS: process.env.EMAIL_PASS,
        FROM: process.env.EMAIL_FROM || 'aiexpenser@example.com',
    },

    //ACCESS_TOKEN_SECRET
    ACCESS_TOKEN: {
        SECRET: process.env.ACCESS_TOKEN_SECRET,
        EXPIRY: 60 * 60,
    },

    //REFRESH_TOKEN_SECRET
    REFRESH_TOKEN: {
        SECRET: process.env.REFRESH_TOKEN_SECRET,
        EXPIRY: 3600 * 24,
    },

    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
}
