#!/usr/bin/env node

/**
 * Quick script to clean up unused imports in critical components
 * This is a temporary solution - in production, use ESLint auto-fix
 */

const fs = require('fs');
const path = require('path');

// Common unused imports to remove
const unusedImports = {
  // Lucide React icons that are commonly unused
  'lucide-react': [
    'Clock', 'Users', 'FileText', 'Settings', 'Search', 'Filter',
    'Calendar', 'Download', 'Upload', 'Eye', 'EyeOff', 'Lock',
    'Unlock', 'Key', 'Wifi', 'Signal', 'Battery', 'Volume2',
    'Mic', 'Video', 'Camera', 'Image', 'File', 'Folder',
    'Plus', 'Edit', 'Trash2', 'X', 'ChevronDown', 'ChevronUp',
    'ChevronLeft', 'ChevronRight', 'ArrowUpDown', 'ArrowLeft',
    'ArrowRight', 'Menu', 'Package2', 'ClipboardList', 'FileSpreadsheet',
    'Database', 'AlertTriangle', 'CheckCircle', 'XCircle', 'Star',
    'Mail', 'MessageSquare', 'TrendingUp', 'TrendingDown', 'Activity',
    'Target', 'Award', 'Trophy', 'Medal', 'Gem', 'Diamond',
    'Sparkles', 'Rocket', 'Plane', 'Car', 'Bike', 'Heart',
    'Smile', 'Frown', 'Meh', 'ThumbsUp', 'ThumbsDown', 'Hand',
    'Globe', 'MapPin', 'Phone', 'CreditCard', 'Wallet', 'Receipt',
    'Calculator', 'Clipboard', 'BookOpen', 'Bookmark', 'Tag',
    'Hash', 'Server', 'Zap', 'PieChart', 'BarChart', 'LineChart',
    'Bar', 'Pie', 'Cell', 'RefreshCw', 'RotateCcw', 'Play',
    'Pause', 'Stop', 'UserPlus', 'LogOut', 'PanelLeft', 'UserCog',
    'Info', 'AlertCircle', 'HelpCircle', 'Layers', 'Settings2',
    'Smartphone', 'Tablet', 'Truck', 'Network', 'Fingerprint',
    'DatabaseCheck', 'DatabaseIcon', 'HashIcon', 'HashIcon2',
    'MailIcon', 'Separator', 'FormDescription', 'DialogDescription',
    'CardDescription', 'CardHeader', 'CardTitle', 'Select',
    'SelectContent', 'SelectItem', 'SelectTrigger', 'SelectValue',
    'Switch', 'Label', 'Tabs', 'TabsContent', 'TabsList', 'TabsTrigger',
    'AnimatePresence', 'Badge', 'Alert', 'AlertDescription',
    'Tooltip', 'TooltipContent', 'TooltipProvider', 'TooltipTrigger',
    'DialogTrigger', 'Textarea', 'useState', 'useEffect', 'useRef',
    'useMemo', 'useCallback', 'useContext', 'useReducer', 'useLayoutEffect',
    'useImperativeHandle', 'useDebugValue', 'useId', 'useTransition',
    'useDeferredValue', 'useSyncExternalStore', 'useInsertionEffect'
  ],
  
  // React imports that are commonly unused
  'react': [
    'useState', 'useEffect', 'useRef', 'useMemo', 'useCallback',
    'useContext', 'useReducer', 'useLayoutEffect', 'useImperativeHandle',
    'useDebugValue', 'useId', 'useTransition', 'useDeferredValue',
    'useSyncExternalStore', 'useInsertionEffect'
  ],
  
  // Next.js imports that are commonly unused
  'next/navigation': [
    'useRouter', 'usePathname', 'useSearchParams', 'useParams'
  ],
  
  // UI component imports that are commonly unused
  '@/components/ui': [
    'Button', 'Input', 'Label', 'Card', 'CardContent', 'CardDescription',
    'CardHeader', 'CardTitle', 'Dialog', 'DialogContent', 'DialogDescription',
    'DialogFooter', 'DialogHeader', 'DialogTitle', 'DialogTrigger',
    'Select', 'SelectContent', 'SelectItem', 'SelectTrigger', 'SelectValue',
    'Switch', 'Checkbox', 'RadioGroup', 'RadioGroupItem', 'Textarea',
    'Badge', 'Alert', 'AlertDescription', 'AlertTitle', 'Toast',
    'Toaster', 'Tooltip', 'TooltipContent', 'TooltipProvider', 'TooltipTrigger',
    'Popover', 'PopoverContent', 'PopoverTrigger', 'DropdownMenu',
    'DropdownMenuContent', 'DropdownMenuItem', 'DropdownMenuLabel',
    'DropdownMenuSeparator', 'DropdownMenuTrigger', 'Sheet', 'SheetContent',
    'SheetDescription', 'SheetFooter', 'SheetHeader', 'SheetTitle',
    'SheetTrigger', 'Tabs', 'TabsContent', 'TabsList', 'TabsTrigger',
    'Accordion', 'AccordionContent', 'AccordionItem', 'AccordionTrigger',
    'Avatar', 'AvatarFallback', 'AvatarImage', 'Progress', 'Slider',
    'Separator', 'ScrollArea', 'HoverCard', 'HoverCardContent',
    'HoverCardTrigger', 'ContextMenu', 'ContextMenuContent',
    'ContextMenuItem', 'ContextMenuLabel', 'ContextMenuSeparator',
    'ContextMenuTrigger', 'Menubar', 'MenubarContent', 'MenubarItem',
    'MenubarLabel', 'MenubarMenu', 'MenubarSeparator', 'MenubarShortcut',
    'MenubarTrigger', 'NavigationMenu', 'NavigationMenuContent',
    'NavigationMenuItem', 'NavigationMenuLink', 'NavigationMenuList',
    'NavigationMenuTrigger', 'NavigationMenuViewport', 'Command',
    'CommandDialog', 'CommandEmpty', 'CommandGroup', 'CommandInput',
    'CommandItem', 'CommandList', 'CommandSeparator', 'CommandShortcut',
    'ResizableHandle', 'ResizablePanel', 'ResizablePanelGroup',
    'Collapsible', 'CollapsibleContent', 'CollapsibleTrigger',
    'AspectRatio', 'Carousel', 'CarouselContent', 'CarouselItem',
    'CarouselNext', 'CarouselPrevious', 'Drawer', 'DrawerClose',
    'DrawerContent', 'DrawerDescription', 'DrawerFooter', 'DrawerHeader',
    'DrawerTitle', 'DrawerTrigger', 'Skeleton', 'Sonner', 'Toaster'
  ]
};

