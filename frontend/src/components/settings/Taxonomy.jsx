import { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'sonner';
import { Tag, Plus, Pencil, Trash2, Lock } from 'lucide-react';
import api from '@/utils/httpMethods';
import { removeCategory } from '@/redux/categorySlice';
import { ConfirmModal } from '../SharedComponents';
import AddCategoryPopup from '../AddCategoryPopup';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/utils';

export default function Taxonomy() {
  const dispatch = useDispatch();

  // Use useMemo to flatten the grouped categories for the list view
  const { categories: groupedCategories } = useSelector((s) => s.category);
  const categories = useMemo(() => {
    const {
      INCOME = [],
      EXPENSE = [],
      TRANSFER = [],
    } = groupedCategories || {};
    return [...INCOME, ...EXPENSE, ...TRANSFER];
  }, [groupedCategories]);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteCatModal, setDeleteCatModal] = useState(null);
  const [deletingCat, setDeletingCat] = useState(false);

  const getCatTypeStyles = (type) =>
    ({
      INCOME: {
        icon: 'trending_up',
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
      },
      EXPENSE: {
        icon: 'shopping_cart',
        color: 'text-rose-500',
        bg: 'bg-rose-500/10',
      },
      TRANSFER: {
        icon: 'sync_alt',
        color: 'text-indigo-500',
        bg: 'bg-indigo-500/10',
      },
    })[type] || {
      icon: 'category',
      color: 'text-slate-500',
      bg: 'bg-slate-500/10',
    };

  const currentUser = useSelector((s) => s.auth.user);

  const handleDeleteCategory = async () => {
    if (!deleteCatModal) return;
    setDeletingCat(true);
    try {
      await api.delete(`/catagory/${deleteCatModal._id}`);
      dispatch(
        removeCategory({ _id: deleteCatModal._id, type: deleteCatModal.type }),
      );
      toast.success('Category deleted');
      setDeleteCatModal(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete category');
    } finally {
      setDeletingCat(false);
    }
  };

  const isPro = currentUser?.role === 'admin' || currentUser?.plan === 'pro';
  const limitReached = !isPro && categories.length >= 10;


  const handleAddCategory = () => {
    if (limitReached) {
      toast.error(
        'Basic plan limit reached (10 categories). Upgrade to PRO to add more.',
      );
      return;
    }
    setEditingCategory(null);
    setIsCategoryModalOpen(true);
  };

  return (
    <Card className="border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden">
      <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold">Categories</CardTitle>
            <CardDescription className="text-xs">Manage your income and expense categories</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {!isPro && (
          <div className="flex justify-end mb-4">
            <Badge variant="outline" className={cn(
              "text-[10px] font-bold uppercase tracking-wider px-3 py-1",
              limitReached ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
            )}>
              {categories.length}/10 Used
            </Badge>
          </div>
        )}
        <div className="p-1 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center mb-4">
                <Tag className="w-6 h-6 text-slate-300" />
              </div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">No categories identified</div>
              <div className="text-[10px] text-slate-400/60 mt-1">Start by adding your first category below</div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {categories.slice(0, 10).map((cat) => {
                const styles = getCatTypeStyles(cat.type);
                return (
                  <div key={cat._id} className="group flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all duration-200">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-sm",
                        styles.bg,
                        styles.color
                      )}>
                        {cat.icon || (
                          <span className="material-symbols-outlined !text-base">
                            {styles.icon}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
                          {cat.name}
                        </div>
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-70">
                          {cat.type}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg hover:bg-indigo-500/10 hover:text-indigo-500"
                        onClick={() => {
                          setEditingCategory(cat);
                          setIsCategoryModalOpen(true);
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg hover:bg-rose-500/10 hover:text-rose-500"
                        onClick={() => setDeleteCatModal(cat)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              {categories.length > 10 && (
                <div className="p-3 text-center bg-slate-50/50 dark:bg-slate-900/30">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    + {categories.length - 10} more categories
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <Button
          onClick={handleAddCategory}
          variant="outline"
          className={cn(
            "w-full mt-6 h-11 rounded-xl border-dashed border-2 hover:border-solid transition-all font-bold text-[11px] uppercase tracking-widest gap-2",
            limitReached 
              ? "border-rose-500/30 text-rose-500 hover:bg-rose-500/5 hover:border-rose-500" 
              : "border-indigo-500/30 text-indigo-500 hover:bg-indigo-500/5 hover:border-indigo-500"
          )}
        >
          {limitReached ? <Lock className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {limitReached ? 'Limit Reached (Upgrade to PRO)' : 'Add New Category'}
        </Button>
      </CardContent>

      <AddCategoryPopup
        open={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        editCategory={editingCategory}
        onSave={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
        }}
      />

      {deleteCatModal && (
        <ConfirmModal
          title="Delete Category"
          description={`Permanently remove "${deleteCatModal.name}"? Active entries will be uncategorized.`}
          confirmLabel="Delete"
          busy={deletingCat}
          onConfirm={handleDeleteCategory}
          onCancel={() => setDeleteCatModal(null)}
        />
      )}
    </Card>
  );
}
