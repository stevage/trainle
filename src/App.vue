<script setup>
import "tachyons";
window.g = getShortestPath;
import Map from "./components/Map.vue";
import pseudoRandom from "pseudo-random";
</script>

<template lang="pug">
.pa3.flex.flex-column(style="font-family:sans-serif; height:100vh; ")
  div(style="flex-grow:1")
    h1.tc 🚂 Trainle
      span(v-if="isUnlimited()") Unlimited
      span(v-else)  \#{{ gameNumber }} 🚂
    p Guess the station on Melbourne's metro train network.
    p After each guess you will see how many stations away the target station is, and the straight-line distance.

    p(v-if="isUnlimited()") Refresh the page to get a new target station.

    div(v-if="!win && !fail")
      label.mt5
        span.db.w4.gray Station name
        input#guess-input.h3(type="text" v-model="currentGuess" placeholder="Flinders Street" :disabled="win || fail")
      button#guess.ml1.h3.pa2(type="submit" @click="guess" :disabled="win || fail") Guess
      div
        //- span.dib
        span.red(v-if="alert" ) {{ alert }}
    div.mt3
      table
        tr(v-for="guess in guesses")
          td.pr4.mr1.pa1 {{ titleCase(guess.station) }}
          td.pr4 {{ guess.result }} {{ guess.result === 1 ? 'stop' : 'stops' }}
          td {{ guess.distance }} km
    div(v-if="hints.length")
      h2 Hints
      div.pa2(v-for="(hint,i) in hints")
        .mr3.dib Hint {{ i+1 }}:
        span(style="font-family:Lucida Console,courier new,monospace") {{ hint }}
    div(v-if="win")
      h2 Yes! The station is&nbsp;
        span  {{ titleCase(target)}}.

    div(v-else-if="fail")
      h2
        span The station is&nbsp;
        span  {{ titleCase(target)}}.
    div(v-else)
      button.db.mt4.pa2(v-if="hintsLeft > 0 && guesses.length" type="submit" @click="hint") Hint ({{ hintsLeft }} left)
      button.db.mt4.pa2(v-if="hintsLeft === 0" type="submit" @click="giveup") Give up
    div.pa3.mv4.shadow-1(v-if="win || fail" style="border: 1px solid hsl(180,0%,70%)")
        div(v-html="shareText.replace(/\\n/g,'<br>')")
        button(@click="copyWin") Copy
    .map-container(v-if="fail || win" style="width:100%; height:calc(max(50vh, 200px)); position:relative")
      Map( :guesses="guesses.map(g=>g.station)" :target="target")

    button#restart(v-if="isUnlimited() && (fail || win)" type="submit" @click="restart") Play again
  footer.h1(style="flex-grow:0") Made by&nbsp;
    a(href="https://hire.stevebennett.me") Steve Bennett
    | .

</template>

<script>
// @ts-nocheck
import {
  getShortestPath,
  stationNames,
  stationDistance,
  hintForStation,
} from "./stations";
export default {
  data: () => ({
    target: null,
    currentGuess: "",
    guesses: [],
    hints: [],
    alert: "",
    win: false,
    fail: false,
    gameNumber: 0,
    hintsLeft: undefined,
    actions: [],
    hintsAllowed: 3,
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
    document.querySelector("#guess-input").focus();
  },
  methods: {
    titleCase(s) {
      return s
        .split(" ")
        .map((w) => w[0].toUpperCase() + w.slice(1))
        .join(" ");
    },
    guess() {
      function actionSymbol(result) {
        if (result > 20) {
          return "🟥";
        } else if (result > 5) {
          return "🟧";
          // } else if (result === 0) {
          //   return "🎉";
        } else {
          return "🟩";
        }
      }
      const guess = this.currentGuess.toLowerCase().trim();
      if (this.guesses.map((g) => g.station).includes(guess)) {
        this.alert = "You already guessed that station";
        return;
      }
      if (!stationNames.includes(guess)) {
        this.alert = "Invalid station name";
        return;
      }
      this.alert = "";
      const result = getShortestPath(this.target, guess);
      const distance = Math.round(stationDistance(this.target, guess));
      this.guesses.push({
        station: guess,
        result: result.length - 1,
        distance,
      });
      this.actions.push(actionSymbol(result.length - 1));
      if (guess === this.target) {
        this.win = true;
        this.actions.push("🎉");
        return;
      }
      this.currentGuess = "";
      this.updateCookie();
    },
    getGameNumber() {
      if (window.location.search.match(/game=\d\d\d\d/)) {
        return window.location.search.match(/game=(\d+)/)[1];
      } else if (this.isUnlimited()) {
        return Math.floor(Math.random() * 100000 + 1000);
      }
      return this.daysSinceStart;
      // const d = new Date();
      // return `${d.getYear()}0${d.getMonth()}0${d.getDate()}`;
    },
    isUnlimited() {
      return window.location.search.match(/unlimited/);
    },
    restart() {
      this.win = false;
      this.fail = false;
      this.hintsLeft = this.hintsAllowed;
      this.guesses = [];
      this.hints = [];
      this.actions = [];
      this.gameNumber = this.getGameNumber();
      const prng = pseudoRandom(this.gameNumber * 47 + 9867);
      this.target =
        stationNames[Math.floor(prng.random() * stationNames.length)];
      this.loadCookie();
    },
    giveup() {
      this.fail = true;
      this.actions.push("☠");
      this.updateCookie();
    },
    hint() {
      const hintText = hintForStation(
        this.guesses.slice(-1)[0].station,
        this.target,
        this.hintsLeft,
      );
      this.hintsLeft -= 1;
      this.hints.push(hintText);
      this.actions.push("🛟");
      this.updateCookie();
    },

    copyWin() {
      // const url = `https://stevage.github.io/trainle/?game=${this.getGameNumber()}`;
      navigator.clipboard.writeText(this.shareText);
    },
    updateCookie() {
      try {
        localStorage.setItem(
          this.gameNumber,
          JSON.stringify({
            guesses: this.guesses,
            hints: this.hints,
            actions: this.actions,
            hintsLeft: this.hintsLeft,
            win: this.win,
            fail: this.fail,
            gameNumber: this.gameNumber,
          }),
        );
      } catch (e) {
        console.log(e);
      }
    },
    loadCookie() {
      try {
        const cookie = localStorage.getItem(this.gameNumber);
        if (cookie) {
          const data = JSON.parse(cookie);
          this.guesses = data.guesses;
          this.hints = data.hints;
          this.actions = data.actions;
          this.hintsLeft = data.hintsLeft;
          this.win = data.win;
          this.fail = data.fail;
        }
      } catch (e) {
        console.log(e);
      }
    },
  },
  computed: {
    daysSinceStart() {
      const midnightOfToday = new Date();
      midnightOfToday.setHours(0, 0, 0, 0);
      const midnightOfStart = new Date("2023-09-19");
      midnightOfStart.setHours(0, 0, 0, 0);

      const diff = midnightOfToday.getTime() - midnightOfStart.getTime();
      return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
    },
    shareText() {
      return `I ${this.win ? "solved" : "couldn't solve"} 🚂Trainle #${
        this.gameNumber
      } in ${this.guesses.length} guesses${
        this.hintsLeft < this.hintsAllowed
          ? " with " + (this.hintsAllowed - this.hintsLeft) + " hints"
          : ""
      }.\n${this.actions.join("")}\n stevage.github.io/trainle${
        this.gameNumber !== this.daysSinceStart
          ? `?game=${this.gameNumber}`
          : ""
      }`;
    },
  },
  watch: {},
};
</script>
<style scoped></style>
