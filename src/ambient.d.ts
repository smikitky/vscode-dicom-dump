declare module 'dicom-parser';

declare module 'dicom-data-dictionary' {
  interface StandardDataElements {
    [tag: string]:
      | {
          tag: string;
          vr: string;
          vm: string;
          name: string;
        }
      | undefined;
  }
  export const standardDataElements: StandardDataElements;
}
