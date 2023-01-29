/**********************************************************************************************************************
 * Legal Stuff:
 * 
 * Copyright Nick Overacker & Miho Kobayashi.
 * This code is offered under the Strict License 1.0.0 (https://polyformproject.org/licenses/strict/1.0.0/),
 * which permits users to use this code for noncommercial purposes but reserves most right for the copyright holders.
 * For uses not permitted under the license, please contact: nick.overacker@okstate.edu
 *********************************************************************************************************************/

/* jshint bitwise: true */
/* jshint curly: true */
/* jshint eqeqeq: true */
/* jshint esversion: 6 */
/* jshint forin: true */
/* jshint freeze: true */
/* jshint futurehostile: true */
/* jshint leanswitch: true */
/* jshint maxcomplexity: 10 */
/* jshint maxdepth: 4 */
/* jshint maxparams: 4 */
/* jshint maxstatements: 30 */
/* jshint noarg: true */
/* jshint nocomma: false */
/* jshint nonbsp: true */
/* jshint nonew: true */
/* jshint noreturnawait: true */
/* jshint regexpu: true */
/* jshint strict: true */
/* jshint trailingcomma: true */
/* jshint undef: true */
/* jshint unused: true */
/* jshint varstmt: true */
/* jshint browser: true */
/* globals DiagramController: false,
           diagram:           false,
           Diagram:           false,
           Graph:             false,
*/

let PRINT_MOUSE_POS = false;

// Represent the graph visually as a graph in the console.
Graph.prototype.print = function() {
    'use strict';
    let edgeSet = new Set();
    console.log('graph G {');
    for (let node of this.nodes) {
        console.log(node.getName() + ';');
        // Add all edges to the set.
        for (let edge of node.edges) {
            edgeSet.add(edge);
        }
    }
    // Loop through edgeSet and print each edge.
    let edgeIterator = edgeSet.values();
    let edge = edgeIterator.next();
    while (!edge.done) {
        console.log(edge.value.getNode1().getName() + ' <-> ' + edge.value.getNode2().getName() + ';');
        edge = edgeIterator.next();
    }
    console.log('}');
};

// Print a grid with in all cells that are in a given net.
Diagram.prototype.printGrid = function(netNum) {
    'use strict';
    let grid = [];
    let net = this.netlist[netNum];
    let name = "X";
    for(let ii = 0; ii < this.layeredGrid.height; ii++) {
        grid[ii] = [];
        for(let jj = 0; jj < this.layeredGrid.width; jj++) {
            grid[ii][jj] = "_";
            // If any of the layers are in netA, set the cell to "A".
            for(let kk = 0; kk < Diagram.layers.length; kk++) {
                if(this.layeredGrid.get(ii, jj, kk).isSet && net.containsCell(this.layeredGrid.get(ii, jj, kk))) {
                    grid[ii][jj] = name;
                }
                else if(this.pmos.has(this.layeredGrid.get(ii, jj, kk)) || this.nmos.has(this.layeredGrid.get(ii, jj, kk))) {
                    grid[ii][jj] = "T";
                }
            }
        }
    }

    // Print to the console, rotated 90 degrees.
    let str = "";
    for(let ii = 0; ii < grid.length; ii++) {
        let row = "";
        for(let jj = 0; jj < grid[ii].length; jj++) {
            row += grid[jj][ii];
        }
        str += row + "\n";
    }
    console.log(str);
};

DiagramController.prototype.getCellAtCursor_old = DiagramController.prototype.getCellAtCursor;

DiagramController.prototype.getCellAtCursor = function(screenX, screenY) {
    'use strict';
    let retVal = this.getCellAtCursor_old(screenX, screenY);

    if(PRINT_MOUSE_POS && !!retVal) {
        console.log(retVal.x, retVal.y);
    }

    return retVal;
};

Node.prototype.getName = function() {
    'use strict';
    let name = this.getName_old();

    if(this.cell.gate && this.cell.gate.name !== "?") {
        name = this.cell.gate.name;
        name += this.isPmos ? "+" : "";
        name += this.isNmos ? "-" : "";
    } else {
        name = diagram.graph.getIndexByNode(this);
        name += this.isPmos ? "+" : "";
        name += this.isNmos ? "-" : "";
    }

    return name;
};

window.userInput = [];
window.recordMode = false;

function recordEvent(event) {
    'use strict';
    if(window.recordMode) {
        if(event.type === "mousemove") {
            if(!diagram.controller.dragging) {
                return;
            }
            else if(window.userInput[window.userInput.length - 1].type === event.type) {
                window.userInput.pop();
            }
        }
        window.userInput.push(event);
    }
}

function getRecording() {
    'use strict';
    let outArr = [];
    window.userInput.forEach(function(event) {
        outArr.push([
            event.type, {
                clientX: Math.ceil((event.clientX - diagram.view.canvas.offsetLeft - diagram.view.cellWidth)  / diagram.view.cellWidth),
                clientY: Math.ceil((event.clientY - diagram.view.canvas.offsetTop  - diagram.view.cellHeight) / diagram.view.cellHeight),
            },
        ]);
        if(outArr[outArr.length - 1][0].includes("move")) {
            outArr[outArr.length - 1][1].buttons = event.buttons;
        } else {
            outArr[outArr.length - 1][1].button = event.button;
        }
    });
    let str = JSON.stringify(outArr);
    console.log(str.replace(/^\[(\[.*\])\]$/u, "$1").replaceAll("}],", "}],\n") + ",");
}


let oldOnload = window.onload;
window.onload = function() {
    'use strict';

    oldOnload();

    // Record these events.
    document.getElementById("canvas-wrapper").addEventListener("mousedown", recordEvent);
    document.getElementById("canvas-wrapper").addEventListener("mouseup", recordEvent);
    window.addEventListener("touchmove", recordEvent);
    window.addEventListener("mousemove", recordEvent);
    window.addEventListener("keydown", recordEvent);
    window.addEventListener("keyup", recordEvent);
};

Diagram.prototype.mapString = function(row) {
  let str = "";
  
  for(let jj = 0; jj < this.nodeNodeMap[row].length; jj++) {
    str += this.nodeNodeMap[row][jj].label;
    str += " ";
  }
  
  return str;
}