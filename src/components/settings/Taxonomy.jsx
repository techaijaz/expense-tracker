import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'sonner';
import api from '@/utils/httpMethods';
import { removeCategory } from '@/redux/categorySlice';
import { SectionCard, SectionTitle, DeleteConfirmModal } from '../SharedComponents';
import AddCategoryPopup from '../AddCategoryPopup';

export default function Taxonomy() {
  const dispatch = useDispatch();
  
  // The global state holds categories if they've been fetched
  const categories = useSelector(s => s.category?.categories || []);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteCatModal, setDeleteCatModal] = useState(null);
  const [deletingCat, setDeletingCat] = useState(false);

  const getCatConfig = (type) => ({
    INCOME:   { icon: 'trending_up',   color: '#a8edca', bg: 'rgba(168,237,202,0.08)' },
    EXPENSE:  { icon: 'shopping_cart', color: '#f97171', bg: 'rgba(249,113,113,0.08)' },
    TRANSFER: { icon: 'sync_alt',      color: 'var(--accent-color)', bg: 'var(--hover-bg)'  },
  }[type] || { icon: 'category', color: 'var(--accent-color)', bg: 'var(--hover-bg)' });

  const handleDeleteCategory = async () => {
    if (!deleteCatModal) return;
    setDeletingCat(true);
    try {
      await api.delete(`/catagory/${deleteCatModal._id}`);
      dispatch(removeCategory(deleteCatModal._id));
      toast.success('Category deleted');
      setDeleteCatModal(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete category');
    } finally {
      setDeletingCat(false);
    }
  };

  return (
    <SectionCard>
      <div className="flex justify-between items-center mb-5">
        <SectionTitle icon="category">Taxonomy & Classifications</SectionTitle>
        <button onClick={() => { setEditingCategory(null); setIsCategoryModalOpen(true); }}
          className="px-3.5 py-2 bg-surface-variant border border-surface-variant rounded-[10px] text-primary text-xs font-bold cursor-pointer flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 0" }}>add_circle</span>New Category
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="text-center p-7 rounded-xl border border-dashed border-secondary-container">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant block mb-2" style={{ fontVariationSettings: "'FILL' 0" }}>category</span>
          <p className="text-[13px] text-on-surface-variant">No categories yet. Add one to begin.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {categories.map((cat) => {
            const cfg = getCatConfig(cat.type);
            return (
              <div key={cat._id} className="flex items-center gap-3 p-3 bg-secondary-container border border-secondary-container rounded-xl transition-colors duration-200 hover:border-outline">
                <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: cfg.bg, fontSize: cat.icon ? 18 : 0 }}>
                  {cat.icon ? cat.icon : <span className="material-symbols-outlined text-[18px]" style={{ color: cfg.color, fontVariationSettings: "'FILL' 0" }}>{cfg.icon}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-on-surface mb-0.5 truncate">{cat.name}</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.06em]" style={{ color: cfg.color }}>{cat.type}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditingCategory(cat); setIsCategoryModalOpen(true); }}
                    className="p-1.5 rounded-lg bg-surface-variant border border-surface-variant cursor-pointer text-primary flex items-center">
                    <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 0" }}>edit</span>
                  </button>
                  <button onClick={() => setDeleteCatModal(cat)}
                    className="p-1.5 rounded-lg bg-error/5 border border-error/15 cursor-pointer text-error flex items-center">
                    <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 0" }}>delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Internal Modals for categories */}
      <AddCategoryPopup
        open={isCategoryModalOpen}
        onClose={() => { setIsCategoryModalOpen(false); setEditingCategory(null); }}
        editCategory={editingCategory}
        onSave={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
          // Assuming Redux handles state natively after AddCategoryPopup returns.
        }}
      />

      {deleteCatModal && (
        <DeleteConfirmModal
          title="Delete Category"
          description={`Are you sure you want to delete the category "${deleteCatModal.name}"? This action cannot be undone.`}
          busy={deletingCat}
          onConfirm={handleDeleteCategory}
          onCancel={() => setDeleteCatModal(null)}
        />
      )}
    </SectionCard>
  );
}
