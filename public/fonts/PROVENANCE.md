# Font Provenance (Legal Compliance)

This folder stores the Thai font used by `frontend/admin/pdf-generator.js` for PDF generation.

## Sarabun-ExtraLight.ttf
- File: `frontend/admin/fonts/Sarabun-ExtraLight.ttf`
- Upstream source: `https://github.com/google/fonts/tree/main/ofl/sarabun`
- Download URL used: `https://github.com/google/fonts/raw/main/ofl/sarabun/Sarabun-ExtraLight.ttf`
- License: SIL Open Font License 1.1 (`frontend/admin/fonts/OFL.txt`)
- SHA-256: `8aa9fba8885554545c7bce3f1db5efd914c74c0ce8ae58e9e4cb477b5824fe9d`

## Sarabun-Bold.ttf
- File: `frontend/admin/fonts/Sarabun-Bold.ttf`
- Upstream source: `https://github.com/google/fonts/tree/main/ofl/sarabun`
- Download URL used: `https://github.com/google/fonts/raw/main/ofl/sarabun/Sarabun-Bold.ttf`
- License: SIL Open Font License 1.1 (`frontend/admin/fonts/OFL.txt`)
- SHA-256: `d38308ca27d067b9a1b79006337c1f9a66c29aa016d96a9d88d3801da7fa83b9`

## License File
- File: `frontend/admin/fonts/OFL.txt`
- Download URL used: `https://raw.githubusercontent.com/google/fonts/main/ofl/sarabun/OFL.txt`
- SHA-256: `b26cae1321380296ba8311b632a397d5eac11b47197f9d0aa0b9310f1531ad60`

## Notes
- `THSarabun-Bold.js` is legacy and should not be used for new changes.
- Production PDF flow now loads `Sarabun-ExtraLight.ttf` for `normal` and `Sarabun-Bold.ttf` for `bold` directly from this folder.
