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
  '🍔',
  '🛒',
  '🏠',
  '🚗',
  '✈️',
  '💊',
  '🎮',
  '📚',
  '💡',
  '👕',
  '💳',
  '💰',
  '📈',
  '🏋️',
  '🎵',
  '🎁',
  '☕',
  '🔧',
  '📱',
  '🐾',
];

const TYPE_CONFIG = {
  INCOME: {
    label: 'Income',
    icon: 'trending_up',
    color: '#a8edca',
    bg: 'rgba(168,237,202,0.1)',
    border: 'rgba(168,237,202,0.3)',
  },
  EXPENSE: {
    label: 'Expense',
    icon: 'shopping_cart',
    color: '#f97171',
    bg: 'rgba(249,113,113,0.1)',
    border: 'rgba(249,113,113,0.3)',
  },
  TRANSFER: {
    label: 'Transfer',
    icon: 'sync_alt',
    color: 'var(--accent-color)',
    bg: 'var(--hover-bg)',
    border: 'var(--hover-bg)',
  },
};

const AddCategoryPopup = ({
  open,
  onClose,
  onSave,
  editCategory = null,
  defaultType = 'EXPENSE',
}) => {
  const dispatch = useDispatch();
  const { data, error, loading, makeRequest } = useApi();
  const [selectedIcon, setSelectedIcon] = useState('🏷️');
  const [focusedField, setFocusedField] = useState(null);

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
    if (editCategory) {
      setValue('name', editCategory.name || '');
      setValue('type', editCategory.type || defaultType);
      setValue('icon', editCategory.icon || '🏷️');
      setSelectedIcon(editCategory.icon || '🏷️');
    } else {
      reset({ name: '', type: defaultType, icon: '🏷️' });
      setSelectedIcon('🏷️');
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
    handledRef.current = false; // reset for this new submission
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
      reset({ name: '', type: 'EXPENSE', icon: '🏷️' });
      setSelectedIcon('🏷️');
      if (onSave) onSave(data._id);
    }
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  const inputClass = (field) =>
    `w-full py-[11px] px-3.5 rounded-[10px] text-on-surface text-sm outline-none transition-all duration-200 font-body ${
      focusedField === field
        ? 'bg-surface-variant border-surface-variant shadow-[0_0_0_3px_var(--hover-bg)] border'
        : 'bg-secondary-container border border-secondary-container'
    }`;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-[460px] bg-card border border-secondary-container rounded-[20px] py-8 px-[30px] shadow-[0_40px_80px_rgba(0,0,0,0.6)]">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-extrabold text-on-surface tracking-[-0.02em] mb-1">
              {editCategory ? 'Edit Category' : 'New Category'}
              {limitReached && ' 🔒'}
            </h2>
            <p className="text-xs text-on-surface-variant">
              {limitReached
                ? 'Basic plan limit reached (10 categories).'
                : 'Organize your transactions with a custom category'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="bg-secondary-container border border-secondary-container rounded-lg px-2 py-1.5 cursor-pointer text-on-surface-variant flex items-center"
          >
            <span
              className="material-symbols-outlined text-lg"
              style={{ fontVariationSettings: "'FILL' 0" }}
            >
              close
            </span>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Type selector */}
          <div className="mb-5">
            <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.08em] mb-2.5">
              Category Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(TYPE_CONFIG).map(([key, conf]) => (
                <label
                  key={key}
                  className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl cursor-pointer border-[1.5px] transition-all duration-200`}
                  style={{
                    backgroundColor:
                      selectedType === key ? conf.bg : 'var(--input-bg)',
                    borderColor:
                      selectedType === key ? conf.border : 'var(--input-bg)',
                  }}
                >
                  <input
                    type="radio"
                    {...register('type')}
                    value={key}
                    className="hidden"
                  />
                  <span
                    className="material-symbols-outlined text-[20px]"
                    style={{
                      color:
                        selectedType === key ? conf.color : 'var(--text-muted)',
                      fontVariationSettings: "'FILL' 0",
                    }}
                  >
                    {conf.icon}
                  </span>
                  <span
                    className="text-[11px] font-bold tracking-[0.04em]"
                    style={{
                      color:
                        selectedType === key ? conf.color : 'var(--text-muted)',
                    }}
                  >
                    {conf.label}
                  </span>
                </label>
              ))}
            </div>
            {errors.type && (
              <p className="mt-1.5 text-[11px] text-error">
                {errors.type.message}
              </p>
            )}
          </div>

          {/* Name */}
          <div className="mb-5">
            <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.08em] mb-2">
              Category Name
            </label>
            <input
              type="text"
              {...register('name')}
              disabled={limitReached}
              placeholder={
                limitReached
                  ? 'Limit reached...'
                  : 'e.g. Groceries, Salary, Rent…'
              }
              className={inputClass('name')}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
            />
            {errors.name && (
              <p className="mt-1.5 text-[11px] text-error">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Icon picker */}
          <div className="mb-6">
            <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.08em] mb-2">
              Icon &nbsp;
              <span className="text-on-surface-variant font-normal normal-case">
                Selected: {selectedIcon}
              </span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  disabled={limitReached}
                  onClick={() => {
                    setSelectedIcon(ic);
                    setValue('icon', ic);
                  }}
                  className={`w-9 h-9 text-lg rounded-lg cursor-pointer border-[1.5px] transition-all duration-150 ${
                    selectedIcon === ic
                      ? 'bg-surface-variant border-surface-variant'
                      : 'bg-secondary-container border-secondary-container'
                  } ${limitReached ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 p-3 bg-secondary-container border border-secondary-container rounded-[10px] text-on-surface-variant text-[13px] font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || limitReached}
              className={`flex-[2] p-3 border-none rounded-[10px] text-background text-[13px] font-bold flex items-center justify-center gap-2 ${
                loading || limitReached
                  ? 'bg-surface-variant cursor-not-allowed text-primary'
                  : 'bg-primary cursor-pointer'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-[rgba(6,20,35,0.3)] border-t-background rounded-full animate-spin" />{' '}
                  Saving...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base font-semibold">
                    {limitReached ? 'lock' : 'check'}
                  </span>
                  {editCategory ? 'Update Category' : 'Create Category'}
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
