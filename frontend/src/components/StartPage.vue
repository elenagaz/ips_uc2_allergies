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
          <li><strong>Name:</strong> {{ patient.name?.[0]?.given?.join(' ') || 'N/A' }}</li>
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

      await this.fetchAllergyIntolerances();

    } catch (error) {
      console.error("Error fetching data:", error);
    }
  },

  // fetch alleergy intolerances from the allergy reference in the composition resource
  async fetchAllergyIntolerances() {
    try {
      const allergyReferences = this.extractAllergyIntoleranceReferences();
      const allergyIntolerances = await Promise.all(
        allergyReferences.map(ref => axios.get(`https://ips-challenge.it.hs-heilbronn.de/fhir/${ref}`))
      );
      this.allergyIntolerances = allergyIntolerances.map(response => response.data);
      this.allergyIntolerances.forEach(allergy => {
        //TODO: put relevabt data into diagram e.g. color code criticality here
        const extractedData = this.extractAllergyIntoleranceData(allergy);
        console.log(extractedData);
      });
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
        return this.extractTerm(response.data, language);
    } catch (error) {
        console.error(`Error fetching SNOMED code translation: ${error}`);
        return null;
    }
  },

  // extract term from the response data
  extractTerm(data, language) {
    const descriptions = data.items[0].descriptions;
    //find lang = language code in resonse code
    const term = descriptions.find(desc => desc.lang === language).term;
    return term;
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
