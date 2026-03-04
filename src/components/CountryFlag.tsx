interface CountryFlagProps {
  country: string;
  showLabel?: boolean;
}

const FLAGS: Record<string, string> = {
  Thailand: '🇹🇭',
  Singapore: '🇸🇬',
  Vietnam: '🇻🇳',
  China: '🇨🇳',
  Malaysia: '🇲🇾',
  Indonesia: '🇮🇩',
  India: '🇮🇳',
};

export function CountryFlag({ country, showLabel = false }: CountryFlagProps) {
  const flag = FLAGS[country] || '🏳️';
  return (
    <span className="inline-flex items-center gap-1">
      <span>{flag}</span>
      {showLabel && <span className="text-xs text-muted-foreground">{country}</span>}
    </span>
  );
}
