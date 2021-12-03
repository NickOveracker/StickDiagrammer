let PRINT_MOUSE_POS = false;

// Represent the graph visually as a graph in the console.
Graph.prototype.print = function() {
    console.log('graph G {');
    for (let node of this.nodes) {
        console.log(node.getName() + ';');
    }
    for (let edge of this.edges) {
        console.log(edge.getNode1().getName() + ' <-> ' + edge.getNode2().getName() + ';');
    }
    console.log('}');
}

Diagram.prototype.printNodeNodeMap = function() {
    let str = "   ";
    for(let ii = 0; ii < this.nodeNodeMap.length; ii++) {
        str += ii + " ";
        if(ii < 9) str += " ";
    }
    str += "\n";
    for(let ii = 0; ii < this.nodeNodeMap.length; ii++) {
        str += ii + " ";
        if(ii <= 9) str += " ";
        for(let jj = 0; jj < this.nodeNodeMap.length; jj++) {
            if(this.nodeNodeMap[ii][jj] === null) {
                str += "?  ";
            } else if(this.nodeNodeMap[ii][jj] === undefined) {
                str += "   ";
            } else if(this.nodeNodeMap[ii][jj] === true) {
                str += "1  ";
            } else {
                str += "0  ";
            }
        }
        str += "\n";
    }
  
    console.log(str)
}

// Print a grid with in all cells that are in a given net.
Diagram.prototype.printGrid = function(netNum) {
    let grid = [];
    let net = this.netlist[netNum];
    let name = "X";
    for(let ii = 0; ii < layeredGrid.height; ii++) {
        grid[ii] = [];
        for(let jj = 0; jj < layeredGrid.width; jj++) {
            grid[ii][jj] = "_";
            // If any of the layers are in netA, set the cell to "A".
            for(let kk = 0; kk < numLayers; kk++) {
                if(layeredGrid.get(ii, jj, kk).isSet && net.containsCell(layeredGrid.get(ii, jj, kk))) {
                    grid[ii][jj] = name;
                }
                else if(pmos.has(layeredGrid.get(ii, jj, kk)) || nmos.has(layeredGrid.get(ii, jj, kk))) {
                    grid[ii][jj] = "T";
                }
            }
        }
    }

    // Print to the console, rotated 90 degrees.
    str = ""
    for(let ii = 0; ii < grid.length; ii++) {
        let row = "";
        for(let jj = 0; jj < grid[ii].length; jj++) {
            row += grid[jj][ii];
        }
        str += row + "\n";
    }
    console.log(str);
}

DiagramController.prototype.getCellAtCursor = function(screenX, screenY) {
    'use strict';
    // Ignore if not inside the canvas
    if (this.inBounds(screenX, screenY)) {

        let x = Math.floor((screenX - this.view.canvas.offsetLeft - this.view.cellWidth) / this.view.cellWidth);
        let y = Math.floor((screenY - this.view.canvas.offsetTop - this.view.cellHeight) / this.view.cellHeight);
        PRINT_MOUSE_POS && console.log(x, y);
        return { x: x, y: y, };
    }
    return null;
}

Node.prototype.getName = function() {
    let name = "";
    if(this.cell.gate && this.cell.gate.name !== "?") {
        name = this.cell.gate.name;
        name += this.isPmos ? "+" : "";
        name += this.isNmos ? "-" : "";
    } else {
        name = graph.getIndexByNode(this);
        name += this.isPmos ? "+" : "";
        name += this.isNmos ? "-" : "";
    }

    return name;
}

window.userInput = [];
window.recordMode = false;

function recordEvent(event) {
    if(window.recordMode) {
        if(event.type === "mousemove") {
            if(!diagram.controller.dragging) {
                return;
            }
            else if(userInput[userInput.length - 1].type === event.type) {
                userInput.pop();
            }
        }
        userInput.push(event);
    }
}

function getRecording() {
    outArr = [];
    userInput.forEach(function(event) {
        outArr.push([
            event.type, {
                clientX: event.clientX,
                clientY: event.clientY,
            },
        ]);
        if(outArr[outArr.length - 1][0].includes("move")) {
            outArr[outArr.length - 1][1].buttons = event.buttons;
        } else {
            outArr[outArr.length - 1][1].button = event.button;
        }
    });
    str = JSON.stringify(outArr);
    console.log(str.replace(/^\[(\[.*\])\]$/, "$1").replaceAll("}],", "}],\n") + ",");
}


let oldOnload = window.onload;
window.onload = function() {
    oldOnload();

    // Record these events.
    document.getElementById("canvas-container").addEventListener("mousedown", recordEvent);
    document.getElementById("canvas-container").addEventListener("mouseup", recordEvent);
    window.addEventListener("touchmove", recordEvent);
    window.addEventListener("mousemove", recordEvent);
    window.addEventListener("keydown", recordEvent);
    window.addEventListener("keyup", recordEvent);
};