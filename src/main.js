/**
 * Mat Layout Editor - Main Application
 * 
 * A web-based editor for creating and editing putting mat layouts.
 * Compatible with PuttAnalyzer layout.json format.
 */

import './style.css';

// =====================================================
// Document Model
// =====================================================

class MatDocument {
  constructor() {
    this.version = 'v1';
    this.units = 'cm';
    this.mat = {
      width_cm: 50,
      length_cm: 400,
      color: '#1a4d2e'
    };
    this.elements = [];
    this.selectedId = null;
    this.nextId = 1;
    this.dirty = false;
  }

  getNextZOrder() {
    if (this.elements.length === 0) return 0;
    return Math.max(...this.elements.map(e => e.zOrder || 0)) + 1;
  }

  getMinZOrder() {
    if (this.elements.length === 0) return 0;
    return Math.min(...this.elements.map(e => e.zOrder || 0)) - 1;
  }

  moveElementToFront(id) {
    const element = this.getElementById(id);
    if (element) {
      element.zOrder = this.getNextZOrder();
      this.dirty = true;
      return true;
    }
    return false;
  }

  moveElementToBack(id) {
    const element = this.getElementById(id);
    if (element) {
      element.zOrder = this.getMinZOrder();
      this.dirty = true;
      return true;
    }
    return false;
  }

  createElement(type, props = {}) {
    const id = props.id || `${type}_${this.nextId++}`;
    let element;

    switch (type) {
      case 'rect':
        element = {
          id,
          type: 'rect',
          x0_cm: props.x0_cm ?? 0,
          y0_cm: props.y0_cm ?? 0,
          x1_cm: props.x1_cm ?? 20,
          y1_cm: props.y1_cm ?? 20,
          fill: props.fill ?? 'rgba(74, 158, 255, 0.3)',
          stroke: props.stroke ?? 'none',
          strokeWidth: props.strokeWidth ?? 0
        };
        break;

      case 'circle':
      case 'hole':
        element = {
          id,
          type: 'circle',
          center_cm: props.center_cm ?? { x: this.mat.width_cm / 2, y: 50 },
          radius_cm: props.radius_cm ?? 2,
          fill: props.fill ?? '#333333',
          stroke: props.stroke ?? '#ffffff',
          strokeWidth: props.strokeWidth ?? 1
        };
        break;

      case 'marker':
      case 'ball_marker':
        element = {
          id,
          type: 'marker',
          center_cm: props.center_cm ?? { x: this.mat.width_cm / 2, y: 100 },
          radius_cm: props.radius_cm ?? 0.75,
          fill: props.fill ?? '#ffffff',
          stroke: props.stroke ?? '#000000',
          strokeWidth: props.strokeWidth ?? 0.5
        };
        break;

      case 'line':
        element = {
          id,
          type: 'line',
          from_cm: props.from_cm ?? { x: 5, y: 10 },
          to_cm: props.to_cm ?? { x: 45, y: 10 },
          fill: 'none',
          stroke: props.stroke ?? '#ffffff',
          strokeWidth: props.strokeWidth ?? 1,
          lineStyle: props.lineStyle ?? 'solid' // solid, dashed, dotted
        };
        break;

      case 'arc':
        element = {
          id,
          type: 'arc',
          center_cm: props.center_cm ?? { x: this.mat.width_cm / 2, y: 50 },
          radius_cm: props.radius_cm ?? 90,
          startAngle: props.startAngle ?? 200,
          endAngle: props.endAngle ?? 340,
          stroke: props.stroke ?? '#ffffff',
          strokeWidth: props.strokeWidth ?? 1
        };
        break;

      case 'text':
        element = {
          id,
          type: 'text',
          position_cm: props.position_cm ?? { x: this.mat.width_cm / 2, y: 100 },
          text: props.text ?? 'Label',
          text: props.text ?? 'Label',
          fontFamily: props.fontFamily ?? 'Inter',
          fontSize: props.fontSize ?? 3, // in cm
          fontStyle: props.fontStyle ?? 'normal', // 'normal', 'bold', 'italic', 'bold-italic'
          fill: props.fill ?? '#ffffff',
          textAnchor: props.textAnchor ?? 'middle', // 'start', 'middle', 'end'
          rotation: props.rotation ?? 0
        };
        break;

      case 'sector':
        element = {
          id,
          type: 'sector',
          center_cm: props.center_cm ?? { x: this.mat.width_cm / 2, y: 50 },
          innerRadius_cm: props.innerRadius_cm ?? 50,
          outerRadius_cm: props.outerRadius_cm ?? 70,
          startAngle: props.startAngle ?? 225,
          endAngle: props.endAngle ?? 315,
          fill: props.fill ?? 'rgba(255, 165, 0, 0.5)',
          stroke: props.stroke ?? 'none',
          strokeWidth: props.strokeWidth ?? 0
        };
        break;

      default:
        throw new Error(`Unknown element type: ${type}`);
    }

    element.zOrder = props.zOrder ?? this.getNextZOrder();

    this.elements.push(element);
    this.dirty = true;
    return element;
  }

  getElementById(id) {
    return this.elements.find(e => e.id === id);
  }

  updateElement(id, props) {
    const element = this.getElementById(id);
    if (element) {
      Object.assign(element, props);
      this.dirty = true;
    }
    return element;
  }

  deleteElement(id) {
    const index = this.elements.findIndex(e => e.id === id);
    if (index !== -1) {
      this.elements.splice(index, 1);
      if (this.selectedId === id) {
        this.selectedId = null;
      }
      this.dirty = true;
      return true;
    }
    return false;
  }

  duplicateElement(id) {
    const element = this.getElementById(id);
    if (!element) return null;

    const clone = JSON.parse(JSON.stringify(element));
    clone.id = `${element.type}_${this.nextId++}`;

    // Offset the duplicate slightly
    if (clone.center_cm) {
      clone.center_cm.x += 5;
      clone.center_cm.y += 5;
    } else if (clone.x0_cm !== undefined) {
      clone.x0_cm += 5;
      clone.y0_cm += 5;
      clone.x1_cm += 5;
      clone.y1_cm += 5;
    } else if (clone.from_cm) {
      clone.from_cm.x += 5;
      clone.from_cm.y += 5;
      clone.to_cm.x += 5;
      clone.to_cm.y += 5;
    } else if (clone.position_cm) {
      clone.position_cm.x += 5;
      clone.position_cm.y += 5;
    }

    this.elements.push(clone);
    this.dirty = true;
    return clone;
  }

  toJSON() {
    const json = {
      metadata: {
        version: this.version,
        editor: 'mat-layout-editor',
        savedAt: new Date().toISOString()
      },
      mat: {
        width_cm: this.mat.width_cm,
        length_cm: this.mat.length_cm,
        origin: 'top_left',
        units: 'cm'
      },
      markers: [],
      areas: [],
      arcs: [],
      sectors: [],
      lines: [],
      texts: []
    };

    for (const elem of this.elements) {
      switch (elem.type) {
        case 'rect':
          json.areas.push({
            id: elem.id,
            type: 'rect',
            x0_cm: elem.x0_cm,
            y0_cm: elem.y0_cm,
            x1_cm: elem.x1_cm,
            y1_cm: elem.y1_cm,
            fill: elem.fill,
            zOrder: elem.zOrder
          });
          break;

        case 'circle':
        case 'marker':
          json.markers.push({
            id: elem.id,
            type: elem.type === 'circle' ? 'target' : 'ball_marker',
            center_cm: { ...elem.center_cm },
            radius_cm: elem.radius_cm,
            zOrder: elem.zOrder
          });
          break;

        case 'line':
          json.lines = json.lines || [];
          json.lines.push({
            id: elem.id,
            type: 'line_segment',
            from_cm: { ...elem.from_cm },
            to_cm: { ...elem.to_cm },
            lineStyle: elem.lineStyle,
            stroke: elem.stroke,
            strokeWidth: elem.strokeWidth,
            zOrder: elem.zOrder
          });
          break;

        case 'arc':
          json.arcs.push({
            id: elem.id,
            type: 'circular_arc',
            center_cm: { ...elem.center_cm },
            radius_cm: elem.radius_cm,
            startAngle: elem.startAngle,
            endAngle: elem.endAngle,
            zOrder: elem.zOrder
          });
          break;

        case 'text':
          json.texts.push({
            id: elem.id,
            type: 'text',
            position_cm: { ...elem.position_cm },
            text: elem.text,
            rotation: elem.rotation, // Changed from direction
            fontFamily: elem.fontFamily,
            fontSize: elem.fontSize,
            fontStyle: elem.fontStyle,
            fill: elem.fill,
            textAnchor: elem.textAnchor,
            zOrder: elem.zOrder
          });
          break;

        case 'sector':
          json.sectors.push({
            id: elem.id,
            type: 'annulus_sector',
            center_cm: { ...elem.center_cm },
            innerRadius_cm: elem.innerRadius_cm,
            outerRadius_cm: elem.outerRadius_cm,
            startAngle: elem.startAngle,
            endAngle: elem.endAngle,
            fill: elem.fill,
            stroke: elem.stroke,
            strokeWidth: elem.strokeWidth,
            zOrder: elem.zOrder
          });
          break;
      }
    }

    // Remove empty arrays
    if (json.markers.length === 0) delete json.markers;
    if (json.areas.length === 0) delete json.areas;
    if (json.areas.length === 0) delete json.areas;
    if (json.arcs.length === 0) delete json.arcs;
    if (json.sectors.length === 0) delete json.sectors;
    if (json.texts.length === 0) delete json.texts;
    if (!json.lines || json.lines.length === 0) delete json.lines;

    return json;
  }

