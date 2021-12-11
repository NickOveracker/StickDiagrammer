/**************************************************************************************************
 * 
 * ## Legal Stuff
 * All rights are reserved by Nick Overacker.
 *
 * Free for AND(personal, non-professional, non-commercial) use.
 * For OR(professional, commercial, institutional) use, please contact: nick.overacker@okstate.edu
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
let button;
let diagram;

class Diagram {
    // Cycle through the following cursor colors by pressing space: Diagram.PDIFF, Diagram.NDIFF, Diagram.POLY, METAL1, Diagram.CONTACT
    // Additional colors: Diagram.DELETE at index (numLayers + 0)
    // Colorblind-friendly template found on [David Nichols's](https://personal.sron.nl/~pault/) website.
    // Specifically, [Paul Tol's](https://personal.sron.nl/~pault/) template was used.
    static get layers() {
        return [
            {name: 'pdiff',   color: 'rgba(118,   0, 181,   1)', friendlyColor: 'rgba(51,   34, 136,   1)', selectable: true, },
            {name: 'ndiff',   color: 'rgba(50,  205,  50,   1)', friendlyColor: 'rgba(17,  119,  51,   1)', selectable: true, },
            {name: 'poly',    color: 'rgba(255,   0,   0, 0.5)', friendlyColor: 'rgba(136,  34,  85, 0.5)', selectable: true, },
            {name: 'metal1',  color: 'rgba(0,   255, 255, 0.5)', friendlyColor: 'rgba(136, 204, 238, 0.5)', selectable: true, },
            {name: 'metal2',  color: 'rgba(255,   0, 204, 0.5)', friendlyColor: 'rgba(221, 204, 119, 0.5)', selectable: true, },
            {name: 'contact', color: 'rgba(204, 204, 204, 0.5)', friendlyColor: 'rgba(204, 102, 119, 0.5)', selectable: true, },
            {name: 'delete',  color: 'rgba(208, 160,  32, 0.5)', friendlyColor: 'rgba(170,  68, 153, 0.5)', selectable: false,},
        ];
    }
    static get PDIFF()        { return 0; }
    static get NDIFF()        { return 1; }
    static get POLY()         { return 2; }
    static get METAL1()       { return 3; }
    static get METAL2()       { return 4; }
    static get CONTACT()      { return 5; }
    static get DELETE()       { return 6; } // always make this the last layer
    static get maxTerminals() { return 8; }

    constructor(mainCanvas, gridCanvas) {
        'use strict';
        let startWidth  = 29;
        let startHeight = 29;
        this.inputs = [
            { x: 2, y: 8,  }, // A
            { x: 2, y: 12, }, // B
            { x: 2, y: 16, }, // C
            { x: 2, y: 20, }, // D
        ];
        this.outputs = [
            { x: 26, y: 14, }, // Y
        ];

        this.layeredGrid = new LayeredGrid(this, startWidth, startHeight, Diagram.layers.length);
        this.nodeNodeMap = [];
        this.netlist = [];
        this.graph = new Graph();
        this.vddCell = {x: 1, y: 1,};
        this.gndCell = {x: 1, y: startHeight - 2,};
        this.vddNode = null;
        this.gndNode = null;
        this.outputNodes = [];
        this.nmos = new Set();
        this.pmos = new Set();
        this.vddNet = new Net("VDD", false);
        this.gndNet = new Net("GND", false);
        this.inputNets = [];
        this.outputNets = [];
        this.triggers = [];
        this.analyses = [];
        this.nmosPullup = false;
        this.pmosPulldown = false;

        for (let ii = 0; ii < this.inputs.length; ii++) {
            this.inputNets.push(new Net(String.fromCharCode(65 + ii), true));
        }
        for (let ii = 0; ii < this.outputs.length; ii++) {
            this.outputNets.push(new Net(String.fromCharCode(89 - ii), false));
        }

        this.view = new DiagramView(this, mainCanvas, gridCanvas);
        this.controller = new DiagramController(this, this.view, mainCanvas);
    }

    // Helps with garbage collection
    clearAnalyses() {
        'use strict';
        this.analyses.forEach(analysis => {
            analysis.forEach(row => {
                row.length = 0;
            });
            analysis.length = 0;
        });
    }

    getTerminals() {
        'use strict';
        return [].concat(this.vddCell, this.gndCell, this.inputs, this.outputs);
    }

    getTerminalName(index) {
        'use strict';
        if(index === 0) {
            return "VDD";
        } else if(index === 1) {
            return "GND";
        } else if(index < this.inputs.length + 2) {
            return String.fromCharCode(65 + index - 2);
        } else if(index < this.inputs.length + this.outputs.length + 2) {
            return String.fromCharCode(90 - this.outputs.length + index - this.inputs.length - 2);
        } else {
            return "?";
        }
    }

    pathExists(node1, node2) {
        'use strict';
        return this.nodeNodeMap[this.graph.getIndexByNode(node1)][this.graph.getIndexByNode(node2)];
    }

    mapNodes(node1, node2, isPath, inputVals) {
        'use strict';
        let currentMapping = this.pathExists(node1, node2);

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
            this.executeTriggers(node1, node2, inputVals);
        }
    }

    executeTriggers(node, targetNode, inputVals) {
        'use strict';
        let triggerList = this.triggers[this.graph.getIndexByNode(node)];
        if (triggerList === undefined) { return; }
        triggerList = triggerList[this.graph.getIndexByNode(targetNode)];
        if (triggerList === undefined) { return; }
        for (let ii = 0; ii < triggerList.length; ii++) {
            let pathEval = this.pathExists(triggerList[ii].node, triggerList[ii].targetNode);
            if(pathEval === undefined || pathEval === null) {
                this.mapNodes(node, targetNode, undefined, inputVals);
                this.computeOutputRecursive(triggerList[ii].node, triggerList[ii].targetNode, inputVals);
            }
        }
    }

    registerTrigger(triggerNode1, triggerNode2, callNode1, callNode2) {
        'use strict';
        let triggerIndex1 = this.graph.getIndexByNode(triggerNode1);
        let triggerIndex2 = this.graph.getIndexByNode(triggerNode2);

        if(this.triggers[triggerIndex1] === undefined) {
            this.triggers[triggerIndex1] = [];
        }
        if(this.triggers[triggerIndex2] === undefined) {
            this.triggers[triggerIndex2] = [];
        }
        if(this.triggers[triggerIndex1][triggerIndex2] === undefined) {
            this.triggers[triggerIndex1][triggerIndex2] = [];
            this.triggers[triggerIndex2][triggerIndex1] = [];
        }
        this.triggers[triggerIndex1][triggerIndex2].push({node: callNode1, targetNode: callNode2,});
        this.triggers[triggerIndex2][triggerIndex1].push({node: callNode1, targetNode: callNode2,});
    }

    computeOutputRecursive(node, targetNode, inputVals) {
        'use strict';
        let hasPath;
        let hasNullPath;
        let pathFound;

        // We found it?
        if (node === targetNode) {
            return true;
        }

        hasPath = this.pathExists(node, targetNode);
        // Prevent too much recursion.
        // If this is already being checked, the path will be null.
        if (hasPath === null) {
            return null;
        } else if (hasPath !== undefined) {
        // Avoid infinite loops.
            return hasPath;
        }

        // Initialize to null.
        this.mapNodes(node, targetNode, null, inputVals);

        // Only proceed if the input is activated.
        // Ignore in case of output or supply, since these don't have
        // gates to evaluate. Simply arriving at them means they are active.
        if (node.isTransistor()) {
            let evalResult = this.evaluate(node, inputVals);
            if (evalResult === false) {
                this.graph.nodes.forEach(function(otherNode) {
                    if(node === otherNode) {
                        return;
                    }
                    this.mapNodes(node, otherNode, false, inputVals);
                }.bind(this));
                return false;
            } else if (evalResult === null) {
                this.registerTrigger(node, this.vddNode, node, targetNode);
                this.registerTrigger(node, this.gndNode, node, targetNode);
                this.mapNodes(node, targetNode, undefined, inputVals);
                return null;
            }
        }

        // Recurse on all edges.
        hasNullPath = false;
        pathFound = false;
        /*jshint -W093 */
        node.edges.some(function(edge) {
            let otherNode = edge.getOtherNode(node);
            let hasPath = this.pathExists(otherNode, targetNode);
            if (hasPath) {
                this.mapNodes(node, targetNode, true, inputVals);
                this.mapNodes(node, edge.getOtherNode(node), true, inputVals);
                return pathFound = true;
            }
            let result = hasPath !== false && this.computeOutputRecursive(otherNode, targetNode, inputVals);
            if (result) {
                this.mapNodes(node, targetNode, true, inputVals);
                this.mapNodes(node, edge.getOtherNode(node), true, inputVals);
                return pathFound = true;
            }

            if(result === null || hasPath === null) {
                hasNullPath = true;
                this.registerTrigger(targetNode, edge.getOtherNode(node), node, targetNode);
            }
        }.bind(this));
        /*jshint +W093 */

        if(pathFound) {
            return true;
        } else if(hasNullPath) {
            return null;
        } else {
            this.mapNodes(node, targetNode, false, inputVals);
            return false;
        }
    }

    evaluate(node, inputVals) {
        'use strict';
        let gateNet = node.cell.gate;
        let gateNodeIterator;
        let hasNullPath;

        if (gateNet.isInput) {
            /*jslint bitwise: true */
            let inputNum = (this.inputs.length - 1) - (node.getName().charCodeAt(0) - 65);

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
            let gateToGnd = this.pathExists(gateNode, this.gndNode);
            let gateToVdd = this.pathExists(gateNode, this.vddNode);
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

            relevantPathExists = this.computeOutputRecursive(gateNode, relevantNode, inputVals);
            if (relevantPathExists === null) {
                hasNullPath = true;
                this.registerTrigger(gateNode, relevantNode, node, this.vddNode);
                this.registerTrigger(gateNode, relevantNode, node, this.gndNode);
            } else if(relevantPathExists) {
                return true;
            }
        }

        if(hasNullPath) {
            return null;
        }
        return false;
    }

    reconcileOutput(pOut, nOut, dIn) {
        'use strict';
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
    }

    computeOutput(inputVals, outputNode) {
        'use strict';
        let pmosOut;
        let nmosOut;
        let directInput;
        this.triggers.length = 0;

        // Get this.pmos output.
        for (let ii = 0; ii < this.graph.nodes.length; ii++) {
            this.nodeNodeMap[ii] = [];
            this.nodeNodeMap[ii][ii] = true;
        }
        pmosOut = this.computeOutputRecursive(this.vddNode, outputNode, inputVals) ? 1 : "Z";

        // Get this.nmos output.
        //this.nodeNodeMap.length = 0;
        this.graph.nodes.forEach(function(node, ii) {
            for (let jj = 0; jj < ii; jj++) {
                if(this.nodeNodeMap[ii][jj] === null) {
                    this.nodeNodeMap[ii][jj] = this.nodeNodeMap[jj][ii] = undefined;
                }
            }
        }.bind(this));
      
        this.triggers.length = 0;
        nmosOut = this.computeOutputRecursive(this.gndNode, outputNode, inputVals) ? 0 : "Z";

        // Finally, see if an input is directly connected to the output.
        for (let ii = 0; ii < this.inputNets.length; ii++) {
            if(this.inputNets[ii].containsNode(outputNode)) {
                let inputNum = (this.inputs.length - 1) - ii;
                /*jslint bitwise: true */
                let temp = (inputVals >> inputNum) & 1;
                /*jslint bitwise: false */

                if(directInput === undefined || directInput === temp) {
                    directInput = temp;
                } else {
                    directInput = "X";
                }
            }
        }

        this.analyses[inputVals] = [...this.nodeNodeMap,];
        this.nodeNodeMap.length = 0;

        return this.reconcileOutput(pmosOut, nmosOut, directInput);
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
        this.vddNet.clear();
        this.gndNet.clear();
        this.nmos.clear();
        this.pmos.clear();

        // Unset all transistor terminals
        let bounds = {
            left: 0,
            right: this.layeredGrid.width - 1,
            top: 0,
            bottom: this.layeredGrid.height - 1,
            lowLayer:  Math.min(Diagram.PDIFF, Diagram.NDIFF),
            highLayer: Math.max(Diagram.PDIFF, Diagram.NDIFF),
        };

        this.layeredGrid.map(bounds, function (x, y, layer) {
            // Set the terminals of the cell to null.
            this.layeredGrid.get(x, y, layer).term1 = null;
            this.layeredGrid.get(x, y, layer).term2 = null;
            this.layeredGrid.get(x, y, layer).gate  = null;

            this.layeredGrid.get(x, y, layer).term1 = null;
            this.layeredGrid.get(x, y, layer).term2 = null;
            this.layeredGrid.get(x, y, layer).gate  = null;
        }.bind(this));
    }

    // Push all terminal nets to the this.netlist.
    resetNetlist() {
        'use strict';
        // Clear the this.netlist.
        this.netlist.length = 0;

        // Add all terminal nets.
        this.netlist.push(this.vddNet);
        this.netlist.push(this.gndNet);

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
        this.vddNode = this.graph.addNode(this.layeredGrid.get(this.vddCell.x, this.vddCell.y, Diagram.CONTACT), true);
        this.gndNode = this.graph.addNode(this.layeredGrid.get(this.gndCell.x, this.gndCell.y, Diagram.CONTACT), true);

        this.vddNet.addNode(this.vddNode);
        this.gndNet.addNode(this.gndNode);

        // Add the VDD and GND nets.
        // Loop through every VDD cell and add to the VDD net.
        this.setRecursively(this.layeredGrid.get(this.vddCell.x, this.vddCell.y, Diagram.CONTACT), this.vddNet);

        // Loop through every GND cell and add to the GND net.
        this.setRecursively(this.layeredGrid.get(this.gndCell.x, this.gndCell.y, Diagram.CONTACT), this.gndNet);

        // Loop through the terminals and set their respective nets.
        this.inputs.forEach(function(input, index) {
            this.setRecursively(this.layeredGrid.get(input.x, input.y, Diagram.CONTACT), this.inputNets[index]);
        }.bind(this));

        this.outputs.forEach(function(output, index) {
            this.setRecursively(this.layeredGrid.get(output.x, output.y, Diagram.CONTACT), this.outputNets[index]);
        }.bind(this));

        this.resetNetlist();

        // Add output nodes to the this.graph.
        this.outputNodes.length = 0;
        this.outputs.forEach(function(output, index) {
            this.outputNodes[index] = this.graph.addNode(this.layeredGrid.get(output.x, output.y, Diagram.CONTACT), true);
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

            // If net is this.vddNet, add an edge to this.vddNode.
            if (net === this.vddNet) {
                transistor.addEdge(this.vddNode);
            }

            // If net is this.gndNet, add an edge to this.gndNode.
            if (net === this.gndNet) {
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
        this.checkPolarity();
    } // end function setNets

    checkPolarity() {
        'use strict';
        this.nmosPullup = this.pmosPulldown = false;

        // See if there are any NDIFF cells in vddNet.
        // If there are, flag for nmos pullup.
        let vddNetIterator = this.vddNet.cells.values();
        let cell = vddNetIterator.next();
        while (!cell.done) {
            if (cell.value.layer === Diagram.NDIFF) {
                this.nmosPullup = true;
            }
            cell = vddNetIterator.next();
        }

        // Now check if there are any PDIFF cells in gndNet.
        // If there are, flag for pmos pulldown.
        let gndNetIterator = this.gndNet.cells.values();
        cell = gndNetIterator.next();
        while (!cell.done) {
            if (cell.value.layer === Diagram.PDIFF) {
                this.pmosPulldown = true;
            }
            cell = gndNetIterator.next();
        }

        // Alert the user with alert() if there are any pullups/pulldowns.
        if (this.nmosPullup || this.pmosPulldown) {
            alert("Warning:\n" +
                  "N pull-up or P pull-down detected.\n" +
                  "Simulation may be inaccurate."
            );
        }
    }

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
   
    // Helper function to set the terminals of transistors.
    setTerminals(transistor, x, y, layer) {
        'use strict';
        let cell = this.layeredGrid.get(x, y, layer);
        
        if (cell.isSet) {
            if(this.layeredGrid.get(x, y, Diagram.POLY).isSet) {
                // If the foolish user set a wide poly, then skip this cell and move on.
                // This will help us get to the other side of the poly.
                let newX, newY;
                newX = (x - transistor.x) + x;
                newY = (y - transistor.y) + y;
                this.setTerminals(transistor, newX, newY, layer);
            } else {
                // Set this cell as the terminal.
                if (transistor.term1 === undefined) {
                    transistor.term1 = cell;
                } else {
                    transistor.term2 = cell;
                }
            }
        }
    }

    // If the cell is Diagram.NDIFF or Diagram.PDIFF intersected by Diagram.POLY, create a transistor.
    // Exception for Diagram.CONTACT.
    // Returns true if the cell is a transistor.
    // Side effect: Adds a transistor (if found) to this.nmos or this.pmos.
    checkTransistor(cell, layer, transistorArray) {
        'use strict';

        // If the layer is Diagram.NDIFF or Diagram.PDIFF and there is also a Diagram.POLY at the same location,
        // add the cell to transistors.
        if (cell.layer === layer && cell.isSet) {
            if (this.layeredGrid.get(cell.x, cell.y, Diagram.POLY).isSet && !this.layeredGrid.get(cell.x, cell.y, Diagram.CONTACT).isSet) {
                transistorArray.add(cell);
                this.graph.addNode(cell);
                // Set the gate to the poly cell.
                cell.gate = this.layeredGrid.get(cell.x, cell.y, Diagram.POLY);

                // Check adjacent cells for Diagram.NDIFF.
                // Set term1 to the first one found.
                // Set term2 to the second one found.
                cell.term1 = undefined;
                cell.term2 = undefined;

                // Check the cells above and below.
                this.setTerminals(cell, cell.x, cell.y - 1, layer);
                this.setTerminals(cell, cell.x, cell.y + 1, layer);

                // Check the cells to the left and right.
                this.setTerminals(cell, cell.x - 1, cell.y, layer);
                this.setTerminals(cell, cell.x + 1, cell.y, layer);

                return true;
            }
        }

        return false;
    }

    // For each layer of the cell in the net, recurse with all adjacent cells in the layer.
    // Generic function for the above code.
    setAdjacent(deltaX, deltaY, net, cell) {
        'use strict';
        if (net.containsCell(this.layeredGrid.get(cell.x, cell.y, cell.layer)) && this.layeredGrid.get(cell.x + deltaX, cell.y + deltaY, cell.layer).isSet) {
            if (net.containsCell(this.layeredGrid.get(cell.x + deltaX, cell.y + deltaY, cell.layer)) === false) {
                this.setRecursively(this.layeredGrid.get(cell.x + deltaX, cell.y + deltaY, cell.layer), net);
            }
        }
    }

    handleContact(cell, net) {
        'use strict';
        if (this.layeredGrid.get(cell.x, cell.y, Diagram.CONTACT).isSet) {
            Diagram.layers.forEach(function(_, layer) {
                if(layer === Diagram.DELETE) {
                    return;
                }
                if (!this.layeredGrid.get(cell.x, cell.y, layer).isSet) {
                    return;
                }
                if (net.containsCell(this.layeredGrid.get(cell.x, cell.y, layer)) === false) {
                    net.addCell(this.layeredGrid.get(cell.x, cell.y, layer));
                    this.setRecursively(this.layeredGrid.get(cell.x, cell.y, layer), net);
                }
            }.bind(this));
        }
    }

    setRecursively(cell, net) {
        'use strict';

        net.addNode(this.graph.getNode(cell));

        // Return if this cell is in this.pmos or this.nmos already.
        if (this.nmos.has(cell) || this.pmos.has(cell)) {
            return;
        }

        // Check the cell for a transistor.
        if (this.checkTransistor(cell, Diagram.NDIFF, this.nmos)) { return; }
        if (this.checkTransistor(cell, Diagram.PDIFF, this.pmos)) { return; }

        // Add the cell to the net.
        net.addCell(cell);

        // If Diagram.CONTACT is set, add add all layers to the net.
        this.handleContact(cell, net);

        // Check the cells above and below.
        if (cell.y > 0) { this.setAdjacent(0, -1, net, cell); }
        if (cell.y < this.layeredGrid.height - 1) { this.setAdjacent(0, 1, net, cell); }

        // Check the cells to the left and right.
        if (cell.x > 0) { this.setAdjacent(-1, 0, net, cell); }
        if (cell.x < this.layeredGrid.width - 1) { this.setAdjacent(1, 0, net, cell); }
    }
}

class DiagramController {
    constructor(diagram, view) {
        'use strict';
        this.diagram          = diagram;
        this.view             = view;
        this.firstSaveState   = 0;
        this.lastSaveState    = 0;
        this.maxSaveState     = 10;
        this.saveState        = 0;
        this.dragging         = false;
        this.startX           = -1;
        this.startY           = -1;
        this.currentX         = -1;
        this.currentY         = -1;
        this.cursorIndex      = 0;
        this.eraseMode        = false;
        this.placeTermMode    = false;
        this.selectedTerminal = null;
        this.shiftCommands    = [];

        // Set up shift commands
        this.shiftCommands[37] = ((e) => {
            if(e.type.includes('up')) {
                this.diagram.layeredGrid.shift(-1,  0);
            }
        }).bind(this);

        this.shiftCommands[38] = ((e) => {
            if(e.type.includes('up')) {
                this.diagram.layeredGrid.shift( 0, -1);
            }
        }).bind(this);

        this.shiftCommands[39] = ((e) => {
            if(e.type.includes('up')) {
                this.diagram.layeredGrid.shift( 1,  0);
            }
        }).bind(this);

        this.shiftCommands[40] = ((e) => {
            if(e.type.includes('up')) {
                this.diagram.layeredGrid.shift( 0,  1);
            }
        }).bind(this);

        this.shiftCommands[65] = ((e) => {
            if(e.type.includes('up')) {
                this.view.accessible = !this.view.accessible;
                setUpLayerSelector();
            }
        }).bind(this);

        this.shiftCommands[68] = (e) => {
            if(e.type.includes('up')) {
                toggleDarkMode();
            }
        };

        this.shiftCommands[70] = ((e) => {
            if(e.type.includes('up')) {
                this.view.useFlatColors = !this.view.useFlatColors;
            }
        }).bind(this);

        this.shiftCommands[71] = ((e) => {
            if(e.type.includes('down')) {
                this.placeTerminal(e, this.diagram.gndCell);
            }
        }).bind(this);

        this.shiftCommands[86] = ((e) => {
            if(e.type.includes('down')) {
                this.placeTerminal(e, this.diagram.vddCell);
            }
        }).bind(this);
    }

    removeTerminal(isOutput) {
        'use strict';
        let termArr, netArr, removedTerm;

        if(isOutput) {
            termArr = this.diagram.outputs;
            netArr  = this.diagram.outputNets;
            removedTerm = termArr.shift();
            netArr.shift();
        } else {
            termArr = this.diagram.inputs;
            netArr  = this.diagram.inputNets;
            removedTerm = termArr.pop();
            netArr.pop();
        }

        if(removedTerm !== undefined) {
            this.diagram.layeredGrid.clear(removedTerm.x, removedTerm.y, Diagram.CONTACT);
        }

        populateTermSelect();
    }

    addTerminal(isOutput) {
        'use strict';
        let termArr, netArr, newTerm, name;

        if(this.diagram.inputs.length + this.diagram.outputs.length >= Diagram.maxTerminals) {
            return;
        }

        if(isOutput) {
            termArr = this.diagram.outputs;
            netArr  = this.diagram.outputNets;
            name = String.fromCharCode(89 - this.diagram.outputs.length);
            termArr.unshift({
                x: this.diagram.layeredGrid.width - 1,
                y: Math.floor(this.diagram.layeredGrid.height/2),
            });
            newTerm = termArr[0];
            this.placeTerminal(newTerm, newTerm, true);
            netArr.unshift(new Net(name, false));
        } else {
            termArr = this.diagram.inputs;
            netArr  = this.diagram.inputNets;
            name = String.fromCharCode(65 + this.diagram.inputs.length);
            termArr.push({
                x: 0,
                y: Math.floor(this.diagram.layeredGrid.height/2),
            });
            newTerm = termArr[termArr.length - 1];
            this.placeTerminal(newTerm, newTerm, true);
            netArr.push(new Net(name, true));
        }

        populateTermSelect();
    }

    setPlaceTerminalMode(terminalNumber) {
        'use strict';
        // Concatenate diagram.inputs, diagram.outputs, diagram.vddCell, and diagram.gndCell.
        let terminals = this.diagram.getTerminals();
        this.placeTermMode = true;
        this.selectedTerminal = terminals[terminalNumber];
    }

    clearPlaceTerminalMode() {
        'use strict';
        this.placeTermMode = false;
        clearPlaceTerminalMode();
    }

    // Toggle if mode is not provided.
    setEraseMode(mode) {
        'use strict';
        if(mode !== undefined) {
            this.eraseMode = mode;
        }
        else {
            this.eraseMode = !this.eraseMode;
        }
    }

    isEraseEvent(event) {
        'use strict';
        return this.eraseMode || event.button === 2 || event.buttons === 2;
    }

    // Save function to save the current state of the grid and the canvas.
    // Increment save state so we can maintain an undo buffer.
    saveCurrentState() {
        'use strict';
        // Save both the grid and the drawing.
        localStorage.setItem('layeredGrid' + this.saveState, JSON.stringify(this.diagram.layeredGrid.grid));

        // Increment the save state.
        this.saveState++;

        // Delete all save states after the current one.
        for (let ii = this.saveState; ii < this.lastSaveState; ii++) {
            localStorage.removeItem('layeredGrid' + ii);
        }

        // Update the max save state.
        this.lastSaveState = this.saveState;

        // If we've reached the max save state, delete the oldest one.
        if (this.maxSaveState === this.saveState) {
            localStorage.removeItem('layeredGrid' + this.firstSaveState);

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
            this.diagram.layeredGrid.grid = JSON.parse(localStorage.getItem('layeredGrid' + this.saveState));
        }
    }

    // Redo by going forward to the next save state (if there is one) and redrawing the canvas.
    redo() {
        'use strict';
        if (this.saveState < this.lastSaveState - 1) {
            this.saveState++;
            this.diagram.layeredGrid.grid = JSON.parse(localStorage.getItem('layeredGrid' + this.saveState));
        }
    }

    inBounds(screenX, screenY) {
        'use strict';
        let boundingBox = this.view.canvas.getBoundingClientRect();
        return screenX > boundingBox.left &&
               screenX < boundingBox.right &&
               screenY > boundingBox.top &&
               screenY < boundingBox.bottom;
    }

    getCellAtCursor(screenX, screenY) {
        'use strict';
        // Ignore if not inside the canvas
        if (this.inBounds(screenX, screenY)) {

            let x = Math.floor((screenX - this.view.canvas.getBoundingClientRect().left - this.view.cellWidth) / this.view.cellWidth);
            let y = Math.floor((screenY - this.view.canvas.getBoundingClientRect().top - this.view.cellHeight) / this.view.cellHeight);
            return { x: x, y: y, };
        }
        return null;
    }

    clearIfPainted(clientX, clientY) {
        'use strict';

        // Set a variable to true if any of the layers are set.
        let anyLayerSet = false;

        // Ignore if not inside the canvas
        if (this.inBounds(clientX, clientY)) {
            let x = Math.floor((clientX - this.view.canvas.getBoundingClientRect().left - this.view.cellWidth) / this.view.cellWidth);
            let y = Math.floor((clientY - this.view.canvas.getBoundingClientRect().top - this.view.cellHeight) / this.view.cellHeight);

            // Erase all layers of the cell.
            Diagram.layers.forEach(function (_, layer) {
                if (this.diagram.layeredGrid.get(x, y, layer).isSet) {
                    if (!anyLayerSet) { this.saveCurrentState(); }
                    anyLayerSet = true;
                    this.diagram.layeredGrid.clear(x, y, layer);
                }
            }.bind(this));
        }

        return anyLayerSet;
    }

    draw(bounds) {
        'use strict';
        if (Math.abs(bounds.endX - this.startX) > Math.abs(bounds.endY - this.startY)) {
            bounds.lowLayer = bounds.highLayer = this.cursorIndex;
            bounds.bottom = bounds.top = this.startY;
            this.diagram.layeredGrid.map(bounds, function (x, y, layer) {
                this.diagram.layeredGrid.set(x, y, layer);
            }.bind(this), true);
        }
        // If the mouse moved more vertically than horizontally, draw a vertical line.
        else {
            bounds.lowLayer = bounds.highLayer = this.cursorIndex;
            bounds.right = bounds.left = this.startX;
            this.diagram.layeredGrid.map(bounds, function (x, y, layer) {
                this.diagram.layeredGrid.set(x, y, layer);
            }.bind(this), true);
        }
    }

    getCoordsFromEvent(event) {
        'use strict';
        let ret = {};

        if(event.clientX === undefined) {
            ret.x = event.changedTouches[0].clientX;
            ret.y = event.changedTouches[0].clientY;
        } else {
            ret.x = event.clientX;
            ret.y = event.clientY;
        }

        return ret;
    }

    isPrimaryInput(event) {
        'use strict';
        let isTouch      = event.type.includes('touch');
        let isLeftButton = (event.type === 'mousedown' || event.type === 'mouseup') && event.button === 0;
        isLeftButton     = isLeftButton || (event.type === 'mousemove' && event.buttons === 1);
        return isLeftButton || isTouch;
    }

    cellClickHandler(event) {
        'use strict';

        if(this.startX === -1) {
            return;
        }

        let coords = this.getCoordsFromEvent(event);

        if(this.placeTermMode) {
            this.clearPlaceTerminalMode();
            this.placeTerminal(event, this.selectedTerminal);
        } else if (!this.isEraseEvent(event)) {
            // Just fill in or delete the cell at the start coordinates.
            // If there is no cell at the start coordinates, change the cursor color.
            if (!this.diagram.layeredGrid.get(this.startX, this.startY, this.cursorIndex).isSet) { this.saveCurrentState(); }
            this.diagram.layeredGrid.set(this.startX, this.startY, this.cursorIndex);
        } else {
            // If in the canvas and over a colored cell, erase it.
            // Otherwise, change the layer.
            if (!(this.clearIfPainted(coords.x, coords.y) || this.eraseMode)) {
                this.changeLayer();
            }
        }
    }

    // Note the grid coordinates when the left or right mouse button is released.
    // If the left (or primary) button, use the start and end coordinates to make either a horizontal or vertical line.
    // If the right (or secondary) button, use the same coordinates to delete a line of cells.
    mouseupHandler(event) {
        'use strict';
        let coords = this.getCoordsFromEvent(event);

        if(this.inBounds(coords.x, coords.y)) {
            event.preventDefault();
        }
     
        if (this.isPrimaryInput(event) || event.button === 2) {
            if (this.dragging) {
                this.endDrag(coords.x, coords.y);
            } else if (this.inBounds(coords.x, coords.y)) {
                this.cellClickHandler(event);
            } else if(event.button === 2) {
                this.changeLayer();
            }
        }

        this.dragging = false;

        if(event.type.includes("touch")) {
            this.currentX = this.currentY = -1;
        }
    }

    dragPrimary(bounds) {
        'use strict';
        // If the mouse moved more horizontally than vertically,
        // draw a horizontal line.
        if (bounds.right - bounds.left > bounds.bottom - bounds.top) {
            bounds.lowLayer = bounds.highLayer = this.cursorIndex;
            bounds.bottom = bounds.top = this.startY;
            this.diagram.layeredGrid.map(bounds, function (x, y, layer) {
                this.diagram.layeredGrid.set(x, y, layer);
            }.bind(this), true);
        }
        // If the mouse moved more vertically than horizontally,
        // draw a vertical line.
        else {
            bounds.lowLayer = bounds.highLayer = this.cursorIndex;
            bounds.right = bounds.left = this.startX;
            this.diagram.layeredGrid.map(bounds, function (x, y, layer) {
                this.diagram.layeredGrid.set(x, y, layer);
            }.bind(this), true);
        }
    }

    dragSecondary(bounds) {
        'use strict';
        // Secondary mouse button (i.e. right click)
        // Highlight a rectangle of squares for deletion.
        bounds.lowLayer = bounds.highLayer = Diagram.DELETE;
        this.diagram.layeredGrid.map(bounds, function (x, y, layer) {
            this.diagram.layeredGrid.set(x, y, layer);
        }.bind(this), true);
    }

    drag(currentCell) {
        'use strict';
        if (this.startX === -1) {
            return;
        }

        if (!this.dragging) {
            // don't start dragging unless the mouse has moved outside the cell
            if(currentCell.x === this.startX && currentCell.y === this.startY) {
                return;
            }
            this.dragging = true;
            this.saveCurrentState();
        } else {
            // Continuously refresh to update the preview line.
            this.undo();
            this.saveCurrentState();
        }

        let endX = Math.floor((this.currentX - this.view.canvas.getBoundingClientRect().left - this.view.cellWidth) / this.view.cellWidth);
        let endY = Math.floor((this.currentY - this.view.canvas.getBoundingClientRect().top - this.view.cellHeight) / this.view.cellHeight);

        let bounds = {
            left: Math.min(this.startX, endX),
            right: Math.max(this.startX, endX),
            top: Math.min(this.startY, endY),
            bottom: Math.max(this.startY, endY),
        };

        if (!this.isEraseEvent(event)) {
            this.dragPrimary(bounds);
        } else {
            this.dragSecondary(bounds);
        }
    }

    endDrag(currentX, currentY) {
        'use strict';
        // If the mouse was released outside the canvas, undo and return.
        if(!this.inBounds(currentX, currentY)) {
            this.undo();
            return;
        }

        let endX = Math.floor((currentX - this.view.canvas.getBoundingClientRect().left - this.view.cellWidth) / this.view.cellWidth);
        let endY = Math.floor((currentY - this.view.canvas.getBoundingClientRect().top - this.view.cellHeight) / this.view.cellHeight);
        let bounds = {
            left: Math.min(this.startX, endX),
            right: Math.max(this.startX, endX),
            top: Math.min(this.startY, endY),
            bottom: Math.max(this.startY, endY),
            lowLayer: 0,
            highLayer: Diagram.layers.length - 1,
            endX: endX,
            endY: endY,
        };

        // For primary (i.e. left) mouse button:
        // If the mouse moved more horizontally than vertically, draw a horizontal line.
        if (!this.isEraseEvent(event)) {
            this.draw(bounds);
        } else {
            // For secondary (i.e. right) mouse button:
            // Delete a rectangle of squares
            this.diagram.layeredGrid.map(bounds, function (x, y, layer) {
                this.diagram.layeredGrid.clear(x, y, layer);
            }.bind(this));
        }
    }

    // Show a preview line when the user is dragging the mouse.
    mousemoveHandler(event) {
        'use strict';
        let coords = this.getCoordsFromEvent(event);

        if(this.inBounds(coords.x, coords.y)) {
            event.preventDefault();
        }

        if(event.type.includes("mouse")) {
            this.view.trailCursor = true;
        }

        // Save the current X and Y coordinates.
        this.currentX = coords.x;
        this.currentY = coords.y;
        let currentCell = this.getCellAtCursor(this.currentX, this.currentY);

        // If the mouse is pressed and the mouse is between cells 1 and gridsize - 1,
        if (this.isPrimaryInput(event) || event.buttons === 2) {
            // Ignore if not inside the canvas
            if (this.inBounds(coords.x, coords.y)) {
                this.drag(currentCell);
            }
        }
    }

    placeTerminal(event, terminal, useGridCoords) {
        'use strict';
        let cell;
        let oldX, oldY;

        if(useGridCoords) {
            cell = terminal;
        } else {
            cell = this.getCellAtCursor(this.currentX, this.currentY);
        }

        if (cell !== null && !event.ctrlKey) {
            // First, note the current coordinates.
            oldX = terminal.x;
            oldY = terminal.y;
            // Then, set the new coordinates.
            terminal.x = cell.x;
            terminal.y = cell.y;
            // Set the Diagram.CONTACT layer at the new coordinates.
            this.diagram.layeredGrid.set(cell.x, cell.y, Diagram.CONTACT);
            // Unset the Diagram.CONTACT layer at the old coordinates.
            this.diagram.layeredGrid.clear(oldX, oldY, Diagram.CONTACT);
        }
    }

    // Change the layer/cursor color
    // layerIndex is optional; if not provided, the next layer is used
    changeLayer(layerIndex) {
        'use strict';
        if(layerIndex === undefined) {
            // Go to the next selectable index.
            let tempIndex = this.cursorIndex + 1;

            while(tempIndex >= Diagram.layers.length || !Diagram.layers[tempIndex].selectable) {
                tempIndex = tempIndex >= Diagram.layers.length - 1 ? 0 : tempIndex + 1;
            }
            this.cursorIndex = tempIndex;

            // set the outer border of the canvas to the new cursor color
            this.view.drawBorder();
        } else {
            this.cursorIndex = layerIndex;
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
        if(!document.getElementById("main-menu").classList.contains("closed")) {
            return;
        }
        let isInput  = (keyCode) => { return (keyCode >= 65) && (keyCode < 65 + this.diagram.inputs.length );    }; // Y, X, W, ...
        let isOutput = (keyCode) => { return (keyCode <= 89) && (keyCode > 89 - this.diagram.outputs.length);    }; // A, B, C, ...
        // GND and VDD are handled in shiftCommandHandler.

        if (event.shiftKey && this.shiftCommands[event.keyCode]) { this.shiftCommands[event.keyCode](event); }
        else if (event.ctrlKey)           { this.ctrlCommandHandler(event); }
        else if (isInput(event.keyCode))  { this.placeTerminal(event, this.diagram.inputs[event.keyCode - 65]); }
        else if (isOutput(event.keyCode)) {
            this.placeTerminal(event, this.diagram.outputs[this.diagram.outputs.length - 90 + event.keyCode]);
        }
    }

    // Note the grid coordinates when the left mouse button is pressed.
    // Store the coordinates in startX and startY.
    mousedownHandler(event) {
        'use strict';
        let clientX, clientY;
        let coords = this.getCoordsFromEvent(event);

        clientX = coords.x;
        clientY = coords.y;

        if (this.isPrimaryInput(event) || event.button === 2) {
            // Return if not between cells 1 and gridsize - 1
            if (this.inBounds(clientX, clientY)) {
                event.preventDefault();
                this.startX = Math.floor((clientX - this.view.canvas.getBoundingClientRect().left - this.view.cellWidth) / this.view.cellWidth);
                this.startY = Math.floor((clientY - this.view.canvas.getBoundingClientRect().top - this.view.cellHeight) / this.view.cellHeight);
            } else {
                this.startX = -1;
                this.startY = -1;
            }
        }
    }

    // Only change dark/light mode on keyup to avoid seizure-inducing flashes from holding down space.
    keyupHandler(event) {
        'use strict';
        if(document.getElementById("main-menu").classList.contains("closed")) {
            // Only do the following if shift is pressed.
            if (event.shiftKey && this.shiftCommands[event.keyCode]) {
                // Run the registered shift command.
                this.shiftCommands[event.keyCode](event);
            }

            // Update the truth table by pressing enter.
            if (event.keyCode === 13) {
                refreshTruthTable();
            }
        }

        // Close the top window by pressing escape.
        if (event.keyCode === 27) {
            closeTopMenu();
        }
    }
}

class DiagramView {
    constructor(diagram, mainCanvas, gridCanvas) {
        'use strict';
        this.diagram = diagram;
        this.canvas = mainCanvas;
        this.gridCanvas = gridCanvas;
        this.ctx = this.canvas.getContext("2d");
        this.gridCtx = this.gridCanvas.getContext('2d');
        this.canvasWidth = Math.min(document.getElementById('canvas-container').clientWidth, document.getElementById('canvas-container').clientHeight);
        this.canvasHeight = this.canvasWidth;
        this.cellWidth  = this.canvasWidth  / (this.diagram.layeredGrid.width  + 2);
        this.cellHeight = this.canvasHeight / (this.diagram.layeredGrid.height + 2);
        this.useFlatColors = false;
        this.accessible = true;
        this.trailCursor = false;
        this.highlightNets = false;
        this.netHighlightGrid = [];
    }
    
    // Draw a faint grid on the canvas.
    // Add an extra 2 units to the width and height for a border.
    drawGrid() {
        'use strict';
        // Place the grid canvas behind the main canvas.
        // Same size as the canvas.
        this.gridCanvas.width = this.canvasWidth;
        this.gridCanvas.height = this.canvasHeight;
        this.gridCanvas.style.width = this.canvasWidth + 'px';
        this.gridCanvas.style.height = this.canvasHeight + 'px';
        this.gridCanvas.style.position = 'absolute';
        this.gridCanvas.style.left = this.canvas.offsetLeft + 'px';
        this.gridCanvas.style.top = this.canvas.offsetTop + 'px';
        this.gridCanvas.style.zIndex = -1;

        // Set the gridCanvas context.
        this.cellWidth = this.canvasWidth / (this.diagram.layeredGrid.width + 2);
        this.cellHeight = this.canvasHeight / (this.diagram.layeredGrid.height + 2);

        // Clear the grid canvas.
        this.gridCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

        // Set stroke color depending on whether the dark mode is on or off.
        // Should be faintly visible in both modes.
        if (darkMode) {
            this.gridCtx.strokeStyle = darkModeGridColor;
        } else {
            this.gridCtx.strokeStyle = lightModeGridColor;
        }

        for (let ii = 1; ii <= Math.max(this.diagram.layeredGrid.width, this.diagram.layeredGrid.height); ii++) {
            if(ii <= this.diagram.layeredGrid.width) {
                this.gridCtx.beginPath();
                this.gridCtx.moveTo(ii * this.cellWidth, this.cellHeight);
                this.gridCtx.lineTo(ii * this.cellWidth, this.gridCanvas.height - this.cellHeight);
                this.gridCtx.stroke();
            }
            if(ii <= this.diagram.layeredGrid.height) {
                this.gridCtx.beginPath();
                this.gridCtx.moveTo(this.cellWidth, ii * this.cellHeight);
                this.gridCtx.lineTo(this.canvasWidth - this.cellWidth, ii * this.cellHeight);
                this.gridCtx.stroke();
            }
        }
    }

    getColor(layer, flat) {
        'use strict';
        let layerObj = Diagram.layers[layer];
        let color = this.accessible ? layerObj.friendlyColor : layerObj.color;

        if(flat || (flat !== false && this.useFlatColors)) {
            // Convert from rgba to rgb.
            // I like regex.
            return color.replace(/(a|,[\s\d\.]+(?=\)))/gu,'');
        }
        else {
            return color;
        }
    }
    
    // Draw the outer border of the canvas.
    drawBorder() {
        'use strict';
        if(this.diagram.controller.eraseMode) {
            this.ctx.strokeStyle = this.getColor(Diagram.DELETE);
        } else {
            this.ctx.strokeStyle = this.getColor(this.diagram.controller.cursorIndex);
        }
        this.ctx.lineWidth = this.cellWidth;
        this.ctx.strokeRect(this.cellWidth / 2, this.cellWidth / 2, this.canvasWidth - this.cellWidth, this.canvas.height - this.cellWidth);

        // Draw a thick border on the edge of the border drawn above.
        this.ctx.lineWidth = this.cellWidth / 4;
        this.ctx.strokeStyle = darkMode ? "#ffffff" : "#000000";
        this.ctx.strokeRect(1 + this.cellWidth - this.ctx.lineWidth / 2,
            1 + this.cellHeight - this.ctx.lineWidth / 2,
            this.canvasWidth - 2 * this.cellWidth + this.ctx.lineWidth / 2,
            this.canvasHeight - 2 * this.cellHeight + this.ctx.lineWidth / 2
        );

        // For the middle 11 cells of the upper border, fill with the grid color.
        this.ctx.fillStyle = darkMode ? "#ffffff" : "#000000";
        let startCell = Math.floor(this.diagram.layeredGrid.width / 2) - 4;
        this.ctx.fillRect(startCell * this.cellWidth, 0, this.cellWidth * 11, this.cellHeight);

        // Write the cursor color name in the middle of the upper border of the canvas.
        this.ctx.fillStyle = darkMode ? '#000000' : '#ffffff';
        this.ctx.font = Math.floor(this.cellHeight) + 'px Arial';
        this.ctx.textAlign = 'center';

        if(this.diagram.controller.eraseMode) {
            this.ctx.fillText('erase', this.canvasWidth / 2, this.cellHeight * 3 / 4);
        } else {
            this.ctx.fillText(Diagram.layers[this.diagram.controller.cursorIndex].name, this.canvasWidth / 2, this.cellHeight * 3 / 4);
        }
    }

    // Resize the canvas to the largest square that fits in the window.
    resizeCanvas() {
        'use strict';
        if(window.innerWidth > window.innerHeight &&
            Math.min(window.innerHeight, window.innerWidth) * 0.95 + 300 > window.innerWidth) {
            if(!document.body.classList.contains('no-controls')) {
                document.body.classList.add('no-controls');
            }
        } else if(document.body.classList.contains('no-controls')) {
            document.body.classList.remove('no-controls');
        }

        let containerWidth = document.getElementById('canvas-container').clientWidth;
        let containerHeight = document.getElementById('canvas-container').clientHeight;
        let containerSize = Math.min(containerWidth, containerHeight);
        //let sizeChanged = this.canvasWidth !== containerSize || this.canvasHeight !== containerSize;
       
        this.canvas.width = containerSize;
        this.canvas.height = containerSize;
        this.canvas.style.width = containerSize + 'px';
        this.canvas.style.width = containerSize + 'px';
        this.canvasWidth = containerSize;
        this.canvasHeight = containerSize;

        this.drawGrid();
        /*if(sizeChanged) {
            this.drawGrid();
        }*/
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
        this.ctx.font = "bold " + Math.floor(this.cellHeight) + "px Arial";
        this.ctx.fillStyle = darkMode ? "#ffffff" : "#000000";

        // Draw labels for all terminals.
        this.diagram.getTerminals().forEach(((terminal, index) => {
            this.ctx.fillText(this.diagram.getTerminalName(index),
                this.cellWidth  * (terminal.x + 1.5),
                this.cellHeight * (terminal.y + 0.75));
        }).bind(this));
    }

    // Check the layers of the grid, and draw cells as needed.
    drawCell(ii, jj, layer) {
        'use strict';
        let currentCell;
        let baseColor;

        if (this.diagram.layeredGrid.get(ii, jj, layer).isSet) {
            this.ctx.fillStyle = this.getColor(layer);
            this.ctx.fillRect((ii+1) * this.cellWidth, (jj+1) * this.cellHeight - 1, this.cellWidth + 1, this.cellHeight + 2);
        } else if(!this.diagram.controller.dragging && layer === Diagram.layers.length - 1) {
            // Draw a faint highlight on the cell at the cursor location.
            currentCell = this.diagram.controller.getCellAtCursor(this.diagram.controller.currentX, this.diagram.controller.currentY);
            if(ii === currentCell.x && jj === currentCell.y) {
                this.ctx.fillStyle = darkMode ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)";
                this.ctx.fillRect((ii+1) * this.cellWidth, (jj+1) * this.cellHeight - 1, this.cellWidth + 1, this.cellHeight + 2);
            }
        }
        if(this.highlightNets && this.netHighlightGrid[ii] && this.netHighlightGrid[ii][jj]) {
            baseColor = this.getColor(Diagram.DELETE, false).slice(0, -4);
            this.ctx.fillStyle = baseColor + 
                                 Math.round(
                                    Math.sin(
                                        (Math.floor(Date.now()/100) % 10) * Math.PI / 10
                                    ) * 10
                                 ) / 10 + ")";
            this.ctx.fillRect((ii+1) * this.cellWidth, (jj+1) * this.cellHeight - 1, this.cellWidth + 1, this.cellHeight + 2);
        }
    }

    setHighlight(path) {
        'use strict';
        this.netHighlightGrid.length = 0;

        for(let ii = 0; ii < this.diagram.layeredGrid.width; ii++) {
            this.netHighlightGrid[ii] = [];
        }

        for(let ii = 0; ii < path.length; ii++) {
            if(!path[ii]) {
                continue;
            }
            for(let jj = 0; jj < this.diagram.netlist.length; jj++) {
                if(this.diagram.netlist[jj].containsNode(this.diagram.graph.nodes[ii])) {
                    let cellIter = this.diagram.netlist[jj].cells.values();
                    for(let cell = cellIter.next(); !cell.done; cell = cellIter.next()) {
                        this.netHighlightGrid[cell.value.x][cell.value.y] = true;
                    }
                }
            }
        }

        this.highlightNets = true;
    }

    // Initialize everything
    refreshCanvas() {
        'use strict';
        this.resizeCanvas();

        let currentCell = this.diagram.controller.getCellAtCursor(this.diagram.controller.currentX, this.diagram.controller.currentY);

        // Draw each layer in order.
        let bounds = {
            left: 0,
            right: this.diagram.layeredGrid.width - 1,
            top: 0,
            bottom: this.diagram.layeredGrid.height - 1,
            lowLayer: 0,
            highLayer: this.diagram.layeredGrid.layers - 1,
            cursor: this.trailCursor ? currentCell : undefined,
        };

        this.diagram.layeredGrid.map(bounds, function (x, y, layer) {
            this.drawCell(x, y, layer);

            // For the last layer, fill each filled cell with a cross.
            if (layer === Diagram.CONTACT) {
                if (this.diagram.layeredGrid.get(x, y, layer).isSet) {
                    this.decorateContact(x, y);
                }
            }
        }.bind(this));

        // set the outer border of the canvas to the cursor color
        this.drawBorder();
        this.drawLabels();
        window.requestAnimationFrame(this.refreshCanvas.bind(this));
    }
}

class LayeredGrid {
    constructor(diagram, width, height, layers) {
        'use strict';
        this.diagram = diagram;
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
        'use strict';
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
        'use strict';
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

        // Only allow one of Diagram.NDIFF or Diagram.PDIFF to be set
        if(layer === Diagram.PDIFF) {
            this.clear(x, y, Diagram.NDIFF);
        } else if(layer === Diagram.NDIFF) {
            this.clear(x, y, Diagram.PDIFF);
        }
    }

    isTerminal(x, y, layer) {
        'use strict';
        let isTerminal = false;

        // Loop through inputs, outputs, and VDD/GND
        isTerminal = layer === Diagram.CONTACT && this.diagram.inputs.some(function(input) {
            return input.x === x && input.y === y;
        });

        isTerminal = isTerminal || layer === Diagram.CONTACT && this.diagram.outputs.some(function(output) {
            return output.x === x && output.y === y;
        });

        isTerminal = isTerminal || this.diagram.vddCell.x === x && this.diagram.vddCell.y === y;
        isTerminal = isTerminal || this.diagram.gndCell.x === x && this.diagram.gndCell.y === y;

        return isTerminal;
    }

    // Clear the value at a given coordinate
    // If it's out of bounds, do nothing
    // Do not clear Diagram.CONTACT for inputs, outputs, or VDD/GND
    clear(x, y, layer) {
        'use strict';
        let outOfBounds = x < 0 || x >= this.width || y < 0 || y >= this.height || layer < 0 || layer >= this.layers;

        if(outOfBounds || layer === Diagram.CONTACT && this.isTerminal(x, y, layer)) {
            return;
        }

        this.grid[x + (y * this.width) + (layer * this.width * this.height)] = null;
    }

    // The grid is implemented as a flat array, so this function
    // returns the index of the cell at a given coordinate
    convertFromCoordinates(x, y, layer) {
        'use strict';
        return x + (y * this.width) + (layer * this.width * this.height);
    }

    // Convert the index of a cell to its coordinates
    convertToCoordinates(index) {
        'use strict';
        let layer = Math.floor(index / (this.width * this.height));
        let y = Math.floor((index - (layer * this.width * this.height)) / this.width);
        let x = index - (layer * this.width * this.height) - (y * this.width);
        return { x: x, y: y, layer: layer, };
    }

    // Map a function to all set values in the grid
    map(bounds, func, includeEmpty) {
        'use strict';
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
                    if(cell || includeEmpty || (bounds.cursor && bounds.cursor.x === x && bounds.cursor.y === y)) {
                        func(x, y, layer);
                    }
                }
            }
        }
    }

    // Clear all values in the grid
    clearAll() {
        'use strict';
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

    moveWithinBounds(cell, bounds) {
        'use strict';
        if(cell.x < bounds.left) {
            cell.x = bounds.left;
        } else if(cell.x > bounds.right) {
            cell.x = bounds.right;
        }

        if(cell.y < bounds.top) {
            cell.y = bounds.top;
        } else if(cell.y > bounds.bottom) {
            cell.y = bounds.bottom;
        }

        this.set(cell.x, cell.y, Diagram.CONTACT);
    }

    // Change the height of the grid
    resize(width, height) {
        'use strict';
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
        let oldBounds = {
            left: 0,
            right: Math.min(this.width - 1, oldWidth - 1),
            top: 0,
            bottom: Math.min(this.height - 1, oldHeight - 1),
            lowLayer: 0,
            highLayer: this.layers - 1,
        };

        let newBounds = {
            left: 0,
            right: this.width - 1,
            top: 0,
            bottom: this.height - 1,
        }; // layer information unneeded
    
        for(let layer = oldBounds.lowLayer; layer <= oldBounds.highLayer; layer++) {
            for(let y = oldBounds.top; y <= oldBounds.bottom; y++) {
                for(let x = oldBounds.left; x <= oldBounds.right; x++) {
                    this.grid[this.convertFromCoordinates(x, y, layer)] = oldGrid[x + (y * oldWidth) + (layer * oldWidth * oldHeight)];
                }
            }
        }

        // Move inputs, outputs, and VDD/GND if they are outside the new grid
        this.diagram.inputs.forEach(function(input) {
            this.moveWithinBounds(input, newBounds);
        }.bind(this));
        this.diagram.outputs.forEach(function(output) {
            this.moveWithinBounds(output, newBounds);
        }.bind(this));
        this.moveWithinBounds(this.diagram.vddCell, newBounds);
        this.moveWithinBounds(this.diagram.gndCell, newBounds);
    }

    // Shift the grid by a given offset
    shift(xOffset, yOffset) {
        'use strict';
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
        'use strict';
        let shiftTerminal = function(terminal) {
            if(terminal.x + xOffset >= 0 && terminal.x + xOffset < this.width) {
                terminal.x += xOffset;
            } else if(terminal.x + xOffset < 0) {
                terminal.x = 0;
            } else {
                terminal.x = this.width - 1;
            }
            if(terminal.y + yOffset >= 0 && terminal.y + yOffset < this.height) {
                terminal.y += yOffset;
            } else if(terminal.y + yOffset < 0) {
                terminal.y = 0;
            } else {
                terminal.y = this.height - 1;
            }

            // Make sure there is still a Diagram.CONTACT at the new coordinates
            // (may have shifted off the screen)
            this.set(terminal.x, terminal.y, Diagram.CONTACT);
        }.bind(this);

        this.diagram.inputs.forEach(function(input) {
            shiftTerminal(input);
        }.bind(this));

        this.diagram.outputs.forEach(function(output) {
            shiftTerminal(output);
        }.bind(this));

        shiftTerminal(this.diagram.vddCell);
        shiftTerminal(this.diagram.gndCell);
    }
}

