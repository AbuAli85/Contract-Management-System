'use client';

import * as React from 'react';
import { Check, ChevronRight, Circle, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DropdownMenuProps {
  children: React.ReactNode;
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
  onClick?: (e?: React.MouseEvent) => void;
}

interface DropdownMenuContentProps {
  children: React.ReactNode;
  className?: string;
  sideOffset?: number;
  align?: 'start' | 'center' | 'end';
}

interface DropdownMenuItemProps {
  children: React.ReactNode;
  className?: string;
  inset?: boolean;
  onClick?: (e?: React.MouseEvent | React.KeyboardEvent) => void;
  disabled?: boolean;
}

interface DropdownMenuLabelProps {
  children: React.ReactNode;
  className?: string;
  inset?: boolean;
}

interface DropdownMenuSeparatorProps {
  className?: string;
}

interface DropdownMenuShortcutProps {
  children: React.ReactNode;
  className?: string;
}

interface DropdownMenuCheckboxItemProps {
  children: React.ReactNode;
  className?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}

interface DropdownMenuRadioItemProps {
  children: React.ReactNode;
  className?: string;
  value: string;
  disabled?: boolean;
}

// Context for managing dropdown state
const DropdownMenuContext = React.createContext<{
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  closeDropdown: () => void;
}>({
  isOpen: false,
  setIsOpen: () => {},
  closeDropdown: () => {},
});

const DropdownMenu: React.FC<DropdownMenuProps> = ({ children }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const closeDropdown = React.useCallback(() => {
    setIsOpen(false);
  }, []);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only close if click is outside the dropdown container
      if (
        isOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    // Handle escape key to close dropdown
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }

    return undefined;
  }, [isOpen]);

  return (
    <DropdownMenuContext.Provider value={{ isOpen, setIsOpen, closeDropdown }}>
      <div ref={dropdownRef} className='relative inline-block text-left'>
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
};

const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  DropdownMenuTriggerProps
>(({ children, className, asChild, onClick, ...props }, ref) => {
  const { isOpen, setIsOpen } = React.useContext(DropdownMenuContext);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
    onClick?.(e);
  };

  // If asChild is true, clone the child element with our props
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      ref,
      onClick: handleClick,
      ...props,
    });
  }

  return (
    <button
      ref={ref}
      type='button'
      aria-haspopup='menu'
      aria-expanded={isOpen}
      className={cn(
        'inline-flex items-center justify-center rounded-lg text-sm font-medium ring-offset-background transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        'hover:bg-slate-100 active:bg-slate-200',
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
});
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  DropdownMenuContentProps
>(
  (
    { children, className, sideOffset = 4, align = 'center', ...props },
    ref
  ) => {
    const { isOpen } = React.useContext(DropdownMenuContext);

    if (!isOpen) return null;

    const topClass =
      sideOffset === 4
        ? 'top-full mt-1'
        : sideOffset === 8
          ? 'top-full mt-2'
          : 'top-full mt-1';

    return (
      <div
        ref={ref}
        className={cn(
          'absolute z-[100] min-w-[8rem] overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-950 shadow-xl',
          'animate-in fade-in-0 zoom-in-95 slide-in-from-top-2',
          topClass,
          align === 'start' && 'left-0',
          align === 'center' && 'left-1/2 transform -translate-x-1/2',
          align === 'end' && 'right-0',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
DropdownMenuContent.displayName = 'DropdownMenuContent';

const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  DropdownMenuItemProps
>(({ children, className, inset, onClick, disabled, ...props }, ref) => {
  const { closeDropdown } = React.useContext(DropdownMenuContext);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      onClick?.(e);
      closeDropdown();
    }
  };

  return (
    <div
      ref={ref}
      className={cn(
        'relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-3 py-2.5 text-sm outline-none transition-all duration-150',
        'hover:bg-slate-100 hover:text-slate-950 focus:bg-slate-100 focus:text-slate-950',
        'active:bg-slate-200',
        disabled && 'pointer-events-none opacity-50 cursor-not-allowed',
        inset && 'pl-8',
        className
      )}
      onClick={handleClick}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={e => {
        if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
          e.preventDefault();
          e.stopPropagation();
          onClick?.(e);
          closeDropdown();
        }
      }}
      {...props}
    >
      {children}
    </div>
  );
});
DropdownMenuItem.displayName = 'DropdownMenuItem';

const DropdownMenuCheckboxItem = React.forwardRef<
  HTMLDivElement,
  DropdownMenuCheckboxItemProps
>(
  (
    { children, className, checked, onCheckedChange, disabled, ...props },
    ref
  ) => {
    const { closeDropdown } = React.useContext(DropdownMenuContext);

    const handleClick = () => {
      if (!disabled) {
        onCheckedChange?.(!checked);
        closeDropdown();
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors',
          'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
          disabled && 'pointer-events-none opacity-50',
          className
        )}
        onClick={handleClick}
        {...props}
      >
        <span className='absolute left-2 flex h-3.5 w-3.5 items-center justify-center'>
          {checked && <Check className='h-4 w-4' />}
        </span>
        {children}
      </div>
    );
  }
);
DropdownMenuCheckboxItem.displayName = 'DropdownMenuCheckboxItem';

const DropdownMenuRadioItem = React.forwardRef<
  HTMLDivElement,
  DropdownMenuRadioItemProps
>(({ children, className, value, disabled, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors',
        'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
      {...props}
    >
      <span className='absolute left-2 flex h-3.5 w-3.5 items-center justify-center'>
        <Circle className='h-2 w-2 fill-current' />
      </span>
      {children}
    </div>
  );
});
DropdownMenuRadioItem.displayName = 'DropdownMenuRadioItem';

const DropdownMenuLabel = React.forwardRef<
  HTMLDivElement,
  DropdownMenuLabelProps
>(({ children, className, inset, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'px-2 py-1.5 text-sm font-semibold',
      inset && 'pl-8',
      className
    )}
    {...props}
  >
    {children}
  </div>
));
DropdownMenuLabel.displayName = 'DropdownMenuLabel';

const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  DropdownMenuSeparatorProps
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-muted', className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

const DropdownMenuShortcut: React.FC<DropdownMenuShortcutProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <span
      className={cn('ml-auto text-xs tracking-widest opacity-60', className)}
      {...props}
    >
      {children}
    </span>
  );
};
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut';

// Additional simple components for compatibility
const DropdownMenuGroup: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <div>{children}</div>;

const DropdownMenuPortal: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <>{children}</>;

const DropdownMenuSub: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <div>{children}</div>;

const DropdownMenuSubContent: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div className={cn('ml-4', className)}>{children}</div>
);

const DropdownMenuSubTrigger: React.FC<{
  children: React.ReactNode;
  className?: string;
  inset?: boolean;
}> = ({ children, className, inset }) => (
  <div
    className={cn(
      'flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none',
      inset && 'pl-8',
      className
    )}
  >
    {children}
    <ChevronRight className='ml-auto h-4 w-4' />
  </div>
);

const DropdownMenuRadioGroup: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <div>{children}</div>;

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
};
