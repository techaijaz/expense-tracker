import mongoose from 'mongoose'

const creditCardCycleSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true }, // Must be of type CREDIT_CARD
        statementDay: { type: Number, required: true }, // Day of month (1-31)
        dueDay: { type: Number, required: true }, // Day of month (1-31)
        lastStatementBalance: { type: Number, default: 0 },
        isAutoPay: { type: Boolean, default: false },
    },
    { timestamps: true }
)

export default mongoose.model('CreditCardCycle', creditCardCycleSchema)
