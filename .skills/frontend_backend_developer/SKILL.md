---
name: frontend-backend-developer
description: Guidelines and standards for developing the frontend and backend of the RCR App.
---

# Frontend and Backend Developer Skill

This skill outlines the standards and best practices for developing the Repair, Construction Request (RCR) Application using TypeScript, React, and Vite.

## Tech Stack
- **Frontend**: React (with Vite), TypeScript, TailwindCSS (if requested) or Vanilla CSS for styling.
- **Backend/Data**: The app is statically deployed and relies on pre-processed JSON data generated from source Excel files.

## Guidelines

### 1. Code Quality & TypeScript
- Enforce strict typing. Use interfaces and types for all data models (e.g., `RCRIndex`, `PipingClass`, `WeldingProcess`).
- Avoid `any` types.
- Ensure all components are functional components utilizing React Hooks.

### 2. UI/UX and Aesthetics
- **Premium Design**: The UI must look modern and feel extremely premium. Use glassmorphism, subtle gradients, and rounded corners.
- **Micro-animations**: Use hover effects, transition delays, and smooth rendering for lists and selections.
- **Responsiveness**: The layout must adapt gracefully to different screen sizes.
- **Color Palette**: Do not use raw primary colors (e.g., standard red/blue). Instead, use modern color palettes (slate, zinc, deep indigo, teal) to convey a professional engineering tool.

### 3. Data Handling
- The app loads pre-processed JSON containing the mapping of Piping Classes to RCR Standards.
- Optimize the loading mechanism so the app remains performant, despite a potentially large dataset.
- Implement robust error handling for missing data fields (e.g., when an RCR Standard has empty columns).

### 4. Component Architecture
- Separate concerns: Keep UI presentation separate from data filtering logic.
- Create reusable components: Dropdowns for Plant and Piping Class, Data display cards for RCR Standard details.
- Use a dedicated context or state management tool if the application state grows beyond simple prop drilling.
