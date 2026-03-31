const axios = require('axios');

const testApi = async () => {
  console.log('--- SkillVerse API Verification ---');
  const baseUrl = 'http://localhost:5000/api';
  
  const endpoints = [
    '/health',
    '/test-direct',
    '/notifications/test-direct',
    '/notifications/unread-count',
    '/user/discovery/Learn',
    '/posts'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${baseUrl}${endpoint}...`);
      const res = await axios.get(`${baseUrl}${endpoint}`);
      console.log(`✅ Success (${res.status}): ${JSON.stringify(res.data).substring(0, 50)}...`);
    } catch (err) {
      if (err.response) {
        console.log(`❌ Failed (${err.response.status}): ${endpoint}`);
      } else {
        console.log(`❌ Error: ${err.message}`);
      }
    }
  }
  console.log('--- Verification Complete ---');
};

testApi();
