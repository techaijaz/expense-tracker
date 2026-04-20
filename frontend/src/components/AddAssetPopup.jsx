import React, { useState, useEffect } from 'react';
import { X, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import api from '@/utils/httpMethods';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/utils/utils';
import { restrictDecimals } from '@/utils/format';
import { z } from 'zod';

const assetSchema = z.object({
  name: z.string().min(2, 'Title must be at least 2 characters'),
  type: z.enum(['GOLD', 'SILVER', 'VEHICLE', 'REAL_ESTATE']),
  currentValue: z
    .string()
    .refine(
      (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
      'Enter a valid market value',
    ),
  initialValue: z.string().optional(),
  acquiredAt: z
    .date()
    .max(
      new Date(new Date().setHours(23, 59, 59, 999)),
      'Date cannot be in the future',
    ),
  description: z.string().max(250, 'Notes are too long (max 250)').optional(),
});

const ASSET_TYPES = [
  { id: 'GOLD', label: 'Physical Gold' },
  { id: 'SILVER', label: 'Silver/Metal' },
  { id: 'VEHICLE', label: 'Vehicles/Automobile' },
  { id: 'REAL_ESTATE', label: 'Real Estate/Property' },
];

const AddAssetPopup = ({ isOpen, onClose, onSuccess, assetToEdit = null }) => {
  const [loading, setLoading] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    type: 'GOLD',
    currentValue: '',
    initialValue: '',
    acquiredAt: new Date(),
    description: '',
  });

  const validate = () => {
    const result = assetSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors = {};
      result.error.errors.forEach((err) => {
        fieldErrors[err.path[0]] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  useEffect(() => {
    if (isOpen) validate();
  }, [formData, isOpen]);

  useEffect(() => {
    if (assetToEdit) {
      setFormData({
        name: assetToEdit.name || '',
        type: assetToEdit.type || 'GOLD',
        currentValue: String(assetToEdit.currentValue || ''),
        initialValue: String(assetToEdit.initialValue || ''),
        acquiredAt: assetToEdit.acquiredAt
          ? new Date(assetToEdit.acquiredAt)
          : new Date(),
        description: assetToEdit.description || '',
      });
    } else {
      setFormData({
        name: '',
        type: 'GOLD',
        currentValue: '',
        initialValue: '',
        acquiredAt: new Date(),
        description: '',
      });
    }
  }, [assetToEdit, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the validation errors before submitting');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        acquiredAt: formData.acquiredAt.toISOString(),
        currentValue: parseFloat(formData.currentValue),
        initialValue: formData.initialValue
          ? parseFloat(formData.initialValue)
          : parseFloat(formData.currentValue),
      };

      let response;
      if (assetToEdit) {
        response = await api.put(`/assets/${assetToEdit._id}`, payload);
      } else {
        response = await api.post('/assets', payload);
      }

      if (response.success) {
        toast.success(assetToEdit ? 'Asset updated' : 'Asset added');
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error saving asset:', error);
      toast.error(error.response?.data?.message || 'Failed to save asset');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleClose = () => onClose();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: 'var(--bg2)',
          border: '1px solid var(--border2)',
          borderRadius: 'var(--r4)',
          padding: '20px 24px',
          width: '100%',
          maxWidth: '540px',
          position: 'relative',
          maxHeight: 'calc(100vh - 40px)',
          overflow: 'hidden',
          animation: 'txnModalIn 0.2s ease',
        }}
      >
        {/* ── Close Button ── */}
        <button
          onClick={handleClose}
          type="button"
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: 'var(--bg4)',
            border: '1px solid var(--border)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            color: 'var(--text2)',
            lineHeight: 1,
          }}
        >
          ✕
        </button>

        {/* ── Header ── */}
        <div style={{ marginBottom: '16px', paddingRight: '40px' }}>
          <div
            style={{
              fontSize: '18px',
              fontWeight: 700,
              letterSpacing: '-0.3px',
              color: 'var(--text)',
            }}
          >
            {assetToEdit
              ? 'Edit Asset Valuation'
              : 'Physical Asset Acquisition'}
          </div>
          <div
            style={{
              fontSize: '11px',
              color: 'var(--text3)',
              marginTop: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: 600,
            }}
          >
            Update market valuation for physical holdings
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Current Market Value */}
          <div style={{ marginBottom: '4px' }}>
            <label style={labelStyle}>Current Market Value</label>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              background: 'var(--bg3)',
              border: `1px solid ${errors.currentValue ? 'rgba(239, 68, 68, 0.5)' : 'var(--border2)'}`,
              borderRadius: 'var(--r)',
              marginBottom: '4px',
              transition: 'all 0.2s ease',
            }}
          >
            <span
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: errors.currentValue ? '#ef4444' : 'var(--text3)',
                fontFamily: 'var(--mono)',
              }}
            >
              ₹
            </span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={formData.currentValue}
              onInput={(e) => {
                const nextValue = e.target.value.replace(/[^0-9.]/g, '');
                e.target.value = restrictDecimals(nextValue, 2);
                setFormData({ ...formData, currentValue: e.target.value });
              }}
              required
              autoFocus
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: '24px',
                fontWeight: 700,
                fontFamily: 'var(--mono)',
                color: 'var(--text)',
                letterSpacing: '-1px',
                width: '100%',
              }}
            />
          </div>
          {errors.currentValue && (
            <div
              style={{
                fontSize: '10px',
                color: '#ef4444',
                fontWeight: 600,
                marginBottom: '8px',
              }}
            >
              {errors.currentValue}
            </div>
          )}
          {!errors.currentValue && <div style={{ marginBottom: '8px' }} />}

          {/* Initial Cost */}
          <div style={{ marginBottom: '4px' }}>
            <label style={labelStyle}>Initial Cost (Optional)</label>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              background: 'var(--bg3)',
              border: '1px solid var(--border2)',
              borderRadius: 'var(--r)',
              marginBottom: '12px',
              transition: 'all 0.2s ease',
            }}
          >
            <span
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: 'var(--text3)',
                fontFamily: 'var(--mono)',
              }}
            >
              ₹
            </span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="Original purchase price"
              value={formData.initialValue}
              onInput={(e) => {
                const nextValue = e.target.value.replace(/[^0-9.]/g, '');
                e.target.value = restrictDecimals(nextValue, 2);
                setFormData({ ...formData, initialValue: e.target.value });
              }}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: '16px',
                fontWeight: 600,
                fontFamily: 'var(--mono)',
                color: 'var(--text)',
                letterSpacing: '-0.3px',
                width: '100%',
              }}
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '14px',
              marginBottom: '14px',
            }}
          >
            {/* Category */}
            <div>
              <label style={labelStyle}>Asset Category</label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                style={inputStyle}
              >
                {ASSET_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label style={labelStyle}>Acquisition Date</label>
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      'justify-start text-left font-normal h-[38px] py-0 px-[12px]',
                      !formData.acquiredAt && 'text-muted-foreground',
                      errors.acquiredAt && 'border-red-500/50',
                    )}
                    style={{
                      width: '100%',
                      background: 'var(--bg3)',
                      border: errors.acquiredAt
                        ? '1px solid rgba(239, 68, 68, 0.5)'
                        : '1px solid var(--border2)',
                      borderRadius: 'var(--r2)',
                      color: formData.acquiredAt
                        ? 'var(--text)'
                        : 'var(--text2)',
                      fontSize: '12px',
                    }}
                  >
                    <CalendarIcon className="mr-2 h-3 w-3 opacity-50" />
                    {formData.acquiredAt instanceof Date
                      ? format(formData.acquiredAt, 'dd MMM yyyy')
                      : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0"
                  align="end"
                  sideOffset={8}
                >
                  <Calendar
                    mode="single"
                    selected={formData.acquiredAt}
                    onSelect={(date) => {
                      if (date) {
                        setFormData({ ...formData, acquiredAt: date });
                        setDateOpen(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.acquiredAt && (
                <div
                  style={{
                    fontSize: '10px',
                    color: '#ef4444',
                    fontWeight: 600,
                    marginTop: '4px',
                  }}
                >
                  {errors.acquiredAt}
                </div>
              )}
            </div>
          </div>

          <div style={{ marginBottom: '8px' }}>
            <label style={labelStyle}>Asset Title</label>
            <input
              type="text"
              placeholder="e.g. 100g 24K Gold Bar"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              style={{
                ...inputStyle,
                padding: '8px 12px',
                border: errors.name
                  ? '1px solid rgba(239, 68, 68, 0.5)'
                  : '1px solid var(--border2)',
              }}
            />
            {errors.name && (
              <div
                style={{
                  fontSize: '10px',
                  color: '#ef4444',
                  fontWeight: 600,
                  marginTop: '4px',
                }}
              >
                {errors.name}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={labelStyle}>Notes (Optional)</label>
            <textarea
              placeholder="Add details, location or certificate numbers..."
              rows={1}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              style={{
                ...inputStyle,
                minHeight: '40px',
                resize: 'none',
                padding: '8px 12px',
              }}
            />
          </div>

          {/* ── Actions ── */}
          <div
            style={{
              display: 'flex',
              gap: '10px',
              marginTop: '12px',
              justifyContent: 'flex-end',
            }}
          >
            <button
              type="button"
              onClick={handleClose}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                border: '1px solid var(--border2)',
                borderRadius: 'var(--r2)',
                color: 'var(--text2)',
                fontFamily: 'var(--font)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || Object.keys(errors).length > 0}
              style={{
                padding: '8px 24px',
                background:
                  loading || Object.keys(errors).length > 0
                    ? 'var(--bg4)'
                    : 'var(--accent)',
                border: 'none',
                borderRadius: 'var(--r2)',
                color: '#fff',
                fontFamily: 'var(--font)',
                fontSize: '12px',
                fontWeight: 700,
                cursor:
                  loading || Object.keys(errors).length > 0
                    ? 'not-allowed'
                    : 'pointer',
                minWidth: '160px',
                opacity: loading || Object.keys(errors).length > 0 ? 0.6 : 1,
                transition: 'all .15s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading
                ? 'Processing…'
                : assetToEdit
                  ? 'Update Valuation'
                  : 'Commit Asset'}
            </button>
          </div>
        </form>

        <style>{`
          @keyframes txnModalIn {
            from { opacity: 0; transform: scale(0.96) translateY(8px); }
            to   { opacity: 1; transform: scale(1)    translateY(0); }
          }
        `}</style>
      </div>
    </div>
  );
};

/* ── Shared inline styles matching TransactionPopup ── */
const labelStyle = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 600,
  color: 'var(--text3)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: '6px',
};

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  background: 'var(--bg3)',
  border: '1px solid var(--border2)',
  borderRadius: 'var(--r2)',
  color: 'var(--text)',
  fontFamily: 'var(--font)',
  fontSize: '13px',
  outline: 'none',
};

export default AddAssetPopup;
