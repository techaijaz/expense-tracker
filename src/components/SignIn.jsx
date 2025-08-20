import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import authSchema from '@/schema/authSchema';
import { Button } from './ui/button';
import { FcGoogle } from 'react-icons/fc';
import { Input } from './ui/input';
import { Link, useNavigate } from 'react-router-dom';
import api from '@/utils/httpMethods';
import { useDispatch, useSelector } from 'react-redux';
import { setAuthUser } from '@/redux/authSlice';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { setAccounts } from '@/redux/accountSlice';
import { setCategories } from '@/redux/categorySlice';

function SignIn() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((store) => store.auth);
  const { accounts } = useSelector((state) => state.accounts);

  useEffect(() => {
    document.title = 'Sign In | Expense Tracker';
    // Only navigate if the user is logged in
    if (user?.user?._id) {
      navigate('/dashboard');
    }
  }, [navigate, user?.user, accounts.length]); // Use accounts.length to avoid unnecessary re-renders

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: zodResolver(authSchema.signInSchema()),
  });

  const onSubmit = async (data) => {
    try {
      const response = await api.post('/user/login', data);
      if (response.success) {
        setValue('email', '');
        setValue('password', '');
        dispatch(setAuthUser(response.data));
        dispatch(setAccounts(response.data.accounts));
        dispatch(setCategories(response.data.categories));
        navigate('/dashboard');
        toast.success(response.message || 'Login successful!');
      } else {
        toast.error(response.data.message || 'Login failed. Please try again.');
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
          Sign In
        </h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
          <Button
            className="w-full text-[#141414] bg-[#ffffff] hover:text-[#353535] my-4"
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
            Sign In
          </button>

          <p className="text-xs text-[#737373] text-center">
            {`Don't have an account?`} <Link to="/signup">Sign Up</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default SignIn;
