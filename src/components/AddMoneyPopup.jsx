/* eslint-disable react/prop-types */
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import accountSchema from '@/schema/accountSchema';
import useApi from '@/hooks/useApi';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { useDispatch } from 'react-redux';
import { updateAccount } from '@/redux/accountSlice';

const AddMoneyPopup = ({ open, setOpen, accountId }) => {
  const dispatch = useDispatch();
  const { data, error, loading, makeRequest } = useApi();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset, // To reset the form after submission
  } = useForm({
    resolver: zodResolver(accountSchema.amountSchema),
    defaultValues: { amount: 0 },
  });

  const onSubmit = (formData) => {
    // Manually parse the amount to ensure it's a number
    const amount = parseFloat(formData.amount);
    makeRequest({
      url: `/account/add-amount/${accountId}`,
      method: 'put',
      data: { amount },
    });
  };

  useEffect(() => {
    if (error) {
      toast.error(error || 'Failed to add money. Please try again.');
    }
  }, [error]);

  useEffect(() => {
    if (data) {
      toast.success(data.message || 'Money added successfully.');
      dispatch(updateAccount({ id: accountId, updatedAccount: data }));
      reset(); // Reset the form after successful submission
      setOpen(false); // Close the dialog
    }
  }, [data, reset, setOpen, accountId, dispatch]);

  const closeDialog = () => {
    setOpen(false);
    reset(); // Reset the form when the dialog is closed
  };

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent className="bg-white dark:bg-gray-800 rounded p-6">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-gray-100">
            Add Money
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Please enter the amount you wish to add.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
          <input
            type="number"
            placeholder="Enter amount"
            className={`border rounded p-2 w-full ${
              errors.amount ? 'border-red-500' : ''
            }`}
            {...register('amount', {
              valueAsNumber: true, // Automatically convert input to a number
            })}
          />
          {errors.amount && (
            <p className="text-red-500 dark:text-red-400 mt-2">
              {errors.amount.message}
            </p>
          )}

          <div className="mt-4 flex space-x-2">
            <button
              type="submit"
              className={`bg-blue-500 text-white rounded p-2 flex-1 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={loading} // Disable button while loading
            >
              {loading ? (
                <span className="animate-spin">Loading...</span>
              ) : (
                'Add'
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddMoneyPopup;
