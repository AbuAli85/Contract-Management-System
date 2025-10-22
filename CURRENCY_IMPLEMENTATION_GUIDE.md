# Currency Implementation Guide

## Overview

This guide documents the comprehensive currency handling system implemented in the Contract Management System. The system provides proper currency formatting, conversion, and user preferences for displaying monetary amounts consistently across the application.

## System Components

### 1. Database Layer

#### Exchange Rates Table
```sql
CREATE TABLE exchange_rates (
    id UUID PRIMARY KEY,
    from_currency currency_code NOT NULL,
    to_currency currency_code NOT NULL,
    rate DECIMAL(18,8) NOT NULL,
    effective_date DATE NOT NULL,
    updated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    source TEXT DEFAULT 'manual',
    is_active BOOLEAN DEFAULT TRUE
);
```

#### Currency Enum
Supported currencies: `USD`, `OMR`, `SAR`, `AED`, `EUR`, `GBP`

#### User Preferences
```sql
ALTER TABLE profiles 
ADD COLUMN preferred_currency currency_code DEFAULT 'USD';
```

#### Contracts Table
```sql
ALTER TABLE contracts
ADD CONSTRAINT contracts_currency_check 
CHECK (currency IN ('USD', 'OMR', 'SAR', 'AED', 'EUR', 'GBP'));
```

### 2. TypeScript Types

Location: `types/currency.ts`

**Key Types:**
- `CurrencyCode`: Union type of supported currencies
- `ExchangeRate`: Database record type
- `CurrencyMetadata`: Display configuration
- `Money`: Amount with currency pairing
- `ConversionResult`: Conversion details with metadata

**Currency Configuration:**
```typescript
export const CURRENCY_CONFIG: Record<CurrencyCode, CurrencyMetadata> = {
  USD: {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    locale: 'en-US',
  },
  OMR: {
    code: 'OMR',
    name: 'Omani Rial',
    symbol: 'ر.ع.',
    symbolPosition: 'before',
    decimalPlaces: 3, // Omani Rial uses 3 decimal places
    thousandsSeparator: ',',
    decimalSeparator: '.',
    locale: 'ar-OM',
  },
  // ... other currencies
};
```

### 3. Currency Service

Location: `lib/services/currency.service.ts`

**Main Methods:**

#### format(amount, currency, options)
Formats a currency amount with proper localization.

```typescript
currencyService.format(1234.56, 'USD')
// Output: "$ 1,234.56"

currencyService.format(1234.567, 'OMR')
// Output: "ر.ع. 1,234.567"
```

#### convert(amount, fromCurrency, toCurrency)
Converts an amount between currencies using the latest exchange rate.

```typescript
const converted = await currencyService.convert(100, 'USD', 'OMR');
// Returns: 38.5 (based on current exchange rate)
```

#### getExchangeRate(fromCurrency, toCurrency)
Fetches the exchange rate between two currencies.

```typescript
const rate = await currencyService.getExchangeRate('USD', 'OMR');
// Returns: 0.385
```

#### formatWithConversion(amount, originalCurrency, displayCurrency)
Formats with conversion and provides tooltip text for original amount.

```typescript
const result = await currencyService.formatWithConversion(100, 'USD', 'OMR');
// Returns: {
//   display: "ر.ع. 38.500",
//   tooltip: "Original: $ 100.00",
//   converted: true
// }
```

**Features:**
- In-memory caching (1-hour duration)
- Automatic rounding to appropriate decimal places
- Fallback handling when conversion fails
- Compact formatting for large numbers

### 4. React Components

#### CurrencyDisplay
Location: `components/ui/currency-display.tsx`

Displays currency amounts with automatic conversion and tooltips.

```tsx
<CurrencyDisplay
  amount={21000}
  currency="USD"
  displayCurrency={preferredCurrency}
  showTooltip={true}
  compact={false}
  showCode={false}
/>
```

**Props:**
- `amount`: The monetary amount
- `currency`: Original currency of the amount
- `displayCurrency`: Currency to display in (optional, uses original if not provided)
- `showTooltip`: Show original currency in tooltip when converted
- `compact`: Use compact notation (e.g., "21K")
- `showCode`: Show currency code alongside symbol

