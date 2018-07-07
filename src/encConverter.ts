/**
 * Encoding converter takes the byte array from DICOM file and returns an
 * ordinary UTF-8 string.
 * Target VR types are SH (Short String), LO (Long String), ST (Short Text),
 * LT (Long Text), PN (Person Name) and UT (Unlimited Text).
 */
export type EncConverter = (input: Buffer) => string;

/**
 * Examines the value of SpecificCharacterSet (0008,0005) and
 * creates the corresponding EncConverter.
 * @param charSet SpecificCharacterSet string from the DICOM file.
 */
export async function createEncConverter(
  charSet: string
): Promise<EncConverter | undefined> {
  // Nothing matched.
  return undefined;
}
