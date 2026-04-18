import userModel from '../model/userModel.js'
import settingsModel from '../model/settingsModel.js'
import accountModel from '../model/accountModel.js'
import httpResponse from '../util/httpResponse.js'
import httpError from '../util/httpError.js'
import dayjs from 'dayjs'

export default {
    complete: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id
            const { preferences, account, activateTrial } = req.body

            // 1. Update Preferences (or create if not exists)
            if (preferences) {
                await settingsModel.findOneAndUpdate(
                    { userId },
                    { $set: preferences },
                    { upsert: true, new: true }
                )
            }

            // 2. Create Bank Account (Optional)
            if (account && account.name) {
                if (account.name.trim().toLowerCase() === 'cash') {
                    return httpError(next, new Error('A Cash account is already active. Please name your bank account differently.'), req, 400)
                }
                
                await accountModel.create({
                    userId,
                    name: account.name,
                    type: account.type || 'BANK',
                    accountNumber: account.accountNumber || '',
                    balance: account.balance || 0,
                    currency: preferences?.currency || 'INR'
                })
            }

            // 3. Mark Onboarding Done
            const updatePayload = { onboardingDone: true }
            
            // 4. Handle Pro Trial Activation
            if (activateTrial) {
                updatePayload.plan = 'pro'
                updatePayload.trialStart = new Date()
                updatePayload.trialEnd = dayjs().add(14, 'days').toDate()
                updatePayload.isTrialUsed = true
            }

            const user = await userModel.findByIdAndUpdate(
                userId,
                { $set: updatePayload },
                { new: true }
            )

            httpResponse(req, res, 200, 'Onboarding completed successfully', {
                user: {
                    onboardingDone: user.onboardingDone,
                    plan: user.plan
                }
            })
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    skip: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id
            
            // 1. Create Default Cash Account if not exists
            const cashAccount = await accountModel.findOne({ userId, isCash: true })
            if (!cashAccount) {
                await accountModel.create({
                    userId,
                    name: 'Cash',
                    type: 'CASH',
                    isCash: true,
                    balance: 0,
                    currency: 'INR',
                    isDefault: true
                })
            }

            // 2. Ensure Default Settings exist
            await settingsModel.findOneAndUpdate(
                { userId },
                { $setOnInsert: { userId } },
                { upsert: true, new: true }
            )

            // 3. Mark Onboarding Done
            const user = await userModel.findByIdAndUpdate(
                userId,
                { $set: { onboardingDone: true } },
                { new: true }
            )

            httpResponse(req, res, 200, 'Onboarding skipped. Default Cash account created.', {
                user: {
                    onboardingDone: user.onboardingDone
                }
            })
        } catch (error) {
            httpError(next, error, req, 500)
        }
    }
}
