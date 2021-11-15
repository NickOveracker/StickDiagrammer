// Graph class to represent CMOS circuitry.
class Graph {
    constructor() {
        this.nodes = [];
        this.edges = [];
    }

    // Clear the graph.
    clear() {
        // Destroy all nodes.
        for(let ii = 0; ii < this.nodes.length; ii++) {
            this.nodes[ii].destroy();
        }

        // Destroy all edges.
        for(let ii = 0; ii < this.edges.length; ii++) {
            this.edges[ii].destroy();
        }

        this.nodes.length = 0;
        this.edges.length = 0;
    }

    // Check if two nodes are connected.
    isConnected(node1, node2) {
        let edges = node1.getEdges();
        for (let i = 0; i < edges.length; i++) {
            if (edges[i].getNode2() == node2 || edges[i].getNode1() == node2) {
                return true;
            }
        }
        return false;
    }

    // Add a node to the graph.
    addNode(cell) {
        let node = new Node(cell);
        this.nodes.push(node);
        return node;
    }

    // Add an edge to the graph.
    addEdge(node1, node2) {
        if(!this.isConnected(node1, node2)) {
            let edge = new Edge(node1, node2);
            this.edges.push(edge);
        }
    }

    // Return the node with the given cell.
    getNode(cell) {
        for (let node of this.nodes) {
            if (node.getCell() === cell) {
                return node;
            }
        }
        return null;
    }

    // Return the number of nodes in the graph.
    getNumNodes() {
        return this.nodes.length;
    }

