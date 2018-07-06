declare module 'dicom-parser';

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
