import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
});

function CategoryModal({ isOpen, onClose, onSave }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '' },
  });

  const onSubmit = (data) => {
    onSave(data.name);
    reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card text-on-surface border border-secondary-container sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold font-headline">
            Add New Category
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant block mb-1">
              Category Name
            </label>
            <Input
              {...register('name')}
              placeholder="Enter category name"
              className="bg-secondary-container border border-secondary-container text-on-surface focus-visible:ring-primary/40 focus-visible:border-primary/40"
            />
            {errors.name && (
              <p className="text-error text-xs font-semibold mt-1">
                {errors.name.message}
              </p>
            )}
          </div>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="bg-surface-variant hover:bg-surface-variant/80 text-on-surface"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:opacity-90 text-on-primary"
            >
              Add Category
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CategoryModal;
