import mongoose from 'mongoose'

const netWorthSnapshotSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        date: { type: Date, required: true },
        totalAssets: { type: Number, required: true },
        totalLiabilities: { type: Number, required: true },
        netWorth: { type: Number, required: true },
        breakdown: {
            accounts: { type: Number, default: 0 },
            investments: { type: Number, default: 0 },
            physicalAssets: { type: Number, default: 0 },
            formalLoans: { type: Number, default: 0 },
            creditCardDebt: { type: Number, default: 0 },
            informalDebt: { type: Number, default: 0 },
        },
    },
    { timestamps: true }
)

export default mongoose.model('NetWorthSnapshot', netWorthSnapshotSchema)
