# Mat Layout Editor

A web-based editor for creating and modifying putting mat layouts for the Camera.Capture system.

## Features

- **Element Types**:
    - **Search Areas** (Rectangles)
    - **Points of Interest** (Markers/Circles)
    - **Guide Lines** (Solid, Dashed, Dotted) with Angle display
    - **Arcs**
    - **Sectors** (Annulus Sectors) for fan/wedge zones
    - **Text Labels** with rotation
- **Editing Tools**:
    - **Selection & Dragging**: Intuitive handles for resizing and rotating.
    - **Snapping**:
        - **Grid Snapping**: Align to 1cm grid (hold Ctrl to disable).
        - **Object Snapping**: Snap sectors to share centers and connect radii.
    - **Property Panel**: Fine-tune coordinates, dimensions, and styles.
    - **Stacking**: Easily create stacked sector targets with "Add Above/Below".
- **Export**:
    - Save/Load JSON layouts.
    - Export as SVG or PNG.

## Usage

1.  **Open the Editor**: [Live Version on GitHub Pages](https://kallikarls.github.io/puttmateditor/)
2.  **Create/Load**: Start fresh or load an existing `layout.json`.
3.  **Edit**: Use the toolbar to add elements. Select elements to edit properties.
4.  **Save**: Download the modified JSON file.

## Development

1.  Clone the repository.
2.  Run `npm install`.
3.  Run `npm run dev` to start the local server.
