'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectContextType {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  valueToLabel?: Map<string, string>;
  setValueToLabel?: (map: Map<string, string>) => void;
}

const SelectContext = React.createContext<SelectContextType>({});

interface SelectProps {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}

const Select: React.FC<SelectProps> = ({
  children,
  value,
  onValueChange,
  disabled,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [valueToLabel, setValueToLabel] = React.useState<Map<string, string>>(
    new Map()
  );
  const selectRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <SelectContext.Provider
      value={{
        value,
        onValueChange,
        disabled,
        isOpen,
        setIsOpen,
        valueToLabel,
        setValueToLabel,
      }}
    >
      <div ref={selectRef} className='relative'>
        {children}
      </div>
    </SelectContext.Provider>
  );
};

interface SelectTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { disabled, isOpen, setIsOpen } = React.useContext(SelectContext);

    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsOpen?.(!isOpen);
    };

    return (
      <button
        ref={ref}
        type='button'
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        disabled={disabled}
        onClick={handleClick}
        {...props}
      >
        {children}
        <ChevronDown
          className={cn(
            'h-4 w-4 opacity-50 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>
    );
  }
);
SelectTrigger.displayName = 'SelectTrigger';

interface SelectValueProps {
  placeholder?: string;
  className?: string;
}

const SelectValue: React.FC<SelectValueProps> = ({
  placeholder,
  className,
}) => {
  const { value, valueToLabel } = React.useContext(SelectContext);

  // Get the display text from the value-to-label mapping
  const displayText = React.useMemo(() => {
    if (!value) return placeholder;

    const mappedLabel = valueToLabel?.get(value);
    if (mappedLabel && mappedLabel.trim()) {
      return mappedLabel;
    }

    // Fallback to value if no label mapping exists
    return value;
  }, [value, valueToLabel, placeholder]);

  return <span className={cn('block truncate', className)}>{displayText}</span>;
};

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
  position?: 'item-aligned' | 'popper';
}

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ children, className, position = 'popper' }, ref) => {
    const { isOpen } = React.useContext(SelectContext);

    if (!isOpen) return null;

    return (
      <div
        ref={ref}
        className={cn(
          'absolute z-50 min-w-[8rem] max-h-60 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95',
          position === 'popper' && 'top-full mt-1',
          className
        )}
      >
        {children}
      </div>
    );
  }
);
SelectContent.displayName = 'SelectContent';

interface SelectItemProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ children, value, className }, ref) => {
    const {
      value: selectedValue,
      onValueChange,
      setIsOpen,
      valueToLabel,
      setValueToLabel,
    } = React.useContext(SelectContext);
    const isSelected = selectedValue === value;

    // Register this item's label with the context
    React.useEffect(() => {
      if (setValueToLabel && children) {
        const extractText = (element: React.ReactNode): string => {
          if (typeof element === 'string') return element;
          if (typeof element === 'number') return element.toString();
          if (Array.isArray(element)) {
            return element.map(extractText).join(' ');
          }
          if (React.isValidElement(element)) {
            if (element.props.children) {
              return extractText(element.props.children);
            }
          }
          return '';
        };

        const text = extractText(children).trim();
        if (text) {
          setValueToLabel(prev => {
            const newMap = new Map(prev);
            newMap.set(value, text);
            // Debug logging for text extraction
            console.log(
              `🔧 SelectItem: Mapped value "${value}" to text "${text}"`
            );
            return newMap;
          });
        } else {
          console.warn(
            `🔧 SelectItem: Failed to extract text for value "${value}", children:`,
            children
          );
        }
      }
    }, [value, children, setValueToLabel]);

    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onValueChange?.(value);
      // Use a small timeout to ensure the value change completes
      setTimeout(() => {
        setIsOpen?.(false);
      }, 0);
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
          isSelected && 'bg-accent text-accent-foreground',
          className
        )}
        onClick={handleClick}
      >
        <span className='absolute left-2 flex h-3.5 w-3.5 items-center justify-center'>
          {isSelected && <span className='h-2 w-2 rounded-full bg-current' />}
        </span>
        {children}
      </div>
    );
  }
);
SelectItem.displayName = 'SelectItem';

interface SelectLabelProps {
  children: React.ReactNode;
  className?: string;
}

const SelectLabel = React.forwardRef<HTMLDivElement, SelectLabelProps>(
  ({ children, className }, ref) => (
    <div
      ref={ref}
      className={cn('py-1.5 pl-8 pr-2 text-sm font-semibold', className)}
    >
      {children}
    </div>
  )
);
SelectLabel.displayName = 'SelectLabel';

interface SelectSeparatorProps {
  className?: string;
}

const SelectSeparator = React.forwardRef<HTMLDivElement, SelectSeparatorProps>(
  ({ className }, ref) => (
    <div ref={ref} className={cn('-mx-1 my-1 h-px bg-muted', className)} />
  )
);
SelectSeparator.displayName = 'SelectSeparator';

// Additional components for compatibility
const SelectGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div>{children}</div>
);

const SelectScrollUpButton: React.FC<{ className?: string }> = ({
  className,
}) => (
  <div
    className={cn(
      'flex cursor-default items-center justify-center py-1',
      className
    )}
  >
    <ChevronDown className='h-4 w-4 rotate-180' />
  </div>
);

const SelectScrollDownButton: React.FC<{ className?: string }> = ({
  className,
}) => (
  <div
    className={cn(
      'flex cursor-default items-center justify-center py-1',
      className
    )}
  >
    <ChevronDown className='h-4 w-4' />
  </div>
);

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
