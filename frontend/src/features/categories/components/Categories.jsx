import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import api from '@/utils/httpMethods';
import {
  setCategories,
  removeCategory,
} from '@/features/categories/state/categorySlice';
import AddCategoryPopup from './AddCategoryPopup';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const TYPE_CONFIG = {
  INCOME: {
    label: 'Income Sources',
    icon: 'trending_up',
    color: 'text-green-500',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    glow: 'shadow-green-500/10',
  },
  EXPENSE: {
    label: 'Expense Channels',
    icon: 'shopping_cart',
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    glow: 'shadow-red-500/10',
  },
  TRANSFER: {
    label: 'Transfer Routes',
    icon: 'sync_alt',
    color: 'text-accent',
    bg: 'bg-accent/10',
    border: 'border-accent/20',
    glow: 'shadow-accent/10',
  },
};

export default function Categories() {
  const dispatch = useDispatch();
  const { categories: groupedCategories } = useSelector(
    (state) => state.category,
  );
  const [loading, setLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [deleteInput, setDeleteInput] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const res = await api.get('/catagory');
        // Backend returns { grouped: { INCOME: [], ... } }
        dispatch(setCategories(res?.data?.grouped || res?.data || {}));
      } catch (e) {
        toast.error('Failed to load categories');
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, [dispatch]);

  const handleDelete = async (category) => {
    if (deleteInput.toUpperCase() !== 'DELETE') return;
    try {
      await api.delete(`/catagory/${category._id}`);
      dispatch(removeCategory({ _id: category._id, type: category.type }));
      toast.success(`Category "${category.name}" removed successfully.`);
      setDeletingCategory(null);
      setDeleteInput('');
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to delete category');
    }
  };

  const renderCategoryCard = (cat) => {
    const config = TYPE_CONFIG[cat.type] || TYPE_CONFIG.EXPENSE;
    return (
      <div
        key={cat._id}
        className="group relative bg-bg2 rounded-[var(--r3)] p-5 border border-border hover:border-border2 hover:bg-bg3 transition-all duration-300 shadow-sm"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div
              className={`w-12 h-12 rounded-lg ${config.bg} ${config.color} flex items-center justify-center text-2xl shadow-inner border border-white/5`}
            >
              <span className="material-symbols-outlined">{config.icon}</span>
            </div>
            <div className="min-w-0">
              <h4 className="text-text font-bold text-[15px] truncate tracking-tight">
                {cat.name}
              </h4>
              <p
                className={`text-[10px] font-bold uppercase tracking-[0.1em] ${config.color} mt-1`}
              >
                {cat.type}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditingCategory(cat)}
              className="h-8 w-8 hover:bg-bg4 text-text3 hover:text-accent transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">
                edit
              </span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeletingCategory(cat)}
              className="h-8 w-8 hover:bg-red-500/10 text-text3 hover:text-red-500 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">
                delete
              </span>
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="page-body pt-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-text">
            Categories
          </h1>
          <p className="text-text3 text-[13px]">
            Design and organize your financial classification system.
          </p>
        </div>
        <Button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-accent to-accent2 text-white rounded-[var(--r2)] text-[13px] font-bold shadow-lg shadow-accent/20 hover:opacity-90 active:scale-95 transition-all border-none"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          New Category
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-6">
              <div className="h-6 w-32 bg-bg4 animate-pulse rounded-md" />
              <div className="space-y-4">
                {[1, 2, 3].map((j) => (
                  <div
                    key={j}
                    className="h-[88px] bg-bg4 rounded-[var(--r3)] animate-pulse"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {Object.entries(TYPE_CONFIG).map(([type, config]) => {
            const list = groupedCategories[type] || [];
            return (
              <div key={type} className="space-y-6">
                <div className="flex items-center justify-between px-1 mb-4 border-b border-border pb-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-text2 flex items-center gap-2">
                    <span className={`material-symbols-outlined ${config.color} text-[18px]`}>
                      {config.icon}
                    </span>
                    {config.label}
                  </h3>
                  <span className="text-[10px] bg-bg3 px-2 py-0.5 rounded-full font-mono text-text3">
                    {list.length} Category{list.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-3.5">
                  {list.length > 0 ? (
                    list.map(renderCategoryCard)
                  ) : (
                    <div className="py-10 flex flex-col items-center justify-center border-2 border-dashed border-border2 rounded-[var(--r3)] bg-bg2">
                      <p className="text-[10px] uppercase font-bold tracking-[0.1em] text-text3">
                        No {type.toLowerCase()} categories
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Popups */}
      <AddCategoryPopup
        open={isAddOpen || !!editingCategory}
        onClose={() => {
          setIsAddOpen(false);
          setEditingCategory(null);
        }}
        editCategory={editingCategory}
        onSave={() => {
          setIsAddOpen(false);
          setEditingCategory(null);
        }}
      />

      <Dialog
        open={!!deletingCategory}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingCategory(null);
            setDeleteInput('');
          }
        }}
      >
        <DialogContent className="bg-bg2 border-border2 rounded-[var(--r4)] max-w-[440px] p-7">
          <DialogHeader>
            <DialogTitle className="text-text text-[18px] font-bold tracking-tight flex items-center gap-2">
              <span
                className="material-symbols-outlined text-red-500"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                warning
              </span>
              Delete Category
            </DialogTitle>
            <DialogDescription className="text-text2 text-[13px] leading-relaxed pt-2">
              Deleting{' '}
              <span className="text-text font-bold">
                "{deletingCategory?.name}"
              </span>{' '}
              will result in its transactions being orphaned or reassigned to
              "General". This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-[var(--r2)]">
            <div className="text-[11px] font-bold text-red-500 uppercase tracking-[0.08em] mb-2">
              Confirm Deletion
            </div>
            <div className="text-xs text-text2 mb-3">
              Type <b>DELETE</b> to confirm this operation.
            </div>
            <Input
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="Type DELETE here..."
              className="bg-bg2 border-red-500/30 text-text text-[13px] focus-visible:ring-red-500"
              autoFocus
            />
          </div>
          <DialogFooter className="mt-6 gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setDeletingCategory(null);
                setDeleteInput('');
              }}
              className="rounded-[var(--r2)] text-[13px] font-semibold border-border2 text-text2 hover:text-text hover:bg-bg4"
            >
              Cancel
            </Button>
            <Button
              disabled={deleteInput.toUpperCase() !== 'DELETE'}
              onClick={() => handleDelete(deletingCategory)}
              className="rounded-[var(--r2)] text-[13px] font-semibold bg-red-500 hover:bg-red-600 text-white border-none disabled:opacity-50"
            >
              Confirm Deletion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
