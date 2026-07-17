/**
 * Test video analysis with Gemini using base64 encoding
 * 
 * This approach encodes the video directly in the request
 * Works for smaller videos (under ~20MB)
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

if (!apiKey) {
  console.error('❌ GOOGLE_GEMINI_API_KEY not found in .env.local');
  process.exit(1);
}

const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'models/gemini-2.0-flash-001' });

function getMimeType(filePath) {
  const ext = require('path').extname(filePath).toLowerCase();
  const mimeTypes = {
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.mkv': 'video/x-matroska',
  };
  return mimeTypes[ext] || 'video/mp4';
}

async function analyzeVideoDirect(filePath) {
  try {
    console.log(`📹 Analyzing video: ${filePath}\n`);
    
    // Read the file
    const fileBuffer = fs.readFileSync(filePath);
    const fileSize = fileBuffer.length;
    const mimeType = getMimeType(filePath);
    
    console.log(`📊 File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
    
    if (fileSize > 20 * 1024 * 1024) {
      console.warn('⚠️  File is large. Consider using file upload API instead.');
    }
    
    // Convert to base64
    console.log('🔄 Encoding video to base64...');
    const base64Data = fileBuffer.toString('base64');
    
    console.log('⏳ Sending to Gemini for analysis...');
    console.log('   (This may take a while for video analysis)\n');
    
    const prompt = `You are analyzing visual media to catalog a Latent Space Denizen—an entity that inhabits the semantic manifold between thought and reality.

Analyze the provided video and extract the following entity characteristics. Be creative and mystical in your interpretations, treating the visual as a glimpse into an impossible realm.

Return a JSON object with these fields (use null for fields you cannot determine):

{
  "name": "Suggested entity name (evocative, otherworldly)",
  "subtitle": "Optional epithet or title",
  "type": "Guardian | Wanderer | Architect | Void-Born | Hybrid",
  "allegiance": "Liminal Covenant | Nomenclate | Unaligned | Unknown",
  "threatLevel": "Benign | Cautious | Volatile | Existential",
  "domain": "The conceptual territory this entity occupies",
  "description": "2-3 sentence poetic description of what this entity is/does",
  "lore": "Historical context, theories about origin, significance",
  "features": ["Array of 3-5 characteristic abilities or behaviors"],
  "phaseState": "Solid | Liminal | Spectral | Fluctuating | Crystallized",
  "hallucinationIndex": 0.0 to 1.0 (how real vs imagined),
  "manifoldCurvature": "Stable | Moderate | Severe | Critical",
  "coordinates": {
    "geometry": -1.0 to 1.0 (order vs chaos),
    "alterity": -1.0 to 1.0 (familiar vs alien),
    "dynamics": -1.0 to 1.0 (static vs volatile)
  },
  "glyphs": "4 Unicode symbols representing essence (e.g. ◆●∇⊗)",
  "visualNotes": "Key visual elements that informed your analysis"
}

IMPORTANT: Return ONLY the JSON object, no additional text.`;

    const videoPart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType,
      },
    };

    const result = await model.generateContent([prompt, videoPart]);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Video analysis complete!\n');
    console.log('📄 Analysis Result:');
    console.log('='.repeat(50));
    
    // Try to parse and format JSON
    try {
      let jsonStr = text.trim();
      // Remove markdown code blocks if present
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7);
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3);
      }
      jsonStr = jsonStr.trim();
      
      const parsed = JSON.parse(jsonStr);
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      // If not JSON, just print the raw text
      console.log(text);
    }
    
    console.log('='.repeat(50));
    
    return text;
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    if (error.stack) {
      console.error('\nStack:', error.stack.split('\n').slice(0, 5).join('\n'));
    }
    throw error;
  }
}

async function main() {
  const videoPath = process.argv[2];
  
  if (!videoPath) {
    console.log('📹 Gemini Video Direct Analysis Test\n');
    console.log('Usage: node test-video-direct.js <video-file-path>');
    console.log('\nExample:');
    console.log('  node test-video-direct.js ./test-video.mp4');
    process.exit(1);
  }

  if (!fs.existsSync(videoPath)) {
    console.error(`❌ File not found: ${videoPath}`);
    process.exit(1);
  }

  try {
    console.log('🧪 Gemini Video Direct Analysis Test\n');
    console.log('='.repeat(50));
    
    await analyzeVideoDirect(videoPath);
    
    console.log('\n✅ Test complete!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

main();

