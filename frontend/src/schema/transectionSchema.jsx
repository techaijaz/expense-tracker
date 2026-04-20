import * as z from 'zod';

export default {
  // Zod Validation Schema
  addTransectionSchema: z.object({
    date: z.string().min(1, 'Date is required'),
    account: z.string().min(1, 'Account is required'),
    amount: z
      .number({ invalid_type_error: 'Amount must be a number' })
      .min(0.01, 'Amount must be greater than 0'),
    description: z
      .string()
      .min(1, 'Description is required')
      .max(255, 'Description must be at most 255 characters'),
    category: z
      .string()
      .min(1, 'Category is required')
      .max(255, 'Category must be at most 255 characters'),
  }),
};
