import { CustomFieldTarget } from "./../types/custom_field";
import { ICustomField, CustomFieldType } from "@/types/custom_field";

export const getHighlightedWebsiteFields = (
  availableFields: ICustomField[],
  target: CustomFieldTarget | null = null
): ICustomField[] =>
  availableFields.filter(
    (field) =>
      field.type === CustomFieldType.STRING &&
      field.highlightedWebsite &&
      (target === null || field.target.includes(target))
  );
