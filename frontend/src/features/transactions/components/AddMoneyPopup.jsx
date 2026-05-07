import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { Wallet, Loader2 } from 'lucide-react';
import { updateAccount } from '@/features/accounts/state/accountSlice';
import api from '@/utils/httpMethods';
import accountSchema from '@/schema/accountSchema';
import { restrictDecimals } from '@/utils/format';
import { useMediaQuery } from '@/hooks/use-media-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/utils/utils';

const AddMoneyPopup = ({ open, setOpen, accountId }) => {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const preferences = useSelector(
    (state) => state.auth.user?.user?.preferences || state.auth.user?.preferences,
  );
  const { decimalPlaces = 2 } = preferences || {};

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(accountSchema.amountSchema),
    defaultValues: { amount: '' },
  });

  useEffect(() => {
    if (open) {
      reset({ amount: '' });
    }
  }, [open, reset]);

  const onSubmit = async (formData) => {
    setLoading(true);
    try {
      const amount = parseFloat(formData.amount);
      const res = await api.put(`/account/add-amount/${accountId}`, { amount });
      
      toast.success(res.data?.message || 'Funds added successfully!');
      dispatch(updateAccount({ id: accountId, updatedAccount: res.data?.data || res.data }));
      setOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add funds');
    } finally {
      setLoading(false);
    }
  };

  const FormContent = (
    <form id="add-money-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="amount" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text3)] ml-1">
          Amount to Add
        </Label>
        <div className={cn(
          "flex items-center gap-3 p-4 bg-[var(--bg3)] border rounded-2xl transition-all group focus-within:ring-2 focus-within:ring-[var(--accent)]/20 focus-within:border-[var(--accent)]/40",
          errors.amount ? "border-red-500/50" : "border-[var(--border)]"
        )}>
          <span className="text-2xl md:text-3xl font-extrabold text-[var(--accent)]">₹</span>
          <Input
            id="amount"
            {...register('amount')}
            onInput={(e) => {
              e.target.value = restrictDecimals(e.target.value, decimalPlaces);
            }}
            type="number"
            step={1 / Math.pow(10, decimalPlaces)}
            className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0 text-2xl md:text-3xl font-black text-[var(--text)] placeholder:text-[var(--text3)]/20 w-full tracking-tight p-0 h-auto"
            placeholder={`0.${'0'.repeat(decimalPlaces)}`}
          />
        </div>
        {errors.amount && (
          <p className="text-[11px] font-medium text-red-500 mt-1 ml-1">
            {errors.amount.message}
          </p>
        )}
      </div>
    </form>
  );

  const ActionButtons = (
    <div className="flex flex-col md:flex-row gap-3 w-full">
      <Button 
        type="button"
        variant="ghost" 
        onClick={() => setOpen(false)} 
        disabled={loading}
        className="flex-1 h-12 text-[10px] uppercase font-bold tracking-widest bg-[var(--bg3)] border-[var(--border)] rounded-2xl order-2 md:order-1"
      >
        Cancel
      </Button>
      <Button 
        type="submit" 
        form="add-money-form"
        disabled={loading}
        className={cn(
          "flex-[1.5] h-12 text-[10px] uppercase tracking-widest font-black text-white order-1 md:order-2 rounded-2xl transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] shadow-lg bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] shadow-[var(--accent)]/20",
          loading ? "opacity-70" : ""
        )}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="animate-spin w-4 h-4" />
            Processing...
          </span>
        ) : (
          <>Confirm Addition</>
        )}
      </Button>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden bg-[var(--bg-popup)] border-[var(--border)] rounded-[2.5rem] shadow-2xl">
          <div className="px-8 pt-8 pb-6">
            <DialogHeader className="mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[var(--accent-glow)] flex items-center justify-center shadow-inner border border-[var(--accent)]/10">
                  <Wallet className="w-6 h-6 text-[var(--accent)]" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black tracking-tight">Add Money</DialogTitle>
                  <DialogDescription className="text-xs font-bold text-[var(--text3)] uppercase tracking-widest">
                    Top up your account
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="py-2">
              {FormContent}
            </div>
            <div className="mt-8">
              {ActionButtons}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent className="bg-[var(--bg-popup)] border-[var(--border)] rounded-t-[2.5rem]">
        <div className="mx-auto w-12 h-1.5 bg-[var(--bg3)] rounded-full mt-3 mb-2" />
        <DrawerHeader className="text-left px-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent-glow)] flex items-center justify-center border border-[var(--accent)]/10">
              <Wallet className="w-6 h-6 text-[var(--accent)]" />
            </div>
            <div>
              <DrawerTitle className="text-2xl font-black tracking-tight">Add Money</DrawerTitle>
              <DrawerDescription className="text-xs font-bold text-[var(--text3)] uppercase tracking-widest">
                Top up your account
              </DrawerDescription>
            </div>
          </div>
        </DrawerHeader>
        <div className="px-6 py-4">
          {FormContent}
        </div>
        <DrawerFooter className="px-6 pt-4 pb-10 border-t border-[var(--border)] mt-4">
          {ActionButtons}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default AddMoneyPopup;
