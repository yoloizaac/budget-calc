import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ALL_COUNTRIES, CURRENCY_INFO, getCurrencyForCountry } from '@/lib/budget-utils';
import { useUpdateSetting } from '@/hooks/useSettings';
import { toast } from 'sonner';
import { ArrowRight, Check, Sparkles, X } from 'lucide-react';

const CURRENCIES = [
  { code: 'THB', label: 'Thai Baht (฿)' },
  { code: 'SGD', label: 'Singapore Dollar (S$)' },
  { code: 'USD', label: 'US Dollar ($)' },
  { code: 'EUR', label: 'Euro (€)' },
  { code: 'MYR', label: 'Malaysian Ringgit (RM)' },
  { code: 'VND', label: 'Vietnamese Dong (₫)' },
  { code: 'CNY', label: 'Chinese Yuan (¥)' },
  { code: 'IDR', label: 'Indonesian Rupiah (Rp)' },
];

interface OnboardingDialogProps {
  open: boolean;
  onComplete: () => void;
}

export function OnboardingDialog({ open, onComplete }: OnboardingDialogProps) {
  const [step, setStep] = useState(0);
  const updateSetting = useUpdateSetting();

  const [displayName, setDisplayName] = useState('');
  const [country, setCountry] = useState('Singapore');
  const [currency, setCurrency] = useState('SGD');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [salary, setSalary] = useState('');
  const [schoolFunding, setSchoolFunding] = useState('');

  const handleSkip = async () => {
    try {
      await updateSetting.mutateAsync({ key: 'onboarding_completed', value: 'true' });
      toast('Setup skipped — you can re-run it from Settings anytime.');
      onComplete();
    } catch {
      toast.error('Something went wrong, please try again.');
    }
  };

  const saveAll = async () => {
    const trimmedName = displayName.trim();

    const settings: { key: string; value: string }[] = [];
    if (trimmedName) {
      settings.push({ key: 'display_name', value: trimmedName });
    }
    settings.push({ key: 'display_country', value: country });
    settings.push({ key: 'display_currency', value: currency });
    if (monthlyRent) settings.push({ key: 'monthly_rent_thb', value: monthlyRent });
    if (salary) settings.push({ key: 'salary_thb', value: salary });
    if (schoolFunding) settings.push({ key: 'school_funding_sgd', value: schoolFunding });
    settings.push({ key: 'onboarding_completed', value: 'true' });

    try {
      await Promise.all(settings.map(s => updateSetting.mutateAsync(s)));
      toast.success('Welcome aboard! Your settings have been saved.');
      onComplete();
    } catch {
      toast.error('Failed to save some settings');
    }
  };

  const activeCurrency = getCurrencyForCountry(country);

  // Validation helpers
  const nameValid = displayName.trim().length > 0;
  const budgetValid = (v: string) => v === '' || (Number(v) > 0);
  const allBudgetValid = budgetValid(monthlyRent) && budgetValid(salary) && budgetValid(schoolFunding);

  const canAdvance = (s: number) => {
    if (s === 1) return nameValid;
    if (s === 3) return allBudgetValid;
    return true;
  };

  const steps = [
    // Step 0: Welcome
    <div key="welcome" className="space-y-4 text-center py-4">
      <div className="text-5xl">✈️</div>
      <h3 className="text-xl font-bold">Welcome to Travel Intern Budget!</h3>
      <p className="text-sm text-muted-foreground">Let's set up your account in a few quick steps so everything is tailored to your internship.</p>
    </div>,

    // Step 1: Name
    <div key="name" className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">What should we call you?</Label>
        <Input
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          placeholder="e.g. Isaac"
          className="h-11 bg-muted/50"
          autoFocus
        />
        {!nameValid && displayName.length === 0 && (
          <p className="text-xs text-muted-foreground">Please enter your name to continue</p>
        )}
        {!nameValid && displayName.length > 0 && (
          <p className="text-xs text-destructive">Name cannot be only spaces</p>
        )}
      </div>
    </div>,

    // Step 2: Country & Currency
    <div key="region" className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Which country are you interning in?</Label>
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger className="bg-muted/50 h-11"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ALL_COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.flag} {c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">Preferred display currency</Label>
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger className="bg-muted/50 h-11"><SelectValue /></SelectTrigger>
          <SelectContent>
            {CURRENCIES.map(c => <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>,

    // Step 3: Budget params
    <div key="budget" className="space-y-4">
      <p className="text-sm text-muted-foreground">These help us estimate your budget. Leave blank if unsure — you can update them in Settings later.</p>
      <div className="space-y-2">
        <Label className="text-sm font-medium">Monthly Rent ({activeCurrency})</Label>
        <Input type="number" value={monthlyRent} onChange={e => setMonthlyRent(e.target.value)} placeholder="e.g. 15500" className="h-11 bg-muted/50" inputMode="decimal" />
        {!budgetValid(monthlyRent) && <p className="text-xs text-destructive">Please enter a positive number</p>}
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">Monthly Salary ({activeCurrency})</Label>
        <Input type="number" value={salary} onChange={e => setSalary(e.target.value)} placeholder="e.g. 7000" className="h-11 bg-muted/50" inputMode="decimal" />
        {!budgetValid(salary) && <p className="text-xs text-destructive">Please enter a positive number</p>}
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">School Funding Total (SGD)</Label>
        <Input type="number" value={schoolFunding} onChange={e => setSchoolFunding(e.target.value)} placeholder="e.g. 10000" className="h-11 bg-muted/50" inputMode="decimal" />
        {!budgetValid(schoolFunding) && <p className="text-xs text-destructive">Please enter a positive number</p>}
      </div>
    </div>,

    // Step 4: Done
    <div key="done" className="space-y-4 text-center py-4">
      <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
        <Check className="h-7 w-7 text-primary" />
      </div>
      <h3 className="text-xl font-bold">You're all set!</h3>
      <p className="text-sm text-muted-foreground">You can always update these in Settings. Head to the Dashboard to get started.</p>
    </div>,
  ];

  const isLastStep = step === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md [&>button]:hidden" onPointerDownOutside={e => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Setup {step > 0 && step < steps.length - 1 ? `(${step}/${steps.length - 2})` : ''}
          </DialogTitle>
          <DialogDescription className="sr-only">First-time setup wizard</DialogDescription>
        </DialogHeader>
        {steps[step]}
        <div className="flex items-center justify-between pt-2">
          {/* Left side: Back or Skip */}
          <div className="flex gap-2">
            {step > 0 && !isLastStep && (
              <Button variant="ghost" size="sm" onClick={() => setStep(s => s - 1)}>Back</Button>
            )}
            {!isLastStep && (
              <Button variant="link" size="sm" className="text-muted-foreground" onClick={handleSkip} disabled={updateSetting.isPending}>
                Skip for now
              </Button>
            )}
          </div>
          {/* Right side: Next or Finish */}
          {isLastStep ? (
            <Button onClick={saveAll} disabled={updateSetting.isPending} className="gap-2">
              Go to Dashboard <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canAdvance(step)} className="gap-2">
              {step === 0 ? "Let's go" : 'Next'} <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
