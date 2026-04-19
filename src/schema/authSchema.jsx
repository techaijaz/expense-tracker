import * as z from 'zod';

export default {
  signUpSchema: () => {
    return z.object({
      firstName: z
        .string({ required_error: 'First name is required' })
        .min(3, {
          message: 'First name is required and must be at least 3 characters',
        })
        .max(72, {
          message: 'First name is required and must be at most 72 characters',
        }),
      lastName: z
        .string({ required_error: 'Last name is required' })
        .min(3, { message: 'Last name must be at least 3 characters' })
        .max(72, {
          message: 'Last name must be at most 72 characters',
        }),
      email: z
        .string({ required_error: 'Email is required' })
        .min(1, {
          message: 'Email is required',
        })
        .email({ message: 'Invalid email' }),
      password: z
        .string({ required_error: 'Password is required' })
        .min(1, {
          message: 'Password is required',
        })
        .min(8, { message: 'Password must be at least 8 characters' }),
    });
  },
  signInSchema: () => {
    return z.object({
      email: z
        .string({ required_error: 'Email is required' })
        .min(1, {
          message: 'Email is required',
        })
        .email({ message: 'Invalid email' }),
      password: z
        .string({ required_error: 'Password is required' })
        .min(8, { message: 'Password must be at least 8 characters' }),
    });
  },
  forgotPasswordSchema: () => {
    return z.object({
      email: z
        .string({ required_error: 'Email is required' })
        .min(1, { message: 'Email is required' })
        .email({ message: 'Invalid email' }),
    });
  },
  resetPasswordSchema: () => {
    return z.object({
      password: z
        .string({ required_error: 'Password is required' })
        .min(8, { message: 'Password must be at least 8 characters' }),
      confirmPassword: z
        .string({ required_error: 'Please confirm your password' })
        .min(8, { message: 'Password must be at least 8 characters' }),
    }).refine((data) => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ["confirmPassword"],
    });
  },
};
