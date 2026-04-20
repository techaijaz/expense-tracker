import { z } from 'zod';

const addAccountSchema = z
  .object({
    name: z
      .string()
      .min(1, { message: 'Account name is required' })
      .max(50, { message: 'Account name must be at most 50 characters long' }),
    accountNumber: z.string().optional(), // Make it optional initially
    type: z
      .string()
      .min(1, { message: 'Account type is required' })
      .max(50, { message: 'Account type must be at most 50 characters long' }),
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
  );

export default addAccountSchema;
