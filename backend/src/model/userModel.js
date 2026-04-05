import mongoose, { Schema } from 'mongoose'

const userSchema = new Schema(
    {
        firstName: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        lastName: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        avatar: {
            type: String,
            trim: true,
            default: null,
        },
        password: {
            type: String,
            required: true,
            select: false,
        },
        consent: {
            type: Boolean,
            required: true,
            default: false,
        },
        refreshToken: {
            _id: false,
            token: {
                type: String,
                default: null,
            },
        },
        setBasicDetails: {
            type: Boolean,
            default: false,
        },
        lastLoginAt: {
            type: Date,
            default: null,
        },
        subscriptionTier: {
            type: String,
            default: 'BASIC',
            enum: ['BASIC', 'PRO'],
        },
        preferences: {
            _id: false,
            currency: {
                type: String,
                default: 'INR',
                enum: ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'SGD'],
            },
            decimalPlaces: {
                type: Number,
                default: 2,
                min: 0,
                max: 4,
            },
            theme: {
                type: String,
                default: 'dark',
                enum: ['dark', 'light', 'system'],
            },
            accentColor: {
                type: String,
                default: 'lightblue',
                enum: ['lightblue', 'tomato', 'orange', 'mint', 'brown'],
            },
        },
    },
    {
        timestamps: true,
    }
)

export default mongoose.model('User', userSchema)
