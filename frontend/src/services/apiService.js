import axios from 'axios';

const apiUrl = 'https://ips-challenge.it.hs-heilbronn.de/fhir/';
const patientID = 'UC2-Patient';

// TODO: fix trows - maybe just null or undefined - maybe try warn or info

export const getPatientData = async () => {
    try {
        const response = await axios.get(`${apiUrl}/Patient/${patientID}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching patient data:", error);
    }
}

export const processComposition = async () => {
    try {
        const response = await axios.get(`${apiUrl}/Composition?patient=${patientID}`);
        const compositionJson = response.data;

        if (!compositionJson || compositionJson.resourceType !== "Bundle" || !Array.isArray(compositionJson.entry)) {
            throw new Error("Invalid composition JSON structure");
        }

        const result = {};

        // Process the Composition resource
        compositionJson.entry.forEach((entry) => {
            const resource = entry.resource;

            if (resource.resourceType === "Composition" && Array.isArray(resource.section)) {
                resource.section.forEach((section) => {
                    const sectionTitle = section.title; // Get the section title
                    const loincCode = section.code?.coding?.[0]?.code || null;
                    const entryIds = (section.entry?.map((e) => e.reference) || []);

                    // Save data for each section
                    result[sectionTitle] = {
                        loincCode,
                        entryIds
                    };
                });
            }
        });
        console.log(result);
        return result;
    } catch (error) {
        console.error('Error processing composition:', error.message);
        throw error;
    }
}

// Fetch all observations for the patient
export const getObservationsByEncounterIds = async (encounterIds) => {
    try {
        // Step 1: Fetch all observations for the patient
        const response = await axios.get(`${apiUrl}/Observation?patient=${patientID}`);

        // Step 2: Get the list of observations from the response
        const observations = response.data.entry?.map(entry => entry.resource) || [];
        console.log("check before")
        console.log(observations)
        // Step 3: Create an object to hold the grouped observations by encounter ID
        const groupedObservations = {};

        // Step 4: Group the observations by their encounter ID
        observations.forEach(obs => {
            // Get the encounter ID from the reference and remove the "Encounter/" prefix
            const encounterReference = obs.encounter?.reference?.replace('Encounter/', '');

            if (encounterReference && encounterIds.includes(encounterReference)) {
                // If the encounterReference exists and matches one of the encounterIds, group the observation
                if (!groupedObservations[encounterReference]) {
                    groupedObservations[encounterReference] = [];
                }

                // Add the observation to the corresponding encounter group
                groupedObservations[encounterReference].push(obs);
            }
        });

        // Step 5: Return the grouped observations by encounter ID

        console.log("check after")
        console.log(groupedObservations)
        return groupedObservations;
    } catch (error) {
        console.error('Error fetching observations:', error);
        return {};
    }
}



export const extractMedication = async (compositionData) => {
    try {
        const medicationSummary = compositionData["Medication Summary"];

        if (!medicationSummary || !Array.isArray(medicationSummary.entryIds)) {
            throw new Error("Medication Summary section or entry IDs are missing.");
        }

        const medicationIds = medicationSummary.entryIds;

        //Fetch each medication by its ID
        const medicationPromises = medicationIds.map((id) =>
            axios.get(`${apiUrl}/${id}`).then((response) => response.data)
        );
        console.log(medicationPromises);

        // Step 4: Resolve all promises and return medications
        const medications = await Promise.all(medicationPromises);
        console.log(medications);
        return medications; // Ready for display on the frontend
    } catch (error) {
        console.error("Error extracting medications:", error.message);
        throw error;
    }
}

export const extractAllergies = async () => {

}

export const extractConditions = async (compositionData) => {
    try {
        // Extract the "conditions Summary" section (this can be adjusted as per your composition structure)
        const conditionsSummary = compositionData["Problems Summary"];

        if (!conditionsSummary || !Array.isArray(conditionsSummary.entryIds)) {
            throw new Error("Conditions Summary section or entry IDs are missing.");
        }

        const conditionIds = conditionsSummary.entryIds;

        // Fetch each condition (condition) by its ID
        const conditionPromises = conditionIds.map((id) =>
            axios.get(`${apiUrl}/${id}`).then((response) => response.data)
        );

        // Step 4: Resolve all promises and return conditions
        const conditions = await Promise.all(conditionPromises);
        console.log(conditions); // For debugging purposes

        return conditions; // Ready for display on the frontend
    } catch (error) {
        console.error("Error extracting conditions:", error.message);
        throw error;
    }
}

export const fetchSocialHistoryEntries = async (compositionData) => {
    try {
        const socialHistorySummary = compositionData["Social History Summary"];

        if (!socialHistorySummary || !Array.isArray(socialHistorySummary.entryIds)) {
            throw new Error("Social History Summary section or entry IDs are missing.");
        }

        const socialHistoryIds = socialHistorySummary.entryIds;

        const socialHistoryPromises = socialHistoryIds.map((id) =>
            axios.get(`${apiUrl}/${id}`).then((response) => response.data)
        );

        const socialHistoryEntries = await Promise.all(socialHistoryPromises);

        // Log the entries for debugging purposes
        console.log(socialHistoryEntries);

        return socialHistoryEntries;

    } catch (error) {
        console.error("Error extracting social history entries:", error.message);
        throw error;
    }
}

export const getEncounters = async () => {
    try {
        // Fetch encounters from the API
        const encountersResponse = await axios.get(`${apiUrl}Encounter?patient=${patientID}`);

        // Get the data from the response
        const encounters = encountersResponse.data.entry?.map(entry => entry.resource) || [];

        // Create two arrays: one for encounterIds and one for encounterObjects
        const encounterIds = encounters.map(encounter => encounter.id);
        const encounterObjects = encounters;

        // Return both arrays
        return {
            encounterIds,
            encounterObjects
        };
    } catch (error) {
        // Handle error in case of API failure or missing data
        console.error('Error fetching encounters:', error);
        return {
            encounterIds: [],
            encounterObjects: []
        };
    }
}