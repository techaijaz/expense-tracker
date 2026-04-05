import Joi from 'joi'

export const validateJoiSchema = (schema, value) => {
    const result = schema.validate(value)
    return {
        value: result.value,
        error: result.error?.message,
    }
}

export const validationRegisterBody = Joi.object({
    firstName: Joi.string().required().min(3).max(72).trim(),
    lastName: Joi.string().required().min(3).max(72).trim(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(72).required().trim(),
})

export const validationLoginBody = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(72).required().trim(),
})

export const validationAccountBody = Joi.object({
    name: Joi.string().required().min(3).max(72).trim(),
    type: Joi.string().valid('BANK', 'CASH', 'CREDIT_CARD', 'INVESTMENT', 'BUSINESS', 'WALLET').required(),
    accountNumber: Joi.string().allow(null, '').optional(),
    balance: Joi.number().default(0),
    creditLimit: Joi.number().optional().default(0),
    currency: Joi.string().default('INR'),
    isActive: Joi.boolean().default(true),
    isDefault: Joi.boolean().default(false),
})

export const validationCategoryBody = Joi.object({
    name: Joi.string().required().min(2).max(72).trim(),
    type: Joi.string().valid('INCOME', 'EXPENSE', 'TRANSFER').required(),
    parentId: Joi.string().allow(null, '').optional(),
    icon: Joi.string().allow(null, '').optional(),
})

export const validationPartyBody = Joi.object({
    name: Joi.string().required().min(2).max(72).trim(),
    relation: Joi.string().valid('FRIEND', 'FAMILY', 'VENDOR', 'CLIENT').required(),
    netDebt: Joi.number().default(0),
})

export const validationTransectionBody = Joi.object({
    date: Joi.string().required(),
    account: Joi.string().required(),
    type: Joi.string().valid('expense', 'income', 'transfer', 'debt', 'investment', 'business', 'DEBIT', 'CREDIT').required(),
    amount: Joi.number().required().min(0),
    description: Joi.string().min(3).max(72).trim().allow(null, '').optional(),
    category: Joi.string().min(3).max(72).trim().allow(null, '').optional(),
    partyId: Joi.string().optional().allow(null, ''),
    toAccountId: Joi.string().when('type', {
        is: 'transfer',
        then: Joi.required(),
        otherwise: Joi.optional().allow(null, ''),
    }),
    ledgerType: Joi.string().valid('NORMAL', 'TRANSFER', 'DEBT_GIVEN', 'DEBT_TAKEN', 'DEBT_REPAYMENT').optional().default('NORMAL'),
})

export const validationLoanBody = Joi.object({
    party: Joi.string().required(),
    accountId: Joi.string().required(),
    amount: Joi.number().required().min(1),
    type: Joi.string().valid('BORROWED', 'LENT').required(),
    dueDate: Joi.date().allow(null, '').optional(),
    interestRate: Joi.number().min(0).default(0),
})

export const validationChangePasswordBody = Joi.object({
    currentPassword: Joi.string().min(8).max(72).required().trim(),
    newPassword: Joi.string().min(8).max(72).required().trim(),
})

export const validationPreferencesBody = Joi.object({
    currency: Joi.string().valid('INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'SGD').optional(),
    decimalPlaces: Joi.number().min(0).max(4).optional(),
    theme: Joi.string().valid('dark', 'light', 'system').optional(),
    accentColor: Joi.string().valid('lightblue', 'tomato', 'orange', 'mint', 'brown').optional(),
})