// Graph class to represent CMOS circuitry.
class Graph {
    constructor() {
        'use strict';
        this.nodes = [];
    }

    // Clear the diagram.graph.
    clear() {
        'use strict';
        // Destroy all nodes.
        for (let ii = 0; ii < this.nodes.length; ii++) {
            this.nodes[ii].destroy();
        }

        this.nodes.length = 0;
    }

   // Add a node to the diagram.graph.
    addNode(cell, suppressTransistor) {
        'use strict';
        let node = new Node(cell, suppressTransistor);
        this.nodes.push(node);
        return node;
    }

    // Return the node with the given cell.
    getNode(cell) {
        'use strict';
        for (let node of this.nodes) {
            if (node.cell === cell) {
                return node;
            }
        }
        return null;
    }

    getIndexByNode(node) {
        'use strict';
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
    constructor(cell, suppressTransistor) {
        'use strict';
        this.cell = cell;
        this.edges = [];
        this.isPmos = !suppressTransistor && diagram.layeredGrid.get(cell.x, cell.y, Diagram.PDIFF).isSet;
        this.isNmos = !suppressTransistor && diagram.layeredGrid.get(cell.x, cell.y, Diagram.NDIFF).isSet;
    }

    // Destructor
    destroy() {
        'use strict';
        this.edges.forEach((edge) => {edge.destroy();});
        this.cell = undefined;
        this.edges.length = 0;
    }

    // Check if two nodes are connected.
    isConnected(otherNode) {
        'use strict';
        for (let ii = 0; ii < this.edges.length; ii++) {
            if (this.edges[ii].getNode1() === otherNode || this.edges[ii].getNode2() === otherNode) {
                return true;
            }
        }
        return false;
    }
 
    isTransistor() {
        'use strict';
        return this.isPmos || this.isNmos;
    }

    addEdge(node) {
        'use strict';
        let edge = new Edge(this, node);
        this.edges.push(edge);
        node.edges.push(edge);
    }

    removeEdge(edge) {
        'use strict';
        let index = this.edges.indexOf(edge);
        if (index > -1) {
            this.edges.splice(index, 1);
        }
    }

    getName() {
        'use strict';
        return this.cell.gate.name;
    }
}

// Each edge is a connection between two diagram.graph nodes.
class Edge {
    constructor(node1, node2) {
        'use strict';
        this.node1 = node1;
        this.node2 = node2;
    }

