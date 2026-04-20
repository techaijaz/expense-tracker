import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import api from '@/utils/httpMethods';
import {
  setCategories,
  removeCategory,
} from '@/redux/categorySlice';
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
    color: 'text-tertiary',
    bg: 'bg-tertiary/10',
    border: 'border-tertiary/20',
    glow: 'shadow-tertiary/10',
  },
  EXPENSE: {
    label: 'Expense Channels',
    icon: 'shopping_cart',
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
    glow: 'shadow-primary/10',
  },
  TRANSFER: {
    label: 'Transfer Routes',
    icon: 'sync_alt',
    color: 'text-secondary',
    bg: 'bg-secondary/10',
    border: 'border-secondary/20',
    glow: 'shadow-secondary/10',
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
        className="group relative bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/5 hover:border-outline-variant/20 hover:bg-surface-container-low transition-all duration-300 shadow-sm"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div
              className={`w-12 h-12 rounded-lg ${config.bg} ${config.color} flex items-center justify-center text-2xl shadow-inner border border-white/5`}
            >
              {cat.icon || '🏷️'}
            </div>
            <div className="min-w-0">
              <h4 className="text-on-surface font-bold text-sm truncate uppercase tracking-tight">
                {cat.name}
              </h4>
              <p
                className={`text-[10px] font-black uppercase tracking-widest ${config.color} mt-0.5 opacity-80`}
              >
                {cat.type}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setEditingCategory(cat)}
              className="p-1.5 rounded-md hover:bg-primary/10 text-outline hover:text-primary transition-colors outline-none"
            >
              <span className="material-symbols-outlined text-[20px]">
                edit
              </span>
            </button>
            <button
              onClick={() => setDeletingCategory(cat)}
              className="p-1.5 rounded-md hover:bg-error/10 text-outline hover:text-error transition-colors outline-none"
            >
              <span className="material-symbols-outlined text-[20px]">
                delete
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 p-6 lg:p-10 w-full max-w-[1600px] mx-auto min-h-screen bg-surface">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-12">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold font-headline tracking-tight text-on-surface">
            Category Architecture
          </h1>
          <p className="text-slate-400 text-sm font-body">
            Design and organize your financial classification system.
          </p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-br from-primary to-on-primary-container text-on-primary rounded-lg font-headline text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all outline-none"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          New Category
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-6">
              <div className="h-6 w-32 bg-surface-container-highest/40 animate-pulse rounded-md" />
              <div className="space-y-4">
                {[1, 2, 3].map((j) => (
                  <div
                    key={j}
                    className="h-20 bg-surface-container-highest/20 rounded-xl animate-pulse"
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
                <div className="flex items-center gap-3 px-1">
                  <span
                    className={`material-symbols-outlined ${config.color} text-xl`}
                  >
                    {config.icon}
                  </span>
                  <h3 className="text-on-surface font-black font-headline text-sm uppercase tracking-[0.15em]">
                    {config.label}
                    <span className="ml-2 text-[10px] text-outline opacity-40">
                      ({list.length})
                    </span>
                  </h3>
                </div>
                <div className="space-y-3.5">
                  {list.length > 0 ? (
                    list.map(renderCategoryCard)
                  ) : (
                    <div className="py-10 flex flex-col items-center justify-center border-2 border-dashed border-outline-variant/10 rounded-xl bg-surface-container-low/20">
                      <p className="text-[10px] uppercase font-black tracking-widest text-outline opacity-40">
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

      {/* Delete Confirmation Modal */}
      <Dialog
        open={!!deletingCategory}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingCategory(null);
            setDeleteInput('');
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px] bg-surface-container-highest border-outline-variant/20 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-on-surface flex items-center gap-2 font-headline font-black text-xl">
              <span
                className="material-symbols-outlined text-error"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                warning
              </span>
              Destructive Operation
            </DialogTitle>
            <DialogDescription className="py-4 text-outline font-medium text-sm leading-relaxed">
              Deleting{' '}
              <span className="text-on-surface font-bold">
                "{deletingCategory?.name}"
              </span>{' '}
              will result in its transactions being orphaned or reassigned to
              "General". This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-[10px] font-black text-outline uppercase tracking-[0.2em]">
              Type <span className="text-on-surface">"Delete"</span> to confirm:
            </p>
            <Input
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="Type Delete here..."
              className="bg-surface-container-low border-outline-variant/30 text-on-surface font-medium placeholder:text-outline/30 focus:ring-primary/40 focus:bg-surface-container-high transition-all"
              autoFocus
            />
          </div>
          <DialogFooter className="mt-8 flex gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setDeletingCategory(null);
                setDeleteInput('');
              }}
              className="px-6 text-xs font-bold font-headline uppercase tracking-widest text-outline hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteInput !== 'DELETE'}
              onClick={() => handleDelete(deletingCategory)}
              className="px-8 bg-error text-on-error font-bold font-headline uppercase tracking-widest text-[11px] shadow-lg shadow-error/20 hover:opacity-90 disabled:opacity-30 transition-all font-black"
            >
              Confirm Deletion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
