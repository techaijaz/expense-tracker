import * as z from 'zod';

const ACCOUNT_TYPES = ['CASH', 'BANK', 'CREDIT_CARD', 'INVESTMENT', 'WALLET'];
const ACCOUNT_NUMBER_TYPES = ['BANK', 'CREDIT_CARD']; // types that require account number

export default {
  addAccountSchema: z
    .object({
      type: z.enum(ACCOUNT_TYPES, { errorMap: () => ({ message: 'Invalid account type' }) }),
      name: z
        .string()
        .min(2, { message: 'Name must be at least 2 characters' })
        .max(50, { message: 'Name must be at most 50 characters' }),
      accountNumber: z.string().optional().refine((val) => !val || val.length <= 4, {
        message: 'Account number must be at most 4 digits',
      }),
      balance: z
        .preprocess((v) => (v === '' || v === undefined ? 0 : Number(v)), z.number())
        .refine((v) => v >= 0, { message: 'Balance cannot be negative' })
        .optional()
        .default(0),
      creditLimit: z
        .preprocess((v) => (v === '' || v === undefined ? 0 : Number(v)), z.number())
        .optional()
        .default(0),
    })
    .superRefine((data, ctx) => {
      // Account number required for BANK and CREDIT_CARD
      if (ACCOUNT_NUMBER_TYPES.includes(data.type)) {
        if (!data.accountNumber || data.accountNumber.trim().length !== 4) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['accountNumber'],
            message: 'Account number must be exactly 4 digits for Bank / Credit Card',
          });
        }
      }
    }),

  amountSchema: z.object({
    amount: z
      .number()
      .min(1, { message: 'Amount must be greater than 0' })
      .max(10000000, { message: 'Amount too large' }),
    toAccountId: z.string().min(1, { message: 'Account is required' }),
  }),
};
