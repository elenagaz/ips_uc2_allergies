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
            <h3 class="card-title">Conditions</h3>
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

            <div v-else>
              <p>No conditions or conditions available</p>
            </div>
          </div>

          <!-- Card 2 on the Left -->
          <div class="dashboard-card">
            <h3 class="card-title">Medication</h3>
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
          <h3>Food Allergies</h3>
          <canvas id="foodAllergiesChart"></canvas>
        </div>

        <!-- Right Side-->
        <div class="dashboard-right">
          <div class="dashboard-card">
            <h3 class="card-title">All allergies</h3>
            <ul class="allergy-list">
              <!-- Loop through allergy groups -->
              <li v-for="(allergy, index) in allergyGroups" :key="index">
                <!-- Display allergy name -->
                {{ allergy }}

                <!-- Check if category includes "food" -->
                <ul v-if="allergy.toLowerCase().includes('food')">
                  <li>Allergy to cashew nut</li>
                </ul>

                <!-- If no match, display "No allergies found" -->
                <ul v-else>
                  <li>No allergies found</li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
      </div>

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
                <th style="width: 50px;">
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
          <!-- Close Button -->
          <button
              @click="selectedEncounter = null"
              style="background: none; border: none; color: #333; font-size: 30px; position: absolute; top: 15px; right: 20px; cursor: pointer;">
            &times;
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
                <th>Value</th>
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
  </div>


  <div v-if="popOutVisible" class="pop-out-overlay" @click="closePopOut">
    <div class="pop-out-content" @click.stop>
      <h2>{{ this.allergyIntolerances[0].code.coding[0].display }}</h2>
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
        <tr>
          <td>{{ this.allergyIntolerances?.[0]?.category?.join(', ') || 'N/A' }}</td>
          <td>{{ this.allergyIntolerances[0].criticality || 'N/A' }}</td>
          <td>{{ this.allergyIntolerances[0].onsetDateTime || 'N/A' }}</td>
          <td>{{ this.allergyIntolerances[0].verificationStatus.coding[0].code || 'N/A' }}</td>
          <td>{{ this.allergyIntolerances[0].reaction[0].manifestation[0].coding[0].display || 'N/A' }}</td>
          <td>{{ this.allergyIntolerances[0].reaction[0].severity || 'N/A' }}</td>
        </tr>
        </tbody>
      </table>
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
import { createI18n } from 'vue-i18n';

Chart.register(ChartDataLabels);

const i18n = createI18n({
  locale: localStorage.getItem('language') || 'en',
  //can add more here
});