    getIndexByNode(node) {
        for (let i = 0; i < this.nodes.length; i++) {
            if (this.nodes[i] === node) {
                return i;
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
        this.isSupply = false;
    }

    // Destructor
    destroy() {
        this.cell = null;
        this.edges = null;
    }

    isTransistor() {
        return this.isPmos || this.isNmos;
    }

    setAsSupply() {
        this.isSupply = true;
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

    getEdges() {
        return this.edges;
    }

    getCell() {
        return this.cell;
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
        this.node1 = null;
        this.node2 = null;
    }

    getNode1() {
        return this.node1;
    }

    getNode2() {
        return this.node2;
    }

    getOtherNode(node) {
        if (this.node1 == node) {
            return this.node2;
        } else if (this.node2 == node) {
            return this.node1;
        } else {
            return null;
        }
    }
}

// Set of cells that are electrically connected to one another.
class Net {
    constructor(name, isSupply, isInput, isOutput) {
        this.name = name;
        this.cells = new Set();
        this.nodes = new Set();
        this.isSupply = isSupply;
        this.isInput = isInput;
        this.isOutput = isOutput;
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

    getNodes() {
        return this.nodes;
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

    getCells() {
        return this.cells;
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
let layers = 5;
let firstSaveState = 0;
let saveState = 0;
let lastSaveState = 0;
let maxSaveState = 15;
let dragging = false;
let startX;
let startY;
let gridCanvas;
let currentX;
let currentY;
let button;

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
let numInputs = 4; // Doesn't include VDD and GND.
let numOutputs = 1;

let A = {x: 2, y: 8};
let B = {x: 2, y: 12};
let C = {x: 2, y: 16};
let D = {x: 2, y: 20};
let Y = {x: 26, y: 14};

let inputs = [A, B, C, D];
let outputs  = [Y];

// Netlist is a list of nets.
// Each net is a Set of cells.
let netlist = [];
let output;
let graph;

// VDD and GND are the two terminals of the grid.
// The terminals are always at the top and bottom of the grid.
let VDD_y = 1;
let GND_y = gridsize - 2;
let railStartX = 1;
let railEndX = gridsize - 1;

// Nodes
let vddNode;
let gndNode;
let outputNodes = [];

let nmos = new Set();
let pmos = new Set();

// Grid color
let darkModeGridColor = '#cccccc';
let lightModeGridColor = '#999999';

let netVDD = new Net("VDD", true, false, false);
let netGND = new Net("GND", true, false, false);
let netA = new Net("A", false, true, false);
let netB = new Net("B", false, true, false);
let netC = new Net("C", false, true, false);
let netD = new Net("D", false, true, false);
let netY = new Net("Y", false, false, true);

let inputNets = [netA, netB, netC, netD];
let outputNets = [netY];

function computeOutput(inputVals, outputNode) {
    let pmosOut;
    let nmosOut;
    let out;
    let firstLevel;
    nodeNodeMap = [];

    for(let ii = 0; ii < graph.getNumNodes(); ii++) {
        nodeNodeMap[ii] = [];
        nodeNodeMap[ii][ii] = true;
    }

    function mapNodes(node1, node2, isPath) {
        if(pathExists(node1, node2) !== undefined && pathExists(node2, node1) !== null) {
            return;
        }

        nodeNodeMap[graph.getIndexByNode(node1)][graph.getIndexByNode(node2)] = isPath;
        nodeNodeMap[graph.getIndexByNode(node2)][graph.getIndexByNode(node1)] = isPath;

        if(isPath === null) return;

        // Map the path to node2 as false for all nodes mapped to node1.
        for(let ii = 0; ii < nodeNodeMap.length; ii++) {
            if(nodeNodeMap[ii][graph.getIndexByNode(node1)] === true) {
                nodeNodeMap[ii][graph.getIndexByNode(node2)] = isPath;
                nodeNodeMap[graph.getIndexByNode(node2)][ii] = isPath;
            }
        }
        // Now do the inverse.
        for(let ii = 0; ii < nodeNodeMap.length; ii++) {
            if(nodeNodeMap[ii][graph.getIndexByNode(node2)] === true) {
                nodeNodeMap[ii][graph.getIndexByNode(node1)] = isPath;
                nodeNodeMap[graph.getIndexByNode(node1)][ii] = isPath;
            }
        }
    }

    function pathExists(node1, node2) {
        return nodeNodeMap[graph.getIndexByNode(node1)][graph.getIndexByNode(node2)];
    }

    function computeOutputRecursive(node, targetNode) {
        // We found it?
        if(node === targetNode) {
            return true;
        }

        // Prevent too much recursion.
        // If this is already being checked, it will be null.
        if(pathExists(node, targetNode) === null) {
            return false;
        }

        // Avoid infinite loops.
        if(pathExists(node, targetNode) !== undefined) {
            return pathExists(node, targetNode);
        }

        // Initialize to null.
        mapNodes(node, targetNode, null);

        // Only proceed if the input is activated.
        // Ignore in case of output or supply, since these don't have
        // gates to evaluate. Simply arriving at them means they are active.
        if(node.isTransistor()) {
            if(!evaluate(node)) {
                mapNodes(node, targetNode, false);
                return false;
            }
        }

        // Return if this is not the first level and the node is vddNode or gndNode.
        // The rail nodes won't play nice with the rest of this.
        if(!firstLevel && node.isSupply) {
            return false;
        }

        firstLevel = false;

        // Recurse on all edges.
        let edges = node.getEdges();
        for(let ii = 0; ii < edges.length; ii++) {
            if(pathExists(edges[ii].getOtherNode(node), targetNode)) {
                mapNodes(node, targetNode, true);
                mapNodes(node, edges[ii].getOtherNode(node), true);
                return true;
            }
            if(computeOutputRecursive(edges[ii].getOtherNode(node), targetNode)) {
                mapNodes(node, targetNode, true);
                mapNodes(node, edges[ii].getOtherNode(node), true);
                return true;
            }
        }

        // No findy :(
        mapNodes(node, targetNode, false);
        return false;
    }

    function evaluate(node) {
        let gateNet = node.getCell().gate;
    
        if(gateNet.isInput) {
            let inputNum = node.getName().charCodeAt(0) - 65;
            let evalInput = !!((inputVals >> inputNum) & 1);
            // Pass-through positive for NMOS.
            if(node.isNmos) {
                return evalInput;
            }
            else {
                return !evalInput;
            }
        }
    
        // Otherwise, recurse and see if this is active.
        let gateNodeIterator = gateNet.getNodes().values();

        for(let ii = 0; ii < gateNet.size(); ii++) {
            let gateNode = gateNodeIterator.next().value;

            if(node.isPmos && (pathExists(gateNode, gndNode) || computeOutputRecursive(gateNode, gndNode))) {
                return true;
            } else {
                if(!node.isPmos && (pathExists(gateNode, vddNode) || computeOutputRecursive(gateNode, vddNode))) {
                    return true;
                }
            }
        }

        return false;
    }

    // Get pmos output.
    firstLevel = true;
    pmosOut = computeOutputRecursive(vddNode, outputNode) ? 1 : "Z";

    // Get nmos output.
    firstLevel = true;
    nmosOut = computeOutputRecursive(gndNode, outputNode) ? 0 : "Z";

    // Reconcile.
    if(pmosOut === "Z") {
        out = nmosOut;
    } else if(nmosOut === "Z") {
        out = pmosOut;
    } else {
        out = "X";
    }

    return out;
}

// Generate an output table.
// Each row evaluates to 1, 0, Z, or X
// 1 is VDD, 0 is GND.
// Z is high impedance, X is error (VDD and GND contradiction.)
function buildTruthTable() {
    let header = [];
    let inputVals = [];
    let outputVals = [];

    // Each loop iteration is a combination of input values.
    // I.e., one row of the output table.
    for(let ii = 0; ii < Math.pow(2, numInputs); ii++) {
        let tableInputRow = [];
        let tableOutputRow = [];

        // Compute each output.
        for(let jj = 0; jj < numOutputs; jj++) {
            tableOutputRow[jj] = computeOutput(ii, outputNodes[jj]);
        }

        outputVals[ii] = tableOutputRow;

        for(let jj = 0; jj < numInputs; jj++) {
            tableInputRow[jj] = (ii >> jj) & 1;
        }

        inputVals[ii] = tableInputRow;
    }

    let outstr = "";

    // Header
    for(let jj = inputVals[0].length - 1; jj >= 0; jj--) {
        outstr += String.fromCharCode(65 + jj) + " ";
        header[inputVals[0].length - 1 - jj] = String.fromCharCode(65 + jj);
    }
    outstr += " |";
    for(let jj = 0; jj < outputVals[0].length; jj++) {
        outstr += " " + String.fromCharCode(89 - jj);
    }
    outstr += "\n";
    for(let jj = 0; jj <= inputVals[0].length + outputVals[0].length; jj++) {
        outstr += "--";
    }
    outstr += "\n";

    // Contents
    for(let ii = 0; ii < inputVals.length; ii++) {
        for(let jj = inputVals[ii].length - 1; jj >= 0; jj--) {
            outstr += inputVals[ii][jj] + " ";
        }
        outstr += " |";
        for(let jj = 0; jj < outputVals[ii].length; jj++) {
            outstr += " " + outputVals[ii][jj];
        }
        outstr += "\n";
    }

    // Merge input and output into one table (input on the left, output on the right.)
    let table = [];
    table[0] = header;
    table[0][header.length] = "Y";
    for(let ii = 0; ii < inputVals.length; ii++) {
        // Reverse the input row.
        let inputRow = [];
        for(let jj = 0; jj < inputVals[ii].length; jj++) {
            inputRow[jj] = inputVals[ii][inputVals[ii].length - 1 - jj];
        }
        table[ii+1] = inputRow.concat(outputVals[ii]);
    }

    return table;
}

graph = new Graph()

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
    // Create a graph object.
    graph.clear();

    // Clear the netlist.
    netlist.length = 0;

    // Clear the net sets.
    netVDD.clear();
    netGND.clear();
    nmos.clear();
    pmos.clear();
    for(let ii = 0; ii < inputNets.length; ii++)  { inputNets[ii].clear(); }
    for(let ii = 0; ii < outputNets.length; ii++) { outputNets[ii].clear(); }

    // Add the VDD and GND nets.
    // Loop through every VDD cell and add to the VDD net.
    setRecursively(layeredGrid[railStartX][VDD_y][METAL1], netVDD);
    netlist.push(netVDD);

    // Loop through every GND cell and add to the GND net.
    setRecursively(layeredGrid[railStartX][GND_y][METAL1], netGND);
    netlist.push(netGND);
    
    // Loop through the terminals and set their respective nets.
    for(let ii = 0; ii < layers; ii++) {
        for(let jj = 0; jj < inputNets.length; jj++) {
            if(layeredGrid[inputs[jj].x][inputs[jj].y][ii].isSet) { 
                setRecursively(layeredGrid[inputs[jj].x][inputs[jj].y][ii], inputNets[jj]);
            }
        }
        for(let jj = 0; jj < outputNets.length; jj++) {
            if(layeredGrid[outputs[jj].x][outputs[jj].y][ii].isSet) {
                setRecursively(layeredGrid[outputs[jj].x][outputs[jj].y][ii], outputNets[jj]);
            }
        }
    }
    for(let ii = 0; ii < inputNets.length; ii++) {
        netlist.push(inputNets[ii]);
    }
    for(let ii = 0; ii < outputNets.length; ii++) {
        netlist.push(outputNets[ii]);
    }

    // Add rail nodes to the graph.
    vddNode = graph.addNode(layeredGrid[railStartX][VDD_y][METAL1]);
    gndNode = graph.addNode(layeredGrid[railStartX][GND_y][METAL1]);
    vddNode.setAsSupply();
    gndNode.setAsSupply();

    netVDD.addNode(vddNode);
    netGND.addNode(gndNode);

    // Add output nodes to the graph.
    outputNodes.length = 0;
    for(let ii = 0; ii < outputs.length; ii++) {
        outputNodes[ii] = graph.addNode(layeredGrid[outputs[ii].x][outputs[ii].y][CONTACT]);
        outputNets[ii].addNode(outputNodes[ii]);
    }

    // Map a function to every transistor terminal.
    function loopThroughTransistors(funct) {
        let terms = ["term1", "term2", "gate"];
        let transistorLists = [nmos, pmos];

        for(let ii = 0; ii < transistorLists.length; ii++) {
            let iterator = transistorLists[ii].values();

            for(let transistor = iterator.next(); !transistor.done; transistor = iterator.next()) {
                let transistorCell = transistor.value;
                let transistorNode = graph.getNode(transistorCell);

                for(let jj = 0; jj < terms.length; jj++) {
                    funct(transistorCell, transistorNode, terms[jj]);
                }
            }
        }
    }

    // Each nmos and pmos represents a relation between term1 and term2.
    // If term1 is not in any of the nets,
    // then create a new net and add term1 to it.
    // Loop through nmos first.
    // Loop only through "term1" and "term2" for both transistor types.
    loopThroughTransistors(function(transistor, _, term) {
        // Skip for the gate terminal.
        if(term === "gate") return;

        let net = new Net("?", false, false, false);

        // If the transistor's term1/term2 is not in any of the nets,
        // then create a new net and add term1/term2 to it.
        if(transistor[term] !== undefined) {
            if(getNet(transistor[term])) {
                net.clear();
                net = getNet(transistor[term]);
            }
            net.addCell(transistor[term]);
        }

        // Add the net if it is not empty.
        if(net.size > 0 && !getNet(transistor[term])) {
            setRecursively(transistor[term], net);
            netlist.push(net);
            net.addNode(graph.getNode(transistor));
        }
    });

    // Now, loop through nmos and pmos again and change each transistors terminal values from cells to nets.
    // This must be done after the above loop rather than as a part of it, because the loop above will overwrite the nets.
    loopThroughTransistors(function(transistor, _, term) {
        let net = getNet(transistor[term]);

        if(net === null) {
            net = new Net("?", false, false, false);
            setRecursively(transistor[term], net);
            netlist.push(net);
        }

        if(net !== undefined) {
            transistor[term] = net;
            // Gates aren't nodes.
            // The transistors themselves are the nodes, as are VDD, GND, and all outputs.
            term !== "gate" && net.addNode(graph.getNode(transistor));
        }
    });

    // Loop through pmos/nmos and find every pmos/nmos that shares a net (on term1 or term2).
    loopThroughTransistors(function(_, transistor, termA) {
        // Skip for the gate terminal.
        if(termA === "gate") return;

        let net = transistor.getCell()[termA];

        // If net is netVDD, add an edge to vddNode.
        if(net === netVDD) {
            graph.addEdge(transistor, vddNode);
        }

        // If net is netGND, add an edge to gndNode.
        if(net === netGND) {
            graph.addEdge(transistor, gndNode);
        }

        // Same for output.
        if(net === netY) {
            graph.addEdge(transistor, outputNodes[0]);
        }

        // Loop through iterator2 to find all other transistors that share a net.
        loopThroughTransistors(function(_, transistor2, termB) {
            // Skip for the gate terminal.
            if(termB === "gate") return;

            if(transistor === transistor2) { return; }

            if(transistor2.getCell()[termB] !== undefined) {
                if(transistor.getCell()[termA] === transistor2.getCell()[termB]) {
                    graph.addEdge(transistor, transistor2);
                }
            }
        });
    });
} // end function (setNets)

// Function to get the net from the netlist that contains a given cell.
function getNet(cell) {
    for (let ii = 0; ii < netlist.length; ii++) {
        if (netlist[ii].has(cell)) {
            return netlist[ii];
        }
    }
    return null;
}

function setRecursively(cell, net) {
    // Return if this cell is in pmos or nmos already.
    if (nmos.has(cell) || pmos.has(cell)) {
        net.addNode(graph.getNode(cell));
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
                }
                else {
                    cell.term2 = layeredGrid[x][y][layer];
                }
            }
        }

        // If the layer is NDIFF or PDIFF and there is also a POLY at the same location,
        // add the cell to transistors.
        if (cell.layer === layer && cell.isSet) {
            if (layeredGrid[cell.x][cell.y][POLY].isSet
                && !layeredGrid[cell.x][cell.y][CONTACT].isSet) {

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

    // Check the cell for a transistor.
    if(checkTransistor(cell, NDIFF, nmos)) return;
    if(checkTransistor(cell, PDIFF, pmos)) return;

    // Add the cell to the net.
    net.addCell(cell);

    // If CONTACT is set, add add all layers to the net.
    if(layeredGrid[cell.x][cell.y][CONTACT].isSet) {
        for (let ii = 0; ii < layers; ii++) {
            if(layeredGrid[cell.x][cell.y][ii].isSet) {
                if(net.containsCell(layeredGrid[cell.x][cell.y][ii]) === false) {
                    net.addCell(layeredGrid[cell.x][cell.y][ii]);
                    setRecursively(layeredGrid[cell.x][cell.y][ii], net);
                }
            }
        }
    }

    // For each layer of the cell in the net, recurse with all adjacent cells in the layer.
    // Generic function for the above code.
    function setAdjacent(deltaX, deltaY) {
        if(net.containsCell(layeredGrid[cell.x][cell.y][cell.layer]) && layeredGrid[cell.x][cell.y][cell.layer].isSet) {
            if(net.containsCell(layeredGrid[cell.x + deltaX][cell.y + deltaY][cell.layer]) === false) {
                setRecursively(layeredGrid[cell.x + deltaX][cell.y + deltaY][cell.layer], net);
            }
        }
    }

    // Check the cells above and below.
    (cell.y > 0) && setAdjacent(0, -1);
    (cell.y < gridsize - 1) && setAdjacent(0, 1);

    // Check the cells to the left and right.
    (cell.x > 0) && setAdjacent(-1, 0);
    (cell.x < gridsize - 1) && setAdjacent(1, 0);
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
    layeredGrid[A.x][A.y][CONTACT].isSet = true;
    layeredGrid[B.x][B.y][CONTACT].isSet = true;
    layeredGrid[C.x][C.y][CONTACT].isSet = true;
    layeredGrid[D.x][D.y][CONTACT].isSet = true;
    layeredGrid[Y.x][Y.y][CONTACT].isSet = true;

    // Draw METAL1 across the grid at VDD_y and GND_y.
    for (let i = railStartX; i < railEndX; i++) {
        layeredGrid[i][VDD_y][METAL1].isSet = true;
        layeredGrid[i][GND_y][METAL1].isSet = true;
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

                // Set the terminals of the cell to null.
                layeredGrid[i-1][j-1][NDIFF].term1 = null;
                layeredGrid[i-1][j-1][NDIFF].term2 = null;
                layeredGrid[i-1][j-1][NDIFF].gate  = null;

                layeredGrid[i-1][j-1][PDIFF].term1 = null;
                layeredGrid[i-1][j-1][PDIFF].term2 = null;
                layeredGrid[i-1][j-1][PDIFF].gate  = null;
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
    for (let i = saveState; i < lastSaveState; i++) {
        localStorage.removeItem('layeredGrid' + i);
        localStorage.removeItem('canvas' + i);
    }

    // Update the max save state.
    lastSaveState = saveState;

    // If we've reached the max save state, delete the oldest one.
    if (maxSaveState == saveState) {
        localStorage.removeItem('layeredGrid' + firstSaveState);
        localStorage.removeItem('canvas' + firstSaveState);

        firstSaveState++;
        maxSaveState++;
    }
}

// Undo by going back to the previous save state (if there is one) and redrawing the canvas.
function undo() {
    if(saveState === lastSaveState) {
        saveCurrentState();
        saveState--;
    }
    if (saveState > firstSaveState) {
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
    if (saveState < lastSaveState - 1) {
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
        return {x: x, y: y};
    }
    return null;
}

// Table is a 2D array of single character strings.
function refreshTruthTable(table) {
    let tableDiv = document.getElementById("truthTable");
    tableDiv.innerHTML = "";

    // Create a table with the correct number of rows and columns.
    // The first row should be a header.
    let tableElement = document.createElement("table");
    tableElement.setAttribute("class", "truthTable");
    tableElement.setAttribute("id", "truthTable");
    tableElement.setAttribute("border", "1");
    tableElement.setAttribute("cellspacing", "0");
    tableElement.setAttribute("cellpadding", "0");
    tableElement.setAttribute("style", "border-collapse: collapse;");
    // 100% width
    tableElement.setAttribute("width", "100%");

    let header = tableElement.createTHead();
    let headerRow = header.insertRow(0);
    for (let i = 0; i < table[0].length; i++) {
        let cell = headerRow.insertCell(i);
        cell.innerHTML = table[0][i];
    }

    // Create the rest of the table.
    for (let i = 1; i < table.length; i++) {
        let row = tableElement.insertRow(i);
        for (let j = 0; j < table[i].length; j++) {
            let cell = row.insertCell(j);
            cell.innerHTML = table[i][j];
        }
    }

    // Style the th
    let ths = tableElement.getElementsByTagName("th");
    for (let i = 0; i < ths.length; i++) {
        ths[i].setAttribute("style", "border: 1px solid black; padding: 5px;");
    }

    document.getElementById("truthTable").appendChild(button);

    tableDiv.appendChild(tableElement);
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

    // Add a div to one side to add the truth table.
    let truthTableDiv = document.createElement("div");
    truthTableDiv.id = "truthTable";
    document.body.appendChild(truthTableDiv);
    // Fix the size and position of the truth table div.
    truthTableDiv.style.width = "300px";
    truthTableDiv.style.height = "100%";
    truthTableDiv.style.position = "absolute";
    truthTableDiv.style.top = "0";
    truthTableDiv.style.right = "0";
    truthTableDiv.style.backgroundColor = darkMode ? "#333" : "#eee";
    truthTableDiv.style.overflow = "auto";
    // Set the font color in the table.
    truthTableDiv.style.color = darkMode ? "#eee" : "#333";
    // Center text alignment
    truthTableDiv.style.textAlign = "center";

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
            // Skip if CTRL is pressed.
            let cell = getCell(currentX, currentY);
            if (cell != null && !event.ctrlKey) {
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

    // Add a button in the table div to call setNets() and refreshTruthTable(buildTruthTable())
    button = document.createElement("button");
    button.innerHTML = "Set Nets";
    button.onclick = function() {
        setNets();
        refreshTruthTable(buildTruthTable());
    };
    document.getElementById("truthTable").appendChild(button);
}