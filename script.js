let layeredGrid;
let canvas;
let ctx;
let darkMode;
let cellHeight;
let cellWidth;
let gridsize = 29;
let layers = 5;
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
let railStartX = 1;
let railEndX = gridsize - 1;

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
    // Each cell has several layers with parameter isSet.
    // Initialize every element to false.
    let grid = new Array(width);
    for (let ii = 0; ii < width; ii++) {
        grid[ii] = new Array(height);
        for (let jj = 0; jj < height; jj++) {
            grid[ii][jj] = new Array(layers);
            for (let kk = 0; kk < layers; kk++) {
                grid[ii][jj][kk] = {isSet: false, x: ii, y: jj, layer: kk};
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

// Set the nets.
function setNets() {
    // CLear the netlist.
    netlist = [];

    function setRecursively(cell, net) {
        // Stop here if the layer is NDIFF or PDIFF and there is also a POLY at the same location.
        if (cell.layer === NDIFF || cell.layer === PDIFF) {
            if (layeredGrid[cell.x][cell.y][POLY].isSet) {
                return;
            }
        }
        // Add the cell to the net.
        net.add(cell);

        // If CONTACT is set, add add all layers to the net.
        if(layeredGrid[cell.x][cell.y][CONTACT].isSet) {
            for (let ii = 0; ii < layers; ii++) {
                net.add(layeredGrid[cell.x][cell.y][ii]);
            }
        }

        // For each layer of the cell in the net, recurse with all adjacent cells in the layer.
        for (let ii = 0; ii < layers; ii++) {
            if(net.has(layeredGrid[cell.x][cell.y][ii])) {
                if(cell.x > 0
                    && layeredGrid[cell.x - 1][cell.y][ii].isSet
                    && net.has(layeredGrid[cell.x - 1][cell.y][ii]) === false) {
                    setRecursively(layeredGrid[cell.x - 1][cell.y][ii], net);
                }
                if(cell.x < gridsize - 1
                    && layeredGrid[cell.x + 1][cell.y][ii].isSet
                    && net.has(layeredGrid[cell.x + 1][cell.y][ii]) === false) {
                    setRecursively(layeredGrid[cell.x + 1][cell.y][ii], net);
                }
                if(cell.y > 0
                    && layeredGrid[cell.x][cell.y - 1][ii].isSet
                    && net.has(layeredGrid[cell.x][cell.y - 1][ii]) === false) {
                    setRecursively(layeredGrid[cell.x][cell.y - 1][ii], net);
                }
                if(cell.y < gridsize - 1
                    && layeredGrid[cell.x][cell.y + 1][ii].isSet
                    && net.has(layeredGrid[cell.x][cell.y + 1][ii]) === false) {
                    setRecursively(layeredGrid[cell.x][cell.y + 1][ii], net);
                }
            }
        }
    }

    // Add the VDD and GND nets.
    // Loop through every VDD cell and add to the VDD net.
    let netVDD = new Set();
    setRecursively(layeredGrid[railStartX][VDD_y][METAL1], netVDD);
    netlist.push(netVDD);

    // Loop through every GND cell and add to the GND net.
    let netGND = new Set();
    setRecursively(layeredGrid[railStartX][GND_y][METAL1], netGND);
    netlist.push(netGND);

    // Create a netlist for A, B, C, D, and Y.
    // Add every layer of each of these to their respective net.
    let netA = new Set();
    let netB = new Set();
    let netC = new Set();
    let netD = new Set();
    let netY = new Set();
    
    for(let ii = 0; ii < layers; ii++) {
        if(layer[A.x][A.y][ii].isSet) {
            setRecursively(layer[A.x][A.y][ii], netA);
        }
        if(layer[B.x][B.y][ii].isSet) {
            setRecursively(layer[B.x][B.y][ii], netB);
        }
        if(layer[C.x][C.y][ii].isSet) {
            setRecursively(layer[C.x][C.y][ii], netC);
        }
        if(layer[D.x][D.y][ii].isSet) {
            setRecursively(layer[D.x][D.y][ii], netD);
        }
        if(layer[Y.x][Y.y][ii].isSet) {
            setRecursively(layer[Y.x][Y.y][ii], netY);
        }
    }

    netlist.push(netA);
    netlist.push(netB);
    netlist.push(netC);
    netlist.push(netD);
    netlist.push(netY);

    // Loop through each cell in each net.
    // If adjacent cells in the same layer are not already in the net, add them.
    for (let ii = 0; ii < netlist.length; ii++) {
        let net = netlist[ii];
        for (let cell of net) {
            // Don't do this for the top layer (contact)
            for (let jj = 0; jj < layers - 1; jj++) {
                if (jj != cell.layer) {
                    let cellAbove = layeredGrid[cell.x][cell.y][jj];
                    if (cellAbove.isSet && !net.has(cellAbove)) {
                        net.add(cellAbove);
                    }
                }
            }
        }
    }

    // Print a grid with in all cells that are in a given net.
    function printGrid(net, name) {
        let grid = [];
        for(let ii = 1; ii < gridsize - 1; ii++) {
            grid[ii - 1] = [];
            for(let jj = 1; jj < gridsize - 1; jj++) {
                grid[ii - 1][jj - 1] = " ";
                // If any of the layers are in netA, set the cell to "A".
                for(let kk = 0; kk < layers; kk++) {
                    if(layeredGrid[ii][jj][kk].isSet && net.has(layeredGrid[ii][jj][kk])) {
                        grid[ii - 1][jj - 1] = name;
                    }
                }
            }
        }

        // Print to the console.
        for(let ii = 0; ii < gridsize - 2; ii++) {
            let line = "";
            for(let jj = 0; jj < gridsize - 2; jj++) {
                line += grid[ii][jj];
            }
            console.log(line);
        }
    }

    // Print the grid for netA.
    printGrid(netA, "A");
    // Print the grid for netB.
    printGrid(netB, "B");
    // Print the grid for netC.
    printGrid(netC, "C");
    // Print the grid for netD.
    printGrid(netD, "D");
    // Print the grid for netY.
    printGrid(netY, "Y");
    // Print the grid for netVDD.
    printGrid(netVDD, "+");
    // Print the grid for netGND.
    printGrid(netGND, "-");
}

// Initialize everything
function refreshCanvas() {
    resizeCanvas();

    // Draw the grid.
    drawGrid(gridsize);

    // Check the layers of the grid, and draw cells as needed.
    function drawCell(i, j, layer, isBorder) {
        if (isBorder || layeredGrid[i-1][j-1][layer].isSet) {
            ctx.fillStyle = cursorColors[layer];
            ctx.fillRect(i * cellWidth, j * cellHeight-1, cellWidth + 2, cellHeight + 2);
        }
    }

    // Draw CONTACT at the coordinates of the four inputs
    // and at the output.
    layeredGrid[A.x][A.y][CONTACT] = {isSet: true};
    layeredGrid[B.x][B.y][CONTACT] = {isSet: true};
    layeredGrid[C.x][C.y][CONTACT] = {isSet: true};
    layeredGrid[D.x][D.y][CONTACT] = {isSet: true};
    layeredGrid[Y.x][Y.y][CONTACT] = {isSet: true};

    // Draw METAL1 across the grid at VDD_y and GND_y.
    for (let i = railStartX; i < railEndX; i++) {
        layeredGrid[i][VDD_y][METAL1] = {isSet: true};
        layeredGrid[i][GND_y][METAL1] = {isSet: true};
    }

    // Draw each layer in order.
    for(let layer = 0; layer < layers; layer++) {
        for (let i = 1; i <= gridsize; i++) {
            for (let j = 1; j <= gridsize; j++) {
                drawCell(i, j, layer, false);

                // For the last layer, fill each filled cell with a cross.
                if (layer == layers - 1) {
                    if (layeredGrid[i-1][j-1][layer].isSet) {
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

    // Draw labels on the canvas above the four inputs and output
    ctx.font = "bold 18px Arial";
    ctx.fillStyle = darkMode ? "#ffffff" : "#000000";
    ctx.fillText("A", cellWidth * (A.x + 1.5), cellHeight * (A.y + 0.75));
    ctx.fillText("B", cellWidth * (B.x + 1.5), cellHeight * (B.y + 0.75));
    ctx.fillText("C", cellWidth * (C.x + 1.5), cellHeight * (C.y + 0.75));
    ctx.fillText("D", cellWidth * (D.x + 1.5), cellHeight * (D.y + 0.75));
    ctx.fillText("Y", cellWidth * (Y.x + 1.5), cellHeight * (Y.y + 0.75));

    // Draw a label on top of the VDD and GND rails.
    ctx.font = "bold 18px Arial";
    ctx.fillStyle = "#000000";
    ctx.fillText("VDD", cellWidth * 3, cellHeight * (VDD_y + 1.75));
    ctx.fillText("GND", cellWidth * 3, cellHeight * (GND_y + 1.75));

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
            if (layeredGrid[x][y][i].isSet) {
                anyLayerSet = true;
            }
        }

        if(noDelete || anyLayerSet) {
            let isSet = layeredGrid[x][y][cursorColorIndex].isSet;
            let toDelete = !noDelete && isSet || noAdd && anyLayerSet;

            if(toDelete || !noAdd) {
                saveCurrentState();

                if (toDelete) {
                    // Erase all layers of the cell.
                    for (let i = 0; i < layers; i++) {
                        layeredGrid[x][y][i].isSet = false;
                    }
                } else {
                    layeredGrid[x][y][cursorColorIndex].isSet = true;
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
                            layeredGrid[i][startY][cursorColorIndex].isSet = true;
                        }
                    }
                    // If the mouse moved more vertically than horizontally,
                    // draw a vertical line.
                    else {
                        for (let i = Math.min(startY, endY); i <= Math.max(startY, endY); i++) {
                            layeredGrid[startX][i][cursorColorIndex].isSet = true;
                        }
                    }
                }
                // Just fill in the cell at the start coordinates.
                else {
                    saveCurrentState();
                    layeredGrid[startX][startY][cursorColorIndex].isSet = true;
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
                        layeredGrid[i][startY][cursorColorIndex].isSet = true;
                    }
                }
                // If the mouse moved more vertically than horizontally,
                // draw a vertical line.
                else {
                    for (let j = topY; j <= bottomY; j++) {
                        layeredGrid[startX][j][cursorColorIndex].isSet = true;
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

        // If the user presses the "A" key,
        // move the coordinates for A to the cell under the cursor.
        if (event.keyCode == 65) {
            let cell = getCell(currentX, currentY);
            if (cell != null) {
                // First, unset the CONTACT layer at the old coordinates.
                layeredGrid[A.x][A.y][CONTACT].isSet = false;
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
                layeredGrid[B.x][B.y][CONTACT].isSet = false;
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
                layeredGrid[C.x][C.y][CONTACT].isSet = false;
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
                layeredGrid[D.x][D.y][CONTACT].isSet = false;
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
                layeredGrid[Y.x][Y.y][CONTACT].isSet = false;
                // Then, set the new coordinates.
                Y.x = cell.x;
                Y.y = cell.y;
                refreshCanvas();
            }
        }
    });

    // Only change dark/light mode on keyup to avoid seizure-inducing flashes from holding down space.
    window.addEventListener("keyup", function(event) {
        // Toggle dark mode by pressing space
        if (event.keyCode == 32) {
            darkMode = !darkMode;
            refreshCanvas();
        }
    });
}
