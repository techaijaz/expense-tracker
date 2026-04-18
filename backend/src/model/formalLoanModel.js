import mongoose from 'mongoose'

const formalLoanSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        bankName: { type: String, required: true },
        loanType: { type: String, enum: ['HOME', 'CAR', 'PERSONAL', 'EDUCATION', 'BUSINESS', 'OTHER'], default: 'PERSONAL' },
        principal: { type: Number, required: true },
        interestRate: { type: Number, required: true }, // Annual rate
        tenureMonths: { type: Number, required: true },
        startDate: { type: Date, required: true },
        emiAmount: { type: Number, required: true },
        totalRepayment: { type: Number },
        totalInterest: { type: Number },
        outstandingBalance: { type: Number },
        associatedAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
        status: { type: String, enum: ['ACTIVE', 'CLOSED'], default: 'ACTIVE' },
        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
)

export default mongoose.model('FormalLoan', formalLoanSchema)
