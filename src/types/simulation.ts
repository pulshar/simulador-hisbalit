export type TileFormat = '2.5x2.5' | '4x4';

export type TileFinish = 'Brillo' | 'Antideslizante A3' | 'Mate';

export type EdgeColorMode =
  | 'coordinated'
  | 'pas'
  | 'ason'
  | 'jonico'
  | 'mar'
  | 'negro'
  | 'starlight';

export type EdgeColorOption = {
  id: EdgeColorMode;
  name: string;
  subtitle: string;
  hex: string;
  isPhotoluminescent?: boolean;
};

export type GroutColor = {
  id: string;
  name: string;
  hex: string;
};

export type Tile = {
  id: string;
  name: string;
  image: string;
  color: string;
  tonality: string;
  pattern: string;
  collectionId: string;
  description: string;
  availableFormats: TileFormat[];
  availableFinishes: TileFinish[];
  referenceCode: string;
};

export type CollectionSpecs = {
  formats: TileFormat[];
  finishes: TileFinish[];
  thickness: string;
  joint: string;
  application: string[];
  sustainability: string;
};

export type Collection = {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  sourceUrl: string;
  image: string;
  specs: CollectionSpecs;
  tiles: Tile[];
};

export type DemoPhotograph = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
};

export type SimulationHistoryItem = {
  id: string;
  timestamp: number;
  collection: Collection;
  tile: Tile;
  tileFormat: TileFormat;
  tileFinish: TileFinish;
  groutColor: string;
  applyEdge: boolean;
  edgeColor: EdgeColorMode;
  previewDataUrl: string;
};

export type SimulationState = {
  currentStep: number;
  selectedCollection: Collection | null;
  selectedTile: Tile | null;
  tileFormat: TileFormat;
  tileFinish: TileFinish;
  groutColor: string;
  applyEdge: boolean;
  edgeColor: EdgeColorMode;
  sourceImage: string | null;
  sourceImageName: string | null;
  sourceImageDimensions: { width: number; height: number } | null;
  resultImage: string | null;
};
