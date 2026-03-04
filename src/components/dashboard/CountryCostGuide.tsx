import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin } from 'lucide-react';

interface CostItem {
  emoji: string;
  item: string;
  cost: string;
  unit: string;
}

const COUNTRY_DATA: Record<string, { flag: string; currency: string; items: CostItem[] }> = {
  Thailand: {
    flag: '🇹🇭', currency: '฿',
    items: [
      { emoji: '🍜', item: 'Street pad thai', cost: '40–60', unit: '฿' },
      { emoji: '🍚', item: 'Rice dish (food court)', cost: '50–80', unit: '฿' },
      { emoji: '☕', item: 'Café coffee', cost: '60–120', unit: '฿' },
      { emoji: '🥤', item: '7-Eleven drink', cost: '15–35', unit: '฿' },
      { emoji: '🚇', item: 'BTS/MRT single trip', cost: '16–62', unit: '฿' },
      { emoji: '🛺', item: 'Grab (5km)', cost: '60–120', unit: '฿' },
      { emoji: '🧺', item: 'Laundry (1 load)', cost: '30–60', unit: '฿' },
      { emoji: '💊', item: 'Pharmacy basics', cost: '20–80', unit: '฿' },
      { emoji: '📱', item: 'SIM data (30 days)', cost: '200–500', unit: '฿' },
      { emoji: '🏪', item: '7-Eleven snack run', cost: '30–80', unit: '฿' },
    ],
  },
  Singapore: {
    flag: '🇸🇬', currency: 'S$',
    items: [
      { emoji: '🍜', item: 'Hawker centre meal', cost: '4–6', unit: 'S$' },
      { emoji: '☕', item: 'Kopi/Teh', cost: '1.20–2', unit: 'S$' },
      { emoji: '🥤', item: 'Bubble tea', cost: '5–8', unit: 'S$' },
      { emoji: '🍔', item: 'Fast food meal', cost: '8–12', unit: 'S$' },
      { emoji: '🚇', item: 'MRT ride', cost: '1–3', unit: 'S$' },
      { emoji: '🚕', item: 'Grab (5km)', cost: '8–15', unit: 'S$' },
      { emoji: '🧺', item: 'Laundry (1 load)', cost: '3–6', unit: 'S$' },
      { emoji: '💊', item: 'Pharmacy basics', cost: '5–15', unit: 'S$' },
      { emoji: '📱', item: 'SIM data (30 days)', cost: '10–30', unit: 'S$' },
      { emoji: '🏪', item: 'Convenience store snack', cost: '2–5', unit: 'S$' },
    ],
  },
  Vietnam: {
    flag: '🇻🇳', currency: '₫',
    items: [
      { emoji: '🍜', item: 'Phở (street)', cost: '30–50k', unit: '₫' },
      { emoji: '🍚', item: 'Cơm tấm', cost: '35–60k', unit: '₫' },
      { emoji: '☕', item: 'Cà phê sữa đá', cost: '20–40k', unit: '₫' },
      { emoji: '🥤', item: 'Fresh juice', cost: '15–30k', unit: '₫' },
      { emoji: '🛵', item: 'Grab bike (5km)', cost: '15–30k', unit: '₫' },
      { emoji: '🚕', item: 'Grab car (5km)', cost: '40–80k', unit: '₫' },
      { emoji: '🧺', item: 'Laundry (1kg)', cost: '15–30k', unit: '₫' },
      { emoji: '💊', item: 'Pharmacy basics', cost: '20–80k', unit: '₫' },
      { emoji: '📱', item: 'SIM data (30 days)', cost: '100–200k', unit: '₫' },
      { emoji: '🍺', item: 'Local beer', cost: '15–30k', unit: '₫' },
    ],
  },
  China: {
    flag: '🇨🇳', currency: '¥',
    items: [
      { emoji: '🍜', item: 'Street noodles', cost: '10–20', unit: '¥' },
      { emoji: '🍚', item: 'Rice set meal', cost: '15–30', unit: '¥' },
      { emoji: '☕', item: 'Luckin Coffee', cost: '10–20', unit: '¥' },
      { emoji: '🥤', item: 'Milk tea', cost: '12–25', unit: '¥' },
      { emoji: '🚇', item: 'Metro ride', cost: '3–8', unit: '¥' },
      { emoji: '🚕', item: 'DiDi (5km)', cost: '12–25', unit: '¥' },
      { emoji: '🧺', item: 'Laundry (1 load)', cost: '10–20', unit: '¥' },
      { emoji: '💊', item: 'Pharmacy basics', cost: '10–40', unit: '¥' },
      { emoji: '📱', item: 'SIM data (30 days)', cost: '30–80', unit: '¥' },
      { emoji: '🏪', item: 'Convenience store', cost: '5–15', unit: '¥' },
    ],
  },
  Malaysia: {
    flag: '🇲🇾', currency: 'RM',
    items: [
      { emoji: '🍜', item: 'Nasi lemak', cost: '5–10', unit: 'RM' },
      { emoji: '🍚', item: 'Economy rice', cost: '7–12', unit: 'RM' },
      { emoji: '☕', item: 'Teh tarik', cost: '2–4', unit: 'RM' },
      { emoji: '🥤', item: 'Bubble tea', cost: '8–15', unit: 'RM' },
      { emoji: '🚇', item: 'LRT/MRT ride', cost: '1–5', unit: 'RM' },
      { emoji: '🚕', item: 'Grab (5km)', cost: '8–15', unit: 'RM' },
      { emoji: '🧺', item: 'Laundry (1 load)', cost: '8–15', unit: 'RM' },
      { emoji: '💊', item: 'Pharmacy basics', cost: '5–20', unit: 'RM' },
      { emoji: '📱', item: 'SIM data (30 days)', cost: '15–40', unit: 'RM' },
      { emoji: '🏪', item: 'Convenience store', cost: '3–8', unit: 'RM' },
    ],
  },
  Indonesia: {
    flag: '🇮🇩', currency: 'Rp',
    items: [
      { emoji: '🍜', item: 'Nasi goreng (street)', cost: '15–25k', unit: 'Rp' },
      { emoji: '🍚', item: 'Warteg meal', cost: '12–20k', unit: 'Rp' },
      { emoji: '☕', item: 'Kopi susu', cost: '18–35k', unit: 'Rp' },
      { emoji: '🥤', item: 'Es teh manis', cost: '5–10k', unit: 'Rp' },
      { emoji: '🛵', item: 'Gojek bike (5km)', cost: '10–20k', unit: 'Rp' },
      { emoji: '🚕', item: 'Grab car (5km)', cost: '25–50k', unit: 'Rp' },
      { emoji: '🧺', item: 'Laundry (1kg)', cost: '5–10k', unit: 'Rp' },
      { emoji: '💊', item: 'Pharmacy basics', cost: '10–40k', unit: 'Rp' },
      { emoji: '📱', item: 'SIM data (30 days)', cost: '50–100k', unit: 'Rp' },
      { emoji: '🍺', item: 'Local beer', cost: '25–40k', unit: 'Rp' },
    ],
  },
  India: {
    flag: '🇮🇳', currency: '₹',
    items: [
      { emoji: '🍜', item: 'Thali meal', cost: '80–150', unit: '₹' },
      { emoji: '🍚', item: 'Biryani', cost: '100–200', unit: '₹' },
      { emoji: '☕', item: 'Chai', cost: '10–30', unit: '₹' },
      { emoji: '🥤', item: 'Fresh juice', cost: '30–60', unit: '₹' },
      { emoji: '🚇', item: 'Metro ride', cost: '10–40', unit: '₹' },
      { emoji: '🛺', item: 'Auto rickshaw (5km)', cost: '50–100', unit: '₹' },
      { emoji: '🧺', item: 'Laundry (1kg)', cost: '30–60', unit: '₹' },
      { emoji: '💊', item: 'Pharmacy basics', cost: '20–80', unit: '₹' },
      { emoji: '📱', item: 'SIM data (30 days)', cost: '200–500', unit: '₹' },
      { emoji: '🏪', item: 'Street snack', cost: '10–40', unit: '₹' },
    ],
  },
};

const COUNTRIES = Object.keys(COUNTRY_DATA);

export function CountryCostGuide() {
  const [country, setCountry] = useState('Thailand');
  const data = COUNTRY_DATA[country];

  return (
    <Card className="shadow-md border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Cost Guide
          </CardTitle>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map(c => (
                <SelectItem key={c} value={c}>
                  {COUNTRY_DATA[c].flag} {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {data.items.map(item => (
            <div key={item.item} className="flex items-center justify-between text-xs py-0.5">
              <span className="text-muted-foreground truncate">
                {item.emoji} {item.item}
              </span>
              <span className="font-medium text-foreground ml-2 shrink-0">
                {item.unit}{item.cost}
              </span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground/60 mt-3 text-center">
          Approximate prices as of 2026 · Actual prices may vary
        </p>
      </CardContent>
    </Card>
  );
}
