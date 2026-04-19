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
    consent: Joi.boolean().required(),
})

export const validationLoginBody = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(72).required().trim(),
})

export const validationForgotPasswordBody = Joi.object({
    email: Joi.string().email().required(),
})

export const validationResetPasswordBody = Joi.object({
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
    date: Joi.date().required(),
    accountId: Joi.string().required(),
    type: Joi.string().valid('expense', 'income', 'transfer', 'debt', 'repayment').required(),
    amount: Joi.number().required().min(0),
    title: Joi.string().min(2).max(100).trim().required(),
    description: Joi.string().max(500).trim().allow(null, '').optional(),
    categoryId: Joi.string().optional().allow(null, ''),
    partyId: Joi.string().optional().allow(null, ''),
    targetAccountId: Joi.string().when('type', {
        is: 'transfer',
        then: Joi.required(),
        otherwise: Joi.optional().allow(null, ''),
    }),
    notes: Joi.string().max(500).trim().allow(null, '').optional(),
    tags: Joi.array().items(Joi.string().trim()).optional(),
    billUrl: Joi.string().uri().allow(null, '').optional(),
    loanId: Joi.string().optional().allow(null, ''),
    recurringId: Joi.string().optional().allow(null, ''),
    debtType: Joi.string().optional().allow(null, ''),
    dueDate: Joi.date().optional().allow(null, ''),
    interestRate: Joi.number().optional().default(0),
})

export const validationLoanBody = Joi.object({
    party: Joi.string().required(),
    accountId: Joi.string().required(),
    amount: Joi.number().required().min(1),
    type: Joi.string().valid('BORROWED', 'LENT').required(),
    date: Joi.date().required(),
})

export const validationChangePasswordBody = Joi.object({
    currentPassword: Joi.string().min(8).max(72).required().trim(),
    newPassword: Joi.string().min(8).max(72).required().trim(),
})

export const validationPreferencesBody = Joi.object({
    currency: Joi.string().valid('INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'SGD', 'AED', 'CNY').optional(),
    dateFormat: Joi.string().valid('DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'YYYY/MM/DD', 'DD-MM-YYYY').optional(),
    decimalPlaces: Joi.number().min(0).max(4).optional(),
    theme: Joi.string().valid('dark', 'light', 'system').optional(),
    accentColor: Joi.string().valid('lightblue', 'tomato', 'orange', 'mint', 'brown', 'purple', 'green', 'pink').optional(),
    language: Joi.string().valid('en', 'hi').optional(),
    fiscalYear: Joi.string().valid('April-March', 'January-December').optional(),
})

export const validationSettingsBody = Joi.object({
    language: Joi.string().valid('en', 'hi').optional(),
    currency: Joi.string().valid('INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'SGD', 'AED', 'CNY').optional(),
    dateFormat: Joi.string().valid('DD-MM-YYYY', 'MM-DD-YYYY', 'YYYY-MM-DD', 'DD/MM/YYYY', 'MMM DD, YYYY').optional(),
    decimalPlaces: Joi.number().min(0).max(4).optional(),
    theme: Joi.string().valid('dark', 'light', 'system').optional(),
    accentColor: Joi.string().valid('lightblue', 'tomato', 'orange', 'mint', 'brown', 'purple', 'green', 'pink').optional(),
    fiscalYear: Joi.string().valid('April-March', 'January-December', 'July-June').optional(),
})

export const validationFormalLoanBody = Joi.object({
    bankName: Joi.string().required().min(2).max(100).trim(),
    loanType: Joi.string().valid('HOME', 'CAR', 'PERSONAL', 'EDUCATION', 'BUSINESS', 'OTHER').required(),
    principal: Joi.number().required().min(1),
    interestRate: Joi.number().required().min(0),
    tenureMonths: Joi.number().required().min(1),
    startDate: Joi.date().required(),
    associatedAccountId: Joi.string().optional().allow(null, ''),
})

export const validationBudgetBody = Joi.object({
    categoryId: Joi.string().required(),
    amount: Joi.number().required().min(1).max(100000000),
    period: Joi.string().valid('Weekly', 'Monthly', 'Quarterly', 'Yearly').default('Monthly'),
    alertThreshold: Joi.number().min(1).max(100).default(80).optional(),
    rollover: Joi.boolean().default(false).optional(),
    notes: Joi.string().max(250).allow(null, '').optional(),
})

export const validationRecurringBody = Joi.object({
    title: Joi.string().required().min(3).max(100).trim(),
    amount: Joi.number().required().min(1),
    type: Joi.string().valid('INCOME', 'EXPENSE', 'TRANSFER').required(),
    frequency: Joi.string().valid('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY').required(),
    startDate: Joi.date().required(),
    categoryId: Joi.string().optional().allow(null, ''),
    accountId: Joi.string().required(),
    toAccountId: Joi.string().optional().allow(null, ''),
    entryType: Joi.string().valid('auto', 'manual').default('auto'),
    notes: Joi.string().max(250).allow(null, '').optional(),
})

export const validationAssetBody = Joi.object({
    name: Joi.string().required().min(2).max(100).trim(),
    type: Joi.string().valid('CASH', 'BANK', 'INVESTMENT', 'REAL_ESTATE', 'VEHICLE', 'GOLD', 'OTHER').required(),
    currentValue: Joi.number().required().min(0),
})

