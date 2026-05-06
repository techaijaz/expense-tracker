import * as React from 'react';

import { cn } from '@/utils/utils';

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        'flex min-h-[80px] w-full rounded-xl border border-border bg-bg3 px-4 py-3 text-sm font-medium shadow-sm placeholder:text-text3/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20 focus-visible:border-accent/40 disabled:cursor-not-allowed disabled:opacity-50 text-text resize-none',
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

export { Textarea };
