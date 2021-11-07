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
let numInputs = 6; // Includes VDD and GND.
let numOutputs = 1;

let A = {x: 2, y: 8};
let B = {x: 2, y: 12};
let C = {x: 2, y: 16};
let D = {x: 2, y: 20};
let Y = {x: 26, y: 14};

// Netlist is a list of nets.
// Each net is a Set of cells.
let netlist;
let pmos;
let nmos

// VDD and GND are the two terminals of the grid.
// The terminals are always at the top and bottom of the grid.
let VDD_y = 1;
let GND_y = gridsize - 2;
let railStartX = 1;
let railEndX = gridsize - 1;

// Grid color
let darkModeGridColor = '#cccccc';
let lightModeGridColor = '#999999';

// Digraph class to represent CMOS circuitry as a graph.
// Each node is an input or output.
// Each edge is a connection between two nodes (a transistor).
// The graph is directed.
class Digraph {
    constructor() {
        this.nodes = [];
        this.edges = [];
    }

    // Check if two nodes are connected.
    isConnected(node1, node2) {
        let edges = node1.getEdges();
        for (let i = 0; i < edges.length; i++) {
            if (edges[i].getNode2() == node2) {
                return true;
            }
        }
        return false;
    }

    // Add a node to the graph.
    addNode(name, isInput, isOutput, net) {
        let node = new Node(name, isInput, isOutput, net);
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

    // Return the node with the given name.
    getNode(name) {
        for (let node of this.nodes) {
            if (node.getName() == name) {
                return node;
            }
        }
        return null;
    }

    // Return the node with the given index.
    getNodeByIndex(index) {
        return this.nodes[index];
    }

    // Return the edge with the given index.
    getEdgeByIndex(index) {
        return this.edges[index];
    }

    // Return the number of nodes in the graph.
    getNumNodes() {
        return this.nodes.length;
    }

    // Return the number of edges in the graph.
    getNumEdges() {
        return this.edges.length;
    }

    // Get a node given a net.
    getNodeByNet(net) {
        for (let node of this.nodes) {
            if (node.getNet() == net) {
                return node;
            }
        }
        return null;
    }

    // Represent the graph visually as a digraph in the console.
    print() {
        console.log('digraph G {');
        for (let node of this.nodes) {
            console.log(node.getName() + ';');
        }
        for (let edge of this.edges) {
            console.log(edge.getNode1().getName() + ' -> ' + edge.getNode2().getName() + ';');
        }
        console.log('}');
    }
}

// Define node and edge classes.
class Node {
    constructor(name, isInput, isOutput, net) {
        this.name = name;
        this.edges = [];
        this.isInput = isInput;
        this.isOutput = isOutput;
        this.net = net;
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

    getName() {
        return this.name;
    }

    isInput() {
        return this.isInput;
    }

    isOutput() {
        return this.isOutput;
    }

    getNet() {
        return this.net;
    }
}

class Edge {
    constructor(node1, node2) {
        this.node1 = node1;
        this.node2 = node2;
        // Add the edge to the nodes.
        node1.addEdge(this);
        node2.addEdge(this);
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
    // Clear the netlist.
    netlist = [];
    nmos = new Set();
    pmos = new Set();

    // Create a Digraph object.
    let digraph = new Digraph();
    // Add nodes to the digraph.
    for(let ii = 0; ii < numInputs - 2; ii++) {
        digraph.addNode(String.fromCharCode(65 + ii), true, false, netlist[ii + 2]);
    }
    for(let ii = 0; ii < numOutputs; ii++) {
        digraph.addNode(String.fromCharCode(89 - ii), false, true, netlist[ii + numInputs]);
    }
    digraph.addNode('VDD', true, false, netVDD);
    digraph.addNode('GND', true, false, netGND);

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
            return;
        }