export default {
  i18n,
  data() {
    return {
      patient: null,
      encounters: [],
      allergyEntries: [],
      isPatientVisible: true,
      isLocked: true,
      isImportantInfoVisible: true,
      composition: null,
      composition2: null,

      observationReference: null,
      socialHistoryEntries: [],

      medications: [],
      conditions: [],


      allergies: [],
      disabledAllergies: [],
      allergyGroups: [],
      allergies2: [], // To store the fetched allergy data
      error: null,   // To store any error messages
      loading: false, // To indicate loading state
      highlightedCodes: [],

      popOutVisible: false,
      selectedAllergy: null,
      selectedValue: null,

      chart: null,

      selectedEncounter: null,
      observations: [],
      isObservationsVisible: false,
      compositionSections: [],
      //isObservationsVisible: false,
      isEncountersVisible: true,
      allergyIntolerancesTranslated: [],
      extractedData: [],
      encounterIds: [],
      groupedObservations: [],
      selectedEncounterObservations: {},

      selectedLanguage: localStorage.getItem('language') || 'en',


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
      this.patient = await getPatientData();
      await this.fetchPatientData();

      this.composition2 = await processComposition();
      this.medications = await extractMedication(this.composition2);
      this.conditions = await extractConditions(this.composition2);
      this.socialHistoryEntries = await fetchSocialHistoryEntries(this.composition2);

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

      console.log(this.allergyIntolerances[0])
      //this.openPopOut(this.allergyIntolerances[0]) ///--------------------------------------------------------------------------------
      //console.log("----> " + this.translateLoincCode(this.otherObservations[0].code?.coding?.[0]?.code,'en'))
    } catch (error) {
      console.error('Error in created lifecycle hook:', error);
    }
  },

  methods: {
    async fetchPatientData() {
      try {
        const compositionResponse = await axios.get('https://ips-challenge.it.hs-heilbronn.de/fhir/Composition?patient=UC2-Patient');
        this.compositionSections = compositionResponse.data.entry?.map(entry => entry.resource.section).flat() || [];

      //await this.translateLoincCode("63486-5", "es-MX") //testing of this with spanish mexico + if there is no language available uses english term

      await this.fetchAllergyIntolerances(); //TODO: maybe remove

    } catch (error) {
      console.error("Error fetching data:", error);
    }
  },

/*    async fetchAllergyGroups() {
      try {
        console.log("Fetching allergy groups...");
        const response = await axios.get(
            'https://browser.ihtsdotools.org/snowstorm/snomed-ct/browser/MAIN/2024-11-01/concepts/420134006/children'
        );
        const data = response.data;

        this.allergyGroups = data.map((item) => item.pt.term);
        console.log("Allergy groups fetched:", this.allergyGroups);
      } catch (error) {
        console.error("Error fetching allergy groups:", error);
        this.error = "Failed to fetch allergy groups. Please try again later.";
      }
    },*/

    async fetchAllergyGroups() {
      try {
        console.log("Fetching allergy groups...");

        // Mock response data (since you're providing the input directly)
        const data = [
          {
            "conceptId": "782197009",
            "active": true,
            "definitionStatus": "PRIMITIVE",
            "moduleId": "900000000000207008",
            "fsn": {
              "term": "Intolerance to substance (finding)",
              "lang": "en"
            },
            "pt": {
              "term": "Intolerance to substance",
              "lang": "en"
            },
            "isLeafInferred": false,
            "id": "782197009"
          },
          {
            "conceptId": "781677003",
            "active": true,
            "definitionStatus": "FULLY_DEFINED",
            "moduleId": "900000000000207008",
            "fsn": {
              "term": "Propensity to adverse reaction to potassium (finding)",
              "lang": "en"
            },
            "pt": {
              "term": "Propensity to adverse reaction to potassium",
              "lang": "en"
            },
            "isLeafInferred": true,
            "id": "781677003"
          },
          {
            "conceptId": "609433001",
            "active": true,
            "definitionStatus": "FULLY_DEFINED",
            "moduleId": "900000000000207008",
            "fsn": {
              "term": "Hypersensitivity disposition (finding)",
              "lang": "en"
            },
            "pt": {
              "term": "Hypersensitivity disposition",
              "lang": "en"
            },
            "isLeafInferred": false,
            "id": "609433001"
          },
          {
            "conceptId": "430149006",
            "active": true,
            "definitionStatus": "PRIMITIVE",
            "moduleId": "900000000000207008",
            "fsn": {
              "term": "Cross sensitivity reaction (finding)",
              "lang": "en"
            },
            "pt": {
              "term": "Cross sensitivity reaction",
              "lang": "en"
            },
            "isLeafInferred": true,
            "id": "430149006"
          },
          {
            "conceptId": "419511003",
            "active": true,
            "definitionStatus": "FULLY_DEFINED",
            "moduleId": "900000000000207008",
            "fsn": {
              "term": "Propensity to adverse reactions to drug (finding)",
              "lang": "en"
            },
            "pt": {
              "term": "Propensity to adverse reactions to drug",
              "lang": "en"
            },
            "isLeafInferred": false,
            "id": "419511003"
          },
          {
            "conceptId": "418471000",
            "active": true,
            "definitionStatus": "FULLY_DEFINED",
            "moduleId": "900000000000207008",
            "fsn": {
              "term": "Propensity to adverse reactions to food (finding)",
              "lang": "en"
            },
            "pt": {
              "term": "Propensity to adverse reactions to food",
              "lang": "en"
            },
            "isLeafInferred": false,
            "id": "418471000"
          }
        ];

        // Map over the data and extract the pt.term values
        this.allergyGroups = data.map((item) => item.pt.term);

        console.log("Allergy groups fetched:", this.allergyGroups);
      } catch (error) {
        console.error("Error fetching allergy groups:", error);
        this.error = "Failed to fetch allergy groups. Please try again later.";
      }
    },


    /*    async fetchFoodAllergies() {
          const SNOMED_API_BASE = 'https://browser.ihtsdotools.org/snowstorm/snomed-ct/browser/MAIN/SNOMEDCT-DE/2024-05-15/concepts';
          const relevantConceptIds = ["414285001", "235719002"];

          const fetchChildren = async (conceptId) => {
            try {
              const response = await axios.get(`${SNOMED_API_BASE}/${conceptId}/children`);
              return response.data;
            } catch (error) {
              console.error(`Error fetching children for concept ${conceptId}:`, error);
              throw error;
            }
          };

          const fetchConcept = async (conceptId) => {
            try {
              const response = await axios.get(`${SNOMED_API_BASE}/${conceptId}`);
              return response.data;
            } catch (error) {
              console.error(`Error fetching concept ${conceptId}:`, error);
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

          try {
            const allergies = await Promise.all(
                relevantConceptIds.map(async (conceptId) => {
                  const concept = await fetchConcept(conceptId);
                  const subgroups = await fetchAllSubgroups(conceptId);
                  return {
                    name: concept.pt.term,
                    type: concept.pt.term, // You can adjust `type` to match your structure
                    value: Math.floor(Math.random() * 100), // Mock value for testing
                    conceptId,
                    subgroups,
                  };
                })
            );

            this.allergies = allergies;
            console.log('Food allergies fetched successfully:', allergies);

            // Call renderChart after fetching data
            this.renderChart();
          } catch (error) {
            console.error('Error fetching food allergies:', error);
            this.error = 'Failed to fetch food allergies. Please try again later.';
          }
        },*/


    async fetchFoodAllergies(){
      const allergies = [
        {
          "name": "Allergies to food",
          "items": [
            {
              "conceptId": "414285001",
              "name": "Allergy to food",
              "type": "Allergy",
              "value": 100,
              "subgroups": [
                {
                  "conceptId": "91937001",
                  "name": "Allergy to seafood",
                  "type": "Allergy",
                  "value": 70,
                  "subgroups": []
                },
                {
                  "conceptId": "91934008",
                  "name": "Allergy to nut",
                  "type": "Allergy",
                  "value": 60,
                  "subgroups": [
                    {
                      "conceptId": "48821000119104",
                      "name": "Allergy to tree nut",
                      "type": "Allergy",
                      "value": 50,
                      "subgroups": [
                        {
                          "conceptId": "712844008",
                          "name": "Allergy to macadamia nut",
                          "type": "Allergy",
                          "value": 45,
                          "subgroups": []
                        },
                        {
                          "conceptId": "712840004",
                          "name": "Allergy to hazelnut",
                          "type": "Allergy",
                          "value": 40,
                          "subgroups": []
                        },
                        {
                          "conceptId": "712839001",
                          "name": "Allergy to almond",
                          "type": "Allergy",
                          "value": 38,
                          "subgroups": []
                        },
                        {
                          "conceptId": "712838009",
                          "name": "Allergy to cashew nut",
                          "type": "Allergy",
                          "value": 35,
                          "subgroups": []
                        },
                        {
                          "conceptId": "91940001",
                          "name": "Allergy to walnut",
                          "type": "Allergy",
                          "value": 30,
                          "subgroups": []
                        }
                      ]
                    }
                  ]
                },
                {
                  "conceptId": "91932007",
                  "name": "Allergy to fruit",
                  "type": "Allergy",
                  "value": 50,
                  "subgroups": [
                    {
                      "conceptId": "23181000122104",
                      "name": "Allergy to mango fruit",
                      "type": "Allergy",
                      "value": 45,
                      "subgroups": []
                    },
                    {
                      "conceptId": "23171000122102",
                      "name": "Allergy to kiwi fruit",
                      "type": "Allergy",
                      "value": 40,
                      "subgroups": []
                    },
                    {
                      "conceptId": "13511000122108",
                      "name": "Allergy to pineapple",
                      "type": "Allergy",
                      "value": 38,
                      "subgroups": []
                    },
                    {
                      "conceptId": "860604008",
                      "name": "Allergy to apple",
                      "type": "Allergy",
                      "value": 35,
                      "subgroups": []
                    },
                    {
                      "conceptId": "714332003",
                      "name": "Allergy to banana",
                      "type": "Allergy",
                      "value": 33,
                      "subgroups": []
                    },
                    {
                      "conceptId": "419298007",
                      "name": "Allergy to watermelon",
                      "type": "Allergy",
                      "value": 30,
                      "subgroups": []
                    },
                    {
                      "conceptId": "418085001",
                      "name": "Allergy to citrus fruit",
                      "type": "Allergy",
                      "value": 28,
                      "subgroups": []
                    },
                    {
                      "conceptId": "418051002",
                      "name": "Allergy to cherry",
                      "type": "Allergy",
                      "value": 25,
                      "subgroups": []
                    },
                    {
                      "conceptId": "91938006",
                      "name": "Allergy to strawberry",
                      "type": "Allergy",
                      "value": 20,
                      "subgroups": []
                    }
                  ]
                },
                {
                  "conceptId": "16067171000119102",
                  "name": "Allergy to food additive (finding)",
                  "type": "Allergy",
                  "value": 50,
                  "subgroups": [
                    {
                      "conceptId": "294847001",
                      "name": "Allergy to gelatin",
                      "type": "Allergy",
                      "value": 45,
                      "subgroups": []
                    }
                  ]
                },
                {
                  "conceptId": "21191000122102",
                  "name": "Allergy to mustard seasoning",
                  "type": "Allergy",
                  "value": 45,
                  "subgroups": []
                },
                {
                  "conceptId": "1269425007",
                  "name": "Allergy to gluten",
                  "type": "Allergy",
                  "value": 40,
                  "subgroups": []
                },
                {
                  "conceptId": "420174000",
                  "name": "Allergy to wheat",
                  "type": "Allergy",
                  "value": 38,
                  "subgroups": []
                },
                {
                  "conceptId": "782555009",
                  "name": "Allergy to cow's milk protein",
                  "type": "Allergy",
                  "value": 35,
                  "subgroups": []
                },
                {
                  "conceptId": "213020009",
                  "name": "Allergy to egg protein",
                  "type": "Allergy",
                  "value": 33,
                  "subgroups": []
                },
                {
                  "conceptId": "418184004",
                  "name": "Allergy to rye",
                  "type": "Allergy",
                  "value": 30,
                  "subgroups": []
                },
                {
                  "conceptId": "712841000",
                  "name": "Allergy to barley",
                  "type": "Allergy",
                  "value": 28,
                  "subgroups": []
                },
                {
                  "conceptId": "294741005",
                  "name": "Allergy to guar gum",
                  "type": "Allergy",
                  "value": 25,
                  "subgroups": []
                },
                {
                  "conceptId": "294316000",
                  "name": "Allergy to olive oil",
                  "type": "Allergy",
                  "value": 20,
                  "subgroups": []
                },
                {
                  "conceptId": "294317009",
                  "name": "Allergy to Arachis oil",
                  "type": "Allergy",
                  "value": 18,
                  "subgroups": []
                },
                {
                  "conceptId": "300914000",
                  "name": "Allergy to cheese",
                  "type": "Allergy",
                  "value": 15,
                  "subgroups": []
                },
                {
                  "conceptId": "300912001",
                  "name": "Allergy to chocolate",
                  "type": "Allergy",
                  "value": 12,
                  "subgroups": []
                }
              ]
            }
          ]
        },
        {
          "name": "Intolerances",
          "items": [
            {
              "conceptId": "235719002",
              "name": "Intolerance to food (finding)",
              "type": "Intolerance",
              "value": 50,
              "subgroups": [
                {
                  "conceptId": "81781000119107",
                  "name": "Intolerance to infant formula",
                  "type": "Intolerance",
                  "value": 45,
                  "subgroups": []
                },
                {
                  "conceptId": "1269424006",
                  "name": "Gluten intolerance",
                  "type": "Intolerance",
                  "value": 40,
                  "subgroups": []
                },
                {
                  "conceptId": "782415009",
                  "name": "Intolerance to lactose",
                  "type": "Intolerance",
                  "value": 38,
                  "subgroups": []
                },
                {
                  "conceptId": "782338006",
                  "name": "Intolerance to monosodium glutamate",
                  "type": "Intolerance",
                  "value": 35,
                  "subgroups": []
                },
                {
                  "conceptId": "700095006",
                  "name": "Intolerance to wheat",
                  "type": "Intolerance",
                  "value": 30,
                  "subgroups": []
                },
                {
                  "conceptId": "700094005",
                  "name": "Intolerance to milk",
                  "type": "Intolerance",
                  "value": 28,
                  "subgroups": []
                }
              ]
            }
          ]
        }
      ]

      this.allergies = allergies;
      console.log('Food allergies fetched successfully:', allergies);
      //await this.fetchAllergyIntolerances(); //TODO: maybe remove


      // Call renderChart after fetching data
      this.renderChart();
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

      // this is added to test the translation on the console
      //this.extractedData2 = this.translateSnomedCode(this.extractedData.allergySnomedCode,'fr')
      //console.log(this.extractedData2);

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
    //find lang = language code in response code
    return descriptions.find(desc => desc.lang === language).term;
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
      localStorage.setItem('language', this.selectedLanguage); // Save selected language
      location.reload(); // Reload the page
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
      const code = "712838009";
      const criticallity = "high";

      const secondLevelAllergies = this.allergies.flatMap((category) =>
          category.items.flatMap((item) =>
              item.subgroups.map((subgroup) => ({
                name: subgroup.name
                    .replace(/^(Allergy to|Intolerance to)\s+/i, "")  // Remove "Allergy to" or "Intolerance to"
                    .replace(/\(finding\)$/i, ""),  // Remove "(finding)" at the end of the name
                fullName: subgroup.name, // Full name for tooltip
                conceptId: subgroup.conceptId, // Code for matching
                type: item.type.toLowerCase(), // Use parent item type (either 'allergy' or 'intolerance')
                value: subgroup.value, // Value from subgroup
              }))
          )
      );


      this.highlightedCodes = this.findSubclassByCode(code, criticallity);
      console.log(this.highlightedCodes)

      // Assign equal value to each second-level allergy
      const equalValue = 100 / secondLevelAllergies.length; // Each gets an equal space

      this.chart = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: secondLevelAllergies.map((subgroup) => subgroup.name), // Cleaned-up names
          datasets: [
            {
              label: "Food Allergies and Intolerances",
              data: secondLevelAllergies.map(() => equalValue), // Equal value for all
              backgroundColor: secondLevelAllergies.map((subgroup) => {
                if (this.highlightedCodes.includes(subgroup.conceptId)) {
                  return "#FF0000"; // Highlight red for matching codes
                }
                return subgroup.type === "intolerance" ? "#A9A9A9" : "#D3D3D3"; // Dark gray for intolerance, Light gray for allergy
              }),
              hoverOffset: 10,
            },
          ],
        },
        options: {
          plugins: {
            legend: {
              display: true,
              position: "bottom",
              labels: {
                usePointStyle: true,
                boxWidth: 15,
                font: {
                  size: 12,
                },
                generateLabels: () => {
                  return [
                    { text: "High Risk", fillStyle: "#FF0000" },
                    { text: "Intolerance", fillStyle: "#A9A9A9" },
                    { text: "Allergy", fillStyle: "#D3D3D3" },
                  ];
                },
              },
            },
            tooltip: {
              callbacks: {
                label: (tooltipItem) => {
                  const index = tooltipItem.dataIndex;
                  return secondLevelAllergies[index].fullName; // Full name without percentage
                },
              },
            },
            datalabels: {
              color: "#000",
              font: {
                weight: "bold",
              },
              formatter: (value, context) => {
                const label = context.chart.data.labels[context.dataIndex];
                return `${label}`;
              },
              anchor: "center",
              align: "center",
              offset: 0,
            },
          },
          onClick: (event, elements) => {
            if (elements?.length > 0) {
              const chartElement = elements[0];
              const index = chartElement.index;

              // Check if the clicked section is highlighted
              const conceptId = secondLevelAllergies[index]?.conceptId;
              if (conceptId && this.highlightedCodes.includes(conceptId)) {
                // Open pop-out window with allergy information
                const allergyType = secondLevelAllergies[index]?.fullName || "Unknown Allergy";
                this.openPopOut(allergyType);
              }
            }
          },
        },
      });
    },

    findSubclassByCode(code, criticality) {
      if (!this.allergies || this.allergies.length === 0) {
        console.error("Allergies data is missing or empty.");
        return [];
      }

      console.log("Searching for code:", code, "with criticality:", criticality);
      console.log("Allergies data:", this.allergies);

      // Array to collect the second-level parent conceptIds that contain the matched subgroup
      const secondLevelParentCodes = [];

      // Function to search recursively through all subgroups and capture second-level parent conceptId
      const searchHierarchy = (group, parentGroup, grandparentGroup) => {
        // Check if the current group matches the given code
        if (group.conceptId === code) {
          console.log("Match found:", group.name, "under", parentGroup.name);

          // If we find a match, store the conceptId of the grandparent (second-level parent)
          if (grandparentGroup && !secondLevelParentCodes.includes(grandparentGroup.conceptId)) {
            secondLevelParentCodes.push(grandparentGroup.conceptId);
          }
        }

        // Recursively search within subgroups (children)
        if (group.subgroups && group.subgroups.length > 0) {
          for (const child of group.subgroups) {
            // Pass the current group as the parent and the parent as the grandparent
            searchHierarchy(child, group, parentGroup);
          }
        }
      };

      // Loop through top-level allergies (both "Allergies" and "Intolerances")
      for (const allergyGroup of this.allergies) {
        if (Array.isArray(allergyGroup.items)) {
          // Iterate through each top-level allergy or intolerance group
          for (const group of allergyGroup.items) {
            // Search within the current top-level group and its subgroups
            searchHierarchy(group, null, null); // Pass null as the initial parent and grandparent
          }
        }
      }

      console.log("Second-level parent conceptIds:", secondLevelParentCodes);

      // If a match was found, return the second-level parent conceptId(s), otherwise return an empty array
      return secondLevelParentCodes.length > 0 ? secondLevelParentCodes : [];
    },





    openPopOut(allergyType) {
      this.selectedAllergy = allergyType;
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
},


mounted() {
  this.fetchPatientData();
  this.fetchFoodAllergies();
  this.fetchAllergyGroups();
  this.renderChart();


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

.dashboard-card {
  text-align: left; /* Default text alignment for card content */
  padding: 1rem;    /* Add padding for better layout */
}

.card-title {
  text-align: center; /* Center-align the title */
  margin-bottom: 1rem; /* Add spacing below the title */
  font-size: 1.5rem; /* Adjust font size for prominence */
}

.allergy-list {
  list-style: none; /* Remove bullet points */
  padding: 0;       /* Remove default padding */
  margin: 0;        /* Remove default margin */
}

.allergy-list li {
  padding: 0.5rem 0; /* Add space between list items */
  font-size: 1rem;   /* Adjust font size for readability */
}


</style>