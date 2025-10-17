import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check environment variables
    const envCheck = {
      GOOGLE_SERVICE_ACCOUNT_KEY: {
        exists: !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
        length: process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.length || 0,
        startsWith: process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.substring(0, 20) || 'N/A'
      },
      GOOGLE_DOCS_TEMPLATE_ID: {
        exists: !!process.env.GOOGLE_DOCS_TEMPLATE_ID,
        value: process.env.GOOGLE_DOCS_TEMPLATE_ID || 'NOT_SET'
      },
      GOOGLE_DRIVE_OUTPUT_FOLDER_ID: {
        exists: !!process.env.GOOGLE_DRIVE_OUTPUT_FOLDER_ID,
        value: process.env.GOOGLE_DRIVE_OUTPUT_FOLDER_ID || 'NOT_SET'
      }
    };

    // Check if service account key is valid JSON
    let serviceAccountValid = false;
    let serviceAccountError = null;
    
    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      try {
        const parsed = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
        serviceAccountValid = !!(
          parsed.type === 'service_account' &&
          parsed.project_id &&
          parsed.private_key &&
          parsed.client_email
        );
      } catch (error) {
        serviceAccountError = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    // Test Google Docs service initialization
    let googleDocsServiceError = null;
    let googleDocsServiceValid = false;
    
    if (envCheck.GOOGLE_SERVICE_ACCOUNT_KEY.exists && envCheck.GOOGLE_DOCS_TEMPLATE_ID.exists) {
      try {
        const { GoogleDocsService } = await import('@/lib/google-docs-service');
        const config = {
          templateId: process.env.GOOGLE_DOCS_TEMPLATE_ID!,
          serviceAccountKey: process.env.GOOGLE_SERVICE_ACCOUNT_KEY!,
          outputFolderId: process.env.GOOGLE_DRIVE_OUTPUT_FOLDER_ID,
        };
        const service = new GoogleDocsService(config);
        googleDocsServiceValid = true;
      } catch (error) {
        googleDocsServiceError = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    return NextResponse.json({
      status: 'success',
      environment: envCheck,
      serviceAccount: {
        valid: serviceAccountValid,
        error: serviceAccountError
      },
      googleDocsService: {
        valid: googleDocsServiceValid,
        error: googleDocsServiceError
      },
      recommendations: {
        missingEnvVars: Object.entries(envCheck)
          .filter(([key, value]) => !value.exists)
          .map(([key]) => key),
        nextSteps: [
          '1. Check environment variables are set in production',
          '2. Verify Google Docs API and Google Drive API are enabled',
          '3. Ensure template is shared with service account',
          '4. Test with /api/test/google-docs endpoint'
        ]
      }
    });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Failed to check Google Docs configuration',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
