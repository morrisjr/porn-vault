<template>
  <v-container fluid>
    <BindTitle value="Settings" />

    <div style="max-width: 800px" class="mx-auto">
      <v-card>
        <v-card-title>Preferences</v-card-title>
        <v-card-text>
          <v-row>
            <v-col :cols="12" :sm="6">
              <div>
                <v-subheader>Scene cards aspect ratio</v-subheader>
                <v-radio-group v-model="sceneRatio">
                  <v-radio color="primary" :value="1" label="Square"></v-radio>
                  <v-radio color="primary" :value="16 / 9" label="16:9"></v-radio>
                  <v-radio color="primary" :value="4 / 3" label="4:3"></v-radio>
                </v-radio-group>
              </div>

              <div>
                <v-subheader>Actor cards aspect ratio</v-subheader>
                <v-radio-group v-model="actorRatio">
                  <v-radio color="primary" :value="1" label="Square"></v-radio>
                  <v-radio color="primary" :value="9 / 16" label="9:16"></v-radio>
                  <v-radio color="primary" :value="3 / 4" label="3:4"></v-radio>
                </v-radio-group>
              </div>
            </v-col>
            <v-col :cols="12" :sm="6">
              <div>
                <v-btn
                  color="gray darken-4"
                  depressed
                  dark
                  @click="toggleDarkMode"
                  class="text-none my-3"
                  >{{ this.$vuetify.theme.dark ? "Light mode" : "Dark mode" }}</v-btn
                >
              </div>
              <div>
                <v-checkbox
                  color="primary"
                  hide-details
                  v-model="scenePauseOnUnfocus"
                  label="Pause video on window unfocus"
                />
                <v-checkbox
                  color="primary"
                  hide-details
                  label="Play scene preview on mouse hover"
                  v-model="scenePreviewOnMouseHover"
                />
                <v-checkbox
                  color="primary"
                  hide-details
                  v-model="showCardLabels"
                  label="Show card labels on overview"
                />
                <v-checkbox
                  color="primary"
                  hide-details
                  label="Fill actor thumbnails"
                  v-model="fillActorCards"
                />
                <v-checkbox
                  color="primary"
                  hide-details
                  label="Show experimental (unstable) features"
                  v-model="experimental"
                />
              </div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <v-card class="mt-3">
        <v-card-title>Custom data fields</v-card-title>
        <v-card-text>
          <CustomFieldCreator />
        </v-card-text>
      </v-card>

      <v-card class="mt-3">
        <v-card-title class="pb-0">Porn Vault {{ version }}</v-card-title>
        <v-card-text>
          <div class="mb-3 med--text">by boi123212321</div>

          <v-btn
            class="text-none mr-2 mb-2"
            depressed
            href="https://github.com/boi123212321/porn-vault"
            target="_blank"
          >
            <v-icon left>mdi-github</v-icon>GitHub
          </v-btn>

          <v-btn
            depressed
            href="https://discord.gg/t499hxK"
            target="_blank"
            color="#7289da"
            light
            class="text-none mr-2 mb-2"
          >
            <v-icon left>mdi-discord</v-icon>Discord
          </v-btn>

          <v-btn
            depressed
            href="https://github.com/boi123212321/porn-vault#support"
            target="_blank"
            color="primary"
            class="text-none mb-2"
            :class="$vuetify.theme.dark ? 'black--text' : ''"
          >
            <v-icon left>mdi-currency-btc</v-icon>Support
          </v-btn>
        </v-card-text>
      </v-card>

      <v-card class="mt-3" v-if="releases.length">
        <v-card-title class="mb-1">Release history</v-card-title>
        <v-card-text class="releases d-flex flex-column">
          <div v-for="release in formattedReleases" :key="release.id" class="release mb-2">
            <div class="release-header d-flex">
              <a
                :href="release.html_url"
                target="_blank"
                rel="noopener noreferrer"
                class="release-name mr-2"
                >{{ release.tag_name }}</a
              >
              <div class="release-date mr-2">
                &nbsp;-&nbsp;{{ release.date }}
              </div>
              <v-chip
                label
                small
                v-if="version === release.tag_name"
                color="primary"
                class="release-is-current mr-2"
                >current</v-chip
              >
              <v-chip
                label
                small
                outlined
                v-if="release.prerelease"
                color="red"
                class="release-is-rc mr-2"
                >prerelease</v-chip
              >
              <v-chip label small outlined v-else color="primary" class="release-is-stable mr-2"
                >stable</v-chip
              >
            </div>
            <v-divider class="mb-1"></v-divider>
            <div class="release-body ml-5" v-html="release.body"></div>
          </div>

          <span class="med--text">
            See more at
            <a
              href="https://github.com/porn-vault/porn-vault/releases"
              target="_blank"
              rel="noopener noreferrer"
              >Github</a
            ></span
          >
        </v-card-text>
      </v-card>
    </div>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import CustomFieldCreator from "@/components/CustomFieldCreator.vue";
