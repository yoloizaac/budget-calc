import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Globe, CalendarDays, MessageSquare, Home, PiggyBank, FileSpreadsheet, ArrowRight, Sparkles, Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const FEATURES = [
  { icon: Globe, title: 'Multi-Currency Tracking', desc: 'Track expenses in THB, VND, CNY, MYR, IDR — auto-converted via live FX rates.', accent: 'from-primary/20 to-secondary/10' },
  { icon: CalendarDays, title: 'Daily Expense Log', desc: 'Log meals, transport, and misc costs daily with country-specific currency support.', accent: 'from-secondary/20 to-accent/10' },
  { icon: MessageSquare, title: 'AI Budget Assistant', desc: 'Chat with an AI that understands your spending patterns and budget constraints.', accent: 'from-accent/20 to-primary/10' },
  { icon: Home, title: 'Rent Tracker', desc: 'Track monthly rent payments, due dates, and payment methods across your stay.', accent: 'from-primary/15 to-accent/15' },
  { icon: PiggyBank, title: 'Funding Management', desc: 'Monitor school funding, salary, and expected income against your spending.', accent: 'from-secondary/15 to-primary/15' },
  { icon: FileSpreadsheet, title: 'CSV Export', desc: 'Export all your transaction and daily log data for reporting or reimbursement.', accent: 'from-accent/15 to-secondary/15' },
];

