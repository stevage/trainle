<template lang="pug">
#map.info-light3--bg(style="position:absolute;width:100%; height:100%")
</template>

<script>
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import U from "map-gl-utils";
import * as turf from "@turf/turf";
import { stations } from "../stations";
window.turf = turf;
// import { EventBus } from "../EventBus";
export default {
  props: ["guesses", "target"],
  async mounted() {
    // replace this Mapbox access token with your own
    mapboxgl.accessToken =
      "pk.eyJ1Ijoic3RldmFnZSIsImEiOiJjbG1vZGE4cXgwbjY4MmptcHN1d2M4YWYyIn0.AFsAhFFbMnuo9e3NgICpFw";
    const map = new mapboxgl.Map({
      container: "map",
      center: [144.96, -37.81],
      zoom: 12,
      style: "mapbox://styles/mapbox/light-v9",
    });
    U.init(map, mapboxgl);
    const geoGuesses = [...this.guesses, this.target].map((g) =>
      stations.find((s) => s.properties.name === g),
    );
    map.fitBounds(turf.bbox(turf.featureCollection(geoGuesses)), {
      padding: 40,
    });
    window.map = map;
    window.mapping = this;

    map.U.onLoad(() => {
      map.U.hide(/place-city/);
      map.U.addGeoJSON("trains", "trainline.geojson");
      map.U.addLine("trains-line", "trains", {
        lineColor: "hsl(180,50%,70%)",
        lineWidth: 5,
      });
      map.U.addLine("trains-line-inner", "trains", {
        lineColor: "hsl(180,50%,85%)",
        lineWidth: 3,
      });
      map.U.addSymbol("trains-label", "trains", {
        symbolPlacement: "line",
        textField: ["get", "name"],
        textColor: "hsla(180,50%,50%, 50%)",
        textSize: 28,
        textAllowOverlap: true,
      });

      map.U.addGeoJSON("stations", turf.featureCollection(stations));
      map.U.addCircle("stations-circle", "stations", {
        circleColor: [
          "case",
          ["==", ["get", "name"], this.target],
          "hsl(120,50%,70%)",
          [
            "case",
            ["in", ["get", "name"], ["literal", this.guesses]],
            "hsl(0,70%,70%)",
            "hsla(180,50%,80%,0.7)",
          ],
        ],
        circleRadius: [
          "case",
          ["==", ["get", "name"], this.target],
          6,
          ["case", ["in", ["get", "name"], ["literal", this.guesses]], 6, 2],
        ],
        circleStrokeWidth: 2,
        circleStrokeColor: [
          "case",
          ["==", ["get", "name"], this.target],
          "hsl(120,100%,30%)",
          [
            "case",
            ["in", ["get", "name"], ["literal", this.guesses]],
            "hsl(0,100%,30%)",
            "hsla(180,50%,60%,0.5)",
          ],
        ],
      });
      map.U.addSymbol("stations-label", "stations", {
        textSize: 16,
        textOffset: [0.5, 0],
        textField: ["get", "nameUp"],
        textHaloColor: "hsla(0,0%,100%,0.5)",
        textHaloWidth: 1,
        textAnchor: "left",
        filter: [
          "in",
          ["get", "name"],
          ["literal", [...this.guesses, this.target]],
        ],
      });
      map.U.addSymbol("stations-label-small", "stations", {
        textSize: 12,
        textField: ["get", "nameUp"],
        textColor: "hsl(0,0%,50%)",
        textHaloColor: "hsla(0,0%,100%,0.5)",
        textHaloWidth: 1,
        textAnchor: "left",
        textOffset: [0.5, 0],

        filter: [
          "!",
          ["in", ["get", "name"], ["literal", [...this.guesses, this.target]]],
        ],
        minzoom: 11,
      });
    });
  },
};
</script>

<style scoped></style>
