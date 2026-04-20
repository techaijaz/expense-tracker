import * as z from 'zod';
export default {
  catagorySchema: z.object({
    name: z.string().min(1, 'Category name is required'),
  }),
};