    // Destructor
    destroy() {
        'use strict';
        this.node1 = undefined;
        this.node2 = undefined;
    }

    getNode1() {
        'use strict';
        return this.node1;
    }

    getNode2() {
        'use strict';
        return this.node2;
    }

    getOtherNode(node) {
        'use strict';
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
        'use strict';
        this.name = name;
        this.cells = new Set();
        this.nodes = new Set();
        this.isInput = isInput;
    }

    isIdentical(net) {
        'use strict';
        // Two nets are identical if they have the same set of cells.
        // By design, if two nets share even one cell, then they share all cells.
        // So, we can just check a single cell.
        let cell = this.cells.values().next().value;
        return net.cells.has(cell);
    }

    addNode(node) {
        'use strict';
        if(node !== null && !this.containsNode(node)) {
            let nodeIterator = this.nodes.values();

            // Loop through net's nodes.
            for (let node2 = nodeIterator.next(); !node2.done; node2 = nodeIterator.next()) {
                node.addEdge(node2.value);
            }

            this.nodes.add(node);
        }
    }

    removeNode(node) {
        'use strict';
        this.nodes.delete(node);
    }

    containsNode(node) {
        'use strict';
        return this.nodes.has(node);
    }

    clear() {
        'use strict';
        this.cells.clear();
        this.nodes.clear();
    }

