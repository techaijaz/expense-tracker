import { useEffect, useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import {
  addAccount,
  updateAccount as updateAccountAction,
} from '../redux/accountSlice';
import api from '@/utils/httpMethods';
import accountSchema from '@/schema/accountSchema';
import { getCurrencySymbol, restrictDecimals } from '@/utils/format';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/utils';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useMediaQuery } from '@/hooks/use-media-query';

// ── types that REQUIRE an account number ───────────────────────────────────────
const REQUIRES_ACC_NUM = ['BANK', 'CREDIT_CARD'];
const ACCOUNT_TYPE_LABELS = {
  BANK: 'Bank Account',
  CREDIT_CARD: 'Credit Card',
  WALLET: 'E-Wallet',
  INVESTMENT: 'Investment',
};

function AccountModal({ onClose, onSaved, account = null, initialType = null }) {
  const isEdit = !!account;
  const dispatch = useDispatch();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const { user } = useSelector((state) => state.auth);
  const { accounts } = useSelector((state) => state.accounts);
  const userObj = user?.user || user;
  const plan = userObj?.plan || 'basic';
  const isPro = plan === 'pro';
  
  const preferences = userObj?.preferences;
  const { currency = 'INR', decimalPlaces = 2 } = preferences || {};
  const currencySymbol = getCurrencySymbol(currency);

  const [loading, setLoading] = useState(false);
  const [initialBalanceLoading, setInitialBalanceLoading] = useState(isEdit);
  const [isDefault, setIsDefault] = useState(account?.isDefault || false);
  const [billDateOpen, setBillDateOpen] = useState(false);
  const [dueDateOpen, setDueDateOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      type: initialType || account?.type || 'BANK',
      name: account?.name || '',
      balance: account?.balance || '',
      accountNumber: account?.accountNumber || '',
      creditLimit: account?.creditLimit || '',
      statementDay: account?.statementDay || '',
      dueDay: account?.dueDay || '',
    },
  });

  const accountType = watch('type');
  const needsAccNum = REQUIRES_ACC_NUM.includes(accountType);

  useEffect(() => {
    if (isEdit) {
      const fetchOpeningBalance = async () => {
        try {
          const res = await api.get(`/account/${account._id}/opening-balance`);
          setValue('balance', res?.data?.amount || 0);
        } catch (err) {
          console.error('Failed to fetch opening balance', err);
        } finally {
          setInitialBalanceLoading(false);
        }
      };
      fetchOpeningBalance();
    }
  }, [isEdit, account, setValue]);

  const onSubmit = async (data) => {
      const currentType = data.type;
      const typeCount = accounts.filter(
        (a) => a.type === currentType && !a.isDeleted,
      ).length;

      if (!isPro && !isEdit) {
        if (typeCount >= 1) {
          toast.error(`Basic plan limit reached for ${ACCOUNT_TYPE_LABELS[currentType] || currentType}. Upgrade to Pro for unlimited accounts.`);
          return;
        }
      }
      
      setLoading(true);
    try {
      const payload = {
        name: data.name,
        type: data.type,
        balance: Number(data.balance || 0),
        creditLimit: data.type === 'CREDIT_CARD' ? Number(data.creditLimit || 0) : 0,
        isDefault: data.type === 'INVESTMENT' ? false : isDefault,
        accountNumber: needsAccNum ? data.accountNumber : '',
        statementDay: data.type === 'CREDIT_CARD' ? Number(data.statementDay || null) : null,
        dueDay: data.type === 'CREDIT_CARD' ? Number(data.dueDay || null) : null,
      };

      let res;
      if (isEdit) {
        res = await api.patch(`/account/${account._id}`, payload);
        toast.success('Account updated successfully!');
      } else {
        res = await api.post('/account', payload);
        toast.success('Account created successfully!');
      }

      onSaved(res?.data);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} account`);
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <form id="account-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Account Type */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-text3 ml-1">Account Type</label>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value} disabled={isEdit || !!initialType}>
                <SelectTrigger className="h-11 bg-bg3 border-border rounded-xl text-sm font-semibold">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent className="z-[5000]">
                  {Object.entries(ACCOUNT_TYPE_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* Account Name */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-text3 ml-1">Account Name</label>
          <input
            {...register('name')}
            placeholder="e.g. HDFC Savings"
            className="w-full h-11 px-4 bg-bg3 border border-border rounded-xl text-sm font-semibold focus:ring-2 focus:ring-accent/20 outline-none transition-all"
            type="text"
          />
          {errors.name && <p className="text-[10px] font-medium text-red mt-0.5 ml-1">{errors.name.message}</p>}
        </div>

        {/* Account Number */}
        {needsAccNum && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-text3 ml-1">Account Number (Last 4)</label>
            <input
              {...register('accountNumber')}
              placeholder="1234"
              className="w-full h-11 px-4 bg-bg3 border border-border rounded-xl text-sm font-semibold focus:ring-2 focus:ring-accent/20 outline-none transition-all"
              type="text"
              maxLength={4}
            />
            {errors.accountNumber && <p className="text-[10px] font-medium text-red mt-0.5 ml-1">{errors.accountNumber.message}</p>}
          </div>
        )}

        {/* Opening Balance */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-text3 ml-1">
            {accountType === 'CREDIT_CARD' ? 'Initial Debt' : 'Opening Balance'}
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-accent">{currencySymbol}</span>
            <input
              {...register('balance')}
              onInput={(e) => { e.target.value = restrictDecimals(e.target.value, decimalPlaces); }}
              placeholder={`0.${'0'.repeat(decimalPlaces)}`}
              className="w-full h-11 pl-10 pr-4 bg-bg3 border border-border rounded-xl text-sm font-semibold focus:ring-2 focus:ring-accent/20 outline-none transition-all"
              type="number"
              step="any"
              disabled={initialBalanceLoading}
            />
          </div>
          {errors.balance && <p className="text-[10px] font-medium text-red mt-0.5 ml-1">{errors.balance.message}</p>}
        </div>

        {/* Credit Limit */}
        {accountType === 'CREDIT_CARD' && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-text3 ml-1">Credit Limit</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-red">{currencySymbol}</span>
              <input
                {...register('creditLimit')}
                onInput={(e) => { e.target.value = restrictDecimals(e.target.value, decimalPlaces); }}
                placeholder={`0.${'0'.repeat(decimalPlaces)}`}
                className="w-full h-11 pl-10 pr-4 bg-bg3 border border-border rounded-xl text-sm font-semibold focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                type="number"
                step="any"
              />
            </div>
            {errors.creditLimit && <p className="text-[10px] font-medium text-red mt-0.5 ml-1">{errors.creditLimit.message}</p>}
          </div>
        )}
      </div>

      {/* Credit Card Specific Recurring Days */}
      {accountType === 'CREDIT_CARD' && (
        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-text3 ml-1">Statement Day</label>
            <Controller
              name="statementDay"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={String(field.value)}>
                  <SelectTrigger className="h-11 bg-bg3 border-border rounded-xl text-xs">
                    <SelectValue placeholder="Select Day" />
                  </SelectTrigger>
                  <SelectContent className="z-[6000] max-h-[200px]">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <SelectItem key={day} value={String(day)}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-text3 ml-1">Due Day</label>
            <Controller
              name="dueDay"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={String(field.value)}>
                  <SelectTrigger className="h-11 bg-bg3 border-border rounded-xl text-xs">
                    <SelectValue placeholder="Select Day" />
                  </SelectTrigger>
                  <SelectContent className="z-[6000] max-h-[200px]">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <SelectItem key={day} value={String(day)}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
      )}

      {/* Default Toggle */}
      {accountType !== 'INVESTMENT' && (
        <div 
          className="flex items-center justify-between p-4 bg-bg3 border border-border rounded-2xl cursor-pointer hover:bg-bg4 transition-all"
          onClick={() => setIsDefault(!isDefault)}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">⭐</span>
            <div>
              <div className="text-xs font-bold text-text">Set as Default</div>
              <div className="text-[10px] text-text3">Used for auto-selection</div>
            </div>
          </div>
          <div className={cn("w-10 h-5 rounded-full relative transition-colors duration-200", isDefault ? "bg-accent" : "bg-border")}>
            <div className={cn("absolute top-1 w-3 h-3 rounded-full bg-white transition-transform duration-200", isDefault ? "translate-x-6" : "translate-x-1")} />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        {!isDesktop && (
          <DrawerClose asChild>
            <Button variant="outline" className="flex-1 h-12 rounded-2xl text-[10px] uppercase font-bold tracking-widest bg-bg3 border-border">Cancel</Button>
          </DrawerClose>
        )}
        <Button
          type="submit"
          disabled={loading}
          className="flex-[2] h-12 rounded-2xl bg-gradient-to-r from-accent to-accent2 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-accent/20"
        >
          {loading ? 'Processing…' : isEdit ? 'Update Details' : 'Initialize Account'}
        </Button>
      </div>
    </form>
  );

  if (isDesktop) {
    return (
      <Dialog open={true} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-[480px] bg-bg2 border-border p-6 rounded-3xl shadow-2xl z-[5000]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight text-text">
              {isEdit ? 'Refine Account' : 'Initialize Account'}
            </DialogTitle>
            <DialogDescription className="text-xs text-text3">
              {isEdit ? 'Update your account parameters.' : 'Add a new financial hub to your ecosystem.'}
            </DialogDescription>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={true} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent className="bg-bg2 border-border p-6 rounded-t-3xl min-h-[60vh] z-[5000]">
        <DrawerHeader className="text-left px-0">
          <DrawerTitle className="text-xl font-bold tracking-tight text-text">
            {isEdit ? 'Refine Account' : 'Initialize Account'}
          </DrawerTitle>
          <DrawerDescription className="text-xs text-text3">
            {isEdit ? 'Update your account parameters.' : 'Add a new financial hub to your ecosystem.'}
          </DrawerDescription>
        </DrawerHeader>
        <div className="pb-8">{formContent}</div>
      </DrawerContent>
    </Drawer>
  );
}

export default function AddAccounts({
  btnLabel = '+ Add',
  customTrigger = null,
  editAccount = null,
  onEditClose = null,
  type = null,
}) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { accounts } = useSelector((state) => state.accounts);
  const [isOpen, setIsOpen] = useState(false);
  const userObj = user?.user || user;
  const plan = userObj?.plan || 'basic';
  const isPro = plan === 'pro';

  const typeAccounts = accounts.filter((a) => a.type === type && !a.isDeleted);
  const isCashLimit = type === 'CASH' && typeAccounts.length >= 1;
  const isPlanLimit = !isPro && typeAccounts.length >= 1 && type !== null;
  const limitReached = isCashLimit || isPlanLimit;

  const availableTypes = ['BANK', 'CASH', 'INVESTMENT', 'CREDIT_CARD', 'WALLET'];
  const reachedAllLimits = !isPro && availableTypes.every(t => {
    const count = accounts.filter(a => a.type === t && !a.isDeleted).length;
    return count >= 1;
  });

  const handleSaved = (acc) => {
    if (editAccount) {
      dispatch(updateAccountAction(acc));
    } else {
      dispatch(addAccount(acc));
    }
  };

  const handleClose = () => {
    if (editAccount) {
      onEditClose();
    } else {
      setIsOpen(false);
    }
  };

  if (editAccount) {
    return <AccountModal account={editAccount} onClose={handleClose} onSaved={handleSaved} />;
  }

  const isLocked = !isPro && reachedAllLimits;

  return (
    <>
      <div
        onClick={() => {
          if (limitReached || (type === null && isLocked)) {
            const msg = isCashLimit ? 'Only 1 Cash account is allowed.' : `Basic plan limit reached. Upgrade to PRO to add more accounts.`;
            toast.error(msg);
            return;
          }
          setIsOpen(true);
        }}
        className="inline-block cursor-pointer"
      >
        {customTrigger ?? (
          <button className="bg-primary text-background px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition-all flex items-center gap-2">
            {!isPro && '🔒 '}{btnLabel}
          </button>
        )}
      </div>
      {isOpen && <AccountModal onClose={handleClose} onSaved={handleSaved} initialType={type} />}
    </>
  );
}
