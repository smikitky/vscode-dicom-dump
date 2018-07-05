# DICOM Dump

A [vscode][vsc] extension that dumps DICOM tag contents.

[vsc]: https://code.visualstudio.com/

## Usage

![Screenshot](./doc/screenshot.png)

Right-click on the DICOM file and use the context menu "Show DICOM tags".

## Features

- Dumps all DICOM tag contents into a human-readable format (except binaries).
- Understands standard DICOM tags.

## Known Issues / Limitations

- Does not work with a virtual file system mounted with `FileSystemProvider`.
- It's not possible to modify DICOM file.

## Bugs / PRs

Use GitHub's issue system.

## Acknowledgement

This extension is based on the following awesome packages.

- [dicom-parser][parser]
- [dicom-data-dictionary][dictionary]

[parser]: https://www.npmjs.com/package/dicom-parser
[dictionary]: https://www.npmjs.com/package/dicom-data-dictionary
