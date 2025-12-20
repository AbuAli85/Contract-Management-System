'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function TestWhatsAppPage() {
  const [phone, setPhone] = useState('+96879665522');
  const [message, setMessage] = useState('Test WhatsApp notification from Contract Management System');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [configStatus, setConfigStatus] = useState<any>(null);
  const { toast } = useToast();

  // Check configuration on mount
  useEffect(() => {
    checkConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkConfig = async () => {
    try {
      const response = await fetch('/api/test/whatsapp');
      const data = await response.json();
      setConfigStatus(data);
    } catch (error) {
      console.error('Error checking config:', error);
    }
  };

  const sendTest = async () => {
    if (!phone) {
      toast({
        title: 'Error',
        description: 'Please enter a phone number',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test/whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, message }),
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        toast({
          title: 'Success! ✅',
          description: 'WhatsApp message sent! Check your phone for the message.',
        });
      } else {
        toast({
          title: 'Error',
          description: data.error || data.details?.error || 'Failed to send WhatsApp message',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send test message',
        variant: 'destructive',
      });
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MessageSquare className="h-8 w-8 text-green-600" />
          Test WhatsApp Notifications
        </h1>
        <p className="text-muted-foreground mt-2">
          Send a test WhatsApp message to verify your configuration
        </p>
      </div>

      {/* Configuration Status */}
      {configStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configuration Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>WhatsApp Configured:</span>
                <Badge variant={configStatus.configured ? 'default' : 'destructive'}>
                  {configStatus.configured ? '✅ Yes' : '❌ No'}
                </Badge>
              </div>
              {configStatus.config && (
                <div className="mt-4 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Account SID:</span>
                    <span>{configStatus.config.accountSid}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Auth Token:</span>
                    <span>{configStatus.config.authToken}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>WhatsApp From:</span>
                    <span>{configStatus.config.whatsappFrom}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Template SID:</span>
                    <span>{configStatus.config.templateSid}</span>
                  </div>
                </div>
              )}
              {!configStatus.configured && (
                <p className="text-sm text-muted-foreground mt-2">
                  {configStatus.instructions}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Form */}
      <Card>
        <CardHeader>
          <CardTitle>Send Test Message</CardTitle>
          <CardDescription>
            Enter a phone number and message to test WhatsApp notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number (E.164 format)</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+96879665522"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Format: +[country code][number]. Example: +96879665522 (Oman)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Input
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Test message"
              disabled={loading}
            />
          </div>

          <Button 
            onClick={sendTest} 
            disabled={loading || !configStatus?.configured}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Test WhatsApp
              </>
            )}
          </Button>

          {!configStatus?.configured && (
            <p className="text-sm text-destructive">
              ⚠️ WhatsApp is not configured. Please set up your Twilio credentials first.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {result.success ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Success
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  Error
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {result.messageId && (
                <div>
                  <span className="font-medium">Message ID:</span>{' '}
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {result.messageId}
                  </code>
                </div>
              )}
              
              {result.details && (
                <div className="mt-4">
                  <p className="font-medium mb-2">Details:</p>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="font-medium">Method:</span> {result.details.method}
                    </div>
                    <div>
                      <span className="font-medium">Phone:</span> {result.details.phone}
                    </div>
                    {result.details.channels && (
                      <div className="mt-2">
                        <span className="font-medium">Channels Sent:</span>
                        <div className="ml-4 space-y-1">
                          <div>WhatsApp: {result.details.channels.whatsapp || 0}</div>
                          <div>In-App: {result.details.channels.inApp || 0}</div>
                          <div>Email: {result.details.channels.email || 0}</div>
                          <div>SMS: {result.details.channels.sms || 0}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {result.error && (
                <div className="mt-4 p-3 bg-destructive/10 rounded-md">
                  <p className="text-sm font-medium text-destructive">Error:</p>
                  <p className="text-sm">{result.error}</p>
                </div>
              )}

              {result.errors && result.errors.length > 0 && (
                <div className="mt-4 p-3 bg-destructive/10 rounded-md">
                  <p className="text-sm font-medium text-destructive">Errors:</p>
                  <ul className="text-sm list-disc list-inside">
                    {result.errors.map((err: string, idx: number) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-xs font-medium mb-2">Full Response:</p>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <ol className="list-decimal list-inside space-y-2">
            <li>Enter your WhatsApp-enabled phone number (with country code)</li>
            <li>Enter a test message</li>
            <li>Click "Send Test WhatsApp"</li>
            <li>Check your WhatsApp for the message</li>
            <li>Verify the message was received successfully</li>
          </ol>
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
            <p className="font-medium text-blue-900 dark:text-blue-100">
              💡 Tip:
            </p>
            <p className="text-blue-800 dark:text-blue-200 text-xs mt-1">
              For Twilio sandbox, make sure you've joined the sandbox first by sending the join phrase to the sandbox number.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

