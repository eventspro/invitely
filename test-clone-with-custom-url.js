// Test script to verify clone functionality with custom URLs
import fetch from 'node-fetch';

async function testCloneWithCustomUrl() {
  console.log('🧪 Testing clone functionality with custom URL...');
  
  try {
    // In development mode, we can skip auth token
    const token = 'dev-bypass';
    console.log('✅ Using development mode bypass');
    
    // Get existing templates
    const templatesResponse = await fetch('http://localhost:5001/api/admin/templates', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const templates = await templatesResponse.json();
    console.log(`📋 Found ${templates.length} templates`);
    
    if (templates.length === 0) {
      console.log('❌ No templates available to clone');
      return;
    }
    
    // Use the first template as source
    const sourceTemplate = templates[0];
    console.log(`🎯 Cloning template: ${sourceTemplate.name}`);
    
    // Test custom URL
    const customSlug = `john-jane-test-${Date.now()}`;
    const cloneData = {
      sourceTemplateId: sourceTemplate.id,
      name: 'John & Jane Test Wedding',
      slug: customSlug,
      ownerEmail: 'john.jane@example.com'
    };
    
    const cloneResponse = await fetch('http://localhost:5001/api/admin/templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(cloneData)
    });
    
    if (!cloneResponse.ok) {
      const error = await cloneResponse.json();
      console.log('❌ Clone failed:', error.message);
      return;
    }
    
    const clonedTemplate = await cloneResponse.json();
    console.log('✅ Template cloned successfully!');
    console.log(`🔗 Custom URL: http://localhost:5001/${clonedTemplate.slug}`);
    console.log(`📧 Owner email: ${clonedTemplate.ownerEmail}`);
    
    // Test duplicate URL (should fail)
    console.log('\n🧪 Testing duplicate URL protection...');
    
    const duplicateResponse = await fetch('http://localhost:5001/api/admin/templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        sourceTemplateId: sourceTemplate.id,
        name: 'Another Test',
        slug: customSlug, // Same slug should fail
        ownerEmail: 'test@example.com'
      })
    });
    
    if (duplicateResponse.status === 409) {
      const error = await duplicateResponse.json();
      console.log('✅ Duplicate URL properly rejected:', error.message);
    } else {
      console.log('❌ Duplicate URL was not rejected');
    }
    
    // Test invalid URL format
    console.log('\n🧪 Testing invalid URL format...');
    
    const invalidResponse = await fetch('http://localhost:5001/api/admin/templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        sourceTemplateId: sourceTemplate.id,
        name: 'Invalid URL Test',
        slug: 'INVALID_URL_WITH_SPACES_AND_CAPS', // Should be rejected
        ownerEmail: 'test@example.com'
      })
    });
    
    if (invalidResponse.status === 400) {
      const error = await invalidResponse.json();
      console.log('✅ Invalid URL format properly rejected:', error.message);
    } else {
      console.log('❌ Invalid URL format was not rejected');
    }
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCloneWithCustomUrl();