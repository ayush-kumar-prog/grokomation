import * as React from 'react';
import { cn } from '@/lib/utils';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        'text-[13px] text-gray-400 mb-1.5 block font-medium',
        className
      )}
      {...props}
    />
  )
);
Label.displayName = 'Label';

export { Label };
