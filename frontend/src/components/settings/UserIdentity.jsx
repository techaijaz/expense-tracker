import { useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'sonner';
import api from '@/utils/httpMethods';
import { updateAvatar } from '@/redux/authSlice';

const BACKEND_URL =
  import.meta.env.VITE_API_URL?.replace('/api/v1', '') ||
  'http://localhost:5000';

export default function UserIdentity() {
  const dispatch = useDispatch();
  const currentUser = useSelector((s) => s.auth.user);

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);

  const [showChangePwd, setShowChangePwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({
    current: '',
    newPwd: '',
    confirm: '',
  });
  const [errors, setErrors] = useState({
    current: '',
    newPwd: '',
    confirm: '',
  });
  const [changingPwd, setChangingPwd] = useState(false);

  const validate = (field, value, currentState = pwdForm) => {
    let err = '';
    if (field === 'current') {
      if (!value) err = 'Current password is required';
      else if (value.length < 8) err = 'Required min. 8 characters';
    }
    if (field === 'newPwd') {
      if (!value) err = 'New password is required';
      else if (value.length < 8) err = 'Min. 8 characters required';
      else if (value === currentState.current)
        err = 'Must be different from current';
    }
    if (field === 'confirm') {
      if (value !== currentState.newPwd) err = 'Passwords do not match';
    }
    setErrors((prev) => ({ ...prev, [field]: err }));
    return err;
  };

  const handlePwdInputChange = (field, value) => {
    const nextState = { ...pwdForm, [field]: value };
    setPwdForm(nextState);
    validate(field, value, nextState);
    if (field === 'newPwd' && nextState.confirm)
      validate('confirm', nextState.confirm, nextState);
  };

  const avatarSrc =
    avatarPreview ||
    (currentUser?.avatar
      ? currentUser.avatar.startsWith('http')
        ? currentUser.avatar
        : `${BACKEND_URL.replace(/\/$/, '')}/${currentUser.avatar.replace(/^\//, '')}`
      : null);
  const getUserInitials = () =>
    `${currentUser?.firstName?.charAt(0) || ''}${currentUser?.lastName?.charAt(0) || ''}`.toUpperCase() ||
    'AI';

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    setUploadingAvatar(true);
    try {
      const form = new FormData();
      form.append('avatar', file);
      const resData = await api.put('/user/avatar', form, true);
      dispatch(updateAvatar(resData.data.avatar));
      toast.success('Avatar updated!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Avatar upload failed');
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    // Final check
    const e1 = validate('current', pwdForm.current);
    const e2 = validate('newPwd', pwdForm.newPwd);
    const e3 = validate('confirm', pwdForm.confirm);
    if (e1 || e2 || e3) return;

    setChangingPwd(true);
    try {
      await api.put('/user/change-password', {
        currentPassword: pwdForm.current,
        newPassword: pwdForm.newPwd,
      });
      toast.success('Password updated successfully!');
      setPwdForm({ current: '', newPwd: '', confirm: '' });
      setErrors({ current: '', newPwd: '', confirm: '' });
      setShowChangePwd(false);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Update failed';
      if (msg.toLowerCase().includes('current password')) {
        setErrors((prev) => ({
          ...prev,
          current: 'Incorrect current password',
        }));
      } else if (msg.toLowerCase().includes('new password')) {
        setErrors((prev) => ({ ...prev, newPwd: msg }));
      } else {
        toast.error(msg);
      }
    } finally {
      setChangingPwd(false);
    }
  };

  return (
    <div className="settings-card">
      <div className="settings-section-title">
        <div className="icon">👤</div>User Identity
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            fontWeight: 700,
            color: '#fff',
            position: 'relative',
            overflow: avatarSrc ? 'hidden' : 'visible',
          }}
        >
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt="avatar"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span>{getUserInitials()}</span>
          )}
          <div
            onClick={() => avatarInputRef.current?.click()}
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 18,
              height: 18,
              background: 'var(--bg3)',
              borderRadius: '50%',
              border: '2px solid var(--bg2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              cursor: 'pointer',
            }}
          >
            {uploadingAvatar ? <div className="loader-mini" /> : '✏️'}
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>
            {currentUser?.firstName} {currentUser?.lastName}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>
            {currentUser?.email}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <span
              style={{
                fontSize: 10,
                padding: '2px 8px',
                background: 'var(--green-bg)',
                color: 'var(--green)',
                borderRadius: 4,
                fontWeight: 600,
              }}
            >
              Level 4 Encryption
            </span>
            <span
              style={{
                fontSize: 10,
                padding: '2px 8px',
                background: 'var(--accent-glow)',
                color: 'var(--accent)',
                borderRadius: 4,
                fontWeight: 600,
              }}
            >
              Active Session
            </span>
          </div>
        </div>
      </div>

      {!showChangePwd ? (
        <button
          onClick={() => setShowChangePwd(true)}
          className="btn-outline"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          🔒 Change Password
        </button>
      ) : (
        <form
          onSubmit={handleChangePassword}
          style={{
            marginTop: 16,
            paddingTop: 16,
            borderTop: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input
              type="password"
              value={pwdForm.current}
              onChange={(e) => handlePwdInputChange('current', e.target.value)}
              className={`form-input ${errors.current ? 'error' : ''}`}
              placeholder="••••••••"
            />
            {errors.current && (
              <span className="error-msg">{errors.current}</span>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              type="password"
              value={pwdForm.newPwd}
              onChange={(e) => handlePwdInputChange('newPwd', e.target.value)}
              className={`form-input ${errors.newPwd ? 'error' : ''}`}
              placeholder="Min. 8 characters"
            />
            {errors.newPwd && (
              <span className="error-msg">{errors.newPwd}</span>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input
              type="password"
              value={pwdForm.confirm}
              onChange={(e) => handlePwdInputChange('confirm', e.target.value)}
              className={`form-input ${errors.confirm ? 'error' : ''}`}
              placeholder="••••••••"
            />
            {errors.confirm && (
              <span className="error-msg">{errors.confirm}</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => setShowChangePwd(false)}
              className="btn-cancel"
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={changingPwd}
              className="btn-save"
              style={{ flex: 2 }}
            >
              {changingPwd ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
