import { useState, useEffect, useRef, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import useApi from '@/hooks/useApi';
import { addCatagory, updateCategory } from '@/redux/categorySlice';
import { toast } from 'sonner';
import { cn } from '@/utils/utils';
import { useMediaQuery } from '@/hooks/use-media-query';
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
import { Button } from '@/components/ui/button';

const categorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(72),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER'], {
    required_error: 'Please select a type',
  }),
  icon: z.string().optional(),
});

const ICONS = [
  '🍔', '🛒', '🏠', '🚗', '✈️', '💊', '🎮', '📚', '💡', '👕',
  '💳', '💰', '📈', '🏋️', '🎵', '🎁', '☕', '🔧', '📱', '🐾',
  '🍕', '🥦', '🍿', '🎬', '🎭', '🎨', '👔', '👠', '💄', '💍',
  '⚽', '🏀', '🎾', '🏃', '🚲', '🩺', '🔬', '🔭', '🎨', '🎹',
];

const TYPE_CONFIG = {
  EXPENSE: {
    label: 'Expense',
    icon: 'shopping_cart',
    color: 'var(--red)',
    bg: 'var(--red-bg)',
    border: 'var(--red-border)',
    glow: 'rgba(239, 68, 68, 0.15)',
  },
  INCOME: {
    label: 'Income',
    icon: 'trending_up',
    color: 'var(--green)',
    bg: 'var(--green-bg)',
    border: 'var(--green-border)',
    glow: 'rgba(16, 185, 129, 0.15)',
  },
  TRANSFER: {
    label: 'Transfer',
    icon: 'sync_alt',
    color: 'var(--accent)',
    bg: 'var(--accent-glow)',
    border: 'rgba(91, 141, 239, 0.15)',
    glow: 'rgba(91, 141, 239, 0.1)',
  },
};

