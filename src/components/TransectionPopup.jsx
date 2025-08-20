/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useDispatch, useSelector } from 'react-redux';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import AddCategoryPopup from './AddCategoryPopup';
import useApi from '@/hooks/useApi';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { addTransection } from '@/redux/transectionSlice';

const transectionSchema = z.object({
  type: z.string().min(1, 'Transaction type is required'),
  account: z.string().min(1, 'Account is required'),
  date: z.coerce.date(),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  description: z.string().min(3, 'Description is required'),
  category: z.string().min(1, 'Category is required'), // Ensures category is selected
});

const TransactionPopup = ({ open, setOpen }) => {
  const dispatch = useDispatch();
  const { accounts } = useSelector((state) => state.accounts);

  const { categories } = useSelector((state) => state.category);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const { data: transData, error, loading, makeRequest } = useApi();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: zodResolver(transectionSchema),
    defaultValues: {
      type: '', // Empty string to trigger validation
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      account: '',
      description: '',
      category: '',
    },
  });

  const transactionType = watch('type');

  const onSubmit = async (data) => {
    try {
      makeRequest({
        url: '/transactions/add',
        method: 'post',
        data,
      });
      toast.success('Transaction added successfully!');

      setOpen(false);
      reset();
    } catch (error) {
      toast.error('Failed to save transaction.' + error?.message);
    }
  };

  useEffect(() => {
    if (transData) {
      dispatch(addTransection(transData));
    }
  }, [transData, dispatch]);

  return (
    <Dialog open={open} onOpenChange={() => setOpen(false)}>
      <DialogContent className="bg-white dark:bg-gray-900 p-6 rounded-lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Add Transaction
            </DialogTitle>
            <div className="flex items-center justify-between">
              <DialogDescription className="w-full">
                Fill out the details below.
              </DialogDescription>
              <div className="flex items-center space-x-2">
                <Input {...register('date')} type="date" />
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Transaction Type</Label>
            <Select
              value={watch('type')} // Ensure React Hook Form controls it
              onValueChange={(value) =>
                setValue('type', value, { shouldValidate: true })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select transaction type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
                <SelectItem value="debt">Debt</SelectItem>
                <SelectItem value="investment">Investment</SelectItem>
                <SelectItem value="business">Business</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm font-medium text-red-500">
                {errors.type.message}
              </p>
            )}
          </div>

          <div>
            {transactionType === 'debt' && (
              <>
                <Label>Debt Type</Label>
                <Select onValueChange={(value) => setValue('debttype', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Debt type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={'take'}>Taken</SelectItem>
                    <SelectItem value={'give'}>Given</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
          <div>
            {transactionType === 'debt' && (
              <>
                <Label>Party</Label>
                <Select onValueChange={(value) => setValue('debtparty', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Party" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts &&
                      accounts.reduce((result, account) => {
                        if (account.type === 'Debt') {
                          result.push(
                            <SelectItem key={account._id} value={account._id}>
                              {account.name}
                            </SelectItem>
                          );
                        }
                        return result;
                      }, [])}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
          <div>
            <Label>Account</Label>
            <Select
              onValueChange={(value) =>
                setValue('account', value, { shouldValidate: true })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select From Account" />
              </SelectTrigger>
              <SelectContent>
                {accounts &&
                  accounts.map((account) => (
                    <SelectItem key={account._id} value={account._id}>
                      {account.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {errors.account && (
              <p className="text-sm font-medium text-red-500">
                {errors.account.message}
              </p>
            )}
          </div>
          <div>
            {transactionType === 'transfer' && (
              <div className="">
                <Label>To Account</Label>
                <Select onValueChange={(value) => setValue('toaccount', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select To Account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts &&
                      accounts.map((account) => (
                        <SelectItem key={account._id} value={account._id}>
                          {account.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          {/* <div>{renderFieldsByType()}</div> */}
          <div>
            <Label>Amount</Label>
            <Input
              {...register('amount')}
              type="number"
              label="Amount"
              error={errors.amount}
            />
            {errors.amount && (
              <p className="text-sm font-medium text-red-500">
                {errors.amount.message}
              </p>
            )}
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              {...register('description')}
              label="Description"
              error={errors.description}
            />
            {errors.description && (
              <p className="text-sm font-medium text-red-500">
                {errors.description.message}
              </p>
            )}
          </div>
          {(transactionType === 'income' || transactionType === 'expense') && (
            <>
              <Label>Category</Label>
              <div className="flex gap-2">
                <Select
                  onValueChange={(value) =>
                    setValue('category', value, { shouldValidate: true })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                  {errors.category && (
                    <div className="text-sm font-medium text-red-500">
                      {errors.category.message}
                    </div>
                  )}
                </Select>

                <Button
                  type="button"
                  onClick={() => setIsAddCategoryOpen(true)}
                  className="bg-green-500 text-white px-4 py-2 rounded"
                >
                  +
                </Button>
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="submit">Save</Button>
            <Button
              type="button"
              onClick={() => {
                setOpen(false);
                reset();
              }}
            >
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      <AddCategoryPopup
        open={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        onSave={(id) => setValue('category', id)}
      />
    </Dialog>
  );
};

export default TransactionPopup;
