const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

// Enable CORS for all routes
app.use(cors());

app.get('/proxy', async (req, res) => {
    const { system, loincCode } = req.query;

    // Check if both 'system' and 'loincCode' query parameters are provided
    if (!system || !loincCode) {
        return res.status(400).json({ error: 'Missing "system" or "loincCode" query parameter' });
    }

    try {
        // Construct the LOINC API URL with the system and loincCode
        const apiUrl = `https://fhir.loinc.org/CodeSystem/$lookup?system=${encodeURIComponent(system)}&code=${encodeURIComponent(loincCode)}`;

        console.log("Requesting LOINC API URL: ", apiUrl);

        // Send the request to the LOINC API with Basic Authentication
        const response = await axios.get(apiUrl, {
            auth: {
                username: 'elenagaz', // Your username for authentication
                password: 'ifz5zRfyx!!PP4h' // Your password for authentication
            }
        });

        // Log the response data from the LOINC API
        console.log("LOINC API response:", response.data);

        // Forward the LOINC API response to the frontend
        res.json(response.data);
    } catch (error) {
        console.error('Error in proxy request:', error.message);
        res.status(error.response?.status || 500).json({
            error: error.message,
            details: error.response?.data || 'No additional error details available',
        });
    }
});

// Set the port for the server
const port = 5000;  // You can change this to any available port of your choice
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
