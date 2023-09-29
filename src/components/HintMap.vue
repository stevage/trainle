<template lang="pug">
#hintmap.info-light3--bg(style="position:absolute;width:100%; height:100%")
</template>

<script>
import mapboxgl from "mapbox-gl/dist/mapbox-gl-dev.js";
import "mapbox-gl/dist/mapbox-gl.css";
import U from "map-gl-utils/noflow/index";
import * as turf from "@turf/turf";
import { stations } from "../stations";
// import { EventBus } from "../EventBus";
export default {
  props: ["center", "reveal", "target"],
  async mounted() {
    mapboxgl.accessToken =
      "pk.eyJ1Ijoic3RldmFnZSIsImEiOiJjbG1vZGE4cXgwbjY4MmptcHN1d2M4YWYyIn0.AFsAhFFbMnuo9e3NgICpFw";
    const map = new mapboxgl.Map({
      container: "hintmap",
      center: this.center,
      bearing: Math.random() * 360,
      pitch: 60,
      zoom: 16,
      maxZoom: 17,
      minZoom: 16,
      style: "mapbox://styles/stevage/cln2oqki1005301py6ra652qr/draft",
      interactive: false,
    });
    U.init(map, mapboxgl);
    window.hintmap = map;
    this.hintmap = map;
    window.HintMap = this;
    let markers = [];
    map.on("sourcedata", () => {
      // if (markers.length) return;
      markers = map
        .querySourceFeatures("composite", {
          sourceLayer: "transit_stop_label",
        })
        .filter(
          (f) =>
            f.properties.network === "rail" &&
            f.properties.stop_type === "station" &&
            f.properties?.name?.toLowerCase() === this.target,
        );

      const platforms = map
        .querySourceFeatures("composite", {
          sourceLayer: "road",
        })
        .filter(
          (f) =>
            f.properties.type === "platform" &&
            f.properties.class.match(/path|pedestrian/) &&
            !(f.properties.name || "").match(/^Stop /) &&
            turf.distance(turf.centroid(f), this.center, { units: "meters" }) <
              200,
        );
      const fs = [...markers, ...platforms];
      if (fs.length) {
        this.bounds = turf.bbox(turf.featureCollection(fs));
        this.recenter();
      }
    });
  },
  methods: {
    recenter() {
      try {
        this.hintmap.fitBounds(this.bounds, {
          pitch: this.hintmap.getPitch(),
          bearing: this.hintmap.getBearing(),
          maxZoom: 17,
        });
      } catch (e) {
        // example: game 20840
        this.hintmap.setCenter(this.center);
        this.hintmap.setZoom(17);
      }
    },
  },
  watch: {
    reveal() {
      if (this.reveal) {
        this.hintmap.U.show(/./);
        this.hintmap.U.hide(/trainle/);

        this.hintmap.zoomTo(15);
        window.setTimeout(() => {
          this.hintmap.resize();
          this.recenter();
        }, 100);
      }
    },
  },
};
</script>

<style scoped></style>
