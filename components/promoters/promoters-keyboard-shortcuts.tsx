'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Keyboard, Command } from 'lucide-react';

interface KeyboardShortcut {
  keys: string[];
  description: string;
  category: 'navigation' | 'actions' | 'selection';
}

const SHORTCUTS: KeyboardShortcut[] = [
  {
    keys: ['⌘', 'R'],
    description: 'Refresh promoter data',
    category: 'actions',
  },
  {
    keys: ['⌘', 'N'],
    description: 'Add new promoter',
    category: 'actions',
  },
  {
    keys: ['Esc'],
    description: 'Clear selection',
    category: 'selection',
  },
  {
    keys: ['⌘', 'A'],
    description: 'Select all visible promoters',
    category: 'selection',
  },
  {
    keys: ['⌘', 'E'],
    description: 'Export current view',
    category: 'actions',
  },
];

const CATEGORY_LABELS = {
  navigation: 'Navigation',
  actions: 'Actions',
  selection: 'Selection',
};

const CATEGORY_COLORS = {
  navigation: 'bg-blue-100 text-blue-800',
  actions: 'bg-green-100 text-green-800',
  selection: 'bg-purple-100 text-purple-800',
};

export function PromotersKeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          className='gap-2'
          aria-label='View keyboard shortcuts'
        >
          <Keyboard className='h-4 w-4' />
          Shortcuts
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Command className='h-5 w-5' />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to navigate and interact with the
            promoters page more efficiently.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6'>
          {Object.entries(CATEGORY_LABELS).map(([category, label]) => {
            const shortcuts = SHORTCUTS.filter(s => s.category === category);
            if (shortcuts.length === 0) return null;

            return (
              <div key={category} className='space-y-3'>
                <h3 className='text-sm font-semibold text-muted-foreground uppercase tracking-wide'>
                  {label}
                </h3>
                <div className='space-y-2'>
                  {shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between rounded-lg border p-3'
                    >
                      <span className='text-sm'>{shortcut.description}</span>
                      <div className='flex items-center gap-1'>
                        {shortcut.keys.map((key, keyIndex) => (
                          <div
                            key={keyIndex}
                            className='flex items-center gap-1'
                          >
                            <Badge
                              variant='outline'
                              className='font-mono text-xs px-2 py-1'
                            >
                              {key}
                            </Badge>
                            {keyIndex < shortcut.keys.length - 1 && (
                              <span className='text-muted-foreground text-xs'>
                                +
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className='mt-6 p-4 bg-muted/50 rounded-lg'>
          <p className='text-sm text-muted-foreground'>
            <strong>Note:</strong> On Windows and Linux, use{' '}
            <kbd className='px-1 py-0.5 text-xs bg-muted rounded'>Ctrl</kbd>{' '}
            instead of{' '}
            <kbd className='px-1 py-0.5 text-xs bg-muted rounded'>⌘</kbd>.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
