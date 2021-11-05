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

// Cycle through the following cursor colors by pressing space: METAL1, PDIFF, NDIFF, POLY, BRIDGE
let METAL1 = 0;
let PDIFF = 1;
let NDIFF = 2;
let POLY = 3;
let BRIDGE = 4;
let cursorColors = ['#00FFFF', '#9400D3', '#32CD32', '#ff0000', '#0000ff'];
let cursorColor = cursorColors[METAL1];
let cursorColorIndex = METAL1;

// Grid color
let darkModeGridColor = '#cccccc';
let lightModeGridColor = '#999999';

// Button color
let darkModeButtonTextColor = '#ffffff';
let lightModeButtonTextColor = '#000000';
let darkModeButtonColor = '#cccccc';
let lightModeButtonColor = '#999999';

// Define a function to change the cursor color.
function changeCursorColor() {
    cursorColorIndex = (cursorColorIndex + 1) % cursorColors.length;
    cursorColor = cursorColors[cursorColorIndex];

    // set the outer 15 pixel border of the canvas to the new cursor color
    ctx.strokeStyle = cursorColor;
    ctx.lineWidth = 15;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
}

function makeLayeredGrid(width, height, layers) {
    // Each cell has several layers with boolean values.
    // Initialize every element to 0.
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
    let width = canvas.width;
    let height = canvas.height;
    cellWidth = width / (size + 2);
    cellHeight = height / (size + 2);
    
    // Set stroke color depending on whether the dark mode is on or off.
    // Should be faintly visible in both modes.
    if (darkMode) {
        ctx.strokeStyle = darkModeGridColor;
    } else {
        ctx.strokeStyle = lightModeGridColor;
    }

    for (let i = 0; i < size + 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellWidth, 0);
        ctx.lineTo(i * cellWidth, height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * cellHeight);
        ctx.lineTo(width, i * cellHeight);
        ctx.stroke();
    }
}

