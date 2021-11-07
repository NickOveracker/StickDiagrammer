let layeredGrid;
let canvas;
let ctx;
let darkMode;
let cellHeight;
let cellWidth;
let gridsize;
let layers;
let saveState = 0;
let maxSaveState = 0;
let dragging = false;
let startX;
let startY;
let gridCanvas;
let currentX;
let currentY;

// Cycle through the following cursor colors by pressing space: PDIFF, NDIFF, POLY, METAL1, CONTACT
let PDIFF = 0;
let NDIFF = 1;
let POLY = 2;
let METAL1 = 3;
let CONTACT = 4;
let cursorColors = ['#9400D3', '#32CD32', '#ff0000', '#00FFFF', '#cccccc'];
let cursorNames = ['pdiff', 'ndiff', 'poly', 'metal', 'contact'];
let cursorColor = cursorColors[PDIFF];
let cursorColorIndex = PDIFF;

// Objects to represent the coordinates of the four inputs (A, B, C, D)
// and the output (Y).
let A = {x: 2, y: 8};
let B = {x: 2, y: 12};
let C = {x: 2, y: 16};
let D = {x: 2, y: 20};
let Y = {x: 26, y: 14};

// Netlist is a list of nets.
// Each net is a Set of cells.
let netlist = [];

// VDD and GND are the two terminals of the grid.
// The terminals are always at the top and bottom of the grid.
let VDD_y = 1;
let GND_y = gridsize - 2;

// Grid color
let darkModeGridColor = '#cccccc';
let lightModeGridColor = '#999999';

// Draw the outer border of the canvas.
function drawBorder() {
    ctx.strokeStyle = cursorColor;
    ctx.lineWidth = cellWidth;
    ctx.strokeRect(cellWidth/2, cellWidth/2, canvas.width - cellWidth, canvas.height - cellWidth);

    // Draw a thick border on the edge of the border drawn above.
    ctx.lineWidth = cellWidth/4;
    ctx.strokeStyle = darkMode ? "#ffffff" : "#000000";
    ctx.strokeRect(1 + cellWidth   - ctx.lineWidth/2,
                   1 + cellHeight  - ctx.lineWidth/2,
                   canvas.width  - 2*cellWidth  + ctx.lineWidth/2,
                   canvas.height - 2*cellHeight + ctx.lineWidth/2
    );

    // For the middle 11 cells of the upper border, fill with the grid color.
    ctx.fillStyle = darkMode ? "#ffffff" : "#000000";
    let startCell = Math.floor(gridsize/2) - 4;
    ctx.fillRect(startCell*cellWidth, 0, cellWidth*11, cellHeight);

    // Write the cursor color name in the middle of the upper border of the canvas.
    ctx.fillStyle = darkMode ? '#000000' : '#ffffff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(cursorNames[cursorColorIndex], canvas.width / 2, cellHeight * 3 / 4);
}

// Define a function to change the cursor color.
function changeCursorColor() {
    cursorColorIndex = (cursorColorIndex + 1) % cursorColors.length;
    cursorColor = cursorColors[cursorColorIndex];

    // set the outer border of the canvas to the new cursor color
    drawBorder();
}

function makeLayeredGrid(width, height, layers) {
    // Each cell has several layers with set to true or false.
    // Initialize every element to false.
    let grid = new Array(width);
    for (let i = 0; i < width; i++) {
        grid[i] = new Array(height);
        for (let j = 0; j < height; j++) {
            grid[i][j] = new Array(layers);
            for (let k = 0; k < layers; k++) {
                grid[i][j][k] = false;
            }
        }
    }
    return grid;
}

// Resize the canvas to the largest square that fits in the window.
function resizeCanvas() {
    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;
    let windowSize = Math.min(windowWidth, windowHeight);
    canvas.width = windowSize;
    canvas.height = windowSize;
}

