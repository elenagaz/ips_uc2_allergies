<template>
  <div id="app">
    <StartPage msg="Patient data" />
  </div>
</template>

<script>
import StartPage from './components/StartPage.vue';

export default {
  name: 'App',
  components: {
    StartPage
  }
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
