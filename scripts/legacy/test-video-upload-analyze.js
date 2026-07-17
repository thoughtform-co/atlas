/**
 * Test video upload and analysis with Gemini
 * 
 * This script:
 * 1. Uploads a video file to Gemini
 * 2. Analyzes the uploaded video
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

if (!apiKey) {
  console.error('❌ GOOGLE_GEMINI_API_KEY not found in .env.local');
  process.exit(1);
}

const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'models/gemini-2.0-flash-001' });

async function uploadFile(filePath) {
  try {
    console.log(`📤 Uploading file: ${filePath}`);
    
    // Read the file
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    const mimeType = getMimeType(filePath);
    const fileSize = fileBuffer.length;
    
    console.log(`📊 File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
    
    // Try using the upload endpoint directly with multipart
    // Gemini Files API uses a two-step process or direct upload
    
    // Method 1: Try direct upload with multipart
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('metadata', JSON.stringify({
      file: {
        displayName: fileName,
        mimeType: mimeType,
      },
    }), {
      contentType: 'application/json',
    });
    formData.append('file', fileBuffer, {
      filename: fileName,
      contentType: mimeType,
    });
    
    console.log('📤 Uploading file data...');
    const uploadResponse = await fetch(
      `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`,
      {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders(),
      }
    );
    
    if (!uploadResponse.ok) {
      // Try alternative: Step 1 - Create file metadata
      console.log('📤 Trying alternative upload method...');
      const createResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/files?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            file: {
              displayName: fileName,
              mimeType: mimeType,
            },
          }),
        }
      );
      
      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error('❌ Create file response:', errorText);
        throw new Error(`Failed to create file: ${createResponse.status} - ${errorText}`);
      }
      
      const createData = await createResponse.json();
      console.log('📋 Create response:', JSON.stringify(createData, null, 2));
      
      const uploadUri = createData.uploadUri || createData.upload_url || createData.file?.uri;
      
      if (!uploadUri) {
        console.error('❌ Response data:', JSON.stringify(createData, null, 2));
        throw new Error('No upload URI returned. Response structure may be different.');
      }
      
      // Use the upload URI from create response
      console.log(`📤 Uploading to: ${uploadUri.substring(0, 50)}...`);
      
      // Step 2: Upload file data
      const uploadDataResponse = await fetch(uploadUri, {
        method: 'PUT',
        headers: {
          'Content-Type': mimeType,
          'Content-Length': fileSize.toString(),
        },
        body: fileBuffer,
      });
      
      if (!uploadDataResponse.ok) {
        const errorText = await uploadDataResponse.text();
        throw new Error(`Failed to upload file data: ${uploadDataResponse.status} - ${errorText}`);
      }
      
      const uploadData = await uploadDataResponse.json();
      const fileUri = uploadData.file?.uri || createData.file?.uri;
      
      if (!fileUri) {
        throw new Error('No file URI returned after upload');
      }
      
      console.log('✅ File uploaded successfully!');
      console.log(`📁 File URI: ${fileUri}`);
      console.log(`📋 File Name: ${fileName}`);
      
      // Wait for processing
      console.log('⏳ Waiting for file processing...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      return {
        uri: fileUri,
        mimeType: mimeType,
        displayName: fileName,
      };
    }
    
    const uploadData = await uploadResponse.json();
    console.log('📋 Upload response:', JSON.stringify(uploadData, null, 2));
    
    const fileUri = uploadData.file?.uri;
    
    if (!fileUri) {
      throw new Error('No file URI in upload response');
    }
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('❌ Create file response:', errorText);
      throw new Error(`Failed to create file: ${createResponse.status} - ${errorText}`);
    }
    
    const createData = await createResponse.json();
    console.log('📋 Create response:', JSON.stringify(createData, null, 2));
    
    const uploadUri = createData.uploadUri || createData.upload_url;
    
    if (!uploadUri) {
      console.error('❌ Response data:', JSON.stringify(createData, null, 2));
      throw new Error('No upload URI returned. Response structure may be different.');
    }
    
    console.log(`📤 Uploading to: ${uploadUri.substring(0, 50)}...`);
    
    // Step 2: Upload file data
    const uploadResponse = await fetch(uploadUri, {
      method: 'PUT',
      headers: {
        'Content-Type': mimeType,
        'Content-Length': fileSize.toString(),
      },
      body: fileBuffer,
    });
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Failed to upload file data: ${uploadResponse.status} - ${errorText}`);
    }
    
    // Step 3: Get file info
    const fileUri = createData.file?.uri;
    if (!fileUri) {
      throw new Error('No file URI returned');
    }
    
    // Wait a moment for processing
    console.log('⏳ Waiting for file processing...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get file status
    const fileInfoResponse = await fetch(
      `${fileUri}?key=${apiKey}`
    );
    
    if (fileInfoResponse.ok) {
      const fileInfo = await fileInfoResponse.json();
      console.log('✅ File uploaded successfully!');
      console.log(`📁 File URI: ${fileInfo.uri || fileUri}`);
      console.log(`📋 File Name: ${fileInfo.displayName || fileName}`);
      console.log(`📊 File State: ${fileInfo.state || 'UNKNOWN'}`);
      
      return {
        uri: fileInfo.uri || fileUri,
        mimeType: mimeType,
        displayName: fileInfo.displayName || fileName,
      };
    } else {
      // Use the URI from create response
      console.log('✅ File uploaded successfully!');
      console.log(`📁 File URI: ${fileUri}`);
      console.log(`📋 File Name: ${fileName}`);
      
      return {
        uri: fileUri,
        mimeType: mimeType,
        displayName: fileName,
      };
    }
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    throw error;
  }
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.mkv': 'video/x-matroska',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

async function analyzeVideo(fileUri, mimeType) {
  try {
    console.log('\n🎥 Analyzing video...');
    console.log('⏳ This may take a while depending on video length...\n');
    
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
      fileData: {
        fileUri: fileUri,
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
    throw error;
  }
}

async function main() {
  const videoPath = process.argv[2];
  
  if (!videoPath) {
    console.log('📹 Gemini Video Upload & Analysis Test\n');
    console.log('Usage: node test-video-upload-analyze.js <video-file-path>');
    console.log('\nExample:');
    console.log('  node test-video-upload-analyze.js ./test-video.mp4');
    console.log('\nSupported formats: mp4, webm, mov, avi, mkv');
    process.exit(1);
  }

  if (!fs.existsSync(videoPath)) {
    console.error(`❌ File not found: ${videoPath}`);
    process.exit(1);
  }

  try {
    console.log('🧪 Gemini Video Upload & Analysis Test\n');
    console.log('='.repeat(50));
    
    // Step 1: Upload the video
    const file = await uploadFile(videoPath);
    
    // Step 2: Analyze the video
    await analyzeVideo(file.uri, file.mimeType);
    
    console.log('\n✅ Test complete!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

main();

