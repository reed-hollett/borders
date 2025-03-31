let gui;
let aspectRatios = {
  "1:1 (Square)": { width: 1, height: 1 },
  "4:3 (Standard)": { width: 4, height: 3 },
  "16:9 (Widescreen)": { width: 16, height: 9 },
  "3:2 (Photo)": { width: 3, height: 2 },
  "2:3 (Portrait)": { width: 2, height: 3 },
  "9:16 (Mobile)": { width: 9, height: 16 },
  "21:9 (Ultrawide)": { width: 21, height: 9 }
};

// Colors extracted from the vintage catalog
let backgroundColors = [
  '#F5F2E3', // Vintage paper
  '#E8E4D5', // Aged parchment
  '#D9D2BD', // Antique paper
  '#F0EBD8', // Old document
  '#FFFFFF'  // White
];

let foregroundColors = [
  '#000000', // Black
  '#1A1A1A', // Almost black
  '#2D2D2D', // Dark gray
  '#3B3B3B'  // Charcoal
];

let vintagePNG;
let shape13PNG;

// Remove the window-level shared GUI code
let params = {
  aspectRatio: "16:9 (Widescreen)",
  flipOrientation: true,
  canvasColor: '#F5F2E3',
  borderColor: '#000000',
  borderWidth: 30,
  borderStyle: 'Fleur de Lis',
  borderStyles: [
    'Fleur de Lis',
    'Circles',
    'Flowers',
    'Spirals',
    'Ornate',
    'Leaves',
    'Diamonds',
    'Scrolls',
    'Repeating Shape',
    'Vintage Border',
    'Vintage Scroll',
    'Shape 13'
  ],
  elementSize: 20,
  elementSpacing: 20,
  borderLayers: 3,
  invertColors: false,
  animate: false,
  animateSize: false,
  animateSpacing: false,
  animateLayers: false,
  export: function() {
    saveCanvas('vintage-border', 'png');
  }
};

let lastDistortionUpdate = 0;
let distortionUpdateInterval = 100;
let currentDistortion;
let animationId;

let canvasWidth, canvasHeight;
let needsRedraw = true;

// Update the animation variables
let animationTime = 0;
let scrollOffset = 0;

let pg; // Graphics buffer

// Add these variables at the top with other declarations
let startTime;
const animationDuration = 2000; // 2 seconds in milliseconds

