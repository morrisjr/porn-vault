<template>
  <v-container fluid>
    <div class="pb-4">
      <v-checkbox hide-details v-model="showWarn" label="Show warnings"></v-checkbox>
      <v-checkbox hide-details v-model="showLog" label="Show dev logs"></v-checkbox>
      <v-checkbox hide-details v-model="showHttp" label="Show HTTP routing"></v-checkbox>
      <div class="log-option">
        <v-select
          color="primary"
          label="Refresh rate"
          placeholder="Rate to periodically fetch logs"
          :items="refreshRates"
          v-model="refreshRate"
          @change="onRefreshRateChange"
          item-value="value"
          item-text="text"
        />
      </div>
    </div>
    <div class="pa-2 output white--text">
      <div v-for="(item, i) in filtered" :key="i" :style="'color: ' + fontColor(item.type)">
        {{ new Date(item.date).toLocaleString() }}:
        <span class="font-weight-bold" style="text-transform: uppercase">{{ item.type }}:</span>
        {{ item.text }}
      </div>
    </div>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import Axios from "axios";
import { serverBase } from "@/apollo";

@Component
export default class Logs extends Vue {
  showLog = false;
  showHttp = false;
  showWarn = true;

  logs = [] as any[];

  refreshRates = [
    {
      text: "No Refresh",
      value: -1,
    },
    {
      text: "5 seconds",
      value: 5 * 1000,
    },
    {
      text: "15 seconds",
      value: 15 * 1000,
    },
    {
      text: "30 seconds",
      value: 30 * 1000,
    },
  ];
  refreshRate: number = 0;
  logsTimeout: number | null = null;

  onRefreshRateChange() {
    if (this.refreshRate > 0) {
      this.fetchLogs();
    } else if (this.logsTimeout) {
      window.clearTimeout(this.logsTimeout);
    }
  }

  get filtered() {
    let logs = this.logs;

    logs = logs.filter((l) => {
      if (
        (!this.showHttp && l.type === "http") ||
        (!this.showLog && l.type === "log") ||
        (!this.showWarn && l.type === "warn")
      ) {
        return false;
      }

      return true;
    });

    return logs;
  }

  fontColor(type: string) {
    return {
      log: "#60b0ff",
      error: "#ff3040",
      http: "#aaaaff",
      warn: "#ffdd66",
      message: "#ffffff",
      success: "#aaff85",
    }[type];
  }

  async fetchLogs() {
    if (this.logsTimeout) {
      window.clearTimeout(this.logsTimeout);
    }

    try {
      const res = (await Axios.get(
        `${serverBase}/log?password=${localStorage.getItem("password")}`
      )) as any;
      this.logs = res.data;
    } catch (err) {
      console.error(err);
    }

    if (this.refreshRate > 0) {
      this.logsTimeout = window.setTimeout(() => this.fetchLogs(), this.refreshRate);
    }
  }

  mounted() {
    this.fetchLogs();
  }
}
</script>

<style scoped>
.output {
  background: #090909;
  border-radius: 4px;
}

.log-option {
  margin-top: 16px;
  padding-top: 4px;
}
</style>
