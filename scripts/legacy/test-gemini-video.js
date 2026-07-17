/**
 * Test script for Gemini Video Analysis
 * 
 * This script tests whether the Gemini API can analyze videos.
 * 
 * Usage:
 *   node test-gemini-video.js <video-url-or-path>
 * 
 * For testing, you can use:
 * - A publicly accessible video URL
 * - Or upload a video to Google Cloud Storage first
 */

require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

if (!apiKey) {
  console.error('❌ GOOGLE_GEMINI_API_KEY not found in .env.local');
  process.exit(1);
}

console.log('✅ API key found');
console.log('🔑 Key starts with:', apiKey.substring(0, 10) + '...');

// List available models
async function listAvailableModels() {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    console.log('\n📋 Fetching available models...');
    // Note: The SDK might not have a direct listModels method
    // Let's try common model names
    const commonModels = [
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-pro',
      'gemini-pro-vision',
      'models/gemini-1.5-flash',
      'models/gemini-1.5-pro',
    ];
    
    console.log('💡 Trying common model names...');
    return commonModels;
  } catch (error) {
    console.error('❌ Error listing models:', error.message);
    return [];
  }
}

// Test with a simple API call first
async function testGeminiConnection() {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Try different model names (with models/ prefix)
  const modelNames = [
    'models/gemini-2.0-flash-001',
    'models/gemini-2.5-flash',
    'models/gemini-flash-latest',
    'models/gemini-2.0-flash',
  ];

  for (const modelName of modelNames) {
    try {
      console.log(`\n📝 Testing with model: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Say "Hello, Atlas!" in one sentence.');
      const response = await result.response;
      const text = response.text();
      console.log(`✅ Model ${modelName} works!`);
      console.log('📄 Response:', text);
      return { success: true, modelName };
    } catch (error) {
      console.log(`❌ Model ${modelName} failed: ${error.message.split('\n')[0]}`);
      continue;
    }
  }
  
  return { success: false };
}

// Test video analysis with a public video URL
async function testVideoAnalysis(videoUrl) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  try {
    console.log('\n🎥 Testing video analysis...');
    console.log('📹 Video URL:', videoUrl);
    
    // Note: Gemini requires videos to be uploaded to Google Cloud Storage
    // For testing with a URL, we need to use fileData with fileUri
    // This only works if the video is already in Google Cloud Storage
    
    const prompt = `Analyze this video and describe what you see in one sentence.`;
    
    // Try with fileData approach (requires video in GCS)
    const videoPart = {
      fileData: {
        fileUri: videoUrl,
        mimeType: 'video/mp4',
      },
    };

    console.log('⏳ Sending request to Gemini...');
    const result = await model.generateContent([prompt, videoPart]);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Video analysis successful!');
    console.log('📄 Analysis:', text);
    return true;
  } catch (error) {
    console.error('❌ Video analysis failed:', error.message);
    console.error('💡 Note: Video analysis requires the video to be uploaded to Google Cloud Storage first.');
    console.error('💡 The fileUri must point to a Google Cloud Storage URI (gs://...) or a publicly accessible URL.');
    return false;
  }
}

// Main test function
async function main() {
  const videoUrl = process.argv[2];
  
  console.log('🧪 Gemini Video Analysis Test\n');
  console.log('='.repeat(50));
  
  // Test 1: Basic connection
  const basicTest = await testGeminiConnection();
  if (!basicTest) {
    console.log('\n❌ Basic connection test failed. Check your API key.');
    process.exit(1);
  }
  
  // Test 2: Video analysis (if URL provided)
  if (videoUrl) {
    await testVideoAnalysis(videoUrl);
  } else {
    console.log('\n💡 To test video analysis, provide a video URL:');
    console.log('   node test-gemini-video.js <video-url>');
    console.log('\n📝 Note: For Gemini video analysis, the video must be:');
    console.log('   1. Uploaded to Google Cloud Storage (gs://bucket/video.mp4)');
    console.log('   2. Or accessible via a public URL');
    console.log('   3. Or uploaded using Gemini\'s file upload API first');
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Test complete!');
}

main().catch(console.error);

