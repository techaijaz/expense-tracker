import React, { useState, useEffect } from 'react';
import { Loader2, Calendar as CalendarIcon, Building2, Bike, Coins, Sparkles } from 'lucide-react';
import useFormat from '@/hooks/useFormat';
import { toast } from 'sonner';
import api from '@/utils/httpMethods';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/utils/utils';
import { restrictDecimals } from '@/utils/format';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { z } from 'zod';
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

const assetSchema = z.object({
  name: z.string().min(2, 'Title must be at least 2 characters'),
  type: z.enum(['GOLD', 'SILVER', 'VEHICLE', 'REAL_ESTATE']),
  currentValue: z
    .string()
    .refine(
      (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
      'Enter a valid market value',
    ),
  initialValue: z.string().optional(),
  acquiredAt: z
    .date()
    .max(
      new Date(new Date().setHours(23, 59, 59, 999)),
      'Date cannot be in the future',
    ),
  description: z.string().max(250, 'Notes are too long (max 250)').optional(),
});

const ASSET_TYPES = [
  { id: 'GOLD', label: 'Physical Gold', icon: Sparkles },
  { id: 'SILVER', label: 'Silver/Metal', icon: Coins },
  { id: 'VEHICLE', label: 'Vehicles/Automobile', icon: Bike },
  { id: 'REAL_ESTATE', label: 'Real Estate/Property', icon: Building2 },
];

const AddAssetPopup = ({ isOpen, onClose, onSuccess, assetToEdit = null }) => {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [loading, setLoading] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const { formatDate } = useFormat();
  const [formData, setFormData] = useState({
    name: '',
    type: 'GOLD',
    currentValue: '',
    initialValue: '',
    acquiredAt: new Date(),
    description: '',
  });

  const validate = () => {
    const result = assetSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors = {};
      result.error.errors.forEach((err) => {
        fieldErrors[err.path[0]] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  useEffect(() => {
    if (isOpen) validate();
  }, [formData, isOpen]);

  useEffect(() => {
    if (assetToEdit) {
      setFormData({
        name: assetToEdit.name || '',
        type: assetToEdit.type || 'GOLD',
        currentValue: String(assetToEdit.currentValue || ''),
        initialValue: String(assetToEdit.initialValue || ''),
        acquiredAt: assetToEdit.acquiredAt
          ? new Date(assetToEdit.acquiredAt)
          : new Date(),
        description: assetToEdit.description || '',
      });
    } else {
      setFormData({
        name: '',
        type: 'GOLD',
        currentValue: '',
        initialValue: '',
        acquiredAt: new Date(),
        description: '',
      });
    }
  }, [assetToEdit, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the validation errors before submitting');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        acquiredAt: formData.acquiredAt.toISOString(),
        currentValue: parseFloat(formData.currentValue),
        initialValue: formData.initialValue
          ? parseFloat(formData.initialValue)
          : parseFloat(formData.currentValue),
      };

      let response;
      if (assetToEdit) {
        response = await api.put(`/assets/${assetToEdit._id}`, payload);
      } else {
        response = await api.post('/assets', payload);
      }

      if (response.success) {
        toast.success(assetToEdit ? 'Asset updated' : 'Asset added');
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error saving asset:', error);
      toast.error(error.response?.data?.message || 'Failed to save asset');
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Current Market Value */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-text3 ml-1">Current Market Value</label>
        <div className={cn(
          "flex items-center gap-3 px-4 h-14 bg-bg3 border rounded-2xl transition-all focus-within:ring-2 focus-within:ring-accent/20",
          errors.currentValue ? "border-red/50" : "border-border"
        )}>
          <span className={cn("text-xl font-bold font-mono", errors.currentValue ? "text-red" : "text-accent")}>₹</span>
          <Input
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={formData.currentValue}
            onInput={(e) => {
              const nextValue = e.target.value.replace(/[^0-9.]/g, '');
              e.target.value = restrictDecimals(nextValue, 2);
              setFormData({ ...formData, currentValue: e.target.value });
            }}
            required
            autoFocus
            className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0 text-2xl font-bold font-mono text-text tracking-tighter p-0 h-auto"
          />
        </div>
        {errors.currentValue && <p className="text-[10px] font-medium text-red mt-0.5 ml-1">{errors.currentValue}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-text3 ml-1">Asset Category</label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData({ ...formData, type: value })}
          >
            <SelectTrigger className="h-11 bg-bg3 border-border rounded-xl text-sm font-semibold">
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent className="z-[5000]">
              {ASSET_TYPES.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  <div className="flex items-center gap-2">
                    <type.icon size={14} className="text-text3" />
                    <span>{type.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-text3 ml-1">Acquisition Date</label>
          <Popover open={dateOpen} onOpenChange={setDateOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  'w-full h-11 justify-start text-left font-semibold text-sm bg-bg3 border-border rounded-xl px-4',
                  !formData.acquiredAt && 'text-text3',
                  errors.acquiredAt && 'border-red/50',
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                {formData.acquiredAt ? formatDate(formData.acquiredAt) : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-[5000]" align="end">
              <Calendar
                mode="single"
                selected={formData.acquiredAt}
                onSelect={(date) => {
                  if (date) {
                    setFormData({ ...formData, acquiredAt: date });
                    setDateOpen(false);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {errors.acquiredAt && <p className="text-[10px] font-medium text-red mt-0.5 ml-1">{errors.acquiredAt}</p>}
        </div>
      </div>

      {/* Asset Title */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-text3 ml-1">Asset Title</label>
        <Input
          type="text"
          placeholder="e.g. 100g 24K Gold Bar"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          className={cn(
            "w-full h-11 px-4 bg-bg3 border rounded-xl text-sm font-semibold outline-none transition-all focus-visible:ring-2 focus-visible:ring-accent/20 shadow-none",
            errors.name ? "border-red/50" : "border-border"
          )}
        />
        {errors.name && <p className="text-[10px] font-medium text-red mt-0.5 ml-1">{errors.name}</p>}
      </div>

      {/* Initial Cost */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-text3 ml-1">Initial Cost (Optional)</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-text3/50 text-sm">₹</span>
          <Input
            type="text"
            inputMode="decimal"
            placeholder="Original purchase price"
            value={formData.initialValue}
            onInput={(e) => {
              const nextValue = e.target.value.replace(/[^0-9.]/g, '');
              e.target.value = restrictDecimals(nextValue, 2);
              setFormData({ ...formData, initialValue: e.target.value });
            }}
            className="w-full h-11 pl-10 pr-4 bg-bg3 border border-border rounded-xl text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-accent/20 transition-all shadow-none"
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-text3 ml-1">Notes (Optional)</label>
        <Textarea
          placeholder="Add details, location or certificate numbers..."
          rows={2}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full p-4 bg-bg3 border border-border rounded-xl text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-accent/20 transition-all resize-none shadow-none"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        {!isDesktop && (
          <DrawerClose asChild>
            <Button variant="outline" className="flex-1 h-12 rounded-2xl text-[10px] uppercase font-bold tracking-widest bg-bg3 border-border">Cancel</Button>
          </DrawerClose>
        )}
        <Button
          type="submit"
          disabled={loading || Object.keys(errors).length > 0}
          className="flex-[2] h-12 rounded-2xl bg-gradient-to-r from-accent to-accent2 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-accent/20 transition-all active:scale-95"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {loading
            ? 'Processing…'
            : assetToEdit
              ? 'Update Valuation'
              : 'Commit Asset'}
        </Button>
      </div>
    </form>
  );

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-[480px] bg-bg2 border-border p-6 rounded-3xl shadow-2xl z-[5000]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight text-text">
              {assetToEdit ? 'Edit Asset Valuation' : 'Physical Asset Acquisition'}
            </DialogTitle>
            <DialogDescription className="text-xs text-text3">
              Update market valuation for physical holdings
            </DialogDescription>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent className="bg-bg2 border-border p-6 rounded-t-3xl min-h-[60vh] z-[5000]">
        <DrawerHeader className="text-left px-0">
          <DrawerTitle className="text-xl font-bold tracking-tight text-text">
            {assetToEdit ? 'Edit Asset Valuation' : 'Physical Asset Acquisition'}
          </DrawerTitle>
          <DrawerDescription className="text-xs text-text3">
            Update market valuation for physical holdings
          </DrawerDescription>
        </DrawerHeader>
        <div className="pb-8">{formContent}</div>
      </DrawerContent>
    </Drawer>
  );
};

export default AddAssetPopup;
