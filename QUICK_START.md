# ⚡ Quick Start Guide

**Get started with the new improvements in 5 minutes!**

---

## 🚀 Instant Wins (No Integration Required)

These utilities are ready to use immediately:

### 1. Debounce Search Input (Copy & Paste)

```typescript
import { useDebounce } from '@/lib/utils/performance';

function YourComponent() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Use debouncedSearch instead of searchTerm for API calls
  useEffect(() => {
    if (debouncedSearch) {
      fetchData(debouncedSearch);
    }
  }, [debouncedSearch]);
}
```

### 2. Sanitize User Input (Copy & Paste)

```typescript
import { sanitizeInput } from '@/lib/utils/security';

function FormComponent() {
  const handleSubmit = (input: string) => {
    const clean = sanitizeInput(input); // Removes XSS attempts
    // Use clean input safely
  };
}
```

### 3. Validate Password Strength (Copy & Paste)

```typescript
import { validatePasswordStrength } from '@/lib/utils/security';

function PasswordInput() {
  const [password, setPassword] = useState('');
  const strength = validatePasswordStrength(password);

  return (
    <div>
      <input value={password} onChange={e => setPassword(e.target.value)} />
      {!strength.isStrong && (
        <ul>
          {strength.feedback.map(tip => <li key={tip}>{tip}</li>)}
        </ul>
      )}
    </div>
  );
}
```

### 4. Announce to Screen Readers (Copy & Paste)

```typescript
import { announceToScreenReader } from '@/lib/utils/accessibility';

function NotificationButton() {
  const handleClick = () => {
    // Perform action
    announceToScreenReader('Item added to cart', 'polite');
  };
}
```

---

## 🎯 Quick Integrations (15 minutes each)

### Filter Persistence

**File**: `components/promoters/promoters-filters.tsx`

```typescript
// Add at top
import { useFilterPersistence } from '@/lib/hooks/use-filter-persistence';

// Inside your component
const {
  filters,
  updateFilters,
  resetFilters,
} = useFilterPersistence(
  {
    searchTerm: '',
    statusFilter: 'all',
    documentFilter: 'all',
    assignmentFilter: 'all',
  },
  { key: 'promoters-filters', syncWithUrl: true }
);

// Use instead of individual state variables
<Input
  value={filters.searchTerm}
  onChange={(e) => updateFilters({ searchTerm: e.target.value })}
/>
```

### Error Boundary

**File**: `app/layout.tsx` or any page

```typescript
import { EnhancedErrorBoundary } from '@/components/errors/enhanced-error-boundary';

export default function Layout({ children }) {
  return (
    <EnhancedErrorBoundary
      componentName="Main App"
      maxRetries={3}
    >
      {children}
    </EnhancedErrorBoundary>
  );
}
```

### Optimistic Updates

**File**: Any component with mutations

```typescript
import { usePromoterMutations } from '@/lib/hooks/use-promoter-mutations';

function PromoterActions({ promoter }) {
  const { update, isUpdating } = usePromoterMutations();

  const handleStatusToggle = () => {
    update({
      id: promoter.id,
      updates: { status: 'active' }
    });
    // UI updates instantly, rolls back on error automatically
  };

  return (
    <Button onClick={handleStatusToggle} disabled={isUpdating}>
      Update
    </Button>
  );
}
```

---

## 🔧 Environment Setup (2 minutes)

Add to `.env.local`:

```env
# Optional: Enable error reporting
NEXT_PUBLIC_ERROR_REPORTING_ENABLED=true

# Optional: Feature flags
NEXT_PUBLIC_ENABLE_FILTER_PERSISTENCE=true
NEXT_PUBLIC_ENABLE_ADVANCED_EXPORT=true
```

---

## ✅ Testing Checklist

**After integrating any feature:**

- [ ] Check browser console for errors
- [ ] Test with keyboard navigation (Tab, Enter, Esc)
- [ ] Test with screen reader (if possible)
- [ ] Verify no performance degradation
- [ ] Check mobile responsiveness
- [ ] Test error scenarios

---

## 📋 Common Patterns

### Pattern 1: Lazy Load Component

```typescript
import { useIntersectionObserver } from '@/lib/utils/performance';

function LazyImage({ src }) {
  const ref = useRef(null);
  const isVisible = useIntersectionObserver(ref, { threshold: 0.1 });

  return (
    <div ref={ref}>
      {isVisible ? <img src={src} /> : <div>Loading...</div>}
    </div>
  );
}
```

### Pattern 2: Validate File Upload

```typescript
import { validateFile } from '@/lib/utils/security';

function FileUpload() {
  const handleFile = (file: File) => {
    const validation = validateFile(file, {
      maxSizeBytes: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
      allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf'],
    });

    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    // Proceed with upload
  };
}
```

### Pattern 3: Focus Trap Modal

```typescript
import { useFocusTrap } from '@/lib/utils/accessibility';

function Modal({ isOpen }) {
  const containerRef = useFocusTrap(isOpen);

  return (
    <div ref={containerRef}>
      {/* Modal content */}
    </div>
  );
}
```

---

## 🐛 Troubleshooting

### Issue: "Cannot find module..."

**Solution**: Restart your dev server (`npm run dev`)

### Issue: TypeScript errors

**Solution**: Run `npm run type-check` to see all errors

### Issue: Linting errors

**Solution**: Run `npm run lint:fix`

### Issue: Features not working

**Solution**: Check browser console for errors

---

## 📚 Next Steps

1. ✅ Try the "Instant Wins" examples
2. ⏳ Integrate filter persistence (biggest impact)
3. ⏳ Add error boundary to your app
4. ⏳ Review full `IMPLEMENTATION_GUIDE.md`
5. ⏳ Read `IMPROVEMENTS_SUMMARY.md` for complete overview

---

## 💬 Need Help?

- **Documentation**: Check `IMPLEMENTATION_GUIDE.md`
- **Examples**: See usage examples in each utility file
- **Issues**: Review `COMPREHENSIVE_SYSTEM_REVIEW_AND_IMPROVEMENTS.md`

---

**Ready to go! Start with any of the examples above.** 🚀