function setup() {
  // Randomize parameters
  randomizeParameters();
  
  // Create canvas with the selected aspect ratio
  updateCanvasDimensions();
  let canvas = createCanvas(canvasWidth, canvasHeight);
  
  // Create a graphics buffer at 2x resolution for sharper rendering
  pg = createGraphics(canvasWidth * 2, canvasHeight * 2);
  pg.pixelDensity(2);
  pg.noSmooth();
  
  // Center the canvas in the window
  let x = (windowWidth - canvasWidth) / 2;
  let y = (windowHeight - canvasHeight) / 2;
  canvas.position(x, y);
  
  // Ensure crisp rendering
  pixelDensity(1);
  noSmooth();
  
  // Create a new local GUI instance
  gui = new lil.GUI();
  
  // Create a single folder for all controls
  const borderControls = gui.addFolder('Border Controls');
  
  // Add all controls to this folder
  borderControls.add(params, 'aspectRatio', Object.keys(aspectRatios))
    .name('Aspect Ratio')
    .onChange(() => {
      updateCanvasDimensions();
      resizeCanvas(canvasWidth, canvasHeight);
      repositionCanvas();
      needsRedraw = true;
      redraw();
    });
    
  borderControls.add(params, 'flipOrientation')
    .name('Flip Orientation')
    .onChange(() => {
      updateCanvasDimensions();
      resizeCanvas(canvasWidth, canvasHeight);
      repositionCanvas();
      needsRedraw = true;
      redraw();
    });
  
  // Border controls
  borderControls.add(params, 'borderWidth', 5, 100, 1)
    .name('Border Width')
    .onChange(() => {
      needsRedraw = true;
      redraw();
    });
    
  borderControls.add(params, 'borderStyle', params.borderStyles)
    .name('Border Style')
    .onChange(() => {
      needsRedraw = true;
      redraw();
    });

  // Element Size control with animation
  borderControls.add(params, 'elementSize', 10, 120, 2)
    .name('Element Size')
    .onChange(() => {
      needsRedraw = true;
      redraw();
    });
  borderControls.add(params, 'animateSize')
    .name('Animate Size')
    .onChange(() => {
      needsRedraw = true;
      if (params.animateSize || params.animateSpacing || params.animateLayers) {
        loop();
      } else {
        noLoop();
      }
    });

  // Element Spacing control with animation
  borderControls.add(params, 'elementSpacing', 10, 100)
    .name('Element Spacing')
    .onChange(() => {
      needsRedraw = true;
      redraw();
    });
  borderControls.add(params, 'animateSpacing')
    .name('Animate Spacing')
    .onChange(() => {
      needsRedraw = true;
      if (params.animateSize || params.animateSpacing || params.animateLayers) {
        loop();
      } else {
        noLoop();
      }
    });

  // Border Layers control with animation
  borderControls.add(params, 'borderLayers', 1, 10, 1)
    .name('Border Layers')
    .onChange(() => {
      needsRedraw = true;
      redraw();
    });
  borderControls.add(params, 'animateLayers')
    .name('Animate Layers')
    .onChange(() => {
      needsRedraw = true;
      if (params.animateSize || params.animateSpacing || params.animateLayers) {
        loop();
      } else {
        noLoop();
      }
    });
  
  // Color controls
  borderControls.addColor(params, 'canvasColor')
    .name('Canvas Color')
    .onChange(() => {
      needsRedraw = true;
      redraw();
    });
    
  borderControls.addColor(params, 'borderColor')
    .name('Border Color')
    .onChange(() => {
      needsRedraw = true;
      redraw();
    });
    
  borderControls.add(params, 'invertColors')
    .name('Invert Colors')
    .onChange(() => {
      needsRedraw = true;
      redraw();
    });
    
  borderControls.add(params, 'animate')
    .name('Scroll')
    .onChange(toggleAnimation);
    
  // Add the export button last
  borderControls.add(params, 'export').name('Export as PNG');

  // Open the folder by default
  borderControls.open();
  
  // Set to only draw when needed
  noLoop();
  
  currentDistortion = generateDistortion();
  needsRedraw = true;
  
  // Force immediate draw
  redraw();

  applyTheme(getCurrentTheme());

  startTime = millis();
}

function randomizeParameters() {
  // Randomize colors
  params.canvasColor = random(backgroundColors);
  params.borderColor = random(foregroundColors);
  
  // Randomize border style
  params.borderStyle = random(params.borderStyles);
  
  // Randomize border width (between 20 and 60)
  params.borderWidth = floor(random(20, 61));
  
  // Randomize element size (between 10 and 25)
  params.elementSize = floor(random(10, 26));
  
  // Randomize element spacing (between 2 and 10)
  params.elementSpacing = floor(random(2, 11));
  
  // Randomize border layers (between 1 and 3)
  params.borderLayers = floor(random(1, 4));
  
  // Randomize aspect ratio
  const aspectRatioKeys = Object.keys(aspectRatios);
  params.aspectRatio = random(aspectRatioKeys);
  
  // Randomize orientation (50% chance of flipping)
  params.flipOrientation = random() > 0.5;
  
  // Randomize invert colors (30% chance of inverting)
  params.invertColors = random() > 0.7;
}

function repositionCanvas() {
  // Center the canvas in the window
  let x = (windowWidth - canvasWidth) / 2;
  let y = (windowHeight - canvasHeight) / 2;
  let canvas = document.querySelector('canvas');
  if (canvas) {
    canvas.style.position = 'absolute';
    canvas.style.left = x + 'px';
    canvas.style.top = y + 'px';
  }
}

