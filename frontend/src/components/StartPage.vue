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
          <li v-for="(entry, index) in socialHistoryEntries" :key="index">
            <strong>Observation Reference {{ index + 1 }}:</strong> {{ entry.reference }}
          </li>
        </ul>
      </div>
    </div>


    <div class="card">
      <h2 @click="toggleSection('importantInfo')" style="cursor: pointer;">
        Important Information (Allergies)
      </h2>
      <div v-if="isImportantInfoVisible" class="card-content">
        <table class="data-table">
          <thead>
          <tr>
            <th>Type</th>
            <th>Criticality</th>
            <th>Date</th>
            <th>Confirmed</th>
            <th>Symptoms</th>
            <th>Severity</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="(allergy, index) in allergyEntries" :key="index">
            <td>{{ allergy.type || 'N/A' }}</td>
            <td>{{ allergy.criticality || 'N/A' }}</td>
            <td>{{ allergy.date || 'N/A' }}</td>
            <td>{{ allergy.confirmed || 'N/A' }}</td>
            <td>{{ allergy.symptoms || 'N/A' }}</td>
            <td>{{ allergy.severity || 'N/A' }}</td>
          </tr>
          </tbody>
        </table>
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
      isPatientVisible: false,
      isEncountersVisible: false,
      isObservationsVisible: false,
      composition: null,
      observationReference: null,
      socialHistoryEntries: [],
      isImportantInfoVisible: true,
      allergyEntries: [],

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
        // Fetch the Composition resource
        const patientComposition = await axios.get('https://ips-challenge.it.hs-heilbronn.de/fhir/Composition?patient=UC2-Patient');
        this.composition = patientComposition.data;
        console.log("getting data")
        console.log(patientComposition.data.entry[0].resource.section[5].entry[0].reference)

        // Log composition to check its structure
        console.log("Fetched Composition:", this.composition);

        const patientResponse = await axios.get('https://ips-challenge.it.hs-heilbronn.de/fhir/Patient/UC2-Patient');
        this.patient = patientResponse.data;

        const encountersResponse = await axios.get('https://ips-challenge.it.hs-heilbronn.de/fhir/Encounter?patient=UC2-Patient');
        this.encounters = encountersResponse.data.entry?.map(entry => entry.resource) || [];

        const observationsResponse = await axios.get('https://ips-challenge.it.hs-heilbronn.de/fhir/Observation?patient=UC2-Patient');
        this.observations = observationsResponse.data.entry?.map(entry => entry.resource) || [];

        this.fetchSocialHistoryEntries();
        // Fetch Allergies (Important Information)
        this.fetchAllergyData();

      } catch (error) {
        console.error("Error fetching data:", error);
      }
    },

    async fetchAllergyDetails(allergyReference) {
      try {
        const allergyResponse = await axios.get(`https://ips-challenge.it.hs-heilbronn.de/fhir/AllergyIntolerance/${allergyReference.split('/')[1]}`);
        const allergy = allergyResponse.data;

        console.log(allergy.reaction[0])
        this.allergyEntries.push({
          type: allergy.code.coding[0].display || 'N/A',
          criticality: allergy.criticality || 'N/A',
          date: allergy.onsetDateTime || 'N/A',
          confirmed: allergy.verificationStatus.coding[0].code || 'N/A',
          symptoms: allergy.reaction[0].manifestation[0].coding[0].display || 'N/A',
          severity: allergy.reaction[0].severity || 'N/A',
        });
      } catch (error) {
        console.error(`Error fetching allergy details for reference ${allergyReference}:`, error);
      }
    },

    fetchAllergyData() {
      if (!this.composition || !this.composition.entry) {
        console.warn("Composition data or entries are not available.");
        return;
      }

      // Initialize allergy entries array as empty
      this.allergyEntries = [];

      // Loop through the composition sections and look for the Allergies section
      this.composition.entry[0].resource.section.forEach((section) => {
        if (section.title && section.title.includes('Allergies')) {
          section.entry.forEach((entry) => {
            if (entry.reference) {
              this.fetchAllergyDetails(entry.reference);
              console.log(entry.reference)
            }
          });
        }
      });
    },

    fetchSocialHistoryEntries() {
      if (!this.composition || !this.composition.entry) {
        console.warn("Composition data or entries are not available.");
        return;
      }

      // Initialize social history entries as an empty array
      this.socialHistoryEntries = [];

      // Loop through the composition sections to find social history related references
      this.composition.entry[0].resource.section.forEach((section) => {
        if (section.title && section.title.includes('Social History')) {
          // Iterate over the entries in the section and collect references
          section.entry.forEach((entry) => {
            if (entry.reference) {
              this.socialHistoryEntries.push(entry);
            }
          });
        }
      });

      if (this.socialHistoryEntries.length === 0) {
        console.warn("No social history entries found.");
      }
    },

    toggleSection(section) {
      if (section === 'patient') {
        this.isPatientVisible = !this.isPatientVisible;
      } else if (section === 'importantInfo') {
        this.isImportantInfoVisible = !this.isImportantInfoVisible;
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