  fromJSON(json) {
    this.elements = [];
    this.nextId = 1;

    // Parse mat dimensions
    if (json.mat) {
      this.mat.width_cm = json.mat.width_cm || 50;
      this.mat.length_cm = json.mat.length_cm || 400;
    }

    // Parse areas (rectangles)
    if (json.areas) {
      for (const area of json.areas) {
        this.createElement('rect', {
          id: area.id,
          x0_cm: area.x0_cm,
          y0_cm: area.y0_cm,
          x1_cm: area.x1_cm,
          y1_cm: area.y1_cm,
          fill: area.fill,
          zOrder: area.zOrder
        });
      }
    }

    // Parse markers
    if (json.markers) {
      for (const marker of json.markers) {
        const type = marker.type === 'target' ? 'circle' : 'marker';
        this.createElement(type, {
          id: marker.id,
          center_cm: marker.center_cm,
          radius_cm: marker.radius_cm || 1,
          zOrder: marker.zOrder
        });
      }
    }

    // Parse arcs
    if (json.arcs) {
      for (const arc of json.arcs) {
        this.createElement('arc', {
          id: arc.id,
          center_cm: arc.center_cm,
          radius_cm: arc.radius_cm,
          startAngle: arc.startAngle || 180,
          endAngle: arc.endAngle || 360,
          zOrder: arc.zOrder
        });
      }
    }

    // Parse texts
    if (json.texts) {
      for (const text of json.texts) {
        // Backward compatibility for 'direction'
        let rot = text.rotation || 0;
        if (text.direction === 'vertical' && !text.rotation) {
          rot = 90;
        }

        this.createElement('text', {
          id: text.id,
          position_cm: text.position_cm,
          text: text.text,
          rotation: rot,
          fontFamily: text.fontFamily,
          fontSize: text.fontSize,
          fontStyle: text.fontStyle,
          fill: text.fill,
          textAnchor: text.textAnchor,
          zOrder: text.zOrder
        });
      }
    }

    // Parse sectors
    if (json.sectors) {
      for (const sector of json.sectors) {
        this.createElement('sector', {
          id: sector.id,
          center_cm: sector.center_cm,
          innerRadius_cm: sector.innerRadius_cm,
          outerRadius_cm: sector.outerRadius_cm,
          startAngle: sector.startAngle,
          endAngle: sector.endAngle,
          fill: sector.fill,
          stroke: sector.stroke,
          strokeWidth: sector.strokeWidth,
          zOrder: sector.zOrder
        });
      }
    }

    // Parse lines (aiming_guides, behind_hole_guides, etc.)
    const parseLines = (lines) => {
      if (!lines) return;
      for (const line of lines) {
        this.createElement('line', {
          id: line.id,
          from_cm: line.from_cm,
          to_cm: line.to_cm,
          lineStyle: line.lineStyle,
          stroke: line.stroke,
          strokeWidth: line.strokeWidth,
          zOrder: line.zOrder
        });
      }
    };

    parseLines(json.aiming_guides);
    parseLines(json.lines);
    if (json.behind_hole_guides) {
      parseLines(json.behind_hole_guides.v_lines);
      parseLines(json.behind_hole_guides.vertical_guides);
    }

    this.dirty = false;
    this.selectedId = null;
  }
}

// =====================================================
// Canvas Renderer
// =====================================================

class CanvasRenderer {
  constructor(svgElement, document) {
    this.svg = svgElement;
    this.document = document;
    this.contentGroup = svgElement.querySelector('#canvas-content');
    this.handlesGroup = svgElement.querySelector('#canvas-handles');
    this.gridGroup = svgElement.querySelector('#canvas-grid');
    this.rulerX = window.document.querySelector('#ruler-x');
    this.rulerY = window.document.querySelector('#ruler-y');

    // View transform
    this.viewBox = { x: -20, y: -20, width: 100, height: 450 };
    this.scale = 1;

    // Resize observer for rulers
    this.resizeObserver = new ResizeObserver(() => this.resizeRulers());
    this.resizeObserver.observe(this.rulerX);
    this.resizeObserver.observe(this.rulerY);

    this.setupViewBox();
  }

  resizeRulers() {
    // Match canvas internal resolution to display size
    const rectX = this.rulerX.getBoundingClientRect();
    const rectY = this.rulerY.getBoundingClientRect();

    this.rulerX.width = rectX.width;
    this.rulerX.height = rectX.height;
    this.rulerY.width = rectY.width;
    this.rulerY.height = rectY.height;

    // Adjust viewBox to match new aspect ratio to prevent distortion (since preserveAspectRatio="none")
    // We try to maintain the current scale (zoom level) and center
    const containerRect = this.svg.getBoundingClientRect();
    if (containerRect.width > 0 && containerRect.height > 0 && this.viewBox.width > 0) {
      const currentPxPerCm = containerRect.width / this.viewBox.width;

      // Calculate new view dimensions based on current scale
      const newViewWidth = containerRect.width / currentPxPerCm;
      const newViewHeight = containerRect.height / currentPxPerCm;

      const centerX = this.viewBox.x + this.viewBox.width / 2;
      const centerY = this.viewBox.y + this.viewBox.height / 2;

      this.viewBox.x = centerX - newViewWidth / 2;
      this.viewBox.y = centerY - newViewHeight / 2;
      this.viewBox.width = newViewWidth;
      this.viewBox.height = newViewHeight;

      this.updateViewBox(); // This calls drawRulers
    } else {
      this.drawRulers();
    }
  }

  setupViewBox() {
    const matWidth = this.document.mat.width_cm;
    const matLength = this.document.mat.length_cm;

    // Desired bounds (Mat + Padding)
    const padding = 30;
    const boundsX = -padding;
    const boundsY = -padding;
    const boundsW = matWidth + padding * 2;
    const boundsH = matLength + padding * 2;

    // Get container aspect ratio
    const containerRect = this.svg.getBoundingClientRect();
    let containerW = containerRect.width;
    let containerH = containerRect.height;

    // Fallback if container size is not yet available (e.g. init)
    if (containerW === 0 || containerH === 0) {
      containerW = 800;
      containerH = 600;
    }

    // "Fit" logic: Find scale that fits bounds into container
    const scaleX = containerW / boundsW;
    const scaleY = containerH / boundsH;
    const scale = Math.min(scaleX, scaleY); // Fit entirely

    // Calculate new viewBox dimensions to fill container at that scale
    const viewW = containerW / scale;
    const viewH = containerH / scale;

    // Center the bounds in the new view
    const viewX = boundsX + (boundsW - viewW) / 2;
    const viewY = boundsY + (boundsH - viewH) / 2;

    this.viewBox = {
      x: viewX,
      y: viewY,
      width: viewW,
      height: viewH
    };

    this.updateViewBox();
  }

  updateViewBox() {
    const { x, y, width, height } = this.viewBox;
    this.svg.setAttribute('viewBox', `${x} ${y} ${width} ${height}`);
    this.drawRulers();
  }

