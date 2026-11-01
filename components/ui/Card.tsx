'use client';

import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'interactive' | 'glow';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'default', children, ...props }, ref) => {
    const variantStyles = {
      default:
        'bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] shadow-sm',
      elevated:
        'bg-white dark:bg-[#111722] border border-slate-200 dark:border-white/[0.10] shadow-md dark:shadow-2xl',
      interactive:
        'bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] hover:border-indigo-400 dark:hover:border-indigo-500/40 hover:bg-slate-50 dark:hover:bg-[#111722] transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md dark:hover:shadow-indigo-500/5',
      glow:
        'bg-white dark:bg-[#0D121A] border border-indigo-200 dark:border-indigo-500/30 shadow-md shadow-indigo-500/5 dark:shadow-indigo-500/10',
    }[variant];

    return (
      <div
        ref={ref}
        className={`rounded-2xl transition-all duration-200 ${variantStyles} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => (
    <div ref={ref} className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className = '', ...props }, ref) => (
    <h3
      ref={ref}
      className={`text-base sm:text-lg font-bold leading-tight tracking-tight text-slate-900 dark:text-white ${className}`}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className = '', ...props }, ref) => (
    <p
      ref={ref}
      className={`text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed ${className}`}
      {...props}
    />
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => (
    <div ref={ref} className={`p-6 pt-0 ${className}`} {...props} />
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={`flex items-center p-6 pt-0 border-t border-slate-100 dark:border-white/[0.06] mt-4 ${className}`}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

export default Card;
