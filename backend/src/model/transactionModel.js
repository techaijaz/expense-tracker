import mongoose from 'mongoose'

const transactionSchema = new mongoose.Schema(
    {
        ledgerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Ledger',
            required: true,
            index: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            index: true,
            required: true,
        },
        accountId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Account',
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: ['DEBIT', 'CREDIT'],
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        balanceSnapshot: {
            type: Number,
        },
        note: {
            type: String,
            trim: true,
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

// Compound Index on accountId + createdAt
transactionSchema.index({ accountId: 1, createdAt: -1 })

export default mongoose.model('Transaction', transactionSchema)
