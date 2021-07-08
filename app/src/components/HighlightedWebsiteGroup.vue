<template>
  <div class="d-flex">
    <v-btn
      v-for="websiteField in websiteFields"
      :key="websiteField._id"
      icon
      :href="value[websiteField._id]"
    >
      <v-icon>{{ websiteField.icon || fallbackIcon }}</v-icon>
    </v-btn>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
import { ICustomField, CustomFieldTarget } from "@/types/custom_field";
import { getHighlightedWebsiteFields } from "@/util/custom_field";

@Component
export default class HighlightedWebsiteGroup extends Vue {
  @Prop({ default: () => ({}) }) value!: any;
  @Prop() fields!: ICustomField[];
  @Prop({ default: "" }) target!: CustomFieldTarget | null;
  @Prop({ default: "mdi-link-variant" }) fallbackIcon!: string;

  get websiteFields(): ICustomField[] {
    return getHighlightedWebsiteFields(this.fields, this.target);
  }
}
</script>
