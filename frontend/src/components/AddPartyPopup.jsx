import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { useSelector } from 'react-redux';
import { UserPlus, User, Users, Briefcase, UserCheck, Loader2, X } from 'lucide-react';
import api from '@/utils/httpMethods';
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

// ── Validation Schema ─────────────────────────────────────────────────────────
const partySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  relation: z.enum(['FRIEND', 'FAMILY', 'VENDOR', 'CLIENT']),
});

const RELATION_CONFIG = {
  FRIEND: {
    label: 'Friend',
    icon: <User className="w-4 h-4" />,
    color: 'var(--blue)',
    bg: 'var(--blue-bg)',
    border: 'var(--blue-border)',
  },
  FAMILY: {
    label: 'Family',
    icon: <Users className="w-4 h-4" />,
    color: 'var(--green)',
    bg: 'var(--green-bg)',
    border: 'var(--green-border)',
  },
  VENDOR: {
    label: 'Vendor',
    icon: <Briefcase className="w-4 h-4" />,
    color: 'var(--red)',
    bg: 'var(--red-bg)',
    border: 'var(--red-border)',
  },
  CLIENT: {
    label: 'Client',
    icon: <UserCheck className="w-4 h-4" />,
    color: 'var(--amber)',
    bg: 'var(--amber-bg)',
    border: 'var(--amber-border)',
  },
};

const RELATION_KEYS = Object.keys(RELATION_CONFIG);

export default function AddPartyPopup({ open, party, onClose, onSave, partyCount }) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [loading, setLoading] = useState(false);
  
  const currentUser = useSelector((state) => state.auth.user);
  const userObj = currentUser?.user || currentUser;
  const isPro = userObj?.role === 'admin' || userObj?.plan === 'pro';
  const isLimitReached = !party && !isPro && (partyCount || 0) >= 5;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: zodResolver(partySchema),
    defaultValues: {
      name: '',
      relation: 'FRIEND',
    },
  });

  const relation = watch('relation');

  // Reset form when opening or changing party
  useEffect(() => {
    if (open) {
      if (party) {
        reset({
          name: party.name || '',
          relation: party.relation || 'FRIEND',
        });
      } else {
        reset({
          name: '',
          relation: 'FRIEND',
        });
      }
    }
  }, [open, party, reset]);

  const onSubmit = async (data) => {
    if (isLimitReached) {
      toast.error('Basic plan limit reached (5 counterparties). Upgrade to PRO to add more.');
      return;
    }

    setLoading(true);
    try {
      const url = party ? `/parties/${party._id}` : '/parties';
      const method = party ? 'patch' : 'post';
      const res = await api[method](url, {
        name: data.name.trim(),
        relation: data.relation,
      });
      
      onSave(res.data, !!party);
      toast.success(party ? 'Counterparty updated' : 'Counterparty added');
      window.dispatchEvent(new CustomEvent('refetch-system-metrics'));
      onClose();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || 'Failed to save counterparty',
      );
    } finally {
      setLoading(false);
    }
  };

  const FormContent = (
    <form id="add-party-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Name Field */}
      <div className="space-y-2">
        <Label htmlFor="name" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text3)] ml-1">
          Counterparty Name
        </Label>
        <div className={cn(
          "relative flex items-center bg-[var(--bg3)] border rounded-2xl transition-all focus-within:ring-2 focus-within:ring-[var(--accent)]/20 focus-within:border-[var(--accent)]/40",
          errors.name ? "border-red-500/50" : "border-[var(--border)]"
        )}>
          <Input
            id="name"
            {...register('name')}
            placeholder="Full Name"
            className="h-12 bg-transparent border-none focus-visible:ring-0 text-sm font-semibold px-4"
          />
        </div>
        {errors.name && (
          <p className="text-[11px] font-medium text-red-500 mt-1 ml-1">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Relation Selection */}
      <div className="space-y-2">
        <Label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text3)] ml-1">
          Relationship Type
        </Label>
        <div className="grid grid-cols-2 gap-3">
          {RELATION_KEYS.map((key) => {
            const isActive = relation === key;
            const cfg = RELATION_CONFIG[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => setValue('relation', key)}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all duration-300",
                  isActive 
                    ? "shadow-lg scale-[1.02]" 
                    : "bg-[var(--bg3)] border-[var(--border)] text-[var(--text3)] hover:border-[var(--text3)]/30"
                )}
                style={{
                  backgroundColor: isActive ? cfg.bg : undefined,
                  borderColor: isActive ? cfg.border : undefined,
                  color: isActive ? cfg.color : undefined,
                }}
              >
                <div className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                  isActive ? "bg-white/10" : "bg-[var(--bg2)]"
                )}>
                  {cfg.icon}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {cfg.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </form>
  );

  const ActionButtons = (
    <div className="flex flex-col md:flex-row gap-3 w-full">
      <Button 
        type="button"
        variant="ghost" 
        onClick={onClose} 
        disabled={loading}
        className="flex-1 h-12 text-[10px] uppercase font-bold tracking-widest bg-[var(--bg3)] border-[var(--border)] rounded-2xl order-2 md:order-1"
      >
        Cancel
      </Button>
      <Button 
        type="submit" 
        form="add-party-form"
        disabled={loading}
        className={cn(
          "flex-[1.5] h-12 text-[10px] uppercase tracking-widest font-black text-white order-1 md:order-2 rounded-2xl transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] shadow-lg bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] shadow-[var(--accent)]/20",
          loading ? "opacity-70" : ""
        )}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="animate-spin w-4 h-4" />
            Saving...
          </span>
        ) : (
          <>{party ? 'Update' : 'Confirm'} Counterparty</>
        )}
      </Button>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
        <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden bg-[var(--bg-popup)] border-[var(--border)] rounded-[2.5rem] shadow-2xl">
          <div className="px-8 pt-8 pb-6">
            <DialogHeader className="mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[var(--accent-glow)] flex items-center justify-center shadow-inner border border-[var(--accent)]/10">
                  <UserPlus className="w-6 h-6 text-[var(--accent)]" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black tracking-tight">
                    {party ? 'Edit' : 'Add'} Counterparty
                  </DialogTitle>
                  <DialogDescription className="text-xs font-bold text-[var(--text3)] uppercase tracking-widest">
                    Manage relationship details
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
    <Drawer open={open} onOpenChange={(val) => !val && onClose()}>
      <DrawerContent className="bg-[var(--bg-popup)] border-[var(--border)] rounded-t-[2.5rem]">
        <div className="mx-auto w-12 h-1.5 bg-[var(--bg3)] rounded-full mt-3 mb-2" />
        <DrawerHeader className="text-left px-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent-glow)] flex items-center justify-center border border-[var(--accent)]/10">
              <UserPlus className="w-6 h-6 text-[var(--accent)]" />
            </div>
            <div>
              <DrawerTitle className="text-2xl font-black tracking-tight">
                {party ? 'Edit' : 'Add'} Counterparty
              </DrawerTitle>
              <DrawerDescription className="text-xs font-bold text-[var(--text3)] uppercase tracking-widest">
                Manage relationship details
              </DrawerDescription>
            </div>
          </div>
        </DrawerHeader>
        <div className="px-6 py-4 overflow-y-auto max-h-[70vh]">
          {FormContent}
        </div>
        <DrawerFooter className="px-6 pt-4 pb-10 border-t border-[var(--border)] mt-4">
          {ActionButtons}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
