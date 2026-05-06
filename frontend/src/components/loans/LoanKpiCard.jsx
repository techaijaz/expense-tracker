import React from 'react';
import PremiumKpiCard from '@/components/ui/PremiumKpiCard';

export default function LoanKpiCard({
  title,
  value,
  subtitle,
  icon,
  colorVar = 'primary',
  badge,
  badgeVariant = 'outline',
  delay = 0,
}) {
  // Map colorVar (legacy) to color (PremiumKpiCard)
  const colorMap = {
    accent: 'primary',
    green: 'green',
    red: 'red',
    amber: 'amber',
    purple: 'purple',
    blue: 'blue',
  };

  return (
    <PremiumKpiCard
      title={title}
      value={value}
      subtitle={subtitle}
      icon={icon}
      color={colorMap[colorVar] || colorVar}
      delay={delay}
      badge={badge ? { text: badge, variant: badgeVariant } : null}
      className="flex-1 min-w-[240px]"
    />
  );
}

