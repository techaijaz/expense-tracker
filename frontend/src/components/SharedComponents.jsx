import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/utils/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Info, Lock, Loader2, ShieldCheck } from 'lucide-react';

export function SectionCard({ children, accent = false, danger = false, className }) {
  return (
    <Card className={cn(
      "mb-5 border overflow-hidden",
      danger ? "bg-red-50/50 dark:bg-red-950/10 border-red-200 dark:border-red-900/50" : "bg-card border-border",
      accent && "border-l-4 border-l-primary",
      className
    )}>
      <CardContent className="p-6 md:p-7">
        {children}
      </CardContent>
    </Card>
  );
}

export function SectionTitle({ icon, children, className }) {
  return (
    <div className={cn("flex items-center gap-3 mb-6", className)}>
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
        <span className="material-symbols-outlined text-lg leading-none" style={{ fontVariationSettings: "'FILL' 0" }}>
          {icon}
        </span>
      </div>
      <h3 className="text-base font-bold text-foreground tracking-tight">{children}</h3>
    </div>
  );
}

export function FieldLabel({ children, className }) {
  return (
    <Label className={cn("block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2.5", className)}>
      {children}
    </Label>
  );
}

export function PasswordConfirmModal({ title, description, confirmLabel, onConfirm, onCancel, danger = true }) {
  const [pwd, setPwd] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    if (!pwd) return toast.error('Please enter your password');
    setBusy(true);
    try {
      await onConfirm(pwd);
    } catch (err) {
      // Error handled by parent or toast
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-[92vw] sm:max-w-[450px] rounded-[32px] border-border bg-background/95 backdrop-blur-2xl p-0 overflow-hidden shadow-2xl">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col items-center text-center gap-6 mb-8">
            <div className={cn(
              "w-20 h-20 rounded-[28px] flex items-center justify-center shrink-0 shadow-inner ring-1 ring-inset",
              danger 
                ? "bg-destructive/10 text-destructive ring-destructive/20" 
                : "bg-primary/10 text-primary ring-primary/20"
            )}>
              {danger ? <AlertTriangle className="w-10 h-10" /> : <Lock className="w-10 h-10" />}
            </div>
            
            <div className="space-y-2.5">
              <DialogTitle className="text-2xl font-bold text-foreground tracking-tight">
                {title}
              </DialogTitle>
              <DialogDescription className="text-[15px] font-medium text-muted-foreground leading-relaxed px-4">
                {description}
              </DialogDescription>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <div className="space-y-2">
              <Label htmlFor="auth-pwd" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
                Authorization Password
              </Label>
              <Input
                id="auth-pwd"
                type="password"
                autoFocus
                disabled={busy}
                value={pwd}
                onChange={e => setPwd(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="Enter your password to proceed"
                className="h-14 bg-slate-500/5 dark:bg-slate-400/5 border-border rounded-2xl px-5 focus-visible:ring-primary text-base transition-all text-foreground placeholder:text-muted-foreground/30"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={onCancel} 
              disabled={busy} 
              className="flex-1 h-14 rounded-2xl border-border bg-muted/50 text-muted-foreground font-bold uppercase tracking-widest text-[11px] transition-all hover:bg-muted"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={busy} 
              variant={danger ? "destructive" : "default"}
              className={cn(
                "flex-[1.5] h-14 rounded-2xl font-bold uppercase tracking-widest text-[11px] transition-all shadow-xl",
                !danger && "bg-primary hover:bg-primary/90 shadow-primary/20",
                danger && "shadow-destructive/20"
              )}
            >
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying
                </>
              ) : confirmLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SetPasswordModal({ onConfirm, onCancel }) {
  const [pwd, setPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    if (pwd.length < 8) return toast.error('Password must be at least 8 characters');
    if (pwd !== confirm) return toast.error('Passwords do not match');
    
    setBusy(true);
    try {
      await onConfirm(pwd);
      toast.success('Account password established successfully');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to set password');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-[92vw] sm:max-w-[450px] rounded-[32px] border-border bg-background/95 backdrop-blur-2xl p-0 overflow-hidden shadow-2xl">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col items-center text-center gap-6 mb-8">
            <div className="w-20 h-20 rounded-[28px] flex items-center justify-center shrink-0 shadow-inner ring-1 ring-inset bg-primary/10 text-primary ring-primary/20">
              <ShieldCheck className="w-10 h-10" />
            </div>
            
            <div className="space-y-2.5">
              <DialogTitle className="text-2xl font-bold text-foreground tracking-tight">
                Establish Security Key
              </DialogTitle>
              <DialogDescription className="text-[15px] font-medium text-muted-foreground leading-relaxed px-4">
                To authorize administrative protocols like data purging, you must establish a local account password.
              </DialogDescription>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
                New Account Password
              </Label>
              <Input
                type="password"
                disabled={busy}
                value={pwd}
                onChange={e => setPwd(e.target.value)}
                placeholder="Min. 8 characters"
                className="h-14 bg-slate-500/5 dark:bg-slate-400/5 border-border rounded-2xl px-5 focus-visible:ring-primary text-base transition-all text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
                Confirm Password
              </Label>
              <Input
                type="password"
                disabled={busy}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat password"
                className="h-14 bg-slate-500/5 dark:bg-slate-400/5 border-border rounded-2xl px-5 focus-visible:ring-primary text-base transition-all text-foreground"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={onCancel} 
              disabled={busy} 
              className="flex-1 h-14 rounded-2xl border-border bg-muted/50 text-muted-foreground font-bold uppercase tracking-widest text-[11px] transition-all hover:bg-muted"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={busy} 
              className="flex-[1.5] h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest text-[11px] shadow-xl shadow-primary/20 transition-all"
            >
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : "Set Password & Proceed"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ConfirmModal({ title, description, onConfirm, onCancel, busy, confirmLabel = "Confirm", variant = "danger" }) {
  const isDanger = variant === "danger";
  
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-[92vw] sm:max-w-[400px] rounded-[32px] border-border bg-background/95 backdrop-blur-2xl p-0 overflow-hidden shadow-2xl">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col items-center text-center gap-6 mb-8">
            <div className={cn(
              "w-20 h-20 rounded-[28px] flex items-center justify-center shrink-0 shadow-inner ring-1 ring-inset",
              isDanger 
                ? "bg-destructive/10 text-destructive ring-destructive/20" 
                : "bg-primary/10 text-primary ring-primary/20"
            )}>
              {isDanger ? (
                <AlertTriangle className="w-10 h-10" />
              ) : (
                <Info className="w-10 h-10" />
              )}
            </div>
            <div className="space-y-2.5">
              <DialogTitle className="text-2xl font-bold text-foreground tracking-tight">
                {title}
              </DialogTitle>
              <DialogDescription className="text-[15px] font-medium text-muted-foreground leading-relaxed px-2">
                {description}
              </DialogDescription>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={onCancel} 
              disabled={busy} 
              className="flex-1 h-14 rounded-2xl border-border bg-muted/50 text-muted-foreground font-bold uppercase tracking-widest text-[11px] transition-all hover:bg-muted"
            >
              Cancel
            </Button>
            <Button 
              onClick={onConfirm} 
              disabled={busy} 
              variant={isDanger ? "destructive" : "default"}
              className={cn(
                "flex-[1.5] h-14 rounded-2xl font-bold uppercase tracking-widest text-[11px] transition-all shadow-xl",
                !isDanger && "bg-primary hover:bg-primary/90 shadow-primary/20",
                isDanger && "shadow-destructive/20"
              )}
            >
              {busy ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                confirmLabel
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

