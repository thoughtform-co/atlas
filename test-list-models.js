/**
 * List available Gemini models via REST API
 */

require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

async function listModels() {
  try {
    console.log('📋 Fetching available models from Generative Language API...\n');
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error:', response.status, response.statusText);
      console.error('Response:', errorText);
      return;
    }
    
    const data = await response.json();
    
    if (data.models) {
      console.log('✅ Available models:');
      console.log('='.repeat(50));
      data.models.forEach(model => {
        console.log(`\n📦 ${model.name}`);
        console.log(`   Display Name: ${model.displayName || 'N/A'}`);
        console.log(`   Description: ${model.description || 'N/A'}`);
        if (model.supportedGenerationMethods) {
          console.log(`   Supported Methods: ${model.supportedGenerationMethods.join(', ')}`);
        }
      });
    } else {
      console.log('📄 Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listModels();

