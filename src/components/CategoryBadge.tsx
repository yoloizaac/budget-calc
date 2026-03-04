import { CATEGORY_COLORS } from '@/lib/budget-utils';
import { Badge } from '@/components/ui/badge';

interface CategoryBadgeProps {
  category: string;
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  const color = CATEGORY_COLORS[category] || '#95A5A6';
  return (
    <Badge
      variant="outline"
      className="text-xs font-medium border"
      style={{ borderColor: color, color: color, backgroundColor: `${color}15` }}
    >
      {category}
    </Badge>
  );
}
