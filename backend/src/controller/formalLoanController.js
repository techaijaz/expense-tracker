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
        try {
            const result = await databseService.runInTransaction(async (session) => {
                const { error, value } = validateJoiSchema(validationFormalLoanBody, req.body)
                if (error) throw { status: 422, message: error }

                const userId = req.authenticatedUser._id
                const { bankName, loanType, principal, interestRate, tenureMonths, startDate, associatedAccountId } = value

                const emiAmount = loanUtils.calculateEMI(principal, interestRate, tenureMonths)
                const schedule = loanUtils.generateAmortizationSchedule(principal, interestRate, tenureMonths, new Date(startDate))

                const totalRepayment = emiAmount * tenureMonths
                const totalInterest = totalRepayment - principal

                const loanData = {
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
                    outstandingBalance: principal
                }

                if (associatedAccountId && associatedAccountId.trim() !== '') {
                    loanData.associatedAccountId = associatedAccountId
                }

                const newLoan = new formalLoanModel(loanData)
                const savedLoan = await newLoan.save({ session })

                const scheduleEntries = schedule.map(item => ({
                    userId,
                    loanId: savedLoan._id,
                    ...item
                }))

                await loanScheduleModel.insertMany(scheduleEntries, { session })
                return savedLoan
            })

            httpResponse(req, res, 201, 'Formal loan created and schedule generated', result)
        } catch (error) {
            if (error.status) {
                return httpError(next, error.message, req, error.status)
            }
            httpError(next, error, req, 500)
        }
    },

    getLoans: async (req, res, next) => {
        try {
            const loans = await formalLoanModel.find({ userId: req.authenticatedUser._id, isDeleted: false })
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
                userId: req.authenticatedUser._id,
                accountId: req.body.accountId || loan.associatedAccountId,
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
    },

    prepayLoan: async (req, res, next) => {
        try {
            const { loanId, amount, accountId, date = new Date() } = req.body
            const loan = await formalLoanModel.findById(loanId)
            if (!loan) return httpError(next, new Error('Loan not found'), req, 404)
            if (amount > loan.outstandingBalance) return httpError(next, new Error('Prepayment amount exceeds outstanding balance'), req, 400)

            // 1. Create Ledger Transaction
            const result = await databseService.createTransaction({
                userId: req.authenticatedUser._id,
                accountId,
                type: 'repayment',
                amount,
                title: `Prepayment - ${loan.bankName}`,
                date,
                debtType: 'REPAY_OUT',
                loanId: loan._id,
                notes: `Bulk Principal Prepayment for ${loan.bankName}`
            })

            // 2. Update Loan Balance
            loan.outstandingBalance -= amount
            if (loan.outstandingBalance <= 0) {
                loan.outstandingBalance = 0
                loan.status = 'CLOSED'
            }
            await loan.save()

            // 3. Recalculate Schedule if loan still active
            if (loan.status === 'ACTIVE') {
                // Remove all pending installments
                await loanScheduleModel.deleteMany({ loanId: loan._id, status: 'PENDING' })

                // Generate new schedule
                // First, find the last paid installment number to continue from
                const lastPaid = await loanScheduleModel.findOne({ loanId: loan._id, status: 'PAID' }).sort({ installmentNo: -1 })
                const nextInstNo = (lastPaid?.installmentNo || 0) + 1
                const nextDueDate = dayjs(lastPaid?.dueDate || loan.startDate).add(1, 'month').toDate()

                const newSchedule = loanUtils.recalculateScheduleAfterPrepayment(
                    loan.outstandingBalance,
                    loan.interestRate,
                    loan.emiAmount,
                    nextDueDate,
                    nextInstNo
                )

                const scheduleEntries = newSchedule.map(item => ({
                    userId: req.authenticatedUser._id,
                    loanId: loan._id,
                    ...item
                }))

                await loanScheduleModel.insertMany(scheduleEntries)
            } else {
                // If closed, just remove all pending
                await loanScheduleModel.deleteMany({ loanId: loan._id, status: 'PENDING' })
            }

            httpResponse(req, res, 200, 'Prepayment processed and schedule updated', {
                loan,
                updatedAccounts: result.updatedAccounts
            })
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    simulatePrepayment: async (req, res, next) => {
        try {
            const { loanId, extraAmount } = req.body
            const loan = await formalLoanModel.findById(loanId)
            if (!loan) return httpError(next, new Error('Loan not found'), req, 404)

            const currentOutstanding = loan.outstandingBalance
            const newOutstanding = Math.max(0, currentOutstanding - extraAmount)
            
            // Get current pending count
            const currentPendingCount = await loanScheduleModel.countDocuments({ loanId, status: 'PENDING' })
            
            // Simulate new schedule
            const lastPaid = await loanScheduleModel.findOne({ loanId, status: 'PAID' }).sort({ installmentNo: -1 })
            const nextInstNo = (lastPaid?.installmentNo || 0) + 1
            const nextDueDate = dayjs(lastPaid?.dueDate || loan.startDate).add(1, 'month').toDate()

            const simulatedSchedule = loanUtils.recalculateScheduleAfterPrepayment(
                newOutstanding,
                loan.interestRate,
                loan.emiAmount,
                nextDueDate,
                nextInstNo
            )

            const newPendingCount = simulatedSchedule.length
            const emisSaved = Math.max(0, currentPendingCount - newPendingCount)
            
            // Interest saved calculation:
            // Current Pending Total Interest (needs to be calculated from actual pending records)
            const currentPendingRecords = await loanScheduleModel.find({ loanId, status: 'PENDING' })
            const currentInterestTotal = currentPendingRecords.reduce((s, r) => s + r.interestComponent, 0)
            const newInterestTotal = simulatedSchedule.reduce((s, r) => s + r.interestComponent, 0)
            const interestSaved = Math.max(0, currentInterestTotal - newInterestTotal)

            httpResponse(req, res, 200, 'Simulation completed', {
                currentOutstanding,
                newOutstanding,
                emisSaved,
                interestSaved,
                newTenureMonths: newPendingCount
            })
        } catch (error) {
            httpError(next, error, req, 500)
        }
    }
}

