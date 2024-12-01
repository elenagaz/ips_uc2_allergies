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
              <label>Additional Information:</label>
              <!-- Displaying the code and the note if it exists -->
              <span>
                {{ entry.code?.coding?.[0]?.display || 'N/A' }}
                <span v-if="entry.note?.[0]?.text">, {{ entry.note[0].text }}</span>
              </span>
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
            <h3>Conditions</h3>
            <!-- Check if allergy data exists -->
            <!-- Check if condition data exists -->
            <div v-if="conditions && conditions.length > 0">
              <table class="medication-table">
                <thead>
                <tr>
                  <th>Condition</th>
                  <th>Status</th>
                  <th>Severity</th>
                  <th>Onset Date</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="condition in conditions" :key="condition.id">
                  <td>{{ condition.code.coding[0].display || 'N/A'}}</td> <!--can be translated-->
                  <td>{{ condition.clinicalStatus.coding[0].code || 'N/A'}}</td>
                  <td>{{ condition.severity.coding[0].display }}</td>
                  <td>{{ condition.onsetDateTime || 'N/A'}}</td>
                </tr>
                </tbody>
              </table>
            </div>

            <!-- If no conditions or conditions are available -->
            <div v-else>
              <p>No conditions or conditions available</p>
            </div>
          </div>

          <!-- Card 2 on the Left -->
          <div class="dashboard-card">
            <h3>Medication</h3>
            <div v-if="medications && medications.length > 0">
              <table class="medication-table">
                <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Reason</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="medication in medications" :key="medication.id">
                  <td>{{ medication.medicationCodeableConcept.coding[0].display || 'N/A'}}</td> <!--can be translated-->
                  <td>{{ medication.status || 'N/A'}}</td>
                  <td>{{ medication.effectiveDateTime || 'N/A'}}</td>
                  <td>{{ medication.reasonCode[0]?.coding[0]?.display || 'N/A' }}</td>
                </tr>
                </tbody>
              </table>
            </div>

            <!-- If no medications are available -->
            <div v-else>
              <p>No medication available</p>
            </div>
          </div>
        </div>

        <!-- Chart -->
        <div class="dashboard-chart">
          <h3>Food Allergies Chart</h3> <!-- Title for the chart -->
          <canvas id="foodAllergiesChart"></canvas>
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
      <div>
        <!-- Card for Encounters with Sorted Table -->
        <div class="card">
          <h2 @click="toggleSection('encounters')" style="cursor: pointer;">
            Encounters
          </h2>
          <div v-if="isEncountersVisible" class="card-content">
            <table class="data-table">
              <thead>
              <tr style="background-color: lightgrey;">
                <th>Date</th>
                <th>Type</th>
                <th>Reason</th>
                <th>Status</th>
                <th style="width: 50px;"> <!-- Flag Column with no styling here -->
                  <span>Flag</span>
                </th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="(encounter, index) in sortedEncounters" :key="index" @click="viewEncounterDetails(encounter)">
                <td>{{ encounter.period?.start || 'unknown' }} - {{ encounter.period?.end || 'unknown' }}</td>
                <td>{{ encounter.id?.split('-').pop() || 'N/A' }}</td>
                <td>{{ encounter.reasonCode?.[0]?.coding?.[0]?.display || 'unknown' }}</td>
                <td>{{ encounter.status || 'N/A' }}</td>

                <!-- Flag column with inline styles to make the box red -->
                <td style="width: 50px; text-align: center;">
                  <div v-if="hasHighInterpretation(encounter)"
                       style="background-color: red; width: 30px; height: 30px; display: flex; justify-content: center; align-items: center; border-radius: 50%;">
                    <span style="color: white; font-size: 18px;">⚠</span>
                  </div>
                </td>
              </tr>
              </tbody>
            </table>

          </div>
        </div>

        <!-- Detailed Observations Card -->
        <div
            v-if="selectedEncounter"
            class="detail-card"
            style="background-color: #cfe6e6; padding: 20px; margin-top: 20px; border-radius: 8px; position: relative;">
          <!-- Close Button (X) -->
          <button
              @click="selectedEncounter = null"
              style="background: none; border: none; color: #333; font-size: 30px; position: absolute; top: 15px; right: 20px; cursor: pointer;">
            &times; <!-- "X" -->
          </button>

          <h3>Details for Encounter: {{ selectedEncounter.id?.split('-').pop() || 'N/A' }}</h3>

          <!-- Check if there are no observations for the selected encounter -->
          <div v-if="!vitalSignObservations.length && !otherObservations.length">
            <p>No observations are available for this encounter.</p>
          </div>

          <!-- If vital signs observations are available -->
          <div v-if="vitalSignObservations.length">
            <h4>Vital Signs</h4>

            <!-- Inline Details for Observation -->
            <div v-for="(obs, obsIndex) in vitalSignObservations" :key="'obs-' + obsIndex" class="vital-sign-details">
              <p>
                <strong>Observation ID:</strong> {{ obs.id || 'N/A' }} |
                <strong>Type:</strong> {{ obs.code?.coding?.[0]?.display || 'N/A' }} |
                <strong>Date:</strong> {{ obs.effectiveDateTime || 'N/A' }}
              </p>
              <div v-if="obs.note && obs.note.length > 0">
                <p><strong>Notes:</strong> {{ obs.note[0]?.text || 'No notes available' }}</p>
              </div>
            </div>

            <!-- Vital Signs Table -->
            <table class="data-table" style="width: 100%; border-collapse: collapse;">
              <thead>
              <tr style="background-color: lightgrey;">
                <th>Observation Component</th>
                <th>Value</th>
                <th>Unit</th>
              </tr>
              </thead>
              <tbody>
              <!-- Loop through the components of each observation -->
              <template v-for="(obs, obsIndex) in vitalSignObservations" :key="'obs-' + obsIndex">
                <tr
                    v-for="(component, componentIndex) in obs.component"
                    :key="'component-' + componentIndex"
                    style="background-color: white;">
                  <td>{{ component.code?.coding?.[0]?.display || 'N/A' }}</td>
                  <td>{{ component.valueQuantity?.value || 'N/A' }}</td>
                  <td>{{ component.valueQuantity?.code || 'N/A' }}</td>
                </tr>
              </template>
              </tbody>
            </table>
          </div>

          <!-- Other Observations (Tests) -->
          <div v-if="otherObservations.length">
            <h4>Other Observations (Tests)</h4>
            <table class="data-table" style="width: 100%; border-collapse: collapse;">
              <thead>
              <tr style="background-color: lightgrey;">
                <th>Date</th>
                <th>Type</th>
                <th>Interpretation</th>
                <th>Value</th> <!-- Add new column for Value -->
                <th>Notes</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="(obs, index) in otherObservations" :key="'test-' + index">
                <td style="background-color: white;">{{ obs.effectiveDateTime || 'N/A' }}</td>
                <td style="background-color: white;">{{ obs.code?.coding?.[0]?.display || 'N/A' }}</td>
                <td style="background-color: white;">
                  <!-- Add flag for "High" interpretation -->
                  <span v-if="isHigh(obs)" style="color: red; font-weight: bold; font-size: 1em; margin-right: 5px;">⚠</span>
                  {{ obs.interpretation?.[0]?.coding?.[0]?.display || 'No interpretation available' }}
                </td>
                <!-- Display valueQuantity if available -->
                <td style="background-color: white;">
          <span v-if="obs.valueQuantity">
            {{ obs.valueQuantity.value || 'N/A' }} {{ obs.valueQuantity.code || 'N/A' }}
          </span>
                  <span v-else>N/A</span>
                </td>
                <td style="background-color: white;">{{ obs.note?.[0]?.text || 'No notes available' }}</td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

        <!--    &lt;!&ndash; Card for Observations with Sorted Table &ndash;&gt;
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
            </div>-->

  </div>

  <div v-if="popOutVisible" class="pop-out-overlay" @click="closePopOut">
    <div class="pop-out-content" @click.stop>
      <h2>{{ selectedAllergy }} Information</h2>
      <p>Value: {{ selectedValue }}%</p>
      <!-- Add more details as needed -->
      <button @click="closePopOut" class="close-button">Close</button>
    </div>
  </div>


