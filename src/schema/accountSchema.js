import * as z from 'zod';

export default {
  addAccountSchema: z
    .object({
      type: z.string().min(1, { message: 'Account type is required' }),
      name: z.string().min(1, { message: 'Account name is required' }).max(50, {
        message: 'Account name must be at most 50 characters long',
      }),
      accountNumber: z.string().optional(), // Make it optional initially
      balance: z
        .number()
        .min(0, { message: 'Balance must be greater than or equal to 0' }),
    })
    .refine(
      (data) => {
        if (data.type !== 'Cash' && !data.accountNumber) {
          return false;
        }
        return true;
      },
      {
        message: 'Account number is required for non-Cash account types',
        path: ['accountNumber'], // Specify the field for error messages
      }
    ),
  amountSchema: z.object({
    amount: z
      .number()
      .min(1, { message: 'Amount must be greater than or equal to 0' })
      .max(10000, { message: 'Amount must be at most 10000' }),
    toAccountId: z.string().min(1, { message: 'Account is required' }),
  }),
};
