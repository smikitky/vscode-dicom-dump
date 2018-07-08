declare module 'dicom-parser' {
  export interface Element {
    tag: string;
    vr: string;
    dataOffset: number;
    length: number;
    items?: { dataSet: DataSet }[];
    fragments?: any;
  }

  interface NumberAccessor {
    (key: string, index?: number): number | undefined;
  }

  export interface DataSet {
    elements: { [key: string]: Element };
    float: NumberAccessor;
    double: NumberAccessor;
    uint32: NumberAccessor;
    int32: NumberAccessor;
    uint16: NumberAccessor;
    int16: NumberAccessor;
    string: (key: string) => string | undefined;
    byteArray: Uint8Array;
  }

  export function parseDicom(byteArray: Uint8Array): DataSet;
}

declare module 'dicom-data-dictionary' {
  export interface TagInfo {
    vr: string;
    // vm: string;
    name: string;
  }

  export interface DicomDataElements {
    [tag: string]: TagInfo | undefined;
  }
  export const standardDataElements: DicomDataElements;
}

declare module 'jconv';