  drawRulers() {
    if (!this.rulerX || !this.rulerY) return;

    const ctxX = this.rulerX.getContext('2d');
    const ctxY = this.rulerY.getContext('2d');
    const widthX = this.rulerX.width;
    const heightX = this.rulerX.height; // Is 20px usually
    const widthY = this.rulerY.width;   // Is 20px usually
    const heightY = this.rulerY.height;

    // Clear
    ctxX.clearRect(0, 0, widthX, heightX);
    ctxY.clearRect(0, 0, widthY, heightY);

    // Styling
    ctxX.fillStyle = '#8b949e';
    ctxX.font = '10px Inter';
    ctxX.textAlign = 'center';
    ctxX.textBaseline = 'top';

    ctxY.fillStyle = '#8b949e';
    ctxY.font = '10px Inter';
    ctxY.textAlign = 'right';
    ctxY.textBaseline = 'middle';

    // Calculate mapping: SVG (cm) -> Screen (px)
    // Horizontal: this.viewBox.x maps to pixel 0, this.viewBox.x + width maps to pixel widthX
    // Vertical:   this.viewBox.y maps to pixel 0, this.viewBox.y + height maps to pixel heightY

    // Scale factor (px per cm)
    const pxPerCmX = widthX / this.viewBox.width;
    const pxPerCmY = heightY / this.viewBox.height;

    // Determine tick interval
    // Ideally we want labels every ~50-100 pixels
    const targetPxInterval = 80;
    const cmIntervalCandidate = targetPxInterval / pxPerCmX; // e.g. 5cm or 10cm

    // Find nice round step: 1, 2, 5, 10, 20, 50, 100
    const steps = [1, 2, 5, 10, 20, 50, 100, 200, 500];
    let step = steps[0];
    for (const s of steps) {
      if (s >= cmIntervalCandidate) {
        step = s;
        break;
      }
    }

    // --- Draw X Ruler ---
    const startX = Math.floor(this.viewBox.x / step) * step;
    const endX = this.viewBox.x + this.viewBox.width;

    ctxX.beginPath();
    for (let cm = Math.max(0, startX); cm <= endX; cm += step) {
      const px = (cm - this.viewBox.x) * pxPerCmX;

      // Major tick
      ctxX.moveTo(px, 0);
      ctxX.lineTo(px, heightX);
      ctxX.fillText(cm.toString(), px, heightX - 12); // adjusting text pos
    }
    // Subdivisions (optional, if space permits)
    if (step >= 5) {
      const subStep = step / 5; // e.g., 2 for 10
      for (let cm = Math.max(0, startX); cm <= endX; cm += subStep) {
        if (cm < 0) continue;
        const px = (cm - this.viewBox.x) * pxPerCmX;
        ctxX.moveTo(px, heightX - 4);
        ctxX.lineTo(px, heightX);
      }
    }
    ctxX.strokeStyle = '#30363d'; // Dark gray border color
    ctxX.stroke();


    // --- Draw Y Ruler ---
    const startY = Math.floor(this.viewBox.y / step) * step;
    const endY = this.viewBox.y + this.viewBox.height;

    ctxY.beginPath();
    for (let cm = Math.max(0, startY); cm <= endY; cm += step) {
      const px = (cm - this.viewBox.y) * pxPerCmY;

      // Major tick
      ctxY.moveTo(0, px);
      ctxY.lineTo(widthY, px);

      // Rotate text for vertical ruler? Or just draw horizontally
      // Drawing horizontally
      ctxY.fillText(cm.toString(), widthY - 2, px);
    }
    // Subdivisions
    if (step >= 5) {
      const subStep = step / 5;
      for (let cm = Math.max(0, startY); cm <= endY; cm += subStep) {
        if (cm < 0) continue;
        const px = (cm - this.viewBox.y) * pxPerCmY;
        ctxY.moveTo(widthY - 4, px);
        ctxY.lineTo(widthY, px);
      }
    }
    ctxY.strokeStyle = '#30363d';
    ctxY.stroke();
  }

  zoom(factor, centerX = null, centerY = null) {
    const svgRect = this.svg.getBoundingClientRect();

    // If no center provided, use viewport center
    if (centerX === null) {
      centerX = svgRect.width / 2;
      centerY = svgRect.height / 2;
    }

    // Convert screen coords to SVG coords
    const point = this.screenToSVG(centerX, centerY);

    // Apply zoom
    const newWidth = this.viewBox.width / factor;
    const newHeight = this.viewBox.height / factor;

    // Adjust position to keep the center point in place
    this.viewBox.x = point.x - (point.x - this.viewBox.x) / factor;
    this.viewBox.y = point.y - (point.y - this.viewBox.y) / factor;
    this.viewBox.width = newWidth;
    this.viewBox.height = newHeight;

    this.scale *= factor;
    this.updateViewBox();
  }

  pan(dx, dy) {
    const svgRect = this.svg.getBoundingClientRect();
    const scaleX = this.viewBox.width / svgRect.width;
    const scaleY = this.viewBox.height / svgRect.height;

    this.viewBox.x -= dx * scaleX;
    this.viewBox.y -= dy * scaleY;
    this.updateViewBox();
  }

  fitToView() {
    this.setupViewBox();
    this.scale = 1;
  }

  screenToSVG(screenX, screenY) {
    const point = this.svg.createSVGPoint();
    point.x = screenX;
    point.y = screenY;
    return point.matrixTransform(this.svg.getScreenCTM().inverse());
  }

  render() {
    this.contentGroup.innerHTML = '';
    this.handlesGroup.innerHTML = '';

    // Render mat background
    this.renderMat();

    // Render grid
    this.renderGrid();

    // Render all elements sorted by zOrder
    const sortedElements = [...this.document.elements].sort((a, b) => (a.zOrder || 0) - (b.zOrder || 0));
    for (const element of sortedElements) {
      this.renderElement(element);
    }

    // Render selection handles
    if (this.document.selectedId) {
      this.renderSelectionHandles(this.document.getElementById(this.document.selectedId));
    }
  }

  renderMat() {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', 0);
    rect.setAttribute('y', 0);
    rect.setAttribute('width', this.document.mat.width_cm);
    rect.setAttribute('height', this.document.mat.length_cm);
    rect.setAttribute('fill', this.document.mat.color);
    rect.setAttribute('class', 'mat-background');
    this.contentGroup.appendChild(rect);
  }

