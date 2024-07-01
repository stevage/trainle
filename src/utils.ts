import { stationNames_v1, stationNames_v2} from "./stations";
import shuffle from "fisher-yates";

import pseudoRandom from "pseudo-random";


// precalculate target stations, avoiding short repeats
function makeTargets([...sn]): string[] {
  const ret = [];
  const prng = pseudoRandom(8184);
  const choices = shuffle([...sn], prng.random);
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

const targets_v1 = makeTargets(stationNames_v1);
const targets_v2 = makeTargets(stationNames_v2);
const defaultTargets = targets_v2
export function targetForGameNumber(gameNumber: number) {
  const prng = pseudoRandom(3411098);
  // To not break games pre-East Pakenham
  const stations = shuffle(stationNames_v1, prng.random);
  if (gameNumber <= 35) {
    return stations[gameNumber % stations.length];
  }
  // json v1 
  else if (gameNumber <= 288) {
    return targets_v1[gameNumber]
  }
  // if we get past 1000 games
  else if (gameNumber >= defaultTargets.length) {
    return stations[gameNumber % stations.length];
  } 
  // json v2
  else {
    return defaultTargets[gameNumber];
  }
}
