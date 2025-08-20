/* eslint-disable react/prop-types */
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import accountSchema from '@/schema/accountSchema';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addAccount, setAccounts } from '../redux/accountSlice';
import { toast } from 'sonner';
import useApi from '@/hooks/useApi';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

function AddAccounts({
  btnLabel = '+ Add',
  btnVariant = 'default',
  formData = {},
  isEdit = false,
}) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { accounts } = useSelector((state) => state.accounts);
  const { data, error, loading, makeRequest } = useApi();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDisableDialogOpen, setIsDisableDialogOpen] = useState(false); // For confirmation dialog
  const [accountType, setAccountType] = useState('Bank account');
  const [isDefault, setIsDefault] = useState(false); // Track if account is default
  const [isEnabled, setIsEnabled] = useState(true); // Track enable/disable state

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(accountSchema.addAccountSchema),
  });
  //const accountType = watch('type');
  useEffect(() => {
    if (isEdit) {
      setValue('name', formData.name);
      setValue('accountNumber', formData.accountNumber);
      setValue('balance', formData.balance);
      setValue('type', formData.type);
      setAccountType(formData.type);
      setIsDefault(formData.isDefault || false);
      setIsEnabled(formData.status);
    } else {
      setIsEnabled(true);
    }
  }, [isEdit, formData, setValue]);

  const onSubmit = async (data) => {
    if (loading) return;

    const payload = {
      user: user.user._id,
      name: data.name,
      accountNumber: data.accountNumber,
      type: accountType,
      balance: data.balance,
      isDefault,
      status: isEnabled,
    };

    const url = isEdit ? `/account/update/${formData._id}` : '/account/create';

    const method = isEdit ? 'put' : 'post';

    makeRequest({ url, method, data: payload });
  };

  useEffect(() => {
    if (error) {
      toast.error(error || 'Failed to save account. Please try again.');
    }
  }, [error]);

  useEffect(() => {
    if (data) {
      if (isEdit) {
        dispatch(setAccounts(data));
        toast.success('Account updated successfully!');
      } else {
        dispatch(addAccount(data));
        toast.success('Account added successfully!');
      }
      setIsDialogOpen(false);
    }
    reset();
  }, [data, formData.id, isEdit, dispatch, reset]);

  const handleDisableToggle = () => {
    if (!isEnabled) {
      setIsEnabled(true);
    } else {
      setIsDisableDialogOpen(true); // Show confirmation dialog
    }
  };

  const confirmDisable = () => {
    // Perform the disable action
    if (isEdit) {
      const activeAccounts = accounts.filter((account) => account.status);
      if (activeAccounts.length === 1) {
        toast.error('You cannot disable the last account.');
        return;
      }
    }
    setIsEnabled(false);
    setIsDisableDialogOpen(false);
  };

  return (
    <>
      {/* Main Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={() => {
          setIsDialogOpen(!isDialogOpen);
          reset();
        }}
      >
        <DialogTrigger asChild>
          <Button variant={btnVariant}>{btnLabel}</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-800 dark:text-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">
              {isEdit ? 'Edit Account' : 'Add Account'}
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              {`Please fill in the form below to ${
                isEdit ? 'update' : 'add'
              } an account.`}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4 py-4"
          >
            <div>
              <label
                htmlFor="type"
                className="block text-sm font-medium text-gray-900 dark:text-gray-100"
              >
                Type
              </label>
              <Select
                className="bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 w-full h-[40px] border rounded"
                value={watch('type')} // Ensure React Hook Form controls it
                onValueChange={(value) => {
                  setValue('type', value, { shouldValidate: true });
                  setAccountType(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Debt type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank account">Bank account</SelectItem>
                  <SelectItem value="Credit card">Credit card</SelectItem>
                  <SelectItem value="Debt">Debt</SelectItem>
                  <SelectItem value="Investment">Investment</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-red-500 dark:text-red-400">
                  {errors.type.message}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-900 dark:text-gray-100"
              >
                {(() => {
                  if (accountType === 'Business') {
                    return 'Business Name';
                  } else if (accountType === 'Debt') {
                    return 'Party Name';
                  } else if (accountType === 'Investment') {
                    return 'Investment Name';
                  } else {
                    return 'Account Name';
                  }
                })()}
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                className="bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 w-full"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-red-500 dark:text-red-400">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="accountNumber"
                className="block text-sm font-medium text-gray-900 dark:text-gray-100"
              >
                Account Number
              </label>
              <Input
                id="accountNumber"
                name="accountNumber"
                type="text"
                className="bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 w-full"
                {...register('accountNumber')}
                disabled={accountType === 'Cash'}
              />
              {errors.accountNumber && (
                <p className="text-red-500 dark:text-red-400">
                  {errors.accountNumber.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="balance"
                className="block text-sm font-medium text-gray-900 dark:text-gray-100"
              >
                Balance
              </label>
              <Input
                id="balance"
                name="balance"
                type="number"
                className="bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 w-full"
                {...register('balance', { valueAsNumber: true })}
              />
              {errors.balance && (
                <p className="text-red-500 dark:text-red-400">
                  {errors.balance.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={() => setIsDefault(!isDefault)}
                  className="mr-2"
                />
                <label className="text-sm text-gray-900 dark:text-gray-100">
                  Set as Default
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={handleDisableToggle}
                  className="mr-2"
                />
                <label className="text-sm text-gray-900 dark:text-gray-100">
                  Enable Account
                </label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="submit"
                className="bg-blue-500 dark:bg-blue-700 text-white dark:hover:bg-blue-600"
              >
                {loading ? 'Saving...' : isEdit ? 'Update' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={isDisableDialogOpen}
        onOpenChange={() => setIsDisableDialogOpen(false)}
      >
        <DialogContent className="bg-white dark:bg-gray-800 dark:text-white">
          <DialogHeader>
            <DialogTitle>Disable Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to disable this account?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsDisableDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDisable}
              className="bg-red-500 text-white dark:bg-red-700"
            >
              Disable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default AddAccounts;
