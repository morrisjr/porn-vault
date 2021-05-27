export enum ServiceStatus {
  Unknown = "unknown",
  Disconnected = "disconnected",
  Stopped = "stopped",
  Connected = "connected",
}

export interface StatusData {
  // Izzy
  izzyStatus: ServiceStatus;
  izzyVersion: string;
  izzyLoaded: boolean;
  // ES
  esStatus: ServiceStatus;
  esVersion: string;
  esIndices: {
    health: string;
    status: string;
    index: string;
    uuid: string;
    pri: string;
    rep: string;
    "docs.count": string;
    "docs.deleted": string;
    "store.size": string;
    "pri.store.size": string;
  }[];
  indexBuildProgress: {
    [indexName: string]: {
      name: string;
      indexedCount: number;
      totalToIndexCount: number;
      eta: number;
    };
  };
  allIndexesBuilt: boolean;
  // Other
  serverUptime: number;
  osUptime: number;
}
