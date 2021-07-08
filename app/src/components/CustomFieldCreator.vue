<template>
  <div class="text-left">
    <v-list two-line>
      <v-list-item @click="openCreateDialog">
        <v-list-item-content>
          <v-list-item-title>+ Add</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <CreatedCustomField
        @update="updateField(i, $event)"
        @delete="fields.splice(i, 1)"
        v-model="fields[i]"
        v-for="(field, i) in fields"
        :key="field._id"
      />
    </v-list>

    <v-dialog v-model="createDialog" max-width="400px">
      <v-card :loading="isCreating">
        <v-card-title>Create new custom field</v-card-title>
        <v-card-text>
          <v-form v-model="validated">
            <v-text-field
              clearable
              v-model="createFieldName"
              color="primary"
              placeholder="Field name (e.g. 'Hair color')"
              :rules="fieldNameRules"
            />
            <v-select
              color="primary"
              placeholder="Field type"
              :items="createFieldTypes"
              v-model="createFieldType"
              persistent-hint
              :hint="typeHint"
              item-value="id"
              item-text="text"
            />
            <v-select
              item-value="id"
              item-text="text"
              multiple
              color="primary"
              placeholder="Field target object"
              :items="createFieldTargets"
              v-model="createFieldTarget"
              persistent-hint
              hint="Objects the field is applicable to"
              :rules="(v) => !!v.length || 'Required'"
            />
            <v-checkbox
              v-if="createFieldType === 'STRING'"
              color="primary"
              v-model="createFieldHighlighedWebsite"
              persistent-hint
              hint="Will display the links in the appbar and beside the primary metadata"
              label="Highlighted website"
            />
            <v-text-field
              v-if="createFieldType === 'STRING' && createFieldHighlighedWebsite"
              class="mt-4"
              color="primary"
              placeholder="mdi-instagram"
              v-model="createFieldIcon"
              label="Website icon"
              persistent-hint
              hint="See https://materialdesignicons.com"
              :append-icon="/mdi-\w+/.test(createFieldIcon) ? createFieldIcon : 'mdi-link-variant'"
            />
            <v-text-field
              v-if="createFieldType != 'BOOLEAN' && !createFieldHighlighedWebsite"
              class="mt-4"
              color="primary"
              v-model="createFieldUnit"
              placeholder="inches, cm"
              persistent-hint
              hint="Optional"
              label="Unit"
            />
            <v-combobox
              class="mt-4"
              label="Preset values"
              chips
              v-if="createFieldType.includes('SELECT')"
              placeholder="any string value"
              color="primary"
              clearable
              multiple
              v-model="createFieldValues"
              hide-details
            />
          </v-form>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn :disabled="!validated" class="text-none" text color="primary" @click="createField"
            >Create</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import ApolloClient from "../apollo";
import gql from "graphql-tag";
import CreatedCustomField from "./CreatedCustomField.vue";
import CustomFieldFragment from "@/fragments/custom_field";

@Component({
  components: {
    CreatedCustomField,
  },
})
export default class CustomFieldCreator extends Vue {
  fields = [] as any[];

  isCreating = false;
  validated = false;

  createDialog = false;
  createFieldName = "" as string | null;
  createFieldType = "STRING" as string | null;
  createFieldTypes = [
    {
      id: "NUMBER",
      text: "Number",
    },
    {
      id: "STRING",
      text: "String",
    },
    {
      id: "BOOLEAN",
      text: "Boolean",
    },
    {
      id: "SINGLE_SELECT",
      text: "Single choice",
    },
    {
      id: "MULTI_SELECT",
      text: "Multiple choice",
    },
  ];
  createFieldTarget = ["ACTORS"] as string[];
  createFieldTargets = [
    {
      id: "SCENES",
      text: "Scenes",
    },
    {
      id: "ACTORS",
      text: "Actors",
    },
    /* {
      id: "MOVIES",
      text: "Movies"
    },
    {
      id: "IMAGES",
      text: "Images"
    },
    {
      id: "MOVIES",
      text: "Movies"
    },
    {
      id: "ALBUMS",
      text: "Albums"
    } */
  ];
  createFieldValues: string[] = [];
  createFieldHighlighedWebsite: boolean = false;
  createFieldUnit: string | null = null;
  createFieldIcon: string | null = null;

  fieldNameRules = [(v) => (!!v && !!v.length) || "Invalid field name"];

  updateField(index: number, field: any) {
    Vue.set(this.fields, index, field);
  }

  createField() {
    if (this.isCreating || !this.validated) return;

    this.isCreating = true;
    setTimeout(() => {
      ApolloClient.mutate({
        mutation: gql`
          mutation (
            $name: String!
            $values: [String!]
            $type: CustomFieldType!
            $unit: String
            $target: [CustomFieldTarget!]!
            $highlightedWebsite: Boolean
            $icon: String
          ) {
            createCustomField(
              name: $name
              values: $values
              type: $type
              unit: $unit
              target: $target
              highlightedWebsite: $highlightedWebsite
              icon: $icon
            ) {
              ...CustomFieldFragment
            }
          }
          ${CustomFieldFragment}
        `,
        variables: {
          name: this.createFieldName,
          type: this.createFieldType,
          values: this.createFieldValues,
          unit: this.createFieldUnit,
          target: this.createFieldTarget,
          highlightedWebsite: this.createFieldHighlighedWebsite,
          icon: this.createFieldIcon,
        },
      })
        .then((res) => {
          this.fields.push(res.data.createCustomField);
          this.createFieldName = "";
          this.createFieldValues = [];
          this.createDialog = false;
          this.createFieldUnit = null;
          this.createFieldHighlighedWebsite = false;
          this.createFieldIcon = "";
        })
        .finally(() => {
          this.isCreating = false;
        });
    }, 50);
  }

  get typeHint() {
    return (
      {
        STRING: "Arbitrary string value (e.g. social media link)",
        NUMBER: "Some number (integer or float) (e.g. height in cm)",
        BOOLEAN: "Checkbox (e.g. retired yes/no)",
        SINGLE_SELECT: "Set of values with one possible selected value (e.g. ethnicity)",
        MULTI_SELECT: "Set of values with more than one possible value (e.g. hair color)",
      }[this.createFieldType as string] || "Oops?"
    );
  }

  openCreateDialog() {
    this.createDialog = true;
  }

  mounted() {
    ApolloClient.query({
      query: gql`
        {
          getCustomFields {
            ...CustomFieldFragment
          }
        }
        ${CustomFieldFragment}
      `,
    })
      .then((res) => {
        this.fields = res.data.getCustomFields;
      })
      .catch((error) => {
        console.error(error);
      });
  }
}
</script>

<style lang="scss" scoped></style>
