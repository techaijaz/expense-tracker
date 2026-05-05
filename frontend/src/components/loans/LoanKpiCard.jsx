import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/utils';

export default function LoanKpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  colorVar = 'accent',
  badge,
  badgeVariant = 'outline',
  delay = 0,
}) {
  // Map colorVar to Tailwind classes
  const colorMap = {
    green: {
      text: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      gradient: 'from-emerald-500/15 to-transparent',
      glow: 'shadow-emerald-500/20',
      dot: 'bg-emerald-500',
    },
    red: {
      text: 'text-rose-500',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      gradient: 'from-rose-500/15 to-transparent',
      glow: 'shadow-rose-500/20',
      dot: 'bg-rose-500',
    },
    amber: {
      text: 'text-amber-500',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      gradient: 'from-amber-500/15 to-transparent',
      glow: 'shadow-amber-500/20',
      dot: 'bg-amber-500',
    },
    purple: {
      text: 'text-violet-500',
      bg: 'bg-violet-500/10',
      border: 'border-violet-500/20',
      gradient: 'from-violet-500/15 to-transparent',
      glow: 'shadow-violet-500/20',
      dot: 'bg-violet-500',
    },
    accent: {
      text: 'text-primary',
      bg: 'bg-primary/10',
      border: 'border-primary/20',
      gradient: 'from-primary/15 to-transparent',
      glow: 'shadow-primary/20',
      dot: 'bg-primary',
    },
  };

  const config = colorMap[colorVar] || colorMap.accent;

  return (
    <Card
      className={cn(
        'flex-1 min-w-[240px] bg-card/40 backdrop-blur-md border border-border shadow-sm relative overflow-hidden group transition-all duration-500 hover:scale-[1.02] hover:shadow-xl hover:border-primary/30 animate-in fade-in slide-in-from-bottom-3 duration-700 fill-mode-both',
        config.glow,
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Background Gradient Layer */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-700',
          config.gradient,
        )}
      />

      {/* Dynamic Background Glow */}
      <div
        className={cn(
          'absolute top-0 right-0 w-32 h-32 rounded-full -mr-12 -mt-12 blur-3xl transition-all duration-700 opacity-10 group-hover:opacity-30',
          config.bg,
        )}
      />

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground group-hover:text-foreground transition-colors duration-500">
          {title}
        </CardTitle>
        <div
          className={cn(
            'h-11 w-11 rounded-[1.25rem] border flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
            config.bg,
            config.border,
            config.text,
          )}
        >
          {Icon && <Icon className="h-5 w-5" />}
        </div>
      </CardHeader>

      <CardContent className="relative z-10 pt-1">
        <div className="text-3xl md:text-4xl font-black text-foreground tracking-tighter leading-none mb-1">
          {value}
        </div>

        {badge && (
          <div className="mt-4">
            <Badge
              variant="outline"
              className={cn(
                'text-[9px] font-black h-5.5 px-3 tracking-widest uppercase rounded-full border-none shadow-sm',
                badgeVariant === 'success'
                  ? 'bg-emerald-500/10 text-emerald-500'
                  : badgeVariant === 'error'
                    ? 'bg-rose-500/10 text-rose-500'
                    : 'bg-primary/10 text-primary',
              )}
            >
              {badge}
            </Badge>
          </div>
        )}

        {subtitle && (
          <p className="text-[10px] font-bold text-muted-foreground mt-3 flex items-center gap-2 group-hover:text-foreground transition-colors duration-500">
            <span
              className={cn(
                'w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_10px_currentColor]',
                config.dot,
              )}
            />
            {subtitle}
          </p>
        )}
      </CardContent>

      {/* Bottom Progress Indicator (Subtle Decoration) */}
      <div
        className={cn(
          'absolute bottom-0 left-0 h-[2px] w-0 transition-all duration-700 group-hover:w-full bg-gradient-to-r',
          colorVar === 'green'
            ? 'from-emerald-500 to-transparent'
            : colorVar === 'red'
              ? 'from-rose-500 to-transparent'
              : colorVar === 'amber'
                ? 'from-amber-500 to-transparent'
                : colorVar === 'purple'
                  ? 'from-violet-500 to-transparent'
                  : 'from-primary to-transparent',
        )}
      />
    </Card>
  );
}