// Files to process (critical components)
const criticalFiles = [
  'components/dashboard/AdminDashboard.tsx',
  'components/dashboard/PromoterDashboard.tsx',
  'components/dashboard/SimpleAdminDashboard.tsx',
  'components/dashboard/SimplePromoterDashboard.tsx',
  'components/contracts/ContractsTable.tsx',
  'components/enhanced-contract-form.tsx',
  'components/permission-aware-header.tsx',
  'components/permission-aware-sidebar.tsx',
  'components/professional-header.tsx',
  'components/professional-sidebar.tsx',
  'src/components/auth/simple-auth-provider.tsx',
  'src/components/client-layout.tsx'
];

function cleanUnusedImports(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;

    // Clean up unused imports from each package
    Object.entries(unusedImports).forEach(([packageName, unusedItems]) => {
      const importRegex = new RegExp(
        `import\\s*{([^}]+)}\\s*from\\s*['"]${packageName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`,
        'g'
      );

      content = content.replace(importRegex, (match, importList) => {
        const imports = importList.split(',').map(imp => imp.trim());
        const usedImports = imports.filter(imp => {
          const cleanImp = imp.replace(/\s+as\s+\w+/, '').trim();
          return !unusedItems.includes(cleanImp);
        });

        if (usedImports.length === 0) {
          modified = true;
          return ''; // Remove entire import
        } else if (usedImports.length !== imports.length) {
          modified = true;
          return `import { ${usedImports.join(', ')} } from '${packageName}'`;
        }

        return match;
      });
    });

    // Clean up empty lines after import removal
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

    if (modified) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Cleaned: ${filePath}`);
    } else {
      console.log(`ℹ️  No changes needed: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

console.log('🧹 Cleaning up unused imports in critical components...\n');

criticalFiles.forEach(cleanUnusedImports);

console.log('\n✨ Cleanup complete!');
console.log('💡 For comprehensive cleanup, run: npm run lint -- --fix'); 