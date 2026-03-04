import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/PageHeader';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Shield, Bug, Users, BarChart3, Circle, Trash2, Plus, Loader2, Lightbulb } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type BugReport = {
  id: string; user_email: string; bug_type: string; title: string;
  description: string | null; status: string; admin_notes: string | null; created_at: string;
};
type FeatureSuggestion = {
  id: string; user_email: string; title: string; description: string | null;
  category: string; status: string; admin_notes: string | null; created_at: string;
};
type UserActivity = {
  id: string; user_id: string; user_email: string | null;
  last_active_at: string; session_count: number;
};
type AdminUser = { id: string; email: string; role: string };

export default function AdminPage() {
  const { session } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isFullAdmin, setIsFullAdmin] = useState(false);

  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [suggestions, setSuggestions] = useState<FeatureSuggestion[]>([]);
  const [users, setUsers] = useState<UserActivity[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState('viewer');

  useEffect(() => {
    if (!session?.user?.id) return;
    checkAdminStatus();
  }, [session?.user?.id]);

  const checkAdminStatus = async () => {
    if (!session?.user?.id) return;
    const { data: admin } = await supabase.rpc('is_admin', { _user_id: session.user.id });
    setIsAdmin(!!admin);
    if (admin) {
      const { data: role } = await supabase.rpc('get_admin_role', { _user_id: session.user.id });
      setIsFullAdmin(role === 'full');
      loadData();
    } else {
      setLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    const [bugRes, sugRes, userRes, adminRes] = await Promise.all([
      supabase.from('bug_reports').select('*').order('created_at', { ascending: false }),
      supabase.from('feature_suggestions' as any).select('*').order('created_at', { ascending: false }),
      supabase.from('user_activity').select('*').order('last_active_at', { ascending: false }),
      supabase.from('admin_users').select('*'),
    ]);
    setBugs(bugRes.data ?? []);
    setSuggestions((sugRes.data ?? []) as any);
    setUsers(userRes.data ?? []);
    setAdmins(adminRes.data ?? []);
    setLoading(false);
  };

  if (isAdmin === null || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Shield className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground font-medium">Access Denied</p>
        <p className="text-sm text-muted-foreground/70">You don't have admin privileges.</p>
      </div>
    );
  }

  const updateBugStatus = async (id: string, status: string) => {
    await supabase.from('bug_reports').update({ status }).eq('id', id);
    setBugs(b => b.map(r => r.id === id ? { ...r, status } : r));
    toast.success('Status updated');
  };

  const updateBugNotes = async (id: string, notes: string) => {
    await supabase.from('bug_reports').update({ admin_notes: notes }).eq('id', id);
    setBugs(b => b.map(r => r.id === id ? { ...r, admin_notes: notes } : r));
    toast.success('Notes saved');
  };

  const updateSuggestionStatus = async (id: string, status: string) => {
    await supabase.from('feature_suggestions' as any).update({ status } as any).eq('id', id);
    setSuggestions(s => s.map(r => r.id === id ? { ...r, status } : r));
    toast.success('Status updated');
  };

  const updateSuggestionNotes = async (id: string, notes: string) => {
    await supabase.from('feature_suggestions' as any).update({ admin_notes: notes } as any).eq('id', id);
    setSuggestions(s => s.map(r => r.id === id ? { ...r, admin_notes: notes } : r));
    toast.success('Notes saved');
  };

  const addAdmin = async () => {
    if (!newAdminEmail.trim()) return;
    const { error } = await supabase.from('admin_users').insert({ email: newAdminEmail.trim(), role: newAdminRole });
    if (error) { toast.error(error.message); return; }
    toast.success('Admin added');
    setNewAdminEmail('');
    loadData();
  };

  const removeAdmin = async (id: string) => {
    await supabase.from('admin_users').delete().eq('id', id);
    toast.success('Admin removed');
    loadData();
  };

  const isOnline = (lastActive: string) => {
    return (Date.now() - new Date(lastActive).getTime()) < 5 * 60 * 1000;
  };

  const onlineCount = users.filter(u => isOnline(u.last_active_at)).length;
  const last24h = users.filter(u => (Date.now() - new Date(u.last_active_at).getTime()) < 24 * 60 * 60 * 1000).length;
  const last7d = users.filter(u => (Date.now() - new Date(u.last_active_at).getTime()) < 7 * 24 * 60 * 60 * 1000).length;

  const statusColor = (s: string) => s === 'open' ? 'destructive' : s === 'in_progress' ? 'secondary' : 'default';
  const typeLabel = (t: string) => ({ ui: 'UI Issue', data: 'Data Error', crash: 'Crash', performance: 'Performance', other: 'Other' }[t] || t);
  const categoryLabel = (c: string) => ({ feature: 'Feature Request', improvement: 'Improvement', integration: 'Integration', other: 'Other' }[c] || c);
  

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Console" subtitle={isFullAdmin ? 'Full access' : 'View-only access'} />

      <Tabs defaultValue="bugs" className="w-full">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="bugs" className="gap-1.5"><Bug className="h-3.5 w-3.5" />Bugs ({bugs.length})</TabsTrigger>
          <TabsTrigger value="suggestions" className="gap-1.5"><Lightbulb className="h-3.5 w-3.5" />Ideas ({suggestions.length})</TabsTrigger>
          <TabsTrigger value="usage" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" />Usage</TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5"><Users className="h-3.5 w-3.5" />Users</TabsTrigger>
        </TabsList>

        {/* Bug Reports Tab */}
        <TabsContent value="bugs" className="space-y-3 mt-4">
          {bugs.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">No bug reports yet</CardContent></Card>
          ) : bugs.map(bug => (
            <Card key={bug.id} className="shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{bug.title}</p>
                    <p className="text-xs text-muted-foreground">{bug.user_email} • {formatDistanceToNow(new Date(bug.created_at), { addSuffix: true })}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-[10px]">{typeLabel(bug.bug_type)}</Badge>
                    <Badge variant={statusColor(bug.status) === 'destructive' ? 'destructive' : statusColor(bug.status) === 'default' ? 'default' : 'outline'} className="text-[10px]">{bug.status}</Badge>
                  </div>
                </div>
                {bug.description && <p className="text-sm text-muted-foreground bg-accent/30 rounded-lg p-3">{bug.description}</p>}
                {isFullAdmin && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <Select value={bug.status} onValueChange={v => updateBugStatus(bug.id, v)}>
                      <SelectTrigger className="h-8 text-xs w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                    <Textarea
                      placeholder="Admin notes..."
                      className="text-xs min-h-[60px]"
                      defaultValue={bug.admin_notes || ''}
                      onBlur={e => { if (e.target.value !== (bug.admin_notes || '')) updateBugNotes(bug.id, e.target.value); }}
                    />
                  </div>
                )}
                {!isFullAdmin && bug.admin_notes && (
                  <p className="text-xs text-muted-foreground italic">Notes: {bug.admin_notes}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Feature Suggestions Tab */}
        <TabsContent value="suggestions" className="space-y-3 mt-4">
          {suggestions.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">No feature suggestions yet</CardContent></Card>
          ) : suggestions.map(sug => (
            <Card key={sug.id} className="shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{sug.title}</p>
                    <p className="text-xs text-muted-foreground">{sug.user_email} • {formatDistanceToNow(new Date(sug.created_at), { addSuffix: true })}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-[10px]">{categoryLabel(sug.category)}</Badge>
                    <Badge variant={sug.status === 'done' ? 'default' : sug.status === 'planned' ? 'default' : 'outline'} className="text-[10px] capitalize">{sug.status}</Badge>
                  </div>
                </div>
                {sug.description && <p className="text-sm text-muted-foreground bg-accent/30 rounded-lg p-3">{sug.description}</p>}
                {isFullAdmin && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <Select value={sug.status} onValueChange={v => updateSuggestionStatus(sug.id, v)}>
                      <SelectTrigger className="h-8 text-xs w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="submitted">Submitted</SelectItem>
                        <SelectItem value="reviewed">Reviewed</SelectItem>
                        <SelectItem value="planned">Planned</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                    <Textarea
                      placeholder="Admin notes..."
                      className="text-xs min-h-[60px]"
                      defaultValue={sug.admin_notes || ''}
                      onBlur={e => { if (e.target.value !== (sug.admin_notes || '')) updateSuggestionNotes(sug.id, e.target.value); }}
                    />
                  </div>
                )}
                {!isFullAdmin && sug.admin_notes && (
                  <p className="text-xs text-muted-foreground italic">Notes: {sug.admin_notes}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-4 mt-4">
          <div className="grid grid-cols-3 gap-3">
            <Card><CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{users.length}</p>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-500">{onlineCount}</p>
              <p className="text-xs text-muted-foreground">Online Now</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{last24h}</p>
              <p className="text-xs text-muted-foreground">Last 24h</p>
            </CardContent></Card>
          </div>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Active in last 7 days: {last7d}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {users.map(u => (
                <div key={u.id} className="flex items-center gap-3 text-sm py-1.5">
                  <Circle className={`h-2.5 w-2.5 shrink-0 ${isOnline(u.last_active_at) ? 'fill-green-500 text-green-500' : 'fill-muted text-muted'}`} />
                  <span className="flex-1 truncate text-xs">{u.user_email || 'Unknown'}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{formatDistanceToNow(new Date(u.last_active_at), { addSuffix: true })}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{u.session_count} sessions</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users / Admin Management Tab */}
        <TabsContent value="users" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Admin Users</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {admins.map(a => (
                <div key={a.id} className="flex items-center gap-3 text-sm">
                  <Shield className="h-4 w-4 text-primary shrink-0" />
                  <span className="flex-1 truncate text-xs">{a.email}</span>
                  <Badge variant="outline" className="text-[10px]">{a.role}</Badge>
                  {isFullAdmin && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeAdmin(a.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              {isFullAdmin && (
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Input placeholder="Email" value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} className="flex-1 text-xs h-8" />
                  <Select value={newAdminRole} onValueChange={setNewAdminRole}>
                    <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" className="h-8" onClick={addAdmin}><Plus className="h-3.5 w-3.5 mr-1" />Add</Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">All Users ({users.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {users.map(u => (
                <div key={u.id} className="flex items-center gap-3 text-sm py-1.5">
                  <Circle className={`h-2.5 w-2.5 shrink-0 ${isOnline(u.last_active_at) ? 'fill-green-500 text-green-500' : 'fill-muted text-muted'}`} />
                  <span className="flex-1 truncate text-xs">{u.user_email || 'Unknown'}</span>
                  <Badge variant={isOnline(u.last_active_at) ? 'default' : 'outline'} className="text-[10px]">
                    {isOnline(u.last_active_at) ? 'Online' : 'Offline'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{u.session_count}×</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
