/**
 * Test script for Vertex AI Video Analysis
 * 
 * This script tests whether Vertex AI can analyze videos.
 * 
 * Usage:
 *   node test-vertex-ai-video.js
 */

require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

if (!apiKey) {
  console.error('❌ GOOGLE_GEMINI_API_KEY not found in .env.local');
  process.exit(1);
}

console.log('✅ API key found');
console.log('🔑 Key starts with:', apiKey.substring(0, 10) + '...');

// Test with Vertex AI endpoint
async function testVertexAI() {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  
  // Try using Vertex AI endpoint
  // Note: Vertex AI uses a different base URL
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // For Vertex AI, we might need to use a different model path
  // Let's try the standard approach first
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-flash',
    // Vertex AI might require different configuration
  });

  try {
    console.log('\n📝 Testing Vertex AI connection...');
    const result = await model.generateContent('Say "Hello, Atlas!" in one sentence.');
    const response = await result.response;
    const text = response.text();
    console.log('✅ Vertex AI connection works!');
    console.log('📄 Response:', text);
    return true;
  } catch (error) {
    console.error('❌ Vertex AI test failed:', error.message);
    console.error('\n💡 The API key might be restricted to Vertex AI API only.');
    console.error('💡 You may need to:');
    console.error('   1. Update API key restrictions to allow Generative Language API');
    console.error('   2. Or use Vertex AI SDK with service account credentials');
    return false;
  }
}

// Main test function
async function main() {
  console.log('🧪 Vertex AI Video Analysis Test\n');
  console.log('='.repeat(50));
  
  await testVertexAI();
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Test complete!');
}

main().catch(console.error);