  renderGrid() {
    this.gridGroup.innerHTML = '';

    // Minor grid (10cm)
    const minorGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    for (let x = 0; x <= this.document.mat.width_cm; x += 10) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x);
      line.setAttribute('y1', 0);
      line.setAttribute('x2', x);
      line.setAttribute('y2', this.document.mat.length_cm);
      line.setAttribute('stroke', 'rgba(255,255,255,0.08)');
      line.setAttribute('stroke-width', '0.3');
      minorGroup.appendChild(line);
    }
    for (let y = 0; y <= this.document.mat.length_cm; y += 10) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', 0);
      line.setAttribute('y1', y);
      line.setAttribute('x2', this.document.mat.width_cm);
      line.setAttribute('y2', y);
      line.setAttribute('stroke', 'rgba(255,255,255,0.08)');
      line.setAttribute('stroke-width', '0.3');
      minorGroup.appendChild(line);
    }
    this.gridGroup.appendChild(minorGroup);

    // Major grid (50cm)
    const majorGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    for (let x = 0; x <= this.document.mat.width_cm; x += 50) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x);
      line.setAttribute('y1', 0);
      line.setAttribute('x2', x);
      line.setAttribute('y2', this.document.mat.length_cm);
      line.setAttribute('stroke', 'rgba(255,255,255,0.15)');
      line.setAttribute('stroke-width', '0.5');
      majorGroup.appendChild(line);
    }
    for (let y = 0; y <= this.document.mat.length_cm; y += 50) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', 0);
      line.setAttribute('y1', y);
      line.setAttribute('x2', this.document.mat.width_cm);
      line.setAttribute('y2', y);
      line.setAttribute('stroke', 'rgba(255,255,255,0.15)');
      line.setAttribute('stroke-width', '0.5');
      majorGroup.appendChild(line);
    }
    this.gridGroup.appendChild(majorGroup);
  }

  renderElement(element) {
    let svgElement;
    const isSelected = element.id === this.document.selectedId;

    switch (element.type) {
      case 'rect':
        svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        svgElement.setAttribute('x', Math.min(element.x0_cm, element.x1_cm));
        svgElement.setAttribute('y', Math.min(element.y0_cm, element.y1_cm));
        svgElement.setAttribute('width', Math.abs(element.x1_cm - element.x0_cm));
        svgElement.setAttribute('height', Math.abs(element.y1_cm - element.y0_cm));
        svgElement.setAttribute('fill', element.fill || 'rgba(74, 158, 255, 0.3)');
        if (element.stroke && element.stroke !== 'none') {
          svgElement.setAttribute('stroke', element.stroke);
          svgElement.setAttribute('stroke-width', element.strokeWidth || 1);
        }
        break;

      case 'circle':
      case 'marker':
        svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        svgElement.setAttribute('cx', element.center_cm.x);
        svgElement.setAttribute('cy', element.center_cm.y);
        svgElement.setAttribute('r', element.radius_cm);
        svgElement.setAttribute('fill', element.fill || '#333');
        svgElement.setAttribute('stroke', element.stroke || '#fff');
        svgElement.setAttribute('stroke-width', element.strokeWidth || 0.5);
        break;

      case 'line':
        svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        svgElement.setAttribute('x1', element.from_cm.x);
        svgElement.setAttribute('y1', element.from_cm.y);
        svgElement.setAttribute('x2', element.to_cm.x);
        svgElement.setAttribute('y2', element.to_cm.y);

        // Line Style
        if (element.lineStyle === 'dashed') {
          svgElement.setAttribute('stroke-dasharray', '10, 5');
        } else if (element.lineStyle === 'dotted') {
          svgElement.setAttribute('stroke-dasharray', '2, 4');
        }
        svgElement.setAttribute('stroke', element.stroke || '#fff');
        svgElement.setAttribute('stroke-width', element.strokeWidth || 1);
        break;

      case 'arc':
        svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const path = this.createArcPath(element);
        svgElement.setAttribute('d', path);
        svgElement.setAttribute('fill', 'none');
        svgElement.setAttribute('stroke', element.stroke || '#fff');
        svgElement.setAttribute('stroke-width', element.strokeWidth || 1);
        break;

      case 'text':
        svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        svgElement.setAttribute('x', element.position_cm.x);
        svgElement.setAttribute('y', element.position_cm.y);
        svgElement.textContent = element.text || 'Label';

        // Font styling
        svgElement.setAttribute('font-family', element.fontFamily || 'Inter, sans-serif');
        svgElement.setAttribute('font-size', `${element.fontSize || 3}px`);
        svgElement.setAttribute('text-anchor', element.textAnchor || 'middle');
        svgElement.setAttribute('dominant-baseline', 'middle'); // Vertical centering

        // Font Style logic
        if (element.fontStyle && element.fontStyle.includes('bold')) {
          svgElement.setAttribute('font-weight', 'bold');
        }
        if (element.fontStyle && element.fontStyle.includes('italic')) {
          svgElement.setAttribute('font-style', 'italic');
        }

        svgElement.textContent = element.text || 'Label';

        // Rotation
        if (element.rotation) {
          svgElement.setAttribute('transform', `rotate(${element.rotation}, ${element.position_cm.x}, ${element.position_cm.y})`);
        }

        svgElement.setAttribute('fill', element.fill || '#ffffff');
        // Text usually doesn't have a stroke unless specified for outline effect, ignoring general element.stroke for now unless we add text outline prop
        break;

      case 'sector':
        svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const sectorPath = this.createSectorPath(element);
        svgElement.setAttribute('d', sectorPath);
        svgElement.setAttribute('fill', element.fill || 'rgba(255, 165, 0, 0.5)');
        if (element.stroke && element.stroke !== 'none') {
          svgElement.setAttribute('stroke', element.stroke);
          svgElement.setAttribute('stroke-width', element.strokeWidth || 1);
        }
        break;
    }

    if (svgElement) {
      svgElement.setAttribute('class', `element ${isSelected ? 'selected' : ''}`);
      svgElement.setAttribute('data-id', element.id);
      this.contentGroup.appendChild(svgElement);
    }
  }

  createArcPath(element) {
    const cx = element.center_cm.x;
    const cy = element.center_cm.y;
    const r = element.radius_cm;
    const startAngle = (element.startAngle || 0) * Math.PI / 180;
    const endAngle = (element.endAngle || 360) * Math.PI / 180;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);

    const largeArc = (endAngle - startAngle) > Math.PI ? 1 : 0;

    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  }

  createSectorPath(element) {
    const cx = element.center_cm.x;
    const cy = element.center_cm.y;
    const rIn = element.innerRadius_cm;
    const rOut = element.outerRadius_cm;
    // Convert to radians and subtract 90 degrees to make 0 at top (if desired) or keep standard
    // Mat coordinate system: y increases downwards. standard trig: 0 is right (x+), 90 is down (y+).
    // Let's assume standard trig for now, but user inputs might expect 0 to be "up" or "right".
    // Re-using createArcPath logic: standard radians.

    const startAngle = (element.startAngle || 0) * Math.PI / 180;
    const endAngle = (element.endAngle || 90) * Math.PI / 180;

    // 4 points
    // Outer arc start
    const x1 = cx + rOut * Math.cos(startAngle);
    const y1 = cy + rOut * Math.sin(startAngle);
    // Outer arc end
    const x2 = cx + rOut * Math.cos(endAngle);
    const y2 = cy + rOut * Math.sin(endAngle);
    // Inner arc end
    const x3 = cx + rIn * Math.cos(endAngle);
    const y3 = cy + rIn * Math.sin(endAngle);
    // Inner arc start
    const x4 = cx + rIn * Math.cos(startAngle);
    const y4 = cy + rIn * Math.sin(startAngle);

    const largeArc = Math.abs(endAngle - startAngle) > Math.PI ? 1 : 0;
    const sweep = (endAngle > startAngle) ? 1 : 0;

    // Path: Move to OuterStart -> Arc to OuterEnd -> Line to InnerEnd -> Arc to InnerStart (sweep reverse) -> Close
    const p1 = `M ${x1} ${y1}`;
    const a1 = `A ${rOut} ${rOut} 0 ${largeArc} 1 ${x2} ${y2}`;
    const l1 = `L ${x3} ${y3}`;
    const a2 = `A ${rIn} ${rIn} 0 ${largeArc} 0 ${x4} ${y4}`; // Sweep 0 for reverse direction inner arc

    return `${p1} ${a1} ${l1} ${a2} Z`;
  }

  renderSelectionHandles(element) {
    if (!element) return;

    const handles = [];
    const handleSize = Math.max(1.5, this.viewBox.width / 100);

    switch (element.type) {
      case 'rect':
        // Corner handles
        handles.push(
          { x: element.x0_cm, y: element.y0_cm, cursor: 'nw-resize', type: 'corner-nw' },
          { x: element.x1_cm, y: element.y0_cm, cursor: 'ne-resize', type: 'corner-ne' },
          { x: element.x0_cm, y: element.y1_cm, cursor: 'sw-resize', type: 'corner-sw' },
          { x: element.x1_cm, y: element.y1_cm, cursor: 'se-resize', type: 'corner-se' }
        );
        break;

      case 'circle':
      case 'marker':
        // Center and radius handle
        handles.push(
          { x: element.center_cm.x, y: element.center_cm.y, cursor: 'move', type: 'center' },
          { x: element.center_cm.x + element.radius_cm, y: element.center_cm.y, cursor: 'e-resize', type: 'radius' }
        );
        break;

      case 'line':
        handles.push(
          { x: element.from_cm.x, y: element.from_cm.y, cursor: 'move', type: 'from' },
          { x: element.to_cm.x, y: element.to_cm.y, cursor: 'move', type: 'to' }
        );
        break;

      case 'arc':
        handles.push(
          { x: element.center_cm.x, y: element.center_cm.y, cursor: 'move', type: 'center' }
        );
        break;

      case 'text':
        handles.push(
          { x: element.position_cm.x, y: element.position_cm.y, cursor: 'move', type: 'position' }
        );
        break;

      case 'sector':
        handles.push(
          { x: element.center_cm.x, y: element.center_cm.y, cursor: 'move', type: 'center' }
        );
        // Add radius handles at the middle angle
        const sa = (element.startAngle || 0) * Math.PI / 180;
        const ea = (element.endAngle || 90) * Math.PI / 180;
        const ma = (sa + ea) / 2;
        handles.push(
          {
            x: element.center_cm.x + element.innerRadius_cm * Math.cos(ma),
            y: element.center_cm.y + element.innerRadius_cm * Math.sin(ma),
            cursor: 'ew-resize',
            type: 'radius-inner'
          },
          {
            x: element.center_cm.x + element.outerRadius_cm * Math.cos(ma),
            y: element.center_cm.y + element.outerRadius_cm * Math.sin(ma),
            cursor: 'ew-resize',
            type: 'radius-outer'
          },
          // Angle handles
          {
            x: element.center_cm.x + (element.innerRadius_cm + (element.outerRadius_cm - element.innerRadius_cm) / 2) * Math.cos(sa),
            y: element.center_cm.y + (element.innerRadius_cm + (element.outerRadius_cm - element.innerRadius_cm) / 2) * Math.sin(sa),
            cursor: 'move', // or 'crosshair'
            type: 'angle-start'
          },
          {
            x: element.center_cm.x + (element.innerRadius_cm + (element.outerRadius_cm - element.innerRadius_cm) / 2) * Math.cos(ea),
            y: element.center_cm.y + (element.innerRadius_cm + (element.outerRadius_cm - element.innerRadius_cm) / 2) * Math.sin(ea),
            cursor: 'move', // or 'crosshair'
            type: 'angle-end'
          }
        );
        break;
    }

    for (const handle of handles) {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', handle.x - handleSize / 2);
      rect.setAttribute('y', handle.y - handleSize / 2);
      rect.setAttribute('width', handleSize);
      rect.setAttribute('height', handleSize);
      rect.setAttribute('class', 'selection-handle');
      rect.setAttribute('data-handle', handle.type);
      rect.setAttribute('data-element-id', element.id);
      rect.style.cursor = handle.cursor;
      this.handlesGroup.appendChild(rect);
    }
  }
}

