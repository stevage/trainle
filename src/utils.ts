import { stationNames } from "./stations";
import shuffle from "fisher-yates";

import pseudoRandom from "pseudo-random";

import stations_v1 from "./assets/solutions1.json";
import stations_v2 from "./assets/solutions2.json";

// precalculate target stations, avoiding short repeats
function makeTargets(): string[] {
  const ret = [];
  const prng = pseudoRandom(8184);
  const choices = shuffle([...stationNames], prng.random);
  const avg = (a: number, b: number, skew = 0.5) => a * skew + b * (1 - skew);
  for (let i = 0; i < 1000; i++) {
    const n = avg(prng.random() * prng.random(), Math.sin(prng.random()), 0.95);
    const x = Math.floor(n * (choices.length - 3));
    ret.push(choices[x]);
    choices.splice(x, 1);
    choices.push(ret[i]);
  }
  // console.log(ret);
  return ret;
}

// const targets = makeTargets();
export function targetForGameNumber(gameNumber: number) {
  const prng = pseudoRandom(3411098);
  const stations = shuffle(stationNames, prng.random);

  if (gameNumber <= 35) {
    return stations[gameNumber % stations.length];
  } else if (gameNumber < 290) {
    return stations_v1[gameNumber];
  } else {
    return stations_v2[gameNumber];
  }
}
