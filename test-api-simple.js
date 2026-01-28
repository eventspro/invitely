const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('Testing https://4ever.am/api/templates ...');
    const response = await fetch('https://4ever.am/api/templates');
    console.log(`Status: ${response.status}`);
    const text = await response.text();
    console.log('Response:', text);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();
