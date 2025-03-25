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

let params = {
  aspectRatio: "16:9 (Widescreen)",
  flipOrientation: true,
  canvasColor: '#F5F2E3', // Default to vintage paper
  borderColor: '#000000', // Default to black
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
    'Scrolls'
  ],
  elementSize: 15,
  elementSpacing: 5,
  borderLayers: 1, // New parameter for number of border layers
  invertColors: false,
  animate: false,
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

function setup() {
  // Randomize parameters
  randomizeParameters();
  
  // Create canvas with the selected aspect ratio
  updateCanvasDimensions();
  let canvas = createCanvas(canvasWidth, canvasHeight);
  
  // Center the canvas in the window
  let x = (windowWidth - canvasWidth) / 2;
  let y = (windowHeight - canvasHeight) / 2;
  canvas.position(x, y);
  
  // Ensure crisp rendering
  pixelDensity(1);
  noSmooth();
  
  gui = new lil.GUI();
  
  // Aspect ratio controls
  gui.add(params, 'aspectRatio', Object.keys(aspectRatios))
    .name('Aspect Ratio')
    .onChange(() => {
      updateCanvasDimensions();
      resizeCanvas(canvasWidth, canvasHeight);
      repositionCanvas();
      needsRedraw = true;
      redraw();
    });
    
  gui.add(params, 'flipOrientation')
    .name('Flip Orientation')
    .onChange(() => {
      updateCanvasDimensions();
      resizeCanvas(canvasWidth, canvasHeight);
      repositionCanvas();
      needsRedraw = true;
      redraw();
    });
  
  // Border controls
  gui.add(params, 'borderWidth', 5, 100, 1)
    .name('Border Width')
    .onChange(() => {
      needsRedraw = true;
      redraw();
    });
    
  gui.add(params, 'borderStyle', params.borderStyles)
    .name('Border Style')
    .onChange(() => {
      needsRedraw = true;
      redraw();
    });
    
  gui.add(params, 'elementSize', 5, 40, 1)
    .name('Element Size')
    .onChange(() => {
      needsRedraw = true;
      redraw();
    });
    
  gui.add(params, 'elementSpacing', 0, 20, 1)
    .name('Element Spacing')
    .onChange(() => {
      needsRedraw = true;
      redraw();
    });
  
  gui.add(params, 'borderLayers', 1, 5, 1)
    .name('Border Layers')
    .onChange(() => {
      needsRedraw = true;
      redraw();
    });
  
  // Color controls
  gui.addColor(params, 'canvasColor')
    .name('Canvas Color')
    .onChange(() => {
      needsRedraw = true;
      redraw();
    });
    
  gui.addColor(params, 'borderColor')
    .name('Border Color')
    .onChange(() => {
      needsRedraw = true;
      redraw();
    });
    
  gui.add(params, 'invertColors')
    .name('Invert Colors')
    .onChange(() => {
      needsRedraw = true;
      redraw();
    });
    
  gui.add(params, 'animate')
    .name('Animate')
    .onChange(toggleAnimation);
    
  // Add the export button last
  const exportController = gui.add(params, 'export').name('Export as PNG');
  
  // Create and insert spacer before the export button's container
  const spacer = document.createElement('div');
  spacer.style.height = '10px';
  exportController.domElement.parentElement.insertBefore(spacer, exportController.domElement);
  
  // Set to only draw when needed
  noLoop();
  
  currentDistortion = generateDistortion();
  needsRedraw = true;
  
  // Force immediate draw
  redraw();

  applyTheme(getCurrentTheme());
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
    
    // Update scroll offset for scrolling animation
    scrollOffset += 1;
    
    lastDistortionUpdate = timestamp;
    needsRedraw = true;
    redraw();
  }
  
  animationId = requestAnimationFrame(animationLoop);
}