</template>

<script>
import axios from 'axios';
import Chart from 'chart.js/auto';
import {
  extractConditions,
  extractMedication,
  fetchSocialHistoryEntries,
  getEncounters,
  getObservationsByEncounterIds,
  getPatientData,
  processComposition
} from "@/services/apiService";
import ChartDataLabels from 'chartjs-plugin-datalabels';

Chart.register(ChartDataLabels);


export default {
  data() {
    return {
      patient: null,
      encounters: [],
      //observations: [],
      allergyEntries: [],
      isPatientVisible: true,
      selectedLanguage: 'en',
      isLocked: true,
      isImportantInfoVisible: true,
      isEncountersVisible: true,
      composition: null,
      composition2: null,

      observationReference: null,
      socialHistoryEntries: [],

      medications: [],
      conditions: [],


      allergies: [],
      popOutVisible: false,
      selectedAllergy: null,
      selectedValue: null,

      chart: null,

      selectedEncounter: null,
      observations: [],
      encounterIds: [],
      groupedObservations: [],
      selectedEncounterObservations: {}

    };
  },


  computed: {
    sortedEncounters() {
      return this.encounters.slice().sort((a, b) => {
        return new Date(b.period?.start || 0) - new Date(a.period?.start || 0);
      });
    },

    vitalSignObservations() {
      if (!this.selectedEncounter || !this.groupedObservations[this.selectedEncounter.id]) {
        return [];
      }
      return this.groupedObservations[this.selectedEncounter.id].filter(obs => obs.id.includes('VitalSign'));
    },
    otherObservations() {
      if (!this.selectedEncounter || !this.groupedObservations[this.selectedEncounter.id]) {
        return [];
      }
      return this.groupedObservations[this.selectedEncounter.id].filter(obs => !obs.id.includes('VitalSign'));
    },

  },


  async created() {
    try {
      // Fetch patient and other data as you already do
      this.patient = await getPatientData();
      await this.fetchOtherData();
      this.composition2 = await processComposition();
      this.medications = await extractMedication(this.composition2);
      this.conditions = await extractConditions(this.composition2);
      this.socialHistoryEntries = await fetchSocialHistoryEntries(this.composition2);

      // Fetch encounters and observations
      const encountersResponse = await getEncounters();
      if (encountersResponse && encountersResponse.encounterIds && encountersResponse.encounterObjects) {
        const { encounterIds, encounterObjects } = encountersResponse;
        this.encounterIds = encounterIds;
        this.encounters = encounterObjects;
      } else {
        console.error('Invalid response from getEncounters:', encountersResponse);
        this.encounterIds = [];
        this.encounters = [];
      }

      const encounterIds = this.sortedEncounters.map(encounter => encounter.id);

      // Fetch observations and group them by encounter ID
      this.groupedObservations = await getObservationsByEncounterIds(encounterIds);

      // Log groupedObservations to see its structure
      console.log('groupedObservations:', this.groupedObservations);

      // Check and process each encounter to add the high flag
      this.encounters = this.encounters.map(encounter => {
        // Check if any of the observations related to this encounter have a "high" interpretation
        const hasHighInterpretation = Object.values(this.groupedObservations).some(observationsArray =>
            observationsArray.some(obs =>
                obs.encounter?.reference === `Encounter/${encounter.id}` &&
                obs.interpretation?.[0]?.coding?.[0]?.display === 'High'
            )
        );
        // Attach the flag to the encounter
        return {
          ...encounter,
          hasHighInterpretation
        };
      });


    } catch (error) {
      console.error('Error in created lifecycle hook:', error);
    }
  },


  mounted() {
    this.renderChart();
  },


  methods: {
    async fetchOtherData() {
      try {
        // Fetch Allergies (Important Information) //TODO: maybe remove
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



    formatAddress(address) {
      // TODO: make it flexible if there is other data saved
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
      return addressString || 'N/A';
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

      // Expanded allergy dataset
      this.allergies = [
        { type: "Peanuts", value: 40 },
        { type: "Shellfish", value: 25 },
        { type: "Dairy", value: 15 },
        { type: "Gluten", value: 20 },
        { type: "Eggs", value: 10 },
        { type: "Soy", value: 30 },
        { type: "Wheat", value: 5 },
        { type: "Fish", value: 12 },
        { type: "Tree Nuts", value: 18 },
        { type: "Sesame", value: 8 },
        { type: "Corn", value: 22 },
        { type: "Celery", value: 7 },
        { type: "Mustard", value: 6 },
        { type: "Lupin", value: 4 },
        { type: "Sulphites", value: 11 },
      ];

      const disabledAllergies = ["Dairy", "Gluten", "Lupin", "Corn"]; // Gray-out these allergies

      this.chart = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: this.allergies.map((allergy) => allergy.type),
          datasets: [
            {
              label: "Food Allergies",
              data: this.allergies.map((allergy) => allergy.value),
              backgroundColor: this.allergies.map((allergy) =>
                  disabledAllergies.includes(allergy.type)
                      ? "#C0C0C0" // Gray-out for disabled
                      : [
                        "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0",
                        "#FF9F40", "#9966FF", "#FF5733", "#33FF57",
                        "#3380FF", "#FFC300", "#C70039", "#900C3F",
                        "#DAF7A6", "#581845", "#00BFFF",
                      ][Math.floor(Math.random() * 15)] // Assign random colors to active segments
              ),
              hoverOffset: 10,
            },
          ],
        },
        options: {
          onClick: (event, elements) => {
            if (elements.length > 0) {
              const chartElement = elements[0];
              const index = chartElement.index;
              const allergyType = this.chart.data.labels[index];

              // Prevent pop-out for disabled allergies
              if (disabledAllergies.includes(allergyType)) {
                console.log(`${allergyType} is disabled.`);
                return;
              }

              const allergyValue = this.chart.data.datasets[0].data[index];
              this.openPopOut(allergyType, allergyValue);
            }
          },
          plugins: {
            legend: {
              display: false, // Hide the default legend
            },
            datalabels: {
              color: "#000",
              font: {
                weight: "bold", // Make the text bold
              },
              formatter: (value, context) => {
                const label = context.chart.data.labels[context.dataIndex];
                return `${label}`;
              },
              anchor: "center", // Place the label inside the segment
              align: "center",  // Align the text to the center of each segment
              offset: 0,        // No offset, label will be centered
            },
            tooltip: {
              callbacks: {
                label: (tooltipItem) => {
                  const label = tooltipItem.label || "";
                  const value = tooltipItem.raw;
                  return `${label}: ${value}%`;
                },
              },
            },
          },
        },
      });
    },



    openPopOut(allergyType, allergyValue) {
      this.selectedAllergy = allergyType;
      this.selectedValue = allergyValue;
      this.popOutVisible = true;
    },
    closePopOut() {
      this.popOutVisible = false;
      this.selectedAllergy = null;
      this.selectedValue = null;
    },

    viewEncounterDetails(encounter) {
      console.log("Selected encounter:", encounter);

      const encounterId = encounter.id;
      console.log("Checking Grouped Observations for encounter ID:", encounterId);

      if (this.groupedObservations[encounterId]) {
        console.log("Grouped Observations for this encounter:", this.groupedObservations[encounterId]);
      } else {
        console.warn("No grouped observations found for encounter ID:", encounterId);
        console.log("Grouped Observations Object Keys:", Object.keys(this.groupedObservations));
      }

      this.selectedEncounter = encounter;
    },
    getObservationTitle(obs) {
      // Customize this method to extract a suitable title for the observation
      return obs.code?.coding?.[0]?.display || 'Unknown Observation';
    },

    async onEncounterRowClick(encounterId) {
      console.log(`Selected encounter ID: ${encounterId}`);
      try {
        // Fetch observations for the selected encounter ID
        const groupedObservations = await this.getObservationsByEncounterIds([encounterId]);

        // Log the grouped observations to ensure they are correctly retrieved
        console.log('Grouped Observations for this encounter:', groupedObservations);

        // Set the selected encounter's observations
        this.selectedEncounterObservations = groupedObservations[encounterId] || [];
      } catch (error) {
        console.error('Error fetching grouped observations:', error);
      }
    },

// Close the card by setting selectedEncounter to null
    closeCard() {
      this.selectedEncounter = null;
    },

    testObservations() {
      // Filter for observations that are not Vital Signs (i.e., the id does not contain "VitalSign")
      return this.filteredObservations.filter(obs => !obs.id.includes('VitalSign'));
    },
    vitalSignsObservations() {
      // Filter for observations that have "VitalSign" in the id
      return this.filteredObservations.filter(obs => obs.id.includes('VitalSign'));
    },

    getRowStyle(component) {
      // Check if the interpretation is 'high' for the component
      if (component.interpretation && component.interpretation[0]?.coding[0]?.display.toLowerCase() === 'high') {
        return { backgroundColor: 'red', color: 'white' }; // High interpretation - Red background
      }
      return {}; // Default (no highlight) for other interpretations
    },

    // For other observations (tests), highlight rows if interpretation is 'high'
    getRowStyleForTests(obs) {
      if (obs.interpretation && obs.interpretation[0]?.coding[0]?.display.toLowerCase() === 'high') {
        return { backgroundColor: 'red', color: 'white' }; // High interpretation - Red background
      }
      return {}; // Default (no highlight) for other interpretations
    },

    isHigh(obs) {
      return (
          obs.interpretation?.[0]?.coding?.[0]?.display?.toLowerCase() === "high"
      );
    },

    hasHighInterpretation(encounter) {
      // Check if any observation for this encounter has a "High" interpretation
      const observations = this.groupedObservations[encounter.id];
      if (observations) {
        return observations.some(obs =>
            obs.interpretation?.[0]?.coding?.[0]?.display === 'High'
        );
      }
      return false;
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
  margin-top: 0 ; /* Adjusted for navbar */
  padding: 20px;
}

.dashboard-card {
  flex: 1;
  margin: 10px;
  padding: 20px;
  background-color: #d3e8d3;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  text-align: center;
}

.dashboard-chart {
  flex: 2;
  margin: 10px;
  padding: 5px;
  background-color: #fff;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  display: flex; /* Change to flex for centering */
  flex-direction: column; /* Stack children (title and canvas) vertically */
  justify-content: center; /* Vertically center the content */
  align-items: center; /* Horizontally center the content */
  max-width: 600px; /* Limit the max width */
  width: 100%; /* Ensure the chart fits within the container */
  position: relative;
}

.dashboard-chart h3 {
  font-size: 1.5em;
  margin-bottom: 15px; /* Space between the title and the chart */
  color: #333; /* Adjust color as needed */
}

.dashboard-chart canvas {
  width: 80% !important; /* Ensure the canvas takes up container width */
  height: 80% !important; /* Fixed height for consistent layout */
  margin-top: 5px; /* Optional: add space between the title and the graph */
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

.dashboard-card h3 {
  margin-top: 0;
}

.medication-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.medication-table th, .medication-table td {
  padding: 10px;
  border: 1px solid #ddd;
  text-align: left;
}

.medication-table th {
  background-color: #f1f1f1;
  font-weight: bold;
}

.medication-table td {
  background-color: #fff;
}

.medication-table tr:nth-child(even) {
  background-color: #f9f9f9;
}

.medication-table td a {
  color: #007bff;
  text-decoration: none;
}

.medication-table td a:hover {
  text-decoration: underline;
}

.condition-table th, .condition-table td {
  padding: 10px;
  border: 1px solid #ddd;
  text-align: left;
}

.condition-table th {
  background-color: #f1f1f1;
  font-weight: bold;
}

.condition-table td {
  background-color: #fff;
}

.condition-table tr:nth-child(even) {
  background-color: #f9f9f9;
}

.condition-table td a {
  color: #007bff;
  text-decoration: none;
}

.condition-table td a:hover {
  text-decoration: underline;
}

button {
  background: none;
  border: none;
  color: #333;
  font-size: 20px;
  position: absolute;
  top: 10px;
  right: 10px;
  cursor: pointer;
  z-index: 1000; /* Ensure it's on top */
}

button:hover {
  color: #ff0000; /* Optional: change color on hover */
}
.data-table th, .data-table td {
  padding: 8px;
  border: 1px solid #ddd;
  text-align: left;
}
.data-table tr:nth-child(even) {
  background-color: #f9f9f9;
}
.data-table tr:hover {
  background-color: #f1f1f1;
}

.pop-out-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7); /* Darker background */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000; /* Ensure it's in the foreground */
}

.pop-out-content {
  background: white;
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  width: 80%; /* Larger width */
  max-width: 600px; /* Restrict to a maximum size */
  text-align: center;
  z-index: 1100; /* Ensure it appears above the overlay */
  position: relative;
}

.close-button {
  background-color: #ff4d4f;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 20px;
}

.close-button:hover {
  background-color: #d9363e;
}



</style>