    addCell(cell) {
        'use strict';
        this.cells.add(cell);
    }

    containsCell(cell) {
        'use strict';
        return this.cells.has(cell);
    }

    size() {
        'use strict';
        return this.nodes.size;
    }
}

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
    let terminals  = diagram.getTerminals().slice(2);
    let table      = [];
    let header     = [];
    let inputVals  = [];
    let outputVals = [];
    diagram.clearAnalyses();

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
    terminals.forEach(function(terminal, index) {
        header[index] = diagram.getTerminalName(index + 2);
    });

    // Merge input and output into one table (input on the left, output on the right.)
    table[0] = header;
    for (let ii = 0; ii < inputVals.length; ii++) {
        // Reverse the inputs so that A is on the left.
        table[ii + 1] = inputVals[ii].reverse().concat(outputVals[ii]);
    }

    return table;
}

// Table is a 2D array of single character strings.
function refreshTruthTable(suppressSetNets) {
    'use strict';
    // Update the diagram.netlist.
    if(!suppressSetNets) {
        diagram.setNets();
    }

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
            if(colIndex < diagram.inputs.length) {
                tCell.className = "input";
            } else {
                tCell.className = "output";
                tCell.onmouseover = ((rowIndex, colIndex) => {
                    return (() => {
                        let path, outputNum, outputNodeIndex;
                        outputNum = colIndex - diagram.inputs.length;
                        outputNodeIndex = diagram.graph.getIndexByNode(diagram.outputNodes[outputNum]);
                        path = diagram.analyses[rowIndex - 1][outputNodeIndex];
                        diagram.view.setHighlight(path);
                    });
                })(rowIndex, colIndex);
                tCell.onmouseleave = function () {
                    diagram.view.highlightNets = false;
                };
            }
        });
    });

    window.scrollTo({behavior: "smooth", top: Math.ceil(tableElement.getBoundingClientRect().top + window.scrollY), left: 0,});
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
    darkMode = !darkMode;

    if (darkMode) {
        document.body.classList.add('dark');
        document.body.classList.remove('light');
        document.getElementById('dark-mode-btn').classList.remove('fa-cloud-moon');
        document.getElementById('dark-mode-btn').classList.add('fa-sun');
    } else {
        document.body.classList.add('light');
        document.body.classList.remove('dark');
        document.getElementById('dark-mode-btn').classList.remove('fa-sun');
        document.getElementById('dark-mode-btn').classList.add('fa-cloud-moon');
    }
}

