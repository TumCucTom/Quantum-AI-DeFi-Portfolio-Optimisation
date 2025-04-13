/**
 * Test file for the mock Wormhole SDK service
 */

const http = require('http');

// Test GET /venues endpoint
function testVenues() {
  const options = {
    hostname: 'localhost',
    port: 3004,
    path: '/venues',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`GET /venues status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Venues data:');
      console.log(JSON.parse(data));
      
      // Continue with swap test after venues test completes
      testSwap();
    });
  });
  
  req.on('error', (e) => {
    console.error(`Problem with venues request: ${e.message}`);
  });
  
  req.end();
}

// Test POST /estimate-swap endpoint
function testSwap() {
  const data = JSON.stringify({
    venue: 'Uniswap V3',
    amount: 5,
    sourceToken: 'ETH',
    targetToken: 'USDC'
  });
  
  const options = {
    hostname: 'localhost',
    port: 3004,
    path: '/estimate-swap',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };
  
  const req = http.request(options, (res) => {
    console.log(`POST /estimate-swap status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Swap estimation data:');
      console.log(JSON.parse(data));
      
      // Test health check after swap test completes
      testHealth();
    });
  });
  
  req.on('error', (e) => {
    console.error(`Problem with swap request: ${e.message}`);
  });
  
  req.write(data);
  req.end();
}

// Test GET /health endpoint
function testHealth() {
  const options = {
    hostname: 'localhost',
    port: 3004,
    path: '/health',
    method: 'GET'
  };
  
  const req = http.request(options, (res) => {
    console.log(`GET /health status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Health check data:');
      console.log(JSON.parse(data));
      console.log('\nAll tests completed successfully!');
    });
  });
  
  req.on('error', (e) => {
    console.error(`Problem with health check request: ${e.message}`);
  });
  
  req.end();
}

console.log('Starting mock server tests...');
testVenues();