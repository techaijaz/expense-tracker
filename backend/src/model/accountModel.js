import mongoose from 'mongoose'

const accountSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        type: {
            type: String,
            enum: ['BANK', 'CASH', 'CREDIT_CARD', 'INVESTMENT', 'WALLET'],
            required: true,
        },
        isCash: {
            type: Boolean,
            default: false,
        },
        accountNumber: {
            type: String,
            trim: true,
            default: '',
        },
        balance: {
            type: Number,
            default: 0,
            required: true,
        },
        creditLimit: {
            type: Number,
            default: 0,
        },
        statementDay: {
            type: Number,
            default: null,
        },
        dueDay: {
            type: Number,
            default: null,
        },
        minPaymentPercent: {
            type: Number,
            default: 5,
        },
        currency: {
            type: String,
            default: 'INR',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isDefault: {
            type: Boolean,
            default: false,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform: function (doc, ret) {
                delete ret.__v
                delete ret.isDeleted
                return ret
            },
        },
    }
)

export default mongoose.model('Account', accountSchema)