const STEPS = [
  { num: '1', title: 'Sign up & set your country', desc: 'Create an account and pick your default internship country in Settings.' },
  { num: '2', title: 'Add your funding sources', desc: 'Enter school funding, salary, or other income in the Funding tab.' },
  { num: '3', title: 'Log daily expenses', desc: 'Use the Daily Log to record meals, transport, and misc costs each day.' },
  { num: '4', title: 'Track big transactions', desc: 'Record rent, one-time purchases, and other expenses in Transactions.' },
  { num: '5', title: 'Review & optimize', desc: 'Check the Dashboard for insights and chat with the AI assistant for tips.' },
];

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const timer = setTimeout(() => {
      const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold, rootMargin: '50px' });
      obs.observe(el);
      return () => obs.disconnect();
    }, 100);
    return () => clearTimeout(timer);
  }, [threshold]);
  return { ref, visible };
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [heroVisible, setHeroVisible] = useState(false);
  const features = useInView(0.1);
  const steps = useInView(0.1);
  const cta = useInView(0.15);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Non-blocking redirect if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/dashboard', { replace: true });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-hidden">
      {/* Nav */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/40">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 max-w-6xl mx-auto w-full">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xl flex-shrink-0">✈️</span>
            <span className="font-bold text-base sm:text-lg truncate">Travel Intern Budget</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
        {/* Gradient accent line */}
        <div className="h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 py-20 md:py-32 relative overflow-hidden bg-gradient-to-br from-primary/[0.04] via-background to-secondary/[0.06]">
        {/* Animated background orbs */}
        <div className="absolute top-[-200px] right-[-150px] w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl animate-[pulse_6s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-180px] left-[-120px] w-[450px] h-[450px] rounded-full bg-secondary/10 blur-3xl animate-[pulse_8s_ease-in-out_infinite_1s]" />
        <div className="absolute top-[20%] left-[10%] w-[300px] h-[300px] rounded-full bg-accent/8 blur-3xl animate-[pulse_10s_ease-in-out_infinite_2s]" />
        <div className="absolute bottom-[20%] right-[10%] w-[250px] h-[250px] rounded-full bg-primary/6 blur-3xl animate-[pulse_7s_ease-in-out_infinite_3s]" />

        {/* Floating country flags */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" aria-hidden>
          {['🇸🇬', '🇹🇭', '🇻🇳', '🇨🇳', '🇲🇾', '🇮🇩'].map((flag, i) => (
            <span
              key={i}
              className="absolute text-3xl md:text-4xl opacity-[0.12]"
              style={{
                top: `${15 + (i * 13) % 70}%`,
                left: `${5 + (i * 17) % 85}%`,
                animation: `float ${5 + i * 0.7}s ease-in-out infinite ${i * 0.5}s`,
              }}
            >
              {flag}
            </span>
          ))}
        </div>

        <div
          className={`relative z-10 max-w-2xl mx-auto transition-all duration-1000 ${
            heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20">
            <Sparkles className="h-3.5 w-3.5" />
            Built for interns abroad
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight mb-5 leading-[1.1]">
            Manage your finances<br />
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">across countries</span>
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg md:text-xl mb-10 max-w-lg mx-auto leading-relaxed">
            Track daily expenses, monitor funding, and stay on budget — no matter which country you're interning in.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full">
            <Button size="lg" className="h-12 px-8 text-base font-semibold gap-2 shadow-lg shadow-primary/20 w-full sm:w-auto" asChild>
              <Link to="/signup">
                Get Started — it's free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base border-primary/30 hover:bg-primary/5 w-full sm:w-auto" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section ref={features.ref} className="px-6 py-20 max-w-5xl mx-auto w-full">
        <div
          className={`text-center mb-14 transition-all duration-700 ${
            features.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Everything you need to stay on budget</h2>
          <p className="text-muted-foreground max-w-md mx-auto">Purpose-built tools for international interns managing expenses across multiple currencies and countries.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={`group relative rounded-2xl p-6 space-y-3 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 border border-border/50 bg-card/60 backdrop-blur-sm overflow-hidden ${
                features.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: features.visible ? `${i * 100}ms` : '0ms' }}
            >
              {/* Gradient accent stripe */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${f.accent}`} />
              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works — 5-step timeline */}
      <section ref={steps.ref} className="px-6 py-20 relative bg-gradient-to-b from-muted/40 via-muted/20 to-background">
        <div className="max-w-4xl mx-auto">
          <div
            className={`text-center mb-14 transition-all duration-700 ${
              steps.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Get started in 5 steps</h2>
            <p className="text-muted-foreground max-w-md mx-auto">From sign up to full budget clarity in under 10 minutes.</p>
          </div>
          <div className="relative">
            {/* Timeline vertical line */}
            <div className="absolute left-5 md:left-[23px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-primary/40 via-secondary/30 to-accent/20 hidden md:block" />
            <div className="grid gap-4 md:gap-5">
              {STEPS.map((s, i) => (
                <div
                  key={s.num}
                  className={`flex items-start gap-5 rounded-2xl p-5 md:p-6 transition-all duration-600 border border-border/40 bg-card/50 backdrop-blur-sm hover:bg-card/80 hover:shadow-md ${
                    steps.visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
                  }`}
                  style={{ transitionDelay: steps.visible ? `${i * 120}ms` : '0ms' }}
                >
                  <div className="relative z-10 flex-shrink-0 h-11 w-11 rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-md shadow-primary/20">
                    {s.num}
                  </div>
                  <div>
                    <h3 className="font-semibold text-base mb-1">{s.title}</h3>
                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section ref={cta.ref} className="px-6 py-24 text-center relative overflow-hidden">
        {/* Background gradient band */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.04] via-secondary/[0.06] to-accent/[0.04]" />
        <div className="absolute top-[-100px] right-[-100px] w-[300px] h-[300px] rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute bottom-[-80px] left-[-80px] w-[250px] h-[250px] rounded-full bg-secondary/8 blur-3xl" />
        
        <div className={`relative z-10 max-w-lg mx-auto transition-all duration-700 ${cta.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/50 text-success-foreground text-xs font-medium mb-6 border border-success-foreground/10">
            <Check className="h-3 w-3" />
            Free to use
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to take control?</h2>
          <p className="text-muted-foreground mb-8">Join Travel Intern Budget and never lose track of your spending abroad.</p>
          <Button size="lg" className="h-12 px-10 text-base font-semibold gap-2 shadow-lg shadow-primary/20" asChild>
            <Link to="/signup">
              Create your free account
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-sm text-muted-foreground border-t border-border/50 bg-muted/20">
        Made by Isaac Lum and AI · {new Date().getFullYear()}
      </footer>

      {/* Float keyframes */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
      `}</style>
    </div>
  );
}
