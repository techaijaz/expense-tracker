import Joi from 'joi'

export const validateJoiSchema = (schema, value) => {
    const result = schema.validate(value)
    return {
        value: result.value,
        error: result.error?.message,
    }
}

export const validationRegisterBody = Joi.object({
    name: Joi.string().required().min(3).max(72).trim(),
    email: Joi.string().email().required(),
    // phone: Joi.string().min(4).max(20).required(),
    password: Joi.string().min(8).max(72).required().trim(),
    //.regex(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/),
    consent: Joi.boolean().required().valid(true),
})

export const validationLoginBody = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(72).required().trim(),
    //.regex(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/),
})

export const validationAccountBody = Joi.object({
    user: Joi.string().required(),
    name: Joi.string().required().min(3).max(72).trim(),
    accountNumber: Joi.string().when('type', {
        is: Joi.string().valid('Cash'),
        then: Joi.optional().allow(null, ''), // Allow optional or empty for "Cash"
        otherwise: Joi.required(), // Require for other types
    }),
    type: Joi.string().valid('Cash', 'Bank account', 'Credit card', 'Debt', 'Investment', 'Business').required(),
    balance: Joi.number().default(0),
    status: Joi.boolean().default(true),
    isDefault: Joi.boolean().default(false),
})

export const validationAmountBody = Joi.object({
    amount: Joi.number().required(),
})

export const validationTransferBody = Joi.object({
    amount: Joi.number().required(),
    fromAccountId: Joi.string().required(),
    toAccountId: Joi.string().required(),
})

export const validationCategoryBody = Joi.object({
    name: Joi.string().required().min(3).max(72).trim(),
})

export const validationTransectionBody = Joi.object({
    date: Joi.string().required(),
    account: Joi.string().required(),
    type: Joi.string().valid('expense', 'income', 'transfer', 'debt', 'investment', 'business').required(),
    amount: Joi.number().required(),
    description: Joi.string().min(3).max(72).trim().when('type', {
        is: 'income',
        then: Joi.required(),
        otherwise: Joi.optional(),
    }),
    category: Joi.string().min(3).max(72).trim().when('type', {
        is: 'expense,income',
        then: Joi.required(),
        otherwise: Joi.optional(),
    }),
})
