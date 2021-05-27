<template>
  <div style="position: relative" class="white--text mt-3 pa-2 code">
    <div class="d-flex align-center">
      <span
        @click="mode = Mode.JSON"
        class="hover"
        :class="mode === Mode.JSON ? 'font-weight-black' : ''"
        >JSON</span
      >/
      <span
        @click="mode = Mode.YAML"
        class="hover"
        :class="mode === Mode.YAML ? 'font-weight-black' : ''"
        >YAML</span
      >
      <v-spacer></v-spacer>
      <v-btn icon @click="copyOutput">
        <v-icon>mdi-content-copy</v-icon>
      </v-btn>
    </div>
    <v-divider class="mb-3 mt-1"></v-divider>
    <pre v-if="contentStr">{{ contentStr }}</pre>
    <div v-else class="placeholder">No value</div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
import YAML from "yaml";

enum Mode {
  JSON = "json",
  YAML = "yaml",
}

@Component({})
export default class Code extends Vue {
  @Prop() content!: object;

  mode = Mode.JSON;
  Mode = Mode;

  get contentStr() {
    switch (this.mode) {
      case Mode.JSON:
        return JSON.stringify(this.content, null, 2);
      case Mode.YAML:
        return YAML.stringify(this.content);
      default:
        return "";
    }
  }

  get yamlContent() {
    return YAML.stringify(this.content);
  }

  copyOutput() {
    navigator.clipboard.writeText(this.contentStr).then(
      () => {
        /* clipboard successfully set */
      },
      () => {
        /* clipboard write failed */
      }
    );
  }
}
</script>

<style lang="scss" scoped>
.code {
  background: #090909;
  border-radius: 4px;
}

.placeholder {
  font-style: italic;
  opacity: 0.7;
}
</style>
