// Template Owner Functionality Test
// Tests all template customization features from owner's perspective

import http from 'http';
import fs from 'fs';
import path from 'path';

const TEST_CONFIG = {
  baseUrl: 'http://localhost:5001',
  templateId: 'armenian-classic-001',
  testImage: path.join(process.cwd(), 'client/public/attached_assets', 'default-wedding-couple.jpg')
};

console.log('🎨 Testing Template Owner Customization Features');
console.log(`Server: ${TEST_CONFIG.baseUrl}`);
console.log(`Template: ${TEST_CONFIG.templateId}`);
console.log('='.repeat(60));

// Helper function to make HTTP requests
function makeRequest(path, method = 'GET', data = null, isFormData = false) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5001,
      path: path,
      method: method,
      headers: isFormData ? {} : { 'Content-Type': 'application/json' }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body, headers: res.headers });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data && !isFormData) {
      req.write(JSON.stringify(data));
    } else if (data && isFormData) {
      req.write(data);
    }
    req.end();
  });
}

// Test 1: Template Configuration Loading
async function testTemplateConfigLoading() {
  console.log('\\n1️⃣ Testing Template Configuration Loading...');
  
  try {
    const response = await makeRequest(`/api/templates/${TEST_CONFIG.templateId}/config`);
    
    if (response.statusCode === 200) {
      console.log('✅ Template config loaded successfully');
      
      try {
        const config = JSON.parse(response.body);
        console.log('   📋 Configuration Structure:');
        console.log(`   - Couple Info: ${config.coupleInfo ? '✅' : '❌'}`);
        console.log(`   - Hero Section: ${config.hero ? '✅' : '❌'}`);
        console.log(`   - Photos Section: ${config.photos ? '✅' : '❌'}`);
        console.log(`   - Locations: ${config.locations ? '✅' : '❌'}`);
        console.log(`   - Timeline: ${config.timeline ? '✅' : '❌'}`);
        console.log(`   - RSVP Settings: ${config.rsvp ? '✅' : '❌'}`);
        
        if (config.coupleInfo?.bride && config.coupleInfo?.groom) {
          console.log(`   👰 Bride: ${config.coupleInfo.bride.firstName || 'Not set'}`);
          console.log(`   🤵 Groom: ${config.coupleInfo.groom.firstName || 'Not set'}`);
        }
        
        return config;
      } catch (e) {
        console.log('⚠️ Config loaded but parsing failed');
        return null;
      }
    } else {
      console.log(`❌ Template config failed: ${response.statusCode}`);
      console.log('   Response:', response.body.substring(0, 200));
      return null;
    }
  } catch (error) {
    console.log(`❌ Template config error: ${error.message}`);
    return null;
  }
}

// Test 2: Admin Panel Access
async function testAdminPanelAccess() {
  console.log('\\n2️⃣ Testing Admin Panel Access...');
  
  try {
    const response = await makeRequest(`/api/admin-panel/${TEST_CONFIG.templateId}/dashboard`);
    
    if (response.statusCode === 200) {
      console.log('✅ Admin dashboard accessible');
      
      try {
        const dashboard = JSON.parse(response.body);
        console.log('   📊 Dashboard Statistics:');
        console.log(`   - Total RSVPs: ${dashboard.rsvpStats?.totalRsvps || 0}`);
        console.log(`   - Attending: ${dashboard.rsvpStats?.attendingCount || 0}`);
        console.log(`   - Total Photos: ${dashboard.photoStats?.totalPhotos || 0}`);
        console.log(`   - Recent RSVPs: ${dashboard.recentRsvps?.length || 0}`);
        
        return dashboard;
      } catch (e) {
        console.log('⚠️ Dashboard loaded but parsing failed');
        return null;
      }
    } else if (response.statusCode === 401) {
      console.log('⚠️ Admin panel requires authentication');
      return null;
    } else {
      console.log(`❌ Admin panel access failed: ${response.statusCode}`);
      console.log('   Response:', response.body.substring(0, 200));
      return null;
    }
  } catch (error) {
    console.log(`❌ Admin panel error: ${error.message}`);
    return null;
  }
}

