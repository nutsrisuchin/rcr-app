---
name: welding-engineer
description: Domain knowledge and guidelines for identifying and mapping Welding Procedure Standards (WPS) and repair methods.
---

# Welding Engineer Skill

This skill provides the domain context required to interpret the RCR Index and map it to appropriate Welding Procedure Specifications (WPS) and repair methods.

## Domain Guidelines

### 1. Understanding the Piping Class Mapping
- The `RCR Index Rev.1.xlsx` maps a specific Piping Class (e.g., `PUN Line Class` or `AR1 Line Class`) to an RCR Number (e.g., `1` for `RCR-STD-01`).
- The Piping Class determines the material, pressure, temperature, and service characteristics of the pipe.

### 2. Identifying Welding Process Details
- From the corresponding `RCR-STD-XX.xlsx` file, the welding details must be matched using the `AR2 Line Class`.
- Key details to extract:
  - **Pipe material**
  - **NDT Requirements** (Non-Destructive Testing): RT, UT, MPI, DPI, HT, PMI, etc.
  - **PWHT** (Post Weld Heat Treatment) requirements.
  - **Design Temperature and Pressure**
  - **Testing Pressure**

### 3. Selecting the Correct WPS
- The app links the required welding process to the corresponding PDF in the `WPS` folder.
- Only the name of the PDF needs to be provided in the app. The physical content of the PDF does not need to be parsed by the application.
- The Welding Engineer should ensure the app properly references the document name so field workers can pull the correct PDF.

### 4. Specifying the Repair Method
- Ensure that the repair method selected fits the material constraints outlined in the RCR Standard.
- Provide clear instructions to field teams based on the NDT and PWHT requirements extracted from the standard.