function setUpLayerSelector() {
    'use strict'; 

    // Loop through all layer select buttons.
    Array.from(document.getElementById("colorChange").children).forEach(function(element, index) {

        // Set up the onclick event if not already set.
        if(!element.onclick) {
            element.onclick = function() {
                let paintModeButton = document.getElementById("paint-mode-btn");

                this.controller.changeLayer(index);

                // Set the icon.
                if (this.controller.eraseMode) {
                    paintModeButton.classList.remove('fa-eraser');
                    paintModeButton.classList.add('fa-paint-brush');
                }

                diagram.controller.setEraseMode(false);
            }.bind(this);
        }

        // Color with flat color (rgb, not rgba).
        element.style.color = diagram.view.getColor(index);
    }.bind(diagram));
}

function setUpControls() {
    'use strict';
    document.getElementById("remove-row").onclick = function() {
        this.layeredGrid.resize(this.layeredGrid.width, this.layeredGrid.height - 1);
        document.getElementById("num-rows").innerHTML = this.layeredGrid.height;
        this.view.drawGrid();
    }.bind(diagram);

    document.getElementById("add-row").onclick = function() {
        this.layeredGrid.resize(this.layeredGrid.width, this.layeredGrid.height + 1);
        document.getElementById("num-rows").innerHTML = this.layeredGrid.height;
        this.view.drawGrid();
    }.bind(diagram);

    document.getElementById("remove-column").onclick = function() {
        this.layeredGrid.resize(this.layeredGrid.width - 1, this.layeredGrid.height);
        document.getElementById("num-cols").innerHTML = this.layeredGrid.width;
        this.view.drawGrid();
    }.bind(diagram);

    document.getElementById("add-column").onclick = function() {
        this.layeredGrid.resize(this.layeredGrid.width + 1, this.layeredGrid.height);
        document.getElementById("num-cols").innerHTML = this.layeredGrid.width;
        this.view.drawGrid();
    }.bind(diagram);

    document.getElementById("shift-left").onclick = function() {
        this.layeredGrid.shift(-1, 0);
    }.bind(diagram);

    document.getElementById("shift-right").onclick = function() {
        this.layeredGrid.shift(1, 0);
    }.bind(diagram);

    document.getElementById("shift-up").onclick = function() {
        this.layeredGrid.shift(0, -1);
    }.bind(diagram);

    document.getElementById("shift-down").onclick = function() {
        this.layeredGrid.shift(0, 1);
    }.bind(diagram);

    document.getElementById("paint-mode-btn").onclick = function() {
        // No argument -> Toggle
        this.controller.setEraseMode();

        // Set the icon.
        let paintModeButton = document.getElementById("paint-mode-btn");

        if (this.controller.eraseMode) {
            paintModeButton.classList.remove('fa-paint-brush');
            paintModeButton.classList.add('fa-eraser');
        } else {
            paintModeButton.classList.remove('fa-eraser');
            paintModeButton.classList.add('fa-paint-brush');
        }
    }.bind(diagram);

    document.getElementById("dark-mode-btn").onclick = function() {
        toggleDarkMode();
    };

    document.getElementById("undo-btn").onclick = function() {
        this.controller.undo();
    }.bind(diagram);

    document.getElementById("redo-btn").onclick = function() {
        this.controller.redo();
    }.bind(diagram);

    document.getElementById("term-menu-btn").onclick = function() {
        let termMenu = document.getElementById("terminal-menu");
        if(termMenu.classList.contains("closed")) {
            termMenu.classList.remove("closed");
        }
    };

    document.getElementById("main-menu-btn").onclick = function() {
        let mainMenu = document.getElementById("main-menu");
        if(mainMenu.classList.contains("closed")) {
            mainMenu.classList.remove("closed");
        }
    };

    document.getElementById("open-instructions-btn").onclick = function() {
        let instructions = document.getElementById("instructions");
        if(instructions.classList.contains("closed")) {
            instructions.classList.remove("closed");
        }
    };

    document.getElementById("open-about-page-btn").onclick = function() {
        let instructions = document.getElementById("about-page");
        if(instructions.classList.contains("closed")) {
            instructions.classList.remove("closed");
        }
    };

    document.getElementById("open-options-btn").onclick = function() {
        let instructions = document.getElementById("options-menu");
        if(instructions.classList.contains("closed")) {
            instructions.classList.remove("closed");
        }
    };

    document.getElementById("close-term-menu-btn").onclick    = closeTermMenu;
    document.getElementById("close-main-menu-btn").onclick    = closeMainMenu;
    document.getElementById("close-instructions-btn").onclick = closeInstructions;
    document.getElementById("close-about-page-btn").onclick   = closeAboutPage;
    document.getElementById("close-options-btn").onclick      = closeOptionsMenu;

    document.getElementById("place-term-btn").onclick = function() {
        let placeTermButton = document.getElementById("place-term-btn");
        let term = document.querySelector('input[name="termselect"]:checked');

        if(placeTermButton.classList.contains("active")) {
            this.clearPlaceTerminalMode();
            return;
        }

        if(term === null) {
            return;
        }

        term = parseInt(term.value);
        this.setPlaceTerminalMode(term);
        placeTermButton.classList.add("active");

    }.bind(diagram.controller);

    document.getElementById('add-input-btn').onclick = function() {
        this.addTerminal(false);
    }.bind(diagram.controller);

    document.getElementById('remove-input-btn').onclick = function() {
        this.removeTerminal(false);
    }.bind(diagram.controller);

    document.getElementById('add-output-btn').onclick = function() {
        this.addTerminal(true);
    }.bind(diagram.controller);

    document.getElementById('remove-output-btn').onclick = function() {
        this.removeTerminal(true);
    }.bind(diagram.controller);

    document.getElementById('select-palette-btn').onclick = function() {
        this.accessible = !this.accessible;
        if(this.accessible) {
            document.getElementById('palette-setting').innerHTML = "Tol";
        } else {
            document.getElementById('palette-setting').innerHTML = "Sorcery";
        }
    }.bind(diagram.view);

    document.getElementById('toggle-transparency-btn').onclick = function() {
        this.useFlatColors = !this.useFlatColors;
        if(this.useFlatColors) {
            document.getElementById('transparency-setting').innerHTML = "ON";
        } else {
            document.getElementById('transparency-setting').innerHTML = "OFF";
        }
    }.bind(diagram.view);

    setUpLayerSelector();
}