// Draw a faint grid on the canvas.
// Add an extra 2 units to the width and height for a border.
function drawGrid(size) {
    // Check if gridCanvas is defined.
    if (gridCanvas == undefined) {
        gridCanvas = document.createElement('canvas');
        document.body.appendChild(gridCanvas);
    }

    // Place gridCanvas behind the canvas.
    // Same size as the canvas.
    gridCanvas.width = canvas.width - 1;
    gridCanvas.height = canvas.height - 1;
    gridCanvas.style.position = 'absolute';
    gridCanvas.style.left = canvas.offsetLeft + 'px';
    gridCanvas.style.top = canvas.offsetTop + 'px';
    gridCanvas.style.zIndex = -1;

    // Set the gridCanvas context.
    let gridCtx = gridCanvas.getContext('2d');
    cellWidth = canvas.width / (size + 2);
    cellHeight = canvas.height / (size + 2);
    
    // Clear the grid canvas.
    gridCanvas.getContext('2d').clearRect(0, 0, gridCanvas.width, gridCanvas.height);

    // Set stroke color depending on whether the dark mode is on or off.
    // Should be faintly visible in both modes.
    if (darkMode) {
        gridCtx.strokeStyle = darkModeGridColor;
    } else {
        gridCtx.strokeStyle = lightModeGridColor;
    }

    for (let i = 0; i < size + 2; i++) {
        gridCtx.beginPath();
        gridCtx.moveTo(i * cellWidth, 0);
        gridCtx.lineTo(i * cellWidth, gridCanvas.height);
        gridCtx.stroke();
        gridCtx.beginPath();
        gridCtx.moveTo(0, i * cellHeight);
        gridCtx.lineTo(gridCanvas.width, i * cellHeight);
        gridCtx.stroke();
    }
}

/*
// Set the nets.
function setNetsFrom(cell) {
    function recurseBack(cell) {
        // Set nets for current cell.
        // If there is a CONTACT, merge the nets of all non-empty layers without duplicates.
        net = new Set();
        if(layeredGrid[cell.x][cell.y][CONTACT]) {
            for (let ii = 0; ii < layers; ii++) {
                if (layeredGrid[cell.x][cell.y][ii]) {
                    // Add the nets of the non-null layers to the set.
                    layeredGrid[cell.x][cell.y][ii];
                }
            }
        }

        // Recursive function to set nets in adjacent cells
        for(let ii = 0; ii < layers; ii++) {
            // Recurse left
            if(_cell.x > 0
                && layeredGrid[_cell.x][_cell.y][ii]
                && layeredGrid[_cell.x-1][_cell.y][ii]) {
                // Merge the sets of the two cells.
                net = new Set([...net, ...layeredGrid[_cell.x][_cell.y][ii], ...layeredGrid[_cell.x-1][_cell.y][ii]]);
                layeredGrid[_cell.x-1][_cell.y][ii] = layeredGrid[_cell.x][_cell.y][ii];
                recurseBack({x: _cell.x-1, y: _cell.y});
            }
            // Recurse up
            if(_cell.y > 0
                && layeredGrid[_cell.x][_cell.y][ii]
                && layeredGrid[_cell.x][_cell.y-1][ii]) {
                // Set the nets in the cell above to match the nets in the current cell.
                layeredGrid[_cell.x][_cell.y-1][ii] = layeredGrid[_cell.x][_cell.y][ii];
                recurseBack({x: _cell.x, y: _cell.y-1});
            }
        }

        function recurseForward(cell) {
            // Recurse right
            if(_cell.x < gridsize - 1
                && layeredGrid[_cell.x][_cell.y][ii]
                && layeredGrid[_cell.x+1][_cell.y][ii]) {
                // Set the nets in the cell to the right to match the nets in the current cell.
                layeredGrid[_cell.x+1][_cell.y][ii] = layeredGrid[_cell.x][_cell.y][ii];
                recurseForward({x: _cell.x+1, y: _cell.y});
            }
            // Recurse down
            if(_cell.y < gridsize - 1
                && layeredGrid[_cell.x][_cell.y][ii]
                && layeredGrid[_cell.x][_cell.y+1][ii]) {
                // Set the nets in the cell below to match the nets in the current cell.
                layeredGrid[_cell.x][_cell.y+1][ii] = layeredGrid[_cell.x][_cell.y][ii];
                recurseForward({x: _cell.x, y: _cell.y+1});
            }
        }
    }
    // Start with input A and move out from there.
    // Set the netlist of all non-null layers at A's coordinates to "A".
    for (let ii = 0; ii < grid.length; ii++) {
        for (let j = 0; j < grid[ii].length; j++) {
            for (let k = 0; k < grid[ii][j].length; k++) {
                if (grid[ii][j][k]) {
                    grid[ii][j][k] = 'A';
                }
            }
        }
    }
}*/

