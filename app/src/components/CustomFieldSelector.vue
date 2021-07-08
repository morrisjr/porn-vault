<template>
  <v-row dense>
    <v-col
      class="d-flex align-center"
      v-for="field in fields"
      :key="field._id"
      :cols="cols"
      :sm="sm"
      :md="md"
      :lg="lg"
      :xl="xl"
    >
      <v-tooltip bottom>
        <template #activator="{ on }">
          <div v-on="on" class="text-truncate subtitle-1" style="width: 30%">
            {{ field.name }}
          </div>
        </template>
        {{ field.name }}
      </v-tooltip>

      <template v-if="field.type === 'BOOLEAN'">
        <v-checkbox
          style="width: 70%"
          class="mt-0"
          v-model="innerValue[field._id]"
          @change="onInnerValueChange"
          color="primary"
          hide-details
          :label="innerValue[field._id] === true ? 'Yes' : 'No'"
          :readonly="readonly"
          :ripple="!readonly"
        />
      </template>
      <template v-else-if="field.type.includes('SELECT')">
        <v-select
          style="width: 70%"
          v-if="!readonly"
          solo
          flat
          single-line
          :multiple="field.type === 'MULTI_SELECT'"
          color="primary"
          :placeholder="field.name"
          v-model="innerValue[field._id]"
          :items="field.values"
          @change="onInnerValueChange"
          hide-details
          :suffix="field.unit"
          clearable
        />
        <v-tooltip bottom v-else>
          <template #activator="{ on }">
            <div
              style="width: 70%"
              v-on="on"
              :class="{
                'readonly-field select text-truncate': true,
                multiple: field.type === 'MULTI_SELECT',
                'empty med--text': !innerValue[field._id],
                'body-2': !!innerValue[field._id],
              }"
            >
              {{
                innerValue[field._id]
                  ? `${innerValue[field._id].join(", ")} ${field.unit ? field.unit : ""}`
                  : "(no value)"
              }}
            </div>
          </template>
          {{
            innerValue[field._id]
              ? `${innerValue[field._id].join(", ")} ${field.unit ? field.unit : ""}`
              : "(no value)"
          }}
        </v-tooltip>
      </template>

      <template v-else-if="field.type === 'STRING'">
        <v-text-field
          style="width: 70%"
          v-if="!readonly"
          solo
          flat
          single-line
          :placeholder="field.name"
          v-model="innerValue[field._id]"
          @input="onInnerValueChange"
          hide-details
          color="primary"
          :suffix="field.unit"
        />
        <v-tooltip bottom v-else>
          <template #activator="{ on }">
            <component
              style="width: 70%"
              v-on="on"
              :class="{
                'readonly-field string text-truncate': true,
                'empty med--text': !innerValue[field._id],
                'body-2': !!innerValue[field._id],
              }"
              :is="stringComponent(field)"
              v-bind="hrefProps(field)"
            >
              {{ innerValue[field._id] || "(no value)" }}
            </component>
          </template>
          {{ innerValue[field._id] || "(no value)" }}
        </v-tooltip>
      </template>

      <template v-else-if="field.type === 'NUMBER'">
        <v-text-field
          style="width: 70%"
          v-if="!readonly"
          solo
          flat
          single-line
          :placeholder="field.name"
          v-model.number="innerValue[field._id]"
          @input="onInnerValueChange"
          hide-details
          color="primary"
          :suffix="field.unit"
        />
        <v-tooltip bottom v-else>
          <template #activator="{ on }">
            <div
              style="width: 70%"
              v-on="on"
              :class="{
                'readonly-field number text-truncate': true,
                'empty med--text': !innerValue[field._id],
                'body-2': !!innerValue[field._id],
              }"
            >
              {{ innerValue[field._id] || "(no value)" }} {{ field.unit }}
            </div>
          </template>
          {{ innerValue[field._id] || "(no value)" }} {{ field.unit }}
        </v-tooltip>
      </template>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import { ICustomField } from "@/types/custom_field";

@Component
export default class CustomFieldSelector extends Vue {
  @Prop({ default: () => ({}) }) value!: any;
  @Prop() fields!: ICustomField;
  @Prop({ default: 12 }) cols!: number;
  @Prop({ default: 6 }) sm!: number;
  @Prop({ default: 4 }) md!: number;
  @Prop({ default: 4 }) lg!: number;
  @Prop({ default: 3 }) xl!: number;
  @Prop({ default: false }) readonly!: boolean;

  innerValue = JSON.parse(JSON.stringify(this.value));

  @Watch("value", { deep: true })
  onValueChange(newVal: any) {
    this.innerValue = newVal;
  }

  onInnerValueChange(newVal: any) {
    this.$emit("input", this.innerValue);
    this.$emit("change");
  }

  stringComponent(field: ICustomField): string {
    const value = this.value[field._id];
    return value && /https?:\/\//.test(value) ? "a" : "div";
  }

  hrefProps(field: ICustomField): object {
    if (this.stringComponent(field) !== "a") {
      return {};
    }
    const value = this.value[field._id];

    return {
      href: value,
      target: "_blank",
    };
  }
}
</script>

<style lang="scss" scoped>
.string {
  &.empty {
    font-size: 14px;
  }
}
</style>
