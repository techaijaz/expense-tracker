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
    // phone: Joi.string().min(4).max(20).required(),
    password: Joi.string().min(8).max(72).required().trim(),
    //.regex(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/),
    //consent: Joi.boolean().required().valid(true),
})

export const validationLoginBody = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(72).required().trim(),
    //.regex(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/),
})

export const validationAccountBody = Joi.object({
    name: Joi.string().required().min(3).max(72).trim(),
    type: Joi.string().valid('BANK', 'CASH', 'CREDIT_CARD', 'INVESTMENT', 'BUSINESS').required(),
    balance: Joi.number().default(0),
    currency: Joi.string().default('INR'),
    isActive: Joi.boolean().default(true),
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
