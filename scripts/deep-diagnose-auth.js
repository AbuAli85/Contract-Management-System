/**
 * Deep authentication diagnosis
 * This will help identify why the service account isn't working despite APIs being enabled
 */

const { google } = require('googleapis');
const { JWT } = require('google-auth-library');
require('dotenv').config({ path: '.env.local' });

async function deepDiagnoseAuth() {
  console.log('\n🔍 Deep Authentication Diagnosis...\n');
  
  try {
    // Parse credentials
    let credentials;
    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64) {
      const decoded = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64, 'base64').toString('utf8');
      credentials = JSON.parse(decoded);
    } else if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    } else {
      console.log('❌ No service account credentials found');
      return;
    }
    
    console.log('📋 Service Account Details:');
    console.log('   Email:', credentials.client_email);
    console.log('   Project ID:', credentials.project_id);
    console.log('   Private Key ID:', credentials.private_key_id);
    console.log('   Auth URI:', credentials.auth_uri);
    console.log('   Token URI:', credentials.token_uri);
    console.log('');
    
    // Test 1: Validate JWT creation
    console.log('🧪 Test 1: JWT Client Creation...');
    try {
      const auth = new JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: [
          'https://www.googleapis.com/auth/drive',
          'https://www.googleapis.com/auth/documents',
        ],
      });
      console.log('   ✅ JWT client created successfully');
      
      // Test 2: Try to get access token
      console.log('\n🧪 Test 2: Access Token Generation...');
      try {
        const tokenResponse = await auth.getAccessToken();
        console.log('   ✅ Access token generated successfully');
        console.log('   Token type:', tokenResponse.token_type);
        console.log('   Token length:', tokenResponse.access_token?.length || 'N/A');
      } catch (tokenError) {
        console.log('   ❌ Access token generation failed:', tokenError.message);
        
        if (tokenError.message.includes('invalid_grant')) {
          console.log('   🔧 SOLUTION: Service account key might be invalid or expired');
        } else if (tokenError.message.includes('unauthorized_client')) {
          console.log('   🔧 SOLUTION: Service account not authorized for these scopes');
        }
      }
      
      // Test 3: Test with minimal Drive API call
      console.log('\n🧪 Test 3: Minimal Drive API Test...');
      try {
        const drive = google.drive({ version: 'v3', auth });
        
        // Try the simplest possible call
        const response = await drive.about.get({
          fields: 'user',
        });
        
        console.log('   ✅ Drive API accessible');
        console.log('   User:', response.data.user?.displayName || response.data.user?.emailAddress);
        
      } catch (driveError) {
        console.log('   ❌ Drive API failed:', driveError.message);
        
        if (driveError.message.includes('unregistered callers')) {
          console.log('   🔧 POSSIBLE SOLUTIONS:');
          console.log('   1. APIs might not be fully enabled yet (wait 5-10 minutes)');
          console.log('   2. Service account might need additional permissions');
          console.log('   3. Project might have domain restrictions');
          console.log('   4. Billing might not be enabled');
        }
      }
      
      // Test 4: Check if we can access the specific template
      console.log('\n🧪 Test 4: Template Access Test...');
      try {
        const drive = google.drive({ version: 'v3', auth });
        
        const templateInfo = await drive.files.get({
          fileId: '1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0',
          fields: 'id, name, permissions',
        });
        
        console.log('   ✅ Template accessible');
        console.log('   Template name:', templateInfo.data.name);
        
        // Check permissions
        const hasPermission = templateInfo.data.permissions?.some(p => 
          p.emailAddress === credentials.client_email
        );
        
        if (hasPermission) {
          console.log('   ✅ Service account has template permission');
        } else {
          console.log('   ❌ Service account does NOT have template permission');
          console.log('   🔧 SOLUTION: Share template with:', credentials.client_email);
        }
        
      } catch (templateError) {
        console.log('   ❌ Template access failed:', templateError.message);
        
        if (templateError.message.includes('not found')) {
          console.log('   🔧 SOLUTION: Template ID might be wrong or template deleted');
        } else if (templateError.message.includes('forbidden')) {
          console.log('   🔧 SOLUTION: Template not shared with service account');
        }
      }
      
    } catch (jwtError) {
      console.log('   ❌ JWT client creation failed:', jwtError.message);
      console.log('   🔧 SOLUTION: Check service account JSON key format');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n📋 DIAGNOSIS SUMMARY:\n');
    
    console.log('🎯 Common Issues & Solutions:');
    console.log('1. APIs not fully enabled → Wait 5-10 minutes after enabling');
    console.log('2. Service account key invalid → Regenerate key');
    console.log('3. Template not shared → Share with service account email');
    console.log('4. Project billing not enabled → Enable billing in Google Cloud');
    console.log('5. Domain restrictions → Check project settings');
    
    console.log('\n🔧 NEXT STEPS:');
    console.log('1. Wait 5-10 minutes if you just enabled APIs');
    console.log('2. Check Google Cloud Console billing');
    console.log('3. Verify template sharing');
    console.log('4. Try regenerating service account key');
    
  } catch (error) {
    console.error('❌ Deep diagnosis failed:', error.message);
  }
}

deepDiagnoseAuth().catch(console.error);









