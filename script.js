/**************************************************************************************************
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
let darkMode;
let dragging = false;
let startX;
let startY;
let currentX;
let currentY;
let button;
let diagram;

class Diagram {
    constructor() {
        this.inputs = [
            { x: 2, y: 8,  }, // A
            { x: 2, y: 12, }, // B
            { x: 2, y: 16, }, // C
            { x: 2, y: 20, }, // D
        ];
        this.outputs = [
            { x: 26, y: 14, }, // Y
        ];
        this.gridWidth = 29;
        this.gridHeight = 29;
        this.canvas = document.getElementById("canvas");
        this.ctx = this.canvas.getContext("2d");
        this.layeredGrid = new LayeredGrid(this.gridWidth, this.gridHeight, cursors.length);
        this.cellWidth  = this.canvas.width  / (this.layeredGrid.width  + 2);
        this.cellHeight = this.canvas.height / (this.layeredGrid.height + 2);
        this.firstSaveState = 0;
        this.saveState = 0;
        this.lastSaveState = 0;
        this.maxSaveState = 10;
        this.gridCanvas = document.getElementById("grid-canvas");
        this.gridCtx = this.gridCanvas.getContext('2d');
        this.nodeNodeMap = [];
        this.netlist = [];
        this.graph = new Graph();
        this.vddCell = {x: 1, y: 1,};
        this.gndCell = {x: 1, y: this.gridHeight - 2,};
        this.vddNode = null;
        this.gndNode = null;
        this.outputNodes = [];
        this.nmos = new Set();
        this.pmos = new Set();
        this.netVDD = new Net("VDD", false);
        this.netGND = new Net("GND", false);
        this.inputNets = [];
        this.outputNets = [];
        this.useFlatColors = false;

        for (let ii = 0; ii < this.inputs.length; ii++) {
            this.inputNets.push(new Net(String.fromCharCode(65 + ii), true));
        }
        for (let ii = 0; ii < this.outputs.length; ii++) {
            this.outputNets.push(new Net(String.fromCharCode(89 - ii), false));
        }

    }
    
    // Draw a faint grid on the canvas.
    // Add an extra 2 units to the width and height for a border.
    drawGrid() {
        'use strict';
        // Place the grid canvas behind the main canvas.
        // Same size as the canvas.
        this.gridCanvas.width = this.canvas.width - 1;
        this.gridCanvas.height = this.canvas.height - 1;
        this.gridCanvas.style.position = 'absolute';
        this.gridCanvas.style.left = this.canvas.offsetLeft + 'px';
        this.gridCanvas.style.top = this.canvas.offsetTop + 'px';
        this.gridCanvas.style.zIndex = -1;

        // Set the gridCanvas context.
        this.cellWidth = this.canvas.width / (this.layeredGrid.width + 2);
        this.cellHeight = this.canvas.height / (this.layeredGrid.height + 2);

        // Clear the grid canvas.
        this.gridCtx.clearRect(0, 0, this.gridCanvas.width, this.gridCanvas.height);

        // Set stroke color depending on whether the dark mode is on or off.
        // Should be faintly visible in both modes.
        if (darkMode) {
            this.gridCtx.strokeStyle = darkModeGridColor;
        } else {
            this.gridCtx.strokeStyle = lightModeGridColor;
        }

        for (let ii = 0; ii < Math.max(this.layeredGrid.width, this.layeredGrid.height) + 2; ii++) {
            if(ii < this.layeredGrid.width + 2) {
                this.gridCtx.beginPath();
                this.gridCtx.moveTo(ii * this.cellWidth, 0);
                this.gridCtx.lineTo(ii * this.cellWidth, this.gridCanvas.height);
                this.gridCtx.stroke();
            }
            if(ii < this.layeredGrid.height + 2) {
                this.gridCtx.beginPath();
                this.gridCtx.moveTo(0, ii * this.cellHeight);
                this.gridCtx.lineTo(this.gridCanvas.width, ii * this.cellHeight);
                this.gridCtx.stroke();
            }
        }
    }
    
    computeOutput(inputVals, outputNode) {
        'use strict';
        let pmosOut;
        let nmosOut;
        let directInput;
        let triggers = [];

        let mapNodes = function(node1, node2, isPath) {
            let currentMapping = pathExists(node1, node2);

            if (currentMapping !== undefined && currentMapping !== null) {
                return;
            }

            this.nodeNodeMap[this.graph.getIndexByNode(node1)][this.graph.getIndexByNode(node2)] = isPath;
            this.nodeNodeMap[this.graph.getIndexByNode(node2)][this.graph.getIndexByNode(node1)] = isPath;

            if (isPath === null) { return; }

            // Map the path to node2 appropriately for all nodes mapped to node1.
            for (let ii = 0; ii < this.nodeNodeMap.length; ii++) {
                if (this.nodeNodeMap[ii][this.graph.getIndexByNode(node1)] === true) {
                    this.nodeNodeMap[ii][this.graph.getIndexByNode(node2)] = isPath;
                    this.nodeNodeMap[this.graph.getIndexByNode(node2)][ii] = isPath;
                }
            }
            // Now do the inverse.
            for (let ii = 0; ii < this.nodeNodeMap.length; ii++) {
                if (this.nodeNodeMap[ii][this.graph.getIndexByNode(node2)] === true) {
                    this.nodeNodeMap[ii][this.graph.getIndexByNode(node1)] = isPath;
                    this.nodeNodeMap[this.graph.getIndexByNode(node1)][ii] = isPath;
                }
            }

            if(isPath !== undefined) {
                executeTriggers(node1, node2);
            }
        }.bind(this);

        let pathExists = function(node1, node2) {
            return this.nodeNodeMap[this.graph.getIndexByNode(node1)][this.graph.getIndexByNode(node2)];
        }.bind(this);

        let executeTriggers = function(node, targetNode) {
            let triggerList = triggers[this.graph.getIndexByNode(node)];
            if (triggerList === undefined) { return; }
            triggerList = triggerList[this.graph.getIndexByNode(targetNode)];
            if (triggerList === undefined) { return; }
            for (let ii = 0; ii < triggerList.length; ii++) {
                let pathEval = pathExists(triggerList[ii].node, triggerList[ii].targetNode);
                if(pathEval === undefined || pathEval === null) {
                    mapNodes(node, targetNode, undefined);
                    computeOutputRecursive(triggerList[ii].node, triggerList[ii].targetNode);
                }
            }
        }.bind(this);

        let registerTrigger = function(triggerNode1, triggerNode2, callNode1, callNode2) {
            let triggerIndex1 = this.graph.getIndexByNode(triggerNode1);
            let triggerIndex2 = this.graph.getIndexByNode(triggerNode2);

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
        }.bind(this);

        let computeOutputRecursive = function(node, targetNode) {
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
                    this.graph.nodes.forEach(function(otherNode) {
                        if(node === otherNode) {
                            return;
                        }
                        mapNodes(node, otherNode, false);
                    }.bind(this));
                    return false;
                } else if (evalResult === null) {
                    registerTrigger(node, this.vddNode, node, targetNode);
                    registerTrigger(node, this.gndNode, node, targetNode);
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
            }.bind(this));
            /*jshint +W093 */

            if(pathFound) {
                return true;
            } else if(hasNullPath) {
                return null;
            } else {
                mapNodes(node, targetNode, false);
                return false;
            }
        }.bind(this);

        let evaluate = function(node) {
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
                let gateToGnd = pathExists(gateNode, this.gndNode);
                let gateToVdd = pathExists(gateNode, this.vddNode);
                let relevantPathExists;
                let relevantNode;

                if(gateToGnd === null || gateToVdd === null) {
                    hasNullPath = true;
                }
                
                if(node.isPmos) {
                    relevantNode = this.gndNode;
                } else {
                    relevantNode = this.vddNode;
                }

                relevantPathExists = computeOutputRecursive(gateNode, relevantNode);
                if (relevantPathExists === null) {
                    hasNullPath = true;
                    registerTrigger(gateNode, relevantNode, node, this.vddNode);
                    registerTrigger(gateNode, relevantNode, node, this.gndNode);
                } else if(relevantPathExists) {
                    return true;
                }
            }

            if(hasNullPath) {
                return null;
            }
            return false;
        }.bind(this);

        let reconcileOutput = function(pOut, nOut, dIn) {
            let out;

            // Reconcile (this.nmos and this.pmos step)
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
        }.bind(this);

        // Get this.pmos output.
        this.nodeNodeMap.length = 0;
        for (let ii = 0; ii < this.graph.nodes.length; ii++) {
            this.nodeNodeMap[ii] = [];
            this.nodeNodeMap[ii][ii] = true;
        }
        pmosOut = computeOutputRecursive(this.vddNode, outputNode) ? 1 : "Z";

        // Get this.nmos output.
        this.nodeNodeMap.length = 0;
        for (let ii = 0; ii < this.graph.nodes.length; ii++) {
            this.nodeNodeMap[ii] = [];
            this.nodeNodeMap[ii][ii] = true;
        }
        triggers.length = 0;
        nmosOut = computeOutputRecursive(this.gndNode, outputNode) ? 0 : "Z";

        // Finally, see if an input is directly connected to the output.
        for (let ii = 0; ii < this.inputNets.length; ii++) {
            if(this.inputNets[ii].containsNode(outputNode)) {
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
    
    // Draw the outer border of the canvas.
    drawBorder() {
        'use strict';
        this.ctx.strokeStyle = this.useFlatColors? cursors[cursorIndex].flatColor : cursors[cursorIndex].color;
        this.ctx.lineWidth = this.cellWidth;
        this.ctx.strokeRect(this.cellWidth / 2, this.cellWidth / 2, this.canvas.width - this.cellWidth, this.canvas.height - this.cellWidth);

        // Draw a thick border on the edge of the border drawn above.
        this.ctx.lineWidth = this.cellWidth / 4;
        this.ctx.strokeStyle = darkMode ? "#ffffff" : "#000000";
        this.ctx.strokeRect(1 + this.cellWidth - this.ctx.lineWidth / 2,
            1 + this.cellHeight - this.ctx.lineWidth / 2,
            this.canvas.width - 2 * this.cellWidth + this.ctx.lineWidth / 2,
            this.canvas.height - 2 * this.cellHeight + this.ctx.lineWidth / 2
        );

        // For the middle 11 cells of the upper border, fill with the grid color.
        this.ctx.fillStyle = darkMode ? "#ffffff" : "#000000";
        let startCell = Math.floor(this.layeredGrid.width / 2) - 4;
        this.ctx.fillRect(startCell * this.cellWidth, 0, this.cellWidth * 11, this.cellHeight);

        // Write the cursor color name in the middle of the upper border of the canvas.
        this.ctx.fillStyle = darkMode ? '#000000' : '#ffffff';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(cursors[cursorIndex].name, this.canvas.width / 2, this.cellHeight * 3 / 4);
    }

    // Change the layer/cursor color
    changeLayer() {
        'use strict';
        // Go to the next selectable index.
        let tempIndex = cursorIndex + 1;

        while(tempIndex >= cursors.length || !cursors[tempIndex].selectable) {
            tempIndex = tempIndex >= cursors.length - 1 ? 0 : tempIndex + 1;
        }
        cursorIndex = tempIndex;

        // set the outer border of the canvas to the new cursor color
        this.drawBorder();
    }

    // Resize the canvas to the largest square that fits in the window.
    resizeCanvas() {
        'use strict';
        let windowWidth = window.innerWidth;
        let windowHeight = window.innerHeight;
        let windowSize = Math.min(windowWidth, windowHeight);
        let sizeChanged = this.canvas.width !== windowSize || this.canvas.height !== windowSize;

        this.canvas.width = windowSize;
        this.canvas.height = windowSize;

        if(sizeChanged) {
            this.drawGrid();
        }
    }

    // Map a function to every transistor terminal.
    loopThroughTransistors(funct) {
        'use strict';
        let terms = ["term1", "term2", "gate", ];
        let transistorLists = [this.nmos, this.pmos, ];

        transistorLists.forEach(function (transistorList) {
            let iterator = transistorList.values();

            for (let transistor = iterator.next(); !transistor.done; transistor = iterator.next()) {
                let transistorCell = transistor.value;
                let transistorNode = this.graph.getNode(transistorCell);

                for(let ii = 0; ii < terms.length; ii++) {
                    funct(transistorCell, transistorNode, terms[ii]);
                }
            }
        }.bind(this));
    }

    // Clear necessary data structures in preparation for recomputation.
    clearCircuit() {
        'use strict';
        // Create a this.graph object.
        this.graph.clear();

        // Clear the net sets.
        this.netVDD.clear();
        this.netGND.clear();
        this.nmos.clear();
        this.pmos.clear();
    }

    // Push all terminal nets to the this.netlist.
    resetNetlist() {
        'use strict';
        // Clear the this.netlist.
        this.netlist.length = 0;

        // Add all terminal nets.
        this.netlist.push(this.netVDD);
        this.netlist.push(this.netGND);

        this.inputNets.forEach(function(net) {
            this.netlist.push(net);
        }.bind(this));
        this.outputNets.forEach(function(net) {
            this.netlist.push(net);
        }.bind(this));
    }

    // Set the nets.
    setNets() {
        'use strict';
        this.clearCircuit();

        this.inputNets.forEach(function (net) { net.clear(); });
        this.outputNets.forEach(function (net) { net.clear(); });

        // Add rail nodes to the this.graph.
        this.vddNode = this.graph.addNode(this.layeredGrid.get(this.vddCell.x, this.vddCell.y, CONTACT));
        this.gndNode = this.graph.addNode(this.layeredGrid.get(this.gndCell.x, this.gndCell.y, CONTACT));

        this.netVDD.addNode(this.vddNode);
        this.netGND.addNode(this.gndNode);

        // Add the VDD and GND nets.
        // Loop through every VDD cell and add to the VDD net.
        this.setRecursively(this.layeredGrid.get(this.vddCell.x, this.vddCell.y, CONTACT), this.netVDD);

        // Loop through every GND cell and add to the GND net.
        this.setRecursively(this.layeredGrid.get(this.gndCell.x, this.gndCell.y, CONTACT), this.netGND);

        // Loop through the terminals and set their respective nets.
        cursors.forEach(function (_, layer) {
            this.inputs.forEach(function(input, index) {
                if (this.layeredGrid.get(input.x, input.y, layer).isSet) {
                    this.setRecursively(this.layeredGrid.get(input.x, input.y, layer), this.inputNets[index]);
                }
            }.bind(this));

            this.outputs.forEach(function(output, index) {
                if (this.layeredGrid.get(output.x, output.y, layer).isSet) {
                    this.setRecursively(this.layeredGrid.get(output.x, output.y, layer), this.outputNets[index]);
                }
            }.bind(this));
        }.bind(this));

        this.resetNetlist();

        // Add output nodes to the this.graph.
        this.outputNodes.length = 0;
        this.outputs.forEach(function(output, index) {
            this.outputNodes[index] = this.graph.addNode(this.layeredGrid.get(output.x, output.y, CONTACT));
            this.outputNets[index].addNode(this.outputNodes[index]);
        }.bind(this));

        // Each this.nmos and this.pmos represents a relation between term1 and term2.
        // If term1 is not in any of the nets,
        // then create a new net and add term1 to it.
        // Loop through this.nmos first.
        // Loop only through "term1" and "term2" for both transistor types.
        this.loopThroughTransistors(function (transistor, _, term) {
            // Skip for the gate terminal.
            if (term === "gate") { return; }

            let net = new Net("?", false);

            // If the transistor's term1/term2 is not in any of the nets,
            // then create a new net and add term1/term2 to it.
            if (transistor[term] !== undefined) {
                if (this.getNet(transistor[term])) {
                    net.clear();
                    net = this.getNet(transistor[term]);
                }
                net.addCell(transistor[term]);
            }

            // Add the net if it is not empty.
            if (net.size > 0 && !this.getNet(transistor[term])) {
                this.setRecursively(transistor[term], net);
                this.netlist.push(net);
                net.addNode(this.graph.getNode(transistor));
            }
        }.bind(this));

        // Now, loop through this.nmos and this.pmos again and change each transistors terminal values from cells to nets.
        // This must be done after the above loop rather than as a part of it, because the loop above will overwrite the nets.
        this.loopThroughTransistors(function (transistor, _, term) {
            let net = this.getNet(transistor[term]);

            if (net === null) {
                net = new Net("?", false);
                this.setRecursively(transistor[term], net);
                this.netlist.push(net);
            }

            if (net !== undefined) {
                transistor[term] = net;
                // Gates aren't nodes.
                // The transistors themselves are the nodes, as are VDD, GND, and all outputs.
                if (term !== "gate") { net.addNode(this.graph.getNode(transistor)); }
            }
        }.bind(this));

        // Loop through this.pmos/this.nmos and find every this.pmos/this.nmos that shares a net (on term1 or term2).
        this.loopThroughTransistors(function (_, transistor, termA) {
            // Skip for the gate terminal.
            if (termA === "gate") { return; }

            let net = transistor.cell[termA];

            // If net is this.netVDD, add an edge to this.vddNode.
            if (net === this.netVDD) {
                transistor.addEdge(this.vddNode);
            }

            // If net is this.netGND, add an edge to this.gndNode.
            if (net === this.netGND) {
                transistor.addEdge(this.gndNode);
            }

            // Same for output.
            this.outputNets.forEach(function (outputNet, index) {
                if (net === outputNet) {
                    transistor.addEdge(this.outputNodes[index]);
                }
            }.bind(this));

            // Loop through iterator2 to find all other transistors that share a net.
            this.loopThroughTransistors(function (_, transistor2, termB) {
                // Skip for the gate terminal or self-comparison.
                if (termB === "gate" || transistor === transistor2) { return; }

                if (transistor2.cell[termB] !== undefined) {
                    if (transistor.cell[termA] === transistor2.cell[termB]) {
                        transistor.addEdge(transistor2);
                    }
                }
            });
        }.bind(this));

        this.linkIdenticalNets();
    } // end function (this.setNets)

    linkIdenticalNets() {
        'use strict';
        let linkNodes = function(net1, net2) {
            let nodeIterator1 = net1.nodes.values();
            let nodeIterator2 = net2.nodes.values();

            // If net1 is an input net, we need to reverse the order of the nodes.
            // This is because there are no nodes in input nets to begin with.
            // Loop through this.inputNets and find the net1.
            this.inputNets.some(function (net) {
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
        }.bind(this);
        // Loop through every net.
        for (let ii = 0; ii < this.netlist.length; ii++) {
            // Loop through every net again.
            for (let jj = ii + 1; jj < this.netlist.length; jj++) {
                // If the nets are identical, add an edge between them.
                if (this.netlist[ii].isIdentical(this.netlist[jj])) {
                    linkNodes(this.netlist[ii], this.netlist[jj]);
                }
            }
        }
    }

    // Function to get the net from the this.netlist that contains a given cell.
    getNet(cell) {
        'use strict';
        for (let ii = 0; ii < this.netlist.length; ii++) {
            if (this.netlist[ii].containsCell(cell)) {
                return this.netlist[ii];
            }
        }
        return null;
    }

    // If there are any nodes at this cell, add them to the net.
    addNodeByCellToNet(cell, net) {
        'use strict';

        let node = this.graph.getNode(cell);

        if(node !== null) {
            let nodeIterator = net.nodes.values();

            // Loop through net's nodes.
            for (let node2 = nodeIterator.next(); !node2.done; node2 = nodeIterator.next()) {
                node.addEdge(node2.value);
            }

            net.addNode(node);
        }
    }

    setRecursively(cell, net) {
        'use strict';

        this.addNodeByCellToNet(cell, net);

        // Return if this cell is in this.pmos or this.nmos already.
        if (this.nmos.has(cell) || this.pmos.has(cell)) {
            return;
        }

        // If the cell is NDIFF or PDIFF intersected by POLY, create a transistor.
        // Exception for CONTACT.
        // Returns true if the cell is a transistor.
        let checkTransistor = function(cell, layer, transistorArray) {

            // Helper function to set the terminals of transistors.
            let setTerminals = function(x, y, layer) {
                let getCell = this.layeredGrid.get(x, y, layer);
                if (getCell.isSet) {
                    if (cell.term1 === undefined) {
                        cell.term1 = getCell;
                    } else {
                        cell.term2 = getCell;
                    }
                }
            }.bind(this);

            // If the layer is NDIFF or PDIFF and there is also a POLY at the same location,
            // add the cell to transistors.
            if (cell.layer === layer && cell.isSet) {
                if (this.layeredGrid.get(cell.x, cell.y, POLY).isSet && !this.layeredGrid.get(cell.x, cell.y, CONTACT).isSet) {
                    transistorArray.add(cell);
                    this.graph.addNode(cell);
                    // Set the gate to the poly cell.
                    cell.gate = this.layeredGrid.get(cell.x, cell.y, POLY);

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
        }.bind(this);

        // For each layer of the cell in the net, recurse with all adjacent cells in the layer.
        // Generic function for the above code.
        let setAdjacent = function(deltaX, deltaY) {
            if (net.containsCell(this.layeredGrid.get(cell.x, cell.y, cell.layer)) && this.layeredGrid.get(cell.x + deltaX, cell.y + deltaY, cell.layer).isSet) {
                if (net.containsCell(this.layeredGrid.get(cell.x + deltaX, cell.y + deltaY, cell.layer)) === false) {
                    this.setRecursively(this.layeredGrid.get(cell.x + deltaX, cell.y + deltaY, cell.layer), net);
                }
            }
        }.bind(this);

        let handleContact = function(cell, net) {
            if (this.layeredGrid.get(cell.x, cell.y, CONTACT).isSet) {
                cursors.forEach(function(_, layer) {
                    if (!this.layeredGrid.get(cell.x, cell.y, layer).isSet) {
                        return;
                    }
                    if (net.containsCell(this.layeredGrid.get(cell.x, cell.y, layer)) === false) {
                        net.addCell(this.layeredGrid.get(cell.x, cell.y, layer));
                        this.setRecursively(this.layeredGrid.get(cell.x, cell.y, layer), net);
                    }
                }.bind(this));
            }
        }.bind(this);

        // Check the cell for a transistor.
        if (checkTransistor(cell, NDIFF, this.nmos)) { return; }
        if (checkTransistor(cell, PDIFF, this.pmos)) { return; }

        // Add the cell to the net.
        net.addCell(cell);

        // If CONTACT is set, add add all layers to the net.
        handleContact(cell, net);

        // Check the cells above and below.
        if (cell.y > 0) { setAdjacent(0, -1); }
        if (cell.y < this.layeredGrid.height - 1) { setAdjacent(0, 1); }

        // Check the cells to the left and right.
        if (cell.x > 0) { setAdjacent(-1, 0); }
        if (cell.x < this.layeredGrid.width - 1) { setAdjacent(1, 0); }
    }

    decorateContact(x, y) {
        'use strict';
        x = x + 1;
        y = y + 1;
        this.ctx.fillStyle = "#000000";
        this.ctx.beginPath();
        this.ctx.moveTo(x * this.cellWidth + this.cellWidth + 1, y * this.cellHeight - 1);
        this.ctx.lineTo(x * this.cellWidth, y * this.cellHeight + this.cellHeight + 1);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(x * this.cellWidth + this.cellWidth + 2, y * this.cellHeight + this.cellHeight + 1);
        this.ctx.lineTo(x * this.cellWidth, y * this.cellHeight - 2);
        this.ctx.stroke();
    }

    drawLabels() {
        'use strict';
        // Draw labels on the canvas above each input and output.
        this.ctx.font = "bold 18px Arial";
        this.ctx.fillStyle = darkMode ? "#ffffff" : "#000000";

        this.inputs.forEach(function(input, index) {
            this.ctx.fillText(String.fromCharCode(65 + index),
                this.cellWidth * (input.x + 1.5),
                this.cellHeight * (input.y + 0.75));
        }.bind(this));
        this.outputs.forEach(function(output, index) {
            this.ctx.fillText(String.fromCharCode(89 - index),
                this.cellWidth * (output.x + 1.5),
                this.cellHeight * (output.y + 0.75));
        }.bind(this));

        // Same for VDD and GND
        this.ctx.fillText("VDD", this.cellWidth * (this.vddCell.x + 1.5), this.cellHeight * (this.vddCell.y + 0.75));
        this.ctx.fillText("GND", this.cellWidth * (this.gndCell.x + 1.5), this.cellHeight * (this.gndCell.y + 0.75));
    }

    // Initialize everything
    refreshCanvas() {
        'use strict';
        this.resizeCanvas();

        // Check the layers of the grid, and draw cells as needed.
        let drawCell = function(i, j, layer) {
            if (this.layeredGrid.get(i, j, layer).isSet) {
                this.ctx.fillStyle = this.useFlatColors? cursors[layer].flatColor : cursors[layer].color;
                this.ctx.fillRect((i+1) * this.cellWidth, (j+1) * this.cellHeight - 1, this.cellWidth + 1, this.cellHeight + 2);
            }
        }.bind(this);

        // Draw each layer in order.
        let bounds = {
            left: 0,
            right: this.layeredGrid.width - 1,
            top: 0,
            bottom: this.layeredGrid.height - 1,
            lowLayer: 0,
            highLayer: this.layeredGrid.layers - 1,
        };

        this.layeredGrid.map(bounds, function (x, y, layer) {
            drawCell(x, y, layer);

            // For the last layer, fill each filled cell with a cross.
            if (layer === CONTACT) {
                if (this.layeredGrid.get(x, y, layer).isSet) {
                    this.decorateContact(x, y);
                }
            }

            // Set the terminals of the cell to null.
            // TODO: Move this side-effect somewhere else.
            this.layeredGrid.get(x, y, NDIFF).term1 = null;
            this.layeredGrid.get(x, y, NDIFF).term2 = null;
            this.layeredGrid.get(x, y, NDIFF).gate  = null;

            this.layeredGrid.get(x, y, PDIFF).term1 = null;
            this.layeredGrid.get(x, y, PDIFF).term2 = null;
            this.layeredGrid.get(x, y, PDIFF).gate  = null;
        }.bind(this));

        // set the outer border of the canvas to the cursor color
        this.drawBorder();
        this.drawLabels();
    }

    // Save function to save the current state of the grid and the canvas.
    // Increment save state so we can maintain an undo buffer.
    saveCurrentState() {
        'use strict';
        // Save both the grid and the drawing.
        localStorage.setItem('this.layeredGrid' + this.saveState, JSON.stringify(this.layeredGrid.grid));

        // Increment the save state.
        this.saveState++;

        // Delete all save states after the current one.
        for (let ii = this.saveState; ii < this.lastSaveState; ii++) {
            localStorage.removeItem('this.layeredGrid' + ii);
        }

        // Update the max save state.
        this.lastSaveState = this.saveState;

        // If we've reached the max save state, delete the oldest one.
        if (this.maxSaveState === this.saveState) {
            localStorage.removeItem('this.layeredGrid' + this.firstSaveState);

            this.firstSaveState++;
            this.maxSaveState++;
        }
    }

    // Undo by going back to the previous save state (if there is one) and redrawing the canvas.
    undo() {
        'use strict';
        if (this.saveState === this.lastSaveState) {
            this.saveCurrentState();
            this.saveState--;
        }
        if (this.saveState > this.firstSaveState) {
            this.saveState--;
            this.layeredGrid.grid = JSON.parse(localStorage.getItem('this.layeredGrid' + this.saveState));
        }
    }

    // Redo by going forward to the next save state (if there is one) and redrawing the canvas.
    redo() {
        'use strict';
        if (this.saveState < this.lastSaveState - 1) {
            this.saveState++;
            this.layeredGrid.grid = JSON.parse(localStorage.getItem('this.layeredGrid' + this.saveState));
        }
    }

    clearIfPainted(clientX, clientY) {
        'use strict';

        // Set a variable to true if any of the layers are set.
        let anyLayerSet = false;

        // Ignore if not inside the canvas
        if (this.inBounds({ clientX: clientX, clientY: clientY, }, this.canvas)) {
            let x = Math.floor((clientX - this.canvas.offsetLeft - this.cellWidth) / this.cellWidth);
            let y = Math.floor((clientY - this.canvas.offsetTop - this.cellHeight) / this.cellHeight);

            // Erase all layers of the cell.
            cursors.forEach(function (_, layer) {
                if (this.layeredGrid.get(x, y, layer).isSet) {
                    if (!anyLayerSet) { this.saveCurrentState(); }
                    anyLayerSet = true;
                    this.layeredGrid.clear(x, y, layer);
                }
            }.bind(this));
        }

        return anyLayerSet;
    }

    getCell(clientX, clientY) {
        'use strict';
        // Ignore if not inside the canvas
        if (this.inBounds({ clientX: clientX, clientY: clientY, }, this.canvas)) {

            let x = Math.floor((clientX - this.canvas.offsetLeft - this.cellWidth) / this.cellWidth);
            let y = Math.floor((clientY - this.canvas.offsetTop - this.cellHeight) / this.cellHeight);
            return { x: x, y: y, };
        }
        return null;
    }

    inBounds(event) {
        'use strict';
        let x = event.clientX;
        let y = event.clientY;

        return x > this.canvas.offsetLeft + this.cellWidth &&
            x < this.canvas.offsetLeft + this.canvas.width - this.cellWidth &&
            y > this.canvas.offsetTop + this.cellHeight &&
            y < this.canvas.offsetTop + this.canvas.height - this.cellHeight;
    }

    draw(bounds) {
        'use strict';
        if (Math.abs(bounds.endX - startX) > Math.abs(bounds.endY - startY)) {
            bounds.lowLayer = bounds.highLayer = cursorIndex;
            bounds.bottom = bounds.top = startY;
            this.layeredGrid.map(bounds, function (x, y, layer) {
                this.layeredGrid.set(x, y, layer);
            }.bind(this), true);
        }
        // If the mouse moved more vertically than horizontally, draw a vertical line.
        else {
            bounds.lowLayer = bounds.highLayer = cursorIndex;
            bounds.right = bounds.left = startX;
            this.layeredGrid.map(bounds, function (x, y, layer) {
                this.layeredGrid.set(x, y, layer);
            }.bind(this), true);
        }
    }

    cellClickHandler(event) {
        'use strict';
        // Just fill in or delete the cell at the start coordinates.
        // If there is no cell at the start coordinates, change the cursor color.
        if (event.button === 0) {
            if (!this.layeredGrid.get(startX, startY, cursorIndex).isSet) { this.saveCurrentState(); }
            this.layeredGrid.set(startX, startY, cursorIndex);
        } else if(event.button === 2) {
            // If in the canvas and over a colored cell, erase it.
            // Otherwise, change the layer.
            if (!this.clearIfPainted(event.clientX, event.clientY)) {
                this.changeLayer();
            }
        }
    }

    // Note the grid coordinates when the left or right mouse button is released.
    // If the left (or primary) button, use the start and end coordinates to make either a horizontal or vertical line.
    // If the right (or secondary) button, use the same coordinates to delete a line of cells.
    canvasMouseUpHandler(event) {
        'use strict';
        if (event.button === 0 || event.button === 2) {
            // If not between cells 1 and gridsize - 1, undo and return.
            if (dragging && this.inBounds(event)) {
                let endX = Math.floor((event.clientX - this.canvas.offsetLeft - this.cellWidth) / this.cellWidth);
                let endY = Math.floor((event.clientY - this.canvas.offsetTop - this.cellHeight) / this.cellHeight);
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
                    this.draw(bounds);
                } else {
                    // For secondary (i.e. right) mouse button:
                    // Delete a rectangle of squares
                    this.layeredGrid.map(bounds, function (x, y, layer) {
                        this.layeredGrid.clear(x, y, layer);
                    }.bind(this));
                }
            } else if (this.inBounds(event)) {
                this.cellClickHandler(event);
            }
            // If the mouse was released outside the canvas, undo and return.
            else if (dragging) {
                this.undo();
            }
            else if(event.button === 2) {
                this.changeLayer();
            }
        }

        dragging = false;
    }

    // Show a preview line when the user is dragging the mouse.
    mousemoveHandler(event) {
        'use strict';

        let leftMouseMoveHandler = function(bounds) {
            // If the mouse moved more horizontally than vertically,
            // draw a horizontal line.
            if (bounds.right - bounds.left > bounds.bottom - bounds.top) {
                bounds.lowLayer = bounds.highLayer = cursorIndex;
                bounds.bottom = bounds.top = startY;
                this.layeredGrid.map(bounds, function (x, y, layer) {
                    this.layeredGrid.set(x, y, layer);
                }.bind(this), true);
            }
            // If the mouse moved more vertically than horizontally,
            // draw a vertical line.
            else {
                bounds.lowLayer = bounds.highLayer = cursorIndex;
                bounds.right = bounds.left = startX;
                this.layeredGrid.map(bounds, function (x, y, layer) {
                    this.layeredGrid.set(x, y, layer);
                }.bind(this), true);
            }
        }.bind(this);

        let rightMouseMoveHandler = function(bounds) {
            // Secondary mouse button (i.e. right click)
            // Highlight a rectangle of squares for deletion.
            bounds.lowLayer = bounds.highLayer = DELETE;
            this.layeredGrid.map(bounds, function (x, y, layer) {
                this.layeredGrid.set(x, y, layer);
            }.bind(this), true);
        }.bind(this);

        // Save the current X and Y coordinates.
        currentX = event.clientX;
        currentY = event.clientY;
        let currentCell = this.getCell(currentX, currentY);

        // If the mouse is pressed and the mouse is between cells 1 and gridsize - 1,
        if (event.buttons === 1 || event.buttons === 2) {
            // Ignore if not inside the canvas
            if (this.inBounds(event)) {
                if (startX === -1 || startY === -1) {
                    let temp = this.getCell(currentX, currentY);
                    startX = temp.x;
                    startY = temp.y;
                }


                if (!dragging) {
                    // don't start dragging unless the mouse has moved outside the cell
                    if(currentCell.x === startX && currentCell.y === startY) {
                        return;
                    }
                    dragging = true;
                    this.saveCurrentState();
                } else {
                    // Continuously refresh to update the preview line.
                    this.undo();
                    this.saveCurrentState();
                }

                let endX = Math.floor((event.clientX - this.canvas.offsetLeft - this.cellWidth) / this.cellWidth);
                let endY = Math.floor((event.clientY - this.canvas.offsetTop - this.cellHeight) / this.cellHeight);

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

    placeTerminal(event, terminal) {
        'use strict';
        let cell = this.getCell(currentX, currentY);
        let oldX, oldY;

        if (cell !== null && !event.ctrlKey) {
            // First, note the current coordinates.
            oldX = terminal.x;
            oldY = terminal.y;
            // Then, set the new coordinates.
            terminal.x = cell.x;
            terminal.y = cell.y;
            // Set the CONTACT layer at the new coordinates.
            this.layeredGrid.set(cell.x, cell.y, CONTACT);
            // Unset the CONTACT layer at the old coordinates.
            this.layeredGrid.clear(oldX, oldY, CONTACT);
        }
    }

    ctrlCommandHandler(event) {
        'use strict';
        if (event.keyCode === 90) {
            // z
            this.undo();
        } else if (event.keyCode === 89) {
            // y
            this.redo();
        }
    }

    keydownHandler(event) {
        'use strict';
        let isInput  = (keyCode) => { return (keyCode >= 65) && (keyCode < 65 + this.inputs.length );    }; // Y, X, W, ...
        let isOutput = (keyCode) => { return (keyCode <= 89) && (keyCode > 89 - this.outputs.length);    }; // A, B, C, ...
        let isVDD    = (keyCode) => { return keyCode === 61 || keyCode === 187 || keyCode === 107;  }; // + key
        let isGND    = (keyCode) => { return keyCode === 173 || keyCode === 189 || keyCode === 109; }; // - key

        if      (event.ctrlKey)           { this.ctrlCommandHandler(event); }
        else if (isInput(event.keyCode))  { this.placeTerminal(event, this.inputs[event.keyCode - 65]); }
        else if (isOutput(event.keyCode)) { this.placeTerminal(event, this.outputs[89 - event.keyCode]); }
        else if (isVDD(event.keyCode))    { this.placeTerminal(event, this.vddCell); }
        else if (isGND(event.keyCode))    { this.placeTerminal(event, this.gndCell); }
    }

    // Don't show a context-menu when right-clicking
    contextmenuHandler(event) {
        'use strict';
        if (event.button === 2) {
            // Don't show a context menu.
            event.preventDefault();
        }
    }

    // Note the grid coordinates when the left mouse button is pressed.
    // Store the m in startX and startY.
    canvasMouseDownHandler(event) {
        'use strict';
        if (event.button === 0 || event.button === 2) {
            // Return if not between cells 1 and gridsize - 1
            if (this.inBounds(event)) {
                startX = Math.floor((event.clientX - this.canvas.offsetLeft - this.cellWidth) / this.cellWidth);
                startY = Math.floor((event.clientY - this.canvas.offsetTop - this.cellHeight) / this.cellHeight);
            } else {
                startX = -1;
                startY = -1;
            }
        }
    }

    // Only change dark/light mode on keyup to avoid seizure-inducing flashes from holding down space.
    keyupHandler(event) {
        'use strict';
        // Toggle dark mode by pressing space
        if (event.keyCode === 32) {
            toggleDarkMode();
        }
        // Toggle useFlatColors by pressing 'f'
        if (event.keyCode === 70) {
            this.useFlatColors = !this.useFlatColors;
        }

        // Only do the following if CTRL is pressed.
        if (event.ctrlKey) {
            // Shift the LayeredGrid by pressing the arrow keys.
            if (event.keyCode === 37) {
                // Left
                this.layeredGrid.shift(-1, 0);
            }
            if (event.keyCode === 38) {
                // Up
                this.layeredGrid.shift(0, -1);
            }
            if (event.keyCode === 39) {
                // Right
                this.layeredGrid.shift(1, 0);
            }
            if (event.keyCode === 40) {
                // Down
                this.layeredGrid.shift(0, 1);
            }
        }

        // Update the truth table by pressing enter.
        if (event.keyCode === 13) {
            refreshTruthTable();
        }
    }
}

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
        isTerminal = layer === CONTACT && diagram.inputs.some(function(input) {
            return input.x === x && input.y === y;
        });

        isTerminal = isTerminal || layer === CONTACT && diagram.outputs.some(function(output) {
            return output.x === x && output.y === y;
        });

        isTerminal = isTerminal || diagram.vddCell.x === x && diagram.vddCell.y === y;
        isTerminal = isTerminal || diagram.gndCell.x === x && diagram.gndCell.y === y;

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
    resize(width, height) {
        if(width < 0 || height < 0) {
            return;
        }

        let oldGrid = this.grid;
        let oldWidth = this.width;
        let oldHeight = this.height;
        this.width = width;
        this.height = height;
        this.grid = new Array(width * height * this.layers);

        // Copy the old grid into the new grid
        let bounds = {
            left: 0,
            right: Math.min(this.width - 1, oldWidth - 1),
            top: 0,
            bottom: Math.min(this.height - 1, oldHeight - 1),
            lowLayer: 0,
            highLayer: this.layers - 1,
        };

        for(let layer = bounds.lowLayer; layer <= bounds.highLayer; layer++) {
            for(let y = bounds.top; y <= bounds.bottom; y++) {
                for(let x = bounds.left; x <= bounds.right; x++) {
                    this.grid[this.convertFromCoordinates(x, y, layer)] = oldGrid[x + (y * oldWidth) + (layer * oldWidth * oldHeight)];
                }
            }
        }
    }

    // Shift the grid by a given offset
    shift(xOffset, yOffset) {
        let oldGrid = this.grid;
        this.grid = new Array(this.width * this.height * this.layers);

        for(let layer = 0; layer < this.layers; layer++) {
            for(let y = 0; y < this.height; y++) {
                for(let x = 0; x < this.width; x++) {
                    if(x - xOffset < 0 || x - xOffset >= this.width || y - yOffset < 0 || y - yOffset >= this.height) {
                        continue;
                    }
                    if(oldGrid[x - xOffset + ((y - yOffset) * this.width) + (layer * this.width * this.height)]) {
                        this.set(x, y, layer);
                    }
                }
            }
        }

        this.shiftTerminals(xOffset, yOffset);
    }

    // Shift the terminals by a given offset
    shiftTerminals(xOffset, yOffset) {
        let shiftTerminal = function(terminal) {
            if(terminal.x + xOffset >= 0 && terminal.x + xOffset < this.width) {
                terminal.x += xOffset;
            }
            if(terminal.y + yOffset >= 0 && terminal.y + yOffset < this.height) {
                terminal.y += yOffset;
            }

            // Make sure there is still a CONTACT at the new coordinates
            // (may have shifted off the screen)
            this.set(terminal.x, terminal.y, CONTACT);
        }.bind(this);

        diagram.inputs.forEach(function(input) {
            shiftTerminal(input);
        }.bind(this));

        diagram.outputs.forEach(function(output) {
            shiftTerminal(output);
        }.bind(this));

        shiftTerminal(diagram.vddCell);
        shiftTerminal(diagram.gndCell);
    }
}

// Graph class to represent CMOS circuitry.
class Graph {
    constructor() {
        this.nodes = [];
    }

    // Clear the diagram.graph.
    clear() {
        // Destroy all nodes.
        for (let ii = 0; ii < this.nodes.length; ii++) {
            this.nodes[ii].destroy();
        }

        this.nodes.length = 0;
    }

   // Add a node to the diagram.graph.
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

// Each diagram.graph node is a transistor, VDD, GND, or an output.
class Node {
    constructor(cell) {
        this.cell = cell;
        this.edges = [];
        this.isPmos = diagram.layeredGrid.get(cell.x, cell.y, PDIFF).isSet;
        this.isNmos = diagram.layeredGrid.get(cell.x, cell.y, NDIFF).isSet;
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

// Each edge is a connection between two diagram.graph nodes.
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

// Grid color
let darkModeGridColor = '#cccccc';
let lightModeGridColor = '#999999';

/* jshint latedef: nofunc */

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
    for (let ii = 0; ii < Math.pow(2, diagram.inputs.length); ii++) {
        let tableInputRow = [];
        let tableOutputRow = [];

        // Compute each output.
        for (let jj = 0; jj < diagram.outputs.length; jj++) {
            tableOutputRow[jj] = diagram.computeOutput(ii, diagram.outputNodes[jj]);
        }

        outputVals[ii] = tableOutputRow;

        for (let jj = 0; jj < diagram.inputs.length; jj++) {
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

// Table is a 2D array of single character strings.
function refreshTruthTable() {
    'use strict';
    // Update the diagram.netlist.
    diagram.setNets();

    // Create a table with the correct number of rows and columns.
    // The first row should be a header.
    let table = buildTruthTable();
    let tableElement = document.getElementById("truth-table");
    tableElement.innerHTML = "";

    let header = tableElement.createTHead();
    let headerRow = header.insertRow(0);
    headerRow.className = "header";

    table[0].forEach(function (element, index) {
        let cell = headerRow.insertCell(index);
        cell.innerHTML = element;
        cell.className = index < diagram.inputs.length ? "input" : "output";
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
            tCell.className = colIndex < diagram.inputs.length ? "input" : "output";
        });
    });
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

function setUpControls() {
    'use strict';
    let removeRowButton = document.getElementById("remove-row");
    let addRowButton = document.getElementById("add-row");
    let removeColumnButton = document.getElementById("remove-column");
    let addColumnButton = document.getElementById("add-column");
    let shiftLeftButton = document.getElementById("shift-left");
    let shiftRightButton = document.getElementById("shift-right");
    let shiftUpButton = document.getElementById("shift-up");
    let shiftDownButton = document.getElementById("shift-down");

    removeRowButton.addEventListener("click", function() {
        this.layeredGrid.resize(this.layeredGrid.width, this.layeredGrid.height - 1);
        document.getElementById("row-count").innerHTML = this.layeredGrid.height;
        this.drawGrid();
    }.bind(this));

    addRowButton.addEventListener("click", function() {
        this.layeredGrid.resize(this.layeredGrid.width, this.layeredGrid.height + 1);
        document.getElementById("row-count").innerHTML = this.layeredGrid.height;
        this.drawGrid();
    }.bind(diagram));

    removeColumnButton.addEventListener("click", function() {
        this.layeredGrid.resize(this.layeredGrid.width - 1, this.layeredGrid.height);
        document.getElementById("column-count").innerHTML = this.layeredGrid.width;
        this.drawGrid();
    }.bind(diagram));

    addColumnButton.addEventListener("click", function() {
        this.layeredGrid.resize(this.layeredGrid.width + 1, this.layeredGrid.height);
        document.getElementById("column-count").innerHTML = this.layeredGrid.width;
        this.drawGrid();
    }.bind(diagram));

    shiftLeftButton.addEventListener("click", function() {
        this.layeredGrid.shift(-1, 0);
    }.bind(diagram));

    shiftRightButton.addEventListener("click", function() {
        this.layeredGrid.shift(1, 0);
    }.bind(diagram));

    shiftUpButton.addEventListener("click", function() {
        this.layeredGrid.shift(0, -1);
    }.bind(diagram));

    shiftDownButton.addEventListener("click", function() {
        this.layeredGrid.shift(0, 1);
    }.bind(diagram));
}

window.onload = function () {
    'use strict';
    // Clear local storage
    localStorage.clear();
    diagram = new Diagram();

    // Get the canvas div to attach listeners to.
    let canvasContainer = document.getElementById("canvas-container");

    // Set to dark mode if it is night time
    setDarkMode(new Date().getHours() > 19 || new Date().getHours() < 7);

    // Initialize with a gridsize of 29 and 5 layers
    diagram.canvas = document.getElementById("canvas");
    diagram.ctx = diagram.canvas.getContext("2d");
    diagram.layeredGrid = new LayeredGrid(diagram.gridWidth, diagram.gridHeight, cursors.length);

    // Canvas mouse event listeners.
    canvasContainer.addEventListener("mousedown", function(e) { this.canvasMouseDownHandler(e); }.bind(diagram));
    canvasContainer.addEventListener("mouseup", function(e) { this.canvasMouseUpHandler(e); }.bind(diagram));
    canvasContainer.addEventListener("contextmenu", function(e) { this.contextmenuHandler(e); }.bind(diagram));

    // Some of these pertain the the canvas, but we don't know whether
    // it will be selected.
    window.addEventListener("keydown", function(e) { this.keydownHandler(e); }.bind(diagram));
    window.addEventListener("keyup", function(e) { this.keyupHandler(e); }.bind(diagram));
    window.addEventListener("mousemove", function(e) { this.mousemoveHandler(e); }.bind(diagram));

    // Set up the evaluate button.
    button = document.getElementById("generate-truth-table");
    button.onclick = function () {
        refreshTruthTable();
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
    diagram.inputs.forEach(function(input) {
        diagram.layeredGrid.set(input.x, input.y, CONTACT);
    });
    diagram.outputs.forEach(function(output) {
        diagram.layeredGrid.set(output.x, output.y, CONTACT);
    });

    // Set the CONTACT layer on the VDD and GND cells.
    diagram.layeredGrid.set(diagram.vddCell.x, diagram.vddCell.y, CONTACT);
    diagram.layeredGrid.set(diagram.gndCell.x, diagram.gndCell.y, CONTACT);

    setUpControls();

    diagram.refreshCanvas();
    // 60 fps
    setInterval(diagram.refreshCanvas.bind(diagram), 16);

    if(window.runTestbench) {
        runTestbench();
    }
};