function updateCanvasDimensions() {
  let ratio = aspectRatios[params.aspectRatio];
  let ratioWidth = ratio.width;
  let ratioHeight = ratio.height;
  
  if (params.flipOrientation) {
    [ratioWidth, ratioHeight] = [ratioHeight, ratioWidth];
  }
  
  // Calculate canvas dimensions to fit within the window
  const maxWidth = windowWidth * 0.8;
  const maxHeight = windowHeight * 0.8;
  
  if (maxWidth / ratioWidth < maxHeight / ratioHeight) {
    canvasWidth = Math.floor(maxWidth);
    canvasHeight = Math.floor(maxWidth * (ratioHeight / ratioWidth));
  } else {
    canvasHeight = Math.floor(maxHeight);
    canvasWidth = Math.floor(maxHeight * (ratioWidth / ratioHeight));
  }
  
  // Increase canvas height by 20%
  canvasHeight = Math.floor(canvasHeight * 1.2);
  
  // Ensure dimensions are integers for crisp rendering
  canvasWidth = Math.floor(canvasWidth);
  canvasHeight = Math.floor(canvasHeight);
}

function toggleAnimation() {
  if (params.animate) {
    // Start animation loop
    animationId = requestAnimationFrame(animationLoop);
  } else {
    // Stop animation
    cancelAnimationFrame(animationId);
    redraw();
  }
}

function animationLoop(timestamp) {
  if (timestamp - lastDistortionUpdate > distortionUpdateInterval) {
    // Increment animation time
    animationTime += 0.05;
    
    // Update scroll offset for scrolling animation - increase this value to speed up scrolling
    scrollOffset += 3; // Changed from 1 to 3 for faster scrolling
    
    lastDistortionUpdate = timestamp;
    needsRedraw = true;
    redraw();
  }
  
  animationId = requestAnimationFrame(animationLoop);
}

function draw() {
  // Handle animations
  const currentTime = millis();
  const elapsed = (currentTime - startTime) % animationDuration;
  const progress = elapsed / animationDuration;
  const sineProgress = (Math.sin(progress * Math.PI * 2) + 1) / 2; // Smooth oscillation

  let needsUpdate = false;

  // Animate element size
  if (params.animateSize) {
    const minSize = 10;
    const maxSize = 120;
    params.elementSize = minSize + (maxSize - minSize) * sineProgress;
    needsUpdate = true;
  }

  // Animate element spacing
  if (params.animateSpacing) {
    const minSpacing = 10;
    const maxSpacing = 100;
    params.elementSpacing = minSpacing + (maxSpacing - minSpacing) * sineProgress;
    needsUpdate = true;
  }

  // Animate border layers
  if (params.animateLayers) {
    const minLayers = 1;
    const maxLayers = 10;
    params.borderLayers = Math.round(minLayers + (maxLayers - minLayers) * sineProgress);
    needsUpdate = true;
  }

  // Only redraw if we need to
  if (needsUpdate || needsRedraw || params.animate) {
    // Get colors based on invert setting
    let bgColor = params.invertColors ? params.borderColor : params.canvasColor;
    let fgColor = params.invertColors ? params.canvasColor : params.borderColor;
    
    // Draw to the high-resolution buffer
    pg.background(bgColor);
    pg.fill(fgColor);
    drawBorderToBuffer();
    
    // Draw the buffer to the canvas
    background(bgColor);
    imageMode(CORNER);
    image(pg, 0, 0, width, height);
    
    needsRedraw = false;
  }
}

