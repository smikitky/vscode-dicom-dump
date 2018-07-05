declare module 'dicom-parser';

declare module 'dicom-data-dictionary' {
  export interface TagInfo {
    tag: string;
    vr: string;
    vm: string;
    name: string;
  }

  export interface StandardDataElements {
    [tag: string]: TagInfo | undefined;
  }
  export const standardDataElements: StandardDataElements;
}
