import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setIsRecovery(true);
    }
    // Also listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success('Password updated successfully!');
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <Card className="w-full max-w-sm glass-card border-border/30">
          <CardContent className="pt-8 pb-8 text-center">
            <p className="text-muted-foreground">Invalid or expired reset link. Please request a new one.</p>
            <Button className="mt-4" onClick={() => navigate('/forgot-password')}>Request Reset</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background relative overflow-hidden">
      <div className="absolute top-[-120px] right-[-80px] w-[300px] h-[300px] rounded-full bg-primary/5 blur-3xl" />

      <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:text-foreground transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
      </Link>
      <Card className="w-full max-w-sm glass-card animate-slide-up border-border/30">
        <CardHeader className="text-center pb-2 pt-8">
          <div className="mx-auto mb-3 text-5xl">🔒</div>
          <h1 className="text-2xl font-bold">Set New Password</h1>
          <p className="text-sm text-muted-foreground mt-1">Choose a strong password for your account</p>
        </CardHeader>
        <CardContent className="pb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium">New Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="••••••••" className="h-11 bg-muted/50 border-border/50" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm" className="text-xs font-medium">Confirm Password</Label>
              <Input id="confirm" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6} placeholder="••••••••" className="h-11 bg-muted/50 border-border/50" />
            </div>
            <Button type="submit" disabled={submitting} className="w-full h-11 font-semibold">
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating…</> : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