#### CurrencySelector
Location: `components/ui/currency-selector.tsx`

Dropdown for selecting a currency.

```tsx
<CurrencySelector
  value={selectedCurrency}
  onChange={handleCurrencyChange}
  showSymbol={true}
/>
```

#### CurrencyIndicator
Location: `components/ui/currency-indicator.tsx`

Banner to show which currency is being displayed.

```tsx
<CurrencyIndicator currency={preferredCurrency} />
// Displays: "All amounts in $ USD (US Dollar)"
```

#### CurrencyBadge
Small badge to show currency code.

```tsx
<CurrencyBadge currency="OMR" />
```

### 5. React Hooks

#### useCurrencyPreference
Location: `hooks/use-currency-preference.ts`

Hook to manage user's preferred currency.

```tsx
function MyComponent() {
  const {
    preferredCurrency,      // Current preference
    setPreferredCurrency,   // Update function
    loading,                // Loading state
    error                   // Error state
  } = useCurrencyPreference();

  const handleChange = async (newCurrency) => {
    const success = await setPreferredCurrency(newCurrency);
    if (success) {
      // Currency updated
    }
  };
}
```

### 6. Settings Component

#### CurrencyPreferenceSettings
Location: `components/settings/currency-preference-settings.tsx`

Full settings card for managing currency preferences.

```tsx
import { CurrencyPreferenceSettings } from '@/components/settings/currency-preference-settings';

// In your settings page:
<CurrencyPreferenceSettings />
```

## Usage Examples

### Example 1: Display Contract Value

```tsx
import { CurrencyDisplay } from '@/components/ui/currency-display';
import { useCurrencyPreference } from '@/hooks/use-currency-preference';

function ContractCard({ contract }) {
  const { preferredCurrency } = useCurrencyPreference();

  return (
    <div>
      <h3>{contract.title}</h3>
      <p>
        Value: <CurrencyDisplay
          amount={contract.value}
          currency={contract.currency || 'USD'}
          displayCurrency={preferredCurrency}
          showTooltip={true}
        />
      </p>
    </div>
  );
}
```

### Example 2: Format Currency in Plain JavaScript

```typescript
import { currencyService } from '@/lib/services/currency.service';

// Simple formatting
const formatted = currencyService.format(1234.56, 'USD');
console.log(formatted); // "$ 1,234.56"

// With conversion
const converted = await currencyService.convert(1000, 'USD', 'OMR');
console.log(converted); // 385

// Compact format for dashboards
const compact = currencyService.formatCompact(1234567, 'USD');
console.log(compact); // "$1.2M"
```

### Example 3: Update Exchange Rates

```typescript
import { currencyService } from '@/lib/services/currency.service';

// Update a rate (requires appropriate permissions)
const success = await currencyService.updateExchangeRate(
  'USD',
  'OMR',
  0.385,
  'central_bank'
);
```

## Database Functions

### get_exchange_rate(from_currency, to_currency, date)
Fetches the most recent exchange rate for a currency pair.

```sql
SELECT get_exchange_rate('USD'::currency_code, 'OMR'::currency_code);
-- Returns: 0.385
```

### convert_currency(amount, from_currency, to_currency, date)
Converts an amount between currencies.

```sql
SELECT convert_currency(100, 'USD'::currency_code, 'OMR'::currency_code);
-- Returns: 38.50
```

### contracts_with_converted_values (View)
Provides contract values in multiple currencies.

```sql
SELECT 
  id,
  original_value,
  original_currency,
  value_usd,
  value_omr,
  value_sar,
  value_aed
FROM contracts_with_converted_values;
```

## Migration Steps

### Step 1: Run Database Migration
```bash
# The migration file: supabase/migrations/20251023_add_currency_support.sql
psql -d your_database < supabase/migrations/20251023_add_currency_support.sql
```

### Step 2: Update Existing Contracts
```sql
-- Set default currency for existing contracts if null
UPDATE contracts 
SET currency = 'USD' 
WHERE currency IS NULL;
```

### Step 3: Initialize User Preferences
```sql
-- Set default currency preference for existing users
UPDATE profiles 
SET preferred_currency = 'USD' 
WHERE preferred_currency IS NULL;
```

## Best Practices

