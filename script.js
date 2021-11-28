/***************************************************************************************************
 * 
 * ## Legal Stuff
 * All rights are reserved by Nick Overacker.
 *
 * Free for (personal ∧ non-professional ∧ non-commercial) use.
 * For (professional ⋁ commercial ⋁ institutional) use, please contact: nick.overacker@okstate.edu
 *
 * ## Stipulations for updates
 *    - All builds must pass JSHint with no warnings (https://jshint.com/)
 *      - This following tags may be disabled, but only on a line-by-line basis.
 *      - "jshint bitwise" (bitwise operators)
 *      - "jshint -W093" (returning and assigning in one step)
 *    - All builds must pass testbench
 *      - The testbench may need to be modified for some breaking changes (e.g., new layers)
 * 
 **************************************************************************************************/

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
/* globals runTestbench: false */

class LayeredGrid {
    constructor(width, height, layers) {
        this.width = width;
        this.height = height;
        this.layers = layers;
        this.grid = new Array(width * height * layers);
        this.defaultCell = { isSet: false, };
    }
    
    // Get the value at a given coordinate
    // If it isn't set, return the default value
    // If it's out of bounds, return null
    get(x, y, layer) {
        let cell;

        if(x < 0 || x >= this.width || y < 0 || y >= this.height || layer < 0 || layer >= this.layers) {
            return null;
        }

        cell = this.grid[x + (y * this.width) + (layer * this.width * this.height)];

        if(!cell) {
            return this.defaultCell;
        }

        return cell;
    }
    
    // Set the value at a given coordinate
    // If it's out of bounds, do nothing
    set(x, y, layer) {
        if(x < 0 || x >= this.width || y < 0 || y >= this.height || layer < 0 || layer >= this.layers) {
            return;
        }

        this.grid[x + (y * this.width) + (layer * this.width * this.height)] = {
            isSet: true,
            x: x,
            y: y,
            layer: layer,
            term1: null,
            term2: null,
            gate: null,
        };

        // Only allow one of NDIFF or PDIFF to be set
        if(layer === PDIFF) {
            this.clear(x, y, NDIFF);
        } else if(layer === NDIFF) {
            this.clear(x, y, PDIFF);
        }
    }

    isTerminal(x, y, layer) {
        let isTerminal = false;

        // Loop through inputs, outputs, and VDD/GND
        isTerminal = layer === CONTACT && inputs.some(function(input) {
            return input.x === x && input.y === y;
        });

        isTerminal = isTerminal || layer === CONTACT && outputs.some(function(output) {
            return output.x === x && output.y === y;
        });

        isTerminal = isTerminal || vddCell.x === x && vddCell.y === y;
        isTerminal = isTerminal || gndCell.x === x && gndCell.y === y;

        return isTerminal;
    }

    // Clear the value at a given coordinate
    // If it's out of bounds, do nothing
    // Do not clear CONTACT for inputs, outputs, or VDD/GND
    clear(x, y, layer) {
        let outOfBounds = x < 0 || x >= this.width || y < 0 || y >= this.height || layer < 0 || layer >= this.layers;

        if(outOfBounds || layer === CONTACT && this.isTerminal(x, y, layer)) {
            return;
        }

        this.grid[x + (y * this.width) + (layer * this.width * this.height)] = null;
    }

    // The grid is implemented as a flat array, so this function
    // returns the index of the cell at a given coordinate
    convertFromCoordinates(x, y, layer) {
        return x + (y * this.width) + (layer * this.width * this.height);
    }

    // Convert the index of a cell to its coordinates
    convertToCoordinates(index) {
        let layer = Math.floor(index / (this.width * this.height));
        let y = Math.floor((index - (layer * this.width * this.height)) / this.width);
        let x = index - (layer * this.width * this.height) - (y * this.width);
        return { x: x, y: y, layer: layer, };
    }

    // Map a function to all set values in the grid
    map(bounds, func, includeEmpty) {
        let cell;

        let outOfGrid = function(x, y, layer) {
            return x < 0     || x >= this.width  ||
                   y < 0     || y >= this.height || 
                   layer < 0 || layer >= this.layers;
        }.bind(this);

        for(let layer = bounds.lowLayer; layer <= bounds.highLayer; layer++) {
            for(let y = bounds.top; y <= bounds.bottom; y++) {
                for(let x = bounds.left; x <= bounds.right; x++) {
                    if(outOfGrid(x, y, layer)) {
                        continue;
                    }
                    cell = this.grid[this.convertFromCoordinates(x, y, layer)];
                    if(cell || includeEmpty) {
                        func(x, y, layer);
                    }
                }
            }
        }
    }

    // Clear all values in the grid
    clearAll() {
        let bounds = {
            left: 0,
            right: this.width - 1,
            top: 0,
            bottom: this.height - 1,
            lowLayer: 0,
            highLayer: this.layers - 1,
        };
        this.map(bounds, function(cell) {
            this.grid[cell] = null;
        });
    }

    // Change the height of the grid
    resize(width, height, layers) {
        let oldGrid = this.grid;
        this.width = width;
        this.height = height;
        this.layers = layers;
        this.grid = new Array(width * height * layers);

        // Copy the old grid into the new grid
        let bounds = {
            left: 0,
            right: Math.min(this.width - 1, oldGrid.length - 1),
            top: 0,
            bottom: Math.min(this.height - 1, oldGrid.length - 1),
            lowLayer: 0,
            highLayer: Math.min(this.layers - 1, oldGrid.length - 1),
        };
        this.map(bounds, function(cell) {
            this.grid[cell] = oldGrid[cell];
        }
        .bind(this));
    }
}

// Graph class to represent CMOS circuitry.
class Graph {
    constructor() {
        this.nodes = [];
    }

    // Clear the graph.
    clear() {
        // Destroy all nodes.
        for (let ii = 0; ii < this.nodes.length; ii++) {
            this.nodes[ii].destroy();
        }

        this.nodes.length = 0;
    }

   // Add a node to the graph.
    addNode(cell) {
        let node = new Node(cell);
        this.nodes.push(node);
        return node;
    }

    // Return the node with the given cell.
    getNode(cell) {
        for (let node of this.nodes) {
            if (node.cell === cell) {
                return node;
            }
        }
        return null;
    }

    getIndexByNode(node) {
        for (let ii = 0; ii < this.nodes.length; ii++) {
            if (this.nodes[ii] === node) {
                return ii;
            }
        }
        return -1;
    }
}

// Each graph node is a transistor, VDD, GND, or an output.
class Node {
    constructor(cell) {
        this.cell = cell;
        this.edges = [];
        this.isPmos = layeredGrid.get(cell.x, cell.y, PDIFF).isSet;
        this.isNmos = layeredGrid.get(cell.x, cell.y, NDIFF).isSet;
    }

    // Destructor
    destroy() {
        this.edges.forEach((edge) => {edge.destroy();});
        this.cell = undefined;
        this.edges.length = 0;
    }

    // Check if two nodes are connected.
    isConnected(otherNode) {
        for (let ii = 0; ii < this.edges.length; ii++) {
            if (this.edges[ii].getNode1() === otherNode || this.edges[ii].getNode2() === otherNode) {
                return true;
            }
        }
        return false;
    }
 
    isTransistor() {
        return this.isPmos || this.isNmos;
    }

