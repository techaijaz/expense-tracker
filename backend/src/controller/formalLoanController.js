import formalLoanModel from '../model/formalLoanModel.js'
import loanScheduleModel from '../model/loanScheduleModel.js'
import databseService from '../service/databseService.js'
import accountModel from '../model/accountModel.js'
import { validateJoiSchema, validationFormalLoanBody } from '../service/validationService.js'
import httpError from '../util/httpError.js'
import httpResponse from '../util/httpResponse.js'
import loanUtils from '../util/loanUtils.js'
import mongoose from 'mongoose'
import dayjs from 'dayjs'

export default {
    createLoan: async (req, res, next) => {
        const session = await mongoose.startSession()
        session.startTransaction()
        try {
            const { error, value } = validateJoiSchema(validationFormalLoanBody, req.body)
            if (error) return httpError(next, error, req, 422)

            const { userId } = req.authenticatedUser
            const { bankName, loanType, principal, interestRate, tenureMonths, startDate, associatedAccountId } = value

            const emiAmount = loanUtils.calculateEMI(principal, interestRate, tenureMonths)
            const schedule = loanUtils.generateAmortizationSchedule(principal, interestRate, tenureMonths, new Date(startDate))

            const totalRepayment = emiAmount * tenureMonths
            const totalInterest = totalRepayment - principal

            const newLoan = new formalLoanModel({
                userId,
                bankName,
                loanType,
                principal,
                interestRate,
                tenureMonths,
                startDate,
                emiAmount,
                totalRepayment,
                totalInterest,
                outstandingBalance: principal,
                associatedAccountId
            })

            const savedLoan = await newLoan.save({ session })

            const scheduleEntries = schedule.map(item => ({
                userId,
                loanId: savedLoan._id,
                ...item
            }))

            await loanScheduleModel.insertMany(scheduleEntries, { session })

            await session.commitTransaction()
            session.endSession()

            httpResponse(req, res, 201, 'Formal loan created and schedule generated', savedLoan)
        } catch (error) {
            await session.abortTransaction()
            session.endSession()
            httpError(next, error, req, 500)
        }
    },

    getLoans: async (req, res, next) => {
        try {
            const loans = await formalLoanModel.find({ userId: req.authenticatedUser.userId, isDeleted: false })
            httpResponse(req, res, 200, 'Loans retrieved', loans)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    getLoanDetails: async (req, res, next) => {
        try {
            const { id } = req.params
            const loan = await formalLoanModel.findById(id)
            if (!loan) return httpError(next, new Error('Loan not found'), req, 404)

            const schedule = await loanScheduleModel.find({ loanId: id }).sort({ installmentNo: 1 })
            httpResponse(req, res, 200, 'Loan details retrieved', { loan, schedule })
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    payEMI: async (req, res, next) => {
        try {
            const { scheduleId } = req.body
            const installment = await loanScheduleModel.findById(scheduleId)
            if (!installment) return httpError(next, new Error('Installment not found'), req, 404)
            if (installment.status === 'PAID') return httpError(next, new Error('EMI already paid'), req, 400)

            const loan = await formalLoanModel.findById(installment.loanId)
            if (!loan) return httpError(next, new Error('Loan not found'), req, 404)

            // Create Transaction Entry using databseService (which handles its own session)
            const result = await databseService.createTransaction({
                userId: req.authenticatedUser.userId,
                accountId: loan.associatedAccountId,
                type: 'repayment',
                amount: installment.emiAmount,
                title: `EMI Payment - ${loan.bankName} (Inst#${installment.installmentNo})`,
                date: new Date(),
                debtType: 'REPAY_OUT',
                loanId: loan._id,
                notes: `EMI Repayment for ${loan.bankName}`
            })

            // Update Installment and Loan (These should ideally be inside the same transaction)
            // For now, aligning with databseService structure
            installment.status = 'PAID'
            installment.paidAt = new Date()
            installment.transactionId = result.transaction._id
            await installment.save()

            // Update Loan Outstanding Balance
            loan.outstandingBalance -= installment.principalComponent
            if (loan.outstandingBalance <= 0) {
                loan.outstandingBalance = 0
                loan.status = 'CLOSED'
            }
            await loan.save()

            httpResponse(req, res, 200, 'EMI payment processed successfully', { 
                loan, 
                installment,
                updatedAccounts: result.updatedAccounts 
            })
        } catch (error) {
            httpError(next, error, req, 500)
        }
    }
}

