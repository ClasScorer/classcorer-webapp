// Test script to verify the connection between the frontend and Django backend
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

async function testConnection() {
  console.log(`Testing connection to Django API at: ${API_URL}`);
  
  try {
    // Test the API connection
    const response = await fetch(`${API_URL}/courses/`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Connection successful!');
      console.log(`Received ${data.length} courses from the API`);
    } else {
      console.error('❌ Connection failed with status:', response.status);
      const text = await response.text();
      console.error('Response:', text);
    }
  } catch (error) {
    console.error('❌ Connection error:', error.message);
  }
}

// Test authentication
async function testAuthentication() {
  console.log(`\nTesting authentication with Django API`);
  
  try {
    // Try to login with the admin credentials
    const loginResponse = await fetch(`${API_URL}/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin',
      }),
    });
    
    if (loginResponse.ok) {
      const data = await loginResponse.json();
      console.log('✅ Authentication successful!');
      console.log('Token:', data.token);
      
      // Test authenticated request
      const userResponse = await fetch(`${API_URL}/user/`, {
        headers: {
          'Authorization': `Token ${data.token}`,
        },
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        console.log('✅ Authenticated request successful!');
        console.log('User data:', userData);
      } else {
        console.error('❌ Authenticated request failed with status:', userResponse.status);
      }
    } else {
      console.error('❌ Authentication failed with status:', loginResponse.status);
      const text = await loginResponse.text();
      console.error('Response:', text);
    }
  } catch (error) {
    console.error('❌ Authentication error:', error.message);
  }
}

// Run the tests
async function runTests() {
  await testConnection();
  await testAuthentication();
}

runTests(); 