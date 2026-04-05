import { useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'sonner';
import api from '@/utils/httpMethods';
import { updateAvatar } from '@/redux/authSlice';
import { SectionCard, SectionTitle, FieldLabel } from '../SharedComponents';

const BACKEND_URL = 'http://localhost:5000';

export default function UserIdentity() {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const currentUser = user?.user;

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);

  const [showChangePwd, setShowChangePwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current: '', newPwd: '', confirm: '' });
  const [changingPwd, setChangingPwd] = useState(false);

  const avatarSrc = avatarPreview || (currentUser?.avatar ? `${BACKEND_URL}${currentUser.avatar}` : null);
  const getUserInitials = () => `${currentUser?.firstName?.charAt(0) || ''}${currentUser?.lastName?.charAt(0) || ''}`.toUpperCase() || 'AI';

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
    } finally { setUploadingAvatar(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwdForm.newPwd !== pwdForm.confirm) return toast.error('New passwords do not match');
    if (pwdForm.newPwd.length < 8) return toast.error('Password must be at least 8 characters');
    setChangingPwd(true);
    try {
      await api.put('/user/change-password', { currentPassword: pwdForm.current, newPassword: pwdForm.newPwd });
      toast.success('Password changed successfully!');
      setPwdForm({ current: '', newPwd: '', confirm: '' });
      setShowChangePwd(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to change password');
    } finally { setChangingPwd(false); }
  };

  const inputSx = "w-full py-[11px] px-3.5 bg-secondary-container border border-secondary-container rounded-[10px] text-on-surface text-[13px] outline-none font-body";

  return (
    <SectionCard accent>
      <SectionTitle icon="manage_accounts">User Identity</SectionTitle>
      <div className="flex items-start gap-5 flex-wrap">
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-2xl bg-surface-variant border-2 border-surface-variant overflow-hidden flex items-center justify-center text-[28px] font-extrabold text-primary">
            {avatarSrc ? <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" /> : getUserInitials()}
          </div>
          <button onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar}
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-primary border-none cursor-pointer flex items-center justify-center">
            {uploadingAvatar
              ? <div className="w-3 h-3 border-2 border-[rgba(6,20,35,0.3)] border-t-background rounded-full animate-spin" />
              : <span className="material-symbols-outlined text-[14px] text-background" style={{ fontVariationSettings: "'FILL' 0" }}>edit</span>}
          </button>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>

        <div className="flex-1">
          <p className="text-lg font-extrabold text-on-surface capitalize mb-1">
            {currentUser?.firstName} {currentUser?.lastName}
          </p>
          <p className="text-[13px] text-on-surface-variant mb-3">{currentUser?.email}</p>
          <div className="flex gap-2 flex-wrap">
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[rgba(168,237,202,0.08)] border border-[rgba(168,237,202,0.15)] text-[#a8edca] uppercase tracking-[0.08em]">Level 4 Encryption</span>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-surface-variant border border-surface-variant text-primary uppercase tracking-[0.08em]">Active Session</span>
          </div>
        </div>

        <button onClick={() => setShowChangePwd(v => !v)}
          className="px-4 py-2 bg-surface-variant border border-surface-variant rounded-[10px] text-primary text-xs font-bold cursor-pointer flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 0" }}>lock_reset</span>
          Change Password
        </button>
      </div>

      {showChangePwd && (
        <form onSubmit={handleChangePassword} className="mt-5 pt-5 border-t border-secondary-container flex flex-col gap-3">
          {[
            { key: 'current', label: 'Current Password', placeholder: '••••••••' },
            { key: 'newPwd',  label: 'New Password',     placeholder: 'Min. 8 characters' },
            { key: 'confirm', label: 'Confirm New Password', placeholder: '••••••••' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <FieldLabel>{label}</FieldLabel>
              <input type="password" value={pwdForm[key]} onChange={e => setPwdForm(p => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder} className={inputSx} />
            </div>
          ))}
          <div className="flex gap-2.5">
            <button type="button" onClick={() => setShowChangePwd(false)} className="flex-1 p-2.5 bg-secondary-container border border-secondary-container rounded-[10px] text-on-surface-variant text-[13px] font-semibold cursor-pointer">Cancel</button>
            <button type="submit" disabled={changingPwd} className={`flex-[2] p-2.5 bg-primary border-none rounded-[10px] text-background text-[13px] font-bold ${changingPwd ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
              {changingPwd ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </form>
      )}
    </SectionCard>
  );
}
