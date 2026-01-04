
const https = require('https');
const fs = require('fs');
const path = require('path');

// Read .env.local to get the API key
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const match = envContent.match(/GEMINI_API_KEY=(.+)/);

if (!match) {
    console.error("Could not find GEMINI_API_KEY in .env.local");
    process.exit(1);
}

const apiKey = match[1].trim();

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.error) {
                console.error("API Error:", json.error.message);
            } else if (json.models) {
                console.log("Available Models:");
                json.models.forEach(model => {
                    if (model.name.includes('flash')) {
                        console.log(`- ${model.name} (Supported methods: ${model.supportedGenerationMethods})`);
                    }
                });
            } else {
                console.log("No models found or unexpected format.");
                console.log(JSON.stringify(json, null, 2));
            }
        } catch (e) {
            console.error("Parse error:", e.message);
            console.log("Raw output:", data);
        }
    });

}).on('error', (e) => {
    console.error("Request error:", e.message);
});
