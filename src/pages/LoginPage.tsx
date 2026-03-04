import { useState } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function LoginPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (session) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success('Welcome back!');
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background relative overflow-hidden">
      <div className="absolute top-[-120px] right-[-80px] w-[300px] h-[300px] rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-[-100px] left-[-60px] w-[250px] h-[250px] rounded-full bg-secondary/5 blur-3xl" />

      <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:text-foreground transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
      </Link>
      <Card className="w-full max-w-sm glass-card animate-slide-up border-border/30">
        <CardHeader className="text-center pb-2 pt-8">
          <div className="mx-auto mb-3 text-5xl">✈️</div>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your budget</p>
        </CardHeader>
        <CardContent className="pb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" className="h-11 bg-muted/50 border-border/50" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-medium">Password</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
              </div>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="••••••••" className="h-11 bg-muted/50 border-border/50" />
            </div>
            <Button type="submit" disabled={submitting} className="w-full h-11 font-semibold">
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…</> : 'Sign In'}
            </Button>
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/50" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">or</span></div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 font-medium"
              onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/dashboard' } })}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Sign in with Google
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-5">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary hover:underline font-medium">Sign up</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
