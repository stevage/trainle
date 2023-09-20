<script setup>
// import "tachyons";
window.g = getShortestPath;
import Map from "./components/Map.vue";
import pseudoRandom from "pseudo-random";
</script>

<template lang="pug">
v-app
  v-container.px-2.px-sm-4.px-md-6
    //- .pa3.flex.flex-column(style="font-family:sans-serif; height:100vh; ")
    div(style="flex-grow:1")
      h1.text-h4.text-lg-h2.text-center 🚂 Trainle
        span(v-if="isUnlimited()") Unlimited
        span(v-else)  \#{{ gameNumber }}
        span 🚂
      v-sheet.my-5
        .text-body-1 Each day there is a secret target station on Melbourne's metro train network.
        .text-body-1.mt-4 Guess a station to see how many stations to the target, and the distance as the crow flies.

        .text-body-1.mt-4(v-if="isUnlimited()") Refresh the page to get a new target station.


      v-text-field(label="Guess a station" placeholder="Flinders Street" v-model="currentGuess" :disabled="win || fail" @keyup="alert=''" @keyup.enter="guess"  :error-messages="alert" autofocus )
        template(v-slot:append)
          v-btn(@click="guess" :disabled="!currentGuess || win || fail") Guess

      v-expand-transition
        v-table(v-if="guesses.length")
          thead
            tr
              th Guess

              th By train
              th Crow flies

          tbody
            tr(v-for="(guess,i) in guesses")
              th {{ titleCase(guess.station) }}
              td {{ actionSymbol(guess.result) }}&nbsp;{{ guess.result }} {{ guess.result === 1 ? 'stop' : 'stops' }}
              td {{ guess.distance }} km
      v-expand-transition
        v-card.mt-12.mb-12.bg-blue-lighten-6(v-show="guesses.length && (hints.length || playing)" title="Need a hint?")
          v-card-text
            v-table.bg-blue-lighten-5(v-if="hints.length" density="compact")
              tbody
                tr(v-for="(hint,i) in hints")
                  td Hint&nbsp;{{ i+1 }}
                  td
                    span(style="font-family:Lucida Console,courier new,monospace") {{ hint }}
                    //- span(style="font-family:Lucida Console,courier new,monospace" v-html="hint.replace(/, */g,'<br>')")
            p(v-else) Each hint gives you clues about the names of stations near your last guess.
          v-card-actions(v-if="playing")
            v-btn(v-if="hintsLeft > 0 && guesses.length" variant="tonal" @click="hint") Hint ({{ hintsLeft }} left)
            v-btn.bg-blue-lighten-4(v-if="hintsLeft === 0 && playing" type="submit" @click="giveup") Give up

      template(v-if="win || fail")
        v-card.elevation-8.my-2( style="border: 1px solid hsl(180,0%,70%)" :title="`${win ? 'Yes! ' : ''}The station is ${ titleCase(target)}.`" :class="{ 'bg-green-lighten-5': win, 'bg-red-lighten-5': fail }")
          v-card-text
            div(v-html="shareText.replace(/\\n/g,'<br>')")
          v-card-actions
            v-btn.my-4.bg-white(@click="copyWin" ) Copy text
      .map-container(v-if="fail || win" style="width:100%; height:calc(max(50vh, 200px)); position:relative")
        Map( :guesses="guesses.map(g=>g.station)" :target="target")

      #game-over
      button#restart(v-if="isUnlimited() && (fail || win)" type="submit" @click="restart") Play again
    v-bottom-navigation
      v-footer Made by&nbsp;
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
    // document
    //   .querySelector("#guess-input")
    //   .addEventListener("keyup", (event) => {
    //     if (event.key !== "Enter") return; // Use `.key` instead.
    //     this.guess();
    //     event.preventDefault(); // No need to `return false;`.
    // });
    // document.querySelector("#guess-input").focus();
  },
  methods: {
    titleCase(s) {
      return s
        .split(" ")
        .map((w) => w[0].toUpperCase() + w.slice(1))
        .join(" ");
    },
    actionSymbol(result) {
      if (result > 20) {
        return "🟥";
      } else if (result > 5) {
        return "🟧";
        // } else if (result === 0) {
        //   return "🎉";
      } else {
        return "🟩";
      }
    },
    guess() {
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
      this.actions.push(this.actionSymbol(result.length - 1));
      if (guess === this.target) {
        this.win = true;
        this.actions.push("🎉");
        document
          .querySelector("#game-over")
          .scrollIntoView({ behaviour: "smooth" });
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
      if (window.location.hostname !== "localhosta") this.loadCookie();
    },
    giveup() {
      this.fail = true;
      this.actions.push("☠");
      this.updateCookie();
      document
        .querySelector("#game-over")
        .scrollIntoView({ behaviour: "smooth" });
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
        console.log(cookie);
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
    validateStation(v) {
      return !v || stationNames.includes(v.toLowerCase().trim());
    },
  },
  computed: {
    playing() {
      return !this.win && !this.fail;
    },
    daysSinceStart() {
      const midnightOfToday = new Date();
      midnightOfToday.setHours(0, 0, 0, 0);
      const midnightOfStart = new Date("2023-09-19");
      midnightOfStart.setHours(0, 0, 0, 0);

      const diff = midnightOfToday.getTime() - midnightOfStart.getTime();
      return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
    },
    shareText() {
      return `I ${this.win ? "solved" : "gave up on"} 🚂Trainle #${
        this.gameNumber
      } ${this.win ? "in" : "after"} ${this.guesses.length} guesses${
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
