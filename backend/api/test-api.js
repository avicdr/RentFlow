const http = require('http');

async function testApi() {
  console.log('=========================================');
  console.log('🚀 Running API Tests...');
  console.log('=========================================');
  
  const request = (method, path, body = null, token = null) => {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 3001,
        path: path,
        method: method,
        headers: {
          'Content-Type': 'application/json',
        }
      };
      
      if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
      }
      
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, data: data });
          }
        });
      });
      
      req.on('error', reject);
      
      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  };

  try {
    // 1. Health
    console.log('\n[1] Testing Health Endpoint...');
    let res = await request('GET', '/api/v1/health');
    console.log(`Status: ${res.status}`);
    console.log('Response:', res.data);

    // 2. Register
    console.log('\n[2] Testing Registration...');
    const regData = {
      firstName: 'Test',
      lastName: 'Landlord',
      email: `test.landlord.${Date.now()}@rentflow.test`,
      password: 'Test@123456',
      phone: `98765${Math.floor(10000 + Math.random() * 90000)}`,
      role: 'LANDLORD'
    };
    res = await request('POST', '/api/v1/auth/register', regData);
    console.log(`Status: ${res.status}`);
    console.log('Response:', res.status === 201 ? 'User created successfully' : res.data);

    // 3. Login
    console.log('\n[3] Testing Login...');
    res = await request('POST', '/api/v1/auth/login', {
      email: regData.email,
      password: regData.password
    });
    console.log(`Status: ${res.status}`);
    
    let token = null;
    if (res.data?.data?.accessToken) {
      token = res.data.data.accessToken;
      console.log('✅ Login successful, received access token');
    } else {
      console.log('❌ Login failed:', res.data);
      return;
    }

    // 4. Get ME
    console.log('\n[4] Testing GET /users/me...');
    res = await request('GET', '/api/v1/users/me', null, token);
    console.log(`Status: ${res.status}`);
    console.log('Response Email:', res.data?.data?.email);

    // 5. Create Property
    console.log('\n[5] Testing Create Property...');
    const propData = {
      name: 'Test Property ' + Date.now(),
      type: 'PG',
      address: {
        line1: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456'
      }
    };
    res = await request('POST', '/api/v1/properties', propData, token);
    console.log(`Status: ${res.status}`);
    console.log('Response:', res.status === 201 ? 'Property created' : res.data);

    // 6. Get Properties
    console.log('\n[6] Testing GET Properties...');
    res = await request('GET', '/api/v1/properties', null, token);
    console.log(`Status: ${res.status}`);
    console.log('Properties Count:', res.data?.data?.length);

    // 7. Search
    console.log('\n[7] Testing Search...');
    res = await request('GET', '/api/v1/search?q=Test', null, token);
    console.log(`Status: ${res.status}`);
    console.log('Search Results (Properties):', res.data?.data?.properties?.length);

    console.log('\n=========================================');
    console.log('✅ All tests completed!');
    console.log('=========================================');
  } catch (err) {
    console.error('❌ Test execution failed:', err);
  }
}

testApi();