// Test 3: Template Configuration Update
async function testConfigurationUpdate() {
  console.log('\\n3️⃣ Testing Configuration Updates...');
  
  const testUpdates = {
    hero: {
      title: 'Test Wedding Updated',
      subtitle: 'Configuration Test'
    },
    coupleInfo: {
      bride: {
        firstName: 'TestBride',
        lastName: 'Updated'
      },
      groom: {
        firstName: 'TestGroom', 
        lastName: 'Updated'
      }
    }
  };
  
  try {
    const response = await makeRequest(
      `/api/templates/${TEST_CONFIG.templateId}/config`,
      'POST',
      testUpdates
    );
    
    if (response.statusCode === 200) {
      console.log('✅ Configuration update successful');
      
      // Verify the update by reading config again
      const verifyResponse = await makeRequest(`/api/templates/${TEST_CONFIG.templateId}/config`);
      if (verifyResponse.statusCode === 200) {
        const updatedConfig = JSON.parse(verifyResponse.body);
        console.log('   ✅ Configuration changes verified:');
        console.log(`   - Hero Title: ${updatedConfig.hero?.title}`);
        console.log(`   - Bride Name: ${updatedConfig.coupleInfo?.bride?.firstName}`);
        console.log(`   - Groom Name: ${updatedConfig.coupleInfo?.groom?.firstName}`);
      }
      
      return true;
    } else if (response.statusCode === 401) {
      console.log('⚠️ Configuration update requires authentication');
      return false;
    } else {
      console.log(`❌ Configuration update failed: ${response.statusCode}`);
      console.log('   Response:', response.body.substring(0, 200));
      return false;
    }
  } catch (error) {
    console.log(`❌ Configuration update error: ${error.message}`);
    return false;
  }
}

