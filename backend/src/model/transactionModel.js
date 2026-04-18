import mongoose from 'mongoose'

const transactionSchema = new mongoose.Schema(
    {
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
        targetAccountId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Account',
            index: true,
            required: false, // Only for transfers
        },
        type: {
            type: String,
            enum: ['expense', 'income', 'transfer', 'debt', 'repayment'],
            required: true,
            index: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        date: {
            type: Date,
            default: Date.now,
            index: true,
        },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            index: true,
            required: false,
        },
        partyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Party',
            index: true,
            required: false,
        },
        balanceSnapshot: {
            type: Number,
        },
        targetBalanceSnapshot: {
            type: Number,
        },
        notes: {
            type: String,
            trim: true,
        },
        tags: [
            {
                type: String,
                trim: true,
            },
        ],
        billUrl: {
            type: String,
        },
        pendingStatus: {
            type: Boolean,
            default: false,
        },
        loanId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Loan',
            index: true,
        },
        recurringId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Recurring',
            index: true,
        },
        debtType: {
            type: String,
            enum: ['LENT', 'BORROWED', 'REPAYMENT_IN', 'REPAYMENT_OUT', null, ''],
            default: null,
        },
        dueDate: {
            type: Date,
        },
        interestRate: {
            type: Number,
            default: 0,
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

// Compound Index on accountId + date
transactionSchema.index({ accountId: 1, date: -1 })
// Index for finding transfers in target account
transactionSchema.index({ targetAccountId: 1, date: -1 })

export default mongoose.model('Transaction', transactionSchema)

