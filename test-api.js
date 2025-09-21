// Quick test script to verify the API endpoint
import http from 'http';

const options = {
  hostname: 'localhost',
  port: 5001,
  path: '/api/images?templateId=5469be42-091c-4619-bcb9-2fd753e030da',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`statusCode: ${res.statusCode}`);
  console.log(`headers:`, res.headers);

  res.on('data', (d) => {
    process.stdout.write(d);
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.end();