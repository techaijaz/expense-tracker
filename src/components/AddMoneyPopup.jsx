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
import useFormat from '@/hooks/useFormat';
import { restrictDecimals } from '@/utils/format';

const AddMoneyPopup = ({ open, setOpen, accountId }) => {
  const dispatch = useDispatch();
  const { decimalPlaces } = useFormat();
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
      <DialogContent className="bg-card rounded-xl border border-secondary-container p-8 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-on-surface text-xl font-bold font-headline tracking-tighter">
            Add Money
          </DialogTitle>
          <DialogDescription className="text-on-surface-variant mt-1 text-sm">
            Please enter the amount you wish to add.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
          <div>
            <input
              type="number"
              placeholder={`0.${'0'.repeat(decimalPlaces)}`}
              className={`w-full bg-secondary-container border ${
                errors.amount ? 'border-error' : 'border-secondary-container'
              } rounded-lg p-3.5 text-on-surface outline-none focus:ring-2 focus:ring-primary/40`}
              {...register('amount')}
              onInput={(e) => {
                e.target.value = restrictDecimals(e.target.value, decimalPlaces);
              }}
              step={1 / Math.pow(10, decimalPlaces)}
            />
            {errors.amount && (
              <p className="text-error mt-2 text-xs font-semibold">
                {errors.amount.message}
              </p>
            )}
          </div>

          <div className="flex space-x-2">
            <button
              type="submit"
              className={`bg-primary text-on-primary rounded-lg p-3 font-bold text-sm tracking-tight shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex-1 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={loading} // Disable button while loading
            >
              {loading ? (
                <span className="animate-pulse">Processing...</span>
              ) : (
                'Add Funds'
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddMoneyPopup;
