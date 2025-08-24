// Simple test script to check backend connectivity
console.log('Testing backend connectivity...');

// Test basic backend connectivity
fetch('http://localhost:5000/api/auth/me', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('Backend connectivity test:', response.status);
  if (response.status === 401) {
    console.log('✅ Backend is running (401 Unauthorized - expected without token)');
  } else if (response.status === 200) {
    console.log('✅ Backend is running and authenticated');
  } else {
    console.log('❌ Backend responded with unexpected status:', response.status);
  }
  return response.json();
})
.then(data => {
  console.log('Response data:', data);
})
.catch(error => {
  console.error('❌ Backend connectivity test failed:', error.message);
  console.log('Make sure the backend server is running on http://localhost:5000');
});
