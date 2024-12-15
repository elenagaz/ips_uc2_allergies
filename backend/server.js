const express = require('express');
const axios = require('axios');
const HttpsProxyAgent = require('https-proxy-agent'); // Ensure this is installed
const { v4: uuidv4 } = require('uuid');

const cors = require('cors');
require('dotenv').config(); // Load environment variables

const app = express();




// Enable CORS for all routes
app.use(cors());

const apiUrl = 'http://3.120.27.213:8084';
const SNOMED_API_BASE = 'https://browser.ihtsdotools.org/snowstorm/snomed-ct/browser/MAIN/concepts';

// Rate limiting (optional)
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
});
app.use(limiter);



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
// Helper functions
const fetchChildren = async (conceptId) => {
    try {
        const response = await axios.get(`${SNOMED_API_BASE}/${conceptId}/children`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching children for concept ${conceptId}:`, error.message);
        throw error;
    }
};

const fetchConcept = async (conceptId) => {
    try {
        const response = await axios.get(`${SNOMED_API_BASE}/${conceptId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching concept ${conceptId}:`, error.message);
        throw error;
    }
};

const fetchAllSubgroups = async (conceptId) => {
    const children = await fetchChildren(conceptId);
    if (!children || children.length === 0) return [];
    const result = await Promise.all(
        children.map(async (child) => {
            const childChildren = await fetchAllSubgroups(child.conceptId);
            return {
                name: child.pt.term,
                conceptId: child.conceptId,
                children: childChildren,
            };
        })
    );
    return result;
};

// API endpoint
app.get('/api/food-allergies', async (req, res) => {
    const relevantConceptIds = ["414285001", "235719002"];

    try {
        const allergies = await Promise.all(
            relevantConceptIds.map(async (conceptId) => {
                const concept = await fetchConcept(conceptId);
                const subgroups = await fetchAllSubgroups(conceptId);
                return {
                    name: concept.pt.term,
                    type: concept.pt.term,
                    value: Math.floor(Math.random() * 100), // Mock value for testing
                    conceptId,
                    subgroups,
                };
            })
        );

        res.json(allergies);
    } catch (error) {
        console.error('Error fetching food allergies:', error.message);
        res.status(500).json({ error: 'Failed to fetch food allergies' });
    }
});
*/

// // SNOMED translation API
// app.get('/api/translate-snomed', async (req, res) => {
//     const { snomedCode, language } = req.query;
//
//     // Validate input
//     if (!snomedCode || !language) {
//         return res.status(400).json({ error: 'Missing "snomedCode" or "language" query parameter' });
//     }
//
//     const endpoints = {
//         es: `https://browser.ihtsdotools.org/snowstorm/snomed-ct/browser/MAIN/SNOMEDCT-ES/2024-09-30/concepts?size=1&conceptIds=${snomedCode}`,
//         en: `https://browser.ihtsdotools.org/snowstorm/snomed-ct/browser/MAIN/2024-11-01/concepts?size=1&conceptIds=${snomedCode}`,
//         fr: `https://browser.ihtsdotools.org/snowstorm/snomed-ct/browser/MAIN/SNOMEDCT-FR/2024-06-21/concepts?size=1&conceptIds=${snomedCode}`,
//         de: `https://browser.ihtsdotools.org/snowstorm/snomed-ct/browser/MAIN/SNOMEDCT-DE/2024-05-15/concepts?size=1&conceptIds=${snomedCode}`,
//     };
//
//     if (!endpoints[language]) {
//         return res.status(400).json({ error: 'Unsupported language. Possible values: es, en, fr, de.' });
//     }
//
//     try {
//         console.log(endpoints[language])
//         const response = await axios.get(endpoints[language]);
//         const term = extractTerm(response.data, language);
//         res.json({ term });
//     } catch (error) {
//         console.error(`Error translating SNOMED code ${snomedCode}:`, error.message);
//         res.status(500).json({ error: 'Failed to fetch SNOMED translation' });
//     }
// });
/*
app.get('/api/translate-snomed', async (req, res) => {
    const { snomedCode, language } = req.query;

    // Validate input
    if (!snomedCode || !language) {
        return res.status(400).json({ error: 'Missing "snomedCode" or "language" query parameter' });
    }

    const endpoints = {
        es: `https://browser.ihtsdotools.org/snowstorm/snomed-ct/browser/MAIN/SNOMEDCT-ES/2024-09-30/concepts?size=1&conceptIds=${snomedCode}`,
        en: `https://browser.ihtsdotools.org/snowstorm/snomed-ct/browser/MAIN/2024-11-01/concepts?size=1&conceptIds=${snomedCode}`,
        fr: `https://browser.ihtsdotools.org/snowstorm/snomed-ct/browser/MAIN/SNOMEDCT-FR/2024-06-21/concepts?size=1&conceptIds=${snomedCode}`,
        de: `https://browser.ihtsdotools.org/snowstorm/snomed-ct/browser/MAIN/SNOMEDCT-DE/2024-05-15/concepts?size=1&conceptIds=${snomedCode}`,
    };

    if (!endpoints[language]) {
        return res.status(400).json({ error: 'Unsupported language. Possible values: es, en, fr, de.' });
    }

    try {
        console.log(`Making request to: ${endpoints[language]}`);
        const response = await axios.get(endpoints[language], {
            timeout: 20000, // Increased timeout
        });
        //here
        return response.data;
        const term = extractTerm(response.data, language);
        res.json({ term });
    } catch (error) {
        console.error(`Error translating SNOMED code ${snomedCode}:`, {
            message: error.message,
            code: error.code,
            stack: error.stack,
        });

        if (error.code === 'ECONNABORTED') {
            return res.status(504).json({
                error: 'Request timed out. The SNOMED translation API server may be slow or unresponsive.',
                details: error.message
            });
        }

        if (error.response) {
            return res.status(error.response.status).json({
                error: `SNOMED API responded with error ${error.response.status}`,
                details: error.response.data || 'No additional error details available'
            });
        }

        if (error.request) {
            return res.status(502).json({
                error: 'No response received from the SNOMED translation API.',
                details: error.request
            });
        }

        return res.status(500).json({
            error: 'An error occurred while translating the SNOMED code.',
            details: error.message
        });
    }
});


// Helper function to extract the term from SNOMED API response
function extractTerm(data, language) {
    // Assuming the response structure includes an array with the desired term in `data.items[0].pt.term`
    try {
        return data.items[0].pt.term || 'Translation not found';
    } catch {
        return 'Translation not found';
    }
}*/


/*app.get('/test-snomed', async (req, res) => {
    const { v4: uuidv4 } = require('uuid');

    const headers = {
        'User-Agent': 'PostmanRuntime/7.43.0',
        'Accept': '*!/!*',
        'Postman-Token': uuidv4(), // Generate a new token for each request
        'Host': 'browser.ihtsdotools.org',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive'
    };
    try {
        const response = await axios.get('https://browser.ihtsdotools.org/fhir/ValueSet/$expand?url=http://snomed.info/sct/449081005?fhir_vs&displayLanguage=es&filter=48821000119104', {
            headers: headers
        });
        res.status(200).json({ success: true, data: response.data });
    } catch (error) {
        console.error('Error:', error.response?.status, error.response?.data || error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});*/

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