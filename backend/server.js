const express = require('express');
const axios = require('axios');
const https = require('https');  // Add this line to import the https module
const HttpsProxyAgent = require('https-proxy-agent'); // Ensure this is installed
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const tls = require('tls');


const cors = require('cors');
require('dotenv').config(); // Load environment variables

const app = express();

// Enable CORS for all routes
app.use(cors());

//const apiUrl = 'http://3.120.27.213:8084';

// Rate limiting (optional)
const rateLimit = require('express-rate-limit');
//const {Agent} = require("node:https");
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
});
app.use(limiter);

const key = fs.readFileSync('C:/Users/Lenovo/Downloads/key.pem');
const cert = fs.readFileSync('C:/Users/Lenovo/Downloads/cert.pem');
const additionalCa1 = fs.readFileSync('C:/Users/Lenovo/Downloads/additional_cert_1.pem', 'utf8');
const additionalCa2 = fs.readFileSync('C:/Users/Lenovo/Downloads/additional_cert_2.pem', 'utf8');
const combinedCAs = tls.rootCertificates
    .map(cert => Buffer.from(cert, 'ascii').toString('utf8'))
    .concat([additionalCa1, additionalCa2]);


/*// Path to your .p12 certificate file
const p12Path = 'C:\\Users\\Lenovo\\Downloads\\Heilbronn_Student_Grouplegacy.p12';

// Convert the .p12 certificate to PEM format
const cert = fs.readFileSync(p12Path);

// Set up the HTTPS agent with the certificate and the passphrase
const httpsAgent = new https.Agent({
    pfx: cert,
});*/

const agent = new https.Agent({
    key: key,
    cert: cert,
    ca: combinedCAs,
    minVersion: 'TLSv1.2', // Ensures using TLS version 1.2 or higher
    rejectUnauthorized: true, // Enforces SSL certificate validation
});

// Test endpoint to verify backend setup
app.get('/test', async (req, res) => {
    try {
        const response = await axios.get('https://public-test.mii-termserv.de/fhir/CodeSystem/$lookup', {
            params: { system: 'http://snomed.info/sct', code: '48821000119104' },
            httpsAgent: agent,
        });

        console.log('FHIR Lookup Response:', response.data);
        res.send('Request successful! Check your console for the response.');
    } catch (error) {
        console.error('Error making request:', error.message);
        res.status(500).send(`Error occurred: ${error.message}`);
    }
});

/*// Test endpoint to confirm the backend setup
app.get('/test', async (req, res) => {
    try {
        console.log(fs.existsSync('C:/Users/Lenovo/Downloads/Heilbronn_Student_Grouplegacy.p12'));

        const agent = new https.Agent({
            pfx: fs.readFileSync('C:/Users/Lenovo/Downloads/Heilbronn_Student_Grouplegacy.p12'),
            minVersion: 'TLSv1.2'
        });

        const response = await axios.get('https://public-test.mii-termserv.de/fhir/CodeSystem/$lookup', {
            params: {
                system: 'http://snomed.info/sct',
                code: '48821000119104'
            },
            httpsAgent: agent,
        });

        console.log('FHIR Lookup Response:', response.data);
        res.send('Request successful! Check console for response.');
    } catch (error) {
        console.error('Error making request:', error);
        res.status(500).send('Error occurred! Check console for details.');
    }
});*/

/*// URL for SNOMED lookup
const snomedUrl = 'https://public-test.mii-termserv.de/fhir/CodeSystem/$lookup?system=http://snomed.info/sct&code=48821000119104';

// Function to fetch SNOMED concept data
const fetchSNOMEDConcept = async (url) => {
    try {
        console.log(`Making request to: ${url}`);
        const response = await axios.get(url, { httpsAgent });

        if (response.status === 200) {
            console.log('Response data:', response.data);
            return response.data;
        } else {
            console.error(`Request failed with status: ${response.status}`);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching data:`, error.response ? error.response.data : error.message);
        return null;
    }
};

// Fetch the data from SNOMED
fetchSNOMEDConcept(snomedUrl).then((data) => {
    if (data) {
        console.log('Fetched and processed data:', data);
    } else {
        console.log('Failed to fetch or process data');
    }
});*/

