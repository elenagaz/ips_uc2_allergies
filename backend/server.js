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




const agent = new https.Agent({
    key: key,
    cert: cert,
    ca: combinedCAs,
    minVersion: 'TLSv1.2', // Ensures using TLS version 1.2 or higher
    rejectUnauthorized: true, // Enforces SSL certificate validation
});

const FHIR_API_BASE = 'https://public-test.mii-termserv.de/fhir/CodeSystem/$lookup';

// Function to fetch and process FHIR data
const fetchFhirData = async (system, code) => {
    try {
        const response = await axios.get(FHIR_API_BASE, {
            params: { system, code },
            httpsAgent: agent,
        });

        const data = response.data;

        // Extract the display name
        const displayParameter = data.parameter.find((param) => param.name === 'display');
        const displayName = displayParameter ? displayParameter.valueString : null;

        // Extract parent codes
        const parentParameters = data.parameter.filter(
            (param) => param.name === 'property' && param.part.some((p) => p.name === 'code' && p.valueCode === 'parent')
        );
        const parentCodes = parentParameters.map((param) =>
            param.part.find((p) => p.name === 'value' && p.valueCode).valueCode
        );

        // Extract child codes
        const childParameters = data.parameter.filter(
            (param) => param.name === 'property' && param.part.some((p) => p.name === 'code' && p.valueCode === 'child')
        );
        const childCodes = childParameters.map((param) =>
            param.part.find((p) => p.name === 'value' && p.valueCode).valueCode
        );

        return {
            conceptId: code,
            name: displayName,
            parentCodes,
            childCodes,
        };
    } catch (error) {
        console.error(`Error fetching FHIR data for code ${code}:`, error.message);
        throw error;
    }
};

// Function to construct the hierarchical structure
const constructHierarchy = async (conceptCodes) => {
    const allergies = [];

    for (const code of conceptCodes) {
        const allergy = await fetchFhirData('http://snomed.info/sct', code);

        // Fetch child data for subgroups
        const subgroups = await Promise.all(
            allergy.childCodes.map(async (childCode) => {
                const subgroup = await fetchFhirData('http://snomed.info/sct', childCode);

                // Fetch children for each subgroup
                const children = await Promise.all(
                    subgroup.childCodes.map(async (childCode) => fetchFhirData('http://snomed.info/sct', childCode))
                );

                return {
                    ...subgroup,
                    children,
                };
            })
        );

        allergies.push({
            ...allergy,
            subgroups,
        });
    }

    return allergies;
};

// API Endpoint to fetch and process hierarchical data
app.get('/api/food-allergies', async (req, res) => {
    try {
        console.log("in the fetching")
        const conceptCodes = ['414285001', '235719002']; // Replace with relevant top-level concept codes

        const results = await constructHierarchy(conceptCodes);
        console.log("done with pre-process")

        res.json(results);
    } catch (error) {
        console.error('Error fetching data:', error.message);
        res.status(500).send(`Failed to fetch data: ${error.message}`);
    }
});


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
