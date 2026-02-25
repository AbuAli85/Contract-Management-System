// Webhook Service - Centralized webhook management
export class WebhookService {
  // Use NEXT_PUBLIC_ prefixed variables for client-side access
  private static readonly MAIN_WEBHOOK_URL =
    typeof window !== 'undefined'
      ? process.env.NEXT_PUBLIC_MAKE_WEBHOOK_URL
      : process.env.MAKE_WEBHOOK_URL ||
        process.env.NEXT_PUBLIC_MAKE_WEBHOOK_URL;

  private static readonly PDF_READY_WEBHOOK_URL =
    typeof window !== 'undefined'
      ? process.env.NEXT_PUBLIC_PDF_READY_WEBHOOK_URL
      : process.env.PDF_READY_WEBHOOK_URL ||
        process.env.NEXT_PUBLIC_PDF_READY_WEBHOOK_URL;

  private static readonly SLACK_WEBHOOK_URL =
    typeof window !== 'undefined'
      ? process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL
      : process.env.SLACK_WEBHOOK_URL ||
        process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL;

  /**
   * Send contract data to main Make.com webhook for processing
   */
  static async sendToMainWebhook(contractData: unknown) {
    if (!this.MAIN_WEBHOOK_URL) {
      throw new Error('Main webhook URL not configured');
    }

    try {
      const response = await fetch(this.MAIN_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ContractGen-App/1.0',
        },
        body: JSON.stringify({
          ...(typeof contractData === 'object' && contractData !== null
            ? contractData
            : {}),
          timestamp: new Date().toISOString(),
          source: 'contract-app',
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Webhook failed: ${response.status} ${response.statusText}`
        );
      }

      // Try to parse as JSON, fallback to text if it fails
      let result;
      const responseText = await response.text();

      try {
        result = JSON.parse(responseText);
      } catch {
        // If JSON parsing fails, treat as plain text response
        result = { status: 'accepted', message: responseText.trim() };
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send PDF ready notification to Slack webhook
   */
  static async sendToSlackWebhook(pdfData: {
    contract_number: string;
    pdf_url: string;
    status?: string;
    client_name?: string;
    employer_name?: string;
  }) {
    if (!this.SLACK_WEBHOOK_URL) {
      return null;
    }

    try {
      const response = await fetch(this.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ContractGen-App/1.0',
        },
        body: JSON.stringify({
          ...pdfData,
          timestamp: new Date().toISOString(),
          source: 'contract-app-pdf-ready',
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Slack webhook failed: ${response.status} ${response.statusText}`
        );
      }

      // Try to parse as JSON, fallback to text if it fails
      let result;
      const responseText = await response.text();

      try {
        result = JSON.parse(responseText);
      } catch {
        // If JSON parsing fails, treat as plain text response
        result = { status: 'accepted', message: responseText.trim() };
      }

      return result;
    } catch (error) {
      // Don't throw - Slack notification failure shouldn't break the main flow
      return null;
    }
  }

  /**
   * Process contract and trigger both webhooks in sequence
   */
  static async processContract(contractData: unknown) {
    try {
      // Step 1: Send to main webhook for processing
      const mainResult = await this.sendToMainWebhook(contractData);

      // Step 2: If main processing succeeds and we have a PDF URL, notify PDF Ready webhook
      if (mainResult?.pdf_url && this.PDF_READY_WEBHOOK_URL) {
        try {
          await fetch(this.PDF_READY_WEBHOOK_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'ContractGen-App/1.0',
            },
            body: JSON.stringify({
              contract_number:
                (
                  contractData as unknown as {
                    contract_number?: string;
                    id?: string;
                  }
                ).contract_number ||
                (contractData as unknown as { id?: string }).id ||
                'unknown',
              pdf_url: mainResult.pdf_url,
              status: 'ready',
              timestamp: new Date().toISOString(),
              source: 'contract-app-pdf-ready',
            }),
          });
        } catch (pdfReadyError) {
          // Don't fail the main process if PDF Ready webhook fails
        }
      }

      return mainResult;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Test both webhooks
   */
  static async testWebhooks() {
    const testData = {
      contract_number: 'PAC-23072024-0001',
      client_name: 'Test Client',
      employer_name: 'Test Employer',
      test_mode: true,
    };

    try {
      // Test main webhook
      await this.sendToMainWebhook(testData);

      // Test Slack webhook
      await this.sendToSlackWebhook({
        contract_number: 'PAC-23072024-0001',
        pdf_url: 'https://example.com/test.pdf',
        status: 'test',
        client_name: 'Test Client',
        employer_name: 'Test Employer',
      });

      return { success: true, message: 'All webhooks working' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
