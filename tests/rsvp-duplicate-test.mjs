// RSVP Duplicate Email Test - Verify production fix works
import fetch from 'node-fetch';

const TEST_CONFIG = {
  baseUrl: process.env.TEST_URL || 'http://localhost:3001',
  templateId: 'armenian-classic-001', // Default template ID
  testEmail: 'test.duplicate@example.com'
};

console.log('🧪 Testing RSVP Duplicate Email Prevention');
console.log(`Testing against: ${TEST_CONFIG.baseUrl}`);
console.log('='.repeat(50));

async function testRsvpDuplicatePrevention() {
  const rsvpData = {
    firstName: 'Test',
    lastName: 'User',
    email: TEST_CONFIG.testEmail,
    guestEmail: TEST_CONFIG.testEmail, // Use same email for both fields
    attendance: 'yes',
    guestCount: 2,
    guestNames: 'Guest One, Guest Two',
    dietaryRestrictions: 'None',
    message: 'Test message for duplicate prevention'
  };

  try {
    // Step 1: Submit first RSVP (should succeed)
    console.log('\\n1️⃣ Submitting first RSVP...');
    const firstResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/templates/${TEST_CONFIG.templateId}/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rsvpData)
    });

    const firstResult = await firstResponse.text();
    console.log(`First RSVP Status: ${firstResponse.status}`);
    
    if (firstResponse.status === 201 || firstResponse.status === 200) {
      console.log('✅ First RSVP submitted successfully');
    } else {
      console.log('ℹ️ First RSVP response:', firstResult);
    }

    // Step 2: Submit duplicate RSVP with same email (should fail)
    console.log('\\n2️⃣ Attempting duplicate RSVP with same email...');
    const duplicateResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/templates/${TEST_CONFIG.templateId}/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...rsvpData,
        firstName: 'Duplicate',
        lastName: 'Attempt'
      })
    });

    const duplicateResult = await duplicateResponse.text();
    console.log(`Duplicate RSVP Status: ${duplicateResponse.status}`);
    
    if (duplicateResponse.status === 400) {
      console.log('✅ DUPLICATE PREVENTION WORKING! Second submission rejected');
      console.log('Response:', duplicateResult);
    } else {
      console.log('❌ DUPLICATE PREVENTION FAILED! Second submission was accepted');
      console.log('Response:', duplicateResult);
    }

    // Step 3: Test with different email (should succeed)
    console.log('\\n3️⃣ Submitting RSVP with different email...');
    const differentEmailResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/templates/${TEST_CONFIG.templateId}/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...rsvpData,
        firstName: 'Different',
        lastName: 'Email',
        email: 'different.test@example.com',
        guestEmail: 'different.test@example.com'
      })
    });

    const differentResult = await differentEmailResponse.text();
    console.log(`Different email Status: ${differentEmailResponse.status}`);
    
    if (differentEmailResponse.status === 201 || differentEmailResponse.status === 200) {
      console.log('✅ Different email RSVP submitted successfully');
    } else {
      console.log('⚠️ Different email RSVP failed:', differentResult);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\\n💡 Server might not be running. Start with: npm run dev');
    }
  }
}

async function testTemplateConfigLoading() {
  console.log('\\n\\n🔧 Testing Template Configuration Loading...');
  
  try {
    const configResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/templates/${TEST_CONFIG.templateId}/config`);
    const configResult = await configResponse.text();
    
    console.log(`Config Status: ${configResponse.status}`);
    
    if (configResponse.status === 200) {
      console.log('✅ Template configuration loaded successfully');
      try {
        const config = JSON.parse(configResult);
        console.log(`Template: ${config.coupleInfo?.bride?.firstName || 'N/A'} & ${config.coupleInfo?.groom?.firstName || 'N/A'}`);
      } catch (e) {
        console.log('✅ Config loaded but parsing failed - response:', configResult.substring(0, 200));
      }
    } else {
      console.log('❌ Template configuration failed to load');
      console.log('Response:', configResult.substring(0, 500));
    }
    
  } catch (error) {
    console.error('❌ Template config test failed:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  await testRsvpDuplicatePrevention();
  await testTemplateConfigLoading();
  
  console.log('\\n\\n📋 Test Summary');
  console.log('='.repeat(30));
  console.log('✅ Tests completed');
  console.log('\\n🔍 Manual verification needed:');
  console.log('1. Check database for actual RSVP entries');
  console.log('2. Verify Armenian error messages display correctly');
  console.log('3. Test with both email and guestEmail field variations');
  console.log('4. Test template slug routing (e.g., /armenian-classic-001)');
}

runAllTests();