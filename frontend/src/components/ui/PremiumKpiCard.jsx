import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * PremiumKpiCard - A standardized, high-end KPI card for the application.
 * Supports light/dark mode, responsiveness, and various visual themes.
 */
export default function PremiumKpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend, // { value: string|number, direction: 'up' | 'down' | 'neutral', label: string }
  badge, // { text: string, variant: 'default' | 'success' | 'error' | 'warning' | 'outline' }
  color = 'blue', // 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'primary'
  delay = 0,
  className,
}) {
  // Map color themes to Tailwind classes and CSS variables
  const colorMap = {
    blue: {
      text: 'text-blue-500 dark:text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20 group-hover:border-blue-500/40',
      gradient: 'from-blue-500/10 to-transparent',
      glow: 'shadow-blue-500/10',
      dot: 'bg-blue-500',
      bar: 'from-blue-500 to-transparent',
    },
    green: {
      text: 'text-emerald-500 dark:text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20 group-hover:border-emerald-500/40',
      gradient: 'from-emerald-500/10 to-transparent',
      glow: 'shadow-emerald-500/10',
      dot: 'bg-emerald-500',
      bar: 'from-emerald-500 to-transparent',
    },
    red: {
      text: 'text-rose-500 dark:text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20 group-hover:border-rose-500/40',
      gradient: 'from-rose-500/10 to-transparent',
      glow: 'shadow-rose-500/10',
      dot: 'bg-rose-500',
      bar: 'from-rose-500 to-transparent',
    },
    amber: {
      text: 'text-amber-500 dark:text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20 group-hover:border-amber-500/40',
      gradient: 'from-amber-500/10 to-transparent',
      glow: 'shadow-amber-500/10',
      dot: 'bg-amber-500',
      bar: 'from-amber-500 to-transparent',
    },
    purple: {
      text: 'text-violet-500 dark:text-violet-400',
      bg: 'bg-violet-500/10',
      border: 'border-violet-500/20 group-hover:border-violet-500/40',
      gradient: 'from-violet-500/10 to-transparent',
      glow: 'shadow-violet-500/10',
      dot: 'bg-violet-500',
      bar: 'from-violet-500 to-transparent',
    },
    primary: {
      text: 'text-primary',
      bg: 'bg-primary/10',
      border: 'border-primary/20 group-hover:border-primary/40',
      gradient: 'from-primary/10 to-transparent',
      glow: 'shadow-primary/10',
      dot: 'bg-primary',
      bar: 'from-primary to-transparent',
    },
  };

  const config = colorMap[color] || colorMap.primary;

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-500',
        'hover:scale-[1.02] hover:shadow-2xl hover:border-border/80',
        'bg-card/60 backdrop-blur-xl border border-border/40',
        'animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both',
        config.glow,
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Background Glow Layer */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-700',
          config.gradient
        )}
      />
      
      {/* Ambient Light Effect */}
      <div
        className={cn(
          'absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-all duration-1000',
          config.bg
        )}
      />

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10 p-4 md:p-6">
        <div className="space-y-1">
          <CardTitle className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-foreground/80 transition-colors duration-500">
            {title}
          </CardTitle>
          {badge && (
            <Badge
              variant={badge.variant || 'outline'}
              className={cn(
                'text-[9px] font-black h-5 px-2 tracking-wider uppercase rounded-md border-none shadow-sm',
                badge.variant === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                badge.variant === 'error' ? 'bg-rose-500/10 text-rose-500' :
                badge.variant === 'warning' ? 'bg-amber-500/10 text-amber-500' :
                'bg-primary/10 text-primary'
              )}
            >
              {badge.text}
            </Badge>
          )}
        </div>
        
        {Icon && (
          <div
            className={cn(
              'h-10 w-10 md:h-12 md:w-12 rounded-2xl border flex items-center justify-center shadow-inner transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
              'group-hover:scale-110 group-hover:rotate-6',
              config.bg,
              config.border,
              config.text
            )}
          >
            <Icon className="h-5 w-5 md:h-6 md:w-6" />
          </div>
        )}
      </CardHeader>

      <CardContent className="relative z-10 pt-1 p-4 md:p-6 md:pt-2">
        <div className="flex flex-col gap-1">
          <div className="text-2xl md:text-4xl font-black text-foreground tracking-tighter tabular-nums leading-none mb-1 group-hover:translate-x-1 transition-transform duration-500">
            {value}
          </div>

          {trend && (
            <div className="flex items-center gap-1.5 mt-1">
              <div className={cn(
                'flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] md:text-[11px] font-bold border',
                trend.direction === 'up' ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' :
                trend.direction === 'down' ? 'text-rose-500 bg-rose-500/10 border-rose-500/20' :
                'text-muted-foreground bg-muted/10 border-muted/20'
              )}>
                {trend.direction === 'up' && <TrendingUp className="h-3 w-3 stroke-[3px]" />}
                {trend.direction === 'down' && <TrendingDown className="h-3 w-3 stroke-[3px]" />}
                {trend.direction === 'neutral' && <Minus className="h-3 w-3 stroke-[3px]" />}
                <span>{trend.value}</span>
              </div>
              {trend.label && (
                <span className="text-[10px] font-medium text-muted-foreground italic">
                  {trend.label}
                </span>
              )}
            </div>
          )}

          {subtitle && (
            <p className="text-[10px] md:text-[11px] font-bold text-muted-foreground mt-4 flex items-center gap-2 group-hover:text-foreground/70 transition-colors duration-500">
              <span
                className={cn(
                  'w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_8px_currentColor]',
                  config.dot
                )}
              />
              {subtitle}
            </p>
          )}
        </div>
      </CardContent>

      {/* Subtle Progress Decoration at Bottom */}
      <div
        className={cn(
          'absolute bottom-0 left-0 h-[3px] w-0 transition-all duration-1000 group-hover:w-full bg-gradient-to-r shadow-[0_-2px_10px_rgba(0,0,0,0.1)]',
          config.bar
        )}
      />
    </Card>
  );
}
