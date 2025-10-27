# Fix: Add Accessible Labels to Icon-Only Buttons

## Issue
At least 5 icon-only buttons lack `aria-label` attributes, making them inaccessible to screen reader users.

## WCAG Compliance
This violates WCAG 2.1 Level A success criterion 4.1.2 (Name, Role, Value).

## Solution

### Step 1: Identify Icon-Only Buttons

Search the codebase for buttons that contain only icons and no text:

```bash
grep -r "<button>" components/ app/ | grep -v "aria-label"
```

### Step 2: Add Descriptive aria-label Attributes

For each icon-only button, add a descriptive `aria-label`:

**Before:**
```typescript
<button onClick={handleRefresh}>
  <RefreshIcon />
</button>
```

**After:**
```typescript
<button onClick={handleRefresh} aria-label="Refresh data">
  <RefreshIcon />
</button>
```

### Common Button Types and Suggested Labels

| Button Type | Suggested aria-label |
|------------|---------------------|
| Calendar picker | "Open calendar" |
| Close/dismiss | "Close" or "Dismiss" |
| Menu toggle | "Open menu" |
| Search | "Search" |
| Filter | "Filter results" |
| Refresh | "Refresh data" |
| Delete | "Delete item" |
| Edit | "Edit item" |
| Settings | "Open settings" |

### Step 3: Verify All Interactive Elements

Check other interactive elements too:
- Links without text
- Image buttons
- Custom controls

## Verification

1. Use a screen reader (NVDA, JAWS, or VoiceOver)
2. Navigate through the application
3. Verify all buttons announce their purpose
4. Run automated accessibility tests (e.g., axe DevTools)

## Automated Testing

Add this to your test suite:

```typescript
import { axe } from 'jest-axe';

test('should not have accessibility violations', async () => {
  const { container } = render(<YourComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```
