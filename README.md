# vscode-dicom

A [vscode][vsc] extension that dumps DICOM tag contents.

[vsc]: https://code.visualstudio.com/

## Features

- Dumps all DICOM tag contents into a human-readable format.
- Understands standard DICOM tags.

## Known Issues / Limitations

- Does not work with a virtual file system mounted with `FileSystemProvider`.
- It's not possible to modify DICOM file.

## Acknowledgement

This extension is based on the following awesome packages.

- [dicom-parser][parser]
- [dicom-data-dictionary][dictionary]

[parser]: https://www.npmjs.com/package/dicom-parser
[dictionary]: https://www.npmjs.com/package/dicom-data-dictionary
