import httpResponse from '../util/httpResponse.js'
import httpError from '../util/httpError.js'
import databseService from '../service/databseService.js'
import responceseMessage from '../constent/responceseMessage.js'
import { validateJoiSchema, validationAccountBody, validationAmountBody, validationTransferBody } from '../service/validationService.js'

export default {
    createAccount: async (req, res, next) => {
        try {
            const { body } = req

            // * body validation
            const { error, value } = validateJoiSchema(validationAccountBody, body)
            if (error) {
                return httpError(next, error, req, 422)
            }

            const { user, name, accountNumber, type, balance, status, isDefault } = value

            // * create account
            const payload = {
                user,
                name,
                accountNumber,
                type,
                balance,
                status,
                isDefault,
            }

            const accounts = await databseService.getAccountsByUserId(user)
            if (accounts.length === 0) {
                payload.isDefault = true
                payload.status = true
            }
            // * check if account is cash account\
            if (type === 'Cash') {
                const account = await databseService.findAccountByAccountType(type)
                if (account) {
                    return httpError(next, responceseMessage.CASH_ACCOUNT_FOUND, req, 422)
                }
            }
            // * check if account already exist using
            const account = await databseService.findAccountByAccountNumber(accountNumber)
            if (account) {
                return httpError(next, responceseMessage.ALREADY_EXIST('Account', accountNumber), req, 422)
            }
            // * create account
            const newAccount = await databseService.createAccount(payload)

            httpResponse(req, res, 201, responceseMessage.SUCCESS, newAccount)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },
    getAllAccounts: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id // Assuming user ID is stored in req.user

            const accounts = await databseService.getAccountsByUserId(userId)

            if (!accounts) {
                return httpError(next, 'No accounts found', req, 404)
            }

            httpResponse(req, res, 200, responceseMessage.SUCCESS, accounts)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },
    updateAccount: async (req, res, next) => {
        try {
            const { id } = req.params
            const { body } = req

            // * body validation
            const { error, value } = validateJoiSchema(validationAccountBody, body)
            if (error) {
                return httpError(next, error, req, 422)
            }

            const { name, accountNumber, type, balance, status, isDefault } = value

            const payload = {
                name,
                accountNumber,
                type,
                balance,
                status,
                isDefault,
            }

            // * check if account is cash account
            if (type === 'Cash') {
                const account = await databseService.findAccountByAccountType(type)

                if (account && account._id.toString() !== id) {
                    return httpError(next, responceseMessage.CASH_ACCOUNT_FOUND, req, 422)
                }
            }

            // * check if account already exist using
            const account = await databseService.fiendAccountById(id)

            // * check if account is default
            if (account?.isDefault && !status) {
                httpError(next, 'Cannot deactivate default account', req, 422)
            }

            //* unmark all account as default
            const accounts = await databseService.getAccountsByUserId(account.user)
            accounts.forEach(async (account) => {
                const payload = {
                    isDefault: false,
                }
                await databseService.updateAccount(account._id, payload)
            })

            const acc = accounts.filter((account) => account.status)
            if (acc.length === 1) {
                payload.isDefault = true
                payload.status = true
            }

            if (account && account._id.toString() !== id) {
                return httpError(next, responceseMessage.ALREADY_EXIST('Account', accountNumber), req, 422)
            }

            await databseService.updateAccount(id, payload)
            const retaccts = await databseService.getAccountsByUserId(account.user)

            httpResponse(req, res, 200, responceseMessage.SUCCESS, retaccts)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },
    addAmount: async (req, res, next) => {
        try {
            const { id } = req.params
            const { body } = req

            // * body validation
            const { error, value } = validateJoiSchema(validationAmountBody, body)
            if (error) {
                return httpError(next, error, req, 422)
            }

            const { amount } = value

            // * get account by id
            const account = await databseService.fiendAccountById(id)
            if (!account) {
                httpError(next, responceseMessage.NOT_FOUND('Account'), req, 404)
            }

            // * update ammount
            const newBalance = account.balance + amount

            // * update account
            const payload = {
                balance: newBalance,
            }

            const updatedAccount = await databseService.addAmount(id, payload)

            httpResponse(req, res, 200, responceseMessage.SUCCESS, updatedAccount)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },
    transferFund: async (req, res, next) => {
        try {
            //const { id } = req.params
            const { body } = req

            // * body validation
            const { error, value } = validateJoiSchema(validationTransferBody, body)
            if (error) {
                return httpError(next, error, req, 422)
            }

            const { amount, fromAccountId, toAccountId } = value

            // * get account by id
            const account = await databseService.fiendAccountById(fromAccountId)
            if (!account) {
                httpError(next, responceseMessage.NOT_FOUND('Account'), req, 404)
            }

            // * get account by account number
            const receiverAccount = await databseService.fiendAccountById(toAccountId)
            if (!receiverAccount) {
                httpError(next, responceseMessage.NOT_FOUND('Account'), req, 404)
            }

            // * update from ammount
            const newBalance = account.balance - amount

            // * update from account
            const payload = {
                balance: newBalance,
            }

            const updatedAccount = await databseService.addAmount(fromAccountId, payload)

            // * update to ammount
            const receiverNewBalance = receiverAccount.balance + amount

            // * update to account
            const receiverPayload = {
                balance: receiverNewBalance,
            }

            const receiverUpdatedAccount = await databseService.addAmount(toAccountId, receiverPayload)

            httpResponse(req, res, 200, responceseMessage.SUCCESS, [updatedAccount, receiverUpdatedAccount])
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },
    // Additional methods can be added here
}