    addEdge(node) {
        let edge = new Edge(this, node);
        this.edges.push(edge);
        node.edges.push(edge);
    }

    removeEdge(edge) {
        let index = this.edges.indexOf(edge);
        if (index > -1) {
            this.edges.splice(index, 1);
        }
    }

    getName() {
        return this.cell.gate.name;
    }
}

// Each edge is a connection between two graph nodes.
class Edge {
    constructor(node1, node2) {
        this.node1 = node1;
        this.node2 = node2;
    }

    // Destructor
    destroy() {
        this.node1 = undefined;
        this.node2 = undefined;
    }

    getNode1() {
        return this.node1;
    }

    getNode2() {
        return this.node2;
    }

    getOtherNode(node) {
        if (this.node1 === node) {
            return this.node2;
        } else if (this.node2 === node) {
            return this.node1;
        } else {
            return null;
        }
    }
}

// Set of cells that are electrically connected to one another.
class Net {
    constructor(name, isInput) {
        this.name = name;
        this.cells = new Set();
        this.nodes = new Set();
        this.isInput = isInput;
    }

    isIdentical(net) {
        // Two nets are identical if they have the same set of cells.
        // By design, if two nets share even one cell, then they share all cells.
        // So, we can just check a single cell.
        let cell = this.cells.values().next().value;
        return net.cells.has(cell);
    }

    addNode(node) {
        this.nodes.add(node);
    }

    removeNode(node) {
        this.nodes.delete(node);
    }

    containsNode(node) {
        return this.nodes.has(node);
    }

    clear() {
        this.cells.clear();
        this.nodes.clear();
    }

    addCell(cell) {
        this.cells.add(cell);
    }

    containsCell(cell) {
        return this.cells.has(cell);
    }

    size() {
        return this.nodes.size;
    }
}

let inputs;
let outputs;
let layeredGrid;
let canvas;
let ctx;
let darkMode;
let cellHeight;
let cellWidth;
let gridWidth = 29;
let gridHeight = 29;
let firstSaveState = 0;
let saveState = 0;
let lastSaveState = 0;
let maxSaveState = 10;
let dragging = false;
let startX;
let startY;
let gridCanvas;
let currentX;
let currentY;
let button;
let nodeNodeMap = [];
let useFlatColors = false;

// Cycle through the following cursor colors by pressing space: PDIFF, NDIFF, POLY, METAL1, CONTACT
// Additional colors: DELETE at index (numLayers + 0)
let cursors = [
    {name: 'pdiff',   color: 'rgba(118,   0, 181,   1)', flatColor: 'rgb(118,   0, 181)', selectable: true, },
    {name: 'ndiff',   color: 'rgba(50,  205,  50,   1)', flatColor: 'rgb(50,  205,  50)', selectable: true, },
    {name: 'poly',    color: 'rgba(255,   0,   0, 0.5)', flatColor: 'rgb(255,   0,   0)', selectable: true, },
    {name: 'metal1',  color: 'rgba(0,   255, 255, 0.5)', flatColor: 'rgb(0,   255, 255)', selectable: true, },
    {name: 'metal2',  color: 'rgba(255,   0, 204, 0.5)', flatColor: 'rgb(255,   0, 204)', selectable: true, },
    {name: 'contact', color: 'rgba(204, 204, 204, 0.5)', flatColor: 'rgb(204, 204, 204)', selectable: true, },
    {name: 'delete',  color: 'rgba(208, 160,  32, 0.5)', flatColor: 'rgb(208, 160,  32)', selectable: false,},
];
let numLayers = cursors.length - 1;
let PDIFF   = 0;
let NDIFF   = PDIFF + 1;
let POLY    = NDIFF + 1;
let METAL1  = POLY + 1;
let METAL2  = METAL1 + 1;
let CONTACT = METAL2 + 1;
let DELETE  = numLayers;
let cursorIndex = 0;

// Objects to represent the coordinates of the inputs (A, B, C, D, ...)
// and the output (Y, X, W, V, ...).
let A = { x: 2, y: 8, };
let B = { x: 2, y: 12, };
let C = { x: 2, y: 16, };
let D = { x: 2, y: 20, };
let Y = { x: 26, y: 14, };

inputs = [A, B, C, D, ];
outputs = [Y, ];

// Netlist is a list of nets.
// Each net is a Set of cells.
let netlist = [];
let graph;

// VDD and GND are the two terminals of the grid.
// The terminals are always at the top and bottom of the grid.
let vddCell = {x: 1, y: 1,};
let gndCell = {x: 1, y: gridHeight - 2,};

// Nodes
let vddNode;
let gndNode;
let outputNodes = [];

let nmos = new Set();
let pmos = new Set();

// Grid color
let darkModeGridColor = '#cccccc';
let lightModeGridColor = '#999999';

let netVDD = new Net("VDD", false);
let netGND = new Net("GND", false);

let inputNets = [];
let outputNets = [];
for (let ii = 0; ii < inputs.length; ii++) {
    inputNets.push(new Net(String.fromCharCode(65 + ii), true));
}
for (let ii = 0; ii < outputs.length; ii++) {
    outputNets.push(new Net(String.fromCharCode(89 - ii), false));
}

/* jshint latedef: nofunc */

