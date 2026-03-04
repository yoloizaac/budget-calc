import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success('Password reset email sent!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset email');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background relative overflow-hidden">
      <div className="absolute top-[-120px] right-[-80px] w-[300px] h-[300px] rounded-full bg-primary/5 blur-3xl" />

      <Card className="w-full max-w-sm glass-card animate-slide-up border-border/30">
        <CardHeader className="text-center pb-2 pt-8">
          <div className="mx-auto mb-3 text-5xl">🔑</div>
          <h1 className="text-2xl font-bold">Reset Password</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {sent ? 'Check your inbox for a reset link' : "Enter your email and we'll send a reset link"}
          </p>
        </CardHeader>
        <CardContent className="pb-8">
          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium">Email</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" className="h-11 bg-muted/50 border-border/50" />
              </div>
              <Button type="submit" disabled={submitting} className="w-full h-11 font-semibold">
                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…</> : 'Send Reset Link'}
              </Button>
            </form>
          ) : (
            <div className="text-center text-sm text-muted-foreground">
              Didn't receive it? Check your spam folder or{' '}
              <button onClick={() => setSent(false)} className="text-primary hover:underline font-medium">try again</button>.
            </div>
          )}
          <div className="flex flex-col items-center gap-2 mt-5">
            <Link to="/login" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
            </Link>
            <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