// Initialize everything
function refreshCanvas() {
    resizeCanvas();

    // Draw the grid.
    // Run once at the beginning just to define some stuff.
    if(cellWidth === undefined) {
        drawGrid(gridsize);
    }
    // Check the layers of the grid, and draw cells as needed.
    function drawCell(i, j, layer, isBorder) {
        if (isBorder || layeredGrid[i-1][j-1][layer]) {
            ctx.fillStyle = cursorColors[layer];
            ctx.fillRect(i * cellWidth, j * cellHeight-1, cellWidth + 2, cellHeight + 2);
        }
    }

    // Draw CONTACT at the coordinates of the four inputs
    // and at the output.
    layeredGrid[A.x][A.y][CONTACT] = true;
    layeredGrid[B.x][B.y][CONTACT] = true;
    layeredGrid[C.x][C.y][CONTACT] = true;
    layeredGrid[D.x][D.y][CONTACT] = true;
    layeredGrid[Y.x][Y.y][CONTACT] = true;

    // Draw METAL1 across the grid at VDD_y and GND_y.
    for (let i = 0; i < gridsize; i++) {
        layeredGrid[i][VDD_y][METAL1] = true;
        layeredGrid[i][GND_y][METAL1] = true;
    }

    // Draw each layer in order.
    for(let layer = 0; layer < layers; layer++) {
        for (let i = 1; i <= gridsize; i++) {
            for (let j = 1; j <= gridsize; j++) {
                drawCell(i, j, layer, false);

                // For the last layer, fill each filled cell with a cross.
                if (layer == layers - 1) {
                    if (layeredGrid[i-1][j-1][layer]) {
                        ctx.fillStyle = "#000000";
                        ctx.beginPath();
                        ctx.moveTo(i * cellWidth + cellWidth + 2, j * cellHeight - 1);
                        ctx.lineTo(i * cellWidth, j * cellHeight + cellHeight + 1);
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.moveTo(i * cellWidth + cellWidth + 2, j * cellHeight + cellHeight + 1);
                        ctx.lineTo(i * cellWidth, j * cellHeight - 2);
                        ctx.stroke();
                    }
                }
            }
        }
    }
    
    // Set dark mode as needed.
    if (darkMode) {
        document.body.style.backgroundColor = 'black';
    } else {
        document.body.style.backgroundColor = 'white';
    }

    // set the outer border of the canvas to the cursor color
    drawBorder();

    // Draw labels on the canvas above the four inputs
    ctx.font = "bold 18px Arial";
    ctx.fillStyle = darkMode ? "#ffffff" : "#000000";
    // Draw white backgrounds behind the labels below
    ctx.fillText("A", cellWidth * (A.x + 1.5), cellHeight * (A.y + 0.75));
    ctx.fillText("B", cellWidth * (B.x + 1.5), cellHeight * (B.y + 0.75));
    ctx.fillText("C", cellWidth * (C.x + 1.5), cellHeight * (C.y + 0.75));
    ctx.fillText("D", cellWidth * (D.x + 1.5), cellHeight * (D.y + 0.75));
    ctx.fillText("Y", cellWidth * (Y.x + 1.5), cellHeight * (Y.y + 0.75));

    drawGrid(gridsize); // Not sure why but gotta draw this twice.
}

