/**
 * SSL Image Endpoint Test
 * Test script to verify the SSL fixes for dynamic image serving
 */

import https from 'https';
import http from 'http';

const DOMAIN = '4ever.am';
const TEST_ENDPOINTS = [
  '/api/images/serve/default-wedding-couple.jpg',
  '/api/images/serve/nonexistent-image.jpg', // Should return 404 with proper headers
];

async function testEndpoint(endpoint) {
  console.log(`\n🧪 Testing: https://${DOMAIN}${endpoint}`);
  
  return new Promise((resolve) => {
    const options = {
      hostname: DOMAIN,
      port: 443,
      path: endpoint,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Accept': 'image/*,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1', // Simulate incognito mode
        'Connection': 'keep-alive'
      }
    };

    const startTime = Date.now();
    
    const req = https.request(options, (res) => {
      const duration = Date.now() - startTime;
      
      console.log(`📊 Response Status: ${res.statusCode}`);
      console.log(`⏱️  Response Time: ${duration}ms`);
      console.log(`📋 Headers:`);
      
      // Check SSL-critical headers
      const sslHeaders = [
        'content-type',
        'content-length', 
        'cache-control',
        'strict-transport-security',
        'x-content-type-options',
        'access-control-allow-origin'
      ];
      
      sslHeaders.forEach(header => {
        const value = res.headers[header];
        const status = value ? '✅' : '❌';
        console.log(`  ${status} ${header}: ${value || 'MISSING'}`);
      });
      
      // Consume response data
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📦 Response Size: ${data.length} bytes`);
        
        if (res.statusCode === 200) {
          console.log('✅ SUCCESS: Image served without SSL errors');
        } else if (res.statusCode === 404) {
          console.log('✅ SUCCESS: Proper 404 handling with SSL-safe headers');
        } else {
          console.log(`⚠️  UNEXPECTED: Status ${res.statusCode}`);
        }
        
        resolve({
          status: res.statusCode,
          duration,
          headers: res.headers,
          size: data.length
        });
      });
    });

    req.on('error', (error) => {
      const duration = Date.now() - startTime;
      console.log(`❌ SSL ERROR: ${error.message} (${duration}ms)`);
      console.log(`🔍 Error Code: ${error.code}`);
      
      resolve({
        error: error.message,
        code: error.code,
        duration
      });
    });

    req.on('timeout', () => {
      console.log('⏰ REQUEST TIMEOUT');
      req.destroy();
      resolve({ error: 'timeout' });
    });

    req.setTimeout(10000); // 10 second timeout
    req.end();
  });
}

async function testHTTPSRedirect() {
  console.log(`\n🔒 Testing HTTP -> HTTPS Redirect`);
  
  return new Promise((resolve) => {
    const options = {
      hostname: DOMAIN,
      port: 80,
      path: '/api/images/serve/test-image.jpg',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      console.log(`📊 HTTP Status: ${res.statusCode}`);
      console.log(`📋 Location Header: ${res.headers.location || 'MISSING'}`);
      
      if (res.statusCode === 301 || res.statusCode === 302) {
        const location = res.headers.location;
        if (location && location.startsWith('https://')) {
          console.log('✅ SUCCESS: Proper HTTPS redirect');
        } else {
          console.log('❌ FAILED: Invalid redirect location');
        }
      } else {
        console.log('⚠️  No redirect detected');
      }
      
      resolve({ status: res.statusCode, location: res.headers.location });
    });

    req.on('error', (error) => {
      console.log(`❌ HTTP Redirect Test Error: ${error.message}`);
      resolve({ error: error.message });
    });

    req.setTimeout(5000);
    req.end();
  });
}

async function runAllTests() {
  console.log('🚀 Starting SSL Image Endpoint Tests');
  console.log('=====================================');
  
  // Test HTTPS redirect
  await testHTTPSRedirect();
  
  // Test each endpoint
  for (const endpoint of TEST_ENDPOINTS) {
    await testEndpoint(endpoint);
  }
  
  console.log('\n🎯 SSL Test Summary');
  console.log('==================');
  console.log('✅ If all tests show SUCCESS, SSL errors should be resolved');
  console.log('❌ If errors persist, check server logs for additional details');
}

// Run tests
runAllTests().catch(console.error);