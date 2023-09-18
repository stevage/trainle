<script setup lang="ts">
import "tachyons";
window.g = getShortestPath;
</script>

<template lang="pug">
.pa3(style="font-family:sans-serif")
  h1 Trainle
  p Guess the station on Melbourne's metro train network. After each guess you will be told the minimum number of stops to get to the target station, plus the straight line distance.

  p Refresh the page to get a new target station.

  label.mt5
    span.dib.w4 Station name
    input#guess-input(type="text" v-model="currentGuess" placeholder="Flinders Street" :disabled="win || fail")
  button#guess(type="submit" @click="guess" :disabled="win || fail") Guess
  div
    span.dib.w4
    span.red(v-if="alert" ) {{ alert }}
  div.mt3
    div(v-for="guess in guesses")
      span.dib.w5.mr3.pa1 {{ titleCase(guess.station) }}
      span.dib.w4 {{ guess.result }} stops
      span.dib {{ guess.distance }} km
  div(v-if="win")
    h2 Yes!
      span The station is&nbsp;
      span  {{ titleCase(target)}}.
    button#restart(type="submit" @click="restart") Play again
  div(v-else-if="fail")
    h2
      span The station is&nbsp;
      span  {{ titleCase(target)}}.
    button#restart(type="submit" @click="restart") Play again
  div(v-else)
    button#restart(type="submit" @click="giveup") Give up

</template>

<script lang="ts">
import { getShortestPath, stationNames, stationDistance } from "./stations";
export default {
  data: () => ({
    target: null,
    currentGuess: "",
    guesses: [],
    alert: "",
    win: false,
    fail: false,
  }),
  created() {
    window.app = this;
    this.restart();
  },
  mounted() {
    document
      .querySelector("#guess-input")
      .addEventListener("keyup", (event) => {
        if (event.key !== "Enter") return; // Use `.key` instead.
        this.guess();
        event.preventDefault(); // No need to `return false;`.
      });
  },
  methods: {
    titleCase(s) {
      return s
        .split(" ")
        .map((w) => w[0].toUpperCase() + w.slice(1))
        .join(" ");
    },
    guess() {
      if (this.currentGuess === this.target) {
        this.win = true;
        return;
      }
      if (!stationNames.includes(this.currentGuess)) {
        this.alert = "Invalid station name";
        return;
      }
      this.alert = "";
      const result = getShortestPath(
        this.target,
        this.currentGuess.toLowerCase(),
      );
      const distance = Math.round(
        stationDistance(this.target, this.currentGuess.toLowerCase()),
      );
      this.guesses.push({
        station: this.currentGuess,
        result: result.length - 1,
        distance,
      });
    },
    restart() {
      this.win = false;
      this.fail = false;
      this.target =
        stationNames[Math.floor(Math.random() * stationNames.length)];
    },
    giveup() {
      this.fail = true;
    },
  },
};
</script>
<style scoped></style>
