require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const jsforce = require('jsforce');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Load the private key from the local filesystem
let privateKey;
if (process.env.PRIVATE_KEY) {
    // 1. Remove accidental quotes and evaluate literal \n
    privateKey = process.env.PRIVATE_KEY.replace(/^"|"$/g, '').replace(/\\n/g, '\n');
    
    // 2. If Render stripped newlines into spaces, reconstruct the PEM format
    if (!privateKey.includes('\n')) {
        privateKey = privateKey
          .replace(/\s+/g, '\n')
          .replace(/-----BEGIN\nRSA\nPRIVATE\nKEY-----/, '-----BEGIN RSA PRIVATE KEY-----')
          .replace(/-----END\nRSA\nPRIVATE\nKEY-----/, '-----END RSA PRIVATE KEY-----');
    }
} else {
    privateKey = fs.readFileSync('./server.key', 'utf8');
}

// 2. Authentication Helper Function
async function getSalesforceConnection() {
    // Construct the JWT Payload
    const claim = {
        iss: process.env.SF_CONSUMER_KEY,       // Your Client ID
        sub: process.env.SF_USERNAME,           // The Integration User Username
        aud: process.env.SF_LOGIN_URL,          // login.salesforce.com or test.salesforce.com
        exp: Math.floor(Date.now() / 1000) + 180 // Token expires in 3 minutes
    };

    // Sign the token using the RS256 algorithm
    const token = jwt.sign(claim, privateKey, { algorithm: 'RS256' });

    // Format the POST request body
    const params = new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: token
    });

    try {
        // Exchange the signed JWT for a Salesforce Access Token
        const tokenResponse = await axios.post(`${process.env.SF_LOGIN_URL}/services/oauth2/token`, params);
        
        // Initialize JSforce with the new token
        const conn = new jsforce.Connection({
            instanceUrl: tokenResponse.data.instance_url,
            accessToken: tokenResponse.data.access_token
        });

        return conn;
    } catch (error) {
        console.error('Authentication Error:', error.response ? error.response.data : error.message);
        throw new Error('Failed to authenticate with Salesforce');
    }
}

// 3. API Endpoint to Fetch Cases
app.get('/api/cases', async (req, res) => {
    try {
        const conn = await getSalesforceConnection();
        
        // Execute a SOQL query using JSforce
        const result = await conn.query("SELECT Id, CaseNumber, Subject, Status, CreatedDate FROM Case ORDER BY CreatedDate DESC LIMIT 10");
        
        // Send the clean data back to the React frontend
        res.json(result.records);
   // Replace lines 62-64 in server.js with this:
    } catch (error) {
        console.error('Salesforce Query Error:', error);
        res.status(500).json({ 
            error: 'Internal Server Error fetching Cases',
            details: error.message 
        });
    }
});

// 4. Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Salesforce Middleware running on http://localhost:${PORT}`);
});

// POST /api/cases - Create a new support ticket in Salesforce
app.post('/api/cases', async (req, res) => {
    try {
        const { subject, description, priority } = req.body;

        if (!subject) {
            return res.status(400).json({ error: 'Subject is required' });
        }

        const conn = await getSalesforceConnection();
        const result = await conn.sobject('Case').create({
            Subject: subject,
            Description: description || '',
            Priority: priority || 'Medium',
            Status: 'New',
            Origin: 'Web'
        });

        res.status(201).json(result);
    } catch (error) {
        console.error('Case Creation Error:', error);
        res.status(500).json({ error: 'Failed to create case', details: error.message });
    }
});