        // If the layer is NDIFF or PDIFF and there is also a POLY at the same location,
        // add the cell to transistors.
        if (cell.layer === NDIFF) {
            if (layeredGrid[cell.x][cell.y][POLY].isSet) {
                nmos.add(cell);
                // Set the gate to the poly cell.
                cell.gate = layeredGrid[cell.x][cell.y][POLY];

                // Check adjacent cells for NDIFF.
                // Set term1 to the first one found.
                // Set term2 to the second one found.
                cell.term1 = undefined;
                cell.term2 = undefined;
                // Check the cell to the right.
                if (cell.x < gridsize - 1) {
                    if (layeredGrid[cell.x + 1][cell.y][NDIFF].isSet) {
                        cell.term1 = layeredGrid[cell.x + 1][cell.y][NDIFF];
                    }
                }
                // Check the cell to the left.
                if (cell.x > 0) {
                    if (layeredGrid[cell.x - 1][cell.y][NDIFF].isSet) {
                        // If term1 is already set, set term2 to the cell to the left.
                        if (cell.term1 !== undefined) {
                            cell.term2 = layeredGrid[cell.x - 1][cell.y][NDIFF];
                        } else {
                            cell.term1 = layeredGrid[cell.x - 1][cell.y][NDIFF];
                        }
                    }
                }
                // Check the cell above.
                if (cell.y > 0 && cell.term2 === undefined) {
                    if (layeredGrid[cell.x][cell.y - 1][NDIFF].isSet) {
                        // If term1 is already set, set term2 to the cell above.
                        if (cell.term1 !== undefined) {
                            cell.term2 = layeredGrid[cell.x][cell.y - 1][NDIFF];
                        } else {
                            cell.term1 = layeredGrid[cell.x][cell.y - 1][NDIFF];
                        }
                    }
                }
                // Check the cell below.
                if (cell.y < gridsize - 1 && cell.term2 === undefined) {
                    if (layeredGrid[cell.x][cell.y + 1][NDIFF].isSet) {
                        // If term1 is already set, set term2 to the cell below.
                        if (cell.term1 !== undefined) {
                            cell.term2 = layeredGrid[cell.x][cell.y + 1][NDIFF];
                        } else {
                            cell.term1 = layeredGrid[cell.x][cell.y + 1][NDIFF];
                        }
                    }
                }
                return;
            }
        }
        if (cell.layer === PDIFF) {
            if (layeredGrid[cell.x][cell.y][POLY].isSet) {
                pmos.add(cell);
                // Set the gate to the poly cell.
                cell.gate = layeredGrid[cell.x][cell.y][POLY];

                // Check adjacent cells for PDIFF.
                // Set term1 to the first one found.
                // Set term2 to the second one found.
                cell.term1 = undefined;
                cell.term2 = undefined;
                // Check the cell to the right.
                if (cell.x < gridsize - 1) {
                    if (layeredGrid[cell.x + 1][cell.y][PDIFF].isSet) {
                        cell.term1 = layeredGrid[cell.x + 1][cell.y][PDIFF];
                    }
                }
                // Check the cell to the left.
                if (cell.x > 0) {
                    if (layeredGrid[cell.x - 1][cell.y][PDIFF].isSet) {
                        // If term1 is already set, set term2 to the cell to the left.
                        if (cell.term1 !== undefined) {
                            cell.term2 = layeredGrid[cell.x - 1][cell.y][PDIFF];
                        } else {
                            cell.term1 = layeredGrid[cell.x - 1][cell.y][PDIFF];
                        }
                    }
                }
                // Check the cell above.
                if (cell.y > 0 && cell.term2 === undefined) {
                    if (layeredGrid[cell.x][cell.y - 1][PDIFF].isSet) {
                        // If term1 is already set, set term2 to the cell above.
                        if (cell.term1 !== undefined) {
                            cell.term2 = layeredGrid[cell.x][cell.y - 1][PDIFF];
                        } else {
                            cell.term1 = layeredGrid[cell.x][cell.y - 1][PDIFF];
                        }
                    }
                }
                // Check the cell below.
                if (cell.y < gridsize - 1 && cell.term2 === undefined) {
                    if (layeredGrid[cell.x][cell.y + 1][PDIFF].isSet) {
                        // If term1 is already set, set term2 to the cell below.
                        if (cell.term1 !== undefined) {
                            cell.term2 = layeredGrid[cell.x][cell.y + 1][PDIFF];
                        } else {
                            cell.term1 = layeredGrid[cell.x][cell.y + 1][PDIFF];
                        }
                    }
                }
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
        if(layeredGrid[A.x][A.y][ii].isSet) {
            setRecursively(layeredGrid[A.x][A.y][ii], netA);
        }
        if(layeredGrid[B.x][B.y][ii].isSet) {
            setRecursively(layeredGrid[B.x][B.y][ii], netB);
        }
        if(layeredGrid[C.x][C.y][ii].isSet) {
            setRecursively(layeredGrid[C.x][C.y][ii], netC);
        }
        if(layeredGrid[D.x][D.y][ii].isSet) {
            setRecursively(layeredGrid[D.x][D.y][ii], netD);
        }
        if(layeredGrid[Y.x][Y.y][ii].isSet) {
            setRecursively(layeredGrid[Y.x][Y.y][ii], netY);
        }
    }

    netlist.push(netA);
    netlist.push(netB);
    netlist.push(netC);
    netlist.push(netD);
    netlist.push(netY);

    // Each nmos and pmos represents a relation between term1 and term2.
    // If term1 is not in any of the nets,
    // then create a new net and add term1 to it.
    // Loop through nmos first.
    let nmosIterator = nmos.values();
    for (let ii = 0; ii < nmos.size; ii++) {
        // nmosCell is the ii'th element of the Set nmos.
        let nmosCell = nmosIterator.next().value;
        let net1 = new Set();
        let net2 = new Set();

        if(nmosCell.term1 !== undefined) {
            if(getNet(nmosCell.term1) !== null) {
                net1.add(nmosCell.term1);
            }
        }
        if(nmosCell.term2 !== undefined) {
            if(getNet(nmosCell.term2) !== null) {
                net2.add(nmosCell.term2);
            }
        }
        
        // Add the nets if they are not empty.
        if(net1.size > 0) {
            setRecursively(nmosCell.term1, net1);
            netlist.push(net1);
        }
        if(net2.size > 0) {
            setRecursively(nmosCell.term2, net2);
            netlist.push(net2);
        }

        // Add nodes and edges as needed.
        let node1 = getNodeByNet(getNet(nmosCell.term1));
        let node2 = getNodeByNet(getNet(nmosCell.term2));

        // If either is null, create a new node.
        // Safe to assume that the other exists.
        if(node1 === null) {
            node1 = digraph.addNode("t" + ii + "_1", false, false, getNet(nmosCell.term1));
            nodes.push(node1);
            digraph.addEdge(node2, node1);
        }
        else if(node2 === null) {
            node2 = digraph.addNode("t" + ii + "_2", false, false, getNet(nmosCell.term2));
            nodes.push(node2);
            digraph.addEdge(node1, node2);
        }
        else {
            // If one of the nodes is an input, set it as the first node in an edge.
            if(node1.isInput || node2.isOutput) {
                digraph.addEdge(node1, node2);
            }
            else if(node2.isInput || node1.isOutput) {
                digraph.addEdge(node2, node1);
            }
            else {
                console.log("Error: Directionality unclear.")
                digraph.addEdge(node1, node2);
                digraph.addEdge(node2, node1);
            }
        }
    }

    // Loop through pmos now.
    let pmosIterator = pmos.values();

    for (let ii = 0; ii < pmos.size; ii++) {
        let pmosCell = pmosIterator.next().value;
        let net1 = new Set();
        let net2 = new Set();

        if(pmosCell.term1 !== undefined) {
            if(getNet(pmosCell.term1) !== null) {
                net1.add(pmosCell.term1);
            }
        }

        if(pmosCell.term2 !== undefined) {
            if(getNet(pmosCell.term2) !== null) {
                net2.add(pmosCell.term2);
            }
        }

        // Add the nets if they are not empty.
        if(net1.size > 0) {
            setRecursively(pmosCell.term1, net1);
            netlist.push(net1);
        }
        if(net2.size > 0) {
            setRecursively(pmosCell.term2, net2);
            netlist.push(net2);
        }

        // Add nodes and edges as needed.
        let node1 = getNodeByNet(getNet(pmosCell.term1));
        let node2 = getNodeByNet(getNet(pmosCell.term2));

        // If either is null, create a new node.
        // Safe to assume that the other exists.
        if(node1 === null) {
            node1 = digraph.addNode("t" + ii + "_1", false, false, getNet(pmosCell.term1));
            nodes.push(node1);
            digraph.addEdge(node2, node1);
        }
        else if(node2 === null) {
            node2 = digraph.addNode("t" + ii + "_2", false, false, getNet(pmosCell.term2));
            nodes.push(node2);
            digraph.addEdge(node1, node2);
        }
        else {
            // If one of the nodes is an input, set it as the first node in an edge.
            if(node1.isInput || node2.isOutput) {
                digraph.addEdge(node1, node2);
            }
            else if(node2.isInput || node1.isOutput) {
                digraph.addEdge(node2, node1);
            }
            else {
                console.log("Error: Directionality unclear.")
                digraph.addEdge(node1, node2);
                digraph.addEdge(node2, node1);
            }
        }
    }

    // Print a grid with in all cells that are in a given net.
    function printGrid(net, name) {
        let grid = [];
        for(let ii = 0; ii < gridsize; ii++) {
            grid[ii] = [];
            for(let jj = 0; jj < gridsize; jj++) {
                grid[ii][jj] = "o";
                // If any of the layers are in netA, set the cell to "A".
                for(let kk = 0; kk < layers; kk++) {
                    if(layeredGrid[ii][jj][kk].isSet && net.has(layeredGrid[ii][jj][kk])) {
                        grid[ii][jj] = name;
                    }
                    else if(pmos.has(layeredGrid[ii][jj][kk]) || nmos.has(layeredGrid[ii][jj][kk])) {
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

    for(ii = numInputs + numOutputs; ii < netlist.length; ii++) {
        printGrid(netlist[ii], String.fromCharCode(65 + ii));
    }

    digraph.print();
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