function computeOutput(inputVals, outputNode) {
    'use strict';
    let pmosOut;
    let nmosOut;
    let directInput;
    let triggers = [];

    function mapNodes(node1, node2, isPath) {
        let currentMapping = pathExists(node1, node2);

        if (currentMapping !== undefined && currentMapping !== null) {
            return;
        }

        nodeNodeMap[graph.getIndexByNode(node1)][graph.getIndexByNode(node2)] = isPath;
        nodeNodeMap[graph.getIndexByNode(node2)][graph.getIndexByNode(node1)] = isPath;

        if (isPath === null) { return; }

        // Map the path to node2 appropriately for all nodes mapped to node1.
        for (let ii = 0; ii < nodeNodeMap.length; ii++) {
            if (nodeNodeMap[ii][graph.getIndexByNode(node1)] === true) {
                nodeNodeMap[ii][graph.getIndexByNode(node2)] = isPath;
                nodeNodeMap[graph.getIndexByNode(node2)][ii] = isPath;
            }
        }
        // Now do the inverse.
        for (let ii = 0; ii < nodeNodeMap.length; ii++) {
            if (nodeNodeMap[ii][graph.getIndexByNode(node2)] === true) {
                nodeNodeMap[ii][graph.getIndexByNode(node1)] = isPath;
                nodeNodeMap[graph.getIndexByNode(node1)][ii] = isPath;
            }
        }

        if(isPath !== undefined) {
            executeTriggers(node1, node2);
        }
    }

    function pathExists(node1, node2) {
        return nodeNodeMap[graph.getIndexByNode(node1)][graph.getIndexByNode(node2)];
    }

    function executeTriggers(node, targetNode) {
        let triggerList = triggers[graph.getIndexByNode(node)];
        if (triggerList === undefined) { return; }
        triggerList = triggerList[graph.getIndexByNode(targetNode)];
        if (triggerList === undefined) { return; }
        for (let ii = 0; ii < triggerList.length; ii++) {
            let pathEval = pathExists(triggerList[ii].node, triggerList[ii].targetNode);
            if(pathEval === undefined || pathEval === null) {
                mapNodes(node, targetNode, undefined);
                computeOutputRecursive(triggerList[ii].node, triggerList[ii].targetNode);
            }
        }
    }

    function registerTrigger(triggerNode1, triggerNode2, callNode1, callNode2) {
        let triggerIndex1 = graph.getIndexByNode(triggerNode1);
        let triggerIndex2 = graph.getIndexByNode(triggerNode2);

        if(triggers[triggerIndex1] === undefined) {
            triggers[triggerIndex1] = [];
        }
        if(triggers[triggerIndex2] === undefined) {
            triggers[triggerIndex2] = [];
        }
        if(triggers[triggerIndex1][triggerIndex2] === undefined) {
            triggers[triggerIndex1][triggerIndex2] = [];
            triggers[triggerIndex2][triggerIndex1] = [];
        }
        triggers[triggerIndex1][triggerIndex2].push({node: callNode1, targetNode: callNode2,});
        triggers[triggerIndex2][triggerIndex1].push({node: callNode1, targetNode: callNode2,});
    }

    function computeOutputRecursive(node, targetNode) {
        let hasPath;
        let hasNullPath;
        let pathFound;

        // We found it?
        if (node === targetNode) {
            return true;
        }

        hasPath = pathExists(node, targetNode);
        // Prevent too much recursion.
        // If this is already being checked, the path will be null.
        if (hasPath === null) {
            return null;
        } else if (hasPath !== undefined) {
        // Avoid infinite loops.
            return hasPath;
        }

        // Initialize to null.
        mapNodes(node, targetNode, null);

        // Only proceed if the input is activated.
        // Ignore in case of output or supply, since these don't have
        // gates to evaluate. Simply arriving at them means they are active.
        if (node.isTransistor()) {
            let evalResult = evaluate(node);
            if (evalResult === false) {
                graph.nodes.forEach(function(otherNode) {
                    if(node === otherNode) {
                        return;
                    }
                    mapNodes(node, otherNode, false);
                });
                return false;
            } else if (evalResult === null) {
                registerTrigger(node, vddNode, node, targetNode);
                registerTrigger(node, gndNode, node, targetNode);
                mapNodes(node, targetNode, undefined);
                return null;
            }
        }

        // Recurse on all edges.
        hasNullPath = false;
        pathFound = false;
        /*jshint -W093 */
        node.edges.some(function(edge) {
            let otherNode = edge.getOtherNode(node);
            let hasPath = pathExists(otherNode, targetNode);
            if (hasPath) {
                mapNodes(node, targetNode, true);
                mapNodes(node, edge.getOtherNode(node), true);
                return pathFound = true;
            }
            let result = hasPath !== false && computeOutputRecursive(otherNode, targetNode);
            if (result) {
                mapNodes(node, targetNode, true);
                mapNodes(node, edge.getOtherNode(node), true);
                return pathFound = true;
            }

            if(result === null || hasPath === null) {
                hasNullPath = true;
                registerTrigger(targetNode, edge.getOtherNode(node), node, targetNode);
            }
        });
        /*jshint +W093 */

        if(pathFound) {
            return true;
        } else if(hasNullPath) {
            return null;
        } else {
            mapNodes(node, targetNode, false);
            return false;
        }
    }

    function evaluate(node) {
        let gateNet = node.cell.gate;
        let gateNodeIterator;
        let hasNullPath;

        if (gateNet.isInput) {
            /*jslint bitwise: true */
            let inputNum = node.getName().charCodeAt(0) - 65;

            // Pass-through positive for NMOS.
            let evalInput = !!((inputVals >> inputNum) & 1);
            return !(node.isNmos ^ evalInput);
            /*jslint bitwise: false */
        }

        // Otherwise, recurse and see if this is active.
        gateNodeIterator = gateNet.nodes.values();
        hasNullPath = false;

        for (let gateNode = gateNodeIterator.next(); !gateNode.done; gateNode = gateNodeIterator.next()) {
            gateNode = gateNode.value;
            let gateToGnd = pathExists(gateNode, gndNode);
            let gateToVdd = pathExists(gateNode, vddNode);
            let relevantPathExists;
            let relevantNode;

            if(gateToGnd === null || gateToVdd === null) {
                hasNullPath = true;
            }
            
            if(node.isPmos) {
                relevantNode = gndNode;
            } else {
                relevantNode = vddNode;
            }

            relevantPathExists = computeOutputRecursive(gateNode, relevantNode);
            if (relevantPathExists === null) {
                hasNullPath = true;
                registerTrigger(gateNode, relevantNode, node, vddNode);
                registerTrigger(gateNode, relevantNode, node, gndNode);
            } else if(relevantPathExists) {
                return true;
            }
        }

        if(hasNullPath) {
            return null;
        }
        return false;
    }

    function reconcileOutput(pOut, nOut, dIn) {
        let out;

        // Reconcile (nmos and pmos step)
        if (pOut === "Z") {
            out = nOut;
        } else if (nOut === "Z") {
            out = pOut;
        } else {
            out = "X";
        }

        // Handle direct connection between input and output.
        if(dIn !== undefined) {
            if(out === "Z") {
                out = dIn;
            }
            else if(out !== dIn) {
                out = "X";
            }
        }
        
        return out;
    }

    // Get pmos output.
    nodeNodeMap.length = 0;
    for (let ii = 0; ii < graph.nodes.length; ii++) {
        nodeNodeMap[ii] = [];
        nodeNodeMap[ii][ii] = true;
    }
    pmosOut = computeOutputRecursive(vddNode, outputNode) ? 1 : "Z";

    // Get nmos output.
    nodeNodeMap.length = 0;
    for (let ii = 0; ii < graph.nodes.length; ii++) {
        nodeNodeMap[ii] = [];
        nodeNodeMap[ii][ii] = true;
    }
    triggers.length = 0;
    nmosOut = computeOutputRecursive(gndNode, outputNode) ? 0 : "Z";

    // Finally, see if an input is directly connected to the output.
    for (let ii = 0; ii < inputNets.length; ii++) {
        if(inputNets[ii].containsNode(outputNode)) {
            /*jslint bitwise: true */
            let temp = (inputVals >> ii) & 1;
            /*jslint bitwise: false */

            if(directInput === undefined || directInput === temp) {
                directInput = temp;
            } else {
                directInput = "X";
            }
        }
    }

    return reconcileOutput(pmosOut, nmosOut, directInput);
}

// Generate an output table.
// Each row evaluates to 1, 0, Z, or X
// 1 is VDD, 0 is GND.
// Z is high impedance, X is error (VDD and GND contradiction.)
function buildTruthTable() {
    'use strict';
    let header = [];
    let inputVals = [];
    let outputVals = [];

    // Each loop iteration is a combination of input values.
    // I.e., one row of the output table.
    for (let ii = 0; ii < Math.pow(2, inputs.length); ii++) {
        let tableInputRow = [];
        let tableOutputRow = [];

        // Compute each output.
        for (let jj = 0; jj < outputs.length; jj++) {
            tableOutputRow[jj] = computeOutput(ii, outputNodes[jj]);
        }

        outputVals[ii] = tableOutputRow;

        for (let jj = 0; jj < inputs.length; jj++) {
            /*jslint bitwise: true */
            tableInputRow[jj] = (ii >> jj) & 1;
            /*jslint bitwise: false */
        }

        inputVals[ii] = tableInputRow;
    }

    // Header
    for (let jj = inputVals[0].length - 1; jj >= 0; jj--) {
        header[inputVals[0].length - 1 - jj] = String.fromCharCode(65 + jj);
    }

    // Merge input and output into one table (input on the left, output on the right.)
    let table = [];
    table[0] = header;
    table[0][header.length] = "Y";
    for (let ii = 0; ii < inputVals.length; ii++) {
        // Reverse the input row.
        table[ii + 1] = inputVals[ii].reverse().concat(outputVals[ii]);
    }

    return table;
}

