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
import { restrictDecimals } from '@/utils/format';

const FundTransfer = ({ open, setOpen, fromAccountId }) => {
  const dispatch = useDispatch();
  const { accounts } = useSelector((state) => state.accounts);
  const preferences = useSelector(
    (state) => state.auth.user?.user?.preferences,
  );
  const { decimalPlaces = 2 } = preferences || {};

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

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent className="bg-card rounded-xl border border-secondary-container p-8 shadow-2xl w-full max-w-md">
        <DialogHeader>
          <DialogTitle className="text-on-surface text-xl font-bold font-headline tracking-tighter">
            Fund Transfer
          </DialogTitle>
          <DialogDescription className="text-on-surface-variant mt-1 text-sm">
            Please enter the amount you wish to transfer and select the account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
          {/* From Account Display */}
          <div className="bg-surface-container-low p-4 rounded-lg border border-secondary-container">
            <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-1 block">
              From Account
            </label>
            <p className="text-on-surface font-semibold text-lg font-headline">
              {accounts.find((account) => account._id === fromAccountId)
                ?.name || 'N/A'}
            </p>
          </div>

          {/* To Account Dropdown */}
          <div className="space-y-1.5">
            <label
              htmlFor="toAccountId"
              className="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-on-surface-variant ml-1 block"
            >
              To Account
            </label>
            <select
              {...register('toAccountId', {
                required: 'Please select an account',
              })}
              id="toAccountId"
              className={`w-full bg-secondary-container border ${
                errors.toAccountId
                  ? 'border-error'
                  : 'border-secondary-container'
              } rounded-lg p-3.5 text-on-surface outline-none focus:ring-2 focus:ring-primary/40 appearance-none`}
            >
              <option value="">Select an account</option>
              {accounts &&
                accounts.map(
                  (account) =>
                    account._id !== fromAccountId && (
                      <option key={account._id} value={account._id}>
                        {account.name}
                      </option>
                    ),
                )}
            </select>
            {errors.toAccountId && (
              <p className="text-error mt-2 text-xs font-semibold">
                {errors.toAccountId.message}
              </p>
            )}
          </div>

          {/* Amount Input */}
          <div className="space-y-1.5">
            <label
              htmlFor="amount"
              className="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-on-surface-variant ml-1 block"
            >
              Amount
            </label>
            <input
              id="amount"
              type="number"
              placeholder={`0.${'0'.repeat(decimalPlaces)}`}
              className={`w-full bg-secondary-container border ${
                errors.amount ? 'border-error' : 'border-secondary-container'
              } rounded-lg p-3.5 text-on-surface outline-none focus:ring-2 focus:ring-primary/40`}
              {...register('amount')}
              onInput={(e) => {
                e.target.value = restrictDecimals(
                  e.target.value,
                  decimalPlaces,
                );
              }}
              step={1 / Math.pow(10, decimalPlaces)}
            />
            {errors.amount && (
              <p className="text-error mt-2 text-xs font-semibold">
                {errors.amount.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex space-x-2">
            <button
              type="submit"
              className={`bg-primary text-on-primary rounded-lg p-3 font-bold text-sm tracking-tight shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex-1 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={loading}
            >
              {loading ? (
                <span className="animate-pulse">Processing...</span>
              ) : (
                'Transfer Funds'
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FundTransfer;
