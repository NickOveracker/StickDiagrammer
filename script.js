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
 *      - Only the bitwise tag may be disabled, and only on a line-by-line basis.
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
        this.nodes.push(new Node(cell));
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
        this.isPmos = layeredGrid[cell.x][cell.y][PDIFF].isSet;
        this.isNmos = layeredGrid[cell.x][cell.y][NDIFF].isSet;
    }

    // Destructor
    destroy() {
        for(let ii = 0; ii < this.edges.length; ii++) {
            this.edges[ii].destroy();
        }
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

    addEdge(edge) {
        this.edges.push(edge);
    }

    removeEdge(edge) {
        let index = this.edges.indexOf(edge);
        if (index > -1) {
            this.edges.splice(index, 1);
        }
    }

    getName() {
        return this.cell.gate.getName();
    }
}

// Each edge is a connection between two graph nodes.
class Edge {
    constructor(node1, node2) {
        this.node1 = node1;
        this.node2 = node2;
        // Add the edge to the nodes.
        node1.addEdge(this);
        node2.addEdge(this);
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

    getName() {
        return this.name;
    }

    size() {
        return this.nodes.size;
    }
}

let layeredGrid;
let canvas;
let ctx;
let darkMode;
let cellHeight;
let cellWidth;
let gridsize = 29;
let firstSaveState = 0;
let saveState = 0;
let lastSaveState = 0;
let maxSaveState = 5;
let dragging = false;
let startX;
let startY;
let gridCanvas;
let currentX;
let currentY;
let button;
let nodeNodeMap = [];

// Cycle through the following cursor colors by pressing space: PDIFF, NDIFF, POLY, METAL1, CONTACT
// Additional colors: DELETE at index (numLayers + 0)
let cursorColors = ['rgba(148, 0, 211, 1)',     // pdiff
                    'rgba(50, 205, 50, 1)',     // ndiff
                    'rgba(255, 0, 0, 0.5)',     // poly
                    'rgba(0, 255, 255, 0.5)',   // metal1
                    'rgba(255, 0, 204, 0.5)',   // metal2
                    'rgba(204, 204, 204, 0.5)', // contact
                    'rgba(208, 160, 32, 0.5)',  // delete
                ];
let numLayers = cursorColors.length - 1;
let PDIFF   = 0;
let NDIFF   = PDIFF + 1;
let POLY    = NDIFF + 1;
let METAL1  = POLY + 1;
let METAL2  = METAL1 + 1;
let CONTACT = METAL2 + 1;
let DELETE  = numLayers;
let cursorNames = ['pdiff', 'ndiff', 'poly', 'metal1', 'metal2', 'contact', ];
let cursorColorIndex = METAL1;
let cursorColor = cursorColors[cursorColorIndex];

// Objects to represent the coordinates of the inputs (A, B, C, D, ...)
// and the output (Y, X, W, V, ...).
let A = { x: 2, y: 8, };
let B = { x: 2, y: 12, };
let C = { x: 2, y: 16, };
let D = { x: 2, y: 20, };
let Y = { x: 26, y: 14, };

let inputs = [A, B, C, D, ];
let outputs = [Y, ];

// Netlist is a list of nets.
// Each net is a Set of cells.
let netlist = [];
let graph;

// VDD and GND are the two terminals of the grid.
// The terminals are always at the top and bottom of the grid.
let vddCell = {x: 1, y: 1,};
let gndCell = {x: 1, y: gridsize - 2,};

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
        // We found it?
        if (node === targetNode) {
            return true;
        }

        // Prevent too much recursion.
        // If this is already being checked, it will be null.
        if (pathExists(node, targetNode) === null) {
            return null;
        }

        // Avoid infinite loops.
        if (pathExists(node, targetNode) !== undefined) {
            return pathExists(node, targetNode);
        }

        // Initialize to null.
        mapNodes(node, targetNode, null);

        // Only proceed if the input is activated.
        // Ignore in case of output or supply, since these don't have
        // gates to evaluate. Simply arriving at them means they are active.
        if (node.isTransistor()) {
            let evalResult = evaluate(node);
            if (evalResult === false) {
                let allNodes = graph.nodes;
                for(let qq = 0; qq < allNodes.length; qq++) {
                    if(allNodes[qq] === node) { continue; }
                    mapNodes(node, allNodes[qq], false);
                    executeTriggers(node, allNodes[qq]);
                }
                return false;
            } else if (evalResult === null) {
                registerTrigger(node, vddNode, node, targetNode);
                registerTrigger(node, gndNode, node, targetNode);
                mapNodes(node, targetNode, undefined);
                return null;
            }
        }