graph = new Graph();

// Draw the outer border of the canvas.
function drawBorder() {
    'use strict';
    ctx.strokeStyle = useFlatColors? cursors[cursorIndex].flatColor : cursors[cursorIndex].color;
    ctx.lineWidth = cellWidth;
    ctx.strokeRect(cellWidth / 2, cellWidth / 2, canvas.width - cellWidth, canvas.height - cellWidth);

    // Draw a thick border on the edge of the border drawn above.
    ctx.lineWidth = cellWidth / 4;
    ctx.strokeStyle = darkMode ? "#ffffff" : "#000000";
    ctx.strokeRect(1 + cellWidth - ctx.lineWidth / 2,
        1 + cellHeight - ctx.lineWidth / 2,
        canvas.width - 2 * cellWidth + ctx.lineWidth / 2,
        canvas.height - 2 * cellHeight + ctx.lineWidth / 2
    );

    // For the middle 11 cells of the upper border, fill with the grid color.
    ctx.fillStyle = darkMode ? "#ffffff" : "#000000";
    let startCell = Math.floor(gridWidth / 2) - 4;
    ctx.fillRect(startCell * cellWidth, 0, cellWidth * 11, cellHeight);

    // Write the cursor color name in the middle of the upper border of the canvas.
    ctx.fillStyle = darkMode ? '#000000' : '#ffffff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(cursors[cursorIndex].name, canvas.width / 2, cellHeight * 3 / 4);
}

// Change the layer/cursor color
function changeLayer() {
    'use strict';
    // Go to the next selectable index.
    let tempIndex = cursorIndex + 1;

    while(tempIndex >= cursors.length || !cursors[tempIndex].selectable) {
        tempIndex = tempIndex >= cursors.length - 1 ? 0 : tempIndex + 1;
    }
    cursorIndex = tempIndex;

    // set the outer border of the canvas to the new cursor color
    drawBorder();
}

// Resize the canvas to the largest square that fits in the window.
function resizeCanvas() {
    'use strict';
    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;
    let windowSize = Math.min(windowWidth, windowHeight);
    canvas.width = windowSize;
    canvas.height = windowSize;
}