const AddCategoryPopup = ({
  open = true,
  onClose,
  onSave,
  editCategory = null,
  defaultType = 'EXPENSE',
}) => {
  const dispatch = useDispatch();
  const { data, error, loading, makeRequest } = useApi();
  const [selectedIcon, setSelectedIcon] = useState('🏷️');
  const handledRef = useRef(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', type: defaultType, icon: '🏷️' },
  });

  const selectedType = watch('type');

  useEffect(() => {
    if (open) {
      if (editCategory) {
        setValue('name', editCategory.name || '');
        setValue('type', editCategory.type || defaultType);
        setValue('icon', editCategory.icon || '🏷️');
        setSelectedIcon(editCategory.icon || '🏷️');
      } else {
        reset({ name: '', type: defaultType, icon: '🏷️' });
        setSelectedIcon('🏷️');
      }
      handledRef.current = false;
    }
  }, [editCategory, open, reset, setValue, defaultType]);

  const { categories: groupedCategories } = useSelector(
    (state) => state.category,
  );
  const categories = useMemo(() => {
    const {
      INCOME = [],
      EXPENSE = [],
      TRANSFER = [],
    } = groupedCategories || {};
    return [...INCOME, ...EXPENSE, ...TRANSFER];
  }, [groupedCategories]);

  const { user } = useSelector((state) => state.auth);
  const userObj = user?.user || user;
  const isPro = userObj?.role === 'admin' || userObj?.plan === 'pro';
  const limitReached = !isPro && categories.length >= 10 && !editCategory;


  const onSubmit = (formData) => {
    if (limitReached) {
      toast.error('Limit reached (12 categories). Upgrade to PRO.');
      return;
    }
    handledRef.current = false;
    const payload = {
      name: formData.name,
      type: formData.type,
      icon: selectedIcon,
    };
    if (editCategory) {
      makeRequest({
        url: `/catagory/${editCategory._id}`,
        method: 'patch',
        data: payload,
      });
    } else {
      makeRequest({ url: '/catagory/add', method: 'post', data: payload });
    }
  };

  useEffect(() => {
    if (error) toast.error(error || 'Failed to save category.');
  }, [error]);

  useEffect(() => {
    if (data && !handledRef.current) {
      handledRef.current = true;
      if (editCategory) {
        dispatch(updateCategory(data));
      } else {
        dispatch(addCatagory(data));
      }
      toast.success(editCategory ? 'Category updated.' : 'Category added.');
      if (onSave) onSave(data._id);
      onClose();
    }
  }, [data, editCategory, dispatch, onSave, onClose]);

  const isDesktop = useMediaQuery('(min-width: 768px)');

  if (!open) return null;

  const formContent = (
    <form id="category-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* ── Type Tabs (Sliding Pill Style) ── */}
      <div className="space-y-2.5">
        <label className="block text-[10px] font-bold text-text3 uppercase tracking-[0.2em] ml-1">
          Category Type
        </label>
        <div 
          className="relative flex bg-bg3 p-1 rounded-2xl gap-1 overflow-hidden border-[1.5px] transition-all duration-300"
          style={{ borderColor: TYPE_CONFIG[selectedType]?.border }}
        >
          {/* Sliding Colored Pill */}
          {(() => {
            const keys = Object.keys(TYPE_CONFIG);
            const activeIdx = keys.indexOf(selectedType);
            const safeIdx = activeIdx === -1 ? 0 : activeIdx;
            const conf = TYPE_CONFIG[selectedType] || TYPE_CONFIG.EXPENSE;
            return (
              <div
                style={{
                  position: 'absolute',
                  top: 4,
                  bottom: 4,
                  left: `calc(${(safeIdx * 100) / keys.length}% + 4px)`,
                  width: `calc(${100 / keys.length}% - 8px)`,
                  background: conf.bg,
                  border: `1.5px solid ${conf.border}`,
                  boxShadow: `0 0 16px 2px ${conf.glow}`,
                  borderRadius: 12,
                  transition: 'left 0.35s cubic-bezier(0.34,1.56,0.64,1), background 0.3s ease, border-color 0.3s ease',
                }}
              />
            );
          })()}
          
          {Object.entries(TYPE_CONFIG).map(([key, conf]) => {
            const isActive = selectedType === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setValue('type', key)}
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
                  className="text-[10px] font-black tracking-widest uppercase"
                  style={{ color: isActive ? conf.color : 'var(--text3)' }}
                >
                  {conf.label}
                </span>
              </button>
            );
          })}
        </div>
        {errors.type && (
          <p className="mt-1.5 text-[11px] font-medium text-red ml-1">
            {errors.type.message}
          </p>
        )}
      </div>

      {/* ── Category Name ── */}
      <div className="space-y-2">
        <label className="block text-[10px] font-bold text-text3 uppercase tracking-[0.2em] ml-1">
          Category Name
        </label>
        <div className={cn(
          "flex items-center gap-3 p-3.5 bg-bg3 border rounded-2xl transition-all focus-within:ring-2 focus-within:ring-accent/20 focus-within:border-accent/40",
          errors.name ? "border-red/40" : "border-border"
        )}>
          <div className="w-10 h-10 flex items-center justify-center bg-bg2 rounded-xl border border-border shadow-sm text-xl">
            {selectedIcon}
          </div>
          <input
            type="text"
            {...register('name')}
            disabled={limitReached}
            autoComplete="off"
            placeholder={limitReached ? 'Limit reached...' : 'e.g. Shopping, Bills, Salary…'}
            className="flex-1 bg-transparent border-none outline-none text-sm font-semibold text-text placeholder:text-text3/30"
          />
        </div>
        {errors.name && (
          <p className="mt-1.5 text-[11px] font-medium text-red ml-1">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* ── Icon Picker ── */}
      <div className="space-y-2.5">
        <label className="block text-[10px] font-bold text-text3 uppercase tracking-[0.2em] ml-1">
          Choose Identity Icon
        </label>
        <div className="bg-bg3/50 border border-border p-3 rounded-2xl backdrop-blur-[2px]">
          <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-[160px] overflow-y-auto pr-1 hide-scrollbar">
            {ICONS.map((ic) => (
              <button
                key={ic}
                type="button"
                disabled={limitReached}
                onClick={() => {
                  setSelectedIcon(ic);
                  setValue('icon', ic);
                }}
                className={cn(
                  "aspect-square flex items-center justify-center text-xl rounded-xl cursor-pointer border-[1.5px] transition-all duration-200",
                  selectedIcon === ic
                    ? "bg-accent-glow border-accent shadow-sm scale-105"
                    : "bg-bg3 border-border hover:border-text3/30 hover:bg-bg4",
                  limitReached && "opacity-50 cursor-not-allowed"
                )}
              >
                {ic}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Actions for Mobile ── */}
      {!isDesktop && (
        <div className="flex gap-4 pt-4">
          <DrawerClose asChild>
            <Button
              variant="outline"
              className="flex-1 h-14 bg-bg3 border border-border hover:bg-bg4 text-text3 hover:text-text rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all"
            >
              Cancel
            </Button>
          </DrawerClose>
          <Button
            type="submit"
            disabled={loading || limitReached}
            className={cn(
              "flex-[2] h-14 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-accent/20 transition-all flex items-center justify-center gap-2",
              loading || limitReached
                ? "bg-bg4 cursor-not-allowed text-text3"
                : "bg-gradient-to-r from-accent to-accent2 hover:scale-[1.02] active:scale-[0.98]"
            )}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span className="material-symbols-outlined text-base font-semibold">
                  {limitReached ? 'lock' : editCategory ? 'published_with_changes' : 'add_task'}
                </span>
                {editCategory ? 'Update Category' : 'Create Category'}
              </>
            )}
          </Button>
        </div>
      )}
    </form>
  );

  const desktopFooter = (
    <div className="flex gap-4 mt-8 pt-6 border-t border-border/50 justify-end">
      <Button
        variant="outline"
        onClick={onClose}
        className="h-11 px-8 rounded-xl bg-bg3 border-border text-[10px] font-bold uppercase tracking-widest text-text3 hover:text-text hover:bg-bg4 transition-all"
      >
        Cancel
      </Button>
      <Button
        form="category-form"
        type="submit"
        disabled={loading || limitReached}
        className={cn(
          "h-11 px-10 rounded-xl text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all min-w-[180px] flex items-center justify-center gap-2",
          loading || limitReached
            ? "bg-bg4 cursor-not-allowed text-text3 shadow-none"
            : "bg-gradient-to-r from-accent to-accent2"
        )}
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
             <span className="material-symbols-outlined text-[18px]">
               {limitReached ? 'lock' : editCategory ? 'save' : 'add'}
             </span>
             {editCategory ? 'Update Category' : 'Create Category'}
          </>
        )}
      </Button>
    </div>
  );

  return (
    <>
      {isDesktop ? (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
          <DialogContent className="max-w-[520px] p-8 gap-0 bg-bg2 border-border rounded-[32px] shadow-2xl backdrop-blur-md z-[3001] outline-none">
            <DialogHeader className="mb-8">
              <div className="flex items-center gap-4 mb-2">
                <div 
                  className="p-3 rounded-2xl transition-all duration-500"
                  style={{ background: TYPE_CONFIG[selectedType]?.bg }}
                >
                  <span 
                    className="material-symbols-outlined text-2xl font-bold transition-all duration-500"
                    style={{ color: TYPE_CONFIG[selectedType]?.color }}
                  >
                    {editCategory ? 'edit_note' : 'category'}
                  </span>
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black tracking-tight text-text flex items-center gap-2">
                    {editCategory ? 'Edit Classification' : 'New Classification'}
                    {limitReached && <span className="text-red text-sm">🔒</span>}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-text3 font-medium">
                    {limitReached
                      ? 'Basic plan limit reached (12 categories). Upgrade to PRO.'
                      : 'Define how you want to track your financial flow.'}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto px-1 hide-scrollbar">
              {formContent}
            </div>
            {desktopFooter}
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
          <DrawerContent className="px-6 pb-10 max-h-[96vh] bg-bg2 border-border rounded-t-[40px] z-[3001] outline-none">
            <div className="mx-auto w-12 h-1.5 rounded-full bg-bg4 mb-6 mt-3" />
            <DrawerHeader className="px-0 mb-6 text-left">
              <div className="flex items-center gap-4">
                <div 
                  className="p-2.5 rounded-2xl"
                  style={{ background: TYPE_CONFIG[selectedType]?.bg }}
                >
                  <span 
                    className="material-symbols-outlined text-xl font-bold"
                    style={{ color: TYPE_CONFIG[selectedType]?.color }}
                  >
                    {editCategory ? 'edit_square' : 'add_circle'}
                  </span>
                </div>
                <div>
                  <DrawerTitle className="text-xl font-black tracking-tight text-text">
                    {editCategory ? 'Modify Category' : 'Create Category'}
                  </DrawerTitle>
                  <DrawerDescription className="text-[11px] text-text3 font-medium mt-1">
                    {limitReached
                      ? 'Basic plan limit reached (12 categories).'
                      : 'Set up a new bucket for your transactions.'}
                  </DrawerDescription>
                </div>
              </div>
            </DrawerHeader>
            <div className="overflow-y-auto pr-1 -mr-1 hide-scrollbar pb-4">
              {formContent}
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
};

export default AddCategoryPopup;
