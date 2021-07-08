<template>
  <v-list-item>
    <v-list-item-content>
      <v-list-item-title>
        {{ value.name }} (for {{ value.target.map(titleCase).join(", ") }})
      </v-list-item-title>
      <v-list-item-subtitle>
        {{ value.type }}
        {{ value.values && value.values.length ? `(${value.values.join(", ")})` : "" }}
      </v-list-item-subtitle>
    </v-list-item-content>
    <v-list-item-action>
      <div class="d-flex">
        <v-btn icon @click="openEditDialog">
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
        <v-btn @click="deleteHandler" :color="deleteState == 0 ? 'warning' : 'error'" icon>
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </div>
    </v-list-item-action>

    <v-dialog v-model="editDialog" max-width="400px">
      <v-card :loading="isEditing">
        <v-card-title>Edit field: '{{ value.name }}'</v-card-title>
        <v-card-text>
          <v-form v-model="validEdit">
            <v-text-field
              :rules="fieldNameRules"
              color="primary"
              v-model="editName"
              placeholder="Field name"
              hide-details
            />
            <v-checkbox
              v-if="value.type === 'STRING'"
              color="primary"
              v-model="editHighlighedWebsite"
              persistent-hint
              hint="Will display the links in the appbar and beside the primary metadata"
              label="Highlighted website"
            />
            <v-text-field
              v-if="value.type === 'STRING' && editHighlighedWebsite"
              class="mt-4"
              color="primary"
              placeholder="mdi-instagram"
              v-model="editIcon"
              label="Website icon"
              persistent-hint
              hint="See https://materialdesignicons.com"
              :append-icon="/mdi-\w+/.test(editIcon) ? editIcon : 'mdi-link-variant'"
            />
            <v-text-field
              v-if="value.type != 'BOOLEAN' && !editHighlighedWebsite"
              color="primary"
              placeholder="Unit (optional)"
              v-model="editUnit"
              hide-details
            />
            <v-combobox
              chips
              v-if="value.type == 'SINGLE_SELECT' || value.type == 'MULTI_SELECT'"
              placeholder="Preset values"
              color="primary"
              clearable
              multiple
              v-model="editValues"
              hide-details
            />
          </v-form>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="edit" :disabled="!validEdit" text color="primary" class="text-none">
            Edit
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-list-item>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import ApolloClient from "../apollo";
import gql from "graphql-tag";
import { ICustomField } from "@/types/custom_field";
import CustomFieldFragment from "@/fragments/custom_field";

@Component
export default class CreatedCustomField extends Vue {
  @Prop() value!: ICustomField;
  editDialog = false;
  isEditing = false;
  validEdit = false;

  editName: string | null = "";
  editUnit: string | null = null;
  editHighlighedWebsite: boolean = false;
  editIcon: string | null = null;
  editValues: string[] = [];

  fieldNameRules = [(v) => (!!v && !!v.length) || "Invalid field name"];

  deleteState = 0;

  titleCase(str: string) {
    return str
      .split(" ")
      .map((w) => w[0].toUpperCase() + w.substr(1).toLowerCase())
      .join(" ");
  }

  edit() {
    if (!this.validEdit) return;

    this.isEditing = true;

    ApolloClient.mutate({
      mutation: gql`
        mutation (
          $id: String!
          $name: String
          $values: [String!]
          $unit: String
          $highlightedWebsite: Boolean
          $icon: String
        ) {
          updateCustomField(
            id: $id
            name: $name
            values: $values
            unit: $unit
            highlightedWebsite: $highlightedWebsite
            icon: $icon
          ) {
            ...CustomFieldFragment
          }
        }
        ${CustomFieldFragment}
      `,
      variables: {
        id: this.value._id,
        name: this.editName,
        values: this.editValues,
        unit: this.editUnit,
        highlightedWebsite: this.editHighlighedWebsite,
        icon: this.editIcon,
      },
    })
      .then((res) => {
        this.$emit("update", res.data.updateCustomField);
        this.editDialog = false;
      })
      .finally(() => {
        this.isEditing = false;
      });
  }

  openEditDialog() {
    this.editDialog = true;
    this.editName = this.value.name;
    this.editUnit = this.value.unit;
    this.editValues = this.value.values || [];
    this.editHighlighedWebsite = this.value.highlightedWebsite;
    this.editIcon = this.value.icon;
  }

  deleteHandler() {
    if (this.deleteState == 0) {
      this.deleteState++;
      setTimeout(() => {
        this.deleteState = 0;
      }, 2500);
    } else {
      ApolloClient.mutate({
        mutation: gql`
          mutation ($id: String!) {
            removeCustomField(id: $id)
          }
        `,
        variables: {
          id: this.value._id,
        },
      }).then((res) => {
        this.$emit("delete");
      });
    }
  }
}
</script>

<style lang="scss" scoped></style>
