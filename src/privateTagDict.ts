import { DicomDataElements } from 'dicom-data-dictionary';

export interface PrivateTagDict {

    [privateCreator: string]: DicomDataElements | undefined;
}
