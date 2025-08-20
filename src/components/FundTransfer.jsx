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
import { useDispatch, useSelector } from 'react-redux';
import { updateAccount } from '@/redux/accountSlice';

const FundTransfer = ({ open, setOpen, fromAccountId }) => {
  const dispatch = useDispatch();
  const { accounts } = useSelector((state) => state.accounts);

  const { data, error, loading, makeRequest } = useApi();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    getValues,
  } = useForm({
    resolver: zodResolver(accountSchema.amountSchema),
    defaultValues: { amount: 0, toAccountId: '' },
  });

  const onSubmit = (formData) => {
    const amount = parseFloat(formData.amount);
    makeRequest({
      url: `/account/transfer-funds`,
      method: 'post',
      data: { fromAccountId, toAccountId: formData.toAccountId, amount },
    });
  };

  useEffect(() => {
    if (error) {
      toast.error(error || 'Failed to transfer funds. Please try again.');
    }
  }, [error]);

  useEffect(() => {
    if (data) {
      const toAccountId = getValues('toAccountId'); // "test-input"
      toast.success(data.message || 'Funds transferred successfully.');
      dispatch(updateAccount({ id: fromAccountId, updatedAccount: data[0] }));
      dispatch(updateAccount({ id: toAccountId, updatedAccount: data[1] }));
      reset();
      setOpen(false);
    }
  }, [data, reset, setOpen, fromAccountId, dispatch, getValues]);

  const closeDialog = () => {
    setOpen(false);
    reset();
  };

  const renderAccountsDropdown = () => {
    return (
      <>
        <label
          htmlFor="toAccountId"
          className="text-gray-900 dark:text-gray-100"
        >
          To Account
        </label>
        <select
          {...register('toAccountId', {
            required: 'Please select an account',
          })}
          id="toAccountId"
          className={`border rounded p-2 w-full ${
            errors.toAccountId ? 'border-red-500' : ''
          }`}
        >
          <option value="">Select an account</option>
          {accounts &&
            accounts.map(
              (account) =>
                account._id !== fromAccountId && (
                  <option key={account._id} value={account._id}>
                    {account.name}
                  </option>
                )
            )}
        </select>
        {errors.toAccountId && (
          <p className="text-red-500 dark:text-red-400 mt-2">
            {errors.toAccountId.message}
          </p>
        )}
      </>
    );
  };

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent className="bg-white dark:bg-gray-800 rounded p-6">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-gray-100">
            Fund Transfer
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Please enter the amount you wish to transfer and select the account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          {/* From Account Display */}
          <div>
            <label className="text-gray-900 dark:text-gray-100">
              From Account
            </label>
            <p className="text-gray-600 dark:text-gray-400">
              {accounts.find((account) => account._id === fromAccountId)
                ?.name || 'N/A'}
            </p>
          </div>

          {/* To Account Dropdown */}
          <div>{renderAccountsDropdown()}</div>

          {/* Amount Input */}
          <div>
            <label
              htmlFor="amount"
              className="text-gray-900 dark:text-gray-100"
            >
              Amount
            </label>
            <input
              id="amount"
              type="number"
              placeholder="Enter amount"
              className={`border rounded p-2 w-full ${
                errors.amount ? 'border-red-500' : ''
              }`}
              {...register('amount', { valueAsNumber: true })}
            />
            {errors.amount && (
              <p className="text-red-500 dark:text-red-400 mt-2">
                {errors.amount.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="mt-4 flex space-x-2">
            <button
              type="submit"
              className={`bg-blue-500 text-white rounded p-2 flex-1 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={loading}
            >
              {loading ? (
                <span className="animate-spin">Loading...</span>
              ) : (
                'Transfer'
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FundTransfer;
