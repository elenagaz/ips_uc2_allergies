<template>
  <div>
    <!-- Top Navigation Bar -->
    <div class="navbar">
      <div class="navbar-left">
        <h1 class="navbar-title">International Patient Summary</h1>
      </div>
      <div class="navbar-right">
        <!-- Language Dropdown -->
        <select v-model="selectedLanguage" @change="changeLanguage" class="language-dropdown">
          <option value="en">English</option>
          <option value="de">Deutsch</option>
          <option value="fr">Français</option>
          <option value="es">Español</option>
        </select>
        <!-- Lock Icon -->
        <span class="lock-icon" @click="toggleLock">
          <i :class="isLocked ? 'fas fa-lock' : 'fas fa-lock-open'"></i>
        </span>
      </div>
    </div>


    <!-- Main Content -->
    <div>
      <!-- Card for Patient Information -->

      <div class="patient-card">
        <h2 @click="toggleSection('patient')" style="cursor: pointer;">
          Patient Information
        </h2>
        <transition name="expand-fade">
        <div v-if="isPatientVisible" class="card-content">
          <!-- First Row -->
          <div class="info-row">
            <div class="info-label">
              <label>Name:</label>
              <span>{{ patient?.name?.[0]?.given?.join(' ') || 'N/A' }}</span>
            </div>
            <div class="info-label">
              <label>Last Name:</label>
              <span>{{ patient?.name?.[0]?.family || 'N/A' }}</span>
            </div>
            <div class="info-label">
              <label>ID:</label>
              <span>{{ patient?.id || 'N/A' }}</span>
            </div>
          </div>
          <!-- Second Row -->
          <div class="info-row">
            <div class="info-label">
              <label>Gender:</label>
              <span>{{ patient?.gender || 'N/A' }}</span>
            </div>
            <div class="info-label">
              <label>Birth Date:</label>
              <span>{{ patient?.birthDate || 'N/A' }}</span>
            </div>
            <div v-if="patient?.address && patient.address.length > 0" class="info-label">
              <label>Address:</label>
              <span>{{ formatAddress(patient.address[0]) || 'N/A' }}</span>
            </div>
          </div>
          <!-- Last Row: Social History -->
          <div v-for="(entry, index) in socialHistoryEntries" :key="index" class="info-row">
            <div class="info-label">
              <label>Observation Reference {{ index + 1 }}:</label>
              <span>{{ entry.reference || 'N/A' }}</span>
            </div>
          </div>
        </div>
        </transition>
      </div>


      <!-- Dashboard -->
      <div class="dashboard">
        <!-- Left Side: Two Cards -->
        <div class="dashboard-left">
          <!-- Card 1 on the Left -->
          <div class="dashboard-card">
            <h3>Problems or maybe conditions</h3>
            <p>Conditions from composition</p>
          </div>

          <!-- Card 2 on the Left -->
          <div class="dashboard-card">
            <h3>Medication</h3>
            <p>A list of medicine if there are any in the composition</p>
          </div>
        </div>

        <!-- Chart -->
        <div class="dashboard-chart">
          <canvas id="foodAllergiesChart" width="400" height="400"></canvas>
        </div>

        <!-- Right Side-->
        <div class="dashboard-right">
          <div class="dashboard-card">
            <h3>All allergies </h3>
            <p>There are other allergies or intolerances available through the SNOMED CT browser, because of the food inflorescence use-case only food in the graph</p>
          </div>
        </div>
      </div>



<!--    <div class="card">
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
    </div>-->


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
  </div>
</template>

<script>
import axios from 'axios';
import Chart from 'chart.js/auto';