// Save function to save the current state of the grid and the canvas.
// Increment save state so we can maintain an undo buffer.
function saveCurrentState() {    
    // Save both the grid and the drawing.
    localStorage.setItem('layeredGrid' + saveState, JSON.stringify(layeredGrid));
    localStorage.setItem('canvas' + saveState, canvas.toDataURL());

    // Increment the save state.
    saveState++;

    // Delete all save states after the current one.
    for (let i = saveState; i < maxSaveState; i++) {
        localStorage.removeItem('layeredGrid' + i);
        localStorage.removeItem('canvas' + i);
    }

    // Update the max save state.
    maxSaveState = saveState;
}

// Undo by going back to the previous save state (if there is one) and redrawing the canvas.
function undo() {
    if (saveState > 0) {
        saveState--;
        layeredGrid = JSON.parse(localStorage.getItem('layeredGrid' + saveState));
        let img = new Image();
        img.src = localStorage.getItem('canvas' + saveState);
        img.onload = function() {
            ctx.drawImage(img, 0, 0);
        }

        refreshCanvas();
    }
}

// Redo by going forward to the next save state (if there is one) and redrawing the canvas.
function redo() {
    if (saveState < maxSaveState) {
        saveState++;
        layeredGrid = JSON.parse(localStorage.getItem('layeredGrid' + saveState));
        let img = new Image();
        img.src = localStorage.getItem('canvas' + saveState);
        img.onload = function() {
            ctx.drawImage(img, 0, 0);
        }

        refreshCanvas();
    }
}

function colorCell(clientX, clientY, noDelete, noAdd) {
    // Ignore if not inside the canvas
    if (clientX > canvas.offsetLeft + cellWidth &&
        clientX < canvas.offsetLeft + canvas.width - cellWidth &&
        clientY > canvas.offsetTop + cellHeight &&
        clientY < canvas.offsetTop + canvas.height - cellHeight)
    {
        let x = Math.floor((clientX - canvas.offsetLeft - cellWidth) / cellWidth);
        let y = Math.floor((clientY - canvas.offsetTop - cellHeight) / cellHeight);

        // Set a variable to true if any of the layers are set.
        let anyLayerSet = false;
        for (let i = 0; i < layers; i++) {
            if (layeredGrid[x][y][i]) {
                anyLayerSet = true;
            }
        }

        if(noDelete || anyLayerSet) {
            let isSet = layeredGrid[x][y][cursorColorIndex];
            let toDelete = !noDelete && isSet || noAdd && anyLayerSet;

            if(toDelete || !noAdd) {
                saveCurrentState();

                if (toDelete) {
                    // Erase all layers of the cell.
                    for (let i = 0; i < layers; i++) {
                        layeredGrid[x][y][i] = false;
                    }
                } else {
                    layeredGrid[x][y][cursorColorIndex] = true;
                }

                refreshCanvas();
            }
            return true;
        }
    }
    return false;
}

function getCell(clientX, clientY) {
    // Ignore if not inside the canvas
    if (clientX > canvas.offsetLeft + cellWidth &&
        clientX < canvas.offsetLeft + canvas.width - cellWidth &&
        clientY > canvas.offsetTop + cellHeight &&
        clientY < canvas.offsetTop + canvas.height - cellHeight)
    {
        let x = Math.floor((clientX - canvas.offsetLeft - cellWidth) / cellWidth);
        let y = Math.floor((clientY - canvas.offsetTop - cellHeight) / cellHeight);
        console.log(x, y);
        return {x: x, y: y};
    }
    console.log("Out of bounds");
    return null;
}

