// ============================================================================
// DIAGNOSE WEBHOOK 500 ERROR
// ============================================================================
// This script diagnoses the 500 Internal Server Error
// ============================================================================

async function diagnoseWebhook500() {
  console.log('🔍 Diagnosing webhook 500 error...');

  // Test 1: Check if webhook is accessible
  console.log('\n🧪 Test 1: Webhook accessibility');
  try {
    const response = await fetch('https://portal.thesmartpro.io/api/webhook/makecom-simple', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    console.log('📊 GET Response Status:', response.status);
    console.log('📊 GET Response:', result);

    if (response.ok) {
      console.log('✅ Webhook endpoint is accessible');
    } else {
      console.log('❌ Webhook endpoint returned error:', response.status);
    }
  } catch (error) {
    console.error('❌ Webhook accessibility test failed:', error);
  }

  // Test 2: Test with minimal payload
  console.log('\n🧪 Test 2: Minimal payload test');
  try {
    const minimalPayload = {
      "contract_type": "full-time-permanent",
      "promoter_id": "f174aa8c-e25d-4432-b365-0148723d12ea"
    };

    const response = await fetch('https://portal.thesmartpro.io/api/webhook/makecom-simple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': 'make_webhook_0b37f95424ac249e6bbdad4e39de6028d09f8ec8b84bd671b36c8905ec93f806',
        'X-Request-ID': `diagnostic-${Date.now()}`
      },
      body: JSON.stringify(minimalPayload)
    });

    const result = await response.json();
    console.log('📊 Minimal Response Status:', response.status);
    console.log('📊 Minimal Response:', result);

    if (response.ok) {
      console.log('✅ Minimal payload test successful');
    } else {
      console.log('❌ Minimal payload test failed:', result.error);
      console.log('❌ Error details:', result.details);
    }
  } catch (error) {
    console.error('❌ Minimal payload test error:', error);
  }

  // Test 3: Test with complete payload
  console.log('\n🧪 Test 3: Complete payload test');
  try {
    const completePayload = {
      "contract_id": `diagnostic-${Date.now()}`,
      "contract_number": `DIAG-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      "contract_type": "full-time-permanent",
      "promoter_id": "f174aa8c-e25d-4432-b365-0148723d12ea",
      "first_party_id": "4cc8417a-3ff2-46a6-b901-1f9c8bd8b6ce",
      "second_party_id": "a7453123-f814-47a5-b3fa-e119eb5f2da6",
      "job_title": "promoter",
      "department": "Sales",
      "work_location": "seeb",
      "basic_salary": "250",
      "contract_start_date": "2025-10-19",
      "contract_end_date": "2027-10-18",
      "special_terms": "",
      "header_logo": "https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/party-logos/extra%20logo1.png"
    };

    const response = await fetch('https://portal.thesmartpro.io/api/webhook/makecom-simple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': 'make_webhook_0b37f95424ac249e6bbdad4e39de6028d09f8ec8b84bd671b36c8905ec93f806',
        'X-Request-ID': `diagnostic-complete-${Date.now()}`
      },
      body: JSON.stringify(completePayload)
    });

    const result = await response.json();
    console.log('📊 Complete Response Status:', response.status);
    console.log('📊 Complete Response:', result);

    if (response.ok) {
      console.log('✅ Complete payload test successful');
    } else {
      console.log('❌ Complete payload test failed:', result.error);
      console.log('❌ Error details:', result.details);
      console.log('❌ Error code:', result.error_code);
    }
  } catch (error) {
    console.error('❌ Complete payload test error:', error);
  }

  // Test 4: Test with invalid webhook secret
  console.log('\n🧪 Test 4: Invalid webhook secret test');
  try {
    const response = await fetch('https://portal.thesmartpro.io/api/webhook/makecom-simple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': 'invalid-secret',
        'X-Request-ID': `diagnostic-invalid-${Date.now()}`
      },
      body: JSON.stringify({
        "contract_type": "full-time-permanent",
        "promoter_id": "f174aa8c-e25d-4432-b365-0148723d12ea"
      })
    });

    const result = await response.json();
    console.log('📊 Invalid Secret Response Status:', response.status);
    console.log('📊 Invalid Secret Response:', result);

    if (response.status === 401) {
      console.log('✅ Authentication is working correctly');
    } else {
      console.log('❌ Authentication test unexpected result');
    }
  } catch (error) {
    console.error('❌ Invalid secret test error:', error);
  }

  // Test 5: Test with missing required fields
  console.log('\n🧪 Test 5: Missing required fields test');
  try {
    const response = await fetch('https://portal.thesmartpro.io/api/webhook/makecom-simple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': 'make_webhook_0b37f95424ac249e6bbdad4e39de6028d09f8ec8b84bd671b36c8905ec93f806',
        'X-Request-ID': `diagnostic-missing-${Date.now()}`
      },
      body: JSON.stringify({
        "contract_type": "full-time-permanent"
        // Missing promoter_id
      })
    });

    const result = await response.json();
    console.log('📊 Missing Fields Response Status:', response.status);
    console.log('📊 Missing Fields Response:', result);

    if (response.status === 400) {
      console.log('✅ Validation is working correctly');
    } else {
      console.log('❌ Validation test unexpected result');
    }
  } catch (error) {
    console.error('❌ Missing fields test error:', error);
  }
}

// Test with the exact payload that was failing
async function testExactFailingPayload() {
  console.log('\n🔍 Testing exact failing payload...');

  const failingPayload = {
    "contract_id": "960531e3406b4336bea96153cf35ce3c",
    "contract_number": "PAC-Su102025-2159",
    "contract_type": "full-time-permanent",
    "promoter_id": "6966eb51-9e0a-483f-8167-e6572e62769f",
    "first_party_id": "4cc8417a-3ff2-46a6-b901-1f9c8bd8b6ce",
    "second_party_id": "a7453123-f814-47a5-b3fa-e119eb5f2da6",
    "job_title": "",
    "department": "",
    "work_location": "",
    "basic_salary": "250",
    "contract_start_date": "2025-10-19",
    "contract_end_date": "2027-10-18",
    "special_terms": "",
    "header_logo": "https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/party-logos/extra%20logo1.png"
  };

  try {
    const response = await fetch('https://portal.thesmartpro.io/api/webhook/makecom-simple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': 'make_webhook_0b37f95424ac249e6bbdad4e39de6028d09f8ec8b84bd671b36c8905ec93f806',
        'X-Request-ID': '960531e3406b4336bea96153cf35ce3c'
      },
      body: JSON.stringify(failingPayload)
    });

    const result = await response.json();
    console.log('📊 Exact Failing Payload Response Status:', response.status);
    console.log('📊 Exact Failing Payload Response:', result);

    if (response.ok) {
      console.log('✅ Exact failing payload now works!');
    } else {
      console.log('❌ Exact failing payload still fails:', result.error);
      console.log('❌ Error details:', result.details);
    }
  } catch (error) {
    console.error('❌ Exact failing payload test error:', error);
  }
}

// Run all diagnostics
async function runDiagnostics() {
  console.log('🚀 Starting webhook 500 error diagnostics...');
  
  await diagnoseWebhook500();
  await testExactFailingPayload();

  console.log('\n📋 Diagnostic Summary:');
  console.log('1. Check if webhook endpoint is accessible');
  console.log('2. Test with minimal payload');
  console.log('3. Test with complete payload');
  console.log('4. Test authentication');
  console.log('5. Test validation');
  console.log('6. Test exact failing payload');
  
  console.log('\n💡 If all tests pass but Make.com still gets 500:');
  console.log('- Check Make.com webhook secret configuration');
  console.log('- Verify Make.com is sending correct headers');
  console.log('- Check Make.com request timeout settings');
  console.log('- Verify Make.com payload format');
}

runDiagnostics().catch(console.error);