// Draw a faint grid on the canvas.
// Add an extra 2 units to the width and height for a border.
function drawGrid(width, height) {
    'use strict';
    // Check if gridCanvas is defined.
    if (gridCanvas === undefined) {
        gridCanvas = document.createElement('canvas');
        document.body.appendChild(gridCanvas);
    }

    // Return if the size has not changed.
    if (gridCanvas.width      === canvas.width - 1         &&
        gridCanvas.height     === canvas.height - 1        &&
        gridCanvas.style.left === canvas.offsetLeft + 'px' &&
        gridCanvas.style.top  === canvas.offsetTop  + 'px') {
        return;
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
    cellWidth = canvas.width / (width + 2);
    cellHeight = canvas.height / (height + 2);

    // Clear the grid canvas.
    gridCanvas.getContext('2d').clearRect(0, 0, gridCanvas.width, gridCanvas.height);

    // Set stroke color depending on whether the dark mode is on or off.
    // Should be faintly visible in both modes.
    if (darkMode) {
        gridCtx.strokeStyle = darkModeGridColor;
    } else {
        gridCtx.strokeStyle = lightModeGridColor;
    }

    for (let ii = 0; ii < Math.max(width, height) + 2; ii++) {
        if(ii < width + 2) {
            gridCtx.beginPath();
            gridCtx.moveTo(ii * cellWidth, 0);
            gridCtx.lineTo(ii * cellWidth, gridCanvas.height);
            gridCtx.stroke();
        }
        if(ii < height + 2) {
            gridCtx.beginPath();
            gridCtx.moveTo(0, ii * cellHeight);
            gridCtx.lineTo(gridCanvas.width, ii * cellHeight);
            gridCtx.stroke();
        }
    }
}

// Map a function to every transistor terminal.
function loopThroughTransistors(funct) {
    'use strict';
    let terms = ["term1", "term2", "gate", ];
    let transistorLists = [nmos, pmos, ];

    transistorLists.forEach(function (transistorList) {
        let iterator = transistorList.values();

        for (let transistor = iterator.next(); !transistor.done; transistor = iterator.next()) {
            let transistorCell = transistor.value;
            let transistorNode = graph.getNode(transistorCell);

            for(let ii = 0; ii < terms.length; ii++) {
                funct(transistorCell, transistorNode, terms[ii]);
            }
        }
    });
}

// Clear necessary data structures in preparation for recomputation.
function clearCircuit() {
    'use strict';
    // Create a graph object.
    graph.clear();

    // Clear the net sets.
    netVDD.clear();
    netGND.clear();
    nmos.clear();
    pmos.clear();
}

// Push all terminal nets to the netlist.
function resetNetlist() {
    'use strict';
    // Clear the netlist.
    netlist.length = 0;

    // Add all terminal nets.
    netlist.push(netVDD);
    netlist.push(netGND);

    inputNets.forEach(function(net) {
        netlist.push(net);
    });
    outputNets.forEach(function(net) {
        netlist.push(net);
    });
}

// Set the nets.
function setNets() {
    'use strict';
    clearCircuit();

    inputNets.forEach(function (net) { net.clear(); });
    outputNets.forEach(function (net) { net.clear(); });

    // Add rail nodes to the graph.
    vddNode = graph.addNode(layeredGrid.get(vddCell.x, vddCell.y, CONTACT));
    gndNode = graph.addNode(layeredGrid.get(gndCell.x, gndCell.y, CONTACT));

    netVDD.addNode(vddNode);
    netGND.addNode(gndNode);

    // Add the VDD and GND nets.
    // Loop through every VDD cell and add to the VDD net.
    setRecursively(layeredGrid.get(vddCell.x, vddCell.y, CONTACT), netVDD);

    // Loop through every GND cell and add to the GND net.
    setRecursively(layeredGrid.get(gndCell.x, gndCell.y, CONTACT), netGND);

    // Loop through the terminals and set their respective nets.
    cursors.forEach(function (_, layer) {
        inputs.forEach(function(input, index) {
            if (layeredGrid.get(input.x, input.y, layer).isSet) {
                setRecursively(layeredGrid.get(input.x, input.y, layer), inputNets[index]);
            }
        });

        outputs.forEach(function(output, index) {
            if (layeredGrid.get(output.x, output.y, layer).isSet) {
                setRecursively(layeredGrid.get(output.x, output.y, layer), outputNets[index]);
            }
        });
    });

    resetNetlist();

    // Add output nodes to the graph.
    outputNodes.length = 0;
    outputs.forEach(function(output, index) {
        outputNodes[index] = graph.addNode(layeredGrid.get(output.x, output.y, CONTACT));
        outputNets[index].addNode(outputNodes[index]);
    });

    // Each nmos and pmos represents a relation between term1 and term2.
    // If term1 is not in any of the nets,
    // then create a new net and add term1 to it.
    // Loop through nmos first.
    // Loop only through "term1" and "term2" for both transistor types.
    loopThroughTransistors(function (transistor, _, term) {
        // Skip for the gate terminal.
        if (term === "gate") { return; }

        let net = new Net("?", false);

        // If the transistor's term1/term2 is not in any of the nets,
        // then create a new net and add term1/term2 to it.
        if (transistor[term] !== undefined) {
            if (getNet(transistor[term])) {
                net.clear();
                net = getNet(transistor[term]);
            }
            net.addCell(transistor[term]);
        }

        // Add the net if it is not empty.
        if (net.size > 0 && !getNet(transistor[term])) {
            setRecursively(transistor[term], net);
            netlist.push(net);
            net.addNode(graph.getNode(transistor));
        }
    });

    // Now, loop through nmos and pmos again and change each transistors terminal values from cells to nets.
    // This must be done after the above loop rather than as a part of it, because the loop above will overwrite the nets.
    loopThroughTransistors(function (transistor, _, term) {
        let net = getNet(transistor[term]);

        if (net === null) {
            net = new Net("?", false);
            setRecursively(transistor[term], net);
            netlist.push(net);
        }

        if (net !== undefined) {
            transistor[term] = net;
            // Gates aren't nodes.
            // The transistors themselves are the nodes, as are VDD, GND, and all outputs.
            if (term !== "gate") { net.addNode(graph.getNode(transistor)); }
        }
    });

    // Loop through pmos/nmos and find every pmos/nmos that shares a net (on term1 or term2).
    loopThroughTransistors(function (_, transistor, termA) {
        // Skip for the gate terminal.
        if (termA === "gate") { return; }

        let net = transistor.cell[termA];

        // If net is netVDD, add an edge to vddNode.
        if (net === netVDD) {
            transistor.addEdge(vddNode);
        }

        // If net is netGND, add an edge to gndNode.
        if (net === netGND) {
            transistor.addEdge(gndNode);
        }

        // Same for output.
        outputNets.forEach(function (outputNet, index) {
            if (net === outputNet) {
                transistor.addEdge(outputNodes[index]);
            }
        });

        // Loop through iterator2 to find all other transistors that share a net.
        loopThroughTransistors(function (_, transistor2, termB) {
            // Skip for the gate terminal or self-comparison.
            if (termB === "gate" || transistor === transistor2) { return; }

            if (transistor2.cell[termB] !== undefined) {
                if (transistor.cell[termA] === transistor2.cell[termB]) {
                    transistor.addEdge(transistor2);
                }
            }
        });
    });

    linkIdenticalNets();
} // end function (setNets)

function linkIdenticalNets() {
    'use strict';
    function linkNodes(net1, net2) {
        let nodeIterator1 = net1.nodes.values();
        let nodeIterator2 = net2.nodes.values();

        // If net1 is an input net, we need to reverse the order of the nodes.
        // This is because there are no nodes in input nets to begin with.
        // Loop through inputNets and find the net1.
        inputNets.some(function (net) {
            if (net === net1) {
                let temp = nodeIterator1;
                nodeIterator1 = nodeIterator2;
                nodeIterator2 = temp;
                temp = net1;
                net1 = net2;
                net2 = temp;
                return true;
             }
        });

        // Loop through net1's nodes.
        for (let node1 = nodeIterator1.next(); !node1.done; node1 = nodeIterator1.next()) {
            net2.addNode(node1.value);

            // Loop through net2's nodes.
            for (let node2 = nodeIterator2.next(); !node2.done; node2 = nodeIterator2.next()) {
                node1.value.addEdge(node2.value);
                net1.addNode(node2.value);
            }
        }
    }
    // Loop through every net.
    for (let ii = 0; ii < netlist.length; ii++) {
        // Loop through every net again.
        for (let jj = ii + 1; jj < netlist.length; jj++) {
            // If the nets are identical, add an edge between them.
            if (netlist[ii].isIdentical(netlist[jj])) {
                linkNodes(netlist[ii], netlist[jj]);
            }
        }
    }
}

// Function to get the net from the netlist that contains a given cell.
function getNet(cell) {
    'use strict';
    for (let ii = 0; ii < netlist.length; ii++) {
        if (netlist[ii].containsCell(cell)) {
            return netlist[ii];
        }
    }
    return null;
}

// If there are any nodes at this cell, add them to the net.
function addNodeByCellToNet(cell, net) {
    'use strict';

    let node = graph.getNode(cell);

    if(node !== null) {
        let nodeIterator = net.nodes.values();

        // Loop through net's nodes.
        for (let node2 = nodeIterator.next(); !node2.done; node2 = nodeIterator.next()) {
            node.addEdge(node2.value);
        }

        net.addNode(node);
    }
}

function setRecursively(cell, net) {
    'use strict';

    addNodeByCellToNet(cell, net);

    // Return if this cell is in pmos or nmos already.
    if (nmos.has(cell) || pmos.has(cell)) {
        return;
    }

    // If the cell is NDIFF or PDIFF intersected by POLY, create a transistor.
    // Exception for CONTACT.
    // Returns true if the cell is a transistor.
    function checkTransistor(cell, layer, transistorArray) {

        // Helper function to set the terminals of transistors.
        function setTerminals(x, y, layer) {
            let getCell = layeredGrid.get(x, y, layer);
            if (getCell.isSet) {
                if (cell.term1 === undefined) {
                    cell.term1 = getCell;
                } else {
                    cell.term2 = getCell;
                }
            }
        }

        // If the layer is NDIFF or PDIFF and there is also a POLY at the same location,
        // add the cell to transistors.
        if (cell.layer === layer && cell.isSet) {
            if (layeredGrid.get(cell.x, cell.y, POLY).isSet && !layeredGrid.get(cell.x, cell.y, CONTACT).isSet) {
                transistorArray.add(cell);
                graph.addNode(cell);
                // Set the gate to the poly cell.
                cell.gate = layeredGrid.get(cell.x, cell.y, POLY);

                // Check adjacent cells for NDIFF.
                // Set term1 to the first one found.
                // Set term2 to the second one found.
                cell.term1 = undefined;
                cell.term2 = undefined;

                // TODO: Account for wide poly.
                // Check the cells above and below.
                setTerminals(cell.x, cell.y - 1, layer);
                setTerminals(cell.x, cell.y + 1, layer);

                // Check the cells to the left and right.
                setTerminals(cell.x - 1, cell.y, layer);
                setTerminals(cell.x + 1, cell.y, layer);

                return true;
            }
        }

        return false;
    }

    // For each layer of the cell in the net, recurse with all adjacent cells in the layer.
    // Generic function for the above code.
    function setAdjacent(deltaX, deltaY) {
        if (net.containsCell(layeredGrid.get(cell.x, cell.y, cell.layer)) && layeredGrid.get(cell.x + deltaX, cell.y + deltaY, cell.layer).isSet) {
            if (net.containsCell(layeredGrid.get(cell.x + deltaX, cell.y + deltaY, cell.layer)) === false) {
                setRecursively(layeredGrid.get(cell.x + deltaX, cell.y + deltaY, cell.layer), net);
            }
        }
    }

    function handleContact(cell, net) {
        if (layeredGrid.get(cell.x, cell.y, CONTACT).isSet) {
            cursors.forEach(function(_, layer) {
                if (!layeredGrid.get(cell.x, cell.y, layer).isSet) {
                    return;
                }
                if (net.containsCell(layeredGrid.get(cell.x, cell.y, layer)) === false) {
                    net.addCell(layeredGrid.get(cell.x, cell.y, layer));
                    setRecursively(layeredGrid.get(cell.x, cell.y, layer), net);
                }
            });
        }
    }

    // Check the cell for a transistor.
    if (checkTransistor(cell, NDIFF, nmos)) { return; }
    if (checkTransistor(cell, PDIFF, pmos)) { return; }

    // Add the cell to the net.
    net.addCell(cell);

    // If CONTACT is set, add add all layers to the net.
    handleContact(cell, net);

    // Check the cells above and below.
    if (cell.y > 0) { setAdjacent(0, -1); }
    if (cell.y < gridHeight - 1) { setAdjacent(0, 1); }

    // Check the cells to the left and right.
    if (cell.x > 0) { setAdjacent(-1, 0); }
    if (cell.x < gridWidth - 1) { setAdjacent(1, 0); }
}

function decorateContact(x, y) {
    'use strict';
    x = x + 1;
    y = y + 1;
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.moveTo(x * cellWidth + cellWidth + 1, y * cellHeight - 1);
    ctx.lineTo(x * cellWidth, y * cellHeight + cellHeight + 1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x * cellWidth + cellWidth + 2, y * cellHeight + cellHeight + 1);
    ctx.lineTo(x * cellWidth, y * cellHeight - 2);
    ctx.stroke();
}

function drawLabels() {
    'use strict';
    // Draw labels on the canvas above each input and output.
    ctx.font = "bold 18px Arial";
    ctx.fillStyle = darkMode ? "#ffffff" : "#000000";

    inputs.forEach(function(input, index) {
        ctx.fillText(String.fromCharCode(65 + index),
            cellWidth * (input.x + 1.5),
            cellHeight * (input.y + 0.75));
    });
    outputs.forEach(function(output, index) {
        ctx.fillText(String.fromCharCode(89 - index),
            cellWidth * (output.x + 1.5),
            cellHeight * (output.y + 0.75));
    });

    // Same for VDD and GND
    ctx.fillText("VDD", cellWidth * (vddCell.x + 1.5), cellHeight * (vddCell.y + 0.75));
    ctx.fillText("GND", cellWidth * (gndCell.x + 1.5), cellHeight * (gndCell.y + 0.75));
}

// Initialize everything
function refreshCanvas() {
    'use strict';
    resizeCanvas();

    // Draw the grid.
    drawGrid(gridWidth, gridHeight);

    // Check the layers of the grid, and draw cells as needed.
    function drawCell(i, j, layer) {
        if (layeredGrid.get(i, j, layer).isSet) {
            ctx.fillStyle = useFlatColors? cursors[layer].flatColor : cursors[layer].color;
            ctx.fillRect((i+1) * cellWidth, (j+1) * cellHeight - 1, cellWidth + 1, cellHeight + 2);
        }
    }

    // Draw each layer in order.
    let bounds = {
        left: 0,
        right: gridWidth - 1,
        top: 0,
        bottom: gridHeight - 1,
        lowLayer: 0,
        highLayer: cursors.length - 1,
    };

    layeredGrid.map(bounds, function (x, y, layer) {
        drawCell(x, y, layer);

        // For the last layer, fill each filled cell with a cross.
        if (layer === CONTACT) {
            if (layeredGrid.get(x, y, layer).isSet) {
                decorateContact(x, y);
            }
        }

        // Set the terminals of the cell to null.
        // TODO: Move this side-effect somewhere else.
        layeredGrid.get(x, y, NDIFF).term1 = null;
        layeredGrid.get(x, y, NDIFF).term2 = null;
        layeredGrid.get(x, y, NDIFF).gate  = null;

        layeredGrid.get(x, y, PDIFF).term1 = null;
        layeredGrid.get(x, y, PDIFF).term2 = null;
        layeredGrid.get(x, y, PDIFF).gate  = null;
    });

    // set the outer border of the canvas to the cursor color
    drawBorder();
    drawLabels();
}

// Save function to save the current state of the grid and the canvas.
// Increment save state so we can maintain an undo buffer.
function saveCurrentState() {
    'use strict';
    // Save both the grid and the drawing.
    localStorage.setItem('layeredGrid' + saveState, JSON.stringify(layeredGrid.grid));

    // Increment the save state.
    saveState++;

    // Delete all save states after the current one.
    for (let ii = saveState; ii < lastSaveState; ii++) {
        localStorage.removeItem('layeredGrid' + ii);
    }

    // Update the max save state.
    lastSaveState = saveState;

    // If we've reached the max save state, delete the oldest one.
    if (maxSaveState === saveState) {
        localStorage.removeItem('layeredGrid' + firstSaveState);

        firstSaveState++;
        maxSaveState++;
    }
}

// Undo by going back to the previous save state (if there is one) and redrawing the canvas.
function undo() {
    'use strict';
    if (saveState === lastSaveState) {
        saveCurrentState();
        saveState--;
    }
    if (saveState > firstSaveState) {
        saveState--;
        layeredGrid.grid = JSON.parse(localStorage.getItem('layeredGrid' + saveState));
    }
}

// Redo by going forward to the next save state (if there is one) and redrawing the canvas.
function redo() {
    'use strict';
    if (saveState < lastSaveState - 1) {
        saveState++;
        layeredGrid.grid = JSON.parse(localStorage.getItem('layeredGrid' + saveState));
    }
}

function clearIfPainted(clientX, clientY) {
    'use strict';

    // Set a variable to true if any of the layers are set.
    let anyLayerSet = false;

    // Ignore if not inside the canvas
    if (inBounds({ clientX: clientX, clientY: clientY, }, canvas)) {
        let x = Math.floor((clientX - canvas.offsetLeft - cellWidth) / cellWidth);
        let y = Math.floor((clientY - canvas.offsetTop - cellHeight) / cellHeight);

        // Erase all layers of the cell.
        cursors.forEach(function (_, layer) {
            if (layeredGrid.get(x, y, layer).isSet) {
                if (!anyLayerSet) { saveCurrentState(); }
                anyLayerSet = true;
                layeredGrid.clear(x, y, layer);
            }
        });
    }

    return anyLayerSet;
}

function getCell(clientX, clientY) {
    'use strict';
    // Ignore if not inside the canvas
    if (inBounds({ clientX: clientX, clientY: clientY, }, canvas)) {

        let x = Math.floor((clientX - canvas.offsetLeft - cellWidth) / cellWidth);
        let y = Math.floor((clientY - canvas.offsetTop - cellHeight) / cellHeight);
        return { x: x, y: y, };
    }
    return null;
}

// Table is a 2D array of single character strings.
function refreshTruthTable(table) {
    'use strict';
    // Create a table with the correct number of rows and columns.
    // The first row should be a header.
    let tableElement = document.getElementById("truth-table");
    tableElement.innerHTML = "";

    let header = tableElement.createTHead();
    let headerRow = header.insertRow(0);
    headerRow.className = "header";

    table[0].forEach(function (element, index) {
        let cell = headerRow.insertCell(index);
        cell.innerHTML = element;
        cell.className = index < inputs.length ? "input" : "output";
    });

    // Create the rest of the table.
    table.forEach(function (row, rowIndex) {
        if(rowIndex === 0) { return; }
        let tRow = tableElement.insertRow(rowIndex);

        row.forEach(function (cell, colIndex) {
            let tCell = tRow.insertCell(colIndex);
            tCell.innerHTML = cell;

            // Set the cell class depending on whether this is
            // an input or output cell.
            tCell.className = colIndex < inputs.length ? "input" : "output";
        });
    });
}

function inBounds(event) {
    'use strict';
    let x = event.clientX;
    let y = event.clientY;

    return x > canvas.offsetLeft + cellWidth &&
        x < canvas.offsetLeft + canvas.width - cellWidth &&
        y > canvas.offsetTop + cellHeight &&
        y < canvas.offsetTop + canvas.height - cellHeight;
}

function draw(bounds) {
    'use strict';
    if (Math.abs(bounds.endX - startX) > Math.abs(bounds.endY - startY)) {
        bounds.lowLayer = bounds.highLayer = cursorIndex;
        bounds.bottom = bounds.top = startY;
        layeredGrid.map(bounds, function (x, y, layer) {
            layeredGrid.set(x, y, layer);
        }, true);
    }
    // If the mouse moved more vertically than horizontally, draw a vertical line.
    else {
        bounds.lowLayer = bounds.highLayer = cursorIndex;
        bounds.right = bounds.left = startX;
        layeredGrid.map(bounds, function (x, y, layer) {
            layeredGrid.set(x, y, layer);
        }, true);
    }
}

function cellClickHandler(event) {
    'use strict';
    // Just fill in or delete the cell at the start coordinates.
    // If there is no cell at the start coordinates, change the cursor color.
    if (event.button === 0) {
        if (!layeredGrid.get(startX, startY, cursorIndex).isSet) { saveCurrentState(); }
        layeredGrid.set(startX, startY, cursorIndex);
    } else if(event.button === 2) {
        // If in the canvas and over a colored cell, erase it.
        // Otherwise, change the layer.
        if (!clearIfPainted(event.clientX, event.clientY)) {
            changeLayer();
        }
    }
}

// Note the grid coordinates when the left or right mouse button is released.
// If the left (or primary) button, use the start and end coordinates to make either a horizontal or vertical line.
// If the right (or secondary) button, use the same coordinates to delete a line of cells.
function canvasMouseUpHandler(event) {
    'use strict';
    if (event.button === 0 || event.button === 2) {
        // If not between cells 1 and gridsize - 1, undo and return.
        if (dragging && inBounds(event)) {
            let endX = Math.floor((event.clientX - canvas.offsetLeft - cellWidth) / cellWidth);
            let endY = Math.floor((event.clientY - canvas.offsetTop - cellHeight) / cellHeight);
            let bounds = {
                left: Math.min(startX, endX),
                right: Math.max(startX, endX),
                top: Math.min(startY, endY),
                bottom: Math.max(startY, endY),
                lowLayer: 0,
                highLayer: cursors.length - 1,
                endX: endX,
                endY: endY,
            };

            // For primary (i.e. left) mouse button:
            // If the mouse moved more horizontally than vertically, draw a horizontal line.
            if (event.button === 0) {
                draw(bounds);
            } else {
                // For secondary (i.e. right) mouse button:
                // Delete a rectangle of squares
                layeredGrid.map(bounds, function (x, y, layer) {
                    layeredGrid.clear(x, y, layer);
                });
            }
        } else if (inBounds(event)) {
            cellClickHandler(event);
        }
        // If the mouse was released outside the canvas, undo and return.
        else if (dragging) {
            undo();
        }
        else if(event.button === 2) {
            changeLayer();
        }
    }

    dragging = false;
}

// Show a preview line when the user is dragging the mouse.
function mousemoveHandler(event) {
    'use strict';

    function leftMouseMoveHandler(bounds) {
        // If the mouse moved more horizontally than vertically,
        // draw a horizontal line.
        if (bounds.right - bounds.left > bounds.bottom - bounds.top) {
            bounds.lowLayer = bounds.highLayer = cursorIndex;
            bounds.bottom = bounds.top = startY;
            layeredGrid.map(bounds, function (x, y, layer) {
                layeredGrid.set(x, y, layer);
            }, true);
        }
        // If the mouse moved more vertically than horizontally,
        // draw a vertical line.
        else {
            bounds.lowLayer = bounds.highLayer = cursorIndex;
            bounds.right = bounds.left = startX;
            layeredGrid.map(bounds, function (x, y, layer) {
                layeredGrid.set(x, y, layer);
            }, true);
        }
    }

    function rightMouseMoveHandler(bounds) {
        // Secondary mouse button (i.e. right click)
        // Highlight a rectangle of squares for deletion.
        bounds.lowLayer = bounds.highLayer = DELETE;
        layeredGrid.map(bounds, function (x, y, layer) {
            layeredGrid.set(x, y, layer);
        }, true);
    }

    // Save the current X and Y coordinates.
    currentX = event.clientX;
    currentY = event.clientY;
    let currentCell = getCell(currentX, currentY);

    // If the mouse is pressed and the mouse is between cells 1 and gridsize - 1,
    if (event.buttons === 1 || event.buttons === 2) {
        // Ignore if not inside the canvas
        if (inBounds(event)) {
            if (startX === -1 || startY === -1) {
                let temp = getCell(currentX, currentY);
                startX = temp.x;
                startY = temp.y;
            }


            if (!dragging) {
                // don't start dragging unless the mouse has moved outside the cell
                if(currentCell.x === startX && currentCell.y === startY) {
                    return;
                }
                dragging = true;
                saveCurrentState();
            } else {
                // Continuously refresh to update the preview line.
                undo();
                saveCurrentState();
            }

            let endX = Math.floor((event.clientX - canvas.offsetLeft - cellWidth) / cellWidth);
            let endY = Math.floor((event.clientY - canvas.offsetTop - cellHeight) / cellHeight);

            let bounds = {
                left: Math.min(startX, endX),
                right: Math.max(startX, endX),
                top: Math.min(startY, endY),
                bottom: Math.max(startY, endY),
            };

            // Primary mouse button (i.e. left click)
            if (event.buttons === 1) {
                leftMouseMoveHandler(bounds);
            } else {
                rightMouseMoveHandler(bounds);
            }
        }
    }
}

function placeTerminal(event, terminal) {
    'use strict';
    let cell = getCell(currentX, currentY);
    let oldX, oldY;

    if (cell !== null && !event.ctrlKey) {
        // First, note the current coordinates.
        oldX = terminal.x;
        oldY = terminal.y;
        // Then, set the new coordinates.
        terminal.x = cell.x;
        terminal.y = cell.y;
        // Set the CONTACT layer at the new coordinates.
        layeredGrid.set(cell.x, cell.y, CONTACT);
        // Unset the CONTACT layer at the old coordinates.
        layeredGrid.clear(oldX, oldY, CONTACT);
    }
}

function ctrlCommandHandler(event) {
    'use strict';
    if (event.keyCode === 90) {
        // z
        undo();
    } else if (event.keyCode === 89) {
        // y
        redo();
    }
}

function keydownHandler(event) {
    'use strict';
    let isInput  = (keyCode) => { return (keyCode >= 65) && (keyCode < 65 + inputs.length );    }; // Y, X, W, ...
    let isOutput = (keyCode) => { return (keyCode <= 89) && (keyCode > 89 - outputs.length);    }; // A, B, C, ...
    let isVDD    = (keyCode) => { return keyCode === 61 || keyCode === 187 || keyCode === 107;  }; // + key
    let isGND    = (keyCode) => { return keyCode === 173 || keyCode === 189 || keyCode === 109; }; // - key

    if      (event.ctrlKey)           { ctrlCommandHandler(event); }
    else if (isInput(event.keyCode))  { placeTerminal(event, inputs[event.keyCode - 65]); }
    else if (isOutput(event.keyCode)) { placeTerminal(event, outputs[89 - event.keyCode]); }
    else if (isVDD(event.keyCode))    { placeTerminal(event, vddCell); }
    else if (isGND(event.keyCode))    { placeTerminal(event, gndCell); }
}

function setDarkMode(setToDark) {
    'use strict';

    if (setToDark) {
        // Set to false so that toggleDarkMode() will set to true.
        darkMode = false;
        toggleDarkMode();
    } else {
        // Set to true so that toggleDarkMode() will set to false.
        darkMode = true;
        toggleDarkMode();
    }
}

function toggleDarkMode() {
    'use strict';
    let dd = document.getElementById("dashboard");
    let td = document.getElementById("truth-table");
    let id = document.getElementById("instructions");

    darkMode = !darkMode;

    if (darkMode) {
        document.body.classList.add('dark');
        document.body.classList.remove('light');

        dd.classList.add('dark-accent');
        td.classList.add('dark-accent');
        id.classList.add('dark-accent');
        dd.classList.remove('light-accent');
        td.classList.remove('light-accent');
        id.classList.remove('light-accent');
    } else {
        document.body.classList.add('light');
        document.body.classList.remove('dark');

        dd.classList.add('light-accent');
        td.classList.add('light-accent');
        id.classList.add('light-accent');
        dd.classList.remove('dark-accent');
        td.classList.remove('dark-accent');
        id.classList.remove('dark-accent');
    }
}

// Only change dark/light mode on keyup to avoid seizure-inducing flashes from holding down space.
function keyupHandler(event) {
    'use strict';
    // Toggle dark mode by pressing space
    if (event.keyCode === 32) {
        toggleDarkMode();
    }
    // Toggle useFlatColors by pressing 'f'
    if (event.keyCode === 70) {
        useFlatColors = !useFlatColors;
    }
}

// Don't show a context-menu when right-clicking
function contextmenuHandler(event) {
    'use strict';
    if (event.button === 2) {
        // Don't show a context menu.
        event.preventDefault();
    }
}

// Note the grid coordinates when the left mouse button is pressed.
// Store the m in startX and startY.
function canvasMouseDownHandler(event) {
    'use strict';
    if (event.button === 0 || event.button === 2) {
        // Return if not between cells 1 and gridsize - 1
        if (inBounds(event)) {
            startX = Math.floor((event.clientX - canvas.offsetLeft - cellWidth) / cellWidth);
            startY = Math.floor((event.clientY - canvas.offsetTop - cellHeight) / cellHeight);
        } else {
            startX = -1;
            startY = -1;
        }
    }
}

function setUpControls() {
    'use strict';
    let removeRowButton = document.getElementById("remove-row");
    let addRowButton = document.getElementById("add-row");
    let removeColumnButton = document.getElementById("remove-column");
    let addColumnButton = document.getElementById("add-column");

    removeRowButton.addEventListener("click", function() {
        gridHeight--;
        document.getElementById("row-count").innerHTML = gridHeight;
    });

    addRowButton.addEventListener("click", function() {
        gridHeight++;
        document.getElementById("row-count").innerHTML = gridHeight;
    });

    removeColumnButton.addEventListener("click", function() {
        gridWidth--;
        document.getElementById("column-count").innerHTML = gridWidth;
    });

    addColumnButton.addEventListener("click", function() {
        gridWidth++;
        document.getElementById("column-count").innerHTML = gridWidth;
    });
}

window.onload = function () {
    'use strict';
    // Clear local storage
    localStorage.clear();

    // Get the canvas div to attach listeners to.
    let canvasContainer = document.getElementById("canvas-container");

    // Set to dark mode if it is night time
    setDarkMode(new Date().getHours() > 19 || new Date().getHours() < 7);

    // Initialize with a gridsize of 29 and 5 layers
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");
    layeredGrid = new LayeredGrid(gridWidth, gridHeight, cursors.length);

    // Canvas mouse event listeners.
    canvasContainer.addEventListener("mousedown", canvasMouseDownHandler);
    canvasContainer.addEventListener("mouseup", canvasMouseUpHandler);
    canvasContainer.addEventListener("contextmenu", contextmenuHandler);

    // Some of these pertain the the canvas, but we don't know whether
    // it will be selected.
    window.addEventListener("keydown", keydownHandler);
    window.addEventListener("keyup", keyupHandler);
    window.addEventListener("mousemove", mousemoveHandler);

    // Set up the evaluate button.
    button = document.getElementById("generate-truth-table");
    button.onclick = function () {
        setNets();
        refreshTruthTable(buildTruthTable());
    };

    // Set up the instructions close button.
    button = document.getElementById("instructions-close");
    button.onclick = function () {
        let label  = document.getElementById("instructions-close-label");
        let div = document.getElementById("instructions");
        // Remove the 'open' class and replace with 'closed'.
        if(div.classList.contains('open')) {
            div.classList.remove('open');
            div.classList.add('closed');
            label.classList.remove('fa-chevron-left');
            label.classList.add('fa-chevron-right');
        } else {
            div.classList.remove('closed');
            div.classList.add('open');
            label.classList.remove('fa-chevron-right');
            label.classList.add('fa-chevron-left');
        }
    };

    // Set up the dashboard close button.
    button = document.getElementById("dashboard-close");
    button.onclick = function () {
        let label = document.getElementById("dashboard-close-label");
        let div = document.getElementById("dashboard");
        // Remove the 'open' class and replace with 'closed'.
        if(div.classList.contains('open')) {
            div.classList.remove('open');
            div.classList.add('closed');
            label.classList.remove('fa-chevron-right');
            label.classList.add('fa-chevron-left');
        } else {
            div.classList.remove('closed');
            div.classList.add('open');
            label.classList.remove('fa-chevron-left');
            label.classList.add('fa-chevron-right');
        }
    };

    // Set CONTACT at the coordinates of each input and output.
    inputs.forEach(function(input) {
        layeredGrid.set(input.x, input.y, CONTACT);
    });
    outputs.forEach(function(output) {
        layeredGrid.set(output.x, output.y, CONTACT);
    });

    // Set the CONTACT layer on the VDD and GND cells.
    layeredGrid.set(vddCell.x, vddCell.y, CONTACT);
    layeredGrid.set(gndCell.x, gndCell.y, CONTACT);

    setUpControls();

    refreshCanvas();
    // 60 fps
    setInterval(refreshCanvas, 16);

    if(window.runTestbench) {
        runTestbench();
    }
};