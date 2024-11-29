<template>
  <div>
    <h1>International Patient Summary</h1>

    <!-- Card for Patient Information -->
    <div class="card">
      <h2 @click="toggleSection('patient')" style="cursor: pointer;">
        Patient Information
      </h2>
      <div v-if="isPatientVisible" class="card-content">
        <ul class="data-view">
          <li><strong>Name11:</strong> {{ patient.name?.[0]?.given?.join(' ') || 'N/A' }}</li>
          <li><strong>Last Name:</strong> {{ patient.name?.[0]?.family || 'N/A' }}</li>
          <li><strong>ID:</strong> {{ patient.id }}</li>
          <li><strong>Gender:</strong> {{ patient.gender }}</li>
          <li><strong>Birth Date:</strong> {{ patient.birthDate }}</li>
          <li v-if="patient.address && patient.address.length > 0">
            <strong>Address:</strong>
            <ul class="address-list">
              <li v-if="patient.address[0].country"><strong>Country:</strong> {{ patient.address[0].country }}</li>
              <li v-if="patient.address[0].city"><strong>City:</strong> {{ patient.address[0].city }}</li>
              <li v-if="patient.address[0].postalCode"><strong>Postal Code:</strong> {{ patient.address[0].postalCode }}</li>
              <li v-if="patient.address[0].line"><strong>Street:</strong> {{ patient.address[0].line.join(', ') }}</li>
            </ul>
          </li>
        </ul>
      </div>
    </div>

    <!-- Card for Encounters with Sorted Table -->
    <div class="card">
      <h2 @click="toggleSection('encounters')" style="cursor: pointer;">
        Encounters
      </h2>
      <div v-if="isEncountersVisible" class="card-content">
        <table class="data-table">
          <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Status</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="(encounter, index) in sortedEncounters" :key="index">
            <td>{{ encounter.period?.start || 'N/A' }}</td>
            <td>{{ encounter.id || 'N/A' }}</td>
            <td>{{ encounter.status || 'N/A' }}</td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Card for Observations with Sorted Table -->
    <div class="card">
      <h2 @click="toggleSection('observations')" style="cursor: pointer;">
        Observations
      </h2>
      <div v-if="isObservationsVisible" class="card-content">
        <table class="data-table">
          <thead>
          <tr>
            <th>Type</th>
            <th>Value</th>
            <th>Date</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="(observation, index) in sortedObservations" :key="index">
            <td>{{ observation.id || 'N/A' }}</td>
            <td>{{ observation.valueQuantity?.value || observation.note || observation.value ||'N/A' }} {{ observation.valueQuantity?.code || '' }}</td>
            <td>{{ observation.effectiveDateTime || 'N/A' }}</td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      patient: null,
      encounters: [],
      observations: [],
      compositionSections: [],
      isPatientVisible: false,
      isEncountersVisible: false,
      isObservationsVisible: false,
      allergyIntolerancesTranslated: [],
      extractedData: [],
    };
  },
  computed: {
    sortedEncounters() {
      return this.encounters.slice().sort((a, b) => {
        return new Date(b.period?.start || 0) - new Date(a.period?.start || 0);
      });
    },
    sortedObservations() {
      return this.observations.slice().sort((a, b) => {
        return new Date(b.effectiveDateTime || 0) - new Date(a.effectiveDateTime || 0);
      });
    }
  },
  methods: {
  async fetchPatientData() {
    try {
      const patientResponse = await axios.get('https://ips-challenge.it.hs-heilbronn.de/fhir/Patient/UC2-Patient');
      this.patient = patientResponse.data;

      const encountersResponse = await axios.get('https://ips-challenge.it.hs-heilbronn.de/fhir/Encounter?patient=UC2-Patient');
      this.encounters = encountersResponse.data.entry?.map(entry => entry.resource) || [];

      const observationsResponse = await axios.get('https://ips-challenge.it.hs-heilbronn.de/fhir/Observation?patient=UC2-Patient');
      this.observations = observationsResponse.data.entry?.map(entry => entry.resource) || [];
      
      const compositionResponse = await axios.get('https://ips-challenge.it.hs-heilbronn.de/fhir/Composition?patient=UC2-Patient');
      this.compositionSections = compositionResponse.data.entry?.map(entry => entry.resource.section).flat() || [];

      //testing of this with spanish mexico + if there is no language available uses english term => on the console again
      await this.translateLoincCode("63486-5", "es-MX")
      // in the method I translate it to french and use console.log to display it
      await this.fetchAllergyIntolerances();



    } catch (error) {
      console.error("Error fetching data:", error);
    }
  },

  // fetch allergy intolerances from the allergy reference in the composition resource
  async fetchAllergyIntolerances() {
    try {
      const allergyReferences = this.extractAllergyIntoleranceReferences();
      const allergyIntolerances = await Promise.all(
        allergyReferences.map(ref => axios.get(`https://ips-challenge.it.hs-heilbronn.de/fhir/${ref}`))
      );
      this.allergyIntolerances = allergyIntolerances.map(response => response.data);
      this.allergyIntolerances.forEach(allergy => {
        //TODO: put relevant data into diagram e.g. color code criticality here

        let
        extractedData;
        extractedData = this.extractAllergyIntoleranceData(allergy);
        this.extractedData = extractedData;
        console.log(this.extractedData);
      });
      console.log(this.extractedData.allergySnomedCode)

      // this is added to test the translation on the console
      this.extractedData2 = this.translateSnomedCode(this.extractedData.allergySnomedCode,'fr')
      console.log(this.extractedData2);

    } catch (error) {
      console.error("Error fetching allergy intolerances:", error);
    }
  },

  // extract reference to allergy intolerance resources from the composition resource
  extractAllergyIntoleranceReferences() {
    const allergySection = this.compositionSections.find(section => section.title === 'Allergies Summary');
    if (!allergySection) return [];
    return allergySection.entry
      .filter(entry => entry.reference.startsWith('AllergyIntolerance'))
      .map(entry => entry.reference);
  },

  // extract relevant data from allergy intolerance resources
  extractAllergyIntoleranceData(allergy) {
    const allergySnomedCode = allergy.code?.coding?.find(coding => coding.system === 'http://snomed.info/sct')?.code || null;
    const criticality = allergy.criticality || null;
    const manifestationSnomedCode = allergy.reaction?.[0]?.manifestation?.[0]?.coding?.find(coding => coding.system === 'http://snomed.info/sct')?.code || null;
    const encounterReference = allergy.encounter?.reference || null;

    return {
      allergySnomedCode,
      criticality,
      manifestationSnomedCode,
      encounterReference
    };
  },

  // translate SNOMED code to human-readable term according to the specified language
  // possible languages: Spanish: 'es' , English: 'en', French: 'fr', German 'de' (German is limited and does not work)
  async  translateSnomedCode(snomedCode, language) {
    const endpoints = {
        es: `https://browser.ihtsdotools.org/snowstorm/snomed-ct/browser/MAIN/SNOMEDCT-ES/2024-09-30/concepts?size=1&conceptIds=${snomedCode}`,
        en: `https://browser.ihtsdotools.org/snowstorm/snomed-ct/browser/MAIN/2024-11-01/concepts?size=1&conceptIds=${snomedCode}`,
        fr: `https://browser.ihtsdotools.org/snowstorm/snomed-ct/browser/MAIN/SNOMEDCT-FR/2024-06-21/concepts?size=1&conceptIds=${snomedCode}`,
        de: `https://browser.ihtsdotools.org/snowstorm/snomed-ct/browser/MAIN/SNOMEDCT-DE/2024-05-15/concepts?size=1&conceptIds=${snomedCode}`
    };

    try {
        const response = await axios.get(endpoints[language]);
        console.log("this data is translated => " + this.extractTerm(response.data, language))
        return this.extractTerm(response.data, language);
    } catch (error) {
        console.error(`Error fetching SNOMED code translation: ${error}`);
        return null;
    }
  },

    // The method that finds the display name based on language
    findDisplayNameByLanguage(responseData, languageCode) {
      try {
        // Extract the default English display value (from the 'display' parameter)
        // if there are no translations in the wanted language - the english one is displayed
        const defaultDisplay = responseData.parameter?.find(param => param.name === 'display')?.valueString;

        if (!defaultDisplay) {
          console.error('Default display name not found in the response data.');
          return 'No display available';
        }

        // Look for the 'designation' array to find translations
        const designationParts = responseData.parameter?.filter(param => param.name === 'designation');

        // If no designation is found, return the default display value (English name)
        if (!designationParts || designationParts.length === 0) {
          console.warn('No designation translations found, returning default display value');
          return defaultDisplay;
        }

        // Try to find the translation for the specified language
        let translatedValue = defaultDisplay; // Start with default display value
        for (let part of designationParts) {
          const languagePart = part.part?.find(item => item.name === 'language' && item.valueCode === languageCode);

          if (languagePart) {
            // If the language is found, override the translated value
            const valuePart = part.part?.find(item => item.name === 'value' && item.valueString);
            if (valuePart) {
              translatedValue = valuePart.valueString;
              break; // Break the loop once translation is found
            }
          }
        }
        return translatedValue;
      } catch (error) {
        console.error('Error in findDisplayNameByLanguage:', error);
        return 'Error finding display name';
      }
    },

    // The method that translates a LOINC code to a specific language
    async translateLoincCode(loincCode, language) {
      const system = 'http://loinc.org'; // Link needed
      try {
        const response = await axios.get('http://localhost:5000/proxy', {
          params: { system, loincCode },
        });
        // Log the entire response data
        //console.log("LOINC Code Response Data:", response.data);

        if (response.data && response.data.parameter && Array.isArray(response.data.parameter)) {
          const displayTerm = response.data.parameter.find(param => param.name === 'display');
          if (displayTerm) {
            //printing of the translated value
            let resultingTerm = this.findDisplayNameByLanguage(response.data, language);
            console.log("Translated term: " + resultingTerm);
            return resultingTerm;
          } else {
            console.error("Display term not found in the response");
            return null;
          }
        } else {
          console.error("Unexpected response structure or empty 'parameter' array");
          return null;
        }
      } catch (error) {
        console.error(`Error fetching LOINC code translation: ${error}`);
        return null;
      }
    },

  // extract term from the response data
  extractTerm(data, language) {
    const descriptions = data.items[0].descriptions;
    //find lang = language code in resonse code
    return descriptions.find(desc => desc.lang === language).term;
  },

  // toggle visibility of sections
  toggleSection(section) {
    if (section === 'patient') {
      this.isPatientVisible = !this.isPatientVisible;
    } else if (section === 'encounters') {
      this.isEncountersVisible = !this.isEncountersVisible;
    } else if (section === 'observations') {
      this.isObservationsVisible = !this.isObservationsVisible;
    }
  }
},
mounted() {
  this.fetchPatientData();
}
};
</script>

<style scoped>
.card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  background-color: #fff;
}
.card h2 {
  color: #2c3e50;
  margin: 0;
}
.card-content {
  margin-top: 10px;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}
.data-table th,
.data-table td {
  padding: 10px;
  border: 1px solid #ddd;
  text-align: left;
}
.data-table th {
  background-color: #f5f5f5;
  font-weight: bold;
}
.data-view {
  list-style-type: none;
  text-align: left;
}
.address-list {
  list-style-type: none;
  text-align: left;
}
</style>
