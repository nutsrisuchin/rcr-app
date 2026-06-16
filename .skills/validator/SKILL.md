---
name: validator
description: Steps and scripts for validating the data integrity of the RCR App against the source Excel files.
---

# Validator Skill

This skill is responsible for ensuring that the data presented in the RCR App accurately reflects the source Excel data.

## Validation Steps

### 1. Data Integrity Check (Pre-processing)
- Before the application runs, the raw Excel files (`RCR Index Rev.1.xlsx` and `RCR-STD-XX.xlsx`) are processed into JSON.
- **Task**: Periodically run a validation script to compare the generated JSON against the original Excel files.
- Ensure no rows or columns were dropped during the conversion (specifically watch out for empty cells, which are common in these engineering spreadsheets).

### 2. App Verification
- Open the application and perform random sampling tests.
- **Scenario A (GC6)**:
  - Select Plant: GC6
  - Select Piping Class: (Pick a random class like `A2, B7`).
  - Verify that the RCR Number matches the `RCR Index Rev.1.xlsx`.
  - Verify that the Pipe Material and NDT parameters match the corresponding `RCR-STD-XX.xlsx` file.
- **Scenario B (GC4)**:
  - Select Plant: GC4
  - Verify that the application gracefully indicates "No data available" or remains blank without throwing an error.

### 3. Link Verification
- Ensure that the WPS PDF names displayed by the app match the exact filenames found in the `WPS` directory.
- There should be no broken links or misspelled document names.

### 4. Layout Verification
- Ensure the layout matches the premium modern UI guidelines provided to the frontend developer. The data should be easily readable for a field engineer.
