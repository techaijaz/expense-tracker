import mongoose from 'mongoose'

const loanScheduleSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        loanId: { type: mongoose.Schema.Types.ObjectId, ref: 'FormalLoan', required: true },
        installmentNo: { type: Number, required: true },
        dueDate: { type: Date, required: true },
        emiAmount: { type: Number, required: true },
        principalComponent: { type: Number, required: true },
        interestComponent: { type: Number, required: true },
        remainingBalance: { type: Number, required: true },
        status: { type: String, enum: ['PENDING', 'PAID'], default: 'PENDING' },
        paidAt: { type: Date },
        transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ledger' },
    },
    { timestamps: true }
)

export default mongoose.model('LoanSchedule', loanScheduleSchema)