function drawBorderToBuffer() {
  // Modified version of drawBorder that draws to the buffer
  pg.noStroke();
  
  // Scale everything by 2 for the higher resolution
  const scale = 2;
  
  // Draw multiple border layers if specified
  for (let layer = 0; layer < params.borderLayers; layer++) {
    // Calculate the offset for this layer
    const layerOffset = layer * (params.elementSize + params.elementSpacing);
    const borderPos = (params.borderWidth + layerOffset) * scale;
    
    // Calculate the perimeter of the canvas
    const perimeter = 2 * (canvasWidth + canvasHeight) * scale;
    // Estimate number of elements based on size and spacing
    const totalSpacing = (params.elementSize + params.elementSpacing) * scale;
    const elementCount = Math.ceil(perimeter / totalSpacing);
    
    let elementIndex = 0;
    
    // Apply scrolling offset if animation is enabled
    let offset = params.animate ? (scrollOffset % totalSpacing) : 0;
    
    // Calculate the number of elements for each edge
    const topElements = Math.ceil((canvasWidth * scale - 2 * borderPos) / totalSpacing);
    const rightElements = Math.ceil((canvasHeight * scale - 2 * borderPos) / totalSpacing);
    const bottomElements = Math.ceil((canvasWidth * scale - 2 * borderPos) / totalSpacing);
    const leftElements = Math.ceil((canvasHeight * scale - 2 * borderPos) / totalSpacing);
    
    // Top edge - scrolling right
    for (let i = 0; i < topElements; i++) {
      if (elementIndex >= elementCount) break;
      const x = borderPos + (i * totalSpacing) - offset;
      drawBorderElementToBuffer(Math.floor(x), Math.floor(borderPos), Math.floor(params.elementSize * scale), 'top');
      elementIndex++;
    }
    
    // Right edge - scrolling down
    for (let i = 0; i < rightElements; i++) {
      if (elementIndex >= elementCount) break;
      const y = borderPos + (i * totalSpacing) - offset;
      drawBorderElementToBuffer(Math.floor(canvasWidth * scale - borderPos), Math.floor(y), Math.floor(params.elementSize * scale), 'right');
      elementIndex++;
    }
    
    // Bottom edge - scrolling left
    for (let i = 0; i < bottomElements; i++) {
      if (elementIndex >= elementCount) break;
      const x = canvasWidth * scale - borderPos - (i * totalSpacing) + offset;
      drawBorderElementToBuffer(Math.floor(x), Math.floor(canvasHeight * scale - borderPos), Math.floor(params.elementSize * scale), 'bottom');
      elementIndex++;
    }
    
    // Left edge - scrolling up
    for (let i = 0; i < leftElements; i++) {
      if (elementIndex >= elementCount) break;
      const y = canvasHeight * scale - borderPos - (i * totalSpacing) + offset;
      drawBorderElementToBuffer(Math.floor(borderPos), Math.floor(y), Math.floor(params.elementSize * scale), 'left');
      elementIndex++;
    }
  }
}

function drawBorderElementToBuffer(x, y, size, edge) {
  // Ensure all coordinates are integers for crisp rendering
  x = Math.floor(x);
  y = Math.floor(y);
  size = Math.floor(size);
  
  pg.push();
  pg.translate(x, y);
  
  // Remove the size variation for animation
  if (params.animate) {
    // Just apply a gentle rotation based on time for subtle movement
    let oscillation = sin(animationTime * 0.5) * 0.1;
    pg.rotate(oscillation);
  }
  
  // Rotate based on edge
  if (edge === 'right') {
    pg.rotate(PI/2);
  } else if (edge === 'bottom') {
    pg.rotate(PI);
  } else if (edge === 'left') {
    pg.rotate(3*PI/2);
  }
  
  // Use selected border style
  switch (params.borderStyle) {
    case 'Fleur de Lis':
      drawFleurDeLisToBuffer(0, 0, size);
      break;
    case 'Circles':
      drawConcentricToBuffer(0, 0, size);
      break;
    case 'Flowers':
      drawFlowerToBuffer(0, 0, size);
      break;
    case 'Spirals':
      drawSpiralToBuffer(0, 0, size);
      break;
    case 'Ornate':
      drawOrnateToBuffer(0, 0, size);
      break;
    case 'Leaves':
      drawLeafToBuffer(0, 0, size);
      break;
    case 'Diamonds':
      drawDiamondToBuffer(0, 0, size);
      break;
    case 'Scrolls':
      drawScrollToBuffer(0, 0, size);
      break;
    case 'Repeating Shape':
      drawRepeatingShapeToBuffer(0, 0, size);
      break;
    case 'Vintage Border':
      drawVintageBorderToBuffer(0, 0, size);
      break;
    case 'Vintage Scroll':
      drawVintageScrollToBuffer(0, 0, size);
      break;
    case 'Shape 13':
      drawShape13ToBuffer(0, 0, size);
      break;
  }
  
  pg.pop();
}

