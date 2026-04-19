import { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'sonner';
import api from '@/utils/httpMethods';
import { removeCategory } from '@/redux/categorySlice';
import { DeleteConfirmModal } from '../SharedComponents';
import AddCategoryPopup from '../AddCategoryPopup';

export default function Taxonomy() {
  const dispatch = useDispatch();
  
  // Use useMemo to flatten the grouped categories for the list view
  const { categories: groupedCategories } = useSelector(s => s.category);
  const categories = useMemo(() => {
    const { INCOME = [], EXPENSE = [], TRANSFER = [] } = groupedCategories || {};
    return [...INCOME, ...EXPENSE, ...TRANSFER];
  }, [groupedCategories]);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteCatModal, setDeleteCatModal] = useState(null);
  const [deletingCat, setDeletingCat] = useState(false);

  const getCatTypeStyles = (type) => ({
    INCOME:   { icon: 'trending_up',   color: 'var(--green)', bg: 'var(--green-bg)' },
    EXPENSE:  { icon: 'shopping_cart', color: 'var(--red)',   bg: 'var(--red-bg)'   },
    TRANSFER: { icon: 'sync_alt',      color: 'var(--accent)', bg: 'var(--accent-glow)' },
  }[type] || { icon: 'category', color: 'var(--accent)', bg: 'var(--accent-glow)' });

  const handleDeleteCategory = async () => {
    if (!deleteCatModal) return;
    setDeletingCat(true);
    try {
      await api.delete(`/catagory/${deleteCatModal._id}`);
      dispatch(removeCategory({ _id: deleteCatModal._id, type: deleteCatModal.type }));
      toast.success('Category deleted');
      setDeleteCatModal(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete category');
    } finally {
      setDeletingCat(false);
    }
  };

  const { user } = useSelector((state) => state.auth);
  const plan = user?.user?.plan || user?.plan || 'basic';
  const isPro = plan === 'pro';

  const limitReached = !isPro && categories.length >= 10;

  const handleAddCategory = () => {
    if (limitReached) {
      toast.error('Basic plan limit reached (10 categories). Upgrade to PRO to add more.');
      return;
    }
    setEditingCategory(null);
    setIsCategoryModalOpen(true);
  };

  return (
    <div className="settings-card">
      <div className="settings-section-title"><div className="icon">🏷️</div>Categories</div>

      {categories.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text3)', border: '1px dashed var(--border)', borderRadius: 'var(--r2)' }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>🏷️</div>
          <div style={{ fontSize: 13 }}>No categories identified</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {categories.slice(0, 10).map((cat) => { // Slicing for brevity in settings
            const styles = getCatTypeStyles(cat.type);
            return (
              <div key={cat._id} className="cat-row">
                <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <div 
                    className="cat-icon-wrap" 
                    style={{ background: styles.bg, color: styles.color }}
                  >
                    {cat.icon || <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{styles.icon}</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{cat.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase' }}>{cat.type}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button 
                    className="icon-btn" 
                    style={{ width: 26, height: 26, fontSize: 11 }}
                    onClick={() => { setEditingCategory(cat); setIsCategoryModalOpen(true); }}
                  >
                    ✏️
                  </button>
                  <button 
                    className="icon-btn" 
                    style={{ width: 26, height: 26, fontSize: 11 }}
                    onClick={() => setDeleteCatModal(cat)}
                  >
                    🗑
                  </button>
                </div>
              </div>
            );
          })}
          {categories.length > 10 && (
            <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', marginTop: 8 }}>
              + {categories.length - 10} more categories
            </div>
          )}
        </div>
      )}

      <button 
        onClick={handleAddCategory}
        className="btn-outline" 
        style={{ width: '100%', marginTop: 12, border: limitReached ? '1px dashed var(--red)' : '' }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16, marginRight: 6 }}>{limitReached ? 'lock' : 'add'}</span>
        {limitReached ? 'Limit Reached (Upgrade to PRO)' : 'Add New Category'}
      </button>


      <AddCategoryPopup
        open={isCategoryModalOpen}
        onClose={() => { setIsCategoryModalOpen(false); setEditingCategory(null); }}
        editCategory={editingCategory}
        onSave={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
        }}
      />

      {deleteCatModal && (
        <DeleteConfirmModal
          title="Delete Category"
          description={`Permanently remove "${deleteCatModal.name}"? Active entries will be uncategorized.`}
          busy={deletingCat}
          onConfirm={handleDeleteCategory}
          onCancel={() => setDeleteCatModal(null)}
        />
      )}
    </div>
  );
}

