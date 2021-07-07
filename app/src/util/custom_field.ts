import { CustomFieldTarget } from "./../types/custom_field";
import { CustomField, CustomFieldType } from "@/types/custom_field";

export const getHighlightedWebsiteFields = (
  availableFields: CustomField[],
  target: CustomFieldTarget | null = null
): CustomField[] =>
  availableFields.filter(
    (field) =>
      field.type === CustomFieldType.STRING &&
      field.highlightedWebsite &&
      (target === null || field.target.includes(target))
  );
