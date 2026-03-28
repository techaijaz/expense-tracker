import mongoose from 'mongoose'

const ledgerSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            index: true,
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        totalAmount: {
            type: Number,
            required: true,
            min: 0,
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
            required: true,
        },
        partyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Party',
            index: true,
        },
        ledgerType: {
            type: String,
            enum: ['NORMAL', 'TRANSFER', 'DEBT_GIVEN', 'DEBT_TAKEN', 'DEBT_REPAYMENT'],
            required: true,
        },
        isDoubleEntry: {
            type: Boolean,
            default: false,
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

// Compound Index on userId + date
ledgerSchema.index({ userId: 1, date: -1 })

// Post-save middleware to handle soft-delete cascading to transactions
ledgerSchema.post('save', async function (doc, next) {
    if (doc.isDeleted) {
        await mongoose.model('Transaction').updateMany({ ledgerId: doc._id }, { $set: { isDeleted: true } })
    }
    next()
})

// Also handle findOneAndUpdate for soft delete update
ledgerSchema.post('findOneAndUpdate', async function (doc, next) {
    if (doc && doc.isDeleted) {
        await mongoose.model('Transaction').updateMany({ ledgerId: doc._id }, { $set: { isDeleted: true } })
    }
    next()
})

export default mongoose.model('Ledger', ledgerSchema)
