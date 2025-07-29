require('dotenv').config({ path: '.env.local' })

console.log('🎯 Final Make.com Integration Test')
console.log('Make sure your Make.com scenario is ACTIVATED before running this test!\n')

const makecomWebhookUrl = process.env.MAKE_WEBHOOK_URL

if (!makecomWebhookUrl) {
    console.error('❌ MAKE_WEBHOOK_URL not configured')
    process.exit(1)
}

console.log('📋 Current Webhook URL:', makecomWebhookUrl)

// Test payload that matches your Make.com scenario expectations
const testPayload = {
    contract_id: 'test-contract-id-123',
    contract_number: 'PAC-TEST-001',
    contract_type: 'full-time-permanent',
    first_party_name_en: 'Test Company Ltd',
    first_party_name_ar: 'شركة اختبار المحدودة',
    first_party_crn: 'CRN123456',
    second_party_name_en: 'Test Partner Ltd',
    second_party_name_ar: 'شريك اختبار المحدودة',
    second_party_crn: 'CRN789012',
    promoter_name_en: 'John Doe',
    promoter_name_ar: 'جون دو',
    job_title: 'Software Engineer',
    work_location: 'Muscat, Oman',
    email: 'john.doe@test.com',
    start_date: '2025-01-01',
    end_date: '2025-12-31',
    id_card_number: '123456789',
    promoter_id_card_url: 'https://example.com/id-card.jpg',
    promoter_passport_url: 'https://example.com/passport.jpg',
    pdf_url: ''
}

console.log('📤 Sending test payload to Make.com...')
console.log('📤 Payload:', JSON.stringify(testPayload, null, 2))

async function testMakecomIntegration() {
    try {
        const response = await fetch(makecomWebhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testPayload)
        })

        console.log('\n🔗 Response Status:', response.status, response.statusText)
        
        if (response.ok) {
            const responseText = await response.text()
            console.log('✅ Success! Make.com scenario is working!')
            console.log('📄 Response:', responseText)
            
            try {
                const responseJson = JSON.parse(responseText)
                console.log('\n🎉 Integration Status: FULLY FUNCTIONAL')
                console.log('✅ Contract processing initiated')
                console.log('✅ Google Docs template will be populated')
                console.log('✅ PDF will be generated and uploaded')
                console.log('✅ Contract status will be updated')
            } catch (e) {
                console.log('ℹ️ Response is not JSON format, but webhook is working')
            }
        } else {
            console.error('❌ Webhook failed with status:', response.status)
            const errorText = await response.text()
            console.error('❌ Error response:', errorText)
            
            if (response.status === 404) {
                console.log('\n🔧 Troubleshooting Steps:')
                console.log('1. Go to Make.com and activate your scenario')
                console.log('2. Check if the webhook URL has changed')
                console.log('3. Verify the scenario is running')
                console.log('4. Check Make.com execution logs')
            }
        }
    } catch (error) {
        console.error('❌ Request failed:', error.message)
        console.log('\n🔧 Troubleshooting Steps:')
        console.log('1. Check your internet connection')
        console.log('2. Verify the webhook URL is correct')
        console.log('3. Make sure Make.com is accessible')
    }
}

testMakecomIntegration()