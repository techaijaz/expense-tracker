import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';

import { cn } from '@/utils/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20 focus-visible:border-accent/40 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-accent text-white shadow-lg shadow-accent/20 hover:scale-[1.01] active:scale-[0.99] uppercase tracking-wider',
        destructive:
          'bg-red text-white shadow-sm hover:opacity-90 active:scale-[0.99] uppercase tracking-wider',
        outline:
          'border border-border bg-transparent shadow-sm hover:bg-bg4 hover:text-text hover:border-border3 active:scale-[0.99]',
        secondary:
          'bg-bg3 text-text shadow-sm hover:bg-bg4 active:scale-[0.99]',
        ghost:
          'hover:bg-bg3 hover:text-text active:scale-[0.99]',
        link: 'text-accent underline-offset-4 hover:underline',
        primary:
          'bg-gradient-to-r from-accent to-accent2 text-white shadow-lg shadow-accent/20 hover:scale-[1.01] active:scale-[0.99] uppercase tracking-wider',
      },
      size: {
        default: 'h-11 px-6 py-2',
        sm: 'h-9 rounded-lg px-4 text-xs',
        lg: 'h-12 rounded-2xl px-8 text-base',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
