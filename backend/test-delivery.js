// Rely on global fetch in Node.js 18+

const email = process.argv[2] || 'team.krishnabodha@gmail.com';
const chapter = process.argv[3] || '2';
const verse = process.argv[4] || '47';

async function runTest() {
  console.log(`🚀 Triggering test delivery to ${email} for Chapter ${chapter}, Verse ${verse}...`);
  try {
    const response = await fetch('http://localhost:5005/api/test-delivery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, chapter, verse })
    });
    
    const data = await response.json();
    console.log('\n📦 Response from Server:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Failed to connect to server. Make sure your backend server is running on port 5005!', error.message);
  }
}

runTest();
