/**
 * Integration Settings Component
 *
 * Complete implementation for third-party integrations (Make.com webhooks, etc.)
 * Replaces placeholder text with functional integration management.
 *
 * Location: app/[locale]/dashboard/settings/page.tsx (Integrations tab)
 */

'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Webhook,
  Key,
  CheckCircle,
  XCircle,
  ExternalLink,
  Copy,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface IntegrationSettings {
  webhookUrl: string;
  webhookSecret: string;
  apiKey: string;
  enableWebhooks: boolean;
  webhookEvents: string[];
}

export default function IntegrationSettings() {
  const [settings, setSettings] = useState<IntegrationSettings>({
    webhookUrl: '',
    webhookSecret: '',
    apiKey: '',
    enableWebhooks: false,
    webhookEvents: [
      'contract.created',
      'contract.updated',
      'document.expiring',
    ],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(
    null
  );
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/user/integration-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to load integration settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/user/integration-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast({
          title: '✅ Settings Saved',
          description:
            'Your integration settings have been updated successfully.',
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      toast({
        title: '❌ Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const testWebhook = async () => {
    if (!settings.webhookUrl) {
      toast({
        title: '⚠️ Missing URL',
        description: 'Please enter a webhook URL first.',
        variant: 'destructive',
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/integrations/test-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: settings.webhookUrl,
          webhookSecret: settings.webhookSecret,
        }),
      });

      if (response.ok) {
        setTestResult('success');
        toast({
          title: '✅ Webhook Test Successful',
          description:
            'Your webhook URL is working correctly and received the test payload.',
        });
      } else {
        setTestResult('error');
        const error = await response.json();
        toast({
          title: '❌ Webhook Test Failed',
          description: error.message || 'Could not reach the webhook URL.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      setTestResult('error');
      toast({
        title: '❌ Test Error',
        description:
          'Failed to test webhook. Please check the URL and try again.',
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  const generateApiKey = async () => {
    try {
      const response = await fetch('/api/user/generate-api-key', {
        method: 'POST',
      });

      if (response.ok) {
        const { apiKey } = await response.json();
        setSettings(prev => ({ ...prev, apiKey }));
        toast({
          title: '🔑 API Key Generated',
          description:
            'A new API key has been generated. Make sure to save it!',
        });
      }
    } catch (error) {
      toast({
        title: '❌ Error',
        description: 'Failed to generate API key.',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: '📋 Copied',
      description: 'Copied to clipboard',
    });
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <Loader2 className='h-8 w-8 animate-spin text-blue-600' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h3 className='text-lg font-medium'>Third-Party Integrations</h3>
        <p className='text-sm text-muted-foreground'>
          Connect external services to automate your workflow and receive
          real-time updates.
        </p>
      </div>

      {/* Make.com Webhook Integration */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Webhook className='h-5 w-5 text-blue-600' />
              <CardTitle>Make.com Webhook</CardTitle>
            </div>
            {testResult === 'success' && (
              <Badge variant='outline' className='gap-1'>
                <CheckCircle className='h-3 w-3 text-green-600' />
                <span className='text-green-600'>Connected</span>
              </Badge>
            )}
            {testResult === 'error' && (
              <Badge variant='outline' className='gap-1'>
                <XCircle className='h-3 w-3 text-red-600' />
                <span className='text-red-600'>Failed</span>
              </Badge>
            )}
          </div>
          <CardDescription>
            Receive real-time updates about contracts, documents, and workforce
            changes
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='webhook-url'>Webhook URL</Label>
            <div className='flex gap-2'>
              <Input
                id='webhook-url'
                type='url'
                placeholder='https://hook.eu2.make.com/...'
                value={settings.webhookUrl}
                onChange={e =>
                  setSettings(prev => ({ ...prev, webhookUrl: e.target.value }))
                }
              />
              <Button
                variant='outline'
                size='icon'
                onClick={() => copyToClipboard(settings.webhookUrl)}
                disabled={!settings.webhookUrl}
              >
                <Copy className='h-4 w-4' />
              </Button>
            </div>
            <p className='text-xs text-muted-foreground'>
              Create a webhook in Make.com and paste the URL here
            </p>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='webhook-secret'>Webhook Secret (Optional)</Label>
            <Input
              id='webhook-secret'
              type='password'
              placeholder='Enter a secret for webhook authentication'
              value={settings.webhookSecret}
              onChange={e =>
                setSettings(prev => ({
                  ...prev,
                  webhookSecret: e.target.value,
                }))
              }
            />
            <p className='text-xs text-muted-foreground'>
              Add an extra layer of security by validating webhook requests
            </p>
          </div>

          <Separator />

          <div>
            <Label className='mb-2 block'>Webhook Events</Label>
            <div className='flex flex-wrap gap-2'>
              {settings.webhookEvents.map(event => (
                <Badge key={event} variant='secondary'>
                  {event}
                </Badge>
              ))}
            </div>
            <p className='text-xs text-muted-foreground mt-2'>
              These events will trigger webhook notifications
            </p>
          </div>

          <div className='flex gap-2'>
            <Button
              onClick={testWebhook}
              disabled={testing || !settings.webhookUrl}
            >
              {testing ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Testing...
                </>
              ) : (
                'Test Webhook'
              )}
            </Button>
            <Button
              variant='outline'
              onClick={() =>
                window.open(
                  'https://www.make.com/en/integrations/webhooks',
                  '_blank'
                )
              }
            >
              <ExternalLink className='mr-2 h-4 w-4' />
              Make.com Docs
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* API Key Management */}
      <Card>
        <CardHeader>
          <div className='flex items-center gap-2'>
            <Key className='h-5 w-5 text-purple-600' />
            <CardTitle>API Access</CardTitle>
          </div>
          <CardDescription>
            Generate and manage API keys for programmatic access
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='api-key'>API Key</Label>
            <div className='flex gap-2'>
              <Input
                id='api-key'
                type='password'
                placeholder='No API key generated'
                value={settings.apiKey}
                readOnly
              />
              <Button
                variant='outline'
                size='icon'
                onClick={() => copyToClipboard(settings.apiKey)}
                disabled={!settings.apiKey}
              >
                <Copy className='h-4 w-4' />
              </Button>
            </div>
            <p className='text-xs text-muted-foreground'>
              Use this key to authenticate API requests
            </p>
          </div>

          <div className='flex gap-2'>
            <Button variant='outline' onClick={generateApiKey}>
              {settings.apiKey ? 'Regenerate API Key' : 'Generate API Key'}
            </Button>
            <Button
              variant='outline'
              onClick={() => window.open('/docs/api', '_blank')}
            >
              <ExternalLink className='mr-2 h-4 w-4' />
              API Documentation
            </Button>
          </div>

          {settings.apiKey && (
            <div className='p-3 bg-yellow-50 border border-yellow-200 rounded-md'>
              <p className='text-sm text-yellow-800'>
                ⚠️ Keep your API key secure. Don't share it or commit it to
                version control.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className='flex justify-end gap-2'>
        <Button variant='outline' onClick={loadSettings} disabled={saving}>
          Reset
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </div>
  );
}
