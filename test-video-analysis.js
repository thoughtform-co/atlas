/**
 * Test video analysis with Gemini
 * 
 * For video analysis, we need to either:
 * 1. Upload video to Google Cloud Storage (gs://bucket/video.mp4)
 * 2. Upload using Gemini's file upload API
 * 3. Use a publicly accessible video URL
 */

require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testVideoAnalysis() {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'models/gemini-2.0-flash-001' });

  console.log('🎥 Testing Video Analysis\n');
  console.log('='.repeat(50));
  
  // Option 1: Test with a public video URL (if Gemini supports it)
  // Note: Gemini typically requires videos to be uploaded first
  const testVideoUrl = process.argv[2];
  
  if (!testVideoUrl) {
    console.log('💡 Usage: node test-video-analysis.js <video-url-or-gcs-path>');
    console.log('\n📝 For video analysis, you need:');
    console.log('   1. A video uploaded to Google Cloud Storage (gs://bucket/video.mp4)');
    console.log('   2. Or upload a video file using Gemini\'s file upload API first');
    console.log('   3. Or use a publicly accessible video URL');
    console.log('\n📹 Example:');
    console.log('   node test-video-analysis.js gs://your-bucket/video.mp4');
    return;
  }

  try {
    console.log(`📹 Analyzing video: ${testVideoUrl}`);
    console.log('⏳ This may take a while...\n');
    
    // Check if it's a GCS path or regular URL
    const isGCS = testVideoUrl.startsWith('gs://');
    const mimeType = testVideoUrl.match(/\.(mp4|webm|mov|avi)$/i) 
      ? `video/${testVideoUrl.match(/\.(mp4|webm|mov|avi)$/i)[1].toLowerCase().replace('mov', 'quicktime')}`
      : 'video/mp4';

    const prompt = `Analyze this video and describe what you see. Focus on:
- Visual elements and composition
- Movement and dynamics
- Mood and atmosphere
- Any notable features or characteristics

Provide a brief but detailed analysis.`;

    let videoPart;
    
    if (isGCS) {
      // Google Cloud Storage path
      videoPart = {
        fileData: {
          fileUri: testVideoUrl,
          mimeType: mimeType,
        },
      };
    } else {
      // Try with regular URL (may not work, depends on Gemini API)
      videoPart = {
        fileData: {
          fileUri: testVideoUrl,
          mimeType: mimeType,
        },
      };
    }

    const result = await model.generateContent([prompt, videoPart]);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Video analysis successful!\n');
    console.log('📄 Analysis:');
    console.log('-'.repeat(50));
    console.log(text);
    console.log('-'.repeat(50));
    
  } catch (error) {
    console.error('❌ Video analysis failed:', error.message);
    console.error('\n💡 Common issues:');
    console.error('   - Video must be uploaded to Google Cloud Storage (gs://...)');
    console.error('   - Or use Gemini\'s file upload API to upload first');
    console.error('   - Public URLs may not work directly');
    console.error('\n📚 See: https://ai.google.dev/gemini-api/docs/upload');
  }
}

testVideoAnalysis();

