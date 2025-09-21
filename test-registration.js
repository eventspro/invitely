// Test script for user registration
import http from 'http';

const testData = {
  email: "john.doe@example.com",
  password: "testpassword123",
  firstName: "John",
  lastName: "Doe",
  templatePlan: "ultimate",
  weddingDate: "2025-06-15",
  weddingVenue: "Grand Ballroom",
  orderData: {
    amount: 37000,
    currency: "AMD",
    billingEmail: "john.doe@example.com",
    billingName: "John Doe"
  }
};

const postData = JSON.stringify(testData);

const options = {
  hostname: 'localhost',
  port: 5001,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('RESPONSE:');
    try {
      const response = JSON.parse(data);
      console.log(JSON.stringify(response, null, 2));
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(postData);
req.end();