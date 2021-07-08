export enum CustomFieldType {
  NUMBER = "NUMBER",
  STRING = "STRING",
  BOOLEAN = "BOOLEAN",
  SINGLE_SELECT = "SINGLE_SELECT",
  MULTI_SELECT = "MULTI_SELECT",
}

export enum CustomFieldTarget {
  SCENES = "SCENES",
  ACTORS = "ACTORS",
  MOVIES = "MOVIES",
  IMAGES = "IMAGES",
  STUDIOS = "STUDIOS",
  ALBUMS = "ALBUMS",
}

export interface ICustomField {
  _id: string;
  name: string;
  values: string[] | null;
  type: CustomFieldType;
  target: CustomFieldTarget[];
  unit: string | null;
  highlightedWebsite: boolean;
  icon: null | string;
}
