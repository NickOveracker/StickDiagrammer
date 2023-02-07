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
 *      - "jshint complexity" (cyclomatic complexity, function-by-function basis)
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
/* jshint latedef: true */
/* globals runTestbench:     false,
           debugDefinitions: false
           LZUTF8:           false */
(() => {
    'use strict';

    class LayeredGrid {
        // TODO: Consider moving to DiagramView if possible.
        // Cycle through the following cursor colors by pressing space: PDIFF, NDIFF, POLY, METAL1, CONTACT
        // Additional colors: DELETE at index (numLayers + 0)
        // Colorblind-friendly template found on [David Nichols's](https://personal.sron.nl/~pault/) website.
        // Specifically, [Paul Tol's](https://personal.sron.nl/~pault/) template was used.
        //
        // The other color scheme is borrowed from Magic VLSI.
        static get layers() {
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


        constructor(diagram, width, height, layers) {
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
            if(layer === LayeredGrid.PDIFF) {
                this.clear(x, y, LayeredGrid.NDIFF);
            } else if(layer === LayeredGrid.NDIFF) {
                this.clear(x, y, LayeredGrid.PDIFF);
            }
        }

        isTerminal(x, y, layer) {
            let isTerminal = false;

            // Loop through inputs, outputs, and VDD/GND
            isTerminal = layer === LayeredGrid.CONTACT && this.diagram.inputs.some(function(input) {
                return input.x === x && input.y === y;
            });

            isTerminal = isTerminal || layer === LayeredGrid.CONTACT && this.diagram.outputs.some(function(output) {
                return output.x === x && output.y === y;
            });

            isTerminal = isTerminal || this.diagram.vddCell.x === x && this.diagram.vddCell.y === y;
            isTerminal = isTerminal || this.diagram.gndCell.x === x && this.diagram.gndCell.y === y;

            return isTerminal;
        }

        // Clear the value at a given coordinate
        // If it's out of bounds, do nothing
        // Do not clear LayeredGrid.CONTACT for inputs, outputs, or VDD/GND
        clear(x, y, layer) {
            let outOfBounds = x < 0 || x >= this.width || y < 0 || y >= this.height || layer < 0 || layer >= this.layers;

            if(outOfBounds || layer === LayeredGrid.CONTACT && this.isTerminal(x, y, layer)) {
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
                        if(cell || includeEmpty || (bounds.cursor && bounds.cursor.x === x && bounds.cursor.y === y)) {
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

        moveWithinBounds(cell, bounds) {
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

            this.set(cell.x, cell.y, LayeredGrid.CONTACT);
        }

        // Change the height of the grid
        resize(width, height) {

            if(width <= 10 || height <= 10) {
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
            return x >= 0 && x < this.width && y >= 0 && y < this.height;
        }

        // Shift the grid
        // Sign should be a positive or negative integer
        shift(startIndex, byRow, sign) {
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
                else if(oldCell && cellExtendable && extendCell && coords.layer !== LayeredGrid.CONTACT) {
                    this.set(coords.x, coords.y, coords.layer);
                }
            }

            this.shiftTerminals(xOffset, yOffset, startIndex);
        }

        // Shift the terminals by a given offset
        shiftTerminals(xOffset, yOffset, startIndex) {
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
                this.set(terminal.x, terminal.y, LayeredGrid.CONTACT);
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

    // Set of cells that are electrically connected to one another.
    class Net {
        constructor(name, isInput) {
            this.name = name;
            this.cells = new Set();
            this.nodes = new Set();
            this.isInput = isInput;
            this.hasPoly = false;
            this.hasDiff = false;
        }

        isIdentical(net) {
            // Two nets are identical if they have the same set of cells.
            // By design, if two nets share even one cell, then they share all cells.
            // So, we can just check a single cell.
            let cell = this.cells.values().next().value;
            return net.cells.has(cell);
        }

        addNode(node) {
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
            this.nodes.delete(node);
        }

        containsNode(node) {
            return this.nodes.has(node);
        }

        clear() {
            this.cells.clear();
            this.nodes.clear();
            this.hasPoly = false;
            this.hasDiff = false;
        }

        addCell(cell, contactSet) {
            this.cells.add(cell);

            if(!contactSet) {
                this.hasPoly = this.hasPoly || cell.layer === LayeredGrid.POLY;
                this.hasDiff = this.hasDiff || cell.layer === LayeredGrid.NDIFF || cell.layer === LayeredGrid.PDIFF;
            }
        }

        containsCell(cell) {
            return this.cells.has(cell);
        }

        size() {
            return this.nodes.size;
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

    // Each diagram.graph node is a transistor, VDD, GND, or an output.
    class Node {
        constructor(cell, suppressTransistor, pdiffCell, ndiffCell) {
            this.cell = cell;
            this.edges = [];
            this.isPmos = !suppressTransistor && pdiffCell.isSet;
            this.isNmos = !suppressTransistor && ndiffCell.isSet;
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

            // There are no edges from this to otherNode,
            // then either they are the same node or they
            // are disconnected.
            return this === otherNode;
        }
     
        isTransistor() {
            return this.isPmos || this.isNmos;
        }

        addEdge(node) {
            let edge = new Edge(this, node);

            if(!this.isConnected(node)) {
                this.edges.push(edge);
                node.edges.push(edge);
            }
        }

        removeEdge(edge) {
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
        addNode(cell, suppressTransistor, pdiffCell, ndiffCell) {
            let node = new Node(cell, suppressTransistor, pdiffCell, ndiffCell);
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

    class DiagramController {
        constructor(diagram, view) {
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
            this.currentCell      = null;
        }

        removeTerminal(isOutput) {
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
                this.diagram.layeredGrid.clear(removedTerm.x, removedTerm.y, LayeredGrid.CONTACT);
            }
        }

        addTerminal(isOutput) {
            let termArr, netArr, newTerm, name;

            if(this.diagram.inputs.length + this.diagram.outputs.length >= this.diagram.maxTerminals) {
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
        }

        // Save function to save the current state of the grid and the canvas.
        // Increment save state so we can maintain an undo buffer.
        saveCurrentState() {
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
            if (this.saveState < this.lastSaveState - 1) {
                this.saveState++;
                this.diagram.layeredGrid.grid = JSON.parse(localStorage.getItem('layeredGrid' + this.saveState));
            }
        }

        pixelIsInBounds() {
            let boundingBox = this.view.canvas.getBoundingClientRect();
            return this.currentX > boundingBox.left   + this.view.cellWidth &&
                   this.currentX < boundingBox.right  - this.view.cellWidth &&
                   this.currentY > boundingBox.top    + this.view.cellHeight &&
                   this.currentY < boundingBox.bottom - this.view.cellHeight;
        }

        getCellAtCursor() {
            // Ignore if not inside the canvas
            if (this.pixelIsInBounds(this.currentX, this.currentY)) {

                let x = Math.floor((this.currentX - this.view.canvas.getBoundingClientRect().left - this.view.cellWidth) / this.view.cellWidth);
                let y = Math.floor((this.currentY - this.view.canvas.getBoundingClientRect().top - this.view.cellHeight) / this.view.cellHeight);
                this.currentCell = {
                    x: x,
                    y: y,
                    pdiff:   this.diagram.layeredGrid.get(x, y, LayeredGrid.PDIFF).isSet,
                    ndiff:   this.diagram.layeredGrid.get(x, y, LayeredGrid.NDIFF).isSet,
                    poly:    this.diagram.layeredGrid.get(x, y, LayeredGrid.POLY).isSet,
                    metal1:  this.diagram.layeredGrid.get(x, y, LayeredGrid.METAL1).isSet,
                    metal2:  this.diagram.layeredGrid.get(x, y, LayeredGrid.METAL2).isSet,
                    contact: this.diagram.layeredGrid.get(x, y, LayeredGrid.CONTACT).isSet,
                    del:     this.diagram.layeredGrid.get(x, y, LayeredGrid.DELETE).isSet,
                };
            } else {
                this.currentCell = {};
            }
            return this.currentCell;
        }

        clearIfPainted(clientX, clientY) {

            // Set a variable to true if any of the layers are set.
            let anyLayerSet = false;

            // Ignore if not inside the canvas
            if (this.pixelIsInBounds(clientX, clientY)) {
                let x = Math.floor((clientX - this.view.canvas.getBoundingClientRect().left - this.view.cellWidth) / this.view.cellWidth);
                let y = Math.floor((clientY - this.view.canvas.getBoundingClientRect().top - this.view.cellHeight) / this.view.cellHeight);

                // Erase all layers of the cell.
                LayeredGrid.layers.forEach(function (_, layer) {
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
            let ret = {};

            if(event.clientX === undefined) {
                ret.x = event.changedTouches[0].clientX;
                ret.y = event.changedTouches[0].clientY;
            } else {
                ret.x = event.clientX;
                ret.y = event.clientY;
            }

            this.currentX = ret.x;
            this.currentY = ret.y;

            return ret;
        }

        isPrimaryInput(event) {
            let isTouch      = event.type.includes('touch');
            let isLeftButton = (event.type === 'mousedown' || event.type === 'mouseup') && event.button === 0;
            isLeftButton     = isLeftButton || (event.type === 'mousemove' && event.buttons === 1);
            return isLeftButton || isTouch;
        }

        placeTerminal(event, terminal, useGridCoords) {
            let cell;
            let oldX, oldY;

            if(useGridCoords) {
                cell = terminal;
            } else {
                cell = this.getCellAtCursor();
            }

            if (Object.hasOwn(cell, "x") && !event.ctrlKey) {
                // First, note the current coordinates.
                oldX = terminal.x;
                oldY = terminal.y;
                // Then, set the new coordinates.
                terminal.x = cell.x;
                terminal.y = cell.y;
                // Set the CONTACT layer at the new coordinates.
                this.diagram.layeredGrid.set(cell.x, cell.y, LayeredGrid.CONTACT);
                // Unset the CONTACT layer at the old coordinates.
                this.diagram.layeredGrid.clear(oldX, oldY, LayeredGrid.CONTACT);
            }
        }

        // Change the layer/cursor color
        // layerIndex is optional; if not provided, the next layer is used
        changeLayer(layerIndex) {
            if(layerIndex === undefined) {
                // Go to the next selectable index.
                let tempIndex = this.cursorIndex + 1;

                while(tempIndex >= LayeredGrid.layers.length || !LayeredGrid.layers[tempIndex].selectable) {
                    tempIndex = tempIndex >= LayeredGrid.layers.length - 1 ? 0 : tempIndex + 1;
                }
                this.cursorIndex = tempIndex;

                // set the outer border of the canvas to the new cursor color
                this.view.drawBorder();
            } else {
                this.cursorIndex = layerIndex;
            }
        }
    }

    class DiagramView {
        static get themes() {
            return [
                'Tol',
                'Sorcery',
                'Stix',
            ];
        }

        constructor(diagram, mainCanvas, gridCanvas) {
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
            this.darkMode = false;
            this.darkModeGridColor  = '#cccccc';
            this.lightModeGridColor = '#999999';
        }

        getCellHoverColor() {
            return this.darkMode ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)";
        }
        
        // Draw a faint grid on the canvas.
        // Add an extra 2 units to the width and height for a border.
        drawGrid() {
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
            if(this.darkMode) {
                this.gridCtx.strokeStyle = this.darkModeGridColor;
            } else {
                this.gridCtx.strokeStyle = this.lightModeGridColor;
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
            let layerObj = LayeredGrid.layers[layer];
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
            if(this.diagram.controller.eraseMode) {
                this.ctx.strokeStyle = this.getColor(LayeredGrid.DELETE);
            } else {
                this.ctx.strokeStyle = this.getColor(this.diagram.controller.cursorIndex);
            }
            this.ctx.lineWidth = this.cellWidth;
            this.ctx.strokeRect(this.cellWidth / 2, this.cellWidth / 2, this.canvasWidth - this.cellWidth, this.canvas.height - this.cellWidth);

            // Draw a thick border on the edge of the border drawn above.
            this.ctx.lineWidth = this.cellWidth / 4;
            this.ctx.strokeStyle = this.darkMode ? "#ffffff" : "#000000";
            this.ctx.strokeRect(1 + this.cellWidth - this.ctx.lineWidth / 2,
                1 + this.cellHeight - this.ctx.lineWidth / 2,
                this.canvasWidth - 2 * this.cellWidth + this.ctx.lineWidth / 2,
                this.canvasHeight - 2 * this.cellHeight + this.ctx.lineWidth / 2
            );

            // For the middle 11 cells of the upper border, fill with the grid color.
            this.ctx.fillStyle = this.darkMode ? "#ffffff" : "#000000";
            let startCell = Math.floor(this.diagram.layeredGrid.width / 2) - 4;
            this.ctx.fillRect(startCell * this.cellWidth, 0, this.cellWidth * 11, this.cellHeight);

            // Write the cursor color name in the middle of the upper border of the canvas.
            this.ctx.fillStyle = this.darkMode ? '#000000' : '#ffffff';
            this.ctx.font = Math.floor(this.cellHeight) + 'px Arial';
            this.ctx.textAlign = 'center';

            if(this.diagram.controller.eraseMode) {
                this.ctx.fillText('erase', this.canvasWidth / 2, this.cellHeight * 3 / 4);
            } else {
                this.ctx.fillText(LayeredGrid.layers[this.diagram.controller.cursorIndex].name, this.canvasWidth / 2, this.cellHeight * 3 / 4);
            }
        }

        // Resize the canvas to the largest square that fits in the window.
        resizeCanvas() {
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
            // Draw labels on the canvas above each input and output.
            this.ctx.font = "bold " + Math.floor(this.cellHeight) + "px Arial";
            this.ctx.fillStyle = this.darkMode ? "#ffffff" : "#000000";

            // Draw labels for all terminals.
            this.diagram.getTerminals().forEach(((terminal, index) => {
                this.ctx.fillText(this.diagram.getTerminalName(index),
                    this.cellWidth  * (terminal.x + 1.5),
                    this.cellHeight * (terminal.y + 0.75));
            }).bind(this));
        }

        // Check the layers of the grid, and draw cells as needed.
        drawCell(ii, jj, layer) {
            let currentCell, hoverCell,
                isCurrentRow, isCurrentCol, isCurrentCell;

            currentCell   = this.diagram.controller.currentCell;
            isCurrentCol  = ii === currentCell.x;
            isCurrentRow  = jj === currentCell.y;
            isCurrentCell = isCurrentCol && isCurrentRow;
            
            if(this.diagram.controller.dragging || this.diagram.controller.placeTermMode) {
                hoverCell = (isCurrentRow || isCurrentCol);
            } else {
                hoverCell = isCurrentCell;
            }

            // Only hover on top layer.
            hoverCell = hoverCell && layer === LayeredGrid.layers.length - 1;
            // Do not hover when erasing.
            hoverCell = hoverCell && !currentCell.del;

            if (this.diagram.layeredGrid.get(ii, jj, layer).isSet) {
                this.ctx.fillStyle = this.getColor(layer);
                this.ctx.fillRect((ii+1) * this.cellWidth, (jj+1) * this.cellHeight - 1, this.cellWidth + 1, this.cellHeight + 2);
            } else if(hoverCell) {
                // Draw a faint highlight on the cell at the cursor location,
                // or on the entire row and column when dragging.
                this.ctx.fillStyle = this.getCellHoverColor();
                this.ctx.fillRect((ii+1) * this.cellWidth, (jj+1) * this.cellHeight - 1, this.cellWidth + 1, this.cellHeight + 2);
            }

            this.setCellHighlight(this.ctx, ii, jj);
        }
            
        setCellHighlight(ctx, x, y) {
            if(this.highlightNets && this.netHighlightGrid[x] && this.netHighlightGrid[x][y]) {
                let baseColor = this.getColor(LayeredGrid.DELETE, false).slice(0, -4);
                ctx.fillStyle = baseColor + 
                                Math.round(
                                    Math.sin(
                                        (Math.floor(Date.now()/100) % 10) * Math.PI / 10
                                    ) * 10
                                ) / 10 + ")";
                ctx.fillRect((x+1) * this.cellWidth, (y+1) * this.cellHeight - 1, this.cellWidth + 1, this.cellHeight + 2);
            }
        }

        // Mark the cells connected to the output node for a given set of inputs
        // so they can be highlighted in the canvas.
        //
        // path: The row of the relevant nodeNodeMap corresponding to the chosen output node.
        setPathHighlight(path) {
            this.netHighlightGrid.length = 0;

            for(let ii = 0; ii < this.diagram.layeredGrid.width; ii++) {
                this.netHighlightGrid[ii] = [];
            }

            for(let ii = 0; ii < path.length; ii++) {
                // Only highlight nets directly connected to the output.
                if(path[ii] !== this.diagram.DIRECT_PATH) {
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
            this.resizeCanvas();

            let currentCell = this.diagram.controller.getCellAtCursor();

            if(currentCell.contact) {
                document.getElementById("CONTACT").style.backgroundColor = this.getColor(LayeredGrid.CONTACT, true);
            } else {
                document.getElementById("CONTACT").style.backgroundColor = "transparent";
            }

            if(currentCell.metal2) {
                document.getElementById("METAL2").style.backgroundColor = this.getColor(LayeredGrid.METAL2, true);
            } else {
                document.getElementById("METAL2").style.backgroundColor = "transparent";
            }

            if(currentCell.metal1) {
                document.getElementById("METAL1").style.backgroundColor = this.getColor(LayeredGrid.METAL1, true);
            } else {
                document.getElementById("METAL1").style.backgroundColor = "transparent";
            }

            if(currentCell.poly) {
                document.getElementById("POLY").style.backgroundColor = this.getColor(LayeredGrid.POLY, true);
            } else {
                document.getElementById("POLY").style.backgroundColor = "transparent";
            }

            if(currentCell.pdiff) {
                document.getElementById("DIFF").style.backgroundColor = this.getColor(LayeredGrid.PDIFF, true);
            } else if(currentCell.ndiff) {
                document.getElementById("DIFF").style.backgroundColor = this.getColor(LayeredGrid.NDIFF, true);
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
                if (layer === LayeredGrid.CONTACT) {
                    if (this.diagram.layeredGrid.get(x, y, layer).isSet) {
                        this.decorateContact(x, y);
                    }
                }
            }.bind(this), this.diagram.controller.dragging || this.diagram.controller.placeTermMode);

            // set the outer border of the canvas to the cursor color
            this.drawBorder();
            this.drawLabels();

            document.getElementById("num-rows").innerHTML = this.diagram.layeredGrid.height;
            document.getElementById("num-cols").innerHTML = this.diagram.layeredGrid.width;
        }
    }

    class Diagram {
        constructor(mainCanvas, gridCanvas) {
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
            this.maxTerminals = 8;
            
            this.view = new DiagramView(this, mainCanvas, gridCanvas);
            this.controller = new DiagramController(this, this.view, mainCanvas);
        }

        encode() {
            const code = [];
            let bitNo = 7;
            let codeByte = 0;

            // Header
            code.push(this.layeredGrid.width);
            code.push(this.layeredGrid.height);
            code.push(this.layeredGrid.layers - 1);
            code.push(this.inputs.length);
            code.push(this.outputs.length);

            // Terminal locations
            [this.vddCell, this.gndCell,].concat(this.inputs.concat(this.outputs)).forEach(function(terminal) {
                code.push(terminal.x);
                code.push(terminal.y);
            });
            
            // Cells
            for(let lyr = 0; lyr < this.layeredGrid.layers - 1; lyr++) {
                for(let col = 0; col < this.layeredGrid.width; col++) {
                    for(let row = 0; row < this.layeredGrid.height; row++) {
                        if(this.layeredGrid.get(row,col,lyr).isSet) {
                            /*jslint bitwise: true */
                            codeByte = codeByte | (1 << bitNo);
                            /*jslint bitwise: false */
                        }
                        bitNo--;

                        if(bitNo < 0) {
                            bitNo = 7;
                            code.push(codeByte);
                            codeByte = 0;
                        }
                    }
                }
            }

            // Leftover bits
            if(bitNo < 7) {
                code.push(codeByte);
            }

            return window.LZUTF8.compress(new Uint8Array(code), {outputEncoding: "Base64",});
        }

        decode(stringBase64) {
            const setGrid    = window.LZUTF8.decompress(stringBase64, {outputEncoding: "ByteArray", inputEncoding: "Base64",});
            const setWidth   = setGrid.splice(0,1)[0];
            const setHeight  = setGrid.splice(0,1)[0];
            const setDepth   = setGrid.splice(0,1)[0];
            const numInputs  = setGrid.splice(0,1)[0];
            const numOutputs = setGrid.splice(0,1)[0];

            this.vddCell.x   = setGrid.splice(0,1)[0];
            this.vddCell.y   = setGrid.splice(0,1)[0];
            this.gndCell.x   = setGrid.splice(0,1)[0];
            this.gndCell.y   = setGrid.splice(0,1)[0];

            this.inputs.length = 0;
            this.outputs.length = 0;
            this.layeredGrid.resize(setWidth, setHeight);

            for(let ii = 0; ii < numInputs + numOutputs; ii++) {
                if(ii < numInputs) {
                    this.inputs[ii].x = setGrid.splice(0,1)[0];
                    this.inputs[ii].y = setGrid.splice(0,1)[0];
                } else {
                    this.outputs[ii - numInputs].x = setGrid.splice(0,1)[0];
                    this.outputs[ii - numInputs].y = setGrid.splice(0,1)[0];
                }
            }

            // Cells
            let cellIndex = 0;
            let bitShift;
            for(let lyr = 0; lyr < this.layeredGrid.layers - 1 && lyr < setDepth; lyr++) {
                for(let col = 0; col < this.layeredGrid.width; col++) {
                    for(let row = 0; row < this.layeredGrid.height; row++) {
                        /*jslint bitwise: true */
                        bitShift = 1 << (7 - cellIndex % 8);
                        if(setGrid[Math.floor(cellIndex/8)] & bitShift) {
                            this.layeredGrid.set(row, col, lyr);
                        } else {
                            this.layeredGrid.clear(row, col, lyr);
                        }
                        /*jslint bitwise: false */
                    }
                }
            }

            // Terminals
            [this.vddCell, this.gndCell,].concat(this.inputs.concat(this.outputs)).forEach(function(cell) {
                this.controller.placeTerminal(cell, cell, true);
            }.bind(this));
        }

        initCells() {
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

            this.layeredGrid = new LayeredGrid(this, startWidth, startHeight, LayeredGrid.layers.length);
        }

        initNets() {
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
            this.graph = new Graph();
            this.inputNodes  = [];
            this.outputNodes = [];
            this.nmos = new Set();
            this.pmos = new Set();
            this.nodeNodeMap = [];
        }

        // Clear previous anaysis.
        clearAnalyses() {
            this.analyses.forEach(analysis => {
                analysis.forEach(row => {
                    row.length = 0;
                });
                analysis.length = 0;
            });
        }

        getTerminals() {
            return [].concat(this.vddCell, this.gndCell, this.inputs, this.outputs);
        }

        getTerminalName(index) {
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
            return this.nodeNodeMap[this.graph.getIndexByNode(node1)][this.graph.getIndexByNode(node2)];
        }

        // This function updates the mappings between nodes in the graph to reflect whether a path exists between them.
        // Paths are broken down into direct (same net) and virtual (input set to 1 or 0 rather than actual VDD or GND on net).
        //
        // Virtual paths are unidirectional.
        // If an input is set to 0, then everything on the same net as that input will be virtually mapped to GND.
        // However, the net will *not* be mapped to everything on the same net as the actual GND node.
        mapNodes(node1, node2, setPath) {
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
            return node === this.gndNode || node === this.vddNode;
        }

        remap(mapNode1Index, mapNode2Index, mapping) {
            this.nodeNodeMap[mapNode1Index][mapNode2Index] = mapping;
            this.nodeNodeMap[mapNode2Index][mapNode1Index] = mapping;
        }
        
        updateVirtualPath(compareNodeMapping, nodeToMap, remapNode, setPath) {
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
            let compareNodeMapping = this.nodeNodeMap[nodeToMap][this.graph.getIndexByNode(compareNode)];
            let mapFromRail = this.isRailNode(compareNode);
            
            if(!mapFromRail && setPath === this.DIRECT_PATH && compareNodeMapping.direct === false) {
                this.remap(nodeToMap, this.graph.getIndexByNode(remapNode), this.VIRTUAL_PATH_ONLY);
            }
        }
        
        updateUndefinedPath(compareNode, nodeToMap, remapNode, setPath) {
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
            let targetNodeReachable, nodeTerm1, nodeTerm2, od,
                gndPathExistsActivated, vddPathExistsActivated;
            // We will need to restore the old map after half of the
            // operation below, but there is no need to restore it at the
            // end. We will have determined that either there is a conflict
            // (i.e., the output will be assigned X),
            // or that the gate doesn't matter at all (i.e., the output
            // doesn't change depending on the gate's state).
            // There is no case in which we need to consider the gate
            // to be specifically open or closed after returning.
            const backupNodeNodeMap = [];

            const mapCopy = function(from, to) {
                for(let ii = 0; ii < from.length; ii++) {
                    to[ii] = [...from[ii],];
                }
            };

            // Source and drain nodes are interchangeable.
            // They're just named  that way here for readability
            const allPathsOk = function(sourceNode, drainNode, testNode, activePathExists) {
                const path1 = this.getMapping(sourceNode, testNode);
                const path2 = this.getMapping(drainNode,  testNode);
                const pathToTarget1 = this.getMapping(sourceNode, targetNode);
                const pathToTarget2 = this.getMapping(drainNode, targetNode);
                const directPath    = this.getMapping(testNode, targetNode);

                // Note: Can be undefined.
                return Boolean(directPath.hasPath) ||
                       Boolean(pathToTarget1.hasPath) && Boolean(path1.hasPath) || 
                       Boolean(pathToTarget2.hasPath) && Boolean(path2.hasPath) ||
                       Boolean(path1.hasPath) === Boolean(path2.hasPath) &&
                       Boolean(path1.hasPath) === Boolean(activePathExists.hasPath);
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
                gndPathExistsActivated = this.recurseThroughEdges(nodeTerm1, this.gndNode, inputVals);
                vddPathExistsActivated = this.recurseThroughEdges(nodeTerm1, this.vddNode, inputVals);

                mapCopy(backupNodeNodeMap, this.nodeNodeMap);
                od = od || this.overdrivenPath;
                this.overdrivenPath = false;

                // If there is a conflict when activated, then the target node is definitely overdriven.
                // As long as there is no conflict, proceed.
                if(!gndPathExistsActivated.hasPath || !vddPathExistsActivated.haspPath) {
                    // The active paths are fine.
                    // Now try with the gate inactive.
                    this.deactivateGate(node);
                    this.recurseThroughEdges(node, this.gndNode, inputVals);
                    this.recurseThroughEdges(node, this.vddNode, inputVals);
                    this.recurseThroughEdges(nodeTerm1, targetNode, inputVals);
                    this.recurseThroughEdges(nodeTerm2, targetNode, inputVals);
                    
                    od = od || this.overdrivenPath || 
                         !allPathsOk(nodeTerm1, nodeTerm2, this.gndNode, gndPathExistsActivated) ||
                         !allPathsOk(nodeTerm1, nodeTerm2, this.vddNode, vddPathExistsActivated);

                    mapCopy(backupNodeNodeMap, this.nodeNodeMap);
                }
            }

            // No path to targetNode === No problem
            this.overdrivenPath = od;
            mapCopy(backupNodeNodeMap, this.nodeNodeMap);
        }

        recurseThroughEdges(node, targetNode, inputVals) {
            let pathFound;
            let hasNullPath = false;

            node.edges.some(function(edge) {
                let otherNode = edge.getOtherNode(node);
                let mapping = this.getMapping(otherNode, targetNode);
              
              	if(!mapping.direct && (otherNode === this.vddNode || otherNode === this.gndNode)) {
                  return false;
                }

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
            // Don't do this for overdriven paths; it screws up multiple outputs
            if(!this.overdrivenPath) {
                this.analyses[inputVals] = [...this.nodeNodeMap,];
            }

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
                lowLayer:  Math.min(LayeredGrid.PDIFF, LayeredGrid.NDIFF),
                highLayer: Math.max(LayeredGrid.PDIFF, LayeredGrid.NDIFF),
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

        // Push all terminal nets to the netlist.
        resetNetlist() {
            // Clear the netlist.
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
            this.clearCircuit();
            this.resetNetlist();

            this.inputNets.forEach(function (net) { net.clear(); });
            this.outputNets.forEach(function (net) { net.clear(); });

            // Add rail nodes to the this.graph.
            this.vddNode = this.graph.addNode(this.layeredGrid.get(this.vddCell.x, this.vddCell.y, LayeredGrid.CONTACT), true);
            this.gndNode = this.graph.addNode(this.layeredGrid.get(this.gndCell.x, this.gndCell.y, LayeredGrid.CONTACT), true);

            this.vddNet.addNode(this.vddNode);
            this.gndNet.addNode(this.gndNode);

            // Add the VDD and GND nets.
            // Loop through every VDD cell and add to the VDD net.
            this.setRecursively(this.layeredGrid.get(this.vddCell.x, this.vddCell.y, LayeredGrid.CONTACT), this.vddNet);

            // Loop through every GND cell and add to the GND net.
            this.setRecursively(this.layeredGrid.get(this.gndCell.x, this.gndCell.y, LayeredGrid.CONTACT), this.gndNet);

            // Loop through the terminals and set their respective nets.
            this.inputs.forEach(function(input, index) {
                this.setRecursively(this.layeredGrid.get(input.x, input.y, LayeredGrid.CONTACT), this.inputNets[index]);
            }.bind(this));

            this.outputs.forEach(function(output, index) {
                this.setRecursively(this.layeredGrid.get(output.x, output.y, LayeredGrid.CONTACT), this.outputNets[index]);
            }.bind(this));

            // Add input nodes to the graph.
            this.inputNodes.length = 0;
            this.inputs.forEach(function(input, index) {
                this.inputNodes[index] = this.graph.addNode(this.layeredGrid.get(input.x, input.y, LayeredGrid.CONTACT), true);
                this.inputNets[index].addNode(this.inputNodes[index]);
            }.bind(this));

            // Add output nodes to the graph.
            this.outputNodes.length = 0;
            this.outputs.forEach(function(output, index) {
                this.outputNodes[index] = this.graph.addNode(this.layeredGrid.get(output.x, output.y, LayeredGrid.CONTACT), true);
                this.outputNets[index].addNode(this.outputNodes[index]);
            }.bind(this));

            this.processTransistors();
            this.linkIdenticalNets();
            this.checkPolarity();
        } // end function setNets

        processTransistors() {
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
                    net.addCell(transistor[term], this.layeredGrid.get(transistor[term].x, transistor[term].y, LayeredGrid.CONTACT).isSet);
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
        }

        // Add a node to a net that does not yet have any nodes.
        assignEmptyNode(net) {
            let node = this.graph.addNode(net.cells.values().next().value, true);
            net.addNode(node);
            return node;
        }

        checkPolarity() {
            this.nmosPullup = this.pmosPulldown = false;

            // See if there are any NDIFF cells in vddNet.
            // If there are, flag for nmos pullup.
            let vddNetIterator = this.vddNet.cells.values();
            let cell = vddNetIterator.next();
            while (!cell.done) {
                if (cell.value.layer === LayeredGrid.NDIFF) {
                    this.nmosPullup = true;
                }
                cell = vddNetIterator.next();
            }

            // Now check if there are any PDIFF cells in gndNet.
            // If there are, flag for pmos pulldown.
            let gndNetIterator = this.gndNet.cells.values();
            cell = gndNetIterator.next();
            while (!cell.done) {
                if (cell.value.layer === LayeredGrid.PDIFF) {
                    this.pmosPulldown = true;
                }
                cell = gndNetIterator.next();
            }
        }

        linkIdenticalNets() {
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
            for (let ii = 0; ii < this.netlist.length; ii++) {
                if (this.netlist[ii].containsCell(cell)) {
                    return this.netlist[ii];
                }
            }
            return null;
        }
       
        // Helper function to set the terminals of transistors.
        setTerminals(transistor, x, y, layer) {
            let cell = this.layeredGrid.get(x, y, layer);
            
            if (!!cell && cell.isSet) {
                if(this.layeredGrid.get(x, y, LayeredGrid.POLY).isSet) {
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

        // If the cell is NDIFF or PDIFF intersected by POLY, create a transistor.
        // Exception for LayeredGrid.CONTACT.
        // Returns true if the cell is a transistor.
        // Side effect: Adds a transistor (if found) to this.nmos or this.pmos.
        checkIfTransistor(cell) {
            // If the layer is NDIFF or PDIFF and there is also a POLY at the same location,
            // add the cell to transistors.
            // (Except when there is also a contact)

            let handleCell = function(layer, transistorArray) {
                if (!transistorArray.has(cell) && cell.layer === layer && cell.isSet) {
                    if (this.layeredGrid.get(cell.x, cell.y, LayeredGrid.POLY).isSet && !this.layeredGrid.get(cell.x, cell.y, LayeredGrid.CONTACT).isSet) {
                        // Set the gate to the poly cell.
                        cell.gate = this.layeredGrid.get(cell.x, cell.y, LayeredGrid.POLY);

                        // Check adjacent cells for NDIFF.
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
                            this.graph.addNode(
                                cell,
                                false,
                                this.layeredGrid.get(cell.x, cell.y, LayeredGrid.PDIFF),
                                this.layeredGrid.get(cell.x, cell.y, LayeredGrid.NDIFF)
                            );
                            return true;
                        }
                    }
                }
                return false;
            }.bind(this);

            return handleCell(LayeredGrid.PDIFF, this.pmos) || handleCell(LayeredGrid.NDIFF, this.nmos);
        }

        // For each layer of the cell in the net, recurse with all adjacent cells in the layer.
        // Generic function for the above code.
        setAdjacent(deltaX, deltaY, net, cell) {
            // Don't connect contacts to adjacent contacts.
            if(cell.layer === LayeredGrid.CONTACT) {
                return;
            }

            if (net.containsCell(this.layeredGrid.get(cell.x, cell.y, cell.layer)) && this.layeredGrid.get(cell.x + deltaX, cell.y + deltaY, cell.layer).isSet) {
                if (net.containsCell(this.layeredGrid.get(cell.x + deltaX, cell.y + deltaY, cell.layer)) === false) {
                    this.setRecursively(this.layeredGrid.get(cell.x + deltaX, cell.y + deltaY, cell.layer), net);
                }
            }
        }

        handleContact(cell, net) {
            if (this.layeredGrid.get(cell.x, cell.y, LayeredGrid.CONTACT).isSet) {
                LayeredGrid.layers.forEach(function(_, layer) {
                    if(layer === LayeredGrid.DELETE) {
                        return;
                    }
                    if (!this.layeredGrid.get(cell.x, cell.y, layer).isSet) {
                        return;
                    }
                    if (net.containsCell(this.layeredGrid.get(cell.x, cell.y, layer)) === false) {
                        net.addCell(this.layeredGrid.get(cell.x, cell.y, layer), true);
                        this.setRecursively(this.layeredGrid.get(cell.x, cell.y, layer), net);
                    }
                }.bind(this));
            }
        }

        setRecursively(cell, net) {
            let gateNet;
            net.addNode(this.graph.getNode(cell));

            // Return if this cell is in this.pmos or this.nmos already.
            if (this.nmos.has(cell) || this.pmos.has(cell)) {
                return;
            }

            // Check the cell for a transistor.
            // If this is in a diffusion layer, do not propogate past a transistor.
            if (this.checkIfTransistor(cell)) {
                gateNet = this.getNet(this.layeredGrid.get(cell.x,cell.y,LayeredGrid.POLY)); 

                if(gateNet === null) {
                    gateNet = new Net("gate", false);
                }

                this.setRecursively(this.layeredGrid.get(cell.x, cell.y, LayeredGrid.POLY), gateNet);
                this.netlist.push(gateNet);

                return;
            }

            // If this is in the poly layer, we don't need to stop at a transistor.
            if (cell.layer === LayeredGrid.POLY) {
                this.checkIfTransistor(this.layeredGrid.get(cell.x, cell.y, LayeredGrid.NDIFF));
                this.checkIfTransistor(this.layeredGrid.get(cell.x, cell.y, LayeredGrid.PDIFF));
            }

            // Add the cell to the net.
            net.addCell(cell, this.layeredGrid.get(cell.x, cell.y, LayeredGrid.CONTACT).isSet);

            // If LayeredGrid.CONTACT is set, add add all layers to the net.
            this.handleContact(cell, net);

            // Check the cells above and below.
            if (cell.y > 0) { this.setAdjacent(0, -1, net, cell); }
            if (cell.y < this.layeredGrid.height - 1) { this.setAdjacent(0, 1, net, cell); }

            // Check the cells to the left and right.
            if (cell.x > 0) { this.setAdjacent(-1, 0, net, cell); }
            if (cell.x < this.layeredGrid.width - 1) { this.setAdjacent(1, 0, net, cell); }
        }
    }

    class UserInterface {
        constructor(diagram) {
            this.diagram           = diagram;
            this.diagramController = diagram.controller;
            this.diagramView       = diagram.view;
            this.diagramGrid       = diagram.layeredGrid;

            // Order matters
            // Lower-indexed menus are displayed at the same level as or over higher-indexed menus.
            this.menus = [
                "licenses-menu",
                "tutorials",
                "instructions",
                "about-page",
                "options-menu",
                "main-menu",
                "terminal-menu",
            ];

            this.allCommands        = [];
            this.shiftCommands      = [];
            this.ctrlCommands       = [];
            this.noModifierCommands = [];

            this.initTerminalPlacementCommands();
            this.initNavigationCommands();
            this.initCosmeticCommands();
            this.initHistoryCommands();
            this.initRowColCommands();

            this.allCommands.forEach(function(command) {
                if(command.ctrlModifier) {
                    this.ctrlCommands[command.keyCode] = command.action;
                }
                else if(command.shiftModifier) {
                    this.shiftCommands[command.keyCode] = command.action;
                }
                else {
                    this.noModifierCommands[command.keyCode] = command.action;
                }
            }.bind(this));

            this.addListeners();
            this.setUpControls();
        
            // Set to dark mode if it is night time
            this.setDarkMode(new Date().getHours() > 19 || new Date().getHours() < 7);
            this.populateTermSelect();

            if(window.runTestbench) {
                // Must initialize the canvas before the testbench runs.
                this.diagramView.refreshCanvas();
            }
        }

        keydownHandler(event) {
            if(!document.getElementById("main-menu").classList.contains("closed")) {
                return;
            }
            
            let isInput  = function(keyCode) {
                return (keyCode >= 65) && (keyCode < 65 + this.diagram.inputs.length);
            }.bind(this);
            
            let isOutput = function(keyCode) {
                return (keyCode <= 89) && (keyCode > 89 - this.diagram.outputs.length);
            }.bind(this);
            // GND and VDD are handled in shiftCommandHandler.

            if (event.shiftKey && this.shiftCommands[event.keyCode]) {
                event.preventDefault();
                this.shiftCommands[event.keyCode](event);
            }
            else if (event.ctrlKey && this.ctrlCommands[event.keyCode])           {
                event.preventDefault();
                this.ctrlCommands[event.keyCode](event);
            }
            else if (isInput(event.keyCode))  {
                event.preventDefault();
                this.diagramController.placeTerminal(event, this.diagram.inputs[event.keyCode - 65]);
            }
            else if (isOutput(event.keyCode)) {
                event.preventDefault();
                this.diagramController.placeTerminal(event, this.diagram.outputs[this.diagram.outputs.length - 90 + event.keyCode]);
            }
        }

        // Only change dark/light mode on keyup to avoid seizure-inducing flashes from holding down space.
        keyupHandler(event) {
            if(document.getElementById("main-menu").classList.contains("closed")) {
                // Only do the following if ctrl is pressed.
                if (event.ctrlKey && this.ctrlCommands[event.keyCode]) {
                    // Run the registered shift command.
                    this.ctrlCommands[event.keyCode](event);
                }
                // Only do the following if shift is pressed.
                else if (event.shiftKey && this.shiftCommands[event.keyCode]) {
                    // Run the registered shift command.
                    this.shiftCommands[event.keyCode](event);
                }
            }

            if (!event.shiftKey && !event.ctrlKey && this.noModifierCommands[event.keyCode]) {
                this.noModifierCommands[event.keyCode](event);
            }
        }

        initHistoryCommands() {
            this.undoCommand = {
                // CTRL-Z
                ctrlModifier: true,
                keyCode:      90,
                action:       function(e) {
                    if(e.type.includes('down')) {
                        this.diagramController.undo();
                    }
                }.bind(this),
            };
            this.redoCommand = {
                // CTRL-Y
                ctrlModifier: true,
                keyCode:      89,
                action:       function(e) {
                    if(e.type.includes('down')) {
                        this.diagramController.redo();
                    }
                }.bind(this),
            };

            this.allCommands.push(this.undoCommand);
            this.allCommands.push(this.redoCommand);
        }

        initNavigationCommands() {
            this.exitMenuCommand = {
                // ESC
                keyCode: 27,
                action:  function() {
                    this.closeTopMenu();
                }.bind(this),
            };
            this.evaluateCommand = {
                // ENTER
                keyCode: 13,
                action:  function() {
                    this.refreshTruthTable();
                }.bind(this),
            };

            this.allCommands.push(this.exitMenuCommand);
            this.allCommands.push(this.evaluateCommand);
        }

        initTerminalPlacementCommands() {
            // SHIFT + V
            this.placeVddCommand = {
                shiftModifier: true,
                keyCode:       86,
                action:        function(e) {
                    if(e.type.includes('down')) {
                        this.diagramController.placeTerminal(e, this.diagram.vddCell);
                    }
                }.bind(this),
            };

            // SHIFT + G
            this.placeGndCommand = {
                shiftModifier: true,
                keyCode:       71,
                action:        function(e) {
                    if(e.type.includes('down')) {
                        this.diagramController.placeTerminal(e, this.diagram.gndCell);
                    }
                }.bind(this),
            };

            // I
            this.addInputCommand = {
                keyCode: 73,
                action:  function(e) {
                    if(e.type.includes('up')) {
                        this.diagramController.addTerminal(false);
                        this.populateTermSelect();
                    }
                }.bind(this),
            };

            // O
            this.addOutputCommand = {
                keyCode: 79,
                action:  function(e) {
                    if(e.type.includes('up')) {
                        this.diagramController.addTerminal(true);
                        this.populateTermSelect();
                    }
                }.bind(this),
            };

            // SHIFT+I
            this.removeInputCommand = {
                shiftModifier: true,
                keyCode: 73,
                action:  function(e) {
                    if(e.type.includes('up')) {
                        this.diagramController.removeTerminal(false);
                        this.populateTermSelect();
                    }
                }.bind(this),
            };

            // SHIFT+O
            this.removeOutputCommand = {
                shiftModifier: true,
                keyCode: 79,
                action:  function(e) {
                    if(e.type.includes('up')) {
                        this.diagramController.removeTerminal(true);
                        this.populateTermSelect();
                    }
                }.bind(this),
            };

            this.placeIOCommand = {
                keyCode: null,
                action:  null,
            };

            this.allCommands.push(this.placeVddCommand);
            this.allCommands.push(this.placeGndCommand);
            this.allCommands.push(this.addInputCommand);
            this.allCommands.push(this.addOutputCommand);
            this.allCommands.push(this.removeInputCommand);
            this.allCommands.push(this.removeOutputCommand);
        }

        initRowColCommands() {
            // SHIFT + LEFT ARROW
            this.shiftLeftCommand = {
                shiftModifier: true,
                keyCode: 37,
                action:  function(e) {
                    if(e.type.includes('up')) {
                        this.diagramGrid.shift(0, false, -1);
                    }
                }.bind(this),
            };

            // SHIFT + UP ARROW
            this.shiftUpCommand = {
                shiftModifier: true,
                keyCode: 38,
                action:  function(e) {
                    if(e.type.includes('up')) {
                        this.diagramGrid.shift(0, true, -1);
                    }
                }.bind(this),
            };

            // SHIFT + RIGHT ARROW
            this.shiftRightCommand = {
                shiftModifier: true,
                keyCode: 39,
                action:  function(e) {
                    if(e.type.includes('up')) {
                        this.diagramGrid.shift(0, false, 1);
                    }
                }.bind(this),
            };

            // SHIFT + DOWN ARROW
            this.shiftDownCommand = {
                shiftModifier: true,
                keyCode: 40,
                action:  function(e) {
                    if(e.type.includes('up')) {
                        this.diagramGrid.shift(0, true, 1);
                    }
                }.bind(this),
            };

            // CTRL + LEFT ARROW
            this.deleteColCommand = {
                ctrlModifier: true,
                keyCode:      37,
                action:       function(e) {
                    if(e.type.includes('up')) {
                        let coords = this.diagramController.getCellAtCursor();
                        coords = Object.hasOwn(coords, "x") ? coords : {x: this.diagramGrid.width, };
                        if(Object.hasOwn(coords, "x")) {
                            this.diagramGrid.insertRemoveRowColAt(coords.x, false, false);
                        } else {
                            this.diagramGrid.resize(this.diagramGrid.width - 1, this.diagramGrid.height);
                        }
                    }
                }.bind(this),
            };

            // CTRL + UP ARROW
            this.deleteRowCommand = {
                ctrlModifier: true,
                keyCode:       38,
                action:        function(e) {
                    if(e.type.includes('up')) {
                        let coords = this.diagramController.getCellAtCursor();
                        if(Object.hasOwn(coords, "y")) {
                            this.diagramGrid.insertRemoveRowColAt(coords.y, false, true);
                        } else {
                            this.diagramGrid.resize(this.diagramGrid.width, this.diagramGrid.height - 1);
                        }
                    }
                }.bind(this),
            };

            // CTRL + RIGHT ARROW
            this.insertColCommand = {
                ctrlModifier: true,
                keyCode:      39,
                action:       function(e) {
                    if(e.type.includes('up')) {
                        let coords = this.diagramController.getCellAtCursor();
                        if(Object.hasOwn(coords, "x")) {
                            this.diagramGrid.insertRemoveRowColAt(coords.x, true, false);
                        } else {
                            this.diagramGrid.resize(this.diagramGrid.width + 1, this.diagramGrid.height);
                        }
                    }
                }.bind(this),
            };

            // CTRL + DOWN ARROW
            this.insertRowCommand = {
                ctrlModifier: true,
                keyCode:      40,
                action:       function(e) {
                    if(e.type.includes('up')) {
                        let coords = this.diagramController.getCellAtCursor();
                        if(Object.hasOwn(coords, "y")) {
                            this.diagramGrid.insertRemoveRowColAt(coords.y, true, true);
                        } else {
                            this.diagramGrid.resize(this.diagramGrid.width, this.diagramGrid.height + 1);
                        }
                    }
                }.bind(this),
            };

            this.allCommands.push(this.shiftLeftCommand);
            this.allCommands.push(this.shiftUpCommand);
            this.allCommands.push(this.shiftRightCommand);
            this.allCommands.push(this.shiftDownCommand);

            this.allCommands.push(this.deleteColCommand);
            this.allCommands.push(this.deleteRowCommand);
            this.allCommands.push(this.insertColCommand);
            this.allCommands.push(this.insertRowCommand);
        }

        initCosmeticCommands() {
            // SHIFT + D
            this.darkModeCommand = {
                shiftModifier: true,
                keyCode: 68,
                action:  function(e) {
                    if(e.type.includes('up')) {
                        this.toggleDarkMode();
                    }
                }.bind(this),
            };

            // SHIFT + F
            this.transparencyCommand = {
                shiftModifier: true,
                keyCode: 70,
                action:  function(e) {
                    if(e.type.includes('up')) {
                        this.toggleTransparency();
                    }
                }.bind(this),
            };
            
            // SHIFT + T
            this.themeCommand = {
                shiftModifier: true,
                keyCode: 84,
                action:  function(e) {
                    if(e.type.includes('up')) {
                        this.changeTheme();
                    }
                }.bind(this),
            };

            this.allCommands.push(this.darkModeCommand);
            this.allCommands.push(this.transparencyCommand);
            this.allCommands.push(this.themeCommand);
        }

        changeTheme() {
            this.diagramView.theme = this.diagramView.theme < DiagramView.themes.length - 1 ? this.diagramView.theme + 1 : 0;
            document.getElementById('palette-setting').innerHTML = DiagramView.themes[this.diagramView.theme];
            this.setUpLayerSelector();
        }

        toggleTransparency() {
            this.diagramView.useFlatColors = !this.diagramView.useFlatColors;
            document.getElementById('transparency-setting').innerHTML = this.diagramView.useFlatColors ? "OFF" : "ON";
        }

        cellClickHandler(event) {
            let controller = this.diagramController;
            let changed = true;

            if(controller.startX === -1) {
                return;
            }

            let coords = controller.getCoordsFromEvent(event);

            if(controller.placeTermMode) {
                // TODO: Refactor
                // Actual placement done before calling in mouseupHandler
                this.clearPlaceTerminalMode();
            } else if (!this.isEraseEvent(event)) {
                // Just fill in or delete the cell at the start coordinates.
                // If there is no cell at the start coordinates, change the cursor color.
                if (!this.diagramGrid.get(controller.startX, controller.startY, controller.cursorIndex).isSet) {
                    controller.saveCurrentState();
                    this.diagramGrid.set(controller.startX, controller.startY, controller.cursorIndex);
                }
            } else {
                // If in the canvas and over a colored cell, erase it.
                // Otherwise, change the layer.
                if (!(controller.clearIfPainted(coords.x, coords.y) || controller.eraseMode)) {
                    controller.changeLayer();
                    changed = false;
                }
            }

            if(changed) {
                document.getElementById("truth-table").innerHTML = "";
            }
        }

        // Note the grid coordinates when the left or right mouse button is released.
        // If the left (or primary) button, use the start and end coordinates to make either a horizontal or vertical line.
        // If the right (or secondary) button, use the same coordinates to delete a line of cells.
        mouseupHandler(event) {
            this.diagramController.getCoordsFromEvent(event);

            if(this.diagramController.pixelIsInBounds()) {
                event.preventDefault();
            }
         
            if (this.diagramController.isPrimaryInput(event) || event.button === 2) {
                if(this.diagramController.isPrimaryInput(event) && this.diagramController.placeTermMode) {
                    this.diagramController.placeTerminal(event, this.diagramController.selectedTerminal);
                }

                if (this.diagramController.dragging) {
                    this.endDrag(event);
                    this.diagramView.highlightNets = false;
                } else if (this.diagramController.pixelIsInBounds()) {
                    this.cellClickHandler(event);
                    this.diagramView.highlightNets = false;
                } else if(event.button === 2) {
                    this.diagramController.changeLayer();
                }
            }

            this.diagramController.dragging = false;

            if(event.type.includes("touch")) {
                this.diagramController.currentX = this.diagramController.currentY = -1;
            }

        }

        // Show a preview line when the user is dragging the mouse.
        mousemoveHandler(event) {
            // Save the current X and Y coordinates.
            this.diagramController.getCoordsFromEvent(event);

            if(this.diagramController.pixelIsInBounds()) {
                event.preventDefault();
            }

            if(event.type.includes("mouse")) {
                this.diagramView.trailCursor = true;
            }

            // If the mouse is pressed and the mouse is between cells 1 and gridsize - 1,
            // TODO: Move isPrimaryInput to UI.
            if (this.diagramController.isPrimaryInput(event) || event.buttons === 2) {
                // Ignore if not inside the canvas
                // Do not enter drag event if in terminal placement mode.
                // TODO: Allow manipulation outside the canvas
                if (this.diagramController.pixelIsInBounds()) {
                    // TODO: Refactor
                    this.drag(event);
                }
            }
        }

        dragPrimary(bounds) {
            // If the mouse moved more horizontally than vertically,
            // draw a horizontal line.
            if (bounds.right - bounds.left > bounds.bottom - bounds.top) {
                bounds.lowLayer = bounds.highLayer = this.diagramController.cursorIndex;
                bounds.bottom = bounds.top = this.diagramController.startY;
                this.diagramGrid.map(bounds, function (x, y, layer) {
                    this.diagramGrid.set(x, y, layer);
                }.bind(this), true);
            }
            // If the mouse moved more vertically than horizontally,
            // draw a vertical line.
            else {
                bounds.lowLayer = bounds.highLayer = this.diagramController.cursorIndex;
                bounds.right = bounds.left = this.diagramController.startX;
                this.diagramGrid.map(bounds, function (x, y, layer) {
                    this.diagramGrid.set(x, y, layer);
                }.bind(this), true);
            }
        }

        dragSecondary(bounds) {
            // Secondary mouse button (i.e. right click)
            // Highlight a rectangle of squares for deletion.
            bounds.lowLayer = bounds.highLayer = LayeredGrid.DELETE;
            this.diagramGrid.map(bounds, function (x, y, layer) {
                this.diagramGrid.set(x, y, layer);
            }.bind(this), true);
        }

        drag(event) {
            let controller = this.diagramController;
            let view = this.diagramView;
            let endX, endY, bounds;

            // TODO: Is this needed?
            if (controller.startX === -1) {
                return;
            }

            if (!controller.dragging) {
                // don't start dragging unless the mouse has moved outside the cell
                if(controller.currentX === controller.startX && controller.currentY === controller.startY) {
                    return;
                }
                controller.dragging = true;

                if(this.diagramController.placeTermMode) {
                    this.diagramController.placeTerminal(event, this.diagramController.selectedTerminal);
                    return;
                }

                controller.saveCurrentState();
            } else {
                // Continuously refresh to update the preview line.
                if(this.diagramController.placeTermMode) {
                    this.diagramController.placeTerminal(event, this.diagramController.selectedTerminal);
                    return;
                }
                controller.undo();
                controller.saveCurrentState();
            }

            endX = Math.floor((controller.currentX - view.canvas.getBoundingClientRect().left - view.cellWidth)  / view.cellWidth);
            endY = Math.floor((controller.currentY - view.canvas.getBoundingClientRect().top  - view.cellHeight) / view.cellHeight);

            // If this is CONTACT layer, then just move the contact around.
            if(this.isEraseEvent(event) || controller.cursorIndex !== LayeredGrid.CONTACT) {
                bounds = {
                    left:   Math.min(controller.startX, endX),
                    right:  Math.max(controller.startX, endX),
                    top:    Math.min(controller.startY, endY),
                    bottom: Math.max(controller.startY, endY),
                };
            } else {
                controller.startX = endX;
                controller.startY = endY;
                bounds = {
                    left:   endX,
                    right:  endX,
                    top:    endY,
                    bottom: endY,
                };
            }

            if (!this.isEraseEvent(event)) {
                this.dragPrimary(bounds);
            } else {
                this.dragSecondary(bounds);
            }
        }

        endDrag(event) {
            let canvas = this.diagramView.canvas;
            let view   = this.diagramView;
            let coords = this.diagramController.getCoordsFromEvent(event);

            let endX = Math.floor((coords.x - canvas.getBoundingClientRect().left - view.cellWidth)  / view.cellWidth);
            let endY = Math.floor((coords.y - canvas.getBoundingClientRect().top  - view.cellHeight) / view.cellHeight);
            let bounds = {
                left:   Math.min(this.diagramController.startX, endX),
                right:  Math.max(this.diagramController.startX, endX),
                top:    Math.min(this.diagramController.startY, endY),
                bottom: Math.max(this.diagramController.startY, endY),
                lowLayer: 0,
                highLayer: LayeredGrid.layers.length - 1,
                endX: endX,
                endY: endY,
            };

            // For primary (i.e. left) mouse button:
            // If the mouse moved more horizontally than vertically, draw a horizontal line.
            if(this.diagramController.placeTermMode) {
                this.clearPlaceTerminalMode();
            } else if (!this.isEraseEvent(event)) {
                this.diagramController.draw(bounds);
            } else {
                // For secondary (i.e. right) mouse button:
                // Delete a rectangle of squares
                this.diagramGrid.map(bounds, function (x, y, layer) {
                    this.diagramGrid.clear(x, y, layer);
                }.bind(this));
            }
        }

        // Note the grid coordinates when the left mouse button is pressed.
        // Store the coordinates in startX and startY.
        mousedownHandler(event) {
            let coords = this.diagramController.getCoordsFromEvent(event);
            let controller = this.diagramController;
            let canvas = this.diagramView.canvas;
            let view   = this.diagramView;

            if (controller.isPrimaryInput(event) || event.button === 2) {
                // Return if not between cells 1 and gridsize - 1
                if (controller.pixelIsInBounds()) {
                    event.preventDefault();
                    controller.startX = Math.floor((coords.x - canvas.getBoundingClientRect().left - view.cellWidth)  / view.cellWidth);
                    controller.startY = Math.floor((coords.y - canvas.getBoundingClientRect().top  - view.cellHeight) / view.cellHeight);
                } else {
                    controller.startX = -1;
                    controller.startY = -1;
                }
            }
        }

        addListeners() {
            // Some of these pertain the the canvas, but we don't know whether
            // it will be selected.
            window.addEventListener("touchend", function(e) {
                if(document.getElementById("main-menu").classList.contains("closed")) {
                    this.mouseupHandler(e);
                }
            }.bind(this));

            window.addEventListener("mouseup", function(e) {
                if(document.getElementById("main-menu").classList.contains("closed")) {
                    this.mouseupHandler(e);
                }
            }.bind(this));

            window.addEventListener("touchstart", function(e) {
                if(document.getElementById("main-menu").classList.contains("closed")) {
                    this.mousedownHandler(e);
                }
            }.bind(this));

            window.addEventListener("mousedown", function(e) {
                if(document.getElementById("main-menu").classList.contains("closed")) {
                    this.mousedownHandler(e);
                }
            }.bind(this));

            window.addEventListener("touchmove", function(e) {
                if(document.getElementById("main-menu").classList.contains("closed")) {
                    this.mousemoveHandler(e);
                }
            }.bind(this));

            window.addEventListener("mousemove", function(e) {
                if(document.getElementById("main-menu").classList.contains("closed")) {
                    this.mousemoveHandler(e);
                }
            }.bind(this));

            window.addEventListener("keydown", function(e) {
                this.keydownHandler(e);
            }.bind(this));
            
            window.addEventListener("keyup", function(e) {
                this.keyupHandler(e);
            }.bind(this));
            
            window.addEventListener("contextmenu", function(e) {
                if (e.button === 2) {
                    // Don't show a context menu.
                    e.preventDefault();
                }
            });

            // Set up the evaluate button.
            this.button = document.getElementById("evaluate-btn");
            this.button.onclick = function() {
                this.refreshTruthTable();
            }.bind(this);
        }

        // TODO: Continue to improve this function.
        setUpControls() {
            let resizeGridByOne = function(byRow, positive) {
                return function() {
                    let offset = positive ? 1 : -1;
                    let newWidth = byRow ? this.diagramGrid.width            : this.diagramGrid.width + offset;
                    let newHeight = byRow ? this.diagramGrid.height + offset : this.diagramGrid.height;
                    this.diagramGrid.resize(newWidth, newHeight);
                    this.diagramView.drawGrid();
                }.bind(this);
            }.bind(this);

            let simpleGridShift = function(byRow, positive) {
                return function() {
                    let offset = positive ? 1 : -1;
                    this.diagramGrid.shift(0, byRow, offset);
                }.bind(this);
            }.bind(this);

            this.menus.forEach(function(menuName) {
                document.getElementById("open-" + menuName + "-btn").onclick  = this.getOpenMenuFunction(menuName);
                document.getElementById("close-" + menuName + "-btn").onclick = this.getCloseMenuFunction(menuName);
            }.bind(this));

            document.getElementById("add-row").onclick       = resizeGridByOne(true,  true);
            document.getElementById("remove-row").onclick    = resizeGridByOne(true,  false);
            document.getElementById("add-column").onclick    = resizeGridByOne(false, true);
            document.getElementById("remove-column").onclick = resizeGridByOne(false, false);

            document.getElementById("shift-left").onclick    = simpleGridShift(false, false);
            document.getElementById("shift-right").onclick   = simpleGridShift(false, true);
            document.getElementById("shift-up").onclick      = simpleGridShift(true,  false);
            document.getElementById("shift-down").onclick    = simpleGridShift(true,  true);

            document.getElementById("paint-mode-btn").onclick = function() {
                // No argument -> Toggle
                this.setEraseMode();

                // Set the icon.
                let paintModeButton = document.getElementById("paint-mode-btn");

                if (this.diagramController.eraseMode) {
                    paintModeButton.classList.remove('fa-paint-brush');
                    paintModeButton.classList.add('fa-eraser');
                } else {
                    paintModeButton.classList.remove('fa-eraser');
                    paintModeButton.classList.add('fa-paint-brush');
                }
            }.bind(this);

            document.getElementById("dark-mode-btn").onclick = this.toggleDarkMode.bind(this);
            document.getElementById("undo-btn").onclick = this.diagramController.undo.bind(this.diagramController);
            document.getElementById("redo-btn").onclick = this.diagramController.redo.bind(this.diagramController);
            document.getElementById('select-palette-btn').onclick = this.changeTheme.bind(this);
            document.getElementById('toggle-transparency-btn').onclick = this.toggleTransparency.bind(this);

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
            }.bind(this);

            document.getElementById('add-input-btn').onclick = function() {
                this.diagramController.addTerminal(false);
                this.populateTermSelect();
            }.bind(this);

            document.getElementById('remove-input-btn').onclick = function() {
                this.diagramController.removeTerminal(false);
                this.populateTermSelect();
            }.bind(this);

            document.getElementById('add-output-btn').onclick = function() {
                this.diagramController.addTerminal(true);
                this.populateTermSelect();
            }.bind(this);

            document.getElementById('remove-output-btn').onclick = function() {
                this.diagramController.removeTerminal(true);
                this.populateTermSelect();
            }.bind(this);

            document.getElementById('tutorial-btn-0').onclick = function() {
                if(window.tutorials) {
                    this.closeAllMenus();
                    this.tutorial = window.tutorials[0].get(this, LayeredGrid);
                    this.tutorial.start();
                }
            }.bind(this);

            this.setUpLayerSelector();
        }

        getOpenMenuFunction(menuName) {
            return function() {
                let menu = document.getElementById(menuName);

                if(menu.classList.contains("closed")) {
                    menu.classList.remove("closed");
                }

                if(menuName === "main-menu") {
                    document.getElementById("main-container").style.display = "none";
                }
            };
        }

        getCloseMenuFunction(menuName) {
            return function() {
                let menu = document.getElementById(menuName);

                if(!menu.classList.contains("closed")) {
                    menu.classList.add("closed");

                    if(menuName === "main-menu") {
                        document.getElementById("main-container").style.display = "block";
                    }
                    return true;
                }
            };
        }

        closeTopMenu() {
            this.menus.some(function(menuName) {
                return document.getElementById("close-" + menuName + "-btn").onclick();
            });
        }

        closeAllMenus() {
            this.menus.forEach(function(menuName) {
                document.getElementById("close-" + menuName + "-btn").onclick();
            });
        }

        // Generate an output table.
        // Each row evaluates to 1, 0, Z, or X
        // 1 is VDD, 0 is GND.
        // Z is high impedance, X is error (VDD and GND contradiction.)
        buildTruthTable() {
            let terminals  = this.diagram.getTerminals().slice(2);
            let table      = [];
            let header     = [];
            let inputVals  = [];
            let outputVals = [];
            this.diagram.clearAnalyses();

            // Each loop iteration is a combination of input values.
            // I.e., one row of the output table.
            for (let ii = 0; ii < Math.pow(2, this.diagram.inputs.length); ii++) {
                let tableInputRow = [];
                let tableOutputRow = [];

                // Compute each output.
                for (let jj = 0; jj < this.diagram.outputs.length; jj++) {
                    tableOutputRow[jj] = this.diagram.computeOutput(ii, this.diagram.outputNodes[jj]);
                    // Don't reuse the analysis in case of overdriven paths.
                }

                outputVals[ii] = tableOutputRow;

                for (let jj = 0; jj < this.diagram.inputs.length; jj++) {
                    /*jslint bitwise: true */
                    tableInputRow[jj] = (ii >> jj) & 1;
                    /*jslint bitwise: false */
                }

                inputVals[ii] = tableInputRow;
            }

            // Header
            terminals.forEach(function(terminal, index) {
                header[index] = this.diagram.getTerminalName(index + 2);
            }.bind(this));

            // Merge input and output into one table (input on the left, output on the right.)
            table[0] = header;
            for (let ii = 0; ii < inputVals.length; ii++) {
                // Reverse the inputs so that A is on the left.
                table[ii + 1] = inputVals[ii].reverse().concat(outputVals[ii]);
            }

            return table;
        }

        // Table is a 2D array of single character strings.
        refreshTruthTable(suppressSetNets) {
            let error = false;

            // Update the netlist.
            if(!suppressSetNets) {
                this.diagram.setNets();
            }

            // Create a table with the correct number of rows and columns.
            // The first row should be a header.
            let table = this.buildTruthTable();
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
                cell.className = index < this.diagram.inputs.length ? "input" : "output";
            }.bind(this));

            // Create the rest of the table.
            table.forEach(function (row, rowIndex) {
                if(rowIndex === 0) { return; }
                let tRow = tableElement.insertRow(rowIndex);

                row.forEach(function (cell, colIndex) {
                    let tCell = tRow.insertCell(colIndex);
                    tCell.innerHTML = cell;

                    // Set the cell class depending on whether this is
                    // an input or output cell.
                    if(colIndex < this.diagram.inputs.length) {
                        tCell.className = "input";
                    } else {
                        tCell.className = "output";
                        tCell.onclick   = (function (rowIndex, colIndex) {
                            return (function() {
                                let path, outputNum, outputNodeIndex;
                                outputNum = colIndex - this.diagram.inputs.length;
                                outputNodeIndex = this.diagram.graph.getIndexByNode(this.diagram.outputNodes[outputNum]);
                                path = this.diagram.analyses[rowIndex - 1][outputNodeIndex];
                                this.diagramView.setPathHighlight(path);
                                window.scrollTo({behavior: "smooth", top: Math.ceil(document.body.getBoundingClientRect().top), left: 0,});
                            }.bind(this));
                        }.bind(this))(rowIndex, colIndex);
                    }
                }.bind(this));
            }.bind(this));
            
            if (this.diagram.nmosPullup || this.diagram.pmosPulldown) {
                document.getElementById("pullup-pulldown-warning").classList.add("active");
            } else if(document.getElementById("pullup-pulldown-warning").classList.contains("active")) {
                document.getElementById("pullup-pulldown-warning").classList.remove("active");
            }

            if(!suppressSetNets) {
                window.scrollTo({behavior: "smooth", top: Math.ceil(tableElement.getBoundingClientRect().top + window.scrollY), left: 0,});
            }
        }

        setDarkMode(setToDark) {
            if (setToDark) {
                // Set to false so that toggleDarkMode() will set to true.
                this.diagramView.darkMode = false;
                this.toggleDarkMode();
            } else {
                // Set to true so that toggleDarkMode() will set to false.
                this.diagramView.darkMode = true;
                this.toggleDarkMode();
            }
        }

        toggleDarkMode() {
            this.diagramView.darkMode = !this.diagramView.darkMode;

            if (this.diagramView.darkMode) {
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

        setUpLayerSelector() {
            // Loop through all layer select buttons.
            Array.from(document.getElementById("colorChange").children).forEach(function(element, index) {

                // Set up the onclick event if not already set.
                if(!element.onclick) {
                    element.onclick = function() {
                        let paintModeButton = document.getElementById("paint-mode-btn");

                        this.diagramController.changeLayer(index);

                        // Set the icon.
                        if (this.diagramController.eraseMode) {
                            paintModeButton.classList.remove('fa-eraser');
                            paintModeButton.classList.add('fa-paint-brush');
                        }

                        this.setEraseMode(false);
                    }.bind(this);
                }

                // Color with flat color (rgb, not rgba).
                element.style.color = this.diagramView.getColor(index);
            }.bind(this));
        }

        setPlaceTerminalMode(terminalNumber) {
            // Concatenate diagram.inputs, diagram.outputs, diagram.vddCell, and diagram.gndCell.
            let terminals = this.diagram.getTerminals();
            this.diagramController.placeTermMode = true;
            this.diagramController.selectedTerminal = terminals[terminalNumber];
        }

        clearPlaceTerminalMode() {
            document.getElementById("place-term-btn").classList.remove("active");
            this.diagramController.placeTermMode = false;
        }

        // Toggle if mode is not provided.
        setEraseMode(mode) {
            if(mode !== undefined) {
                this.diagramController.eraseMode = mode;
            }
            else {
                this.diagramController.eraseMode = !this.diagramController.eraseMode;
            }
        }

        isEraseEvent(event) {
            return this.diagramController.eraseMode || event.button === 2 || event.buttons === 2;
        }

        // Fill in the termselect-list div with a radio button for each terminal.
        populateTermSelect() {
            let termSelectList = document.getElementById("termselect-list");
            let terminals = this.diagram.getTerminals();

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
                termSelectItemLabel.id = "termselect-label-" + ii;

                termSelectItemInput.type = "radio";
                termSelectItemInput.name = "termselect";
                termSelectItemInput.value = ii;
                termSelectItemInput.id = "termselect-" + ii;

                termSelectItemLabel.innerHTML = this.diagram.getTerminalName(ii);
                termSelectItemLabel.htmlFor = termSelectItemInput.id;

                termSelectList.appendChild(termSelectItemInput);
                termSelectList.appendChild(termSelectItemLabel);
            }
        }
        
        refreshScreen() {
            this.diagramView.refreshCanvas();

            if(this.tutorial && this.tutorial.active) {
                this.tutorial.step();
            }

            window.requestAnimationFrame(this.refreshScreen.bind(this));
        }
    }

    window.onload = function () {
        // Clear local storage
        localStorage.clear();
        let diagram = new Diagram(document.getElementById("canvas"), document.getElementById("grid-canvas"));
        
        // Set up the UI object.
        let UI = new UserInterface(diagram);

        // Set CONTACT at the coordinates of each input and output.
        diagram.inputs.forEach(function(input) {
            diagram.layeredGrid.set(input.x, input.y, LayeredGrid.CONTACT);
        });
        diagram.outputs.forEach(function(output) {
            diagram.layeredGrid.set(output.x, output.y, LayeredGrid.CONTACT);
        });

        // Set the CONTACT layer on the VDD and GND cells.
        diagram.layeredGrid.set(diagram.vddCell.x, diagram.vddCell.y, LayeredGrid.CONTACT);
        diagram.layeredGrid.set(diagram.gndCell.x, diagram.gndCell.y, LayeredGrid.CONTACT);

        // 60 fps
        window.requestAnimationFrame(UI.refreshScreen.bind(UI));

        if(window.runTestbench) {
            window.UI = UI;
            window.Graph = Graph;
            window.Diagram = Diagram;
            window.LayeredGrid = LayeredGrid;
            window.DiagramController = DiagramController;
            debugDefinitions();
            runTestbench();
        }
    };
})();