// Initialize everything
function refreshCanvas() {
    resizeCanvas();

    // Check the layers of the grid, and draw cells as needed.
    function drawCell(i, j, layer, isBorder) {
        if (isBorder || layeredGrid[i-1][j-1][layer]) {
            ctx.fillStyle = cursorColors[layer];
            ctx.fillRect(i * cellWidth, j * cellHeight, cellWidth, cellHeight);
        }
    }

    counter = 0
    // Draw each layer in order.
    for (let i = 1; i < gridsize + 1; i++) {
        for (let j = 1; j < gridsize + 1; j++) {
            drawCell(i, j, METAL1, false);
            drawCell(i, j, PDIFF, false);
            drawCell(i, j, NDIFF, false);
            drawCell(i, j, POLY, false);
            drawCell(i, j, BRIDGE, false);
        }
    }
    
    // Set dark mode as needed.
    if (darkMode) {
        document.body.style.backgroundColor = 'black';
    } else {
        document.body.style.backgroundColor = 'white';
    }

    drawGrid(gridsize);

    // Now do the outer border of the canvas (cells at row 0, column 0 and row gridsize+1, column gridsize+1)
    for (let i = 0; i < gridsize+2; i++) {
        drawCell(i, 0, cursorColorIndex, true);
        drawCell(i, gridsize+1, cursorColorIndex, true);
        drawCell(0, i, cursorColorIndex, true);
        drawCell(gridsize+1, i, cursorColorIndex, true);
    }

    // Draw a thick border on the edge of the border drawn above.
    ctx.lineWidth = cellWidth/4;
    ctx.strokeStyle = darkMode ? darkModeGridColor : lightModeGridColor;
    ctx.strokeRect(1 + cellWidth   - ctx.lineWidth/2,
                   1 + cellHeight  - ctx.lineWidth/2,
                   canvas.width  - 2*cellWidth  + ctx.lineWidth/2,
                   canvas.height - 2*cellHeight + ctx.lineWidth/2
                  );
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

    console.log('Saved state ' + saveState);
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

        console.log('Undo to state ' + saveState);
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

        console.log('Redo to state ' + saveState);
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

window.onload = function() {
    gridsize = 30;
    layers = 5;

    // Set to dark mode if it is night time
    if (new Date().getHours() > 19 || new Date().getHours() < 7) {
        darkMode = true;
    }
    else {
        darkMode = false;
    }

    // Initialize with a gridsize of 30 and 5 layers
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");
    layeredGrid = makeLayeredGrid(gridsize, gridsize, layers);
    refreshCanvas();

    // When the user left-clicks on a cell in the canvas,
    // set the appropriate member of the layeredGrid to true (the layer is the same as the cursor color)
    /*window.addEventListener("click", function(event) {
        if(dragging) {
            dragging = false;
            return;
        }
        if (event.button == 0) {
            colorCell(event.clientX, event.clientY, true, false);
        }
    });*/

    /*// Start dragging on mouse down
    window.addEventListener("mousedown", function(event) {
        if (event.button == 0 && !dragging) {
            dragging = true;
            colorCell(event.clientX, event.clientY, true, false);
        }
    });

    // Turn on dragging on mousemove within the canvas if the user is holding down the left mouse button.
    window.addEventListener("mousemove", function(event) {
        if (event.buttons == 1) {
            if(!dragging) {
                dragging = true;
                saveCurrentState();
            }
            // Ignore if not inside the canvas
            if (event.clientX > canvas.offsetLeft + cellWidth &&
                event.clientX < canvas.offsetLeft + canvas.width - cellWidth &&
                event.clientY > canvas.offsetTop + cellHeight &&
                event.clientY < canvas.offsetTop + canvas.height - cellHeight)
            {
                let x = Math.floor((event.clientX - canvas.offsetLeft - cellWidth) / cellWidth);
                let y = Math.floor((event.clientY - canvas.offsetTop - cellHeight) / cellHeight);
                let startX = x;
                let startY = y;
                let endX = x;
                let endY = y;

                // If the user is dragging horizontally, set the endX to the rightmost cell.
                if (event.movementX > 0) {
                    endX = Math.floor((event.clientX - canvas.offsetLeft - cellWidth) / cellWidth);
                }
                // If the user is dragging vertically, set the endY to the bottommost cell.
                else if (event.movementY > 0) {
                    endY = Math.floor((event.clientY - canvas.offsetTop - cellHeight) / cellHeight);
                }

                // Fill the line of cells from the start to the end.
                for (let i = startX; i <= endX; i++) {
                    for (let j = startY; j <= endY; j++) {
                        layeredGrid[i][j][cursorColorIndex] = true;
                    }
                }
                refreshCanvas();
            }
        }
    });*/

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
                    dragging = false;
                    let endX = Math.floor((event.clientX - canvas.offsetLeft - cellWidth) / cellWidth);
                    let endY = Math.floor((event.clientY - canvas.offsetTop - cellHeight) / cellHeight);

                    // Reverse the order of the start and end coordinates if necessary.
                    if (endX < startX) {
                        let temp = startX;
                        startX = endX;
                        endX = temp;
                    }
                    if (endY < startY) {
                        let temp = startY;
                        startY = endY;
                        endY = temp;
                    }

                    // If the mouse moved more horizontally than vertically,
                    // draw a horizontal line.
                    if (endX - startX > endY - startY) {
                        for (let i = startX; i <= endX; i++) {
                            layeredGrid[i][startY][cursorColorIndex] = true;
                        }
                    }
                    // If the mouse moved more vertically than horizontally,
                    // draw a vertical line.
                    else {
                        for (let j = startY; j <= endY; j++) {
                            layeredGrid[startX][j][cursorColorIndex] = true;
                        }
                    }
                }
                // Just fill in the cell at the start coordinates.
                else {
                    layeredGrid[startX][startY][cursorColorIndex] = true;
                }
            }
            // If the mouse was released outside the canvas, undo and return.
            else {
                undo();
            }

            refreshCanvas();
        }
    });

    // Show a preview line when the user is draggin the mouse.
    window.addEventListener("mousemove", function(event) {
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
            refreshCanvas();
        }

        // Redo by pressing CTRL + Y
        if (event.ctrlKey && event.keyCode == 89) {
            redo();
            refreshCanvas();
        }

        // Toggle dark mode by pressing space
        if (event.keyCode == 32) {
            darkMode = !darkMode;
            refreshCanvas();
        }
    });
}