export default {
  data() {
    return {
      patient: null,
      encounters: [],
      observations: [],
      allergyEntries: [],
      isPatientVisible: true,
      selectedLanguage: 'en',
      isLocked: true,
      isImportantInfoVisible: true,
      isEncountersVisible: false,
      isObservationsVisible: false,

      composition: null,
      observationReference: null,
      socialHistoryEntries: [],

      allergies: [
        { type: "Peanuts", value: 40 },
        { type: "Shellfish", value: 30 },
        { type: "Milk", value: 20 },
        { type: "Eggs", value: 10 },
      ],

      chart: null,

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
  async created() {
    await this.fetchPatientData();
    this.fetchOtherData();
  },

  mounted() {
    this.renderChart();
  },


  methods: {
    async fetchPatientData() {
      try {
        const response = await axios.get('https://ips-challenge.it.hs-heilbronn.de/fhir/Patient/UC2-Patient');
        this.patient = response.data;
      } catch (error) {
        console.error("Error fetching patient data:", error);
      }
    },
    async fetchOtherData() {
      try {
        const patientResponse = await axios.get('https://ips-challenge.it.hs-heilbronn.de/fhir/Patient/UC2-Patient');
        this.patient = patientResponse.data;

        const encountersResponse = await axios.get('https://ips-challenge.it.hs-heilbronn.de/fhir/Encounter?patient=UC2-Patient');
        this.encounters = encountersResponse.data.entry?.map(entry => entry.resource) || [];

        const observationsResponse = await axios.get('https://ips-challenge.it.hs-heilbronn.de/fhir/Observation?patient=UC2-Patient');
        this.observations = observationsResponse.data.entry?.map(entry => entry.resource) || [];

        await this.fetchCompositionData();
        this.fetchSocialHistoryEntries();

        // Fetch Allergies (Important Information) //TODO: maybe remove
        this.fetchAllergyData();
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    },


    async fetchCompositionData() {
      // Fetch the Composition resource
      const patientComposition = await axios.get('https://ips-challenge.it.hs-heilbronn.de/fhir/Composition?patient=UC2-Patient');
      this.composition = patientComposition.data;
      console.log("getting data")
      console.log(patientComposition.data.entry[0].resource.section[5].entry[0].reference)

      // Log composition to check its structure
      console.log("Fetched Composition:", this.composition);
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

    formatAddress(address) {
      let addressString = '';

      if (address.country) {
        addressString += address.country;
      }
      if (address.city) {
        if (addressString) addressString += ', ';
        addressString += address.city;
      }
      if (address.postalCode) {
        if (addressString) addressString += ', ';
        addressString += address.postalCode;
      }
      if (address.line) {
        if (addressString) addressString += ', ';
        addressString += address.line.join(', ');
      }
      return addressString || 'N/A'; // Return 'N/A' if no address data is available
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
    },
    changeLanguage() {
      console.log("Language changed to:", this.selectedLanguage);
      // TODO: add functionality for changing the language
    },
    toggleLock() {
      this.isLocked = !this.isLocked;
      //console.log("Lock status:", this.isLocked ? "Locked" : "Unlocked");
    },

    renderChart() {
      if (this.chart) {
        this.chart.destroy();
      }

      const ctx = document.getElementById("foodAllergiesChart").getContext("2d");

      this.chart = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: this.allergies.map((allergy) => allergy.type),
          datasets: [
            {
              label: "Food Allergies",
              data: this.allergies.map((allergy) => allergy.value),
              backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"],
              hoverOffset: 10, // Applies when hovering over a segment
              offset: (context) => {
                const allergyType = context.chart.data.labels[context.dataIndex];
                const highlightedAllergies = ["Peanuts", "Shellfish"]; // List of allergies to highlight
                return highlightedAllergies.includes(allergyType) ? 20 : 0;
              },

            },
          ],
        },
        options: {
          plugins: {
            tooltip: {
              callbacks: {
                label: (tooltipItem) => {
                  const label = tooltipItem.label || "";
                  const value = tooltipItem.raw;
                  return `${label}: ${value}% ${label === "Peanuts" ? "(High Risk)" : ""}`;
                },
              },
            },
          },
        },
      });
    },

  }


};
</script>

<style scoped>

/* Specific styles for the Patient Information Card */
.patient-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
  background-color: #add8e6; /* Light blue background for patient card */
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 60px; /* Sticky just below navbar */
  z-index: 1000; /* Ensure it stays above other content */
  transition: box-shadow 0.3s ease-in-out;
}

/* Card content styling */
.patient-card h2 {
  color: #2c3e50;
  margin: 0;
}

.patient-card .card-content {
  margin-top: 10px;
}

/* Data table inside the patient card */
.patient-card .data-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.patient-card .data-table th,
.patient-card .data-table td {
  padding: 10px;
  border: 1px solid #ddd;
  text-align: left;
}

.patient-card .data-table th {
  background-color: #f5f5f5;
  font-weight: bold;
}

/* Flex for card and chart */
.container .card {
  flex: 1 1 45%;
  margin: 10px;
}

/* Navbar Styles */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f8f9fa;
  padding: 10px 20px;
  border-bottom: 1px solid #ddd;
  z-index: 1000; /* Navbar stays above all */
}

/* Navbar content styling */
.navbar-left {
  display: flex;
  align-items: center;
}

.navbar-title {
  font-size: 1.5rem;
  font-weight: bold;
  color: #2c3e50;
  margin: 0;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 15px;
  position: relative;
  left: -3%;
}

.language-dropdown {
  padding: 5px 10px;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.lock-icon {
  cursor: pointer;
  font-size: 1.5rem;
  color: #2c3e50;
}

.lock-icon:hover {
  color: #007bff;
}

/* Dashboard Styling */
.dashboard {
  display: flex;
  justify-content: space-between;
  align-items: flex-start; /* Align items to the top */
  margin-top: 0px; /* Adjusted for navbar */
  padding: 20px;
}

.dashboard-card {
  flex: 1;
  margin: 10px;
  padding: 20px;
  background-color: #f8f9fa;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  text-align: center;
}

.dashboard-chart {
  flex: 2;
  margin: 10px;
  padding: 20px;
  background-color: #fff;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  max-width: 600px; /* Limit the max width */
  width: 100%; /* Ensure the chart fits within the container */
}

.dashboard-chart canvas {
  width: 80% !important; /* Make the canvas width smaller */
  height: 80% !important; /* Ensure height is proportionate */
}

canvas {
  display: block;
  margin: 0 auto;
  width: auto; /* Make the canvas width responsive */
  height: auto; /* Allow the height to adjust accordingly */
}

.dashboard-left,
.dashboard-right {
  flex: 1;
  display: flex;
  flex-direction: column; /* Stack cards vertically */
  gap: 20px; /* Space between the cards */
}

/* Patient Information Card - Sticky */
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

/* Content within the card */
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

/* Container for each label and its corresponding information */
.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 5px; /* Space between rows */
}

/* Styling for labels */
.info-label {
  display: flex;
  align-items: center;
  margin-right: 20px; /* Space between label and value */
  font-size: 1rem; /* Same size for both label and value */
  width: 30%; /* Controls the width for both label and value */
}

.info-label label {
  font-weight: bold;
  margin-right: 8px; /* Space between label and value */
  white-space: nowrap; /* Prevent labels from wrapping */
}

.info-label span {
  font-size: 1rem; /* Same size for value */
  word-wrap: break-word; /* Ensure long values don't break the layout */
  width: auto;
}

.card-content {
  margin-bottom: 1px;
}

.card-content .info-row:last-child .info-label {
  width: auto; /* Allow the value to expand */
}

.card-content .info-row:last-child {
  margin-bottom: 0;
}

</style>