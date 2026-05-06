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
    icon: 'person',
    color: 'var(--accent)',
    bg: 'var(--accent-glow)',
    border: 'rgba(91, 141, 239, 0.15)',
    glow: 'rgba(91, 141, 239, 0.1)',
  },
  FAMILY: {
    label: 'Family',
    icon: 'family_restroom',
    color: 'var(--green)',
    bg: 'var(--green-bg)',
    border: 'var(--green-border)',
    glow: 'rgba(16, 185, 129, 0.15)',
  },
  VENDOR: {
    label: 'Vendor',
    icon: 'storefront',
    color: 'var(--red)',
    bg: 'var(--red-bg)',
    border: 'var(--red-border)',
    glow: 'rgba(239, 68, 68, 0.15)',
  },
  CLIENT: {
    label: 'Client',
    icon: 'handshake',
    color: 'var(--amber)',
    bg: 'var(--amber-bg)',
    border: 'var(--amber-border)',
    glow: 'rgba(245, 158, 11, 0.15)',
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
      {/* ── Type Tabs (Sliding Pill Style) ── */}
      <div className="space-y-2.5">
        <Label className="block text-[10px] font-bold text-text3 uppercase tracking-[0.2em] ml-1">
          Relationship Type
        </Label>
        <div 
          className="relative flex bg-bg3 p-1 rounded-2xl gap-1 overflow-hidden border-[1.5px] transition-all duration-300"
          style={{ borderColor: RELATION_CONFIG[relation]?.border }}
        >
          {/* Sliding Colored Pill */}
          {(() => {
            const activeIdx = RELATION_KEYS.indexOf(relation);
            const safeIdx = activeIdx === -1 ? 0 : activeIdx;
            const conf = RELATION_CONFIG[relation] || RELATION_CONFIG.FRIEND;
            return (
              <div
                style={{
                  position: 'absolute',
                  top: 4,
                  bottom: 4,
                  left: `calc(${(safeIdx * 100) / RELATION_KEYS.length}% + 4px)`,
                  width: `calc(${100 / RELATION_KEYS.length}% - 8px)`,
                  background: conf.bg,
                  border: `1.5px solid ${conf.border}`,
                  boxShadow: `0 0 16px 2px ${conf.glow}`,
                  borderRadius: 12,
                  transition: 'left 0.35s cubic-bezier(0.34,1.56,0.64,1), background 0.3s ease, border-color 0.3s ease',
                }}
              />
            );
          })()}
          
          {RELATION_KEYS.map((key) => {
            const isActive = relation === key;
            const conf = RELATION_CONFIG[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => setValue('relation', key)}
                className={cn(
                  "relative z-10 flex-1 py-2.5 flex items-center justify-center gap-2 rounded-xl transition-all duration-300",
                  isActive ? "scale-100" : "scale-95 opacity-60 hover:opacity-100"
                )}
              >
                <span 
                  className="material-symbols-outlined text-[18px]"
                  style={{ color: isActive ? conf.color : 'var(--text3)' }}
                >
                  {conf.icon}
                </span>
                <span 
                  className="text-[10px] font-black tracking-widest uppercase hidden sm:inline"
                  style={{ color: isActive ? conf.color : 'var(--text3)' }}
                >
                  {conf.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Name Field */}
      <div className="space-y-2">
        <Label htmlFor="name" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-text3 ml-1">
          Counterparty Name
        </Label>
        <div className={cn(
          "flex items-center gap-3 p-3.5 bg-bg3 border rounded-2xl transition-all focus-within:ring-2 focus-within:ring-accent/20 focus-within:border-accent/40 group",
          errors.name ? "border-red/40" : "border-border"
        )}>
          <div className="w-10 h-10 flex items-center justify-center bg-bg2 rounded-xl border border-border shadow-sm transition-transform group-focus-within:scale-105 duration-300">
            <span className="material-symbols-outlined text-[20px] text-accent">
              person
            </span>
          </div>
          <Input
            id="name"
            {...register('name')}
            disabled={isLimitReached}
            placeholder={isLimitReached ? "Limit reached..." : "Enter full name..."}
            autoComplete="off"
            className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0 text-sm font-semibold text-text placeholder:text-text3/30 p-0 h-auto"
          />
        </div>
        {errors.name && (
          <p className="text-[11px] font-medium text-red mt-1 ml-1">
            {errors.name.message}
          </p>
        )}
      </div>
    </form>
  );


  const ActionButtons = (
    <div className="flex flex-col md:flex-row gap-4 w-full">
      <Button 
        type="button"
        variant="outline" 
        onClick={onClose} 
        disabled={loading}
        className="flex-1 h-12 text-[10px] uppercase font-bold tracking-widest bg-bg3 border-border rounded-xl order-2 md:order-1 text-text3 hover:text-text transition-all"
      >
        Cancel
      </Button>
      <Button 
        type="submit" 
        form="add-party-form"
        disabled={loading}
        className={cn(
          "flex-[1.5] h-12 text-[10px] uppercase tracking-widest font-black text-white order-1 md:order-2 rounded-xl transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] shadow-xl bg-gradient-to-r from-accent to-accent2 shadow-accent/20",
          loading ? "opacity-70 shadow-none" : ""
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
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-bg2 border-border rounded-[32px] shadow-2xl backdrop-blur-md z-[3001] outline-none">
          <div className="px-8 pt-8 pb-8">
            <DialogHeader className="mb-8">
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner border border-accent/10 transition-all duration-500"
                  style={{ background: RELATION_CONFIG[relation]?.bg }}
                >
                  <span 
                    className="material-symbols-outlined text-2xl font-bold transition-all duration-500"
                    style={{ color: RELATION_CONFIG[relation]?.color }}
                  >
                    {party ? 'edit_note' : 'person_add'}
                  </span>
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black tracking-tight text-text">
                    {party ? 'Edit' : 'Add'} Counterparty
                  </DialogTitle>
                  <DialogDescription className="text-xs font-bold text-text3 uppercase tracking-widest">
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
      <DrawerContent className="bg-bg2 border-border rounded-t-[40px] z-[3001] outline-none">
        <div className="mx-auto w-12 h-1.5 bg-bg4 rounded-full mt-3 mb-6" />
        <DrawerHeader className="text-left px-6 mb-6">
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center border border-accent/10"
              style={{ background: RELATION_CONFIG[relation]?.bg }}
            >
              <span 
                className="material-symbols-outlined text-2xl font-bold"
                style={{ color: RELATION_CONFIG[relation]?.color }}
              >
                {party ? 'edit_square' : 'person_add'}
              </span>
            </div>
            <div>
              <DrawerTitle className="text-2xl font-black tracking-tight text-text">
                {party ? 'Edit' : 'Add'} Counterparty
              </DrawerTitle>
              <DrawerDescription className="text-xs font-bold text-text3 uppercase tracking-widest">
                Manage relationship details
              </DrawerDescription>
            </div>
          </div>
        </DrawerHeader>
        <div className="px-6 py-4 overflow-y-auto max-h-[70vh]">
          {FormContent}
        </div>
        <DrawerFooter className="px-6 pt-4 pb-10 border-t border-border mt-4">
          {ActionButtons}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
