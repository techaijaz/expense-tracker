import * as z from 'zod';

export default {
  settingSchema: () => {
    return z.object({
      firstName: z
        .string({ required_error: 'First name is required' })
        .min(3, {
          message: 'First name is required and must be at least 3 characters',
        })
        .max(72, {
          message: 'First name is required and must be at most 72 characters',
        }),
      lastName: z.string({ required_error: 'Last name is required' }).max(72, {
        message: 'Last name is required and must be at most 72 characters',
      }),
      email: z
        .string({ required_error: 'Email is required' })
        .min(1, {
          message: 'Email is required',
        })
        .email({ message: 'Invalid email' }),
      phone: z.string({ required_error: 'Phone is required' }).min(1, {
        message: 'Phone is required',
      }),
      country: z.string({}),
      currency: z.string({}),
      appearance: z.string({}),
      language: z.string({}),
    });
  },
  passwordSchema: () => {
    return z.object({
      oldpassword: z
        .string({ required_error: 'Old Password is required' })
        .min(1, {
          message: 'Old Password is required',
        }),
      password: z
        .string({ required_error: 'Password is required' })
        .min(1, {
          message: 'Password is required',
        })
        .min(4, { message: 'Password must be at least 4 characters' }),
      confirmPassword: z
        .string({ required_error: 'Confirm Password is required' })
        .min(1, {
          message: 'Confirm Password is required',
        }),
    });
  },
};