        // Recurse on all edges.
        let edges = node.edges;
        let hasNullPath = false;
        for (let ii = 0; ii < edges.length; ii++) {
            let otherNode = edges[ii].getOtherNode(node);
            let hasPath = pathExists(otherNode, targetNode);
            if (hasPath) {
                mapNodes(node, targetNode, true);
                mapNodes(node, edges[ii].getOtherNode(node), true);
                executeTriggers(node, targetNode);
                executeTriggers(node, edges[ii].getOtherNode(node));
                return true;
            }
            let result = computeOutputRecursive(otherNode, targetNode);
            if (result) {
                mapNodes(node, targetNode, true);
                mapNodes(node, edges[ii].getOtherNode(node), true);
                executeTriggers(node, targetNode);
                executeTriggers(node, edges[ii].getOtherNode(node));
                return true;
            }

            if(result === null || hasPath === null) {
                hasNullPath = true;
                registerTrigger(targetNode, edges[ii].getOtherNode(node), node, targetNode);
            }
        }

        // No findy :(
        if (hasNullPath) {
            //mapNodes(node, targetNode, undefined);
            return null;
        }
        mapNodes(node, targetNode, false);
        executeTriggers(node, targetNode);
        return false;
    }

    function evaluate(node) {
        let gateNet = node.cell.gate;

        if (gateNet.isInput) {
            /*jslint bitwise: true */
            let inputNum = node.getName().charCodeAt(0) - 65;

            // Pass-through positive for NMOS.
            let evalInput = !!((inputVals >> inputNum) & 1);
            return !(node.isNmos ^ evalInput);
            /*jslint bitwise: false */
        }

        // Otherwise, recurse and see if this is active.
        let gateNodeIterator = gateNet.nodes.values();
        let hasNullPath = false;

        for (let ii = 0; ii < gateNet.size(); ii++) {
            let gateNode = gateNodeIterator.next().value;
            let gateToGnd = pathExists(gateNode, gndNode);
            let gateToVdd = pathExists(gateNode, vddNode);

            if (gateToGnd === null || gateToVdd === null) {
                hasNullPath = true;
            }
            
            if(node.isPmos) {
                if (gateToGnd) {
                    return true;
                }
                gateToGnd = computeOutputRecursive(gateNode, gndNode);
                if (gateToGnd === null) {
                    hasNullPath = true;
                    registerTrigger(gateNode, gndNode, node, vddNode);
                    registerTrigger(gateNode, gndNode, node, gndNode);
                }
                if(gateToGnd) {
                    return true;
                }
            } else {
                if (gateToVdd) {
                    return true;
                }
                gateToVdd = computeOutputRecursive(gateNode, vddNode);
                if (gateToVdd === null) {
                    hasNullPath = true;
                    registerTrigger(gateNode, vddNode, node, vddNode);
                    registerTrigger(gateNode, vddNode, node, gndNode);
                }
                if(gateToVdd) {
                    return true;
                }
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
    for (let ii = 0; ii < graph.nodes.length(); ii++) {
        nodeNodeMap[ii] = [];
        nodeNodeMap[ii][ii] = true;
    }
    pmosOut = computeOutputRecursive(vddNode, outputNode) ? 1 : "Z";

    // Get nmos output.
    nodeNodeMap.length = 0;
    for (let ii = 0; ii < graph.nodes.length(); ii++) {
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
        let inputRow = [];
        for (let jj = 0; jj < inputVals[ii].length; jj++) {
            inputRow[jj] = inputVals[ii][inputVals[ii].length - 1 - jj];
        }
        table[ii + 1] = inputRow.concat(outputVals[ii]);
    }

    return table;
}

graph = new Graph();

// Draw the outer border of the canvas.
function drawBorder() {
    'use strict';
    ctx.strokeStyle = cursorColor;
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
    let startCell = Math.floor(gridsize / 2) - 4;
    ctx.fillRect(startCell * cellWidth, 0, cellWidth * 11, cellHeight);

    // Write the cursor color name in the middle of the upper border of the canvas.
    ctx.fillStyle = darkMode ? '#000000' : '#ffffff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(cursorNames[cursorColorIndex], canvas.width / 2, cellHeight * 3 / 4);
}

// Define a function to change the cursor color.
function changeLayer() {
    'use strict';
    // Don't use cursorColors.length, because there are non-layer colors as well.
    cursorColorIndex = (cursorColorIndex + 1) % numLayers;
    cursorColor = cursorColors[cursorColorIndex];

    // set the outer border of the canvas to the new cursor color
    drawBorder();
}

function makeLayeredGrid(width, height) {
    'use strict';
    // Each cell has several layers with parameter isSet.
    // Initialize every element to false.
    let grid = new Array(width);
    for (let ii = 0; ii < width; ii++) {
        grid[ii] = new Array(height);
        for (let jj = 0; jj < height; jj++) {
            grid[ii][jj] = new Array(cursorColors.length);
            for (let kk = 0; kk < cursorColors.length; kk++) {
                grid[ii][jj][kk] = { isSet: false, x: ii, y: jj, layer: kk, };
            }
        }
    }
    return grid;
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
function drawGrid(size) {
    'use strict';
    // Check if gridCanvas is defined.
    if (gridCanvas === undefined) {
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

    for (let ii = 0; ii < size + 2; ii++) {
        gridCtx.beginPath();
        gridCtx.moveTo(ii * cellWidth, 0);
        gridCtx.lineTo(ii * cellWidth, gridCanvas.height);
        gridCtx.stroke();
        gridCtx.beginPath();
        gridCtx.moveTo(0, ii * cellHeight);
        gridCtx.lineTo(gridCanvas.width, ii * cellHeight);
        gridCtx.stroke();
    }
}

// Map a function to every transistor terminal.
function loopThroughTransistors(funct) {
    'use strict';
    let terms = ["term1", "term2", "gate", ];
    let transistorLists = [nmos, pmos, ];

    for (let ii = 0; ii < transistorLists.length; ii++) {
        let iterator = transistorLists[ii].values();

        for (let transistor = iterator.next(); !transistor.done; transistor = iterator.next()) {
            let transistorCell = transistor.value;
            let transistorNode = graph.getNode(transistorCell);

            for (let jj = 0; jj < terms.length; jj++) {
                funct(transistorCell, transistorNode, terms[jj]);
            }
        }
    }
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
    for (let ii = 0; ii < inputNets.length; ii++) {
        netlist.push(inputNets[ii]);
    }
    for (let ii = 0; ii < outputNets.length; ii++) {
        netlist.push(outputNets[ii]);
    }
}

// Set the nets.
function setNets() {
    'use strict';
    clearCircuit();

    for (let ii = 0; ii < inputNets.length; ii++) { inputNets[ii].clear(); }
    for (let ii = 0; ii < outputNets.length; ii++) { outputNets[ii].clear(); }

    // Add rail nodes to the graph.
    vddNode = graph.addNode(layeredGrid[vddCell.x][vddCell.y][CONTACT]);
    gndNode = graph.addNode(layeredGrid[gndCell.x][gndCell.y][CONTACT]);
    vddNode.setAsSupply();
    gndNode.setAsSupply();

    netVDD.addNode(vddNode);
    netGND.addNode(gndNode);

    // Add the VDD and GND nets.
    // Loop through every VDD cell and add to the VDD net.
    setRecursively(layeredGrid[vddCell.x][vddCell.y][CONTACT], netVDD);

    // Loop through every GND cell and add to the GND net.
    setRecursively(layeredGrid[gndCell.x][gndCell.y][CONTACT], netGND);

    // Loop through the terminals and set their respective nets.
    for (let ii = 0; ii < numLayers; ii++) {
        for (let jj = 0; jj < inputNets.length; jj++) {
            if (layeredGrid[inputs[jj].x][inputs[jj].y][ii].isSet) {
                setRecursively(layeredGrid[inputs[jj].x][inputs[jj].y][ii], inputNets[jj]);
            }
        }
        for (let jj = 0; jj < outputNets.length; jj++) {
            if (layeredGrid[outputs[jj].x][outputs[jj].y][ii].isSet) {
                setRecursively(layeredGrid[outputs[jj].x][outputs[jj].y][ii], outputNets[jj]);
            }
        }
    }

    resetNetlist();

    // Add output nodes to the graph.
    outputNodes.length = 0;
    for (let ii = 0; ii < outputs.length; ii++) {
        outputNodes[ii] = graph.addNode(layeredGrid[outputs[ii].x][outputs[ii].y][CONTACT]);
        outputNets[ii].addNode(outputNodes[ii]);
    }

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
        for (let ii = 0; ii < outputs.length; ii++) {
            if (net === outputNets[ii]) {
                transistor.addEdge(outputNodes[ii]);
            }
        }

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
        for (let ii = 0; ii < inputNets.length; ii++) {
            if (inputNets[ii] === net1) {
                let temp = nodeIterator1;
                nodeIterator1 = nodeIterator2;
                nodeIterator2 = temp;
                temp = net1;
                net1 = net2;
                net2 = temp;
                break;
            }
        }

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
            if (layeredGrid[x][y][layer].isSet) {
                if (cell.term1 === undefined) {
                    cell.term1 = layeredGrid[x][y][layer];
                } else {
                    cell.term2 = layeredGrid[x][y][layer];
                }
            }
        }

        // If the layer is NDIFF or PDIFF and there is also a POLY at the same location,
        // add the cell to transistors.
        if (cell.layer === layer && cell.isSet) {
            if (layeredGrid[cell.x][cell.y][POLY].isSet && !layeredGrid[cell.x][cell.y][CONTACT].isSet) {
                transistorArray.add(cell);
                graph.addNode(cell);
                // Set the gate to the poly cell.
                cell.gate = layeredGrid[cell.x][cell.y][POLY];

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
        if (net.containsCell(layeredGrid[cell.x][cell.y][cell.layer]) && layeredGrid[cell.x + deltaX][cell.y + deltaY][cell.layer].isSet) {
            if (net.containsCell(layeredGrid[cell.x + deltaX][cell.y + deltaY][cell.layer]) === false) {
                setRecursively(layeredGrid[cell.x + deltaX][cell.y + deltaY][cell.layer], net);
            }
        }
    }

    function handleContact(cell, net) {
        if (layeredGrid[cell.x][cell.y][CONTACT].isSet) {
            for (let ii = 0; ii < numLayers; ii++) {
                if (!layeredGrid[cell.x][cell.y][ii].isSet) { continue; }
                if (net.containsCell(layeredGrid[cell.x][cell.y][ii]) === false) {
                    net.addCell(layeredGrid[cell.x][cell.y][ii]);
                    setRecursively(layeredGrid[cell.x][cell.y][ii], net);
                }
            }
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
    if (cell.y < gridsize - 1) { setAdjacent(0, 1); }

    // Check the cells to the left and right.
    if (cell.x > 0) { setAdjacent(-1, 0); }
    if (cell.x < gridsize - 1) { setAdjacent(1, 0); }
}

function decorateContact(x, y) {
    'use strict';
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
    for (let ii = 0; ii < inputs.length; ii++) {
        ctx.fillText(String.fromCharCode(65 + ii),
            cellWidth * (inputs[ii].x + 1.5),
            cellHeight * (inputs[ii].y + 0.75));
    }
    for (let ii = 0; ii < outputs.length; ii++) {
        ctx.fillText(String.fromCharCode(89 - ii),
            cellWidth * (outputs[ii].x + 1.5),
            cellHeight * (outputs[ii].y + 0.75));
    }

    // Same for VDD and GND
    ctx.fillText("VDD", cellWidth * (vddCell.x + 1.5), cellHeight * (vddCell.y + 0.75));
    ctx.fillText("GND", cellWidth * (gndCell.x + 1.5), cellHeight * (gndCell.y + 0.75));
}

// Initialize everything
function refreshCanvas() {
    'use strict';
    resizeCanvas();

    // Draw the grid.
    drawGrid(gridsize);

    // Check the layers of the grid, and draw cells as needed.
    function drawCell(i, j, layer, isBorder) {
        if (isBorder || layeredGrid[i - 1][j - 1][layer].isSet) {
            ctx.fillStyle = cursorColors[layer];
            ctx.fillRect(i * cellWidth, j * cellHeight - 1, cellWidth + 1, cellHeight + 2);
        }
    }

    // Draw CONTACT at the coordinates of each input and output.
    for (let ii = 0; ii < inputs.length; ii++) {
        layeredGrid[inputs[ii].x][inputs[ii].y][CONTACT].isSet = true;
    }
    for (let ii = 0; ii < outputs.length; ii++) {
        layeredGrid[outputs[ii].x][outputs[ii].y][CONTACT].isSet = true;
    }

    // Set the CONTACT layer on the VDD and GND cells.
    layeredGrid[vddCell.x][vddCell.y][CONTACT].isSet = true;
    layeredGrid[gndCell.x][gndCell.y][CONTACT].isSet = true;

    // Draw each layer in order.
    let bounds = {
        left: 1,
        right: gridsize,
        top: 1,
        bottom: gridsize,
        lowLayer: 0,
        highLayer: cursorColors.length - 1,
    };

    mapFuncToGrid(bounds, function (x, y, layer) {
        drawCell(x, y, layer, false);

        // For the last layer, fill each filled cell with a cross.
        if (layer === CONTACT) {
            if (layeredGrid[x - 1][y - 1][layer].isSet) {
                decorateContact(x, y);
            }
        }

        // Set the terminals of the cell to null.
        layeredGrid[x - 1][y - 1][NDIFF].term1 = null;
        layeredGrid[x - 1][y - 1][NDIFF].term2 = null;
        layeredGrid[x - 1][y - 1][NDIFF].gate  = null;

        layeredGrid[x - 1][y - 1][PDIFF].term1 = null;
        layeredGrid[x - 1][y - 1][PDIFF].term2 = null;
        layeredGrid[x - 1][y - 1][PDIFF].gate  = null;
    });

    // Set dark mode as needed.
    if (darkMode) {
        document.body.style.backgroundColor = 'black';
    } else {
        document.body.style.backgroundColor = 'white';
    }

    // set the outer border of the canvas to the cursor color
    drawBorder();

    drawLabels();

    drawGrid(gridsize); // Not sure why but gotta draw this twice.
}

// Save function to save the current state of the grid and the canvas.
// Increment save state so we can maintain an undo buffer.
function saveCurrentState() {
    'use strict';
    // Save both the grid and the drawing.
    localStorage.setItem('layeredGrid' + saveState, JSON.stringify(layeredGrid));
    localStorage.setItem('canvas' + saveState, canvas.toDataURL());

    // Increment the save state.
    saveState++;

    // Delete all save states after the current one.
    for (let ii = saveState; ii < lastSaveState; ii++) {
        localStorage.removeItem('layeredGrid' + ii);
        localStorage.removeItem('canvas' + ii);
    }

    // Update the max save state.
    lastSaveState = saveState;

    // If we've reached the max save state, delete the oldest one.
    if (maxSaveState === saveState) {
        localStorage.removeItem('layeredGrid' + firstSaveState);
        localStorage.removeItem('canvas' + firstSaveState);

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
        layeredGrid = JSON.parse(localStorage.getItem('layeredGrid' + saveState));
        let img = new Image();
        img.src = localStorage.getItem('canvas' + saveState);
        img.onload = function () {
            ctx.drawImage(img, 0, 0);
        };

        refreshCanvas();
    }
}

// Redo by going forward to the next save state (if there is one) and redrawing the canvas.
function redo() {
    'use strict';
    if (saveState < lastSaveState - 1) {
        saveState++;
        layeredGrid = JSON.parse(localStorage.getItem('layeredGrid' + saveState));
        let img = new Image();
        img.src = localStorage.getItem('canvas' + saveState);
        img.onload = function () {
            ctx.drawImage(img, 0, 0);
        };

        refreshCanvas();
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
        for (let ii = 0; ii < cursorColors.length; ii++) {
            if (layeredGrid[x][y][ii].isSet) {
                if (!anyLayerSet) { saveCurrentState(); }
                anyLayerSet = true;
                layeredGrid[x][y][ii].isSet = false;
            }
        }
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
    for (let ii = 0; ii < table[0].length; ii++) {
        let cell = headerRow.insertCell(ii);
        headerRow.className = "header";
        cell.innerHTML = table[0][ii];

        // Set the cell class depending on whether this is
        // an input or output cell.
        cell.className = ii < inputs.length ? "input" : "output";
    }

    // Create the rest of the table.
    for (let ii = 1; ii < table.length; ii++) {
        let row = tableElement.insertRow(ii);
        for (let jj = 0; jj < table[ii].length; jj++) {
            let cell = row.insertCell(jj);
            cell.innerHTML = table[ii][jj];

            // Set the cell class depending on whether this is
            // an input or output cell.
            cell.className = jj < inputs.length ? "input" : "output";
        }
    }
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

function refreshDashboard() {
    'use strict';
    let dd = document.getElementById("dashboard");
    let td = document.getElementById("truth-table");
    let id = document.getElementById("instructions");
    dd.style.backgroundColor = darkMode ? "#333" : "#eee";
    dd.style.color = darkMode ? "#eee" : "#333";
    td.style.backgroundColor = dd.style.backgroundColor;
    td.style.color = dd.style.color;
    id.style.backgroundColor = dd.style.backgroundColor;
    id.style.color = dd.style.color;
}

function mapFuncToGrid(bounds, func) {
    'use strict';
    // Layers should be the outer loop to ensure that lower layers are drawn first.
    for (let layer = bounds.lowLayer; layer <= bounds.highLayer; layer++) {
        for (let x = bounds.left; x <= bounds.right; x++) {
            for (let y = bounds.top; y <= bounds.bottom; y++) {
                func(x, y, layer);
            }
        }
    }
}

function draw(bounds) {
    'use strict';
    if (Math.abs(bounds.endX - startX) > Math.abs(bounds.endY - startY)) {
        bounds.lowLayer = bounds.highLayer = cursorColorIndex;
        bounds.bottom = bounds.top = startY;
        mapFuncToGrid(bounds, function (x, y, layer) {
            layeredGrid[x][y][layer].isSet = true;
            // don't allow ndiff and pdiff on the same cell
            if(layer === PDIFF) {
                // Unset the ndiff layer
                layeredGrid[x][y][NDIFF].isSet = false;
            } else if(layer === NDIFF) {
                // Unset the pdiff layer
                layeredGrid[x][y][PDIFF].isSet = false;
            }
        });
    }
    // If the mouse moved more vertically than horizontally, draw a vertical line.
    else {
        bounds.lowLayer = bounds.highLayer = cursorColorIndex;
        bounds.right = bounds.left = startX;
        mapFuncToGrid(bounds, function (x, y, layer) { layeredGrid[x][y][layer].isSet = true; });
    }
}

function cellClickHandler(event) {
    'use strict';
    // Just fill in or delete the cell at the start coordinates.
    // If there is no cell at the start coordinates, change the cursor color.
    if (event.button === 0) {
        if (!layeredGrid[startX][startY][cursorColorIndex].isSet) { saveCurrentState(); }
        layeredGrid[startX][startY][cursorColorIndex].isSet = true;
    } else {
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
function mouseupHandler(event) {
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
                highLayer: cursorColors.length - 1,
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
                mapFuncToGrid(bounds, function (x, y, layer) { layeredGrid[x][y][layer].isSet = false; });
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
    refreshCanvas();
}

// Show a preview line when the user is dragging the mouse.
function mousemoveHandler(event) {
    'use strict';

    function leftMouseMoveHandler(bounds) {
        // If the mouse moved more horizontally than vertically,
        // draw a horizontal line.
        if (bounds.right - bounds.left > bounds.bottom - bounds.top) {
            bounds.lowLayer = bounds.highLayer = cursorColorIndex;
            bounds.bottom = bounds.top = startY;
            mapFuncToGrid(bounds, function (x, y, layer) { layeredGrid[x][y][layer].isSet = true; });
        }
        // If the mouse moved more vertically than horizontally,
        // draw a vertical line.
        else {
            bounds.lowLayer = bounds.highLayer = cursorColorIndex;
            bounds.right = bounds.left = startX;
            mapFuncToGrid(bounds, function (x, y, layer) { layeredGrid[x][y][layer].isSet = true; });
        }
    }

    function rightMouseMoveHandler(bounds) {
        // Secondary mouse button (i.e. right click)
        // Highlight a rectangle of squares for deletion.
        bounds.lowLayer = bounds.highLayer = DELETE;
        mapFuncToGrid(bounds, function (x, y, layer) { layeredGrid[x][y][layer].isSet = true; });
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
            refreshCanvas();
        }
    }
}

function placeInput(event) {
    'use strict';
    let cell = getCell(currentX, currentY);
    if (cell !== null && !event.ctrlKey) {
        // First, unset the CONTACT layer at the old coordinates.
        layeredGrid[inputs[event.keyCode - 65].x][inputs[event.keyCode - 65].y][CONTACT].isSet = false;
        // Then, set the new coordinates.
        inputs[event.keyCode - 65].x = cell.x;
        inputs[event.keyCode - 65].y = cell.y;
    }
}

function placeOutput(event) {
    'use strict';
    // Skip if CTRL is pressed.
    let cell = getCell(currentX, currentY);
    if (cell !== null && !event.ctrlKey) {
        // First, unset the CONTACT layer at the old coordinates.
        layeredGrid[outputs[89 - event.keyCode].x][outputs[89 - event.keyCode].y][CONTACT].isSet = false;
        // Then, set the new coordinates.
        outputs[89 - event.keyCode].x = cell.x;
        outputs[89 - event.keyCode].y = cell.y;
    }
}

function placeIO(event) {
    'use strict';
    // Input terminal key listeners.
    if ((event.keyCode >= 65) && (event.keyCode < 65 + inputs.length)) {
        placeInput(event);
    }

    // Output terminal key listeners.
    if ((event.keyCode <= 89) && (event.keyCode > 89 - outputs.length)) {
        placeOutput(event);
    }
}

function placeVDD() {
    'use strict';
    let cell = getCell(currentX, currentY);
    if (cell !== null) {
        // First, unset the CONTACT layer at the old coordinates.
        layeredGrid[vddCell.x][vddCell.y][CONTACT].isSet = false;
        // Then, set the new coordinates.
        vddCell.x = cell.x;
        vddCell.y = cell.y;
    }
}

function placeGND() {
    'use strict';
    let cell = getCell(currentX, currentY);
    if (cell !== null) {
        // First, unset the CONTACT layer at the old coordinates.
        layeredGrid[gndCell.x][gndCell.y][CONTACT].isSet = false;
        // Then, set the new coordinates.
        gndCell.x = cell.x;
        gndCell.y = cell.y;
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
    if(event.ctrlKey) {
        ctrlCommandHandler(event);
    } else if(event.keyCode >= 65 && event.keyCode <= 90) {
        placeIO(event);
    } else if (event.keyCode === 61 || event.keyCode === 187 || event.keyCode === 107) {
        // '+' key listener.
        placeVDD();
    } else if (event.keyCode === 173 || event.keyCode === 189 || event.keyCode === 109) {
        // '-' key listener.
        placeGND();
    }

    refreshCanvas();
}

function toggleDarkMode() {
    'use strict';
    darkMode = !darkMode;
    refreshDashboard();
    refreshCanvas();
}

// Only change dark/light mode on keyup to avoid seizure-inducing flashes from holding down space.
function keyupHandler(event) {
    'use strict';
    // Toggle dark mode by pressing space
    if (event.keyCode === 32) {
        toggleDarkMode();
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
function mousedownHandler(event) {
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

window.onload = function () {
    'use strict';
    // Clear local storage
    localStorage.clear();

    // Set to dark mode if it is night time
    if (new Date().getHours() > 19 || new Date().getHours() < 7) {
        darkMode = true;
    } else {
        darkMode = false;
    }

    // Initialize with a gridsize of 29 and 5 layers
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");
    layeredGrid = makeLayeredGrid(gridsize, gridsize);

    refreshDashboard();

    window.addEventListener("mousedown", mousedownHandler);
    window.addEventListener("mouseup", mouseupHandler);
    window.addEventListener("mousemove", mousemoveHandler);
    window.addEventListener("contextmenu", contextmenuHandler);
    window.addEventListener("keydown", keydownHandler);
    window.addEventListener("keyup", keyupHandler);

    // Set up the evaluate button.
    button = document.getElementById("generate-truth-table");
    button.onclick = function () {
        setNets();
        refreshTruthTable(buildTruthTable());
    };

    // Set up the instructions close button.
    button = document.getElementById("toggle-instructions");
    button.onclick = function () {
        let button = document.getElementById("toggle-instructions");
        let div = document.getElementById("instructions");
        if(div.style.left !== "-270px") {
            div.style.left = "-270px";
            button.innerHTML = "》";
        } else {
            div.style.left = "0px";
            button.innerHTML = "《";
        }
    };

    // Set up the dashboard close button.
    button = document.getElementById("toggle-dashboard");
    button.onclick = function () {
		let button = document.getElementById("toggle-dashboard");
        let div = document.getElementById("dashboard");
        if(div.style.right !== "-270px") {
            div.style.right = "-270px";
            button.innerHTML = "《";
        } else {
            div.style.right = "0px";
            button.innerHTML = "》";
        }
    };

    refreshCanvas();
    setInterval(refreshCanvas, 500);

    if(window.runTestbench) {
        runTestbench();
    }
};