function closeMainMenu() {
    'use strict';
    let mainMenu = document.getElementById("main-menu");
    if(!mainMenu.classList.contains("closed")) {
        mainMenu.classList.add("closed");
        return true;
    }
}

function closeInstructions() {
    'use strict';
    let instructions = document.getElementById("instructions");
    if(!instructions.classList.contains("closed")) {
        instructions.classList.add("closed");
        return true;
    }
}

function closeTermMenu() {
    'use strict';
    let termMenu = document.getElementById("terminal-menu");
    if(!termMenu.classList.contains("closed")) {
        termMenu.classList.add("closed");
        return true;
    }
}

function closeAboutPage() {
    'use strict';
    let aboutPage = document.getElementById("about-page");
    if(!aboutPage.classList.contains("closed")) {
        aboutPage.classList.add("closed");
        return true;
    }
}

function closeOptionsMenu() {
    'use strict';
    let optionsPage = document.getElementById("options-menu");
    if(!optionsPage.classList.contains("closed")) {
        optionsPage.classList.add("closed");
        return true;
    }
}

function closeTopMenu() {
    'use strict';
    closeAboutPage() || closeOptionsMenu() || closeInstructions() || closeMainMenu() || closeTermMenu();
}

function clearPlaceTerminalMode() {
    'use strict';
    let placeTermButton = document.getElementById("place-term-btn");
    placeTermButton.classList.remove("active");
}