import { contextModule } from "@/store/context";
import Axios from "axios";
import { serverBase } from "@/apollo";
import moment from "moment";
import marked from "marked";

interface GithubRelease {
  url: string;
  assets_url: string;
  upload_url: string;
  html_url: string;
  id: number;
  node_id: string;
  tag_name: string;
  target_commitish: string;
  name: string;
  draft: boolean;
  prerelease: boolean;
  created_at: Date;
  published_at: Date;
  tarball_url: string;
  zipball_url: string;
  body: string;
}

@Component({
  components: {
    CustomFieldCreator,
  },
})
export default class About extends Vue {
  version = "";
  releases: GithubRelease[] = [];

  set experimental(val: boolean) {
    if (val) {
      localStorage.setItem("pm_experimental", "true");
    } else {
      localStorage.removeItem("pm_experimental");
    }
    contextModule.toggleExperimental(val);
  }

  get experimental() {
    return contextModule.experimental;
  }

  mounted() {
    Axios.get(`${serverBase}/version?password=${localStorage.getItem("password")}`)
      .then(({ data }) => {
        this.version = data.result;
      })
      .catch((err) => {
        console.error(err);
      });

    this.fetchReleases();
  }

  set fillActorCards(val: boolean) {
    localStorage.setItem("pm_fillActorCards", val.toString());
    contextModule.toggleActorCardStyle(val);
  }

  get fillActorCards() {
    return contextModule.fillActorCards;
  }

  set showCardLabels(val: boolean) {
    localStorage.setItem("pm_showCardLabels", val.toString());
    contextModule.toggleCardLabels(val);
  }

  get showCardLabels() {
    return contextModule.showCardLabels;
  }

  set actorRatio(val: number) {
    localStorage.setItem("pm_actorRatio", val.toString());
    contextModule.setActorAspectRatio(val);
  }

  get actorRatio() {
    return contextModule.actorAspectRatio;
  }

  set sceneRatio(val: number) {
    localStorage.setItem("pm_sceneRatio", val.toString());
    contextModule.setSceneAspectRatio(val);
  }

  get sceneRatio() {
    return contextModule.sceneAspectRatio;
  }

  set scenePauseOnUnfocus(val: boolean) {
    localStorage.setItem("pm_scenePauseOnUnfocus", val.toString());
    contextModule.setScenePauseOnUnfocus(val);
  }

  get scenePauseOnUnfocus() {
    return contextModule.scenePauseOnUnfocus;
  }

  set scenePreviewOnMouseHover(val: boolean) {
    localStorage.setItem("pm_scenePreviewOnMouseHover", val.toString());
    contextModule.setScenePreviewOnMouseHover(val);
  }

  get scenePreviewOnMouseHover() {
    return contextModule.scenePreviewOnMouseHover;
  }

  toggleDarkMode() {
    // @ts-ignore
    this.$vuetify.theme.dark = !this.$vuetify.theme.dark;
    localStorage.setItem(
      "pm_darkMode",
      // @ts-ignore
      this.$vuetify.theme.dark ? "true" : "false"
    );
  }

  get formattedReleases() {
    return this.releases.map((release) => ({
      ...release,
      date: moment(release.published_at).format("LL"),
      body: this.formatReleaseBody(release.body),
    }));
  }

  formatReleaseBody(body: string) {
    // Convert github links to shortened markdown links
    const simplified = body
      .replace(
        /https:\/\/github\.com\/(?:boi123212321|porn-vault)\/porn-vault\/(?:pull|issues)\/(\d+)/g,
        (...res) => {
          if (res[1]) {
            return `[#${res[1]}](${res[0]})`;
          }
          return res[0];
        }
      )
      .replace(
        /https:\/\/github\.com\/(?:boi123212321|porn-vault)\/porn-vault\/commit\/([a-zA-Z0-9]+)/g,
        (...res) => {
          if (res[1]) {
            return `[${(res[1] as string).substring(0, 6)}](${res[0]})`;
          }
          return res[0];
        }
      );

    // Open links in new tabs
    const renderer = new marked.Renderer();
    renderer.link = function (href: string | null, title: string | null, text: string) {
      var link = marked.Renderer.prototype.link.call(this, href, title, text);
      return link.replace("<a", "<a target='_blank'");
    };

    marked.setOptions({
      renderer,
    });

    return marked(simplified);
  }

  async fetchReleases() {
    try {
      const res = await Axios.get("https://api.github.com/repos/porn-vault/porn-vault/releases", {
        params: {
          per_page: 5,
        },
      });
      this.releases = res.data as GithubRelease[];
    } catch (err) {}
  }
}
</script>

<style lang="scss" scoped>
.releases {
  .release-header {
    .release-name {
      font-weight: 600;
      font-size: 1rem;
      text-decoration: none;
    }
    .release-date {
    }

    .release-is-rc {
    }

    .release-is-stable {
    }
  }

  .release-body {
  }
}
</style>
