import IActor from "./actor";
import { CustomField } from "./custom_field";

export interface SceneSource {
  label: string;
  mimeType?: string;
  streamType: string;
  transcode: boolean;
  url: string;
}

export interface BufferedRange {
  start: number;
  end: number;
}

export default interface IScene {
  _id: string;
  addedOn: number;
  path: string;
  name: string;
  releaseDate: number | null;
  description: string | null;
  rating: number | null;
  favorite: boolean;
  bookmark: number | null;
  actors: IActor[];
  studio: any;
  labels: {
    _id: string;
    name: string;
  }[];
  thumbnail: {
    _id: string;
    color: string | null;
  } | null;
  preview: {
    _id: string;
    meta?: {
      dimensions?: {
        width?: number;
        height?: number;
      };
    };
  } | null;
  meta: {
    size: number;
    duration: number;
    dimensions: {
      width: number;
      height: number;
    };
  };
  watches: number[];
  streamLinks: string[];
  customFields: { [key: string]: any };
  availableFields: CustomField[];
  availableStreams: {
    label: string;
    mimeType?: string;
    streamType: string;
    transcode: boolean;
  }[];
}