// Fill in the termselect-list div with a radio button for each terminal.
function populateTermSelect() {
    'use strict';
    let termSelectList = document.getElementById("termselect-list");
    let terminals = diagram.getTerminals();

    // First, clear the list.
    termSelectList.innerHTML = "";

    for(let ii = 0; ii < terminals.length; ii++) {
        let termSelectItemLabel = document.createElement("label");
        let termSelectItemInput = document.createElement("input");

        // Set CSS style
        if(ii === 0) {
            termSelectItemLabel.classList.add("first");
        }
        if(ii === terminals.length - 1) {
            termSelectItemLabel.classList.add("last");
        }
        termSelectItemLabel.classList.add("clickable");

        termSelectItemInput.type = "radio";
        termSelectItemInput.name = "termselect";
        termSelectItemInput.value = ii;
        termSelectItemInput.id = "termselect-" + ii;

        termSelectItemLabel.innerHTML = diagram.getTerminalName(ii);
        termSelectItemLabel.htmlFor = termSelectItemInput.id;

        termSelectList.appendChild(termSelectItemInput);
        termSelectList.appendChild(termSelectItemLabel);
    }
}

window.onload = function () {
    'use strict';
    // Clear local storage
    localStorage.clear();
    diagram = new Diagram(document.getElementById("canvas"), document.getElementById("grid-canvas"));

    // Set to dark mode if it is night time
    setDarkMode(new Date().getHours() > 19 || new Date().getHours() < 7);

    // Some of these pertain the the canvas, but we don't know whether
    // it will be selected.
    
    window.addEventListener("touchend", function(e) {
        if(document.getElementById("main-menu").classList.contains("closed")) {
            this.mouseupHandler(e);
        }
    }.bind(diagram.controller));

    window.addEventListener("mouseup", function(e) {
        if(document.getElementById("main-menu").classList.contains("closed")) {
            this.mouseupHandler(e);
        }
    }.bind(diagram.controller));

    window.addEventListener("touchstart", function(e) {
        if(document.getElementById("main-menu").classList.contains("closed")) {
            this.mousedownHandler(e);
        }
    }.bind(diagram.controller));

    window.addEventListener("mousedown", function(e) {
        if(document.getElementById("main-menu").classList.contains("closed")) {
            this.mousedownHandler(e);
        }
    }.bind(diagram.controller));

    window.addEventListener("touchmove", function(e) {
        if(document.getElementById("main-menu").classList.contains("closed")) {
            this.mousemoveHandler(e);
        }
    }.bind(diagram.controller));

    window.addEventListener("mousemove", function(e) {
        if(document.getElementById("main-menu").classList.contains("closed")) {
            this.mousemoveHandler(e);
        }
    }.bind(diagram.controller));

    window.addEventListener("keydown", function(e) { this.keydownHandler(e); }.bind(diagram.controller));
    window.addEventListener("keyup", function(e) { this.keyupHandler(e); }.bind(diagram.controller));
    window.addEventListener("contextmenu", function(e) {
        if (e.button === 2) {
            // Don't show a context menu.
            e.preventDefault();
        }
    });

    // Set up the evaluate button.
    button = document.getElementById("evaluate-btn");
    button.onclick = function () {
        refreshTruthTable();
    };

    // Set Diagram.CONTACT at the coordinates of each input and output.
    diagram.inputs.forEach(function(input) {
        diagram.layeredGrid.set(input.x, input.y, Diagram.CONTACT);
    });
    diagram.outputs.forEach(function(output) {
        diagram.layeredGrid.set(output.x, output.y, Diagram.CONTACT);
    });

    // Set the Diagram.CONTACT layer on the VDD and GND cells.
    diagram.layeredGrid.set(diagram.vddCell.x, diagram.vddCell.y, Diagram.CONTACT);
    diagram.layeredGrid.set(diagram.gndCell.x, diagram.gndCell.y, Diagram.CONTACT);

    document.getElementById("num-rows").innerHTML = diagram.layeredGrid.height;
    document.getElementById("num-cols").innerHTML = diagram.layeredGrid.width;
    setUpControls();

    populateTermSelect();
    diagram.view.refreshCanvas();
    // 60 fps
    window.requestAnimationFrame(diagram.view.refreshCanvas.bind(diagram.view));

    if(window.runTestbench) {
        runTestbench();
    }
};