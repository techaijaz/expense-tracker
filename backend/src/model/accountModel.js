import mongoose from 'mongoose'

const accountSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        accountNumber: {
            type: String,
        },
        type: {
            type: String,
            enum: ['Cash', 'Bank account', 'Credit card', 'Debt', 'Investment', 'Business'],
            required: true,
        },
        balance: {
            type: Number,
            default: 0,
        },
        status: {
            type: Boolean,
            default: true,
        },
        isDefault: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
)

export default mongoose.model('Account', accountSchema)