// =====================================================
// Application Controller
// =====================================================

class MatLayoutEditor {
  constructor() {
    this.document = new MatDocument();
    this.renderer = null;
    this.currentTool = 'select';
    this.isPanning = false;
    this.isDragging = false;
    this.dragStart = null;
    this.dragHandle = null;
    this.snapToGrid = true;
    this.gridSize = 1; // 1 cm

    this.init();
  }

  init() {
    // Initialize renderer
    const svg = document.getElementById('canvas');
    this.renderer = new CanvasRenderer(svg, this.document);

    // Bind events
    this.bindToolbar();
    this.bindCanvas();
    this.bindPropertyPanel();
    this.bindKeyboard();
    this.bindFileOperations();

    // Initial render
    this.render();
    this.updateStatus('Ready - Create a new mat or load an existing layout');
  }

  bindToolbar() {
    // Tool selection
    document.getElementById('tool-select').addEventListener('click', () => this.setTool('select'));
    document.getElementById('tool-pan').addEventListener('click', () => this.setTool('pan'));

    // Add element buttons
    document.getElementById('add-rect').addEventListener('click', () => this.addElement('rect'));
    document.getElementById('add-circle').addEventListener('click', () => this.addElement('circle'));
    document.getElementById('add-marker').addEventListener('click', () => this.addElement('marker'));
    document.getElementById('add-line').addEventListener('click', () => this.addElement('line'));
    document.getElementById('add-arc').addEventListener('click', () => this.addElement('arc'));
    document.getElementById('add-sector').addEventListener('click', () => this.addElement('sector'));
    document.getElementById('add-text').addEventListener('click', () => this.addElement('text'));

    // View controls
    document.getElementById('btn-zoom-in').addEventListener('click', () => {
      this.renderer.zoom(1.25);
      this.updateZoomDisplay();
    });
    document.getElementById('btn-zoom-out').addEventListener('click', () => {
      this.renderer.zoom(0.8);
      this.updateZoomDisplay();
    });
    document.getElementById('btn-zoom-fit').addEventListener('click', () => {
      this.renderer.fitToView();
      this.updateZoomDisplay();
    });

    // Snap Toggle
    document.getElementById('btn-snap').addEventListener('click', (e) => {
      this.snapToGrid = !this.snapToGrid;
      e.currentTarget.classList.toggle('active', this.snapToGrid);
      this.updateStatus(`Snap to Grid: ${this.snapToGrid ? 'ON' : 'OFF'}`);
    });
  }

  bindCanvas() {
    const svg = document.getElementById('canvas');
    const container = document.getElementById('canvas-container');

    // Mouse wheel zoom
    container.addEventListener('wheel', (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      this.renderer.zoom(factor, e.clientX, e.clientY);
      this.updateZoomDisplay();
    }, { passive: false });

    // Mouse events
    svg.addEventListener('mousedown', (e) => this.onCanvasMouseDown(e));
    svg.addEventListener('mousemove', (e) => this.onCanvasMouseMove(e));
    svg.addEventListener('mouseup', (e) => this.onCanvasMouseUp(e));
    svg.addEventListener('mouseleave', (e) => this.onCanvasMouseUp(e));

    // Click on elements
    svg.addEventListener('click', (e) => {
      const target = e.target;
      if (target.classList.contains('element')) {
        const id = target.getAttribute('data-id');
        this.selectElement(id);
      } else if (target === svg || target.classList.contains('mat-background')) {
        this.selectElement(null);
      }
    });
  }

  bindPropertyPanel() {
    // Mat properties
    document.getElementById('mat-width').addEventListener('change', (e) => {
      this.document.mat.width_cm = parseFloat(e.target.value) || 50;
      this.renderer.setupViewBox();
      this.render();
    });
    document.getElementById('mat-length').addEventListener('change', (e) => {
      this.document.mat.length_cm = parseFloat(e.target.value) || 400;
      this.renderer.setupViewBox();
      this.render();
    });
    document.getElementById('mat-color').addEventListener('change', (e) => {
      this.document.mat.color = e.target.value;
      this.render();
    });

    // Element properties
    const updateElement = () => {
      if (!this.document.selectedId) return;
      const element = this.document.getElementById(this.document.selectedId);
      if (!element) return;

      const id = document.getElementById('elem-id').value;
      if (id && id !== element.id) {
        element.id = id;
      }

      if (element.type === 'rect') {
        element.x0_cm = parseFloat(document.getElementById('elem-x0').value) || 0;
        element.y0_cm = parseFloat(document.getElementById('elem-y0').value) || 0;
        element.x1_cm = parseFloat(document.getElementById('elem-x1').value) || 0;
        element.y1_cm = parseFloat(document.getElementById('elem-y1').value) || 0;
      } else if (element.type === 'circle' || element.type === 'marker') {
        element.center_cm.x = parseFloat(document.getElementById('elem-cx').value) || 0;
        element.center_cm.y = parseFloat(document.getElementById('elem-cy').value) || 0;
        element.radius_cm = parseFloat(document.getElementById('elem-radius').value) || 1;
      } else if (element.type === 'line') {
        element.from_cm.x = parseFloat(document.getElementById('elem-lx1').value) || 0;
        element.from_cm.y = parseFloat(document.getElementById('elem-ly1').value) || 0;
        element.to_cm.x = parseFloat(document.getElementById('elem-lx2').value) || 0;
        element.to_cm.y = parseFloat(document.getElementById('elem-ly2').value) || 0;
        element.lineStyle = document.getElementById('elem-line-style').value || 'solid';
      } else if (element.type === 'arc') {
        element.center_cm.x = parseFloat(document.getElementById('elem-acx').value) || 0;
        element.center_cm.y = parseFloat(document.getElementById('elem-acy').value) || 0;
        element.radius_cm = parseFloat(document.getElementById('elem-arc-radius').value) || 1;
        element.startAngle = parseFloat(document.getElementById('elem-arc-start').value) || 0;
        element.endAngle = parseFloat(document.getElementById('elem-arc-end').value) || 360;
      } else if (element.type === 'text') {
        element.position_cm.x = parseFloat(document.getElementById('elem-text-x').value) || 0;
        element.position_cm.y = parseFloat(document.getElementById('elem-text-y').value) || 0;
        element.text = document.getElementById('elem-text-content').value || 'Label';
        element.rotation = parseFloat(document.getElementById('elem-text-rotation').value) || 0;
        element.fontFamily = document.getElementById('elem-text-font').value || 'Inter';
        element.fontSize = parseFloat(document.getElementById('elem-text-size').value) || 3;
        element.fontStyle = document.getElementById('elem-text-style').value || 'normal';
      } else if (element.type === 'sector') {
        element.center_cm.x = parseFloat(document.getElementById('elem-sector-x').value) || 0;
        element.center_cm.y = parseFloat(document.getElementById('elem-sector-y').value) || 0;
        element.innerRadius_cm = parseFloat(document.getElementById('elem-sector-inner').value) || 0;
        element.outerRadius_cm = parseFloat(document.getElementById('elem-sector-outer').value) || 0;
        element.startAngle = parseFloat(document.getElementById('elem-sector-start').value) || 0;
        element.endAngle = parseFloat(document.getElementById('elem-sector-end').value) || 0;
      }

      // Style
      const fillNone = document.getElementById('elem-fill-none').checked;
      const strokeNone = document.getElementById('elem-stroke-none').checked;
      element.fill = fillNone ? 'none' : document.getElementById('elem-fill').value;
      element.stroke = strokeNone ? 'none' : document.getElementById('elem-stroke').value;
      element.strokeWidth = strokeNone ? 0 : (parseFloat(document.getElementById('elem-stroke-width').value) || 1);

      this.document.dirty = true;
      this.render();
    };

    // Bind all input changes
    const inputs = document.querySelectorAll('#element-properties input, #element-properties select');
    inputs.forEach(input => {
      input.addEventListener('change', updateElement);
    });

    // Sector Stacking
    document.getElementById('btn-sector-above').addEventListener('click', () => this.addSectorStack('above'));
    document.getElementById('btn-sector-below').addEventListener('click', () => this.addSectorStack('below'));



    // Delete and duplicate buttons
    document.getElementById('btn-delete-element').addEventListener('click', () => {
      if (this.document.selectedId) {
        this.document.deleteElement(this.document.selectedId);
        this.render();
        this.updateElementsList();
        this.updateStatus('Element deleted');
      }
    });

    document.getElementById('btn-duplicate-element').addEventListener('click', () => {
      if (this.document.selectedId) {
        const newElem = this.document.duplicateElement(this.document.selectedId);
        if (newElem) {
          this.selectElement(newElem.id);
          this.updateStatus('Element duplicated');
        }
      }
    });

    document.getElementById('btn-move-front').addEventListener('click', () => {
      if (this.document.selectedId) {
        this.document.moveElementToFront(this.document.selectedId);
        this.render();
        this.updateStatus('Moved to front');
      }
    });

    document.getElementById('btn-move-back').addEventListener('click', () => {
      if (this.document.selectedId) {
        this.document.moveElementToBack(this.document.selectedId);
        this.render();
        this.updateStatus('Moved to back');
      }
    });
  }