function drawFleurDeLisToBuffer(x, y, size) {
  // Fleur de lis inspired by the catalog
  pg.noStroke();
  
  // Base
  pg.ellipse(x, y + size/3, size/3, size/3);
  
  // Center petal
  pg.beginShape();
  pg.vertex(x, y - size/2);
  pg.bezierVertex(x + size/4, y - size/4, x + size/4, y, x, y + size/4);
  pg.bezierVertex(x - size/4, y, x - size/4, y - size/4, x, y - size/2);
  pg.endShape(CLOSE);
  
  // Side petals
  pg.beginShape();
  pg.vertex(x - size/3, y);
  pg.bezierVertex(x - size/5, y - size/5, x - size/8, y - size/3, x, y - size/6);
  pg.bezierVertex(x + size/8, y - size/3, x + size/5, y - size/5, x + size/3, y);
  pg.bezierVertex(x + size/5, y + size/5, x, y + size/3, x - size/5, y + size/5);
  pg.endShape(CLOSE);
}

function drawConcentricToBuffer(x, y, size) {
  // Concentric circles inspired by the catalog
  pg.noStroke();
  pg.ellipse(x, y, size, size);
  pg.fill(params.invertColors ? params.canvasColor : params.borderColor);
  pg.ellipse(x, y, size * 0.7, size * 0.7);
  pg.fill(params.invertColors ? params.borderColor : params.canvasColor);
  pg.ellipse(x, y, size * 0.4, size * 0.4);
}

function drawFlowerToBuffer(x, y, size) {
  // Flower pattern inspired by the catalog
  pg.noStroke();
  
  // Petals
  for (let i = 0; i < 5; i++) {
    pg.push();
    pg.translate(x, y);
    pg.rotate(i * TWO_PI / 5);
    pg.ellipse(0, -size/3, size/3, size/2);
    pg.pop();
  }
  
  // Center
  pg.ellipse(x, y, size/3, size/3);
}

function drawSpiralToBuffer(x, y, size) {
  // Spiral pattern inspired by the catalog
  pg.noStroke();
  
  // Outer circle
  pg.ellipse(x, y, size, size);
  
  // Inner spiral
  pg.fill(params.invertColors ? params.canvasColor : params.borderColor);
  pg.beginShape();
  for (let a = 0; a < TWO_PI * 2; a += 0.1) {
    let r = size/3 * (1 - a/(TWO_PI * 2));
    let sx = x + r * cos(a);
    let sy = y + r * sin(a);
    pg.vertex(sx, sy);
  }
  pg.endShape(CLOSE);
}

function drawOrnateToBuffer(x, y, size) {
  // Ornate pattern inspired by the catalog
  pg.noStroke();
  
  // Main shape
  pg.ellipse(x, y, size, size);
  
  // Decorative elements
  pg.fill(params.invertColors ? params.canvasColor : params.borderColor);
  for (let i = 0; i < 8; i++) {
    pg.push();
    pg.translate(x, y);
    pg.rotate(i * PI/4);
    pg.ellipse(0, -size/2, size/4, size/4);
    pg.pop();
  }
}

function drawLeafToBuffer(x, y, size) {
  // Leaf pattern inspired by the catalog
  pg.noStroke();
  
  // Leaf shape
  pg.beginShape();
  pg.vertex(x, y - size/2);
  pg.bezierVertex(x + size/3, y - size/4, x + size/3, y + size/4, x, y + size/2);
  pg.bezierVertex(x - size/3, y + size/4, x - size/3, y - size/4, x, y - size/2);
  pg.endShape(CLOSE);
  
  // Stem
  pg.rect(x - size/20, y - size/2, size/10, size);
}

function drawDiamondToBuffer(x, y, size) {
  // Diamond pattern inspired by the catalog
  pg.noStroke();
  
  // Diamond shape
  pg.quad(
    x, y - size/2,
    x + size/2, y,
    x, y + size/2,
    x - size/2, y
  );
  
  // Inner diamond
  pg.fill(params.invertColors ? params.canvasColor : params.borderColor);
  pg.quad(
    x, y - size/4,
    x + size/4, y,
    x, y + size/4,
    x - size/4, y
  );
}

