'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CurrencySelector } from '@/components/ui/currency-selector';
import { useCurrencyPreference } from '@/hooks/use-currency-preference';
import type { CurrencyCode } from '@/types/currency';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Settings component for managing user's currency preferences
 */
export function CurrencyPreferenceSettings() {
  const { preferredCurrency, setPreferredCurrency, loading, error } =
    useCurrencyPreference();

  const [selectedCurrency, setSelectedCurrency] =
    useState<CurrencyCode>(preferredCurrency);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Update local state when preference is loaded
  React.useEffect(() => {
    if (!loading) {
      setSelectedCurrency(preferredCurrency);
    }
  }, [preferredCurrency, loading]);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    const success = await setPreferredCurrency(selectedCurrency);

    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      setSaveError('Failed to update currency preference');
    }

    setSaving(false);
  };

  const hasChanges = selectedCurrency !== preferredCurrency;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Currency Preferences</CardTitle>
          <CardDescription>Loading your currency settings...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex items-center gap-2'>
            <Loader2 className='h-5 w-5 animate-spin' />
            <span>Loading...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Currency Preferences</CardTitle>
        <CardDescription>
          Choose your preferred currency for displaying amounts throughout the
          application. Original currencies will be shown in tooltips.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='currency-selector'>Preferred Currency</Label>
          <CurrencySelector
            value={selectedCurrency}
            onChange={setSelectedCurrency}
            className='w-full max-w-md'
          />
          <p className='text-sm text-muted-foreground'>
            All monetary amounts will be displayed in this currency when
            possible. Exchange rates are updated daily.
          </p>
        </div>

        {(error || saveError) && (
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>{error || saveError}</AlertDescription>
          </Alert>
        )}

        {saveSuccess && (
          <Alert className='border-green-500 bg-green-50 text-green-800'>
            <CheckCircle className='h-4 w-4 text-green-600' />
            <AlertDescription>
              Currency preference updated successfully!
            </AlertDescription>
          </Alert>
        )}

        <div className='flex gap-3 pt-4'>
          <Button onClick={handleSave} disabled={!hasChanges || saving}>
            {saving ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>

          {hasChanges && (
            <Button
              variant='outline'
              onClick={() => setSelectedCurrency(preferredCurrency)}
              disabled={saving}
            >
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
