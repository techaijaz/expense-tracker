import accountModel from '../model/accountModel.js'
import assetModel from '../model/assetModel.js'
import formalLoanModel from '../model/formalLoanModel.js'
import loanModel from '../model/loanModel.js'
import netWorthSnapshotModel from '../model/netWorthSnapshotModel.js'
import httpError from '../util/httpError.js'
import httpResponse from '../util/httpResponse.js'
import mongoose from 'mongoose'
import dayjs from 'dayjs'

export default {
    getNetWorth: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id
            const today = dayjs().toDate()

            // 1. Get Accounts Balance (excluding CCdebt first or just sum all)
            // Note: CC accounts usually have negative balances or zero balance with a credit limit.
            // If they are represented as positive debt in the DB, we must subtract.
            const accounts = await accountModel.find({ userId, isDeleted: false })
            let liquidAssets = 0
            let creditCardDebt = 0
            
            accounts.forEach(acc => {
                if (acc.type === 'CREDIT_CARD') {
                    // Assuming balance for CC is negative (amount owed)
                    if (acc.balance < 0) creditCardDebt += Math.abs(acc.balance)
                } else {
                    liquidAssets += acc.balance
                }
            })

            // 2. Get Physical/Investment Assets
            const assets = await assetModel.find({ userId, isDeleted: false })
            let investmentAssets = 0
            let physicalAssets = 0
            
            assets.forEach(asset => {
                if (asset.type === 'INVESTMENT') {
                    investmentAssets += asset.currentValue
                } else {
                    physicalAssets += asset.currentValue
                }
            })

            // 3. Get Formal Loans (Outstanding)
            const formalLoans = await formalLoanModel.find({ userId, status: 'ACTIVE', isDeleted: false })
            const totalFormalLoans = formalLoans.reduce((sum, loan) => sum + loan.outstandingBalance, 0)

            // 4. Get Informal Debt (From loanModel - BORROWED)
            const informalLoans = await loanModel.find({ user: userId, status: 'PENDING', type: 'BORROWED', isDeleted: false })
            const totalInformalDebt = informalLoans.reduce((sum, loan) => sum + loan.amount, 0)

            const totalAssets = liquidAssets + investmentAssets + physicalAssets
            const totalLiabilities = creditCardDebt + totalFormalLoans + totalInformalDebt
            const netWorth = totalAssets - totalLiabilities

            const result = {
                date: today,
                totalAssets,
                totalLiabilities,
                netWorth,
                breakdown: {
                    liquidAssets,
                    investments: investmentAssets,
                    physicalAssets,
                    formalLoans: totalFormalLoans,
                    creditCardDebt,
                    informalDebt: totalInformalDebt,
                }
            }

            // Save a snapshot for historical tracking if one doesn't exist for today
            const startOfToday = dayjs().startOf('day').toDate()
            await netWorthSnapshotModel.findOneAndUpdate(
                { userId, date: { $gte: startOfToday } },
                { $set: { userId, date: today, ...result } },
                { upsert: true }
            )

            httpResponse(req, res, 200, 'Net Worth calculated', result)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    getHistory: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id
            const history = await netWorthSnapshotModel.find({ userId }).sort({ date: 1 })
            httpResponse(req, res, 200, 'Net Worth history retrieved', history)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    }
}