function drawScrollToBuffer(x, y, size) {
  // Scroll pattern inspired by the catalog
  pg.noStroke();
  
  // Main scroll
  pg.beginShape();
  pg.vertex(x - size/2, y);
  pg.bezierVertex(x - size/4, y - size/3, x + size/4, y - size/3, x + size/2, y);
  pg.bezierVertex(x + size/4, y + size/3, x - size/4, y + size/3, x - size/2, y);
  pg.endShape(CLOSE);
  
  // Inner detail
  pg.fill(params.invertColors ? params.canvasColor : params.borderColor);
  pg.beginShape();
  pg.vertex(x - size/4, y);
  pg.bezierVertex(x - size/8, y - size/6, x + size/8, y - size/6, x + size/4, y);
  pg.bezierVertex(x + size/8, y + size/6, x - size/8, y + size/6, x - size/4, y);
  pg.endShape(CLOSE);
}

function drawRepeatingShapeToBuffer(x, y, size) {
  // Create a repeating pattern inspired by vintage designs
  pg.noStroke();
  
  // Main shape - a stylized flower with repeating elements
  const numPetals = 6;
  const innerSize = size * 0.4;
  const outerSize = size * 0.6;
  
  // Draw outer petals
  for (let i = 0; i < numPetals; i++) {
    pg.push();
    pg.translate(x, y);
    pg.rotate(i * TWO_PI / numPetals);
    
    // Outer petal
    pg.beginShape();
    pg.vertex(0, -outerSize);
    pg.bezierVertex(
      outerSize * 0.3, -outerSize * 0.8,
      outerSize * 0.8, -outerSize * 0.3,
      outerSize, 0
    );
    pg.bezierVertex(
      outerSize * 0.8, outerSize * 0.3,
      outerSize * 0.3, outerSize * 0.8,
      0, outerSize
    );
    pg.bezierVertex(
      -outerSize * 0.3, outerSize * 0.8,
      -outerSize * 0.8, outerSize * 0.3,
      -outerSize, 0
    );
    pg.bezierVertex(
      -outerSize * 0.8, -outerSize * 0.3,
      -outerSize * 0.3, -outerSize * 0.8,
      0, -outerSize
    );
    pg.endShape(CLOSE);
    
    // Inner detail
    pg.fill(params.invertColors ? params.canvasColor : params.borderColor);
    pg.beginShape();
    pg.vertex(0, -innerSize);
    pg.bezierVertex(
      innerSize * 0.3, -innerSize * 0.8,
      innerSize * 0.8, -innerSize * 0.3,
      innerSize, 0
    );
    pg.bezierVertex(
      innerSize * 0.8, innerSize * 0.3,
      innerSize * 0.3, innerSize * 0.8,
      0, innerSize
    );
    pg.bezierVertex(
      -innerSize * 0.3, innerSize * 0.8,
      -innerSize * 0.8, innerSize * 0.3,
      -innerSize, 0
    );
    pg.bezierVertex(
      -innerSize * 0.8, -innerSize * 0.3,
      -innerSize * 0.3, -innerSize * 0.8,
      0, -innerSize
    );
    pg.endShape(CLOSE);
    
    // Center dot
    pg.fill(params.invertColors ? params.borderColor : params.canvasColor);
    pg.ellipse(0, 0, size * 0.2, size * 0.2);
    
    pg.pop();
  }
  
  // Add connecting elements between petals
  pg.fill(params.invertColors ? params.canvasColor : params.borderColor);
  for (let i = 0; i < numPetals; i++) {
    pg.push();
    pg.translate(x, y);
    pg.rotate(i * TWO_PI / numPetals + PI / numPetals);
    
    // Curved connector
    pg.beginShape();
    pg.vertex(0, -outerSize * 0.8);
    pg.bezierVertex(
      outerSize * 0.4, -outerSize * 0.4,
      outerSize * 0.4, outerSize * 0.4,
      0, outerSize * 0.8
    );
    pg.endShape();
    
    pg.pop();
  }
}

