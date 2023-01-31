/**************************************************************************************************
 * 
 * ## Legal Stuff
 * Copyright Nick Overacker & Miho Kobayashi.
 * This code is offered under the Strict License 1.0.0 (https://polyformproject.org/licenses/strict/1.0.0/),
 * which permits users to use this code for noncommercial purposes but reserves most rights for the copyright holders.
 * For uses not permitted under the license, please contact: nick.overacker@okstate.edu
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
    //
    // The other color scheme is borrowed from Magic VLSI.
    static get layers() {
        'use strict';
        return [
            {name: 'pdiff',   Stix: 'rgba(118,   0, 181,   1)', Sorcery: 'rgba(202, 160, 115,   1)', Tol: 'rgba(51,   34, 136,   1)', selectable: true, },
            {name: 'ndiff',   Stix: 'rgba(50,  205,  50,   1)', Sorcery: 'rgba( 66, 213,  66,   1)', Tol: 'rgba(17,  119,  51,   1)', selectable: true, },
            {name: 'poly',    Stix: 'rgba(255,   0,   0, 0.6)', Sorcery: 'rgba(220,  95,  95, 0.6)', Tol: 'rgba(136,  34,  85, 0.6)', selectable: true, },
            {name: 'metal1',  Stix: 'rgba(0,   255, 255, 0.6)', Sorcery: 'rgba(125, 166, 250, 0.6)', Tol: 'rgba(136, 204, 238, 0.6)', selectable: true, },
            {name: 'metal2',  Stix: 'rgba(255,   0, 204, 0.6)', Sorcery: 'rgba(190, 153, 222, 0.6)', Tol: 'rgba(221, 204, 119, 0.6)', selectable: true, },
            {name: 'contact', Stix: 'rgba(204, 204, 204, 0.5)', Sorcery: 'rgba(204, 204, 204, 0.5)', Tol: 'rgba(204, 102, 119, 0.5)', selectable: true, },
            {name: 'delete',  Stix: 'rgba(208, 160,  32, 0.5)', Sorcery: 'rgba(230, 230,   0, 0.5)', Tol: 'rgba(170,  68, 153, 0.5)', selectable: false,},
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
        this.DIRECT_PATH         = { indeterminate: false, hasPath: true,  direct: true,  label: "1", }; // Originally [true]
        this.VIRTUAL_PATH        = { indeterminate: true,  hasPath: true,  direct: false, label: "v", }; // Originally ["i"]
        this.VIRTUAL_PATH_ONLY   = { indeterminate: false, hasPath: true,  direct: false, label: "I", }; // Originally ["I"]
        this.NO_PATH             = { indeterminate: false, hasPath: false, direct: true,  label: "0", }; // Originally [false]
        this.COMPUTING_PATH      = { indeterminate: true,                                 label: "?", }; // Originally [null]
        this.UNCHECKED           = { indeterminate: true,                                 label: "_", }; // Originally [undefined]

        this.initCells();
        this.initNets();
        this.initNodes();

        this.nmosPullup = this.pmosPulldown = false;
        
        this.view = new DiagramView(this, mainCanvas, gridCanvas);
        this.controller = new DiagramController(this, this.view, mainCanvas);
    }

    initCells() {
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

        this.vddCell = {x: 1, y: 1,};
        this.gndCell = {x: 1, y: startHeight - 2,};

        this.layeredGrid = new LayeredGrid(this, startWidth, startHeight, Diagram.layers.length);
    }

    initNets() {
        'use strict';
        this.vddNet = new Net("VDD", true);
        this.gndNet = new Net("GND", true);
        this.inputNets = [];
        this.outputNets = [];

        for (let ii = 0; ii < this.inputs.length; ii++) {
            this.inputNets.push(new Net(String.fromCharCode(65 + ii), true));
        }
        for (let ii = 0; ii < this.outputs.length; ii++) {
            this.outputNets.push(new Net(String.fromCharCode(89 - ii), false));
        }

        this.netlist = [];
        this.analyses = [];
   }

    initNodes() {
        'use strict';
        this.graph = new Graph();
        this.inputNodes  = [];
        this.outputNodes = [];
        this.nmos = new Set();
        this.pmos = new Set();
        this.nodeNodeMap = [];
   }

    // Compact the grid to send to the server.
    packGrid() {
        'use strict';
        let cell;
        let terminals = this.getTerminals();
        let byteCodeIndex = 0;
        let packedArr = [];
        let bitIndex = 0;
        let size = this.layeredGrid.width * this.layeredGrid.height * (this.layeredGrid.layers - 1);

        // Reduce each cell in each layer to a single bit.
        for(let ii = 0; ii < size; ii++) {
            // Get the cell and make room for the next bit.
            cell = this.layeredGrid.grid[ii];
            /*jslint bitwise: true */
            packedArr[byteCodeIndex] <<= 1;
            /*jslint bitwise: false */

            // If set, set the LSB.
            // It's 0 by default.
            if(!!cell && cell.isSet) {
                packedArr[byteCodeIndex]++;
            }

            // Increment the bit index and check if we need to move to the next word.
            bitIndex++;
            if(bitIndex > 31) {
                bitIndex = 0;
                byteCodeIndex++;
            }
        }

        // Pad the last word with zeros to the right.
        /*jslint bitwise: true */
        packedArr[packedArr.length - 1] <<= (32 - bitIndex);
        /*jslint bitwise: false */
        
        // Add the X and Y coordinates of each terminal.
        for(let ii = terminals.length - 1; ii >= 0; ii--) {
            packedArr.unshift(terminals[ii].y);
            packedArr.unshift(terminals[ii].x);
        }
        // Add the count of outputs, inputs, and width/height info.
        packedArr.unshift(this.outputs.length);
        packedArr.unshift(this.inputs.length);
        packedArr.unshift(this.layeredGrid.width);
        packedArr.unshift(this.layeredGrid.height);
        // Version number for this format.
        packedArr.unshift(1);
        return packedArr;
    }

    unpackGrid(packedArr) {
        'use strict';
        let word, bit, coords;
        let offset = 5 +                                    // version, width, height, #in, #out
                     2 * (packedArr[3] + packedArr[4] + 2); // X and Y for each IN,OUT,VDD,GND

        this.layeredGrid.resize(packedArr[1], packedArr[2]);
        
        while(this.inputs.length > packedArr[3]) {
            this.controller.removeTerminal();
        }
        while(this.outputs.length > packedArr[4]) {
            this.controller.removeTerminal(true);
        }
            
        while(this.inputs.length < packedArr[3]) {
            this.controller.addTerminal();
        }
        while(this.outputs.length < packedArr[4]) {
            this.controller.addTerminal(true);
        }
        
        this.vddCell.x = packedArr[5];
        this.vddCell.y = packedArr[6];
        this.gndCell.x = packedArr[7];
        this.gndCell.y = packedArr[8];
        
        for(let ii = 0; ii < packedArr[3]; ii++) {
            this.inputs[ii].x = packedArr[2*ii +  9];
            this.inputs[ii].y = packedArr[2*ii + 10];
        }
        
        for(let ii = 0; ii < packedArr[4]; ii++) {
            this.outputs[ii].x = packedArr[2*(ii + packedArr[3]) +  9];
            this.outputs[ii].y = packedArr[2*(ii + packedArr[3]) + 10];
        }
        
        for(let ii = 0; ii < 6*(packedArr[1] * packedArr[2]); ii++) {
            word = Math.floor(ii / 32);
            bit = 31 - (ii % 32);
                    coords = this.layeredGrid.convertToCoordinates(ii);
            
            /*jslint bitwise: true */
            if(!!((packedArr[offset + word] >> bit) & 1)) {
            /*jslint bitwise: false */
                    this.layeredGrid.grid[ii] = {
                        isSet: true,
                        x: coords.x,
                        y: coords.y,
                        layer: coords.layer,
                    };
            }
            else {
                delete this.layeredGrid.grid[ii];
            }
        }
    }

    // Sends a compacted version of the grid and terminal coordinates to the server.
    save() {
        'use strict';
        let packedArr = this.packGrid();
        let xhr = new XMLHttpRequest();

        // Send packedArr as JSON.
        xhr.open('POST', '/api/v1/save', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onload = function() {
            if (this.status === 200) {
                console.log("Saved!");
            } else {
                console.log("Error saving!");
            }
        };
        xhr.send(JSON.stringify(packedArr));
    }

    // Loads a grid from the server.
    load() {
        'use strict';
        // Get the grid by sending a POST to /api/load_v1.
        let xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/v1/load', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onload = function() {
            // Just print the response.
            if (this.status === 200) {
                console.log("Loaded!");
            } else {
                console.log("Error loading!");
            }
            diagram.unpackGrid(JSON.parse(xhr.responseText));
        };
        xhr.send();
    }

    // Clear previous anaysis.
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

    getMapping(node1, node2) {
        'use strict';
        return this.nodeNodeMap[this.graph.getIndexByNode(node1)][this.graph.getIndexByNode(node2)];
    }

    // This function updates the mappings between nodes in the graph to reflect whether a path exists between them.
    // Paths are broken down into direct (same net) and virtual (input set to 1 or 0 rather than actual VDD or GND on net).
    //
    // Virtual paths are unidirectional.
    // If an input is set to 0, then everything on the same net as that input will be virtually mapped to GND.
    // However, the net will *not* be mapped to everything on the same net as the actual GND node.
    mapNodes(node1, node2, setPath) {
        'use strict';
        let currentMapping = this.getMapping(node1, node2);

        // If there is a mapping, do nothing and return
        // One exception: If the current mapping is NO_PATH and the new mapping is VIRTUAL_PATH_ONLY,
        // we can remap.
        if(!currentMapping.indeterminate) {
            if(!(currentMapping === this.NO_PATH && setPath === this.VIRTUAL_PATH_ONLY)) {
                return;
            }
        }

        // If the current mapping is VIRTUAL_PATH and the new mapping is false,
        // upgrade to VIRTUAL_PATH_ONLY (confirmed input only with no direct connection)
        if(currentMapping === this.VIRTUAL_PATH && setPath === this.NO_PATH) {
            setPath = this.VIRTUAL_PATH_ONLY;
        }

        // Set the mappings (both directions) between node1 and node2 to setPath.
        this.nodeNodeMap[this.graph.getIndexByNode(node1)][this.graph.getIndexByNode(node2)] = setPath;
        this.nodeNodeMap[this.graph.getIndexByNode(node2)][this.graph.getIndexByNode(node1)] = setPath;

        // If the path is currently being computed, return.
        // This just means that the current mapping is under investigation,
        // and a path has neither been found nor ruled out.
        if (setPath === this.COMPUTING_PATH) { return; }

        // Map the path to node2 appropriately for all nodes mapped to node1.
        for (let ii = 0; ii < this.nodeNodeMap.length; ii++) {
            this.syncEdges(ii, node1, node2, setPath);
            // Now do the reverse direction.
            this.syncEdges(this.nodeNodeMap.length - ii - 1, node2, node1, setPath);
        }
    }
    
    isRailNode(node) {
        'use strict';
        return node === this.gndNode || node === this.vddNode;
    }

    remap(mapNode1Index, mapNode2Index, mapping) {
        'use strict';
        this.nodeNodeMap[mapNode1Index][mapNode2Index] = mapping;
        this.nodeNodeMap[mapNode2Index][mapNode1Index] = mapping;
    }
    
    updateVirtualPath(compareNodeMapping, nodeToMap, remapNode, setPath) {
        'use strict';
        if(compareNodeMapping === this.DIRECT_PATH) {
            if(setPath === this.DIRECT_PATH) {
                this.remap(nodeToMap, this.graph.getIndexByNode(remapNode), this.DIRECT_PATH);
            }
            else if(setPath === this.NO_PATH) {
                this.remap(nodeToMap, this.graph.getIndexByNode(remapNode), this.VIRTUAL_PATH_ONLY);
            }
            else if(setPath === this.VIRTUAL_PATH_ONLY) {
                this.remap(nodeToMap, this.graph.getIndexByNode(remapNode), this.VIRTUAL_PATH_ONLY);
            }
        }
        else if(compareNodeMapping === this.NO_PATH && setPath === this.DIRECT_PATH) {
            this.remap(nodeToMap, this.graph.getIndexByNode(remapNode), this.VIRTUAL_PATH_ONLY);
        }
    }
    
    updateNoPath(compareNode, nodeToMap, remapNode, setPath) {
        'use strict';
        let compareNodeMapping = this.nodeNodeMap[nodeToMap][this.graph.getIndexByNode(compareNode)];
        let mapFromRail = this.isRailNode(compareNode);
        
        if(!mapFromRail && setPath === this.DIRECT_PATH && compareNodeMapping.direct === false) {
            this.remap(nodeToMap, this.graph.getIndexByNode(remapNode), this.VIRTUAL_PATH_ONLY);
        }
    }
    
    updateUndefinedPath(compareNode, nodeToMap, remapNode, setPath) {
        'use strict';
        let compareNodeMapping = this.nodeNodeMap[nodeToMap][this.graph.getIndexByNode(compareNode)];
        let mapFromRail = this.isRailNode(compareNode);
        
        if(setPath === this.DIRECT_PATH) {
            if(compareNodeMapping.direct) {
                this.remap(nodeToMap, this.graph.getIndexByNode(remapNode), compareNodeMapping);
            }
            else if(compareNodeMapping.direct === false && !mapFromRail) {
                this.remap(nodeToMap, this.graph.getIndexByNode(remapNode), compareNodeMapping);
            }
        }
        else if(compareNodeMapping === this.DIRECT_PATH) {
            if(setPath === this.NO_PATH) {
                this.remap(nodeToMap, this.graph.getIndexByNode(remapNode), this.NO_PATH);
            }
            else if(setPath === this.VIRTUAL_PATH_ONLY) {
                if(mapFromRail) {
                    this.remap(nodeToMap, this.graph.getIndexByNode(remapNode), this.NO_PATH);
                }
                else {
                    this.remap(nodeToMap, this.graph.getIndexByNode(remapNode), this.VIRTUAL_PATH_ONLY);
                }
            }
            else if(!mapFromRail) {
                this.remap(nodeToMap, this.graph.getIndexByNode(remapNode), this.VIRTUAL_PATH);
            }
        }
    }

    syncEdges(nodeToMap, compareNode, remapNode, setPath) {
        'use strict';
        // Get the existing mappings between the remapped nodes and node ii.
        let compareNodeMapping = this.nodeNodeMap[nodeToMap][this.graph.getIndexByNode(compareNode)];
        let remapNodeMapping = this.nodeNodeMap[nodeToMap][this.graph.getIndexByNode(remapNode)];
        
        // Case 0: Insufficient information to remap nodes.
        if(compareNodeMapping.hasPath === undefined || setPath.hasPath === undefined) {
            return;
        }
        // Case 1: Node2 already has a positive mapping to node ii.
        //         In this case, only override to turn it from VIRTUAL_PATH to VIRTUAL_PATH_ONLY or DIRECT_PATH.
        else if(remapNodeMapping === this.VIRTUAL_PATH) {
            this.updateVirtualPath(compareNodeMapping, nodeToMap, remapNode, setPath);
        }
        // Case 2: Node2 has a NO_PATH mapping to node ii.
        //         In this case, allow it to change to VIRTUAL_PATH_ONLY.
        //         DO NOT do this to propagate virtual paths from VDD and GND.
        else if(remapNodeMapping === this.NO_PATH) {
            this.updateNoPath(compareNode, nodeToMap, remapNode, setPath);
        }
        // Case 3: Node2 is UNCHECKED or COMPUTING_PATH.
        //         In this case, copy any of the other mappings from node 1.
        //         Exception: Do not copy virtual paths from VDD and GND.
        else if(remapNodeMapping.hasPath === undefined) {
            this.updateUndefinedPath(compareNode, nodeToMap, remapNode, setPath);
        }
    }

    // Evaluate the value of an input node.
    // Returns the rail node (VDD or GND) that it is virtually mapped to.
    evaluateInput(node, inputVals) {
        'use strict';
        let evalInput;
        let inputNum = this.inputNodes.indexOf(node);

        // This becomes the shift amount
        // Lower number inputs are actually in the
        // most significant bits.
        inputNum = this.inputNodes.length - 1 - inputNum;

        /*jslint bitwise: true */
        evalInput = !!((inputVals >> inputNum) & 1);
        /*jslint bitwise: false */
        
        return evalInput ? this.vddNode : this.gndNode;
    }

    deactivateGate(node) {
        'use strict';
        this.graph.nodes.forEach(function(otherNode) {
            if(node === otherNode) {
                return;
            }
            this.nodeNodeMap[this.graph.getIndexByNode(node)][this.graph.getIndexByNode(otherNode)] = this.NO_PATH;
            this.nodeNodeMap[this.graph.getIndexByNode(otherNode)][this.graph.getIndexByNode(node)] = this.NO_PATH;
        }.bind(this));
    }

    // Check whether it matters if a particular gate conflict exists.
    // If it does not affect the output, we can safely continue computation.
    // If it does, then the output value on the truth table should be X.
    //
    // Unset this.overdrivenPath if the conflict is resolvable.
    attemptGateConflictResolution(node, targetNode, inputVals) {
        'use strict';
        let targetNodeReachable, nodeTerm1, nodeTerm2, od,
            gndPathOk, vddPathOk, gndPathExistsActivated, vddPathExistsActivated;

        // We will need to restore the old map after half of the
        // operation below, but there is no need to restore it at the
        // end. We will have determined that either there is a conflict
        // (i.e., the output will be assigned X),
        // or that the gate doesn't matter at all (i.e., the output
        // doesn't change depending on the gate's state).
        // There is no case in which we need to consider the gate
        // to be specifically open or closed after returning.
        let backupNodeNodeMap = [];

        let mapCopy = function(from, to) {
            for(let ii = 0; ii < from.length; ii++) {
                to[ii] = [...from[ii],];
            }
        };

        // Source and drain nodes are interchangeable.
        // They're just named  that way here for readability
        let allPathsOk = function(sourceNode, drainNode, targetNode, activePathExists) {
            let path1 = this.getMapping(sourceNode, targetNode).hasPath;
            let path2 = this.getMapping(drainNode,  targetNode).hasPath;

            return path1 === path2 &&
                   path1 === activePathExists;
        }.bind(this);

        mapCopy(this.nodeNodeMap, backupNodeNodeMap);

        // Assume the path is resolvable to begin.
        this.overdrivenPath = false;
        
        // First, see if any of the adjacent nodes that are not currently null-mapped
        // (i.e., not under investigation) have a path to targetNode.
        nodeTerm1 = node.getTerm1Node();
        nodeTerm2 = node.getTerm2Node();

        this.mapNodes(node, nodeTerm1, this.DIRECT_PATH);
        this.mapNodes(node, nodeTerm2, this.DIRECT_PATH);
                      
        targetNodeReachable = this.recurseThroughEdges(node, targetNode, inputVals).hasPath;
    
        od = this.overdrivenPath;
        this.overdrivenPath = false;

        // If it is reachable at all, compare the paths for inactive and active states.
        if(targetNodeReachable && Math.min(node.cell.term1.nodes.size, node.cell.term2.nodes.size) > 1) {
            gndPathExistsActivated = this.recurseThroughEdges(nodeTerm1, this.gndNode, inputVals).hasPath;
            vddPathExistsActivated = this.recurseThroughEdges(nodeTerm1, this.vddNode, inputVals).hasPath;

            mapCopy(backupNodeNodeMap, this.nodeNodeMap);
            od = od || this.overdrivenPath;
            this.overdrivenPath = false;

            // If there is a conflict when activated, then the target node is definitely overdriven.
            // As long as there is no conflict, proceed.
            if(!gndPathExistsActivated || !vddPathExistsActivated) {
                // The active paths are fine.
                // Now try with the gate inactive.
                this.deactivateGate(node);
                this.recurseThroughEdges(node, this.gndNode, inputVals);
                this.recurseThroughEdges(node, this.vddNode, inputVals);
                gndPathOk = allPathsOk(nodeTerm1, nodeTerm2, this.gndNode, gndPathExistsActivated);
                vddPathOk = allPathsOk(nodeTerm1, nodeTerm2, this.vddNode, vddPathExistsActivated);
                
                mapCopy(backupNodeNodeMap, this.nodeNodeMap);
                od = od || this.overdrivenPath;
            }

            od =  !(gndPathOk && vddPathOk) || od;
        }

        // No path to targetNode === No problem
        this.overdrivenPath = od;
        mapCopy(backupNodeNodeMap, this.nodeNodeMap);
    }

    recurseThroughEdges(node, targetNode, inputVals) {
        'use strict';
        let pathFound;
        let hasNullPath = false;

        node.edges.some(function(edge) {
            let otherNode = edge.getOtherNode(node);
            let mapping = this.getMapping(otherNode, targetNode);

            // Easy case: We have already found a path from this otherNode.
            if (mapping.hasPath) {
                this.mapNodes(node, targetNode, mapping);
                this.mapNodes(node, edge.getOtherNode(node), mapping);
                /*jshint -W093 */
                return pathFound = mapping;
                /*jshint +W093 */
            }
            
            // Recursive case: We do not yet know if there is a path from otherNode.
            if(mapping === this.UNCHECKED) {
                mapping = this.computeOutputRecursive(otherNode, targetNode, inputVals);
            }

            // Path found from otherNode?
            if (mapping.hasPath) {
                this.mapNodes(node, targetNode, mapping);
                this.mapNodes(node, edge.getOtherNode(node), mapping);
                /*jshint -W093 */
                return pathFound = mapping;
                /*jshint +W093 */
            }

            // Null outcome means that we ran into a node that is
            // already being investigated and had to abort.
            // It will be returned to later.
            if(mapping === this.COMPUTING_PATH) {
                hasNullPath = true;
            }
        }.bind(this));

        if(pathFound) {
            return pathFound;
        } else if(hasNullPath) {
            return this.COMPUTING_PATH;
        } else {
            this.mapNodes(node, targetNode, this.NO_PATH);
            // Don't return NO_PATH directly, because it may
            // have been reassigned to VIRTUAL_PATH_ONLY.
            return this.getMapping(node, targetNode);
        }
    }

    // Recursively searches for a path from node to targetNode
    // given a particular set of inputs.
    //
    // Assumption: targetNode is NOT a transistor.
    // This holds true because targetNode is always either
    // and output node, the GND terminal, or the VDD terminal.
    // NONE of these can be transistors because all of them
    // are implemented as contacts, which destroy transistors.
    computeOutputRecursive(node, targetNode, inputVals) {
        'use strict';
        let mapping;

        // Is the test node an input?
        // If so, is it also the same node as the targetNode?
        if(this.inputNodes.indexOf(node) >= 0 && this.evaluateInput(node, inputVals) === targetNode) {
            // Test node is an input and is the same value as the target
            // VDD or GND node.
            this.mapNodes(node, targetNode, this.VIRTUAL_PATH);
        }

        // Have we already found a path?
        // (Could have been found in above input node test
        // or in a previous recursion.)
        mapping = this.getMapping(node, targetNode);

        // Avoid infinite loops.
        // Return if this is currently being checked
        // or if a definitive answer has already been found.
        if (mapping === this.COMPUTING_PATH || mapping.indeterminate === false) {
            return mapping;
        }

        // Initialize to null.
        // This marks the node as currently being checked
        // so that we won't recurse back into it.
        // (VIRTUAL_PATH is analogous to null - leave VIRTUAL_PATH as-is)
        if(mapping !== this.VIRTUAL_PATH) {
            this.mapNodes(node, targetNode, this.COMPUTING_PATH);
        }

        // If the test node is a transistor,
        // only traverse the channel if the gate is active.
        // If it's inactive, exit this recursion.
        if (node.isTransistor()) {
            // true for active, false for inactive.
            // Also, false when setting overdrivenPath.
            let evalResult = this.gateIsActive(node, inputVals);

            if(this.overdrivenPath) {
                this.attemptGateConflictResolution(node, targetNode, inputVals);
            }

            if (evalResult === false) {
                // Inactive: Mark this transistor node as disconnected
                //           from all nodes except for itself.
                this.deactivateGate(node);
                return this.NO_PATH;
            } else if (evalResult === null) {
                // Unknown: This occurs when at least one tested path
                //          was aborted due to a node already being
                //          under investigation, and no connection was
                //          found on any other path.
                //
                // This will be returned to later if it isn't an island.
                this.mapNodes(node, targetNode, this.UNCHECKED);
                return this.COMPUTING_PATH;
            }
        }

        // Recurse on all node edges (or until a path is found).
        return this.recurseThroughEdges(node, targetNode, inputVals);
    }

    evalInputDrivenGate(node, inputVals, gateNet) {
        'use strict';
        let tempEval, evalInput;
        let gateNode = gateNet.nodes.entries().next().value[1];

        this.inputNodes.forEach(function(node, index) {
            if(!gateNode.isConnected(node)) {
                return;
            }

            // Evaluate the relevant input bit as a boolean.
            /*jslint bitwise: true */
            tempEval = !!((inputVals >> (this.inputs.length - index - 1)) & 1);
            /*jslint bitwise: false */

            if(evalInput === undefined || evalInput === tempEval) {
                evalInput = tempEval;
            } else {
                // Conflict found.
                this.overdrivenPath = true;
            }
        }.bind(this));

        this.overdrivenPath = this.overdrivenPath ||
            gateNet.containsNode(this.vddNode) && evalInput === false ||
            gateNet.containsNode(this.gndNode) && evalInput === true ||
            gateNet.containsNode(this.vddNode) && gateNet.containsNode(this.gndNode);

        evalInput = (evalInput || gateNet.containsNode(this.vddNode)) && !gateNet.containsNode(this.gndNode);
        
        // Pass-through positive for NMOS.
        // Invert for PMOS.
        /*jslint bitwise: true */
        return !this.overdrivenPath && !(node.isNmos ^ evalInput);
        /*jslint bitwise: false */
    }

    // This function determines whether a transistor gate is active by evaluating 
    // the paths between the gate's nodes and either the ground node or the power node.
    //
    // If any of the paths are still under investigation (marked as null) at the end
    // of the evaluation, the function returns null.
    //
    // Otherwise, if any path between a gate node and the relevant power or ground node exists,
    // the function returns true.
    //
    // Otherwise, it returns false.
    gateIsActive(node, inputVals) {
        'use strict';
        let gateNet = node.cell.gate;
        let connectedNodeIterator, hasNullPath;

        // If the gate is an input, the gate's state depends on the input value.
        if (gateNet.isInput) {
            return this.evalInputDrivenGate(node, inputVals, gateNet);
        }

        // Otherwise, recurse and see if this is active.
        connectedNodeIterator = gateNet.nodes.values();
        hasNullPath = false;

        // Iterate through the nodes in the same net as the gate.
        for (let connectedNode = connectedNodeIterator.next(); !connectedNode.done; connectedNode = connectedNodeIterator.next()) {

            let relevantPathExists, oppositePathExists, relevantNode, oppositeNode;
            connectedNode = connectedNode.value;

            // Determine the relevant power or ground node for the current gate type.
            if(node.isPmos) {
                relevantNode = this.gndNode;
                oppositeNode = this.vddNode;
            } else {
                relevantNode = this.vddNode;
                oppositeNode = this.gndNode;
            }

            // Check if there is a path between the current node and the relevant power or ground node.
            relevantPathExists = this.computeOutputRecursive(connectedNode, relevantNode, inputVals);
            oppositePathExists = this.computeOutputRecursive(connectedNode, oppositeNode, inputVals);

            // If the path has not yet been determined, set hasNullPath to true
            // Set and hold if any null path to the relevant node is found in *any* loop iteration.
            if (relevantPathExists === this.COMPUTING_PATH) {
                hasNullPath = true;
            }
            // If the path exists, return true.
            else if(relevantPathExists.hasPath) {
                this.overdrivenPath = oppositePathExists === true;
                return true;
            }
        }

        // If any paths have not yet been determined, return null.
        if(hasNullPath) {
            return null;
        }

        // Otherwise, return false.
        return false;
    }

    // Computes the value of a particular output node for a given set of inputs.
    // Each bit of inputVals is the value (1 or 0) of a single input node (A, B, C, etc).
    // outputNode is the specific output node (Y, Z, etc) that we want to test.
    computeOutput(inputVals, outputNode) {
        'use strict';
        let outputVal = "Z";             // Assume that the node is floating at the start.
        let highNodes = [this.vddNode,]; // Array for all nodes driven HIGH.
        let lowNodes  = [this.gndNode,]; // Array for all nodes driven LOW.
        this.overdrivenPath = false;

        // Add input nodes to the highNodes and lowNodes arrays according
        // to their binary values. (1 = high, 0 = low)
        this.inputNodes.forEach(function(node, index) {
            let inputNum = this.inputNodes.length - 1 - index;

            /*jslint bitwise: true */
            let evalInput = !!((inputVals >> inputNum) & 1);
            /*jslint bitwise: false */

            if(evalInput) {
                highNodes.push(node);
            } else {
                lowNodes.push(node);
            }
        }.bind(this));

        //  Initialize the map of connections between nodes.
        if(!!this.analyses[inputVals] && !!this.analyses[inputVals].length) {
            // This condition occurs when this function is called
            // more than once with the same arguments without calling clearAnalyses().
            // I.e., this is for the case of multiple outputs.
            this.nodeNodeMap = [... this.analyses[inputVals],];
        } else {
            // Expected case:
            // No nodal analysis has been done for outputNode for this set of inputVals.
            // Mark each node as connected to itself.
            this.graph.nodes.forEach(function(_, ii) {
                this.nodeNodeMap[ii] = [];

                this.graph.nodes.forEach(function(_, jj) {
                    this.nodeNodeMap[ii][jj] = ii === jj ? this.DIRECT_PATH : this.UNCHECKED;
                }.bind(this));
            }.bind(this));
        }

        // Test each node for a path to outputNode
        let testPath = function(node) {
          	if(this.overdrivenPath) {
              return;
            }

            // Recursive over every possible path from the test node to outputNode.
            this.computeOutputRecursive(node, outputNode, inputVals);

            // null paths are inconclusive; they mean that the recursion
            // concluded before these paths were proven or disproven.
            // Revert them to undefined for the next loop iteration.
            // VIRTUAL_PATH_ONLY results can be treated as "true" at this stage.
            this.graph.nodes.forEach(function(_, ii) {
                this.graph.nodes.forEach(function(_, jj) {
                    if(this.nodeNodeMap[ii][jj] === this.COMPUTING_PATH) {
                        this.nodeNodeMap[ii][jj] = this.UNCHECKED;
                    }
                }.bind(this));
            }.bind(this));

            // Finally, if we have not found a connection between
            // the test node and outputNode, there *is* no connection.
            if(this.getMapping(node, outputNode) === this.UNCHECKED) {
                this.mapNodes(node, outputNode, this.NO_PATH);
            }
        }.bind(this);

        for(let ii = 0; ii < this.inputNodes.length; ii++) {
            /*jslint bitwise: true */
            if(inputVals >> (this.inputNodes.length - 1 - ii) & 1) {
                this.mapNodes(this.inputNodes[ii], this.vddNode, this.VIRTUAL_PATH);
            } else {
                this.mapNodes(this.inputNodes[ii], this.gndNode, this.VIRTUAL_PATH);
            }
            /*jslint bitwise: false */
        }
  
        // Compute output
        this.inputNodes.forEach(testPath);
        testPath(this.vddNode);
        testPath(this.gndNode);
  
        // If there are no overdriven paths,
        // proceed to map out every path to the output.
        // We can ignore overdriven paths here because
        // the new nodes we are testing are not inputs.
        if(!this.overdrivenPath) {
            this.graph.nodes.forEach(testPath);
            this.overdrivenPath = false;
        }

        // Determine the value of the output.
        highNodes.some(function(node) {
            if(this.getMapping(node, outputNode).hasPath) {
                // Path is found from HIGH to outputNode,
                // so we assign the output value to 1.
                //
                // This may not be the final value;
                // see the lowNodes loop below.
                outputVal = "1";
                return true;
            }
        }.bind(this));

        lowNodes.some(function(node) {
            if(this.getMapping(node, outputNode).hasPath) {
                // Path is found from LOW to outputNode.
                // 
                // If the current outputVal is "Z", that means
                // no path was found from HIGH to outputNode,
                // so there is no short from HIGH to LOW in this node.
                // In this case, assign the output value to 0.
                //
                // If there IS a path from high to outputNode,
                // then the node is being driven both HIGH and LOW.
                // In this case, assign the output value to "X".
                outputVal = outputVal === "Z" ? "0" : "X";
                return true;
            }
        }.bind(this));

        // Save all the results of the analysis for this combination
        // of input values and output node so that we can highlight
        // all connected nodes.
        this.analyses[inputVals] = [...this.nodeNodeMap,];

        // Reset the node-node map so that it will be ready for
        // the next time this function is called.
        this.nodeNodeMap.length = 0;

        // Return 1, 0, "Z", or "X".
        // There is still one unchecked case for "X",
        // namely when two or more inputs directly drive
        // a gate with opposite values.
        return this.overdrivenPath ? "X" : outputVal;
    }

    // Map a function to every transistor terminal.
    forEachTransistor(funct) {
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

        // Add input nodes to the graph.
        this.inputNodes.length = 0;
        this.inputs.forEach(function(input, index) {
            this.inputNodes[index] = this.graph.addNode(this.layeredGrid.get(input.x, input.y, Diagram.CONTACT), true);
            this.inputNets[index].addNode(this.inputNodes[index]);
        }.bind(this));

        // Add output nodes to the graph.
        this.outputNodes.length = 0;
        this.outputs.forEach(function(output, index) {
            this.outputNodes[index] = this.graph.addNode(this.layeredGrid.get(output.x, output.y, Diagram.CONTACT), true);
            this.outputNets[index].addNode(this.outputNodes[index]);
        }.bind(this));

        // Each nmos and pmos represents a relation between term1 and term2.
        // If term1 is not in any of the nets,
        // then create a new net and add term1 to it.
        // Loop through nmos first.
        // Loop only through "term1" and "term2" for both transistor types.
        this.forEachTransistor(function (transistor, _, term) {
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

        // Now, loop through nmos and pmos again and change each transistors terminal values from cells to nets.
        // This must be done after the above loop rather than as a part of it, because the loop above will overwrite the nets.
        this.forEachTransistor(function (transistor, _, term) {
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

        // Loop through pmos/nmos and find every pmos/nmos that shares a net (on term1 or term2).
        this.forEachTransistor(function (_, transistor, termA) {
            // Skip for the gate terminal.
            if (termA === "gate") { return; }

            let net = transistor.cell[termA];

            // If net is vddNet, add an edge to vddNode.
            if (net === this.vddNet) {
                transistor.addEdge(this.vddNode);
            }

            // If net is gndNet, add an edge to gndNode.
            if (net === this.gndNet) {
                transistor.addEdge(this.gndNode);
            }

            // Same for input.
            this.inputNets.forEach(function (inputNet, index) {
                if (net === inputNet) {
                    transistor.addEdge(this.inputNodes[index]);
                }
            }.bind(this));

            // Same for output.
            this.outputNets.forEach(function (outputNet, index) {
                if (net === outputNet) {
                    transistor.addEdge(this.outputNodes[index]);
                }
            }.bind(this));

            // Loop through iterator2 to find all other transistors that share a net.
            this.forEachTransistor(function (_, transistor2, termB) {
                // Skip for the gate terminal or self-comparison.
                if (termB === "gate" || transistor === transistor2) { return; }

                if (transistor2.cell[termB] !== undefined) {
                    if (transistor.cell[termA] === transistor2.cell[termB]) {
                        transistor.addEdge(transistor2);
                    }
                }
            });

            // Add a blank node and edge if there are no other nodes on this net
            // (besides the transistor itself).
            if(net.nodes.size === 1) {
                let node = this.assignEmptyNode(net);
                transistor.addEdge(node);
            }
        }.bind(this));

        this.linkIdenticalNets();
        this.checkPolarity();
    } // end function setNets

    // Add a node to a net that does not yet have any nodes.
    assignEmptyNode(net) {
        'use strict';
        let node = this.graph.addNode(net.cells.values().next().value, true);
        net.addNode(node);
        return node;
    }

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
    }

    linkIdenticalNets() {
        'use strict';
        let linkNodes = function(net1, net2) {
            let nodeIterator1 = net1.nodes.values();
            let nodeIterator2 = net2.nodes.values();

            // Loop through net1's nodes.
            // Outer loop - this is why it had to be swapped with net2 if it was an input.
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
        
        if (!!cell && cell.isSet) {
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
    checkIfTransistor(cell, layer, transistorArray) {
        'use strict';

        // If the layer is Diagram.NDIFF or Diagram.PDIFF and there is also a Diagram.POLY at the same location,
        // add the cell to transistors.
        // (Except when there is also a contact)
        if (cell.layer === layer && cell.isSet) {
            if (this.layeredGrid.get(cell.x, cell.y, Diagram.POLY).isSet && !this.layeredGrid.get(cell.x, cell.y, Diagram.CONTACT).isSet) {
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

                // If no term2 is set, then this is not a full transistor.
                // Undo.
                if(cell.term2 === undefined) {
                    cell.term1 = undefined;
                    cell.gate = undefined;
                } else {
                    transistorArray.add(cell);
                    this.graph.addNode(cell);
                    return true;
                }
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
        if (this.checkIfTransistor(cell, Diagram.NDIFF, this.nmos)) { return; }
        if (this.checkIfTransistor(cell, Diagram.PDIFF, this.pmos)) { return; }

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
        this.currentCell      = null;

        // Set up shift commands
        this.shiftCommands[37] = ((e) => {
            if(e.type.includes('up')) {
                this.diagram.layeredGrid.shift(0, false, -1);
            }
        }).bind(this);

        this.shiftCommands[38] = ((e) => {
            if(e.type.includes('up')) {
                this.diagram.layeredGrid.shift(0, true, -1);
            }
        }).bind(this);

        this.shiftCommands[39] = ((e) => {
            if(e.type.includes('up')) {
                this.diagram.layeredGrid.shift(0, false, 1);
            }
        }).bind(this);

        this.shiftCommands[40] = ((e) => {
            if(e.type.includes('up')) {
                this.diagram.layeredGrid.shift(0, true, 1);
            }
        }).bind(this);

        this.shiftCommands[84] = ((e) => {
            if(e.type.includes('up')) {
                this.view.theme = this.view.theme < DiagramView.themes.length - 1 ? this.view.theme + 1 : 0;
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

        this.shiftCommands[72] = ((e) => {
            if(e.type.includes('down')) {
                let coords = this.getCellAtCursor(this.currentX, this.currentY);
                if(coords !== {}) {
                    this.diagram.layeredGrid.insertRemoveRowColAt(coords.x, true, false);
                }
            }
        }).bind(this);

        this.shiftCommands[74] = ((e) => {
            if(e.type.includes('down')) {
                let coords = this.getCellAtCursor(this.currentX, this.currentY);
                if(coords !== {}) {
                    this.diagram.layeredGrid.insertRemoveRowColAt(coords.y, true, true);
                }
            }
        }).bind(this);

        this.shiftCommands[75] = ((e) => {
            if(e.type.includes('down')) {
                let coords = this.getCellAtCursor(this.currentX, this.currentY);
                if(coords !== {}) {
                    this.diagram.layeredGrid.insertRemoveRowColAt(coords.y, false, true);
                }
            }
        }).bind(this);

        this.shiftCommands[76] = ((e) => {
            if(e.type.includes('down')) {
                let coords = this.getCellAtCursor(this.currentX, this.currentY);
                if(coords !== {}) {
                    this.diagram.layeredGrid.insertRemoveRowColAt(coords.x, false, false);
                }
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

    pixelIsInBounds(screenX, screenY) {
        'use strict';
        let boundingBox = this.view.canvas.getBoundingClientRect();
        return screenX > boundingBox.left   + this.view.cellWidth &&
               screenX < boundingBox.right  - this.view.cellWidth &&
               screenY > boundingBox.top    + this.view.cellHeight &&
               screenY < boundingBox.bottom - this.view.cellHeight;
    }

    getCellAtCursor(screenX, screenY) {
        'use strict';
        // Ignore if not inside the canvas
        if (this.pixelIsInBounds(screenX, screenY)) {

            let x = Math.floor((screenX - this.view.canvas.getBoundingClientRect().left - this.view.cellWidth) / this.view.cellWidth);
            let y = Math.floor((screenY - this.view.canvas.getBoundingClientRect().top - this.view.cellHeight) / this.view.cellHeight);
            this.currentCell = {
                x: x,
                y: y,
                pdiff:   this.diagram.layeredGrid.get(x, y, Diagram.PDIFF).isSet,
                ndiff:   this.diagram.layeredGrid.get(x, y, Diagram.NDIFF).isSet,
                poly:    this.diagram.layeredGrid.get(x, y, Diagram.POLY).isSet,
                metal1:  this.diagram.layeredGrid.get(x, y, Diagram.METAL1).isSet,
                metal2:  this.diagram.layeredGrid.get(x, y, Diagram.METAL2).isSet,
                contact: this.diagram.layeredGrid.get(x, y, Diagram.CONTACT).isSet,
            };
        } else {
            this.currentCell = {};
        }
        return this.currentCell;
    }

    clearIfPainted(clientX, clientY) {
        'use strict';

        // Set a variable to true if any of the layers are set.
        let anyLayerSet = false;

        // Ignore if not inside the canvas
        if (this.pixelIsInBounds(clientX, clientY)) {
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
            if (!this.diagram.layeredGrid.get(this.startX, this.startY, this.cursorIndex).isSet) {
                this.saveCurrentState();
                this.diagram.layeredGrid.set(this.startX, this.startY, this.cursorIndex);
            }
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

        if(this.pixelIsInBounds(coords.x, coords.y)) {
            event.preventDefault();
        }
     
        if (this.isPrimaryInput(event) || event.button === 2) {
            if (this.dragging) {
                this.endDrag(coords.x, coords.y, event);
            } else if (this.pixelIsInBounds(coords.x, coords.y)) {
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

    drag(event) {
        'use strict';
        if (this.startX === -1) {
            return;
        }

        if (!this.dragging) {
            // don't start dragging unless the mouse has moved outside the cell
            if(this.currentCell.x === this.startX && this.currentCell.y === this.startY) {
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

    endDrag(currentX, currentY, event) {
        'use strict';
        // If the mouse was released outside the canvas, undo and return.
        if(!this.pixelIsInBounds(currentX, currentY)) {
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

        if(this.pixelIsInBounds(coords.x, coords.y)) {
            event.preventDefault();
        }

        if(event.type.includes("mouse")) {
            this.view.trailCursor = true;
        }

        // Save the current X and Y coordinates.
        this.currentX = coords.x;
        this.currentY = coords.y;
        this.getCellAtCursor(coords.x, coords.y);

        // If the mouse is pressed and the mouse is between cells 1 and gridsize - 1,
        if (this.isPrimaryInput(event) || event.buttons === 2) {
            // Ignore if not inside the canvas
            if (this.pixelIsInBounds(coords.x, coords.y)) {
                this.drag(event);
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

        if (cell !== {} && !event.ctrlKey) {
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
        let coords = this.getCoordsFromEvent(event);

        this.currentX = coords.x;
        this.currentY = coords.y;

        if (this.isPrimaryInput(event) || event.button === 2) {
            // Return if not between cells 1 and gridsize - 1
            if (this.pixelIsInBounds(coords.x, coords.y)) {
                event.preventDefault();
                this.startX = Math.floor((coords.x - this.view.canvas.getBoundingClientRect().left - this.view.cellWidth) / this.view.cellWidth);
                this.startY = Math.floor((coords.y - this.view.canvas.getBoundingClientRect().top - this.view.cellHeight) / this.view.cellHeight);
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

    static get themes() {
        'use strict';
        return [
            'Tol',
            'Sorcery',
            'Stix',
        ];
    }

    constructor(diagram, mainCanvas, gridCanvas) {
        'use strict';
        this.diagram = diagram;
        this.canvas = mainCanvas;
        this.gridCanvas = gridCanvas;
        this.ctx = this.canvas.getContext("2d");
        this.gridCtx = this.gridCanvas.getContext('2d');
        this.canvasWidth = Math.min(document.getElementById('canvas-wrapper').clientWidth, document.getElementById('canvas-wrapper').clientHeight);
        this.canvasHeight = this.canvasWidth;
        this.cellWidth  = this.canvasWidth  / (this.diagram.layeredGrid.width  + 2);
        this.cellHeight = this.canvasHeight / (this.diagram.layeredGrid.height + 2);
        this.useFlatColors = false;
        this.trailCursor = false;
        this.highlightNets = false;
        this.netHighlightGrid = [];
        this.theme = 0;
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
        let color = layerObj[DiagramView.themes[this.theme]];

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

        let containerWidth = document.getElementById('canvas-wrapper').clientWidth;
        let containerHeight = document.getElementById('canvas-wrapper').clientHeight;
        let containerSize = Math.min(containerWidth, containerHeight);
       
        this.canvas.width = containerSize;
        this.canvas.height = containerSize;
        this.canvas.style.width = containerSize + 'px';
        this.canvas.style.width = containerSize + 'px';
        this.canvasWidth = containerSize;
        this.canvasHeight = containerSize;

        this.drawGrid();
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
            currentCell = this.diagram.controller.currentCell;
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

    // Mark the cells connected to the output node for a given set of inputs
    // so they can be highlighted in the canvas.
    //
    // path: The row of the relevant nodeNodeMap corresponding to the chosen output node.
    setHighlight(path) {
        'use strict';
        this.netHighlightGrid.length = 0;

        for(let ii = 0; ii < this.diagram.layeredGrid.width; ii++) {
            this.netHighlightGrid[ii] = [];
        }

        for(let ii = 0; ii < path.length; ii++) {
            // Only highlight nets directly connected to the output.
            if(path[ii] !== diagram.DIRECT_PATH) {
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

        if(currentCell.contact) {
            document.getElementById("CONTACT").style.backgroundColor = this.getColor(Diagram.CONTACT, true);
        } else {
            document.getElementById("CONTACT").style.backgroundColor = "transparent";
        }

        if(currentCell.metal2) {
            document.getElementById("METAL2").style.backgroundColor = this.getColor(Diagram.METAL2, true);
        } else {
            document.getElementById("METAL2").style.backgroundColor = "transparent";
        }

        if(currentCell.metal1) {
            document.getElementById("METAL1").style.backgroundColor = this.getColor(Diagram.METAL1, true);
        } else {
            document.getElementById("METAL1").style.backgroundColor = "transparent";
        }

        if(currentCell.poly) {
            document.getElementById("POLY").style.backgroundColor = this.getColor(Diagram.POLY, true);
        } else {
            document.getElementById("POLY").style.backgroundColor = "transparent";
        }

        if(currentCell.pdiff) {
            document.getElementById("DIFF").style.backgroundColor = this.getColor(Diagram.PDIFF, true);
        } else if(currentCell.ndiff) {
            document.getElementById("DIFF").style.backgroundColor = this.getColor(Diagram.NDIFF, true);
        } else {
            document.getElementById("DIFF").style.backgroundColor = "transparent";
        }
        
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

        document.getElementById("num-rows").innerHTML = this.diagram.layeredGrid.height;
        document.getElementById("num-cols").innerHTML = this.diagram.layeredGrid.width;

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
    
    insertRemoveRowColAt(rowColIndex, isInsert, isRow) {
        // Add or remove?
        let addend    = isInsert ? 1 : -1;
        
        // Set the new width and height.
        let newWidth  = isRow    ? this.width           : this.width + addend;
        let newHeight = isRow    ? this.height + addend : this.height;
        
        // If it's an insert, add the row/column before shifting the existing contents.
        if(isInsert) {
            // Update grid size first so we have room to shift
            this.resize(newWidth, newHeight);
            // Shift right/down from the selected row/cell
            this.shift(rowColIndex, isRow, 1);
        }
        else {
            // Shift left/up into the selected row/cell
            this.shift(rowColIndex, isRow, -1);
            // Update the grid size last now that we have shifted the contents.
            this.resize(newWidth, newHeight);
        }
    }

    coordsAreInBounds(x, y) {
        'use strict';
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    // Shift the grid
    // Sign should be a positive or negative integer
    shift(startIndex, byRow, sign) {
        'use strict';

        // Cannot be reasonably reduced further than this; make an exception.
        /* jshint maxcomplexity: 12 */ 

        let oldGrid, startX, startY, coords, oldCell, isInShiftRange,
            extendCell, cellExtendable, offsetCell, shiftCoord,
            xOffset, yOffset;

        oldGrid = this.grid;
        startX = startY = xOffset = yOffset = 0;
        
        this.grid = new Array(this.width * this.height * this.layers);

        for(let index = 0; index < this.grid.length; index++) {
            coords = this.convertToCoordinates(index);
            oldCell = oldGrid[coords.x +  (coords.y * this.width) + (coords.layer * this.width * this.height)];

            if(byRow) {
                // Shifting in Y direction.
                shiftCoord = coords.y;
                startY = startIndex;
                yOffset = sign / Math.abs(sign);

                // Are we below the shift start row?
                isInShiftRange = Boolean(this.coordsAreInBounds(0, coords.y - yOffset - startY));

                // Cell above the current cell (extend down)
                // Excludes the last row
                extendCell = oldGrid[coords.x + ((coords.y - 1) * this.width) + (coords.layer * this.width * this.height)];
                cellExtendable = coords.y < this.height - 1;
            } else {
                // Shifting in X dirction.
                shiftCoord = coords.x;
                startX = startIndex;
                xOffset = sign / Math.abs(sign);

                // Are we to the right of the shift start column?
                isInShiftRange = Boolean(this.coordsAreInBounds(coords.x - xOffset - startX, 0));

                // Cell to the left of the current cell (extend right)
                extendCell = oldGrid[coords.x - 1 +  (coords.y * this.width) + (coords.layer * this.width * this.height)];
                cellExtendable = coords.x < this.width - 1;
            }

            // The cell above or to the left of the current cell (depending on row/col mode)
            offsetCell  = oldGrid[coords.x - xOffset + ((coords.y - yOffset) * this.width) + (coords.layer * this.width * this.height)];

            // Before the start row or column: Don't shift (set same as original)
            if(shiftCoord < startIndex) {
              if(oldCell) {
                this.set(coords.x, coords.y, coords.layer);
              }
            }
            // On or after the start row or column: Shift
            // Offsets the start point depending on whether this is an insertion or deletion.
            else if(isInShiftRange) {
                if(offsetCell && this.coordsAreInBounds(coords.x - xOffset, coords.y - yOffset)) {
                    this.set(coords.x, coords.y, coords.layer);
                }
            }
            // In the case of an insertion, a blank row or column is inserted at the start index.
            // We want to auto-extend lines that originally passed through.
            // Don't extend CONTACT layer.
            else if(oldCell && cellExtendable && extendCell && coords.layer !== Diagram.CONTACT) {
                this.set(coords.x, coords.y, coords.layer);
            }
        }

        this.shiftTerminals(xOffset, yOffset, startIndex);
    }

    // Shift the terminals by a given offset
    shiftTerminals(xOffset, yOffset, startIndex) {
        'use strict';
        let shiftTerminal = function(terminal) {
            // Starting from a column.
            if(xOffset && terminal.x >= startIndex) {
                if(this.coordsAreInBounds(terminal.x + xOffset, 0)) {
                    terminal.x += xOffset;
                } else if(terminal.x + xOffset < 0) {
                    terminal.x = 0;
                } else {
                    terminal.x = this.width - 1;
                }
            }

            // Starting from a row, or default starting point
            if(yOffset && terminal.y >= startIndex) {
                if(this.coordsAreInBounds(0, terminal.y + yOffset)) {
                    terminal.y += yOffset;
                } else if(terminal.y + yOffset < 0) {
                    terminal.y = 0;
                } else {
                    terminal.y = this.height - 1;
                }
            }

            // Make sure there is still a CONTACT at the terminal.
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
        this.isNmos = !suppressTransistor && diagram.layeredGrid.get(cell.x,cell.y, Diagram.NDIFF).isSet;
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

        // There are no edges from this to otherNode,
        // then either they are the same node or they
        // are disconnected.
        return this === otherNode;
    }
 
    isTransistor() {
        'use strict';
        return this.isPmos || this.isNmos;
    }

    addEdge(node) {
        'use strict';
        let edge = new Edge(this, node);

        if(!this.isConnected(node)) {
            this.edges.push(edge);
            node.edges.push(edge);
        }
    }

    removeEdge(edge) {
        'use strict';
        let index = this.edges.indexOf(edge);
        if (index > -1) {
            this.edges.splice(index, 1);
        }
    }

    getTerm1Node() {
        let nodeIterator = this.cell.term1.nodes.values();
        let nodeTerm1 = nodeIterator.next().value;
        return nodeTerm1 === this ? nodeIterator.next().value : nodeTerm1;
    }

    getTerm2Node() {
        let nodeIterator = this.cell.term2.nodes.values();
        let nodeTerm2 = nodeIterator.next().value;
        return nodeTerm2 === this ? nodeIterator.next().value : nodeTerm2;
    }
}

// Each edge is a connection between two graph nodes.
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
        this.hasPoly = false;
        this.hasDiff = false;
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
        this.hasPoly = false;
        this.hasDiff = false;
    }

    addCell(cell) {
        'use strict';
        this.cells.add(cell);

        if(!diagram.layeredGrid.get(cell.x, cell.y, Diagram.CONTACT).isSet) {
            this.hasPoly = this.hasPoly || cell.layer === Diagram.POLY;
            this.hasDiff = this.hasDiff || cell.layer === Diagram.NDIFF || cell.layer === Diagram.PDIFF;
        }
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
    let error = false;

    // Update the diagram.netlist.
    if(!suppressSetNets) {
        diagram.setNets();
    }

    // Create a table with the correct number of rows and columns.
    // The first row should be a header.
    let table = buildTruthTable();
    let tableElement = document.getElementById("truth-table");

    tableElement.innerHTML = "";

    if(error) {
        return;
    }

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
    
    if (diagram.nmosPullup || diagram.pmosPulldown) {
        document.getElementById("pullup-pulldown-warning").classList.add("active");
    } else if(document.getElementById("pullup-pulldown-warning").classList.contains("active")) {
        document.getElementById("pullup-pulldown-warning").classList.remove("active");
    }

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
        this.view.drawGrid();
    }.bind(diagram);

    document.getElementById("add-row").onclick = function() {
        this.layeredGrid.resize(this.layeredGrid.width, this.layeredGrid.height + 1);
        this.view.drawGrid();
    }.bind(diagram);

    document.getElementById("remove-column").onclick = function() {
        this.layeredGrid.resize(this.layeredGrid.width - 1, this.layeredGrid.height);
        this.view.drawGrid();
    }.bind(diagram);

    document.getElementById("add-column").onclick = function() {
        this.layeredGrid.resize(this.layeredGrid.width + 1, this.layeredGrid.height);
        this.view.drawGrid();
    }.bind(diagram);

    document.getElementById("shift-left").onclick = function() {
        this.layeredGrid.shift(0, false, -1);
    }.bind(diagram);

    document.getElementById("shift-right").onclick = function() {
        this.layeredGrid.shift(0, false, 1);
    }.bind(diagram);

    document.getElementById("shift-up").onclick = function() {
        this.layeredGrid.shift(0, true, -1);
    }.bind(diagram);

    document.getElementById("shift-down").onclick = function() {
        this.layeredGrid.shift(0, true, 1);
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
            document.getElementById("main-container").style.display = "none";
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
        this.theme = this.theme < DiagramView.themes.length - 1 ? this.theme + 1 : 0;
        document.getElementById('palette-setting').innerHTML = DiagramView.themes[this.theme];
        setUpLayerSelector();
    }.bind(diagram.view);

    document.getElementById('toggle-transparency-btn').onclick = function() {
        this.useFlatColors = !this.useFlatColors;
        document.getElementById('transparency-setting').innerHTML = this.useFlatColors ? "OFF" : "ON";
    }.bind(diagram.view);

    setUpLayerSelector();
}

function closeMainMenu() {
    'use strict';
    let mainMenu = document.getElementById("main-menu");
    if(!mainMenu.classList.contains("closed")) {
        mainMenu.classList.add("closed");
        document.getElementById("main-container").style.display = "block";
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
    closeAboutPage() || closeOptionsMenu() || closeInstructions() || closeMainMenu() || closeTermMenu(); // jshint ignore:line
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

    setUpControls();

    populateTermSelect();
    diagram.view.refreshCanvas();
    // 60 fps
    window.requestAnimationFrame(diagram.view.refreshCanvas.bind(diagram.view));

    if(window.runTestbench) {
        runTestbench();
    }
};