function draw() {
  if (needsRedraw || params.animate) {
    // Get colors based on invert setting
    let bgColor = params.invertColors ? params.borderColor : params.canvasColor;
    let fgColor = params.invertColors ? params.canvasColor : params.borderColor;
    
    // Draw canvas background
    background(bgColor);
    
    // Draw border with foreground color
    fill(fgColor);
    drawBorder();
    
    needsRedraw = false;
  }
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

function drawBorder() {
  // No need to set fill color here as it's set in the draw function
  noStroke();
  
  // Draw multiple border layers if specified
  for (let layer = 0; layer < params.borderLayers; layer++) {
    // Calculate the offset for this layer
    const layerOffset = layer * (params.elementSize + params.elementSpacing);
    const borderPos = params.borderWidth + layerOffset;
    
    // Calculate the perimeter of the canvas
    const perimeter = 2 * (canvasWidth + canvasHeight);
    // Estimate number of elements based on size and spacing
    const totalSpacing = params.elementSize + params.elementSpacing;
    const elementCount = Math.ceil(perimeter / totalSpacing);
    
    let elementIndex = 0;
    
    // Apply scrolling offset if animation is enabled
    let offset = params.animate ? (scrollOffset % totalSpacing) : 0;
    
    // Top edge - scrolling right
    for (let x = borderPos - offset; x <= canvasWidth - borderPos; x += totalSpacing) {
      if (elementIndex >= elementCount) break;
      
      drawBorderElement(Math.floor(x), Math.floor(borderPos), Math.floor(params.elementSize), 'top');
      elementIndex++;
    }
    
    // Right edge - scrolling down
    for (let y = borderPos - offset; y <= canvasHeight - borderPos; y += totalSpacing) {
      if (elementIndex >= elementCount) break;
      
      drawBorderElement(Math.floor(canvasWidth - borderPos), Math.floor(y), Math.floor(params.elementSize), 'right');
      elementIndex++;
    }
    
    // Bottom edge - scrolling left
    for (let x = canvasWidth - borderPos + offset; x >= borderPos; x -= totalSpacing) {
      if (elementIndex >= elementCount) break;
      
      drawBorderElement(Math.floor(x), Math.floor(canvasHeight - borderPos), Math.floor(params.elementSize), 'bottom');
      elementIndex++;
    }
    
    // Left edge - scrolling up
    for (let y = canvasHeight - borderPos + offset; y >= borderPos; y -= totalSpacing) {
      if (elementIndex >= elementCount) break;
      
      drawBorderElement(Math.floor(borderPos), Math.floor(y), Math.floor(params.elementSize), 'left');
      elementIndex++;
    }
  }
}

function drawBorderElement(x, y, size, edge) {
  // Ensure all coordinates are integers for crisp rendering
  x = Math.floor(x);
  y = Math.floor(y);
  size = Math.floor(size);
  
  push();
  translate(x, y);
  
  // Remove the size variation for animation
  if (params.animate) {
    // Just apply a gentle rotation based on time for subtle movement
    let oscillation = sin(animationTime * 0.5) * 0.1;
    rotate(oscillation);
  }
  
  // Rotate based on edge
  if (edge === 'right') {
    rotate(PI/2);
  } else if (edge === 'bottom') {
    rotate(PI);
  } else if (edge === 'left') {
    rotate(3*PI/2);
  }
  
  // Use selected border style
  switch (params.borderStyle) {
    case 'Fleur de Lis':
      drawFleurDeLis(0, 0, size);
      break;
    case 'Circles':
      drawConcentric(0, 0, size);
      break;
    case 'Flowers':
      drawFlower(0, 0, size);
      break;
    case 'Spirals':
      drawSpiral(0, 0, size);
      break;
    case 'Ornate':
      drawOrnate(0, 0, size);
      break;
    case 'Leaves':
      drawLeaf(0, 0, size);
      break;
    case 'Diamonds':
      drawDiamond(0, 0, size);
      break;
    case 'Scrolls':
      drawScroll(0, 0, size);
      break;
  }
  
  pop();
}

function drawFleurDeLis(x, y, size) {
  // Fleur de lis inspired by the catalog
  noStroke();
  
  // Base
  ellipse(x, y + size/3, size/3, size/3);
  
  // Center petal
  beginShape();
  vertex(x, y - size/2);
  bezierVertex(x + size/4, y - size/4, x + size/4, y, x, y + size/4);
  bezierVertex(x - size/4, y, x - size/4, y - size/4, x, y - size/2);
  endShape(CLOSE);
  
  // Side petals
  beginShape();
  vertex(x - size/3, y);
  bezierVertex(x - size/5, y - size/5, x - size/8, y - size/3, x, y - size/6);
  bezierVertex(x + size/8, y - size/3, x + size/5, y - size/5, x + size/3, y);
  bezierVertex(x + size/5, y + size/5, x, y + size/3, x - size/5, y + size/5);
  endShape(CLOSE);
}

function drawConcentric(x, y, size) {
  // Concentric circles inspired by the catalog
  noStroke();
  ellipse(x, y, size, size);
  fill(params.invertColors ? params.canvasColor : params.borderColor);
  ellipse(x, y, size * 0.7, size * 0.7);
  fill(params.invertColors ? params.borderColor : params.canvasColor);
  ellipse(x, y, size * 0.4, size * 0.4);
}

function drawFlower(x, y, size) {
  // Flower pattern inspired by the catalog
  noStroke();
  
  // Petals
  for (let i = 0; i < 5; i++) {
    push();
    translate(x, y);
    rotate(i * TWO_PI / 5);
    ellipse(0, -size/3, size/3, size/2);
    pop();
  }
  
  // Center
  ellipse(x, y, size/3, size/3);
}

function drawSpiral(x, y, size) {
  // Spiral pattern inspired by the catalog
  noStroke();
  
  // Outer circle
  ellipse(x, y, size, size);
  
  // Inner spiral
  fill(params.invertColors ? params.canvasColor : params.borderColor);
  beginShape();
  for (let a = 0; a < TWO_PI * 2; a += 0.1) {
    let r = size/3 * (1 - a/(TWO_PI * 2));
    let sx = x + r * cos(a);
    let sy = y + r * sin(a);
    vertex(sx, sy);
  }
  endShape(CLOSE);
}

function drawOrnate(x, y, size) {
  // Ornate pattern inspired by the catalog
  noStroke();
  
  // Main shape
  ellipse(x, y, size, size);
  
  // Decorative elements
  fill(params.invertColors ? params.canvasColor : params.borderColor);
  for (let i = 0; i < 8; i++) {
    push();
    translate(x, y);
    rotate(i * PI/4);
    ellipse(0, -size/2, size/4, size/4);
    pop();
  }
}

function drawLeaf(x, y, size) {
  // Leaf pattern inspired by the catalog
  noStroke();
  
  // Leaf shape
  beginShape();
  vertex(x, y - size/2);
  bezierVertex(x + size/3, y - size/4, x + size/3, y + size/4, x, y + size/2);
  bezierVertex(x - size/3, y + size/4, x - size/3, y - size/4, x, y - size/2);
  endShape(CLOSE);
  
  // Stem
  rect(x - size/20, y - size/2, size/10, size);
}

function drawDiamond(x, y, size) {
  // Diamond pattern inspired by the catalog
  noStroke();
  
  // Diamond shape
  quad(
    x, y - size/2,
    x + size/2, y,
    x, y + size/2,
    x - size/2, y
  );
  
  // Inner diamond
  fill(params.invertColors ? params.canvasColor : params.borderColor);
  quad(
    x, y - size/4,
    x + size/4, y,
    x, y + size/4,
    x - size/4, y
  );
}

function drawScroll(x, y, size) {
  // Scroll pattern inspired by the catalog
  noStroke();
  
  // Main scroll
  beginShape();
  vertex(x - size/2, y);
  bezierVertex(x - size/4, y - size/3, x + size/4, y - size/3, x + size/2, y);
  bezierVertex(x + size/4, y + size/3, x - size/4, y + size/3, x - size/2, y);
  endShape(CLOSE);
  
  // Inner detail
  fill(params.invertColors ? params.canvasColor : params.borderColor);
  beginShape();
  vertex(x - size/4, y);
  bezierVertex(x - size/8, y - size/6, x + size/8, y - size/6, x + size/4, y);
  bezierVertex(x + size/8, y + size/6, x - size/8, y + size/6, x - size/4, y);
  endShape(CLOSE);
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