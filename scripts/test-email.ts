import { sendEmail } from '../lib/services/email.service';
import {
  documentExpiryEmail,
  contractApprovalEmail,
  welcomeEmail,
} from '../lib/email-templates';

// CHANGE THIS TO YOUR EMAIL ADDRESS
const TEST_EMAIL = 'chairman@falconeyegroup.net';

async function testEmail() {
  console.log('🧪 Testing Resend email integration...\n');
  console.log(`Sending test emails to: ${TEST_EMAIL}\n`);

  // Test 1: Simple email
  console.log('Test 1: Sending simple email...');
  const result1 = await sendEmail({
    to: TEST_EMAIL,
    subject: '✅ Test Email from SmartPro CMS',
    html: '<h1>Hello!</h1><p>This is a test email from your Contract Management System.</p><p>If you received this, Resend is working correctly! 🎉</p>',
    text: 'Hello! This is a test email from your Contract Management System. If you received this, Resend is working correctly!',
  });

  if (result1.success) {
    console.log('✅ Simple email sent! Message ID:', result1.messageId);
  } else {
    console.log('❌ Failed to send:', result1.error);
  }

  // Small delay between emails
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 2: Document expiry template (URGENT)
  console.log('\nTest 2: Sending urgent document expiry email...');
  const emailContent2 = documentExpiryEmail({
    promoterName: 'John Doe (Test)',
    documentType: 'Passport',
    expiryDate: '2025-11-15',
    daysRemaining: 7,
    urgent: true,
  });

  const result2 = await sendEmail({
    to: TEST_EMAIL,
    ...emailContent2,
  });

  if (result2.success) {
    console.log(
      '✅ Urgent document expiry email sent! Message ID:',
      result2.messageId
    );
  } else {
    console.log('❌ Failed to send:', result2.error);
  }

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 3: Document expiry template (Warning)
  console.log('\nTest 3: Sending warning document expiry email...');
  const emailContent3 = documentExpiryEmail({
    promoterName: 'Jane Smith (Test)',
    documentType: 'ID Card',
    expiryDate: '2025-12-31',
    daysRemaining: 30,
    urgent: false,
  });

  const result3 = await sendEmail({
    to: TEST_EMAIL,
    ...emailContent3,
  });

  if (result3.success) {
    console.log(
      '✅ Warning document expiry email sent! Message ID:',
      result3.messageId
    );
  } else {
    console.log('❌ Failed to send:', result3.error);
  }

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 4: Contract approval email
  console.log('\nTest 4: Sending contract approval email...');
  const emailContent4 = contractApprovalEmail({
    recipientName: 'Manager (Test)',
    contractId: 'CTR-2025-001',
    contractType: 'Employment Contract',
    partyName: 'ABC Company Ltd.',
    amount: '5,000 OMR',
    startDate: '2025-11-01',
    actionUrl: 'https://portal.thesmartpro.io/en/contracts/test-123',
  });

  const result4 = await sendEmail({
    to: TEST_EMAIL,
    ...emailContent4,
  });

  if (result4.success) {
    console.log(
      '✅ Contract approval email sent! Message ID:',
      result4.messageId
    );
  } else {
    console.log('❌ Failed to send:', result4.error);
  }

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 5: Welcome email
  console.log('\nTest 5: Sending welcome email...');
  const emailContent5 = welcomeEmail({
    userName: 'New User (Test)',
    email: TEST_EMAIL,
    role: 'manager',
    loginUrl: 'https://portal.thesmartpro.io/en/login',
  });

  const result5 = await sendEmail({
    to: TEST_EMAIL,
    ...emailContent5,
  });

  if (result5.success) {
    console.log('✅ Welcome email sent! Message ID:', result5.messageId);
  } else {
    console.log('❌ Failed to send:', result5.error);
  }

  console.log('\n🎉 Test complete! Check your inbox at:', TEST_EMAIL);
  console.log('\n📊 Summary:');
  console.log('- Simple test email');
  console.log('- Urgent document expiry (7 days)');
  console.log('- Warning document expiry (30 days)');
  console.log('- Contract approval');
  console.log('- Welcome email');
  console.log('\nAll emails should have beautiful HTML designs! 🎨');
}

// Run the test
testEmail().catch(console.error);
