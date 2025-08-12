// Dashboard API Test Script
// Copy and paste this into your browser console

console.log('🧪 Starting Dashboard API Tests...');

async function testDashboardAPIs() {
  const results = {
    stats: null,
    notifications: null,
    activities: null,
    errors: [],
  };

  // Test 1: Stats API
  console.log('\n📊 Testing Stats API...');
  try {
    const statsResponse = await fetch('/api/dashboard/stats', {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });

    console.log('Stats Response Status:', statsResponse.status);

    if (statsResponse.ok) {
      results.stats = await statsResponse.json();
      console.log('✅ Stats API Success:', results.stats);

      // Check key values
      console.log('📈 Key Metrics:');
      console.log(
        '- Total Promoters:',
        results.stats.totalPromoters,
        '(expected: 158)'
      );
      console.log(
        '- Active Promoters:',
        results.stats.activePromoters,
        '(expected: 158)'
      );
      console.log(
        '- Total Parties:',
        results.stats.totalParties,
        '(expected: 16)'
      );
      console.log(
        '- Total Contracts:',
        results.stats.totalContracts,
        '(expected: 0)'
      );
      console.log(
        '- Pending Approvals:',
        results.stats.pendingApprovals,
        '(expected: 0)'
      );
      console.log(
        '- Recent Activity:',
        results.stats.recentActivity,
        '(expected: 0)'
      );
    } else {
      const errorText = await statsResponse.text();
      results.errors.push(
        `Stats API failed: ${statsResponse.status} - ${errorText}`
      );
      console.error('❌ Stats API Failed:', statsResponse.status, errorText);
    }
  } catch (error) {
    results.errors.push(`Stats API error: ${error.message}`);
    console.error('❌ Stats API Error:', error);
  }

  // Test 2: Notifications API
  console.log('\n🔔 Testing Notifications API...');
  try {
    const notificationsResponse = await fetch('/api/dashboard/notifications', {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });

    console.log('Notifications Response Status:', notificationsResponse.status);

    if (notificationsResponse.ok) {
      results.notifications = await notificationsResponse.json();
      console.log('✅ Notifications API Success:', results.notifications);
    } else {
      const errorText = await notificationsResponse.text();
      results.errors.push(
        `Notifications API failed: ${notificationsResponse.status} - ${errorText}`
      );
      console.error(
        '❌ Notifications API Failed:',
        notificationsResponse.status,
        errorText
      );
    }
  } catch (error) {
    results.errors.push(`Notifications API error: ${error.message}`);
    console.error('❌ Notifications API Error:', error);
  }

  // Test 3: Activities API
  console.log('\n📅 Testing Activities API...');
  try {
    const activitiesResponse = await fetch('/api/dashboard/activities', {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });

    console.log('Activities Response Status:', activitiesResponse.status);

    if (activitiesResponse.ok) {
      results.activities = await activitiesResponse.json();
      console.log('✅ Activities API Success:', results.activities);
    } else {
      const errorText = await activitiesResponse.text();
      results.errors.push(
        `Activities API failed: ${activitiesResponse.status} - ${errorText}`
      );
      console.error(
        '❌ Activities API Failed:',
        activitiesResponse.status,
        errorText
      );
    }
  } catch (error) {
    results.errors.push(`Activities API error: ${error.message}`);
    console.error('❌ Activities API Error:', error);
  }

  // Test 4: Authentication Check
  console.log('\n🔐 Testing Authentication...');
  try {
    const authResponse = await fetch('/api/auth/user');
    console.log('Auth Response Status:', authResponse.status);

    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('✅ Authentication Success:', authData);
    } else {
      console.error('❌ Authentication Failed:', authResponse.status);
      results.errors.push(`Authentication failed: ${authResponse.status}`);
    }
  } catch (error) {
    console.error('❌ Authentication Error:', error);
    results.errors.push(`Authentication error: ${error.message}`);
  }

  // Summary
  console.log('\n📋 Test Summary:');
  console.log('- Stats API:', results.stats ? '✅ Working' : '❌ Failed');
  console.log(
    '- Notifications API:',
    results.notifications ? '✅ Working' : '❌ Failed'
  );
  console.log(
    '- Activities API:',
    results.activities ? '✅ Working' : '❌ Failed'
  );

  if (results.errors.length > 0) {
    console.log('\n❌ Errors Found:');
    results.errors.forEach(error => console.log('-', error));
  } else {
    console.log('\n🎉 All APIs working correctly!');
  }

  // Store results for debugging
  window.dashboardTestResults = results;

  return results;
}

// Run the test
testDashboardAPIs().then(results => {
  console.log(
    '\n🏁 Test completed. Results stored in window.dashboardTestResults'
  );
});

// Quick individual tests
console.log('\n🚀 Quick Tests (run individually):');
console.log(
  'fetch("/api/dashboard/stats").then(r => r.json()).then(console.log)'
);
console.log(
  'fetch("/api/dashboard/notifications").then(r => r.json()).then(console.log)'
);
console.log(
  'fetch("/api/dashboard/activities").then(r => r.json()).then(console.log)'
);
console.log('fetch("/api/auth/user").then(r => r.json()).then(console.log)');
