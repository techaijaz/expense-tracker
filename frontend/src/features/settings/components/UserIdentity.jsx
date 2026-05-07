import { useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'sonner';
import api from '@/utils/httpMethods';
import { updateAvatar, updateHasPassword } from '@/features/auth/state/authSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { User, Lock, Camera, Loader2, ShieldCheck, Activity } from 'lucide-react';
import { cn } from '@/utils/utils';

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
    const isGoogleLogin = currentUser?.loginMethod === 'google';

    if (field === 'current') {
      if (isGoogleLogin) return ''; 
      if (!value) err = 'Current password is required';
      else if (value.length < 8) err = 'Required min. 8 characters';
    }
    if (field === 'newPwd') {
      if (!value) err = 'New password is required';
      else if (value.length < 8) err = 'Min. 8 characters required';
      else if (!isGoogleLogin && value === currentState.current)
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

    const isGoogleLogin = currentUser?.loginMethod === 'google';
    const e1 = validate('current', pwdForm.current);
    const e2 = validate('newPwd', pwdForm.newPwd);
    const e3 = validate('confirm', pwdForm.confirm);
    if ((!isGoogleLogin && e1) || e2 || e3) return;

    setChangingPwd(true);
    try {
      const res = await api.put('/user/change-password', {
        currentPassword: pwdForm.current,
        newPassword: pwdForm.newPwd,
      });
      dispatch(updateHasPassword(true));
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
    <Card id="user-identity-card" className="border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden">
      <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <User className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold">User Identity</CardTitle>
            <CardDescription className="text-xs">Manage your profile and security credentials</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="h-20 w-20 rounded-full border-4 border-slate-50 dark:border-slate-700 shadow-lg bg-primary/10 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
                {avatarSrc ? (
                  <img src={avatarSrc} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl font-black text-primary">{getUserInitials()}</span>
                )}
              </div>
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:bg-primary/90 transition-all border-2 border-white dark:border-slate-800"
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            
            <div className="flex-1 space-y-1">
              <h3 className="text-lg font-black tracking-tight text-slate-800 dark:text-white">
                {currentUser?.firstName} {currentUser?.lastName}
              </h3>
              <p className="text-sm font-medium text-slate-400">
                {currentUser?.email}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase tracking-widest">
                  <ShieldCheck className="h-3 w-3" />
                  Secured
                </span>
                {currentUser?.googleId && (
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-bold border uppercase tracking-widest",
                    currentUser?.hasPassword 
                      ? "bg-blue-500/10 text-blue-500 border-blue-500/20" 
                      : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                  )}>
                    <Lock className="h-3 w-3" />
                    {currentUser?.hasPassword ? "Local Password Set" : "Google Only"}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-widest">
                  <Activity className="h-3 w-3" />
                  Online
                </span>
              </div>
            </div>
          </div>
        </div>

        {!currentUser?.hasPassword && currentUser?.googleId && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 animate-pulse">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-500 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Security Recommendation</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                You're currently authenticated via Google. Setting a local password is required for sensitive operations like <strong>Data Resets</strong> and provides an additional layer of security.
              </p>
            </div>
          </div>
        )}

        {!showChangePwd ? (
          <Button
            variant={(!currentUser?.hasPassword && currentUser?.googleId) ? "default" : "outline"}
            onClick={() => setShowChangePwd(true)}
            className={cn(
              "w-full h-11 font-bold gap-2 rounded-xl transition-all shadow-sm",
              (!currentUser?.hasPassword && currentUser?.googleId) 
                ? "bg-primary hover:bg-primary/90 text-white shadow-primary/20" 
                : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
            )}
          >
            <Lock className="h-4 w-4" />
            {currentUser?.googleId && !currentUser?.hasPassword
              ? 'Complete Security Setup'
              : 'Change Password'}
          </Button>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-5 animate-in slide-in-from-top-4 duration-300 p-5 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            {currentUser?.loginMethod !== 'google' && (
              <div className="space-y-2">
                <Label htmlFor="current-password" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={pwdForm.current}
                  onChange={(e) => handlePwdInputChange('current', e.target.value)}
                  className={cn("h-11 border-slate-200 dark:border-slate-800 rounded-xl", errors.current && 'border-red-500')}
                  placeholder="••••••••"
                />
                {errors.current && (
                  <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight">
                    {errors.current}
                  </p>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-xs font-bold text-slate-400 uppercase tracking-wider">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={pwdForm.newPwd}
                onChange={(e) => handlePwdInputChange('newPwd', e.target.value)}
                className={cn("h-11 border-slate-200 dark:border-slate-800 rounded-xl", errors.newPwd && 'border-red-500')}
                placeholder="Min. 8 characters"
              />
              {errors.newPwd && (
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight">
                  {errors.newPwd}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={pwdForm.confirm}
                onChange={(e) => handlePwdInputChange('confirm', e.target.value)}
                className={cn("h-11 border-slate-200 dark:border-slate-800 rounded-xl", errors.confirm && 'border-red-500')}
                placeholder="••••••••"
              />
              {errors.confirm && (
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight">
                  {errors.confirm}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowChangePwd(false)}
                className="flex-1 h-11 rounded-xl font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={changingPwd}
                className="flex-[2] h-11 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20 font-bold"
              >
                {changingPwd ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Save Password
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