app.get('/proxy', async (req, res) => {
    const { system, loincCode } = req.query;

    if (!system || !loincCode) {
        return res.status(400).json({ error: 'Missing "system" or "loincCode" query parameter' });
    }

    try {
        const apiUrl = `https://fhir.loinc.org/CodeSystem/$lookup?system=${encodeURIComponent(system)}&code=${encodeURIComponent(loincCode)}`;

        console.log("Requesting LOINC API URL: ", apiUrl);

        const response = await axios.get(apiUrl, {
            auth: {
                username: 'elenagaz',
                password: 'ifz5zRfyx!!PP4h'
            }
        });

        console.log("LOINC API response:", response.data);
        res.json(response.data);
    } catch (error) {
        console.error('Error in proxy request:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
        });
        res.status(error.response?.status || 500).json({
            error: error.message,
            details: error.response?.data || 'No additional error details available',
        });
    }
});

/*
// Fetch the data from SNOMED
fetchSNOMEDConcept(snomedUrl).then((data) => {
    if (data) {
        console.log('Fetched and processed data:', data);
    } else {
        console.log('Failed to fetch or process data');
    }
});

// Function to process fetched SNOMED data and extract parent-child relationships
const processFetchedData = (data) => {
    if (data && data.parameter) {
        return data.parameter.map((param) => {
            // Extracting the concept ID, name, and associated properties
            const conceptData = {
                name: param.valueString || param.valueCode,  // Use name or code as fallback
                conceptId: param.valueCode,  // Concept ID
                parent: null,  // Parent concept, if exists
                children: []  // Children concepts, if exist
            };

            // Extracting parent concept
            if (param.property) {
                param.property.forEach((prop) => {
                    if (prop.name === 'parent') {
                        conceptData.parent = prop.valueCode; // Set the parent concept code
                    } else if (prop.name === 'child') {
                        conceptData.children.push(prop.valueCode); // Add child concept codes
                    }
                });
            }

            return conceptData; // Return the processed concept data
        });
    }

    return [];  // Return an empty array if no valid data is found
};
*/


// Helper Function to Translate SNOMED Code
async function translateSnomedCode(snomedCode, language) {
    // Validate input
    if (!snomedCode || !language) {
        throw { status: 400, message: 'Missing "snomedCode" or "language" parameter' };
    }

    // SNOMED API URL with language and filter for the given SNOMED code
    const snomedUrl = `https://browser.ihtsdotools.org/fhir/ValueSet/$expand?url=http://snomed.info/sct/449081005?fhir_vs&displayLanguage=${language}&filter=${snomedCode}`;

    // Custom headers (similar to test-snomed)
    const headers = {
        'User-Agent': 'PostmanRuntime/7.43.0',
        'Accept': '*/*',
        'Postman-Token': uuidv4(), // Generate a new token for each request
        'Host': 'browser.ihtsdotools.org',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive'
    };

    try {
        console.log(`Making request to: ${snomedUrl}`);
        const response = await axios.get(snomedUrl, { headers });
        const term = extractTerm(response.data, language);
        return { term }; // Return the term if found
    } catch (error) {
        console.error(`Error translating SNOMED code ${snomedCode}:`, {
            message: error.message,
            code: error.code,
            stack: error.stack,
        });

        if (error.code === 'ECONNABORTED') {
            throw { status: 504, message: 'Request timed out. The SNOMED translation API server may be slow or unresponsive.', details: error.message };
        }

        if (error.response) {
            throw {
                status: error.response.status,
                message: `SNOMED API responded with error ${error.response.status}`,
                details: error.response.data || 'No additional error details available',
            };
        }

        if (error.request) {
            throw { status: 502, message: 'No response received from the SNOMED translation API.', details: error.request };
        }

        throw { status: 500, message: 'An error occurred while translating the SNOMED code.', details: error.message };
    }
}

// Helper Function to Extract the Term
function extractTerm(data, language) {
    try {
        console.log(data.expansion)
        return data.expansion.contains[0].display || 'Translation not found';
    } catch {
        return 'Translation not found';
    }
}

// API Endpoint for SNOMED Code Translation
app.get('/api/translate-snomed', async (req, res) => {
    const { snomedCode, language } = req.query;

    // Validate required parameters
    if (!snomedCode || !language) {
        return res.status(400).json({ success: false, error: 'Missing "snomedCode" or "language" query parameter' });
    }

    try {
        const result = await translateSnomedCode(snomedCode, language);
        res.status(200).json({ success: true, term: result.term });
    } catch (error) {
        res.status(error.status || 500).json({
            success: false,
            error: error.message,
            details: error.details || null,
        });
    }
});

// Set the port for the server
const port = 5000;  // You can change this to any available port of your choice
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
