import authSchema from '@/schema/authSchema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from './ui/button';
import { FcGoogle } from 'react-icons/fc';
import { Input } from './ui/input';
import { Link, useNavigate } from 'react-router-dom';
import api from '@/utils/httpMethods';
import { toast } from 'sonner';
function SignUp() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(authSchema.signUpSchema()),
  });

  const onSubmit = async (data) => {
    console.log('Form Data:', data);
    //
    try {
      const response = await api.post('/user/register', data);
      if (response.success) {
        toast.success(response.message || 'Registration successful!');
        // Optionally, redirect to the sign-in page or clear the form
        navigate('/');
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'An error occurred. Please try again later.'
      );
    }
  };
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      <div className="w-full max-w-sm md:w-1/3 mx-4 p-6 bg-white dark:bg-gray-800 shadow-md rounded-lg">
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 text-center mb-4">
          Create account
        </h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
          <Button
            className="w-full text-[#141414] bg-[#ffffff]  hover:text-[#353535] my-4"
            variant="outline"
            onClick={(e) => e.preventDefault()}
          >
            <FcGoogle className="w-5 mr-1" />
            Continue with Google
          </Button>
          <div className="flex justify-center border-b h-[13px] border-gray-300 mb-3">
            <span className="w-[40px] bg-white h-[27px] text-center font-semibold text-[#737373] text-base">
              OR
            </span>
          </div>
          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              First Name
            </label>
            <Input
              type="text"
              {...register('firstName')}
              placeholder="Enter your first name"
              className="w-full p-2 mt-1 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-500">
                {errors.firstName.message}
              </p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Last Name
            </label>
            <Input
              type="text"
              {...register('lastName')}
              placeholder="Enter your last name"
              className="w-full p-2 mt-1 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-500">
                {errors.lastName.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <Input
              type="email"
              {...register('email')}
              placeholder="Enter your email"
              className="w-full p-2 mt-1 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <Input
              type="password"
              {...register('password')}
              placeholder="Enter your password"
              className="w-full p-2 mt-1 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-2 text-white bg-green-500 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
          >
            Sign Up
          </button>
          <p className="text-xs text-[#737373] text-center">
            Have an account? <Link to="/">Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default SignUp;