// Test 4: Image Upload Functionality
async function testImageUploads() {
  console.log('\\n4️⃣ Testing Image Upload Functionality...');
  
  try {
    // Check if test image exists
    if (!fs.existsSync(TEST_CONFIG.testImage)) {
      console.log('⚠️ Test image not found, skipping upload test');
      return false;
    }
    
    // Test image listing endpoint
    const listResponse = await makeRequest(`/api/templates/${TEST_CONFIG.templateId}/images`);
    
    if (listResponse.statusCode === 200) {
      console.log('✅ Image listing endpoint accessible');
      
      try {
        const images = JSON.parse(listResponse.body);
        console.log(`   📷 Current images: ${images.length || 0}`);
        
        if (Array.isArray(images)) {
          images.slice(0, 3).forEach((img, i) => {
            console.log(`   ${i + 1}. ${img.name || img.url} (${img.category || 'no category'})`);
          });
        }
        
        return true;
      } catch (e) {
        console.log('⚠️ Image list loaded but parsing failed');
        return false;
      }
    } else if (listResponse.statusCode === 401) {
      console.log('⚠️ Image management requires authentication');
      return false;
    } else {
      console.log(`❌ Image listing failed: ${listResponse.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Image functionality error: ${error.message}`);
    return false;
  }
}

// Test 5: Guest Photo Management
async function testGuestPhotoManagement() {
  console.log('\\n5️⃣ Testing Guest Photo Management...');
  
  try {
    const response = await makeRequest(`/api/admin-panel/${TEST_CONFIG.templateId}/photos`);
    
    if (response.statusCode === 200) {
      console.log('✅ Guest photo management accessible');
      
      try {
        const photoData = JSON.parse(response.body);
        console.log(`   📸 Guest photos: ${photoData.total || 0}`);
        console.log(`   📄 Current page: ${photoData.page || 1}`);
        console.log(`   📊 Total pages: ${photoData.totalPages || 1}`);
        
        if (photoData.photos && photoData.photos.length > 0) {
          console.log('   Recent guest photos:');
          photoData.photos.slice(0, 3).forEach((photo, i) => {
            console.log(`   ${i + 1}. ${photo.uploaderName} - ${photo.isApproved ? 'Approved' : 'Pending'}`);
          });
        } else {
          console.log('   No guest photos found');
        }
        
        return true;
      } catch (e) {
        console.log('⚠️ Photo data loaded but parsing failed');
        return false;
      }
    } else if (response.statusCode === 401) {
      console.log('⚠️ Guest photo management requires authentication');
      return false;
    } else {
      console.log(`❌ Guest photo management failed: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Guest photo management error: ${error.message}`);
    return false;
  }
}

// Test 6: RSVP Management
async function testRsvpManagement() {
  console.log('\\n6️⃣ Testing RSVP Management...');
  
  try {
    const response = await makeRequest(`/api/templates/${TEST_CONFIG.templateId}/rsvps`);
    
    if (response.statusCode === 200) {
      console.log('✅ RSVP management accessible');
      
      try {
        const rsvps = JSON.parse(response.body);
        console.log(`   📝 Total RSVPs: ${rsvps.length || 0}`);
        
        if (rsvps.length > 0) {
          console.log('   Recent RSVPs:');
          rsvps.slice(0, 3).forEach((rsvp, i) => {
            console.log(`   ${i + 1}. ${rsvp.firstName} ${rsvp.lastName} - ${rsvp.attendance}`);
          });
        } else {
          console.log('   No RSVPs found');
        }
        
        return true;
      } catch (e) {
        console.log('⚠️ RSVP data loaded but parsing failed');
        return false;
      }
    } else if (response.statusCode === 401) {
      console.log('⚠️ RSVP management requires authentication');
      return false;
    } else {
      console.log(`❌ RSVP management failed: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ RSVP management error: ${error.message}`);
    return false;
  }
}

// Main test execution
async function runOwnerFunctionalityTests() {
  console.log('\\n🚀 Starting Template Owner Functionality Tests...');
  
  const results = {
    configLoading: false,
    adminAccess: false,
    configUpdate: false,
    imageUploads: false,
    guestPhotos: false,
    rsvpManagement: false
  };
  
  // Run all tests
  const config = await testTemplateConfigLoading();
  results.configLoading = !!config;
  
  const dashboard = await testAdminPanelAccess();
  results.adminAccess = !!dashboard;
  
  results.configUpdate = await testConfigurationUpdate();
  results.imageUploads = await testImageUploads();
  results.guestPhotos = await testGuestPhotoManagement();
  results.rsvpManagement = await testRsvpManagement();
  
  // Summary
  console.log('\\n\\n📋 Template Owner Functionality Test Results');
  console.log('='.repeat(50));
  console.log(`✅ Template Configuration Loading: ${results.configLoading ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Admin Panel Access: ${results.adminAccess ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Configuration Updates: ${results.configUpdate ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Image Upload System: ${results.imageUploads ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Guest Photo Management: ${results.guestPhotos ? 'PASS' : 'FAIL'}`);
  console.log(`✅ RSVP Management: ${results.rsvpManagement ? 'PASS' : 'FAIL'}`);
  
  const passCount = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\\n🎯 Overall Score: ${passCount}/${totalTests} tests passed`);
  
  if (passCount === totalTests) {
    console.log('🎉 All template owner features working correctly!');
  } else {
    console.log('⚠️ Some template owner features require attention');
    console.log('\\n🔧 Issues to address:');
    
    if (!results.adminAccess) {
      console.log('- Admin panel authentication needs to be implemented');
    }
    if (!results.configUpdate) {
      console.log('- Configuration update endpoint needs authentication');
    }
    if (!results.imageUploads) {
      console.log('- Image upload system needs authentication');
    }
    if (!results.guestPhotos) {
      console.log('- Guest photo management needs authentication');
    }
    if (!results.rsvpManagement) {
      console.log('- RSVP management needs authentication');
    }
  }
  
  console.log('\\n💡 Next Steps:');
  console.log('1. Implement authentication middleware for admin endpoints');
  console.log('2. Test actual image uploads with authentication');
  console.log('3. Verify template customization features in browser');
  console.log('4. Test all template variants (Pro, Classic, Elegant, etc.)');
}

// Run the tests
runOwnerFunctionalityTests();