window.onload = function() {
    // Clear local storage
    localStorage.clear();

    gridsize = 29;
    layers = 5;

    // Set to dark mode if it is night time
    if (new Date().getHours() > 19 || new Date().getHours() < 7) {
        darkMode = true;
    }
    else {
        darkMode = false;
    }

    // Initialize with a gridsize of 29 and 5 layers
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");
    layeredGrid = makeLayeredGrid(gridsize, gridsize, layers);

    refreshCanvas();

    // Note the grid coordinates when the left mouse button is pressed.
    // Store the m in startX and startY.
    window.addEventListener("mousedown", function(event) {
        if (event.button == 0) {

            // Return if not between cells 1 and gridsize - 1
            if (event.clientX > canvas.offsetLeft + cellWidth &&
                event.clientX < canvas.offsetLeft + canvas.width - cellWidth &&
                event.clientY > canvas.offsetTop + cellHeight &&
                event.clientY < canvas.offsetTop + canvas.height - cellHeight)
            {
                //saveCurrentState();
                startX = Math.floor((event.clientX - canvas.offsetLeft - cellWidth) / cellWidth);
                startY = Math.floor((event.clientY - canvas.offsetTop - cellHeight) / cellHeight);
            }
        }
    });

    // Note the grid coordinates when the left mouse button is released.
    // Use the start and end coordinates to make either a horizontal or vertical line.
    window.addEventListener("mouseup", function(event) {
        if (event.button == 0) {
            // If not between cells 1 and gridsize - 1, undo and return.
            if (event.clientX > canvas.offsetLeft + cellWidth &&
                event.clientX < canvas.offsetLeft + canvas.width - cellWidth &&
                event.clientY > canvas.offsetTop + cellHeight &&
                event.clientY < canvas.offsetTop + canvas.height - cellHeight)
            {
                if(dragging) {
                    let endX = Math.floor((event.clientX - canvas.offsetLeft - cellWidth) / cellWidth);
                    let endY = Math.floor((event.clientY - canvas.offsetTop - cellHeight) / cellHeight);

                    // If the mouse moved more horizontally than vertically,
                    // draw a horizontal line.
                    if (Math.abs(endX - startX) > Math.abs(endY - startY)) {
                        for (let i = Math.min(startX, endX); i <= Math.max(startX, endX); i++) {
                            layeredGrid[i][startY][cursorColorIndex] = true;
                        }
                    }
                    // If the mouse moved more vertically than horizontally,
                    // draw a vertical line.
                    else {
                        for (let i = Math.min(startY, endY); i <= Math.max(startY, endY); i++) {
                            layeredGrid[startX][i][cursorColorIndex] = true;
                        }
                    }
                }
                // Just fill in the cell at the start coordinates.
                else {
                    saveCurrentState();
                    layeredGrid[startX][startY][cursorColorIndex] = true;
                }
            }
            // If the mouse was released outside the canvas, undo and return.
            else if(dragging){
                undo();
            }
        }

        refreshCanvas();
        dragging = false;
    });

    // Show a preview line when the user is dragging the mouse.
    window.addEventListener("mousemove", function(event) {
        // Save the current X and Y coordinates.
        currentX = event.clientX;
        currentY = event.clientY;
        
        // If the mouse is pressed and the mouse is between cells 1 and gridsize - 1,
        if (event.buttons == 1) {
            // Ignore if not inside the canvas
            if (event.clientX > canvas.offsetLeft + cellWidth &&
                event.clientX < canvas.offsetLeft + canvas.width - cellWidth &&
                event.clientY > canvas.offsetTop + cellHeight &&
                event.clientY < canvas.offsetTop + canvas.height - cellHeight)
            {
                if(!dragging) {
                    dragging = true;
                    saveCurrentState();
                } else {
                    // Continuously refresh to update the preview line.
                    undo();
                    saveCurrentState();
                }

                let endX = Math.floor((event.clientX - canvas.offsetLeft - cellWidth) / cellWidth);
                let endY = Math.floor((event.clientY - canvas.offsetTop - cellHeight) / cellHeight);
                
                leftX = Math.min(startX, endX);
                rightX = Math.max(startX, endX);
                topY = Math.min(startY, endY);
                bottomY = Math.max(startY, endY);

                // If the mouse moved more horizontally than vertically,
                // draw a horizontal line.
                if (rightX - leftX > bottomY - topY) {
                    for (let i = leftX; i <= rightX; i++) {
                        layeredGrid[i][startY][cursorColorIndex] = true;
                    }
                }
                // If the mouse moved more vertically than horizontally,
                // draw a vertical line.
                else {
                    for (let j = topY; j <= bottomY; j++) {
                        layeredGrid[startX][j][cursorColorIndex] = true;
                    }
                }

                refreshCanvas();
            }
        }
    });

    // When the user right-clicks on a cell in the canvas, erase it.
    // When clicking anywhere else, cycle through cursor colors.
    window.addEventListener("contextmenu", function(event) {
        if (event.button == 2) {
            // Don't show a context menu.
            event.preventDefault();

            // If in the canvas and over a colored cell, erase it.
            if(colorCell(event.clientX, event.clientY, false, true)) {
                return;
            }

            // Cycle through the cursor colors by right clicking anywhere else.
            changeCursorColor();
            refreshCanvas();
        }
    });

    // Keypress listeners
    window.addEventListener("keydown", function(event) {
        // Undo by pressing CTRL + Z
        if (event.ctrlKey && event.keyCode == 90) {
            undo();
        }

        // Redo by pressing CTRL + Y
        if (event.ctrlKey && event.keyCode == 89) {
            redo();
        }

        // Toggle dark mode by pressing space
        if (event.keyCode == 32) {
            darkMode = !darkMode;
            refreshCanvas();
        }

        // If the user presses the "A" key,
        // move the coordinates for A to the cell under the cursor.
        if (event.keyCode == 65) {
            let cell = getCell(currentX, currentY);
            if (cell != null) {
                // First, unset the CONTACT layer at the old coordinates.
                layeredGrid[A.x][A.y][CONTACT] = false;
                // Then, set the new coordinates.
                A.x = cell.x;
                A.y = cell.y;
                refreshCanvas();
            }
        }

        // If the user presses the "B" key,
        // move the coordinates for B to the cell under the cursor.
        if (event.keyCode == 66) {
            let cell = getCell(currentX, currentY);
            if (cell != null) {
                // First, unset the CONTACT layer at the old coordinates.
                layeredGrid[B.x][B.y][CONTACT] = false;
                // Then, set the new coordinates.
                B.x = cell.x;
                B.y = cell.y;
                refreshCanvas();
            }
        }

        // If the user presses the "C" key,
        // move the coordinates for C to the cell under the cursor.
        if (event.keyCode == 67) {
            let cell = getCell(currentX, currentY);
            if (cell != null) {
                // First, unset the CONTACT layer at the old coordinates.
                layeredGrid[C.x][C.y][CONTACT] = false;
                // Then, set the new coordinates.
                C.x = cell.x;
                C.y = cell.y;
                refreshCanvas();
            }
        }

        // If the user presses the "D" key,
        // move the coordinates for D to the cell under the cursor.
        if (event.keyCode == 68) {
            let cell = getCell(currentX, currentY);
            if (cell != null) {
                // First, unset the CONTACT layer at the old coordinates.
                layeredGrid[D.x][D.y][CONTACT] = false;
                // Then, set the new coordinates.
                D.x = cell.x;
                D.y = cell.y;
                refreshCanvas();
            }
        }

        // If the user presses the "Y" key,
        // move the coordinates for Y to the cell under the cursor.
        if (event.keyCode == 89) {
            let cell = getCell(currentX, currentY);
            if (cell != null) {
                // First, unset the CONTACT layer at the old coordinates.
                layeredGrid[Y.x][Y.y][CONTACT] = false;
                // Then, set the new coordinates.
                Y.x = cell.x;
                Y.y = cell.y;
                refreshCanvas();
            }
        }
    });
}
