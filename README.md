# DICOM Dump for Visual Studio Code

A [Visual Studio Code][vsc] (vscode) extension that dumps [DICOM][dicom] tag contents. DICOM is a standard file format for medical images.

[vsc]: https://code.visualstudio.com/
[dicom]: https://www.dicomstandard.org/

## Usage

![Screenshot](https://raw.githubusercontent.com/smikitky/vscode-dicom-dump/master/doc/screenshot.png)

Open a context menu on a DICOM file and select "DICOM: Dump DICOM tags".

## Features

- Dumps all DICOM tags in human-readable format (except binary data).
- Understands value representation (VR) of most standard DICOM tags.
- Provides a hover for some hard-to-remember DICOM keywords and UIDs.<br>
  ![Screenshot](https://raw.githubusercontent.com/smikitky/vscode-dicom-dump/master/doc/screenshot-values.png)
- Basic support for character encodings.
- 100% JavaScript. Does not require any external binary dependencies like DCMTK.

## Configuration

- `dicom.showPrivateTags` (default = `false`) controls the
  visibility of DICOM private tags. Set this to `true` to dump everything.
  Note that many private tags have 'UN' (unknown) VR type, which means
  this extension does not know how to stringify them.

- `dicom.dictionary` (default = `{}`) modifies or adds entries to
  the standard DICOM dictionary. Example:

  ```json
  {
    "dicom.dictionary": {
      "01F51247": { "vr": "US", "name": "myPrivateNumericalTag" },
      "01F51248": { "vr": "LO", "name": "myPrivateTextTag", "forceVr": true }
    }
  }
  ```

  `forceVr: true` will forcibly overwrite the VR type even if
  another type is explicitly specified in the DICOM file.
  This may allow you to sniff the contents of some private tags.

- `dicom.searches` (default = `[]`) provides a quick link to your favorite
  DICOM search engine when the mouse hovers on a tag string. Example:

  ```json
  {
    "dicom.searches": [
      {
        "title": "Search {EEEE},{GGGG} on Google",
        "url": "https://www.google.com/search?q=DICOM%20{EEEE},{GGGG}"
      }
    ]
  }
  ```

  Four keywords (`{EEEE}`, `{eeee}`, `{GGGG}` and `{gggg}`) will be replaced.

## Troubleshooting

**My DICOM file does not load at all!**: Can you open that file with [dicom-parser's online demo][demo]? If not, probably your DICOM file is not standard-compliant, and there is little I can do. Some DICOM implementations are tolerant enough to open mildly broken files. Just because you can view your file with &lt;insert your favorite viewer here&gt; does not mean the file is not corrupted. If you could open the file with the demo above and are still getting an error from this extension, feel free to report as a bug.

[demo]: https://github.com/cornerstonejs/dicomParser

**The "Dump DICOM tags" context menu doesn't show up!**: Your DICOM file _must_ have the extension `*.dcm` or `*.dicom`. Please let me know if you know other well-known file naming conventions. Currently, VS Code cannot determine the type of a _binary_ file based on its contents.

**Patient/institution names are garbled!**: Currently the character encoding support is limited and buggy, and it's partially due to the fact that DICOM uses rare character encodings not supported by iconv-lite. Also note that some DICOM implementations store multibyte strings with a totally wrong encoding (e.g., Japanse SJIS). I'd rather not support all sorts of malformed files "in the wild", but reasonable suggestions and PRs are welcome.

## Known Issues / Limitations

**USE AT YOUR OWN RISK. DO NOT USE THIS FOR CLINICAL PURPOSES.**

- Does not work with remote workspaces mounted with `FileSystemProvider` (blocked by: microsoft/vscode#48034).
- Cannot display the image (pixel/voxel data) itself.
- It's not possible to modify DICOM files.
- Character encoding support is limited, and it lacks Korean character support.
  PRs are welcome.

## Bugs / PRs

Plase use GitHub's issue system.

## Acknowledgement

This extension is based on the following awesome packages.

- [dicom-parser][parser]
- [dicom-data-dictionary][dictionary]

[parser]: https://www.npmjs.com/package/dicom-parser
[dictionary]: https://www.npmjs.com/package/dicom-data-dictionary
