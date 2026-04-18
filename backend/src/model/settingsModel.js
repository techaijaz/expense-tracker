import mongoose, { Schema } from 'mongoose'

const settingsSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
            index: true,
        },
        language: {
            type: String,
            enum: ['en', 'hi'],
            default: 'en',
        },
        currency: {
            type: String,
            enum: ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'SGD', 'AED', 'CNY'],
            default: 'INR',
        },
        dateFormat: {
            type: String,
            enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY/MM/DD'],
            default: 'DD/MM/YYYY',
        },
        decimalPlaces: {
            type: Number,
            default: 2,
            min: 0,
            max: 4,
        },
        theme: {
            type: String,
            enum: ['dark', 'light', 'system'],
            default: 'dark',
        },
        accentColor: {
            type: String,
            enum: ['lightblue', 'tomato', 'orange', 'mint', 'brown', 'purple', 'green', 'pink'],
            default: 'lightblue',
        },
        fiscalYear: {
            type: String,
            enum: ['APR-MAR', 'JAN-DEC'],
            default: 'APR-MAR',
        },
    },
    {
        timestamps: true,
    }
)

export default mongoose.model('Settings', settingsSchema)
