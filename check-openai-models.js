const OpenAI = require('openai');

if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function checkAvailableModels() {
  try {
    console.log('🔍 Checking available OpenAI models...\n');
    
    const models = await openai.models.list();
    
    // Filter and categorize models
    const chatModels = [];
    const imageModels = [];
    const audioModels = [];
    const embeddingModels = [];
    const otherModels = [];

    models.data.forEach(model => {
      const id = model.id;
      if (id.includes('gpt') || id.includes('chat')) {
        chatModels.push(id);
      } else if (id.includes('dall-e') || id.includes('image')) {
        imageModels.push(id);
      } else if (id.includes('whisper') || id.includes('tts')) {
        audioModels.push(id);
      } else if (id.includes('embedding') || id.includes('ada')) {
        embeddingModels.push(id);
      } else {
        otherModels.push(id);
      }
    });

    console.log('🤖 CHAT/TEXT GENERATION MODELS:');
    chatModels.sort().forEach(model => console.log(`  ✅ ${model}`));
    
    console.log('\n🎨 IMAGE GENERATION MODELS:');
    imageModels.sort().forEach(model => console.log(`  ✅ ${model}`));
    
    console.log('\n🎵 AUDIO MODELS:');
    audioModels.sort().forEach(model => console.log(`  ✅ ${model}`));
    
    console.log('\n📊 EMBEDDING MODELS:');
    embeddingModels.sort().forEach(model => console.log(`  ✅ ${model}`));
    
    if (otherModels.length > 0) {
      console.log('\n🔧 OTHER MODELS:');
      otherModels.sort().forEach(model => console.log(`  ✅ ${model}`));
    }
    
    console.log(`\n📈 TOTAL MODELS AVAILABLE: ${models.data.length}`);
    
    // Test a simple chat completion to verify the API works
    console.log('\n🧪 Testing API with a simple request...');
    const testCompletion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: 'Say "API is working!" in one sentence.' }],
      model: 'gpt-4o-mini',
      max_tokens: 20,
    });
    
    console.log('✅ API Test Result:', testCompletion.choices[0]?.message?.content);

    // Additional information about models
    console.log('\n📋 RECOMMENDED MODELS FOR YOUR ASSESSMENT GENERATOR:');
    console.log('  🥇 gpt-4o - Best quality, latest model (if available)');
    console.log('  🥈 gpt-4-turbo - High quality, faster than GPT-4');
    console.log('  🥉 gpt-3.5-turbo - Good balance of speed and cost');
    console.log('  💰 gpt-3.5-turbo-instruct - Most cost-effective');

  } catch (error) {
    console.error('❌ Error checking models:', error.message);
    
    if (error.status === 401) {
      console.log('🔑 Issue: Invalid API key or authentication failed');
      console.log('   Check if your API key is correct and has not expired');
    } else if (error.status === 403) {
      console.log('🚫 Issue: Access forbidden - check your API key permissions');
      console.log('   Your API key may not have access to the models endpoint');
    } else if (error.status === 429) {
      console.log('⏳ Issue: Rate limit exceeded - try again later');
    } else if (error.code === 'ENOTFOUND') {
      console.log('🌐 Issue: Network connection problem');
    } else {
      console.log('🔧 Full error details:', error);
    }
  }
}

checkAvailableModels();