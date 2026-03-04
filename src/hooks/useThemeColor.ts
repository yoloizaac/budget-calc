import { useState, useEffect } from 'react';

const STORAGE_KEY = 'theme-color-preset';

export type ColorPreset = 'blue' | 'teal' | 'purple' | 'orange' | 'rose';

export const COLOR_PRESETS: { id: ColorPreset; label: string; swatch: string }[] = [
  { id: 'blue', label: 'Blue', swatch: 'hsl(216, 53%, 25%)' },
  { id: 'teal', label: 'Teal', swatch: 'hsl(174, 60%, 30%)' },
  { id: 'purple', label: 'Purple', swatch: 'hsl(270, 50%, 35%)' },
  { id: 'orange', label: 'Orange', swatch: 'hsl(24, 80%, 45%)' },
  { id: 'rose', label: 'Rose', swatch: 'hsl(345, 60%, 40%)' },
];

export function useThemeColor() {
  const [preset, setPresetState] = useState<ColorPreset>(() => {
    return (localStorage.getItem(STORAGE_KEY) as ColorPreset) || 'blue';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme-color', preset);
    localStorage.setItem(STORAGE_KEY, preset);
  }, [preset]);

  // Apply on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ColorPreset;
    if (saved) document.documentElement.setAttribute('data-theme-color', saved);
  }, []);

  return { preset, setPreset: setPresetState };
}