function drawVintageBorderToBuffer(x, y, size) {
  // Create a vintage border pattern using p5.js shapes
  pg.noStroke();
  
  // Main shape - a stylized vintage border element
  const numPoints = 8;
  const innerSize = size * 0.4;
  const outerSize = size * 0.6;
  
  // Draw outer shape
  pg.beginShape();
  for (let i = 0; i < numPoints; i++) {
    const angle = (i * TWO_PI) / numPoints;
    const radius = i % 2 === 0 ? outerSize : innerSize;
    const px = x + cos(angle) * radius;
    const py = y + sin(angle) * radius;
    pg.vertex(px, py);
  }
  pg.endShape(CLOSE);
  
  // Draw inner details
  pg.fill(params.invertColors ? params.canvasColor : params.borderColor);
  
  // Center circle
  pg.ellipse(x, y, size * 0.3, size * 0.3);
  
  // Decorative elements
  for (let i = 0; i < numPoints; i++) {
    const angle = (i * TWO_PI) / numPoints;
    const radius = size * 0.5;
    const px = x + cos(angle) * radius;
    const py = y + sin(angle) * radius;
    
    // Draw small circles at each point
    pg.ellipse(px, py, size * 0.15, size * 0.15);
    
    // Draw connecting lines
    if (i > 0) {
      const prevAngle = ((i - 1) * TWO_PI) / numPoints;
      const prevX = x + cos(prevAngle) * radius;
      const prevY = y + sin(prevAngle) * radius;
      pg.line(px, py, prevX, prevY);
    }
  }
  
  // Draw center details
  pg.fill(params.invertColors ? params.borderColor : params.canvasColor);
  pg.ellipse(x, y, size * 0.15, size * 0.15);
  
  // Draw small decorative elements
  for (let i = 0; i < 4; i++) {
    const angle = (i * PI/2);
    const radius = size * 0.2;
    const px = x + cos(angle) * radius;
    const py = y + sin(angle) * radius;
    pg.ellipse(px, py, size * 0.1, size * 0.1);
  }
}

function drawVintageScrollToBuffer(x, y, size) {
  if (!vintagePNG) return;
  
  // Calculate the size to maintain aspect ratio
  const imgAspect = vintagePNG.width / vintagePNG.height;
  let drawWidth = size;
  let drawHeight = size / imgAspect;
  
  if (drawHeight > size) {
    drawHeight = size;
    drawWidth = size * imgAspect;
  }
  
  // Center the image
  const xOffset = -drawWidth / 2;
  const yOffset = -drawHeight / 2;
  
  // Use the current color scheme
  pg.tint(params.invertColors ? params.canvasColor : params.borderColor);
  
  // Draw the image
  pg.image(vintagePNG, x + xOffset, y + yOffset, drawWidth, drawHeight);
  
  // Reset tint
  pg.noTint();
}

function drawShape13ToBuffer(x, y, size) {
  if (!shape13PNG) return;
  
  // Calculate the size to maintain aspect ratio
  const imgAspect = shape13PNG.width / shape13PNG.height;
  let drawWidth = size;
  let drawHeight = size / imgAspect;
  
  if (drawHeight > size) {
    drawHeight = size;
    drawWidth = size * imgAspect;
  }
  
  // Center the image
  const xOffset = -drawWidth / 2;
  const yOffset = -drawHeight / 2;
  
  // Use the current color scheme
  pg.tint(params.invertColors ? params.canvasColor : params.borderColor);
  
  // Draw the image
  pg.image(shape13PNG, x + xOffset, y + yOffset, drawWidth, drawHeight);
  
  // Reset tint
  pg.noTint();
}

function generateDistortion() {
  // Calculate the perimeter of the canvas
  const perimeter = 2 * (canvasWidth + canvasHeight);
  // Estimate number of elements based on size and spacing
  const elementCount = Math.ceil(perimeter / (params.elementSize + params.elementSpacing));
  
  const distortionMap = new Array(elementCount);
  const threshold = params.elementVariation;
  
  for (let i = 0; i < distortionMap.length; i++) {
    // Generate a value between -threshold/2 and +threshold/2
    distortionMap[i] = map(random(100), 0, 100, -threshold/2, threshold/2);
  }
  return distortionMap;
}

function windowResized() {
  updateCanvasDimensions();
  resizeCanvas(canvasWidth, canvasHeight);
  repositionCanvas();
  currentDistortion = generateDistortion();
  needsRedraw = true;
  redraw();
}

// Theme functions
function getCurrentTheme() {
  return localStorage.getItem('theme') || 'light';
}

function applyTheme(theme) {
  if (theme === 'dark') {
    applyDarkTheme(gui);
  } else {
    applyLightTheme(gui);
  }
}

