/* eslint-disable react/prop-types */
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import catagorySchema from '@/schema/catagorySchema'; // Import the Zod schema
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { useDispatch } from 'react-redux';
import useApi from '@/hooks/useApi';
import { addCatagory } from '@/redux/categorySlice';
import { useEffect } from 'react';
import { toast } from 'sonner';

const AddCategoryPopup = ({ open, onClose, onSave }) => {
  const dispatch = useDispatch();
  const { data, error, loading, makeRequest } = useApi();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(catagorySchema.catagorySchema), // Use the Zod schema for validation
  });

  const onSubmit = (data) => {
    // Example category object
    makeRequest({
      url: '/catagory/add',
      method: 'post',
      data: { name: data.name },
    });
    reset(); // Reset the form after submission
  };

  useEffect(() => {
    if (error) {
      toast.error(error || 'Failed to add category. Please try again.');
    }
  }, [error]);

  useEffect(() => {
    if (data) {
      dispatch(addCatagory(data));
      onSave(data._id);
      toast.success('Category added successfully.');
    }
  }, [dispatch, data, onSave]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Category</DialogTitle>
          <DialogDescription>
            Enter the name of the new category.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <input
            type="text"
            {...register('name')}
            placeholder="Category Name"
            className={`border p-2 rounded w-full ${
              errors.name ? 'border-red-500' : ''
            }`}
          />
          {errors.name && <p className="text-red-500">{errors.name.message}</p>}

          <div className="flex justify-end space-x-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 p-2 rounded"
            >
              Cancel
            </button>
            {loading ? (
              <button className="bg-blue-500 text-white p-2 rounded">
                Adding...
              </button>
            ) : (
              <button
                type="submit"
                className="bg-blue-500 text-white p-2 rounded"
              >
                Add
              </button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCategoryPopup;