### 1. Always Store Currency with Amount
Never store monetary amounts without the associated currency code.

✅ **Good:**
```typescript
const contract = {
  value: 21000,
  currency: 'OMR'
};
```

❌ **Bad:**
```typescript
const contract = {
  value: 21000  // What currency is this?
};
```

### 2. Use CurrencyDisplay Component
For consistency, always use the `CurrencyDisplay` component in React.

✅ **Good:**
```tsx
<CurrencyDisplay amount={contract.value} currency={contract.currency} />
```

❌ **Bad:**
```tsx
<span>${contract.value}</span>
```

### 3. Show Original Currency
When converting, always provide a way to see the original currency.

✅ **Good:**
```tsx
<CurrencyDisplay 
  amount={1000}
  currency="USD"
  displayCurrency="OMR"
  showTooltip={true}  // Shows original in tooltip
/>
```

### 4. Handle Missing Exchange Rates
Always handle cases where conversion fails.

```typescript
const converted = await currencyService.convert(amount, from, to);
if (converted === null) {
  // Fallback to original currency
  return currencyService.format(amount, from);
}
```

### 5. Update Exchange Rates Regularly
Set up a cron job or scheduled task to update exchange rates daily.

```sql
-- Example: Update rates from an API or manual process
INSERT INTO exchange_rates (from_currency, to_currency, rate, source, effective_date)
VALUES ('USD', 'OMR', 0.385, 'central_bank', CURRENT_DATE)
ON CONFLICT (from_currency, to_currency, effective_date)
DO UPDATE SET rate = EXCLUDED.rate, updated_at = NOW();
```

## API Integration (Future Enhancement)

### Fetching Live Exchange Rates

```typescript
// Example implementation for future use
async function updateExchangeRatesFromAPI() {
  const response = await fetch('https://api.exchangerate.com/latest/USD');
  const data = await response.json();
  
  for (const [currency, rate] of Object.entries(data.rates)) {
    if (['OMR', 'SAR', 'AED', 'EUR', 'GBP'].includes(currency)) {
      await currencyService.updateExchangeRate(
        'USD',
        currency as CurrencyCode,
        rate as number,
        'api'
      );
    }
  }
}
```

## Testing

### Unit Tests for Currency Service

```typescript
import { currencyService } from '@/lib/services/currency.service';

describe('CurrencyService', () => {
  test('formats USD correctly', () => {
    const result = currencyService.format(1234.56, 'USD');
    expect(result).toBe('$ 1,234.56');
  });

  test('formats OMR with 3 decimal places', () => {
    const result = currencyService.format(1234.567, 'OMR');
    expect(result).toContain('1,234.567');
  });

  test('converts between currencies', async () => {
    const result = await currencyService.convert(100, 'USD', 'OMR');
    expect(result).toBeGreaterThan(0);
  });
});
```

## Troubleshooting

### Issue: Exchange rate not found
**Solution:** Ensure the exchange_rates table has the required currency pair. Insert missing rates.

### Issue: Currency not displaying correctly
**Solution:** Check that the `CURRENCY_CONFIG` in `types/currency.ts` has the correct locale and formatting settings.

### Issue: Conversion returns null
**Solution:** Verify that exchange rates exist for the date range and currency pair.

### Issue: User preference not updating
**Solution:** Check that the user is authenticated and has a profile in the profiles table.

## Future Enhancements

1. **Historical Exchange Rates**: Track rate changes over time
2. **Multi-currency Reports**: Generate reports showing all currencies
3. **Currency Conversion Fees**: Add support for transaction fees
4. **Real-time Rates**: Integrate with live exchange rate APIs
5. **Cryptocurrency Support**: Extend to support digital currencies
6. **Bulk Rate Updates**: Admin interface for bulk exchange rate management

## Summary

The currency system provides:
- ✅ Consistent formatting across the application
- ✅ Automatic currency conversion based on user preferences
- ✅ Proper handling of different decimal places (OMR: 3, others: 2)
- ✅ Tooltips showing original currency
- ✅ Database-backed exchange rates
- ✅ User preferences for currency display
- ✅ Type-safe currency handling
- ✅ Comprehensive documentation

All monetary values are now displayed consistently with proper currency symbols and the ability to convert to the user's preferred currency.