function applyDarkTheme(gui) {
  gui.domElement.style.setProperty('--background-color', '#1a1a1a');
  gui.domElement.style.setProperty('--text-color', '#CCCCCC');
  gui.domElement.style.setProperty('--title-background-color', '#2a2a2a');
  gui.domElement.style.setProperty('--title-text-color', '#FFFFFF');
  gui.domElement.style.setProperty('--widget-color', '#3a3a3a');
  gui.domElement.style.setProperty('--hover-color', '#4a4a4a');
  gui.domElement.style.setProperty('--focus-color', '#5a5a5a');
  gui.domElement.style.setProperty('--number-color', '#CCCCCC');
  gui.domElement.style.setProperty('--string-color', '#CCCCCC');
  gui.domElement.style.setProperty('--slider-knob-color', '#ffffff');
  gui.domElement.style.setProperty('--slider-input-color', '#3a3a3a');
  updateControllerStyles(gui, '#CCCCCC');

  const style = document.createElement('style');
  style.textContent = `
    .lil-gui .title:before {
      content: "▾" !important;
      font-family: inherit !important;
      font-size: 0.9em !important;
      transform: rotate(180deg);
      display: inline-block;
      padding-right: 2px;
      transition: transform 0.2s ease;
    }
    .lil-gui.closed .title:before {
      content: "▾" !important;
      font-size: 0.9em !important;
      transform: none;
      padding-right: 2px;
    }
    .lil-gui {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif !important;
    }
  `;
  gui.domElement.appendChild(style);
}

function applyLightTheme(gui) {
  gui.domElement.style.setProperty('--background-color', '#FAFAFA');
  gui.domElement.style.setProperty('--text-color', '#4D4D4D');
  gui.domElement.style.setProperty('--title-background-color', '#F0F0F0');
  gui.domElement.style.setProperty('--title-text-color', '#262626');
  gui.domElement.style.setProperty('--widget-color', '#f0f0f0');
  gui.domElement.style.setProperty('--hover-color', '#eee');
  gui.domElement.style.setProperty('--focus-color', '#ddd');
  gui.domElement.style.setProperty('--number-color', '#4D4D4D');
  gui.domElement.style.setProperty('--string-color', '#4D4D4D');
  gui.domElement.style.setProperty('--slider-knob-color', '#ffffff');
  gui.domElement.style.setProperty('--slider-input-color', '#f5f5f5');
  updateControllerStyles(gui, '#4D4D4D');

  const style = document.createElement('style');
  style.textContent = `
    .lil-gui .title:before {
      content: "▾" !important;
      font-family: inherit !important;
      font-size: 0.9em !important;
      transform: rotate(180deg);
      display: inline-block;
      padding-right: 2px;
      transition: transform 0.2s ease;
    }
    .lil-gui.closed .title:before {
      content: "▾" !important;
      font-size: 0.9em !important;
      transform: none;
      padding-right: 2px;
    }
    .lil-gui {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif !important;
    }
  `;
  gui.domElement.appendChild(style);
}

function updateControllerStyles(gui, color) {
  gui.controllers.forEach(controller => {
    if (controller.domElement) {
      controller.domElement.style.color = color;
      if (controller.domElement.querySelector('input')) {
        controller.domElement.querySelector('input').style.color = color;
      }
      
      const allDividers = controller.domElement.querySelectorAll('.c, .number');
      allDividers.forEach(divider => {
        divider.style.borderLeft = 'none !important';
        divider.style.borderRight = 'none !important';
      });

      const sliderElement = controller.domElement.querySelector('.slider');
      if (sliderElement) {
        sliderElement.style.backgroundColor = 'var(--slider-input-color)';
      }
    }
  });

  const sliderKnobs = gui.domElement.querySelectorAll('.slider > .slider-fg > .slider-knob');
  sliderKnobs.forEach(knob => {
    knob.style.backgroundColor = 'var(--slider-knob-color)';
  });

  const allGuiDividers = gui.domElement.querySelectorAll('.c, .number');
  allGuiDividers.forEach(divider => {
    divider.style.borderLeft = 'none !important';
    divider.style.borderRight = 'none !important';
  });
}

// Add this event listener after the setup function
window.addEventListener('storage', function(e) {
  if (e.key === 'theme') {
    applyTheme(e.newValue);
  }
});