<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="8">
        <v-card class="mb-3">
          <div class="d-flex flex-column align-center pt-3">
            <v-img src="/assets/favicon.png" max-width="5vw"></v-img>
            <v-card-title>Porn Vault</v-card-title>
          </div>
        </v-card>
        <v-card class="mb-3">
          <v-card-title>Setup</v-card-title>

          <v-stepper v-model="setupStep">
            <v-stepper-header>
              <v-stepper-step step="1" editable :complete="configOK"> Load config </v-stepper-step>

              <v-divider></v-divider>

              <v-stepper-step
                step="2"
                editable
                :complete="status && status.izzyStatus === ServiceStatus.Connected"
                :rules="[
                  () =>
                    (!status && loadingConfig) ||
                    (status && status.izzyStatus === ServiceStatus.Connected),
                ]"
              >
                Load database
              </v-stepper-step>

              <v-divider></v-divider>

              <v-stepper-step
                step="3"
                editable
                :complete="status && status.esStatus === ServiceStatus.Connected"
                :rules="[
                  () =>
                    (!status && loadingConfig) ||
                    (status && status.esStatus === ServiceStatus.Connected),
                ]"
              >
                Load search engine
              </v-stepper-step>
            </v-stepper-header>
          </v-stepper>

          <v-stepper v-model="setupStep">
            <v-stepper-content step="1">
              <v-card :loading="loadingConfig">
                <v-card-text>
                  <p v-if="!config && loadingConfig">Loading...</p>
                  <template v-else-if="loadConfigError">
                    <p>Error loading config.</p>
                    <v-btn class="text-none" :disabled="loadingConfig" @click="loadConfig"
                      >Reload</v-btn
                    >
                  </template>
                  <template v-else-if="config">
                    <p>Location: {{ config.location }}</p>
                    <Code class="config-code" :content="config.value"></Code>
                  </template>
                </v-card-text>
                <v-card-actions>
                  <v-btn
                    class="text-none"
                    :disabled="loadingConfig"
                    @click="loadConfig"
                    color="secondary"
                    >Refresh config</v-btn
                  >
                </v-card-actions>
              </v-card>
              <v-btn
                class="mt-3 text-none"
                color="primary"
                @click="setupStep = 2"
                :disabled="config && config.error"
              >
                Continue
              </v-btn>
            </v-stepper-content>

            <v-stepper-content step="2">
              <v-card :loading="loadingStatus">
                <v-card-title>Izzy</v-card-title>
                <v-card-text>
                  <p v-if="!status && loadingStatus">Loading...</p>
                  <template v-else-if="loadStatusError">
                    <p>Error loading status.</p>
                  </template>
                  <template v-else-if="status">
                    <div class="d-flex align-center">
                      Status: {{ status.izzyStatus }}
                      <v-icon
                        class="ml-1"
                        v-if="status.izzyStatus === ServiceStatus.Connected"
                        color="green"
                        dense
                        >mdi-check</v-icon
                      >
                      <v-icon class="ml-1" v-else color="error" dense>mdi-alert-circle</v-icon>
                    </div>
                    <div>Version: {{ status.izzyVersion }}</div>
                  </template>
                </v-card-text>
              </v-card>
              <v-btn
                class="mt-3 text-none"
                color="primary"
                @click="setupStep = 3"
                :disabled="status && status.izzyStatus !== ServiceStatus.Connected"
              >
                Continue
              </v-btn>
            </v-stepper-content>

            <v-stepper-content step="3">
              <v-card :loading="loadingStatus">
                <v-card-title>Elasticsearch</v-card-title>
                <v-card-text>
                  <p v-if="!status && loadingStatus">Loading...</p>
                  <template v-else-if="loadStatusError">
                    <p>Error loading status.</p>
                  </template>
                  <template v-else-if="status">
                    <div class="d-flex align-center">
                      Status: {{ status.esStatus }}
                      <v-icon
                        class="ml-1"
                        v-if="status.esStatus === ServiceStatus.Connected"
                        color="green"
                        dense
                        >mdi-check</v-icon
                      >
                      <v-icon class="ml-1" v-else color="error" dense>mdi-alert-circle</v-icon>
                    </div>
                    <div>Version: {{ status.esVersion }}</div>
                    <v-divider class="my-3"></v-divider>
                    <v-subheader class="pl-0">Index build progress</v-subheader>
                    <v-simple-table>
                      <template #default>
                        <thead>
                          <tr>
                            <th class="text-left">Name</th>
                            <th class="text-left">Indexed count</th>
                            <th class="text-left">Total count to index</th>
                            <th class="text-left">ETA</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr :key="index.name" v-for="index in status.indexBuildProgress">
                            <td>{{ index.name }}</td>
                            <td>{{ index.indexedCount }}</td>
                            <td>{{ index.totalToIndexCount }}</td>
                            <td>{{ indexEta(index.eta) }}</td>
                          </tr>
                        </tbody>
                      </template>
                    </v-simple-table></template
                  >
                </v-card-text>
              </v-card>
              <v-btn
                class="mt-3 text-none"
                color="primary"
                @click="goHome"
                :disabled="!servicesReady"
              >
                Finish
              </v-btn>
            </v-stepper-content></v-stepper
          >
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { ServiceStatus, StatusData } from "@/types/status";
import Code from "@/components/Code.vue";
import Axios from "axios";
import { getStatus } from "../api/system";
import moment from "moment";

interface IConfig {
  location: string;
  value: any;
  error: any;
}

@Component({
  components: {
    Code,
  },
})
export default class Setup extends Vue {
  ServiceStatus = ServiceStatus;

  setupStep = 1;

  config: IConfig = {
    location: "",
    value: {},
    error: false,
  };
  loadingConfig = true;
  loadConfigError = false;

  status: StatusData | null = null;
  loadingStatus = true;
  loadStatusError = false;

  async loadConfig() {
    this.loadingConfig = true;
    this.loadConfigError = false;

    try {
      const res = await Axios.get("/api/config", {
        params: { password: localStorage.getItem("password") },
      });
      this.config = res.data as IConfig;
    } catch (err) {
      console.error(err);
      this.loadConfigError = true;
    }

    this.loadingConfig = false;
  }

  get configOK() {
    return (!this.config && this.loadingConfig) || (this.config && !this.config.error);
  }

  async loadStatus() {
    this.loadingStatus = true;
    this.loadStatusError = false;

    try {
      const res = await getStatus();
      this.status = res.data;
    } catch (err) {
      console.error(err);
      this.loadStatusError = true;
    }

    this.loadingStatus = false;

    setTimeout(this.loadStatus, 1000);
  }

  indexEta(eta: number): string {
    if (eta < 0) {
      return "";
    }

    const start = moment();

    const endETA = start.clone().add(eta, "seconds");
    const diffETA = endETA.diff(start);

    return moment.utc(diffETA).format("mm:ss");
  }

  get servicesReady() {
    return !!this.status && this.status.izzyLoaded && this.status.allIndexesBuilt;
  }

  goHome() {
    this.$router.push("/");
  }

  mounted() {
    this.loadConfig();
    this.loadStatus();
  }
}
</script>

<style lang="scss" scoped>
.config-code {
  ::v-deep pre {
    max-height: 60vh;
    overflow: auto;
  }
}
</style>
