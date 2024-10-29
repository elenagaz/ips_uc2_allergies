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
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    },
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
