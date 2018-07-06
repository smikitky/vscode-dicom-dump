# DICOM Dump for Visual Studio Code

A [Visual Studio Code][vsc] (vscode) extension that dumps DICOM tag contents.

[vsc]: https://code.visualstudio.com/

## Usage

![Screenshot](./doc/screenshot.png)

Right-click on the DICOM file and use the context menu "Show DICOM tags".

## Features

- Dumps all DICOM tags in a human-readable format (except binaries).
- Understands value representation (VRs) of most standard DICOM tags.

## Known Issues / Limitations

- Does not (yet) properly support `SQ` (Sequence of Items) values.
- Does not work with remote workspaces mounted with `FileSystemProvider` (blocked by: microsoft/vscode#48034).
- It's not possible to modify DICOM file.

## Bugs / PRs

Use GitHub's issue system.

## Acknowledgement

This extension is based on the following awesome packages.

- [dicom-parser][parser]
- [dicom-data-dictionary][dictionary]

[parser]: https://www.npmjs.com/package/dicom-parser
[dictionary]: https://www.npmjs.com/package/dicom-data-dictionary
