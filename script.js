document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const aspectRatioSelect = document.getElementById('aspect-ratio');
    const customRatioDiv = document.getElementById('custom-ratio');
    const widthRatio = document.getElementById('width-ratio');
    const heightRatio = document.getElementById('height-ratio');
    const borderWidthSlider = document.getElementById('border-width');
    const borderWidthValue = document.getElementById('border-width-value');
    const gridSizeSlider = document.getElementById('grid-size');
    const gridSizeValue = document.getElementById('grid-size-value');
    const gridCanvas = document.getElementById('grid-canvas');
    const borderPreview = document.getElementById('border-preview');
    const borderColorPicker = document.getElementById('border-color');
    
    // Tool buttons
    const penTool = document.getElementById('pen-tool');
    const eraserTool = document.getElementById('eraser-tool');
    const fillTool = document.getElementById('fill-tool');
    const clearTool = document.getElementById('clear-tool');
    
    // Symmetry checkboxes
    const horizontalSymmetry = document.getElementById('horizontal-symmetry');
    const verticalSymmetry = document.getElementById('vertical-symmetry');
    const diagonalSymmetry = document.getElementById('diagonal-symmetry');
    
    // Export buttons
    const exportPNG = document.getElementById('export-png');
    const exportSVG = document.getElementById('export-svg');
    const saveDesign = document.getElementById('save-design');
    
    // State variables
    let currentTool = 'pen';
    let gridSize = 10;
    let borderWidth = 30;
    let borderColor = '#000000';
    let gridState = [];
    
    // Initialize grid state
    function initializeGridState() {
        gridState = Array(gridSize).fill().map(() => Array(gridSize).fill(false));
    }
    
    // Create grid cells
    function createGridCells() {
        gridCanvas.innerHTML = '';
        gridCanvas.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
        gridCanvas.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;
        
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                const cell = document.createElement('div');
                cell.classList.add('grid-cell');
                cell.dataset.x = x;
                cell.dataset.y = y;
                cell.style.border = '1px solid #ddd';
                cell.style.backgroundColor = gridState[y][x] ? borderColor : 'transparent';
                
                // Add event listeners for drawing
                cell.addEventListener('mousedown', handleCellClick);
                cell.addEventListener('mouseover', handleCellHover);
                
                gridCanvas.appendChild(cell);
            }
        }
    }
    
    // Handle cell click
    function handleCellClick(e) {
        const x = parseInt(e.target.dataset.x);
        const y = parseInt(e.target.dataset.y);
        
        if (currentTool === 'pen') {
            setCell(x, y, true);
        } else if (currentTool === 'eraser') {
            setCell(x, y, false);
        } else if (currentTool === 'fill') {
            // Implement fill tool
            fillGrid(x, y, !gridState[y][x]);
        }
        
        updatePreview();
    }
    
    // Handle cell hover (for drawing)
    function handleCellHover(e) {
        if (e.buttons !== 1) return; // Only respond to left mouse button
        
        const x = parseInt(e.target.dataset.x);
        const y = parseInt(e.target.dataset.y);
        
        if (currentTool === 'pen') {
            setCell(x, y, true);
        } else if (currentTool === 'eraser') {
            setCell(x, y, false);
        }
        
        updatePreview();
    }
    
    // Set cell state with symmetry
    function setCell(x, y, state) {
        gridState[y][x] = state;
        updateCellDisplay(x, y);
        
        // Apply symmetry if enabled
        if (horizontalSymmetry.checked) {
            const mirrorY = gridSize - 1 - y;
            gridState[mirrorY][x] = state;
            updateCellDisplay(x, mirrorY);
        }
        
        if (verticalSymmetry.checked) {
            const mirrorX = gridSize - 1 - x;
            gridState[y][mirrorX] = state;
            updateCellDisplay(mirrorX, y);
        }
        
        if (diagonalSymmetry.checked) {
            const mirrorX = gridSize - 1 - x;
            const mirrorY = gridSize - 1 - y;
            gridState[mirrorY][mirrorX] = state;
            updateCellDisplay(mirrorX, mirrorY);
        }
        
        // Handle combinations of symmetries
        if (horizontalSymmetry.checked && verticalSymmetry.checked) {
            const mirrorX = gridSize - 1 - x;
            const mirrorY = gridSize - 1 - y;
            gridState[mirrorY][x] = state;
            gridState[y][mirrorX] = state;
            updateCellDisplay(x, mirrorY);
            updateCellDisplay(mirrorX, y);
        }
    }
    
    // Update cell display
    function updateCellDisplay(x, y) {
        const cell = gridCanvas.querySelector(`[data-x="${x}"][data-y="${y}"]`);
        if (cell) {
            cell.style.backgroundColor = gridState[y][x] ? borderColor : 'transparent';
        }
    }
    
    // Fill connected cells of the same state
    function fillGrid(x, y, newState) {
        const currentState = gridState[y][x];
        if (currentState === newState) return;
        
        function fill(x, y) {
            if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) return;
            if (gridState[y][x] !== currentState) return;
            
            gridState[y][x] = newState;
            updateCellDisplay(x, y);
            
            fill(x+1, y);
            fill(x-1, y);
            fill(x, y+1);
            fill(x, y-1);
        }
        
        fill(x, y);
    }
    
    // Update preview with current border design
    function updatePreview() {
        // This would be a more complex function to generate the border
        // around the content based on the grid pattern
        // For now, we'll just change the border color
        borderPreview.style.border = `${borderWidth}px solid ${borderColor}`;
    }
    
    // Event listeners for controls
    aspectRatioSelect.addEventListener('change', function() {
        if (this.value === 'custom') {
            customRatioDiv.classList.remove('hidden');
        } else {
            customRatioDiv.classList.add('hidden');
            const [width, height] = this.value.split(':').map(Number);
            updatePreviewAspectRatio(width, height);
        }
    });
    
    widthRatio.addEventListener('change', function() {
        updatePreviewAspectRatio(this.value, heightRatio.value);
    });
    
    heightRatio.addEventListener('change', function() {
        updatePreviewAspectRatio(widthRatio.value, this.value);
    });
    
    borderWidthSlider.addEventListener('input', function() {
        borderWidth = this.value;
        borderWidthValue.textContent = `${borderWidth}px`;
        updatePreview();
    });
    
    gridSizeSlider.addEventListener('input', function() {
        gridSize = parseInt(this.value);
        gridSizeValue.textContent = `${gridSize}×${gridSize}`;
        initializeGridState();
        createGridCells();
    });
    
    borderColorPicker.addEventListener('input', function() {
        borderColor = this.value;
        updateGridCellColors();
        updatePreview();
    });
    
    // Tool selection
    penTool.addEventListener('click', function() {
        setActiveTool('pen');
    });
    
    eraserTool.addEventListener('click', function() {
        setActiveTool('eraser');
    });
    
    fillTool.addEventListener('click', function() {
        setActiveTool('fill');
    });
    
    clearTool.addEventListener('click', function() {
        initializeGridState();
        updateGridCellColors();
        updatePreview();
    });
    
    function setActiveTool(tool) {
        currentTool = tool;
        
        // Update UI to show active tool
        [penTool, eraserTool, fillTool].forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.getElementById(`${tool}-tool`).classList.add('active');
    }
    
    function updateGridCellColors() {
        const cells = gridCanvas.querySelectorAll('.grid-cell');
        cells.forEach(cell => {
            const x = parseInt(cell.dataset.x);
            const y = parseInt(cell.dataset.y);
            cell.style.backgroundColor = gridState[y][x] ? borderColor : 'transparent';
        });
    }
    
    function updatePreviewAspectRatio(width, height) {
        const ratio = width / height;
        const previewWidth = borderPreview.offsetWidth;
        const previewHeight = previewWidth / ratio;
        
        borderPreview.style.height = `${previewHeight}px`;
    }
    
    // Export functions
    exportPNG.addEventListener('click', function() {
        alert('Export as PNG functionality would go here');
        // Would use canvas or html2canvas to create PNG
    });
    
    exportSVG.addEventListener('click', function() {
        alert('Export as SVG functionality would go here');
        // Would generate SVG from grid pattern
    });
    
    saveDesign.addEventListener('click', function() {
        alert('Save design functionality would go here');
        // Would save current state to localStorage or server
    });
    
    // Initialize the application
    initializeGridState();
    createGridCells();
    updatePreview();
}); 