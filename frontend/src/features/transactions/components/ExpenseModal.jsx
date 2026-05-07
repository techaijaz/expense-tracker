/* eslint-disable no-undef */
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import CategoryModal from './CategoryModal';

// 🛡️ Validation Schema using Zod
const expenseSchema = z.object({
  account: z.string().nonempty('Account is required'),
  amount: z.number().min(1, 'Amount must be greater than 0'),
  category: z.string().nonempty('Category is required'),
  description: z.string().optional(),
});

function ExpenseModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      account: '',
      amount: '',
      category: '',
      description: '',
    },
  });

  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const onSubmit = (data) => {
    console.log('Expense Data:', data);
    toast.success('Expense recorded successfully!');
    reset();
    setIsOpen(false);
  };

  // eslint-disable-next-line no-unused-vars
  const handleAddCategory = async (newCategory) => {
    try {
      // const response = await api.post('/categories', { name: newCategory });
      // setCategories((prev) => [...prev, response.data]);
      // setValue('category', response.data.name);
      // setIsCategoryModalOpen(false);
      // toast.success('Category added successfully');
    } catch (error) {
      toast.error('Failed to add category', error);
    }
  };

  // 🧹 Reset form on modal close

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setIsOpen(true)}>{buttonText}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-card text-on-surface border border-secondary-container">
        <DialogHeader>
          <DialogTitle className="text-on-surface font-headline font-bold text-xl">
            Record Expense
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Account Selection */}
          <div>
            <Label className="uppercase tracking-widest text-on-surface-variant text-[10px] font-bold">
              Account
            </Label>
            <Select onValueChange={(value) => setValue('account', value)}>
              <SelectTrigger className="mt-1 bg-secondary-container border border-secondary-container text-on-surface outline-none focus:ring-1 focus:ring-primary/40">
                <SelectValue placeholder="Select Account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank">Bank</SelectItem>
                <SelectItem value="credit">Credit Card</SelectItem>
              </SelectContent>
            </Select>
            {errors.account && (
              <p className="text-error text-xs font-semibold mt-1">
                {errors.account.message}
              </p>
            )}
          </div>

          {/* Amount */}
          <div>
            <Label className="uppercase tracking-widest text-on-surface-variant text-[10px] font-bold">
              Amount
            </Label>
            <Input
              type="number"
              {...register('amount', { valueAsNumber: true })}
              placeholder="0.00"
              className="mt-1 bg-secondary-container border border-secondary-container text-on-surface outline-none focus:ring-1 focus:ring-primary/40"
            />
            {errors.amount && (
              <p className="text-error text-xs font-semibold mt-1">
                {errors.amount.message}
              </p>
            )}
          </div>

          {/* Category Selection */}
          <div>
            <Label className="uppercase tracking-widest text-on-surface-variant text-[10px] font-bold">
              Category
            </Label>
            <div className="flex items-center gap-2 mt-1">
              <Select onValueChange={(value) => setValue('category', value)}>
                <SelectTrigger className="bg-secondary-container border border-secondary-container text-on-surface outline-none focus:ring-1 focus:ring-primary/40">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="food">Food</SelectItem>
                  <SelectItem value="transport">Transport</SelectItem>
                  <SelectItem value="utilities">Utilities</SelectItem>
                </SelectContent>
              </Select>
              {/* '+' Button to Add New Category */}
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setIsCategoryModalOpen(true)}
                className="border-secondary-container text-on-surface hover:bg-surface-variant"
              >
                +
              </Button>
            </div>
            {errors.category && (
              <p className="text-error text-xs font-semibold mt-1">
                {errors.category.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label className="uppercase tracking-widest text-on-surface-variant text-[10px] font-bold">
              Description
            </Label>
            <Textarea
              {...register('description')}
              placeholder="Optional description"
              className="mt-1 bg-secondary-container border border-secondary-container text-on-surface outline-none focus:ring-1 focus:ring-primary/40 min-h-[100px]"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsOpen(false)}
              className="bg-surface-variant text-on-surface hover:bg-surface-variant/80"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary text-on-primary hover:opacity-90"
            >
              Save Expense
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={handleAddCategory}
      />
    </Dialog>
  );
}

export default ExpenseModal;
