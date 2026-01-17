import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-lg border border-[#2a3441] bg-[#0f1318] px-3 py-2.5 text-sm text-white transition-colors',
          'placeholder:text-gray-500',
          'focus:outline-none focus:border-gray-500',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'resize-none leading-relaxed',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
