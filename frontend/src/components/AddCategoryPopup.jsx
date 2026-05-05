/* eslint-disable react/prop-types */
import { useState, useEffect, useRef, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import useApi from '@/hooks/useApi';
import { addCatagory, updateCategory } from '@/redux/categorySlice';
import { toast } from 'sonner';

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
];

const TYPE_CONFIG = {
  INCOME: {
    label: 'Income',
    icon: 'trending_up',
    color: 'var(--green)',
    bg: 'var(--green-bg)',
    border: 'var(--green-border)',
  },
  EXPENSE: {
    label: 'Expense',
    icon: 'shopping_cart',
    color: 'var(--red)',
    bg: 'var(--red-bg)',
    border: 'var(--red-border)',
  },
  TRANSFER: {
    label: 'Transfer',
    icon: 'sync_alt',
    color: 'var(--accent)',
    bg: 'var(--accent-glow)',
    border: 'rgba(91,141,239,0.15)',
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
  const plan = user?.user?.plan || user?.plan || 'basic';
  const isPro = plan === 'pro';
  const limitReached = !isPro && categories.length >= 10 && !editCategory;

  const onSubmit = (formData) => {
    if (limitReached) {
      toast.error('Limit reached (10 categories). Upgrade to PRO.');
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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[3000] flex items-center justify-center p-4 transition-all duration-300"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-[480px] bg-bg2 border border-border rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <header className="mb-6 flex justify-between items-start">
          <div>
            <h3 className="text-xl font-black text-text tracking-tight mb-1">
              {editCategory ? 'Edit Category' : 'New Category'}
              {limitReached && ' 🔒'}
            </h3>
            <p className="text-xs text-text3 font-medium">
              {limitReached
                ? 'Basic plan limit reached (10 categories).'
                : 'Define a custom classification for your ledger.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-bg3 hover:bg-bg4 border border-border rounded-lg text-text3 transition-all"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Type selector */}
          <div className="space-y-2.5">
            <label className="block text-[10px] font-bold text-text3 uppercase tracking-[0.2em] ml-1">
              Category Type
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {Object.entries(TYPE_CONFIG).map(([key, conf]) => (
                <label
                  key={key}
                  className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl cursor-pointer border-[1.5px] transition-all duration-300 ${
                    selectedType === key 
                      ? 'shadow-sm translate-y-[-1px]' 
                      : 'bg-bg3 border-border grayscale opacity-60 hover:grayscale-0 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: selectedType === key ? conf.bg : undefined,
                    borderColor: selectedType === key ? conf.border : undefined,
                  }}
                >
                  <input
                    type="radio"
                    {...register('type')}
                    value={key}
                    className="hidden"
                  />
                  <span
                    className="material-symbols-outlined text-[22px]"
                    style={{
                      color: selectedType === key ? conf.color : 'var(--text3)',
                      fontVariationSettings: "'FILL' 0",
                    }}
                  >
                    {conf.icon}
                  </span>
                  <span
                    className="text-[10px] font-black tracking-widest uppercase"
                    style={{
                      color: selectedType === key ? conf.color : 'var(--text3)',
                    }}
                  >
                    {conf.label}
                  </span>
                </label>
              ))}
            </div>
            {errors.type && (
              <p className="mt-1.5 text-[11px] font-medium text-red">
                {errors.type.message}
              </p>
            )}
          </div>

          {/* Name */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-text3 uppercase tracking-[0.2em] ml-1">
              Category Name
            </label>
            <input
              type="text"
              {...register('name')}
              disabled={limitReached}
              placeholder={limitReached ? 'Limit reached...' : 'e.g. Groceries, Rent…'}
              className="w-full bg-bg3 border border-border rounded-xl py-3 px-4 text-text focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40 transition-all placeholder:text-text3/30 text-sm font-medium"
            />
            {errors.name && (
              <p className="mt-1.5 text-[11px] font-medium text-red">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Icon picker */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-text3 uppercase tracking-[0.2em] ml-1">
              Identity Icon &nbsp;
              <span className="text-text3/40 font-medium normal-case">
                {selectedIcon}
              </span>
            </label>
            <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto pr-1 hide-scrollbar">
              {ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  disabled={limitReached}
                  onClick={() => {
                    setSelectedIcon(ic);
                    setValue('icon', ic);
                  }}
                  className={`w-10 h-10 text-xl rounded-xl cursor-pointer border-[1.5px] transition-all duration-200 ${
                    selectedIcon === ic
                      ? 'bg-accent-glow border-accent'
                      : 'bg-bg3 border-border hover:border-text3/30'
                  } ${limitReached ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 bg-bg3 border border-border hover:bg-bg4 text-text3 hover:text-text rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || limitReached}
              className={`flex-[2] h-12 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-accent/20 transition-all flex items-center justify-center gap-2 ${
                loading || limitReached
                  ? 'bg-bg4 cursor-not-allowed text-text3'
                  : 'bg-gradient-to-r from-accent to-accent2 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-base font-semibold">
                    {limitReached ? 'lock' : 'check'}
                  </span>
                  {editCategory ? 'Update' : 'Confirm'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCategoryPopup;