  bindKeyboard() {
    document.addEventListener('keydown', (e) => {
      // Don't handle if typing in input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case 'v':
        case 'V':
          this.setTool('select');
          break;
        case ' ':
          e.preventDefault();
          this.setTool('pan');
          break;
        case 'Delete':
        case 'Backspace':
          if (this.document.selectedId) {
            this.document.deleteElement(this.document.selectedId);
            this.render();
            this.updateElementsList();
          }
          break;
        case 'd':
          if (e.ctrlKey && this.document.selectedId) {
            e.preventDefault();
            const newElem = this.document.duplicateElement(this.document.selectedId);
            if (newElem) this.selectElement(newElem.id);
          }
          break;
        case '=':
        case '+':
          this.renderer.zoom(1.25);
          this.updateZoomDisplay();
          break;
        case '-':
          this.renderer.zoom(0.8);
          this.updateZoomDisplay();
          break;
        case '0':
          this.renderer.fitToView();
          this.updateZoomDisplay();
          break;
        case 's':
          if (e.ctrlKey) {
            e.preventDefault();
            this.saveFile();
          }
          break;
        case 'o':
          if (e.ctrlKey) {
            e.preventDefault();
            document.getElementById('file-input').click();
          }
          break;
      }
    });

    document.addEventListener('keyup', (e) => {
      if (e.key === ' ') {
        this.setTool('select');
      }
    });
  }

  bindFileOperations() {
    document.getElementById('btn-new').addEventListener('click', () => this.newDocument());
    document.getElementById('btn-load').addEventListener('click', () => {
      document.getElementById('file-input').click();
    });
    document.getElementById('btn-load-example').addEventListener('click', () => this.loadExample());
    document.getElementById('btn-save').addEventListener('click', () => this.saveFile());
    document.getElementById('btn-export-svg').addEventListener('click', () => this.exportSVG());
    document.getElementById('btn-export-png').addEventListener('click', () => this.exportPNG());

    document.getElementById('file-input').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.loadFile(file);
      }
    });
  }

  loadExample() {
    if (confirm('Load example layout? Any unsaved changes will be lost.')) {
      fetch('example_layout.json')
        .then(response => {
          if (!response.ok) throw new Error('Example not found');
          return response.json();
        })
        .then(json => {
          this.document.fromJSON(json);
          this.renderer.setupViewBox(); // Important if mat size changed
          this.render();
          this.updateElementsList();
          this.updateStatus('Example layout loaded');
        })
        .catch(err => {
          console.error(err);
          alert('Failed to load example: ' + err.message);
        });
    }
  }

  setTool(tool) {
    this.currentTool = tool;

    // Update UI
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
    const toolBtn = document.getElementById(`tool-${tool}`);
    if (toolBtn) toolBtn.classList.add('active');

    // Update cursor
    const svg = document.getElementById('canvas');
    svg.classList.toggle('panning', tool === 'pan');
  }

  addSectorStack(direction) {
    if (!this.document.selectedId) return;
    const current = this.document.getElementById(this.document.selectedId);
    if (!current || current.type !== 'sector') return;

    const thickness = current.outerRadius_cm - current.innerRadius_cm;
    let newInner, newOuter;

    if (direction === 'above') {
      newInner = current.outerRadius_cm;
      newOuter = current.outerRadius_cm + thickness;
    } else {
      newOuter = current.innerRadius_cm;
      newInner = Math.max(0, current.innerRadius_cm - thickness);
    }

    const props = {
      center_cm: { ...current.center_cm },
      innerRadius_cm: newInner,
      outerRadius_cm: newOuter,
      startAngle: current.startAngle,
      endAngle: current.endAngle,
      fill: current.fill, // Copy style or maybe vary slightly? No, Copy is safer.
      stroke: current.stroke,
      strokeWidth: current.strokeWidth
    };

    const element = this.document.createElement('sector', props);
    this.selectElement(element.id);
    this.updateElementsList();
    this.updateStatus(`Added sector ${direction}`);
  }

  addElement(type) {
    // Center the new element in view
    const cx = this.document.mat.width_cm / 2;
    const cy = this.renderer.viewBox.y + this.renderer.viewBox.height / 2;

    let props = {};
    switch (type) {
      case 'rect':
        props = { x0_cm: cx - 10, y0_cm: cy - 10, x1_cm: cx + 10, y1_cm: cy + 10 };
        break;
      case 'circle':
        props = { center_cm: { x: cx, y: cy }, radius_cm: 3 };
        break;
      case 'marker':
        props = { center_cm: { x: cx, y: cy }, radius_cm: 1 };
        break;
      case 'line':
        props = { from_cm: { x: 5, y: cy }, to_cm: { x: this.document.mat.width_cm - 5, y: cy } };
        break;
      case 'arc':
        props = { center_cm: { x: cx, y: 50 }, radius_cm: 50, startAngle: 200, endAngle: 340 };
        break;
      case 'text':
        props = { position_cm: { x: cx, y: cy }, text: 'Text', fontSize: 3 };
        break;
      case 'sector':
        props = {
          center_cm: { x: cx, y: 50 },
          innerRadius_cm: 30,
          outerRadius_cm: 50,
          startAngle: 220,
          endAngle: 320
        };
        break;
    }

    const element = this.document.createElement(type, props);
    this.selectElement(element.id);
    this.updateElementsList();
    this.updateStatus(`Added ${type} element`);
  }

  selectElement(id) {
    this.document.selectedId = id;
    this.render();
    this.updatePropertyPanel();
    this.updateElementsList();
  }

  onCanvasMouseDown(e) {
    const svg = document.getElementById('canvas');
    const point = this.renderer.screenToSVG(e.clientX, e.clientY);

    // Check if clicking on a handle
    const handle = e.target.closest('.selection-handle');
    if (handle) {
      this.isDragging = true;
      this.dragHandle = handle.getAttribute('data-handle');
      this.dragStart = point;
      return;
    }

    if (this.currentTool === 'pan' || e.button === 1) {
      this.isPanning = true;
      this.dragStart = { x: e.clientX, y: e.clientY };
      svg.style.cursor = 'grabbing';
    } else if (this.currentTool === 'select') {
      // Check if clicking on an element for dragging
      const element = e.target.closest('.element');
      if (element) {
        const id = element.getAttribute('data-id');
        this.selectElement(id);
        this.isDragging = true;
        this.dragHandle = 'move';
        this.dragStart = point;
      }
    }
  }

  onCanvasMouseMove(e) {
    const point = this.renderer.screenToSVG(e.clientX, e.clientY);

    // Update cursor position display
    document.getElementById('cursor-pos').textContent =
      `X: ${point.x.toFixed(1)} cm, Y: ${point.y.toFixed(1)} cm`;

    if (this.isPanning) {
      const dx = e.clientX - this.dragStart.x;
      const dy = e.clientY - this.dragStart.y;
      this.renderer.pan(dx, dy);
      this.dragStart = { x: e.clientX, y: e.clientY };
    } else if (this.isDragging && this.document.selectedId) {
      this.handleDrag(point, e.ctrlKey);
    }
  }

  onCanvasMouseUp(e) {
    const svg = document.getElementById('canvas');

    if (this.isPanning) {
      this.isPanning = false;
      svg.style.cursor = this.currentTool === 'pan' ? 'grab' : 'crosshair';
    }

    if (this.isDragging) {
      this.isDragging = false;
      this.dragHandle = null;
      this.dragStart = null;
    }
  }

  handleDrag(point, isCtrlPressed) {
    if (!this.dragStart) return;

    const dx = point.x - this.dragStart.x;
    const dy = point.y - this.dragStart.y;
    const element = this.document.getElementById(this.document.selectedId);
    if (!element) return;

    // Grid Snapping Helper
    const snap = (val) => {
      if (this.snapToGrid && !isCtrlPressed) {
        return Math.round(val / this.gridSize) * this.gridSize;
      }
      return val;
    };

    // For handles, snap the input point itself if enabled
    if (this.snapToGrid && !isCtrlPressed && this.dragHandle !== 'move') {
      point.x = snap(point.x);
      point.y = snap(point.y);
    }

    switch (this.dragHandle) {
      case 'move':
      case 'center':
        if (element.center_cm) {
          let newX = element.center_cm.x + dx;
          let newY = element.center_cm.y + dy;

          if (this.snapToGrid && !isCtrlPressed) {
            newX = snap(newX);
            newY = snap(newY);
          }

          // Existing Object Snap Logic (keep it, but maybe apply after?)
          const objSnap = this.findSnapTarget('center', { x: newX, y: newY });
          if (objSnap.snapped) {
            newX = objSnap.x;
            newY = objSnap.y;
          }

          element.center_cm.x = newX;
          element.center_cm.y = newY;
        } else if (element.x0_cm !== undefined) {
          // Rect move
          // Calculate new pos
          let w = element.x1_cm - element.x0_cm;
          let h = element.y1_cm - element.y0_cm;
          let newX0 = element.x0_cm + dx;
          let newY0 = element.y0_cm + dy;

          if (this.snapToGrid && !isCtrlPressed) {
            newX0 = snap(newX0);
            newY0 = snap(newY0);
          }

          element.x0_cm = newX0;
          element.y0_cm = newY0;
          element.x1_cm = newX0 + w;
          element.y1_cm = newY0 + h;
        } else if (element.from_cm) {
          element.from_cm.x += dx;
          element.from_cm.y += dy;
          element.to_cm.x += dx;
          element.to_cm.y += dy;
        }
        else if (element.position_cm) {
          let newX = element.position_cm.x + dx;
          let newY = element.position_cm.y + dy;
          if (this.snapToGrid && !isCtrlPressed) {
            newX = snap(newX);
            newY = snap(newY);
          }
          element.position_cm.x = newX;
          element.position_cm.y = newY;
        }
        break;

      case 'corner-se':
        element.x1_cm = point.x;
        element.y1_cm = point.y;
        break;
      case 'corner-nw':
        element.x0_cm = point.x;
        element.y0_cm = point.y;
        break;
      case 'corner-ne':
        element.x1_cm = point.x;
        element.y0_cm = point.y;
        break;
      case 'corner-sw':
        element.x0_cm = point.x;
        element.y1_cm = point.y;
        break;

      case 'radius':
        if (element.radius_cm !== undefined) {
          element.radius_cm = Math.max(0.5, Math.abs(point.x - element.center_cm.x));
        }
        break;

      case 'from':
        if (element.from_cm) {
          element.from_cm.x = point.x;
          element.from_cm.y = point.y;
        }
        break;

      case 'to':
        if (element.to_cm) {
          element.to_cm.x = point.x;
          element.to_cm.y = point.y;
        }
        break;

      case 'radius-inner':
        if (element.innerRadius_cm !== undefined) {
          let r = Math.abs(Math.hypot(point.x - element.center_cm.x, point.y - element.center_cm.y));
          const snap = this.findSnapTarget('radius', r);
          if (snap.snapped) r = snap.val;
          element.innerRadius_cm = Math.max(0, r);
        }
        break;

      case 'radius-outer':
        if (element.outerRadius_cm !== undefined) {
          let r = Math.abs(Math.hypot(point.x - element.center_cm.x, point.y - element.center_cm.y));
          const snap = this.findSnapTarget('radius', r);
          if (snap.snapped) r = snap.val;
          element.outerRadius_cm = Math.max((element.innerRadius_cm || 0) + 1, r);
        }
        break;

      case 'angle-start':
        if (element.startAngle !== undefined) {
          let angle = Math.atan2(point.y - element.center_cm.y, point.x - element.center_cm.x) * 180 / Math.PI;
          if (angle < 0) angle += 360;
          element.startAngle = Math.round(angle);
        }
        break;

      case 'angle-end':
        if (element.endAngle !== undefined) {
          let angle = Math.atan2(point.y - element.center_cm.y, point.x - element.center_cm.x) * 180 / Math.PI;
          if (angle < 0) angle += 360;
          element.endAngle = Math.round(angle);
        }
        break;

      case 'position':
        if (element.position_cm) {
          element.position_cm.x = point.x;
          element.position_cm.y = point.y;
        }
        break;
    }

    this.dragStart = point;
    this.document.dirty = true;
    this.render();
    this.updatePropertyPanel();
  }

  findSnapTarget(type, value, threshold = 2) {
    const currentId = this.document.selectedId;
    const currentElem = this.document.getElementById(currentId);

    // Snap Center
    if (type === 'center') {
      const snapDist = threshold;

      for (const elem of this.document.elements) {
        if (elem.id === currentId) continue;
        if (!elem.center_cm && !elem.position_cm) continue;

        const target = elem.center_cm || elem.position_cm;
        const dx = Math.abs(target.x - value.x);
        const dy = Math.abs(target.y - value.y);

        if (dx < snapDist && dy < snapDist) {
          return { x: target.x, y: target.y, snapped: true };
        }
      }
    }

    // Snap Radius (matches Inner OR Outer of other sectors with SAME center)
    if (type === 'radius') {
      if (!currentElem.center_cm) return { val: value, snapped: false };

      const snapDist = 1; // 1cm threshold

      for (const elem of this.document.elements) {
        if (elem.id === currentId) continue;
        if (elem.type !== 'sector') continue;

        // Only snap if centers are very close (effectively same)
        const dx = Math.abs(elem.center_cm.x - currentElem.center_cm.x);
        const dy = Math.abs(elem.center_cm.y - currentElem.center_cm.y);

        if (dx < 0.1 && dy < 0.1) {
          // Check inner radius
          if (Math.abs(elem.innerRadius_cm - value) < snapDist) {
            return { val: elem.innerRadius_cm, snapped: true };
          }
          // Check outer radius
          if (Math.abs(elem.outerRadius_cm - value) < snapDist) {
            return { val: elem.outerRadius_cm, snapped: true };
          }
        }
      }
    }

    return { ...value, snapped: false };
  }

  updatePropertyPanel() {
    const matProps = document.getElementById('mat-properties');
    const elemProps = document.getElementById('element-properties');

    if (!this.document.selectedId) {
      matProps.style.display = 'block';
      elemProps.style.display = 'none';

      // Update mat values
      document.getElementById('mat-width').value = this.document.mat.width_cm;
      document.getElementById('mat-length').value = this.document.mat.length_cm;
      document.getElementById('mat-color').value = this.document.mat.color;
      return;
    }

    matProps.style.display = 'none';
    elemProps.style.display = 'block';

    const element = this.document.getElementById(this.document.selectedId);
    if (!element) return;

    document.getElementById('elem-id').value = element.id;
    document.getElementById('elem-type').value = element.type;

    // Hide all type-specific props
    document.getElementById('rect-props').style.display = 'none';
    document.getElementById('circle-props').style.display = 'none';
    document.getElementById('line-props').style.display = 'none';
    document.getElementById('arc-props').style.display = 'none';
    document.getElementById('arc-props').style.display = 'none';
    document.getElementById('text-props').style.display = 'none';
    document.getElementById('sector-props').style.display = 'none';

    // Show relevant props
    switch (element.type) {
      case 'rect':
        document.getElementById('rect-props').style.display = 'block';
        document.getElementById('elem-x0').value = element.x0_cm?.toFixed(1) || 0;
        document.getElementById('elem-y0').value = element.y0_cm?.toFixed(1) || 0;
        document.getElementById('elem-x1').value = element.x1_cm?.toFixed(1) || 0;
        document.getElementById('elem-y1').value = element.y1_cm?.toFixed(1) || 0;
        break;

      case 'circle':
      case 'marker':
        document.getElementById('circle-props').style.display = 'block';
        document.getElementById('elem-cx').value = element.center_cm?.x?.toFixed(1) || 0;
        document.getElementById('elem-cy').value = element.center_cm?.y?.toFixed(1) || 0;
        document.getElementById('elem-radius').value = element.radius_cm?.toFixed(2) || 1;
        break;

      case 'line':
        document.getElementById('line-props').style.display = 'block';
        document.getElementById('elem-lx1').value = element.from_cm?.x?.toFixed(1) || 0;
        document.getElementById('elem-ly1').value = element.from_cm?.y?.toFixed(1) || 0;
        document.getElementById('elem-lx2').value = element.to_cm?.x?.toFixed(1) || 0;
        document.getElementById('elem-ly2').value = element.to_cm?.y?.toFixed(1) || 0;

        // Line Style & Angle
        document.getElementById('elem-line-style').value = element.lineStyle || 'solid';

        const dx = element.to_cm.x - element.from_cm.x;
        const dy = element.to_cm.y - element.from_cm.y;
        let angle = Math.atan2(dy, dx) * 180 / Math.PI;
        // Normalize angle presentation if needed, but raw +/- 180 is often fine for engineering
        document.getElementById('elem-line-angle').value = angle.toFixed(1);
        break;

      case 'arc':
        document.getElementById('arc-props').style.display = 'block';
        document.getElementById('elem-acx').value = element.center_cm?.x?.toFixed(1) || 0;
        document.getElementById('elem-acy').value = element.center_cm?.y?.toFixed(1) || 0;
        document.getElementById('elem-arc-radius').value = element.radius_cm?.toFixed(1) || 1;
        document.getElementById('elem-arc-start').value = element.startAngle || 0;
        document.getElementById('elem-arc-end').value = element.endAngle || 360;
        break;

      case 'text':
        document.getElementById('text-props').style.display = 'block';
        document.getElementById('elem-text-x').value = element.position_cm?.x?.toFixed(1) || 0;
        document.getElementById('elem-text-y').value = element.position_cm?.y?.toFixed(1) || 0;
        document.getElementById('elem-text-content').value = element.text || 'Label';
        document.getElementById('elem-text-rotation').value = element.rotation || 0;
        document.getElementById('elem-text-font').value = element.fontFamily || 'Inter';
        document.getElementById('elem-text-size').value = element.fontSize || 3;
        document.getElementById('elem-text-style').value = element.fontStyle || 'normal';
        break;

      case 'sector':
        document.getElementById('sector-props').style.display = 'block';
        document.getElementById('elem-sector-x').value = element.center_cm?.x?.toFixed(1) || 0;
        document.getElementById('elem-sector-y').value = element.center_cm?.y?.toFixed(1) || 0;
        document.getElementById('elem-sector-inner').value = element.innerRadius_cm?.toFixed(1) || 0;
        document.getElementById('elem-sector-outer').value = element.outerRadius_cm?.toFixed(1) || 0;
        document.getElementById('elem-sector-start').value = element.startAngle || 0;
        document.getElementById('elem-sector-end').value = element.endAngle || 0;
        break;
    }

    // Style
    const fill = element.fill || 'rgba(74, 158, 255, 0.3)';
    const stroke = element.stroke || 'none';
    document.getElementById('elem-fill').value = (fill === 'none' || fill.startsWith('rgba')) ? '#4a9eff' : fill;
    document.getElementById('elem-fill-none').checked = fill === 'none';
    document.getElementById('elem-stroke').value = stroke === 'none' ? '#ffffff' : stroke;
    document.getElementById('elem-stroke-none').checked = stroke === 'none';
    document.getElementById('elem-stroke-width').value = element.strokeWidth || 1;
    document.getElementById('stroke-width-row').style.display = stroke === 'none' ? 'none' : 'block';
  }

  updateElementsList() {
    const list = document.getElementById('elements-list');
    list.innerHTML = '';

    for (const element of this.document.elements) {
      const item = document.createElement('div');
      item.className = `element-item ${element.id === this.document.selectedId ? 'selected' : ''}`;
      item.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          ${this.getElementIcon(element.type)}
        </svg>
        <span>${element.id}</span>
      `;
      item.addEventListener('click', () => this.selectElement(element.id));
      list.appendChild(item);
    }

    document.getElementById('element-count').textContent =
      `${this.document.elements.length} element${this.document.elements.length !== 1 ? 's' : ''}`;
  }

  getElementIcon(type) {
    switch (type) {
      case 'rect': return '<rect x="3" y="3" width="18" height="18" rx="2"/>';
      case 'circle': return '<circle cx="12" cy="12" r="9"/>';
      case 'marker': return '<circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="8"/>';
      case 'line': return '<line x1="5" y1="19" x2="19" y2="5"/>';
      case 'arc': return '<path d="M3 12c0-4.97 4.03-9 9-9"/>';
      case 'sector': return '<path d="M12 21 L12 21 L21 12 A13 13 0 0 0 3 12 L12 12 Z"/>'; // Crude fan shape
      case 'text': return '<path d="M4 7V4h16v3"/><path d="M12 4v16"/><path d="M8 20h8"/>';
      default: return '<circle cx="12" cy="12" r="9"/>';
    }
  }

  updateZoomDisplay() {
    const zoom = Math.round(this.renderer.scale * 100);
    document.getElementById('zoom-level').textContent = `${zoom}%`;
  }

  updateStatus(message) {
    document.getElementById('status-message').textContent = message;
  }

  render() {
    this.renderer.render();
  }

  // File operations
  newDocument() {
    if (this.document.dirty) {
      if (!confirm('Discard unsaved changes?')) return;
    }
    this.document = new MatDocument();
    this.renderer.document = this.document;
    this.renderer.setupViewBox();
    this.render();
    this.updatePropertyPanel();
    this.updateElementsList();
    this.updateStatus('New document created');
  }

  loadFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        this.document.fromJSON(json);
        this.renderer.document = this.document;
        this.renderer.setupViewBox();
        this.render();
        this.updatePropertyPanel();
        this.updateElementsList();
        this.updateStatus(`Loaded: ${file.name}`);
      } catch (err) {
        alert(`Error loading file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  }

  saveFile() {
    const json = this.document.toJSON();
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'layout.json';
    a.click();

    URL.revokeObjectURL(url);
    this.document.dirty = false;
    this.updateStatus('File saved');
  }

  exportSVG() {
    // Clone the content for export
    const exportSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    exportSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    exportSvg.setAttribute('viewBox', `0 0 ${this.document.mat.width_cm} ${this.document.mat.length_cm}`);
    exportSvg.setAttribute('width', this.document.mat.width_cm * 10);
    exportSvg.setAttribute('height', this.document.mat.length_cm * 10);

    // Clone content (without grid and handles)
    const content = this.renderer.contentGroup.cloneNode(true);
    exportSvg.appendChild(content);

    const blob = new Blob([exportSvg.outerHTML], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'mat-layout.svg';
    a.click();

    URL.revokeObjectURL(url);
    this.updateStatus('Exported as SVG');
  }

  exportPNG() {
    const canvas = document.createElement('canvas');
    const scale = 10; // 10 pixels per cm
    canvas.width = this.document.mat.width_cm * scale;
    canvas.height = this.document.mat.length_cm * scale;

    const ctx = canvas.getContext('2d');

    // Create SVG for export
    const exportSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    exportSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    exportSvg.setAttribute('viewBox', `0 0 ${this.document.mat.width_cm} ${this.document.mat.length_cm}`);

    const content = this.renderer.contentGroup.cloneNode(true);
    exportSvg.appendChild(content);

    const svgData = new XMLSerializer().serializeToString(exportSvg);
    const img = new Image();

    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mat-layout.png';
        a.click();
        URL.revokeObjectURL(url);
        this.updateStatus('Exported as PNG');
      }, 'image/png');
    };

    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);
  }
}

// =====================================================
// Initialize Application
// =====================================================

window.addEventListener('DOMContentLoaded', () => {
  window.app = new MatLayoutEditor();
});
