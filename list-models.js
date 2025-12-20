const https = require('https');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const match = envContent.match(/GEMINI_API_KEY=(.*)/);
const apiKey = match ? match[1].trim() : null;

if (!apiKey) {
    console.error("No API Key found");
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.error) {
                console.error("API Error:", json.error);
            } else if (json.models) {
                console.log("Available Models:");
                json.models.forEach(m => console.log(`- ${m.name}`));
            } else {
                console.log("No models returned or unexpected format:", json);
            }
        } catch (e) {
            console.error("Parse Error:", e);
        }
    });
}).on('error', (e) => {
    console.error("Request Error:", e);
});
