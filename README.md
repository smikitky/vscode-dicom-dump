# DICOM Dump for Visual Studio Code

A [Visual Studio Code][vsc] (vscode) extension that dumps DICOM tag contents.

[vsc]: https://code.visualstudio.com/

## Usage

![Screenshot](./doc/screenshot.png)

Right-click on the DICOM file and use the context menu "Show DICOM tags".

## Features

- Dumps all DICOM tags in a human-readable format (except binaries).
- Understands value representation (VRs) of most standard DICOM tags.

## Configuration

- `dicom.showPrivateTags` (default = `false`) controls the
  visibility of DICOM private tags. Set this to `true` to dump everything.
  Note that many private tags have 'UN' (unknown) VR type, which means
  this extension do not know how to format them.

- `dicom.dictionary` modifies or adds entries to
  the standard DICOM dictionary. Example:

  ```json
  {
    "dicom.dictionary": {
      "01F51247": { "vr": "US", "name": "privateTag1" },
      "01F51248": { "vr": "DT", "name": "privateTag2", "forceVr": true }
    }
  }
  ```

  `forceVr: true` will forcibly overwrite the VR type even if
  another type is explicitly specified in the DICOM file.
  This may allow you to view the contents of some private tags.

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
