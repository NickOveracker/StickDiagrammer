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
 *      - "jshint bitwise"    (bitwise operators)
 *      - "jshint -W093"      (returning and assigning in one step)
 *      - "jshint nonew"      (using "new" for side-effects)
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
        convertFromCoordinates(x, y, layer, width=this.width, height=this.height) {
            return x + (y * width) + (layer * width * height);
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
            // TODO: Reduce if at all possible in the future.
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

        rotateClockwise() {
            let newGrid = new Array(this.width * this.height * this.layers);
            for (let x = 0; x < this.width; x++) {
                for (let y = 0; y < this.height; y++) {
                    for (let layer = 0; layer < this.layers; layer++) {
                        let oldIndex = this.convertFromCoordinates(x, y, layer);
                        let oldCell = this.grid[oldIndex];
                        if (oldCell) {
                            let newX = this.height - y - 1;
                            let newY = x;
                            let newIndex = this.convertFromCoordinates(newX, newY, layer, this.height, this.width);
                            newGrid[newIndex] = {
                                isSet: true,
                                x: newX,
                                y: newY,
                                layer: layer,
                                term1: oldCell.term1,
                                term2: oldCell.term2,
                                gate: oldCell.gate,
                            };
                        }
                    }
                }
            }
            this.grid = newGrid;
            let temp = this.width;
            this.width = this.height;
            this.height = temp;
        }

        mirrorHorizontal() {
            let newGrid = new Array(this.width * this.height * this.layers);
            for (let x = 0; x < this.width; x++) {
                for (let y = 0; y < this.height; y++) {
                    for (let layer = 0; layer < this.layers; layer++) {
                        let oldIndex = this.convertFromCoordinates(x, y, layer);
                        let oldCell = this.grid[oldIndex];
                        if (oldCell) {
                            let newX = this.width - x - 1;
                            let newIndex = this.convertFromCoordinates(newX, y, layer);
                            newGrid[newIndex] = {
                                isSet: true,
                                x: newX,
                                y: y,
                                layer: layer,
                                term1: oldCell.term1,
                                term2: oldCell.term2,
                                gate: oldCell.gate,
                            };
                        }
                    }
                }
            }
            this.grid = newGrid;
        }
    }

    // Set of cells that are electrically connected to one another.
    class Net {
        constructor(name, isInput) {
            this.name = name;
            this.cells = new Set();
            this.vertices = new Set();
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

        addVertex(vertex) {
            if(!!vertex && !this.containsVertex(vertex)) {
                let vertexIterator = this.vertices.values();

                // Loop through net's vertices.
                for (let vertex2 = vertexIterator.next(); !vertex2.done; vertex2 = vertexIterator.next()) {
                    vertex.hypergraph.connectVertices(vertex, vertex2.value);
                }

                this.vertices.add(vertex);
            }
        }

        removeVertex(vertex) {
            if(this.containsVertex(vertex)) {
                this.vertices.delete(vertex);
            }
        }

        containsVertex(vertex) {
            return this.vertices.has(vertex);
        }

        clear() {
            this.cells.clear();
            this.vertices.clear();
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
            return this.vertices.size;
        }
    }

    class Transistor {
        static get STATES () {
            return {
                INACTIVE:  0,
                ACTIVE:    1,
                UNDEFINED: 2,
                FLOATING:  3,
            };
        }
        constructor(gate, source, drain, vdd, gnd) {
            this.isPmos = source.cell.layer === LayeredGrid.PDIFF;
            this.isNmos = !this.isPmos;
            this.gate = gate;
            this.source = source;
            this.drain = drain;
            this.state = Transistor.STATES.FLOATING;
            this.vdd = vdd;
            this.gnd = gnd;
        }

        // MOSFETs are symmetrical, and we don't know which sides
        // are source/drain until we know what's connected to them.
        swapTerminals() {
            const temp  = this.source;
            this.source = this.drain;
            this.drain  = temp;
        }

        getState() {
            // A floating gate net takes the value assumed for it by Diagram.testFloatingGates().
            const assumed  = this.gate.hypergraph.assumedValues.get(this.gate.getEdges()[0]);
            const gateHigh = assumed === undefined ? this.gate.hasPathTo(this.vdd) : assumed;
            const gateLow  = assumed === undefined ? this.gate.hasPathTo(this.gnd) : !assumed;
            const gateActive   = (this.isNmos && gateHigh) || (this.isPmos && gateLow);
            const gateInactive = (this.isNmos && gateLow)  || (this.isPmos && gateHigh);
            let tempState;

            // First pass - only consider the gate voltage (original algorithm)
            if(gateActive && gateInactive) {
                tempState = Transistor.STATES.UNDEFINED;
            } else if(gateActive) {
                tempState = Transistor.STATES.ACTIVE;
            } else if(gateInactive) {
                tempState = Transistor.STATES.INACTIVE;
            } else {
                tempState = Transistor.STATES.FLOATING;
            }

            // Second pass - make sure the source is energized (bug patch)
            if(tempState === Transistor.STATES.ACTIVE) {
                const sourceActive = (this.isNmos && this.source.hasPathTo(this.gnd)) || (this.isPmos && this.source.hasPathTo(this.vdd));
                const drainActive  = (this.isNmos && this.drain.hasPathTo(this.gnd))  || (this.isPmos && this.drain.hasPathTo(this.vdd));

                if(!sourceActive && !drainActive) {
                    tempState = Transistor.STATES.INACTIVE;
                } else if(drainActive) {
                    this.swapTerminals(); // The terminals are mislabeled
                }
            }
            
            this.state = tempState
            return this.state;
        }
    }

    class Vertex {
        constructor(cell, hypergraph, logical=false, tentative=false) {
            this.cell = cell;
            this.edges = new Set();
            this.logical = logical;
            this.tentative = tentative;
            this.hypergraph = hypergraph;
        }

        getEdges() {
            return Array.from(this.edges);
        }

        addEdge(edge) {
            this.edges.add(edge);
        }

        removeEdge(edge) {
            this.edges.delete(edge);
        }

        hasPathTo(vertex, traverseTentative=false, independentInputs=false) {
            if (this === vertex) {
                return true;
            } else if (this.tentative && !traverseTentative) {
                return false;
            }

            return this.hypergraph.hasPath(this, vertex, independentInputs);
        }
    }

    class Hyperedge {
        constructor(mergeable=true) {
            this.vertices = new Set();
            this.dependencies = new Set();
            this.mergeable=mergeable;
        }

        addVertex(vertex) {
            this.vertices.add(vertex);
            vertex.addEdge(this);
            vertex.hypergraph.invalidate();
        }

        removeVertex(vertex) {
            this.vertices.delete(vertex);
            vertex.removeEdge(this);
            vertex.hypergraph.invalidate();
        }

        merge(hyperedge) {
            for(let vertex of hyperedge.vertices) {
                this.addVertex(vertex);
                vertex.removeEdge(hyperedge);
            }
        }

        hasVertex(vertex) {
            return this.vertices.has(vertex);
        }

        overlaps(hyperedge) {
            for(let vertex of hyperedge.vertices) {
                if(this.hasVertex(vertex)) {
                    return true;
                }
            }
        }

        clearVertices() {
            for(let vertex of this.vertices) {
                vertex.removeEdge(this);
                vertex.hypergraph.invalidate();
            }
            this.vertices.clear();
        }
    }

    class Hypergraph {
        constructor() {
            this.vertices = [];
            this.hyperedges = [];
            this.components = null;
            this.independentComponents = null;
            this.assumedValues = new Map(); // Floating gate net -> value assumed for it.
        }

        // Any change to the connections invalidates the cached components
        invalidate() {
            this.components = null;
            this.independentComponents = null;
        }

        // Map each vertex to a representative of its connected component.
        // With skipLogical set, paths may not pass through the logic vertices.
        // (skipLogical is for path highlighting.)
        labelComponents(skipLogical) {
            const labels = new Map();
            const canEnter = vertex => !labels.has(vertex) && !(skipLogical && vertex.logical);

            this.vertices.forEach(function(start) {
                if(!canEnter(start)) {
                    return;
                }
                const stack = [start,];
                labels.set(start, start);

                // it ain't pretty but it's honest work
                while(stack.length > 0) {
                    const vertex = stack.pop();

                    for(let edge of vertex.edges) {
                        for(let vertex2 of edge.vertices) {
                            if(canEnter(vertex2)) {
                                labels.set(vertex2, start);
                                stack.push(vertex2);
                            }
                        }
                    }
                }
            });

            return labels;
        }

        hasPath(vertex1, vertex2, independentInputs) {
            let pathFound = false;

            if(!independentInputs) {
                // Not for highlighting; pass through logic vertices.
                this.components = this.components || this.labelComponents(false);
                const component = this.components.get(vertex1);
                pathFound = component !== undefined && component === this.components.get(vertex2);
            } else if(!vertex1.logical) {
                // For highlighting; can end on logic nodes, but cannot leave them.
                this.independentComponents = this.independentComponents || this.labelComponents(true);
                const component = this.independentComponents.get(vertex1);

                if(vertex2.logical) {
                    // Ending on the logic high or logic low vertex.
                    pathFound = vertex2.getEdges().some(
                        edge => Array.from(edge.vertices).some(
                            vertex => {
                                const connected = this.independentComponents.get(vertex) === component;
                                return !vertex.logical && connected;
                            }
                        )
                    );
                }
                else {
                    // Ending on a physical vertex.
                    const connected = component === this.independentComponents.get(vertex2);
                    pathFound = component !== undefined && connected;
                }
            }

            return pathFound;
        }

        getVertex(cell) {
            this.vertices.some(vertex => {
                return vertex.cell === cell ? vertex : false;
            });
        }

        clear() {
            this.vertices.length = 0;
            this.hyperedges.length = 0;
        }

        addVertex(cell, isLogic, tentative) {
            const vertex = new Vertex(cell, this, isLogic, tentative);
            vertex.index = this.vertices.push(vertex) - 1;
            this.addHyperedge(vertex);
            return vertex;
        }

        addExistingVertex(vertex) {
            this.vertices.push(vertex);
            if(!!vertex.cell && !vertex.isTransistor()) {
                this.addHyperedge(vertex);
            }
            return vertex;
        }

        addHyperedge(vertex, mergeable=true) {
            const hyperedge = new Hyperedge(mergeable);
            hyperedge.addVertex(vertex);
            this.hyperedges.push(hyperedge);
            return hyperedge;
        }

        connectVertices(vertex1, vertex2, noMerge=false) {
            if(noMerge) {
                if(!vertex1.hasPathTo(vertex2)) {
                    const retEdge = this.addHyperedge(vertex1, false);
                    retEdge.addVertex(vertex2);
                    return retEdge;
                }
                return;
            }

            let hyperedge1 = null;
            let hyperedge2 = null;
            let returnEdge = null;

            for (let ii = 0; ii < this.hyperedges.length; ii++) {
                if (this.hyperedges[ii].hasVertex(vertex1)) {
                    hyperedge1 = this.hyperedges[ii];
                }
                if (this.hyperedges[ii].hasVertex(vertex2)) {
                    hyperedge2 = this.hyperedges[ii];
                }
            }

            if (hyperedge1 === null && hyperedge2 === null) {
                const hyperedge = this.addHyperedge(vertex1);
                hyperedge.addVertex(vertex2);
                returnEdge = hyperedge;
            } else if (hyperedge1 === null) {
                hyperedge2.addVertex(vertex1);
                returnEdge = hyperedge2;
            } else if (hyperedge2 === null) {
                hyperedge1.addVertex(vertex2);
                returnEdge = hyperedge1;
            } else if (hyperedge1 !== hyperedge2) {
                hyperedge1.merge(hyperedge2);
                this.hyperedges.splice(this.hyperedges.indexOf(hyperedge2), 1);
                returnEdge = hyperedge1;
            }

            return returnEdge;
        }

        getHyperedge(vertex) {
            for (let ii = 0; ii < this.hyperedges.length; ii++) {
                if (this.hyperedges[ii].hasVertex(vertex)) {
                    return this.hyperedges[ii];
                }
            }
        }

        removeHyperedge(hyperedge) {
            const hyperedgeIndex = this.hyperedges.indexOf(hyperedge);
            
            // Remove all vertices from the hyperedge.
            hyperedge.clearVertices();

            if(hyperedgeIndex >= 0) {
                this.hyperedges.splice(this.hyperedges.indexOf(hyperedge), 1);
            } else {
                console.error('Attempted to remove hyperedge from hypergraph, but the hyperedge was not found.');
            }
        }

        removeVertex(vertex) {
            const vertexIndex = this.vertices.indexOf(vertex);

            // Remove the vertex from all hyperedges.
            for (let ii = 0; ii < this.hyperedges.length; ii++) {
                if (this.hyperedges[ii].hasVertex(vertex)) {
                    this.removeHyperedge(this.hyperedges[ii]);
                    break;
                }
            }

            if(vertexIndex >= 0) {
                this.vertices.splice(this.vertices.indexOf(vertex), 1);
            } else {
                console.error('Attempted to remove vertex from hypergraph, but the vertex was not found.');
            }
        }

        getAdjacentVertices(vertex) {
            let adjacentVertices = new Set();
            for (let hyperedge of this.hyperedges) {
                if (hyperedge.hasVertex(vertex)) {
                    for (let vertex2 of hyperedge.vertices) {
                        adjacentVertices.add(vertex2);
                    }
                }
            }

            // Finally, remove logic vertices from the set.
            // These are at indices 0 and 1.
            adjacentVertices.delete(this.vertices[0]);
            adjacentVertices.delete(this.vertices[1]);
            return adjacentVertices;
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

        setTerminalCounts(numInputs, numOutputs) {
            // Delete all
            const terminals = [
                { arr: this.diagram.inputs,  num: numInputs,  isOutput: false, },
                { arr: this.diagram.outputs, num: numOutputs, isOutput: true,  },
            ];

            // Delete excess terminals first.
            terminals.forEach(function(ioObj) {
                while(ioObj.arr.length > ioObj.num) {
                    this.removeTerminal(ioObj.isOutput);
                }
            }.bind(this));

            // Now add up to the correct number.
            terminals.forEach(function(ioObj) {
                while(ioObj.arr.length < ioObj.num) {
                    this.addTerminal(ioObj.isOutput);
                }
            }.bind(this));
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

            const hasOwn = Object.hasOwn ? Object.hasOwn(cell, "x") : cell.hasOwnProperty("x"); // compatibility

            if (hasOwn && !event.ctrlKey) {
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
        
        rotateClockwise() {
            // First, rotate the grid.
            this.diagram.layeredGrid.rotateClockwise();

            // Then, rotate the terminals.
            this.diagram.inputs.forEach(function(input) {
                let temp = input.x;
                input.x = this.diagram.layeredGrid.width - 1 - input.y;
                input.y = temp;
            }.bind(this));

            this.diagram.outputs.forEach(function(output) {
                let temp = output.x;
                output.x = this.diagram.layeredGrid.width - 1 - output.y;
                output.y = temp;
            }.bind(this));

            let temp = this.diagram.vddCell.x;
            this.diagram.vddCell.x = this.diagram.layeredGrid.width - 1 - this.diagram.vddCell.y;
            this.diagram.vddCell.y = temp;

            temp = this.diagram.gndCell.x;
            this.diagram.gndCell.x = this.diagram.layeredGrid.width - 1 - this.diagram.gndCell.y;
            this.diagram.gndCell.y = temp;
        }

        mirrorHorizontal() {
            // First, mirror the grid.
            this.diagram.layeredGrid.mirrorHorizontal();

            // Then, mirror the terminals.
            this.diagram.inputs.forEach(function(input) {
                input.x = this.diagram.layeredGrid.width - 1 - input.x;
            }.bind(this));

            this.diagram.outputs.forEach(function(output) {
                output.x = this.diagram.layeredGrid.width - 1 - output.x;
            }.bind(this));

            this.diagram.vddCell.x = this.diagram.layeredGrid.width - 1 - this.diagram.vddCell.x;
            this.diagram.gndCell.x = this.diagram.layeredGrid.width - 1 - this.diagram.gndCell.x;
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
            this.showGrid = true;
        }

        getCellHoverColor() {
            return this.darkMode ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)";
        }
        
        // Draw a faint grid on the canvas.
        // Add an extra 2 units to the width and height for a border.
        drawGrid() {
            // Clear the grid canvas.
            this.gridCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

            if(!this.showGrid) {
                return;
            }
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

        // Mark the cells connected to the output vertex for a given set of inputs
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
                if(!path[ii]) {
                    continue;
                }
                for(let jj = 0; jj < this.diagram.netlist.length; jj++) {
                    if(this.diagram.netlist[jj].containsVertex(this.diagram.hypergraph.vertices[ii])) {
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

    class HDLExporter {
        // Generate IRSIM from the current circuit.
        // Hello, ASYNC 2025 attendees!
        static generateIRSIM(diagram) {
            // Simulate with 100nm scmos technology.
            const HEADER   = "| units: 100 tech: scmos\n"              +
                             "| type gate source drain length width\n" +
                             "| ---- ---- ------ ----- ------ -----\n" ;

            // Return a list of all identical hyperedges (same vertices)
            // for a given transistor terminal.
            const getNodeAliases = function(terminal) {
                let aliasList = [];
                terminal.getEdges().forEach(function(edge, index) {
                    // Index 0 is already accounted for,
                    // and we are not interested in directed (non-mergeable) edges.
                    if(index != 0 && edge.mergeable) {
                        aliasList.push(diagram.hypergraph.hyperedges.indexOf(edge));
                    }
                }.bind(diagram));
                return aliasList;
            }.bind(diagram)

            let circuit  = "";
            let commands = "";
            diagram.transistors.forEach(function(transistor) {
                const type = transistor.isNmos ? "n" : "p";

                // Name the edges for gate, source, and drain.
                const g = "e" + diagram.hypergraph.hyperedges.indexOf(transistor.gate.getEdges()[0]);
                const s = "e" + diagram.hypergraph.hyperedges.indexOf(transistor.source.getEdges()[0]);
                const d = "e" + diagram.hypergraph.hyperedges.indexOf(transistor.drain.getEdges()[0]);

                // Add the transistor to the circuit.
                circuit += `\n|| ${type}mos at: (${transistor.gate.cell.x}, ${transistor.gate.cell.y})\n`
                circuit += `${type} ${g} ${s} ${d} 2 4\n`

                // Link identical hyperedges together.
                getNodeAliases(transistor.gate).forEach((al)   => { commands += `alias ${g} e${al} \n`; });
                getNodeAliases(transistor.source).forEach((al) => { commands += `alias ${s} e${al} \n`; });
                getNodeAliases(transistor.drain).forEach((al)  => { commands += `alias ${d} e${al} \n`; });
            }.bind(diagram));

            // Name the outputs (..., W, X, Y)
            let watchnodes = "";
            diagram.outputVertices.forEach(function(vtx, ii) {
                const IDX  = diagram.hypergraph.hyperedges.indexOf(vtx.getEdges()[0]);
                const NAME = String.fromCharCode(89 - diagram.outputVertices.length + ii + 1);
                circuit    = circuit.replaceAll(` e${IDX} `, ` ${NAME} `);
                commands   = commands.replaceAll(` e${IDX} `, ` ${NAME} `);
                commands  += `alias ${NAME} e${IDX} \n`;
                watchnodes = watchnodes + NAME + " ";
            }.bind(diagram));

            // Name the inputs (A, B, C, ...)
            diagram.inputVertices.forEach(function(vtx, ii) {
                const IDX  = diagram.hypergraph.hyperedges.indexOf(vtx.getEdges()[0]);
                const NAME = String.fromCharCode(65 + ii);
                circuit    = circuit.replaceAll(` e${IDX} `, ` ${NAME} `);
                commands   = commands.replaceAll(` e${IDX} `, ` ${NAME} `);
                commands  += `alias ${NAME} e${IDX} \n`;
                watchnodes = watchnodes + NAME + " ";
            }.bind(diagram));

            // Set up the supplies.
            commands += `alias e${diagram.hypergraph.hyperedges.indexOf(diagram.vddVertex.getEdges()[0])} vdd\n`;
            commands += `alias e${diagram.hypergraph.hyperedges.indexOf(diagram.gndVertex.getEdges()[0])} gnd\n`;
            commands += `h vdd\nl gnd\nstepsize 50\nwatchnode ${watchnodes}\n`;

            // And we're done!
            return {
                sim: HEADER + circuit,
                cmd: commands,
            }
        }

        // Verilog modules designed to emulate the Stixu switch model for transistors.
        // Transistors conduct only if the source is energized by their rails
        // (i.e., GND for NMOS and VDD for PMOS) and their gates are energized
        // by the opposite rail (VDD for NMOS and GND for PMOS)
        static get verilogTransistorModels()
        {
            return [
                "// NMOS: conducts only low.",
                "module stixu_nmos(inout wire t1, inout wire t2, input wire gate);",
                "    tranif1 #1 sw(t1, t2, gate === 1'b1 && (t1 === 1'b0 || t2 === 1'b0 || t1 === 1'bx || t2 === 1'bx));",
                "endmodule",
                "",
                "// PMOS: conducts only high.",
                "module stixu_pmos(inout wire t1, inout wire t2, input wire gate);",
                "    tranif1 #1 sw(t1, t2, gate === 1'b0 && (t1 === 1'b1 || t2 === 1'b1 || t1 === 1'bx || t2 === 1'bx));",
                "endmodule",
                "",
            ].join("\n");
        }

        // Return an array of input terminal names (A, B, C...)
        static verilogInputNames(diagram) {
            return diagram.inputs.map((_, index) => diagram.getTerminalName(2 + index));
        }

        // Return an array of input terminal names (.. W, X, Y)
        static verilogOutputNames(diagram) {
            return diagram.outputs.map((_, index) => diagram.getTerminalName(2 + diagram.inputs.length + index));
        }

        // Output two functions for getting Verilog net (hyperedge) names.
        // Nets are are named after the first vertex added to them,
        // and merged when they intersect.
        // 
        // Outputs:
        // {
        //     function of(vertex) // Gets the name of the net containing `vertex`
        //     function all()      // Gets an array of all net names (strings)
        // }
        static verilogNets(diagram) {
            const names = new Map();
            const netOf = vertex => vertex.getEdges().at(0);
            const name = function(vertex, wireName) {
                if(!names.has(netOf(vertex))) {
                    names.set(netOf(vertex), wireName);
                }
            };
            const inputs  = HDLExporter.verilogInputNames(diagram);
            const outputs = HDLExporter.verilogOutputNames(diagram);

            name(diagram.vddVertex, "vdd");
            name(diagram.gndVertex, "gnd");
            diagram.inputVertices.forEach( (vertex, index) => name(vertex, `net_${inputs[index]}`));
            diagram.outputVertices.forEach((vertex, index) => name(vertex, `net_${outputs[index]}`));
            diagram.transistors.forEach(function(transistor) {
                [
                    transistor.gate,
                    transistor.source,
                    transistor.drain,
                ].forEach(vertex => name(vertex, "n" + names.size));
            });

            return {
                of:  vertex => names.get(netOf(vertex)),
                all: Array.from(new Set(names.values())),
            };
        }

        // Build the whole Verilog circuit.
        // Returns the full module string.
        static verilogCircuit(nets, diagram) {
            const  inputs = HDLExporter.verilogInputNames(diagram);
            const outputs = HDLExporter.verilogOutputNames(diagram);
            const   lines = [
                `module circuit(${inputs.concat(outputs).join(", ")});`,
            ];

            inputs.forEach(  name => lines.push(`    input  ${name};`));
            outputs.forEach( name => lines.push(`    output ${name};`));
            lines.push("");
            nets.all.forEach(name => lines.push(`    wire   ${name};`));

            lines.push(
                "",
                "    // Supplies and inputs drive their nets."
            );
            lines.push(`    assign ${nets.of(diagram.vddVertex)} = 1'b1;`);
            lines.push(`    assign ${nets.of(diagram.gndVertex)} = 1'b0;`);
            diagram.inputVertices.forEach((vertex, index) => {
                lines.push(`    assign ${nets.of(vertex)} = ${inputs[index]};`);
            });

            lines.push(
                "",
                "    // Transistors: (terminal, terminal, gate), with the channel's grid position."
            );
            diagram.transistors.forEach(function(transistor, index) {
                const xx = transistor.gate.cell.x;
                const yy = transistor.gate.cell.y;
                const type = transistor.isNmos ? "nmos" : "pmos";
                const ends = [
                    transistor.source,
                    transistor.drain,
                    transistor.gate,
                ].map(vertex => nets.of(vertex)).join(", ");
                lines.push(`    stixu_${type} ${type}_${index}(${ends}); // (${xx}, ${yy})`);
            });

            lines.push(
                "",
                "    // Outputs follow their nets."
            );
            diagram.outputVertices.forEach((vertex, index) => {
                lines.push(`    assign ${outputs[index]} = ${nets.of(vertex)};`);
            });
            lines.push(
                "endmodule",
                ""
            );

            return lines.join("\n");
        }

        // Build a single row of the test bench.
        // Tests the output module agains the Stixu truth table.
        // `row` is the filled-in truth table row,
        // `rowIndex` is the input vector (input A is the MSB)
        // `settle` is settling time.
        static verilogTestbenchRow(row, rowIndex, settle, diagram) {
            const inputs   = HDLExporter.verilogInputNames(diagram);
            const outputs  = HDLExporter.verilogOutputNames(diagram);
            const expected = row.slice(inputs.length);
            const shown    = outputs.map(name => name + "=%b").join(" ");
            const lines    = [];
 
            if(inputs.length > 0) {
                lines.push(`        in = ${inputs.length}'d${rowIndex}; #${settle};`);
            } else {
                lines.push(`        #${settle};`);
            }
 
            lines.push(
                `        $display("${inputs.join("") || "-"}=%b: ${shown}  (Stixu: ${expected.join(" ")})", in${outputs.map(name => ", " + name).join("")});`
            );
            outputs.forEach(function(name, index) {
                const value = {"0": "1'b0", "1": "1'b1", "Z": "1'bz",}[expected[index]];
                if(value) {
                    lines.push(
                        `        if (${name} !== ${value}) begin mismatches = mismatches + 1; $display("  ${name} should be ${expected[index]}"); end`
                    );
                }
            });
 
            return lines;
        }

        // A testbench that applies every input combination in order,
        // prints the outputs and checks them.
        //
        // Rows that Stixu marks X, H, L, U or ? are printed but not checked.
        // In simulation, a latch holds whatever state the previous rows left it in.
        static verilogTestbench(truthTable, diagram) {
            const inputs  = HDLExporter.verilogInputNames(diagram);
            const outputs = HDLExporter.verilogOutputNames(diagram);
            const settle  = 10 * (diagram.transistors.length + 1);
            const ports   = inputs.map((name, index) => `.${name}(in[${inputs.length - 1 - index}])`)
                .concat(outputs.map(name => `.${name}(${name})`));
            const lines   = [
                "// Applies every input combination and compares each output with Stixu's truth table.",
                "module circuit_tb;",
                `    reg  [${Math.max(inputs.length - 1, 0)}:0] in;`,
            ];
 
            if(outputs.length > 0) {
                lines.push(`    wire ${outputs.join(", ")};`);
            }
 
            lines.push(
                "    integer mismatches = 0;",
                "",
                `    circuit dut(${ports.join(", ")});`,
                "",
                "    initial begin"
            );

            // first truth table row is the header; skip it
            truthTable.slice(1).forEach(function(row, rowIndex) {
                HDLExporter.verilogTestbenchRow(row, rowIndex, settle, diagram)
                    .forEach(line => lines.push(line));
             }.bind(diagram));
            lines.push(
                "        $display(\"%0d mismatch(es) with Stixu's truth table\", mismatches);"
            );
            lines.push(
                "        $finish;",
                "    end",
                "endmodule",
                ""
            );
 
            return lines.join("\n");
        }

        // Generate Verilog from the current circuit.
        // The transistors are constructed to approximate Stixu's model,
        // but the full 7-value logic system obviously can't be implemented.
        // H, L, U, and X will all behave differently in Verilog.
        // Remember: Stixu's X means there's a fault ANYWHERE in the diagram.
        // Verilog's x is not global.
        static generateVerilog(truthTable, diagram) {
            // Remove non-mergeable edges (i.e., edges specific to an input vector)
            diagram.cleanup();

            const nets = HDLExporter.verilogNets(diagram);
            let verilog = "// Generated by Stixu (https://stixu.io).\n";
            verilog    += "// The Stixu model was tested only against Icarus Verilog.\n";
            verilog    += "`timescale 1ns / 1ps\n\n";
            verilog    += HDLExporter.verilogTransistorModels + "\n";
            verilog    += HDLExporter.verilogCircuit(nets, diagram);

            if(truthTable) {
                verilog += `\n${HDLExporter.verilogTestbench(truthTable, diagram)}`;
            }

            return verilog;
        }
    }

    class Diagram {
        constructor(mainCanvas, gridCanvas) {
            this.DIRECT_PATH         = { indeterminate: false, hasPath: true,  direct: true,  label: "1", };
            this.VIRTUAL_PATH        = { indeterminate: true,  hasPath: true,  direct: false, label: "v", };
            this.VIRTUAL_PATH_ONLY   = { indeterminate: false, hasPath: true,  direct: false, label: "I", };
            this.NO_PATH             = { indeterminate: false, hasPath: false, direct: true,  label: "0", };
            this.INDETERMINATE_PATH  = { indeterminate: true,                                 label: "F", }; // Via transistor w/ floating gate
            this.COMPUTING_PATH      = { indeterminate: true,                                 label: "?", };
            this.UNCHECKED           = { indeterminate: true,                                 label: "_", };

            this.initCells();
            this.initNets();
            this.initNodes();

            this.nmosPullup = this.pmosPulldown = false;
            this.maxTerminals = 8;
            
            this.view = new DiagramView(this, mainCanvas, gridCanvas);
            this.controller = new DiagramController(this, this.view, mainCanvas);
            this.independentInputs = false;
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
                        if(this.layeredGrid.get(col,row,lyr).isSet) {
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

            let str = "";
            code.forEach((char) => {
                str += String.fromCharCode(char);
            });

            return encodeURIComponent(window.LZUTF8.compress(btoa(str), {outputEncoding: "Base64",}));
        }

        decode(stringBase64) {
            const decompress = atob(window.LZUTF8.decompress(decodeURIComponent(stringBase64), {inputEncoding: "Base64",}));
            const setGrid    = [];
            let byte, bitShift, cellIndex = 0;

            for(let ii = 0; ii < decompress.length; ii++) {
                setGrid[ii] = decompress.charCodeAt(ii);
            }

            const setWidth   = setGrid.splice(0,1)[0];
            const setHeight  = setGrid.splice(0,1)[0];
            const setDepth   = setGrid.splice(0,1)[0];
            const numInputs  = setGrid.splice(0,1)[0];
            const numOutputs = setGrid.splice(0,1)[0];

            this.vddCell.x   = setGrid.splice(0,1)[0];
            this.vddCell.y   = setGrid.splice(0,1)[0];
            this.gndCell.x   = setGrid.splice(0,1)[0];
            this.gndCell.y   = setGrid.splice(0,1)[0];

            this.controller.setTerminalCounts(numInputs, numOutputs);
            this.layeredGrid.resize(setWidth, setHeight);

            [ this.inputs, this.outputs, ].forEach(function(arr) {
                for(let ii = 0; ii < arr.length; ii++) {
                    arr[ii] = {x: setGrid.splice(0,1)[0], y: setGrid.splice(0,1)[0], };
                    this.controller.placeTerminal(arr[ii], arr[ii], true);
                }
            }.bind(this));

            // Cells
            for(let lyr = 0; lyr < this.layeredGrid.layers - 1 && lyr < setDepth; lyr++) {
                for(let col = 0; col < this.layeredGrid.width; col++) {
                    for(let row = 0; row < this.layeredGrid.height; row++) {
                        /*jslint bitwise: true */
                        bitShift = 1 << (7 - cellIndex % 8);
                        byte = Math.floor(cellIndex/8);
                        if(setGrid[byte] & bitShift) {
                            this.layeredGrid.set(col, row, lyr);
                        } else {
                            this.layeredGrid.clear(col, row, lyr);
                        }
                        /*jslint bitwise: false */
                        cellIndex++;
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
            this.rowCache = [];
        }

        initNodes() {
            this.nmos = new Set();
            this.pmos = new Set();
        }

        // Clear previous anaysis.
        clearAnalyses() {
            this.analyses.forEach(analysis => {
                analysis.forEach(row => {
                    row.length = 0;
                });
                analysis.length = 0;
            });
            this.rowCache.length = 0;
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

        // Clean up the state from the previous input vector.
        cleanup() {
            // Remove edges that only apply to the previous input vector.
            for(let ii = this.hypergraph.hyperedges.length - 1; ii >= 0; ii--) {
                const hyperedge = this.hypergraph.hyperedges[ii];

                if(hyperedge.mergeable === false) {
                    // Remove the hyperedge from the hypergraph.
                    this.hypergraph.removeHyperedge(hyperedge);
                }
            }
        }

        // Connect all supply and input terminals to their respective logic levels.
        connectTerminals(inputVals) {
            this.hypergraph.connectVertices(this.strongLogicOneVertex, this.vddVertex, true);
            this.hypergraph.connectVertices(this.strongLogicZeroVertex, this.gndVertex, true);

            this.inputVertices.forEach(function(vertex, index) {
                const inputNum = this.inputVertices.length - 1 - index;

                /*jslint bitwise: true */
                const evalInput = !!((inputVals >> inputNum) & 1);
                /*jslint bitwise: false */

                if(evalInput) {
                    this.hypergraph.connectVertices(vertex, this.strongLogicOneVertex, true);
                } else {
                    this.hypergraph.connectVertices(vertex, this.strongLogicZeroVertex, true);
                }
            }.bind(this));
        }

        // Connect source and drain of active transistors, and propagate.
        initTransistorStates(addedEdges = null) {
            let changed, edge;
            do {
                changed = false;

                this.transistors.forEach(function(transistor) {
                    const state = transistor.getState();
                    const sourceDrainPathExists = transistor.source.hasPathTo(transistor.drain);

                    if(state === Transistor.STATES.ACTIVE && !sourceDrainPathExists) {
                        edge = this.hypergraph.connectVertices(transistor.source, transistor.drain, true);
                        changed = true;
                        if(!!addedEdges) {
                            addedEdges.push(edge);
                        }
                    }
                }.bind(this));
            } while(changed);
        }

        updateOutputVal(currentOutputVal, outputVertex, traverseTentative=false) {
            if(currentOutputVal === "X") {
                return currentOutputVal;
            }
            let retVal = currentOutputVal;

            if(this.strongLogicOneVertex.hasPathTo(this.strongLogicZeroVertex, traverseTentative)) {
                return "X";
            }

            const onePath = this.strongLogicOneVertex.hasPathTo(outputVertex, traverseTentative);
            if(onePath) {
                switch(currentOutputVal) {
                    case "Z":
                        retVal = "H";
                        break;
                    case "L": 
                        retVal = "U";
                        break;
                    case "0":
                        return "X";
                }
            }

            const zeroPath = this.strongLogicZeroVertex.hasPathTo(outputVertex, traverseTentative);
            if(zeroPath) {
                switch(currentOutputVal) {
                    case "Z":
                        retVal = retVal === "H" ? "U" : "L";
                        break;
                    case "H": 
                        retVal = "U";
                        break;
                    case "1":
                        return "X";
                }
            }

            if(currentOutputVal === "1" && zeroPath) {
                return "X";
            } else if(currentOutputVal === "0" && onePath) {
                return "X";
            }

            return retVal;
        }

        // Check one output against the current floating gate assignment
        checkFloatingOutput(currentOutputVal, outputVertex) {
            let outputVal = this.updateOutputVal(currentOutputVal, outputVertex, true);

            if(outputVal !== "X") {
                // Check whether the output changes depending on whether "tentative" paths are considered.
                // Iterate through UNDEFINED transistors.
                this.transistors.some(function(transistor) {
                    if(transistor.getState() === Transistor.STATES.UNDEFINED || transistor.getState() === Transistor.STATES.FLOATING) {
                        const sourcePathToOutput = transistor.source.hasPathTo(outputVertex);
                        const drainPathToOutput = transistor.drain.hasPathTo(outputVertex);
                        const pathToZero = transistor.source.hasPathTo(this.strongLogicZeroVertex, true);
                        const pathToOne  = transistor.source.hasPathTo(this.strongLogicOneVertex, true);
                        /* jslint bitwise: true */
                        if(!(sourcePathToOutput ^ drainPathToOutput)) {
                            // No effect.
                            return false;
                        } else if(outputVal === "1" && pathToZero) {
                            outputVal = "X";
                            return outputVal;
                        } else if(outputVal === "0" && pathToOne) {
                            outputVal = "X";
                            return outputVal;
                        }
                        /* jslint bitwise: false */
                    }
                }.bind(this));
            }
            return outputVal;
        }

        // Check every output against the current floating gate assignment in-place
        checkFloatingOutputs(outputVals) {
            this.outputVertices.forEach(function(outputVertex, index) {
                outputVals[index] = this.checkFloatingOutput(outputVals[index], outputVertex);
            }.bind(this));
        }

        // Try every test signal on the flaoting gates, updating every output at once.
        // Previously this was done anew for every output even though the graph was identical.
        // Boy, I really hope somebody got fired for that blunder.
        //
        // Each assignment assumes a value for every floating gate net at once, then closes every transistor
        // that is on. Only self-consistent assignments (stable states) count: an assignment is discarded if
        // a net turns out to be driven to the opposite of its assumed value. (Letting the real value win
        // instead could only lead to another assignment, which is tested on its own.)
        // If no assignment is stable, an output that is the same in every assignment keeps that value,
        // and any other output is unstable ("?").
        testFloatingGates(outputVals, addedEdgesArr) {
            const floatingGateEdges = new Set();
            const unstableVals = outputVals.slice();
            const unstablePaths = outputVals.map(() => new Set());
            let anyStable = false;
            const allConflicted = () => anyStable && outputVals.every(outputVal => outputVal === "X");

            this.transistors.forEach(function(transistor) {
                if(transistor.getState() === Transistor.STATES.FLOATING) {
                    floatingGateEdges.add(transistor.gate.getEdges()[0]);
                }
            });

            const floatingGateEdgesArr = Array.from(floatingGateEdges);

            for(let ii = 0; ii < Math.pow(2, floatingGateEdgesArr.length) && !allConflicted(); ii++) {
                for(let jj = 0; jj < floatingGateEdgesArr.length; jj++) {
                    /*jslint bitwise: true */
                    this.hypergraph.assumedValues.set(floatingGateEdgesArr[jj], !!((ii >> jj) & 1));
                    /*jslint bitwise: false */
                }

                // Transistors are only closed, never opened, so this terminates and the order doesn't matter.
                this.initTransistorStates(addedEdgesArr);

                if(this.isSelfConsistent(floatingGateEdgesArr)) {
                    this.checkFloatingOutputs(outputVals);
                    anyStable = true;
                } else {
                    this.checkFloatingOutputs(unstableVals);
                    this.outputVertices.forEach(function(outputVertex, index) {
                        unstablePaths[index].add(`${outputVertex.hasPathTo(this.strongLogicOneVertex)} ${outputVertex.hasPathTo(this.strongLogicZeroVertex)}`);
                    }.bind(this));
                }

                addedEdgesArr.forEach(function(edge) {
                    this.hypergraph.removeHyperedge(edge);
                }.bind(this));

                addedEdgesArr.length = 0;
                this.hypergraph.assumedValues.clear();
            }

            if(!anyStable) {
                this.outputVertices.forEach(function(outputVertex, index) {
                    outputVals[index] = unstablePaths[index].size > 1 ? "?" : unstableVals[index];
                });
            }
        }

        // Whether every floating gate net that is really driven to one level agrees with its assumed value.
        isSelfConsistent(floatingGateEdgesArr) {
            return floatingGateEdgesArr.every(function(edge) {
                const vertex = edge.vertices.values().next().value;
                const realOne  = vertex.hasPathTo(this.strongLogicOneVertex);
                const realZero = vertex.hasPathTo(this.strongLogicZeroVertex);
                // Getting a little clever here.
                // First condition is XNOR. Checks if floating or conflicted.
                // Second condition is checked when only one logic path exists.
                // 
                // Suppose that the assumed path matches the current hypothesis.
                // If that path is to 1, then realOne === true === assumed
                // If that path is to 0, then realOne === false === assumed
                // Otherwise, the second check returns false (inconsistent)
                return realOne === realZero || realOne === this.hypergraph.assumedValues.get(edge);
            }.bind(this));
        }

        // Classify an output by its paths to the logic vertices.
        // Excludes H and L at this stage.
        initialOutputVal(outputVertex) {
            let outputVal = "Z";
            if(outputVertex.hasPathTo(this.strongLogicOneVertex)) {
                outputVal = "1";
            }
            if(outputVertex.hasPathTo(this.strongLogicZeroVertex)) {
                outputVal = outputVal === "1" ? "X" : "0";
            }
            return outputVal;
        }

        // Cheap upper bound on every floating-gate assignment:
        // Do the floating gates even have a path to affect the outputs?
        floatingGatesCanMatter(outputVals) {
            const tempEdges = [];

            // Decided which transistors to close before doing so,
            // so that new edges cannot affect the choice.
            const maybeOn = this.transistors.filter(function(transistor) {
                const offLevel = transistor.isNmos ? this.strongLogicZeroVertex : this.strongLogicOneVertex;
                return !transistor.gate.hasPathTo(offLevel);
            }.bind(this));

            maybeOn.forEach(function(transistor) {
                const edge = this.hypergraph.connectVertices(transistor.source, transistor.drain, true);
                if(!!edge) {
                    tempEdges.push(edge);
                }
            }.bind(this));

            const canMatter = this.strongLogicOneVertex.hasPathTo(this.strongLogicZeroVertex) ||
                this.outputVertices.some(function(outputVertex, index) {
                    return this.initialOutputVal(outputVertex) !== outputVals[index];
                }.bind(this));

            tempEdges.forEach(function(edge) {
                this.hypergraph.removeHyperedge(edge);
            }.bind(this));

            return canMatter;
        }

        // Record which vertex pairs are connected for this input vector.
        // Used for path highlighting.
        recordAnalysis(inputVals) {
            this.analyses[inputVals] = [];
            this.analyses[inputVals][0] = [];
            this.hypergraph.vertices.forEach(function(vertex, ii) {
                for(let jj = ii + 1; jj < this.hypergraph.vertices.length; jj++) {
                    const vertex2 = this.hypergraph.vertices[jj];
                    if(!this.analyses[inputVals][jj]) {
                        this.analyses[inputVals][jj] = [];
                    }
                    this.analyses[inputVals][ii][jj] = vertex.hasPathTo(vertex2, false, true);
                    this.analyses[inputVals][jj][ii] = this.analyses[inputVals][ii][jj];
                }
            }.bind(this));
        }

        // Evaluate every output for one input vector.
        // Previously foolishly did this separately for each output.
        computeRow(inputVals) {
            const addedEdgesArr = [];

            this.cleanup();
            this.connectTerminals(inputVals);
            this.initTransistorStates();

            // See if we already have a path from each output to a logic vertex.
            let outputVals = this.outputVertices.map(outputVertex => this.initialOutputVal(outputVertex));

            if(this.strongLogicOneVertex.hasPathTo(this.strongLogicZeroVertex)) {
                // A short circuit marks every output as conflicted, whatever the floating gates do.
                outputVals = outputVals.map(() => "X");
            } else if(this.floatingGatesCanMatter(outputVals)) {
                this.testFloatingGates(outputVals, addedEdgesArr);
            }

            this.recordAnalysis(inputVals);
            return outputVals;
        }

        // Return one output for one input vector.
        // All outputs are evaluated and cached together,
        // but I'm leaving this footprint in place for compatibility with the caller.
        computeOutput(inputVals, outputIndex) {
            if(!this.rowCache[inputVals]) {
                this.rowCache[inputVals] = this.computeRow(inputVals);
            }
            return this.rowCache[inputVals][outputIndex];
        }

        // Clear necessary data structures in preparation for recomputation.
        clearCircuit() {
            // Clear the net sets.
            this.vddNet.clear();
            this.gndNet.clear();
            this.nmos.clear();
            this.pmos.clear();
            this.rowCache = [];

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
            this.hypergraph = new Hypergraph();
            this.transistors = [];
            this.strongLogicOneVertex = this.hypergraph.addVertex(null, true);
            this.strongLogicZeroVertex = this.hypergraph.addVertex(null, true);
            this.inputVertices = [];
            this.outputVertices = [];

            // Local VDD and GND vertices.
            this.vddVertex = this.hypergraph.addVertex(this.layeredGrid.get(this.vddCell.x, this.vddCell.y, LayeredGrid.CONTACT));
            this.gndVertex = this.hypergraph.addVertex(this.layeredGrid.get(this.gndCell.x, this.gndCell.y, LayeredGrid.CONTACT));

            this.inputs.forEach(function(input) {
                let inputCell = this.layeredGrid.get(input.x, input.y, LayeredGrid.CONTACT);
                this.inputVertices.push(this.hypergraph.addVertex(inputCell));
            }.bind(this));
            this.outputs.forEach(function(output) {
                let outputCell = this.layeredGrid.get(output.x, output.y, LayeredGrid.CONTACT);
                this.outputVertices.push(this.hypergraph.addVertex(outputCell));
            }.bind(this));

            this.inputNets.forEach(function (net) { net.clear(); });
            this.outputNets.forEach(function (net) { net.clear(); });

            this.vddNet.addVertex(this.vddVertex);
            this.gndNet.addVertex(this.gndVertex);

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

            // Add input vertices to the graph.
            this.inputs.forEach(function(input, index) {
                this.inputNets[index].addVertex(this.inputVertices[index]);
            }.bind(this));

            // Add output vertices to the graph.
            this.outputs.forEach(function(output, index) {
                this.outputNets[index].addVertex(this.outputVertices[index]);
            }.bind(this));

            this.processTransistors();
            this.linkIdenticalNets();
            this.checkPolarity();

            let vertices = this.hypergraph.vertices;
            
            // Loop through the vertices, and check which nets they are in.
            // When a net is found, loop through the remaining vertices and
            // add hyperedges between the vertices that share the same net.
            for(let ii = 2; ii < vertices.length; ii++) { // skip the global VDD and GND vertices
                let vertex = vertices[ii];

                for(let jj = 0; jj < this.netlist.length; jj++) {
                    let net = this.netlist[jj];

                    if(net.containsCell(vertex.cell)) {
                        for(let kk = ii + 1; kk < vertices.length; kk++) {
                            let vertex2 = vertices[kk];

                            if(net.containsCell(vertex2.cell)) {
                                this.hypergraph.connectVertices(vertex, vertex2);
                            }
                        }
                    }
                }
            }
        } // end function setNets

        processTransistors() {
            // Each nmos and pmos represents a relation between source and drain.
            this.transistors.forEach(function(transistor) {
                let sourceNet = new Net("?", false);
                let drainNet  = new Net("?", false);
                let gateNet   = new Net("?", false);

                // If the transistor's source/drain is not in any of the nets,
                // then create a new net and add source/drain to it.
                if (this.getNet(transistor.source.cell)) {
                    sourceNet.clear();
                    sourceNet = this.getNet(transistor.source.cell);
                }
                if (this.getNet(transistor.drain.cell)) {
                    drainNet.clear();
                    drainNet = this.getNet(transistor.drain.cell);
                }
                sourceNet.addCell(transistor.source.cell, this.layeredGrid.get(transistor.source.cell.x, transistor.source.cell.y, LayeredGrid.CONTACT).isSet);
                drainNet.addCell(transistor.drain.cell, this.layeredGrid.get(transistor.drain.cell.x, transistor.drain.cell.y, LayeredGrid.CONTACT).isSet);

                if (this.getNet(transistor.gate.cell)) {
                    gateNet.clear();
                    gateNet = this.getNet(transistor.gate.cell);
                }

                // Add the net if it is not empty.
                if (sourceNet.size > 0 && !this.getNet(transistor.source.cell)) {
                    this.setRecursively(transistor.source.cell, sourceNet);
                    this.netlist.push(sourceNet);
                    sourceNet.addVertex(transistor.source);
                }
                // Add the net if it is not empty.
                if (drainNet.size > 0 && !this.getNet(transistor.drain.cell)) {
                    this.setRecursively(transistor.drain.cell, drainNet);
                    this.netlist.push(drainNet);
                    drainNet.addVertex(transistor.drain);
                }

                // Add the net if it is not empty.
                if (gateNet.size > 0 && !this.getNet(transistor.gate.cell)) {
                    this.setRecursively(transistor.gate.cell, gateNet);
                    this.netlist.push(gateNet);
                    gateNet.addVertex(transistor.gate);
                }
            }.bind(this));

            // Now, loop through nmos and pmos again and change each transistors terminal values from cells to nets.
            // This must be done after the above loop rather than as a part of it, because the loop above will overwrite the nets.
            this.transistors.forEach(function(transistor) {
                let net = this.getNet(transistor.source.cell);

                if (net === null) {
                    net = new Net("?", false);
                    this.setRecursively(transistor.source.cell, net);
                    this.netlist.push(net);
                }

                if (net !== undefined) {
                    net.addVertex(transistor.source);
                }

                net = this.getNet(transistor.drain.cell);

                if (net === null) {
                    net = new Net("?", false);
                    this.setRecursively(transistor.drain.cell, net);
                    this.netlist.push(net);
                }

                if (net !== undefined) {
                    net.addVertex(transistor.drain);
                }

                net = this.getNet(transistor.gate.cell);

                if (net === null) {
                    net = new Net("?", false);
                    this.setRecursively(transistor.gate.cell, net);
                    this.netlist.push(net);
                }

                if (net !== undefined) {
                    net.addVertex(transistor.gate);
                }
            }.bind(this));
        }

        /**
         * @description
         * Check the polarity of the circuit.
         * If there are any NDIFF cells in vddNet, flag for nmos pullup.
         * If there are any PDIFF cells in gndNet, flag for pmos pulldown.
         * 
         * @method checkPolarity
         * @returns {undefined}
         * @private 
        */
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

        /**
         * @description
         * Find all nets that are identical and link them together.
         * 
         * @method linkIdenticalNets
         * @returns {undefined}
         * @private
         */
        linkIdenticalNets() {
            let linkVertices = function(net1, net2) {
                let vertexIterator1 = net1.vertices.values();
                let vertexIterator2 = net2.vertices.values();

                // Loop through net1's vertices..
                // Outer loop - this is why it had to be swapped with net2 if it was an input.
                for (let vertex1 = vertexIterator1.next(); !vertex1.done; vertex1 = vertexIterator1.next()) {
                    net2.addVertex(vertex1.value);

                    // Loop through net2's vertices..
                    for (let vertex2 = vertexIterator2.next(); !vertex2.done; vertex2 = vertexIterator2.next()) {
                        this.hypergraph.connectVertices(vertex1.value, vertex2.value);
                        net1.addVertex(vertex2.value);
                    }
                }
            }.bind(this);

            // Loop through every net.
            for (let ii = 0; ii < this.netlist.length; ii++) {
                // Loop through every net again.
                for (let jj = ii + 1; jj < this.netlist.length; jj++) {
                    // If the nets are identical, add an edge between them.
                    if (this.netlist[ii].isIdentical(this.netlist[jj])) {
                        linkVertices(this.netlist[ii], this.netlist[jj]);
                    }
                }
            }
        }

        // NOTE: cell is an object with properties isSet, layer, x, y, term1, term2, and gate.
        /**
         * @description
         * Get the net that contains a cell.
         * 
         * @method getNet
         * @param {*} cell - The cell to find the net for.
         * @returns {Net} The net that contains the cell.
         * @private
         */
        getNet(cell) {
            for (let ii = 0; ii < this.netlist.length; ii++) {
                if (this.netlist[ii].containsCell(cell)) {
                    return this.netlist[ii];
                }
            }
            return null;
        }
       
        /**
         * @description
         * Set the terminals of a transistor.
         * 
         * @method setTerminals
         * @param {*} transistor 
         * @param {number} x 
         * @param {number} y 
         * @param {number} layer 
         * @private
         */
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

        /**
         * @description
         * If the cell is NDIFF or PDIFF intersected by POLY, create a transistor
         * unless it is already a transistor or there is a CONTACT on the same cell.
         * 
         * Side effect: Adds a transistor (if found) to this.nmos or this.pmos.
         *.cell 
         * @method initIfTransistorChannel
         * @param {*} cell
         * @returns {boolean} True if the cell is a transistor.
         * @private
         */
        initIfTransistorChannel(cell) {
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
                            const gateVertex   = this.hypergraph.addVertex(cell.gate);
                            const sourceVertex = this.hypergraph.addVertex(cell.term1);
                            const drainVertex  = this.hypergraph.addVertex(cell.term2);
                            this.transistors.push(new Transistor(gateVertex, sourceVertex, drainVertex, this.strongLogicOneVertex, this.strongLogicZeroVertex));
                            transistorArray.add(cell);
                            return true;
                        }
                    }
                }
                return false;
            }.bind(this);

            return handleCell(LayeredGrid.PDIFF, this.pmos) || handleCell(LayeredGrid.NDIFF, this.nmos);
        }

        /**
         * @description
         * If the cell at location (cell.x + deltaX, cell.y + deltaY, cell.layer) is set,
         * and it is not already in the net, add it to the net unless it is a contact.
         * 
         * IMPORTANT: This function assumes that the `cell` is in `net`.
         * 
         * @param {number} deltaX The x offset from `cell`. Must be -1, 0, or 1.
         * @param {number} deltaY The y offset from `cell`. Must be -1, 0, or 1.
         * @param {Net} net The net to add the adjacent cell to.
         * @param {*} cell The cell whose adjacent cell is being set. IMPORTANT: must be in `net`.
         * @returns {undefined}
         * @throws {Error} If the inputs are invalid.
         * @private
         */
        setAdjacent(deltaX, deltaY, net, cell) {
            // Throw an exception if:
            // 1. deltaX is not -1, 0, or 1.
            // 2. deltaY is not -1, 0, or 1.
            // 3. cell is not in net.
            if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1 || !net.containsCell(cell)) {
                throw new Error("Invalid arguments to setAdjacent.");
            }

            // Don't connect contacts to adjacent contacts.
            if(cell.layer === LayeredGrid.CONTACT) {
                return;
            }

            // If the cell at (cell.x + deltaX, cell.y + deltaY, cell.layer) is set,
            // and it is not already in the net, add it and eligible adjacent cells to the net.
            if (this.layeredGrid.get(cell.x + deltaX, cell.y + deltaY, cell.layer).isSet) {
                if (net.containsCell(this.layeredGrid.get(cell.x + deltaX, cell.y + deltaY, cell.layer)) === false) {
                    this.setRecursively(this.layeredGrid.get(cell.x + deltaX, cell.y + deltaY, cell.layer), net);
                }
            }
        }

        /**
         * @description
         * If there is a contact at the cell, add all layers to the net.
         * 
         * @method handleContact
         * @param {*} cell 
         * @param {Net} net 
         * @returns {undefined}
         * @private
         */
        handleContact(cell, net) {
            if (this.layeredGrid.get(cell.x, cell.y, LayeredGrid.CONTACT).isSet) {
                // Add all layers to the net.
                LayeredGrid.layers.forEach(function(_, layer) {
                    //Ignore the delete layer.
                    if(layer === LayeredGrid.DELETE) {
                        return;
                    }
                    // Ignore unset layers.
                    if (!this.layeredGrid.get(cell.x, cell.y, layer).isSet) {
                        return;
                    }
                    // Add the cell to the net if it is not already in it.
                    if (net.containsCell(this.layeredGrid.get(cell.x, cell.y, layer)) === false) {
                        this.setRecursively(this.layeredGrid.get(cell.x, cell.y, layer), net);
                    }
                }.bind(this));
            }
        }

        /**
         * @description
         * Add `cell` to `net`, then recursively add all eligible adjacent cells to `net`.
         * 
         * @method setRecursively
         * @param {*} cell 
         * @param {Net} net 
         * @returns {undefined}
         * @private
         */
        setRecursively(cell, net) {
            if(net.cells.has(cell)) {
                return;
            }
            let gateNet;
            net.addVertex(this.hypergraph.getVertex(cell));

            // Return if this cell is in this.pmos or this.nmos already.
            if (this.nmos.has(cell) || this.pmos.has(cell)) {
                return;
            }

            // Check the cell for a transistor.
            // If this is in a diffusion layer, do not propogate past a transistor.
            // If this is in the poly layer, we don't need to stop at a transistor.
            if (cell.layer === LayeredGrid.POLY) {
                this.initIfTransistorChannel(this.layeredGrid.get(cell.x, cell.y, LayeredGrid.NDIFF));
                this.initIfTransistorChannel(this.layeredGrid.get(cell.x, cell.y, LayeredGrid.PDIFF));
            }
            else if (this.initIfTransistorChannel(cell)) {
                gateNet = new Net("gate", false);

                this.setRecursively(this.layeredGrid.get(cell.x, cell.y, LayeredGrid.POLY), gateNet);
                this.netlist.push(gateNet);

                return;
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

    // A shortcut binding is {keyCode, shiftModifier, ctrlModifier, keyLabel};
    // keyLabel is the key's display text, if known.
    const SHORTCUT_STORAGE_KEY = "stixu-shortcuts";

    // Display order, labels and groups for the keyboard shortcuts menu.
    // Each entry is [property name of the command on UserInterface, label].
    const SHORTCUT_GROUPS = [
        {title: "Editing", commands: [
            ["evaluateCommand",     "Evaluate the circuit",],
            ["undoCommand",         "Undo",],
            ["redoCommand",         "Redo",],
        ],},
        {title: "Terminals", commands: [
            ["placeVddCommand",     "Move VDD to the cursor",],
            ["placeGndCommand",     "Move GND to the cursor",],
            ["addInputCommand",     "Add an input",],
            ["removeInputCommand",  "Remove an input",],
            ["addOutputCommand",    "Add an output",],
            ["removeOutputCommand", "Remove an output",],
        ],},
        {title: "Grid", commands: [
            ["shiftLeftCommand",    "Shift the grid left",],
            ["shiftRightCommand",   "Shift the grid right",],
            ["shiftUpCommand",      "Shift the grid up",],
            ["shiftDownCommand",    "Shift the grid down",],
            ["insertColCommand",    "Insert a column at the cursor",],
            ["deleteColCommand",    "Delete the column at the cursor",],
            ["insertRowCommand",    "Insert a row at the cursor",],
            ["deleteRowCommand",    "Delete the row at the cursor",],
        ],},
        {title: "Appearance", commands: [
            ["darkModeCommand",     "Toggle dark mode",],
            ["themeCommand",        "Next layer palette",],
            ["transparencyCommand", "Toggle layer transparency",],
            ["gridCommand",         "Toggle grid lines",],
        ],},
    ];

    function bindingOf(command) {
        return {
            keyCode:       command.keyCode,
            shiftModifier: Boolean(command.shiftModifier),
            ctrlModifier:  Boolean(command.ctrlModifier),
            keyLabel:      command.keyLabel,
        };
    }

    function sameBinding(a, b) {
        return a.keyCode === b.keyCode &&
            Boolean(a.shiftModifier) === Boolean(b.shiftModifier) &&
            Boolean(a.ctrlModifier) === Boolean(b.ctrlModifier);
    }

    // Slide-in menu that shows one page at a time.
    // Pages are <section class="menu-page" data-page="..."> elements;
    // any element with data-goto="page" opens that page.
    // Back (or Escape) returns to the previous page, and closes the menu from the first page.
    class MenuPanel {
        constructor() {
            this.drawer      = document.getElementById("menu-drawer");
            this.backdrop    = document.getElementById("menu-backdrop");
            this.title       = document.getElementById("menu-title");
            this.backButton  = document.getElementById("menu-back-btn");
            this.scroller    = this.drawer.querySelector(".menu-pages");
            this.pages       = {};
            this.stack       = [];
            this.pageHandlers = {};
            this.closeHandlers = [];

            Array.from(this.drawer.querySelectorAll(".menu-page")).forEach(function(page) {
                this.pages[page.dataset.page] = page;
                page.hidden = true;
            }.bind(this));

            this.drawer.addEventListener("click", function(event) {
                const link = event.target.closest("[data-goto]");
                if(link) {
                    this.push(link.dataset.goto, link);
                }
            }.bind(this));

            this.backButton.onclick = this.back.bind(this);
            document.getElementById("menu-close-btn").onclick = this.close.bind(this);
            this.backdrop.onclick = this.close.bind(this);
        }

        isOpen() {
            return this.drawer.classList.contains("open");
        }

        // Run handler(pageElement) each time the named page is shown.
        onShow(pageName, handler) {
            this.pageHandlers[pageName] = handler;
        }

        // Run handler() each time the menu closes.
        onClose(handler) {
            this.closeHandlers.push(handler);
        }

        open(pageName) {
            this.stack = [{name: pageName || "main", opener: null, scrollTop: 0,},];
            this.show("none");

            if(!this.isOpen()) {
                this.drawer.classList.add("open");
                this.backdrop.classList.add("open");
                document.documentElement.classList.add("menu-open");
                document.getElementById("main-container").inert = true;
            }

            this.focusFirst();
        }

        close() {
            if(!this.isOpen()) {
                return false;
            }

            this.drawer.classList.remove("open");
            this.backdrop.classList.remove("open");
            document.documentElement.classList.remove("menu-open");
            document.getElementById("main-container").inert = false;

            if(this.drawer.contains(document.activeElement)) {
                document.activeElement.blur();
            }

            this.closeHandlers.forEach(handler => handler());
            return true;
        }

        // Open a page on top of the current one. opener is the element to refocus when coming back.
        push(pageName, opener) {
            this.stack[this.stack.length - 1].scrollTop = this.scroller.scrollTop;
            this.stack.push({name: pageName, opener: opener || null, scrollTop: 0,});
            this.show("forward");
            this.focusFirst();
        }

        back() {
            if(this.stack.length < 2) {
                return this.close();
            }

            const leaving = this.stack.pop();
            this.show("back");

            if(leaving.opener) {
                leaving.opener.focus({preventScroll: true,});
            } else {
                this.focusFirst();
            }

            return true;
        }

        show(direction) {
            const entry = this.stack[this.stack.length - 1];
            const page  = this.pages[entry.name];

            Object.keys(this.pages).forEach(function(name) {
                this.pages[name].hidden = name !== entry.name;
                this.pages[name].classList.remove("enter-forward", "enter-back");
            }.bind(this));

            if(direction !== "none") {
                page.classList.add("enter-" + direction);
            }

            this.title.textContent = page.dataset.title;
            this.backButton.classList.toggle("invisible", this.stack.length < 2);

            if(this.pageHandlers[entry.name]) {
                this.pageHandlers[entry.name](page);
            }

            this.scroller.scrollTop = entry.scrollTop;
        }

        currentPage() {
            return this.stack.length > 0 ? this.stack[this.stack.length - 1].name : null;
        }

        focusableElements() {
            return Array.from(this.drawer.querySelectorAll("button, a[href]")).filter(function(element) {
                return !element.disabled && element.offsetParent !== null && getComputedStyle(element).visibility !== "hidden";
            });
        }

        focusFirst() {
            const page  = this.pages[this.currentPage()];
            const first = this.focusableElements().find(element => page.contains(element));
            (first || document.getElementById("menu-close-btn")).focus({preventScroll: true,});
        }

        // Keep Tab and Shift+Tab inside the menu while it is open.
        trapFocus(event) {
            const focusable = this.focusableElements();
            const first     = focusable[0];
            const last      = focusable[focusable.length - 1];
            const inside    = this.drawer.contains(document.activeElement);

            if(!inside || (event.shiftKey && document.activeElement === first)) {
                event.preventDefault();
                (event.shiftKey ? last : first).focus();
            } else if(!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }

        keydownHandler(event) {
            if(event.key === "Tab") {
                this.trapFocus(event);
            } else if(event.key === "Escape") {
                event.preventDefault();
            }
        }

        keyupHandler(event) {
            if(event.key === "Escape") {
                this.back();
            }
        }
    }

    // The keyboard shortcuts page: lists every shortcut and lets the user change or reset each one.
    class ShortcutEditor {
        constructor(ui) {
            this.ui             = ui;
            this.list           = document.getElementById("shortcut-list");
            this.resetAllButton = document.getElementById("reset-shortcuts-btn");
            this.capturing      = null; // Command waiting for its new key combination.
            this.message        = null; // {command, text, isInfo, conflict} shown under that command's row.

            this.resetAllButton.onclick = this.resetAll.bind(this);
        }

        render() {
            this.list.textContent = "";

            SHORTCUT_GROUPS.forEach(function(group) {
                this.list.appendChild(this.renderGroup(group.title, group.commands.map(entry => this.ui[entry[0]])));
            }.bind(this));

            this.list.appendChild(this.renderFixedGroup());
            this.resetAllButton.disabled = this.ui.editableCommands().every(command => this.ui.isDefaultBinding(command));
        }

        renderGroup(title, commands) {
            const fragment = document.createDocumentFragment();
            const heading  = document.createElement("h3");
            const list     = document.createElement("ul");

            heading.className = "menu-group-title";
            heading.textContent = title;
            list.className = "menu-list";
            commands.forEach(command => list.appendChild(this.renderRow(command)));

            fragment.appendChild(heading);
            fragment.appendChild(list);
            return fragment;
        }

        renderRow(command) {
            const row   = document.createElement("li");
            const label = document.createElement("span");

            row.className = "shortcut-row";
            label.className = "shortcut-label";
            label.textContent = command.label;

            row.appendChild(label);
            row.appendChild(this.renderKeyButton(command));
            row.appendChild(this.renderResetButton(command));

            if(this.message && this.message.command === command) {
                row.appendChild(this.renderMessage());
            }

            return row;
        }

        renderKeyButton(command) {
            const button = document.createElement("button");
            const isDefault = this.ui.isDefaultBinding(command);

            button.type = "button";
            button.className = "shortcut-key";
            button.dataset.command = command.id;
            button.onclick = this.startCapture.bind(this, command);

            if(this.capturing === command) {
                button.classList.add("capturing");
                button.textContent = "Press keys…";
                button.setAttribute("aria-label", `${command.label}: waiting for new shortcut`);
            } else {
                this.appendKeys(button, command);
                button.classList.toggle("modified", !isDefault);
                button.setAttribute("aria-label", `${command.label}: ${this.ui.describeShortcut(command)}${isDefault ? "" : " (changed)"}. Select to change.`);
            }

            return button;
        }

        renderResetButton(command) {
            const button = document.createElement("button");
            const defaultText = this.ui.describeShortcut(command.defaultBinding);

            button.type = "button";
            button.className = "shortcut-reset";
            button.innerHTML = '<i class="fas fa-rotate-left" aria-hidden="true"></i>';
            button.title = `Reset to ${defaultText}`;
            button.setAttribute("aria-label", `Reset ${command.label} to ${defaultText}`);
            button.onclick = this.resetOne.bind(this, command);
            button.classList.toggle("invisible", this.ui.isDefaultBinding(command));

            return button;
        }

        renderMessage() {
            const box = document.createElement("div");
            const text = document.createElement("div");

            box.className = "shortcut-message" + (this.message.isInfo ? " info" : "");
            box.setAttribute("role", this.message.isInfo ? "status" : "alert");
            text.textContent = this.message.text;
            box.appendChild(text);

            if(this.message.conflict) {
                box.appendChild(this.renderMessageButton("Swap them", true, this.confirmSwap.bind(this)));
                box.appendChild(this.renderMessageButton("Cancel", false, this.cancel.bind(this)));
            }

            return box;
        }

        renderMessageButton(text, isPrimary, onclick) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "menu-button" + (isPrimary ? " primary" : "");
            button.textContent = text;
            button.onclick = onclick;
            return button;
        }

        // Keys that are not rebindable, listed so users know they are taken.
        renderFixedGroup() {
            const ui = this.ui;
            const inputs  = ui.diagram.inputs.map((_, index) => String.fromCharCode(65 + index));
            const outputs = ui.diagram.outputs.map((_, index) => String.fromCharCode(89 - index));
            const rows = [
                ["Close the menu, or go back a page", ["Esc",],],
                ["Move an input terminal to the cursor", inputs.length ? inputs : ["A",],],
                ["Move an output terminal to the cursor", outputs.length ? outputs : ["Y",],],
            ];
            const fragment = this.renderGroup("Fixed", []);
            const list = fragment.lastChild;

            rows.forEach(function(entry) {
                const row = document.createElement("li");
                const label = document.createElement("span");
                const keys = document.createElement("span");

                row.className = "shortcut-row";
                label.className = "shortcut-label";
                label.textContent = entry[0];
                keys.className = "shortcut-fixed";
                entry[1].forEach(name => keys.appendChild(ShortcutEditor.kbd(name)));
                row.appendChild(label);
                row.appendChild(keys);
                list.appendChild(row);
            });

            return fragment;
        }

        static kbd(text) {
            const element = document.createElement("kbd");
            element.textContent = text;
            return element;
        }

        appendKeys(element, binding) {
            this.ui.describeShortcutParts(binding).forEach(
                part => element.appendChild(ShortcutEditor.kbd(part))
            );
        }

        // Re-render, then return focus to the given command's key button.
        refresh(focusCommand) {
            this.render();

            if(focusCommand) {
                const button = this.list.querySelector(`[data-command="${focusCommand.id}"]`);
                if(button) {
                    button.focus({preventScroll: true,});
                }
            }
        }

        startCapture(command) {
            this.capturing = command;
            this.message = {command: command, text: "Press the new key combination. Esc cancels.", isInfo: true,};
            this.refresh(command);
        }

        cancel() {
            const command = this.capturing || (this.message && this.message.command);
            this.capturing = null;
            this.message = null;

            if(this.list.isConnected) {
                this.refresh(command);
            }
        }

        // Handle a keydown while the shortcuts page is open. Returns true if the event was used here.
        keydownHandler(event) {
            if(this.capturing && this.ui.menuPanel.currentPage() !== "shortcuts") {
                // The user left the page mid-capture; drop it rather than catching keys elsewhere.
                this.capturing = null;
                this.message = null;
            }

            if(!this.capturing) {
                return false;
            }

            event.preventDefault();
            this.ui.keyupToIgnore = event.keyCode;

            if(event.key === "Escape") {
                this.cancel();
            } else if(!ShortcutEditor.isModifierKey(event.keyCode)) {
                this.tryBinding(this.capturing, {
                    keyCode:       event.keyCode,
                    shiftModifier: event.shiftKey,
                    ctrlModifier:  event.ctrlKey,
                    keyLabel:      event.key,
                }, event);
            }

            return true;
        }

        static isModifierKey(keyCode) {
            // Shift, Ctrl, Alt, Caps Lock, and the Meta/OS keys.
            return [16, 17, 18, 20, 91, 92, 93, 224,].includes(keyCode);
        }

        tryBinding(command, binding, event) {
            const problem = this.ui.shortcutProblem(binding, event);
            const other   = this.ui.commandWithBinding(binding, command);

            if(problem) {
                this.message = {command: command, text: problem, isInfo: false,};
                this.refresh(command);
            } else if(other) {
                this.capturing = null;
                this.message = {
                    command:  command,
                    text:     `${this.ui.describeShortcut(binding)} is already used by “${other.label}”.`,
                    isInfo:   false,
                    conflict: {binding: binding, other: other,},
                };
                this.refresh(command);
                this.list.querySelector(".shortcut-message .menu-button").focus({preventScroll: true,});
            } else {
                this.capturing = null;
                this.message = null;
                this.ui.setBindings([[command, binding,],]);
                this.refresh(command);
            }
        }

        // Give the conflicting command this command's old shortcut, and this command the new one.
        confirmSwap() {
            const command  = this.message.command;
            const conflict = this.message.conflict;

            this.message = null;
            this.ui.setBindings([
                [conflict.other, bindingOf(command),],
                [command,        conflict.binding,],
            ]);
            this.refresh(command);
        }

        resetOne(command) {
            const other = this.ui.commandWithBinding(command.defaultBinding, command);
            const changes = [[command, command.defaultBinding,],];

            this.capturing = null;
            this.message = null;

            if(other) {
                // Another command took this default; it gets this command's current shortcut instead.
                changes.unshift([other, bindingOf(command),]);
                this.message = {
                    command: command,
                    text:    `“${other.label}” now uses ${this.ui.describeShortcut(command)}, because it had this default.`,
                    isInfo:  true,
                };
            }

            this.ui.setBindings(changes);
            this.refresh(command);
        }

        resetAll() {
            this.capturing = null;
            this.message = null;
            this.ui.setBindings(this.ui.editableCommands().map(command => [command, command.defaultBinding,]));
            this.render();
            // The reset button is now disabled, so move focus to the first shortcut.
            this.list.querySelector(".shortcut-key").focus({preventScroll: true,});
        }
    }

    class UserInterface {
        constructor(diagram) {
            this.diagram           = diagram;
            this.diagramController = diagram.controller;
            this.diagramView       = diagram.view;
            this.diagramGrid       = diagram.layeredGrid;

            // Panels opened and closed by "open-<name>-btn" and "close-<name>-btn".
            // The slide-in main menu is handled by this.menuPanel instead.
            this.menus = [
                "terminal-menu",
            ];

            this.menuPanel      = new MenuPanel();
            this.shortcutEditor = new ShortcutEditor(this);
            this.keyupToIgnore  = null;

            this.allCommands        = [];
            this.shiftCommands      = [];
            this.ctrlCommands       = [];
            this.noModifierCommands = [];

            this.initTerminalPlacementCommands();
            this.initNavigationCommands();
            this.initCosmeticCommands();
            this.initHistoryCommands();
            this.initRowColCommands();

            this.labelCommands();
            if(!window.runTestbench) {
                // The testbench expects the default shortcuts.
                this.loadShortcuts();
            }
            this.rebuildCommandTables();

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
            if(this.menuPanel.isOpen()) {
                if(!this.shortcutEditor.keydownHandler(event)) {
                    this.menuPanel.keydownHandler(event);
                }
                return;
            }
            
            let isInput  = function(keyCode) {
                return (keyCode >= 65) && (keyCode < 65 + this.diagram.inputs.length);
            }.bind(this);
            
            let isOutput = function(keyCode) {
                return (keyCode <= 89) && (keyCode > 89 - this.diagram.outputs.length);
            }.bind(this);

            if(this.dispatchCommand(event)) {
                return;
            }

            if (isInput(event.keyCode))  {
                event.preventDefault();
                this.diagramController.placeTerminal(event, this.diagram.inputs[event.keyCode - 65]);
            }
            else if (isOutput(event.keyCode)) {
                event.preventDefault();
                this.diagramController.placeTerminal(event, this.diagram.outputs[this.diagram.outputs.length - 90 + event.keyCode]);
            }
        }

        keyupHandler(event) {
            // Ignore the release of a key whose press was already used,
            // e.g. while setting a new shortcut.
            if(event.keyCode === this.keyupToIgnore) {
                this.keyupToIgnore = null;
                return;
            }

            if(this.menuPanel.isOpen()) {
                this.menuPanel.keyupHandler(event);
                return;
            }

            this.dispatchCommand(event);
        }

        // Run the command bound to this key event, if any.
        // Each command acts on one phase (keydown or keyup), whichever key it is bound to.
        // Returns true if a command is bound to the key, even when this phase is not the one it acts on.
        dispatchCommand(event) {
            let table = this.noModifierCommands;

            if(event.ctrlKey) {
                table = this.ctrlCommands;
            } else if(event.shiftKey) {
                table = this.shiftCommands;
            }

            const command = table[event.keyCode];

            if(!command) {
                return false;
            }

            if(event.type === "keydown" && (event.ctrlKey || event.shiftKey)) {
                // Keep the browser from acting on combinations such as Ctrl+Z.
                event.preventDefault();
            }

            if(event.type === command.phase) {
                command.action(event);
            }

            return true;
        }

        // Give each editable command its id, label and default binding.
        labelCommands() {
            SHORTCUT_GROUPS.forEach(function(group) {
                group.commands.forEach(function(entry) {
                    const command = this[entry[0]];
                    command.id = entry[0];
                    command.label = entry[1];
                    command.defaultBinding = bindingOf(command);
                }.bind(this));
            }.bind(this));
        }

        editableCommands() {
            return this.allCommands.filter(command => !!command.id);
        }

        isDefaultBinding(command) {
            return sameBinding(command, command.defaultBinding);
        }

        commandWithBinding(binding, except) {
            return this.editableCommands().find(command => command !== except && sameBinding(command, binding));
        }

        // Rebuild the lookup tables used to dispatch key events.
        rebuildCommandTables() {
            this.shiftCommands      = [];
            this.ctrlCommands       = [];
            this.noModifierCommands = [];

            this.allCommands.forEach(function(command) {
                if(command.ctrlModifier) {
                    this.ctrlCommands[command.keyCode] = command;
                }
                else if(command.shiftModifier) {
                    this.shiftCommands[command.keyCode] = command;
                }
                else {
                    this.noModifierCommands[command.keyCode] = command;
                }
            }.bind(this));
        }

        // Apply [command, binding] pairs together, then save and refresh everything that shows shortcuts.
        setBindings(changes) {
            changes.forEach(function(change) {
                change[0].keyCode       = change[1].keyCode;
                change[0].shiftModifier = !!change[1].shiftModifier;
                change[0].ctrlModifier  = !!change[1].ctrlModifier;
                change[0].keyLabel      = change[1].keyLabel;
            });

            this.rebuildCommandTables();
            this.saveShortcuts();
            this.refreshShortcutLabels();
        }

        // Explain why a key combination can't be used as a shortcut, or return null if it can.
        shortcutProblem(binding, event) {
            const keyCode = binding.keyCode;
            const isPlain = !binding.shiftModifier && !binding.ctrlModifier;
            // Plain letters A-H and R-Y place input and output terminals (up to eight in total).
            const isTerminalLetter = (keyCode >= 65 && keyCode <= 72) || (keyCode >= 82 && keyCode <= 89);
            const checks = [
                [
                    event.altKey || event.metaKey,
                    "Alt and Meta (⌘ or Windows key) shortcuts aren't supported. Use Shift or Ctrl.",
                ],
                [
                    binding.shiftModifier && binding.ctrlModifier,
                    "Use Shift or Ctrl, not both.",
                ],
                [
                    keyCode === 9,
                    "Tab is reserved for moving between controls.",
                ],
                [
                    isPlain && isTerminalLetter,
                    "On their own, A–H and R–Y move terminals. Add Shift or Ctrl.",
                ],
                [
                    binding.ctrlModifier && [78, 84, 87,].includes(keyCode),
                    `Browsers reserve Ctrl+${String.fromCharCode(keyCode)}.`,
                ],
            ];
            const problem = checks.find(check => check[0]);

            return problem ? problem[1] : null;
        }

        static keyName(keyCode, keyLabel) {
            const names = {
                8: "Backspace", 9: "Tab", 13: "Enter", 27: "Esc", 32: "Space", 33: "Page Up", 34: "Page Down",
                35: "End", 36: "Home", 37: "←", 38: "↑", 39: "→", 40: "↓", 45: "Insert", 46: "Delete",
            };
            const inRange = (low, high) => keyCode >= low && keyCode <= high;

            if(names[keyCode]) {
                return names[keyCode];
            } else if(inRange(48, 57) || inRange(65, 90)) {
                return String.fromCharCode(keyCode);
            } else if(inRange(112, 123)) {
                return "F" + (keyCode - 111);
            }

            // Punctuation and other keys: use the character the key produced when it was bound.
            return keyLabel && keyLabel.length === 1 ? keyLabel.toUpperCase() : (keyLabel || "Key " + keyCode);
        }

        describeShortcutParts(binding) {
            const parts = [];

            if(binding.ctrlModifier) {
                parts.push("Ctrl");
            }
            if(binding.shiftModifier) {
                parts.push("Shift");
            }

            parts.push(UserInterface.keyName(binding.keyCode, binding.keyLabel));
            return parts;
        }

        describeShortcut(binding) {
            return this.describeShortcutParts(binding).join("+");
        }

        // Fill every <kbd data-shortcut="commandName"> with that command's current shortcut.
        refreshShortcutLabels() {
            document.querySelectorAll("[data-shortcut]").forEach(function(element) {
                element.textContent = this.describeShortcut(this[element.dataset.shortcut]);
            }.bind(this));
        }

        // Restore shortcuts saved in this browser. Saved shortcuts that collide are all discarded.
        loadShortcuts() {
            let saved;

            try {
                saved = JSON.parse(window.localStorage.getItem(SHORTCUT_STORAGE_KEY)) || {};
            } catch(e) {
                return;
            }

            const changes = this.editableCommands().filter(command => {
                const binding = saved[command.id];
                return binding && Number.isInteger(binding.keyCode);
            }).map(command => [command, saved[command.id],]);

            changes.forEach(change => Object.assign(change[0], bindingOf(change[1])));

            const commands = this.editableCommands();
            const collides = commands.some((command, index) => commands.slice(index + 1).some(other => sameBinding(command, other)));

            if(collides) {
                commands.forEach(command => Object.assign(command, command.defaultBinding));
            }
        }

        // Save only the shortcuts that differ from their defaults.
        saveShortcuts() {
            const changed = {};

            this.editableCommands().forEach(function(command) {
                if(!this.isDefaultBinding(command)) {
                    changed[command.id] = bindingOf(command);
                }
            }.bind(this));

            try {
                window.localStorage.setItem(SHORTCUT_STORAGE_KEY, JSON.stringify(changed));
            } catch(e) {
                // Storage can be unavailable (private browsing, blocked site data); shortcuts then last for this visit only.
            }
        }

        initHistoryCommands() {
            this.undoCommand = {
                // CTRL-Z
                ctrlModifier: true,
                keyCode:      90,
                phase:        "keydown",
                action:       function() {
                    this.diagramController.undo();
                }.bind(this),
            };
            this.redoCommand = {
                // CTRL-Y
                ctrlModifier: true,
                keyCode:      89,
                phase:        "keydown",
                action:       function() {
                    this.diagramController.redo();
                }.bind(this),
            };

            this.allCommands.push(this.undoCommand);
            this.allCommands.push(this.redoCommand);
        }

        initNavigationCommands() {
            this.exitMenuCommand = {
                // ESC
                keyCode: 27,
                phase:   "keyup",
                action:  function() {
                    this.closeTopMenu();
                }.bind(this),
            };
            this.evaluateCommand = {
                // ENTER
                keyCode: 13,
                phase:   "keyup",
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
                phase:         "keydown",
                action:        function(e) {
                    this.diagramController.placeTerminal(e, this.diagram.vddCell);
                }.bind(this),
            };

            // SHIFT + G
            this.placeGndCommand = {
                shiftModifier: true,
                keyCode:       71,
                phase:         "keydown",
                action:        function(e) {
                    this.diagramController.placeTerminal(e, this.diagram.gndCell);
                }.bind(this),
            };

            // I
            this.addInputCommand = {
                keyCode: 73,
                phase:   "keyup",
                action:  function() {
                    this.diagramController.addTerminal(false);
                    this.populateTermSelect();
                }.bind(this),
            };

            // O
            this.addOutputCommand = {
                keyCode: 79,
                phase:   "keyup",
                action:  function() {
                    this.diagramController.addTerminal(true);
                    this.populateTermSelect();
                }.bind(this),
            };

            // SHIFT+I
            this.removeInputCommand = {
                shiftModifier: true,
                keyCode: 73,
                phase:   "keyup",
                action:  function() {
                    this.diagramController.removeTerminal(false);
                    this.populateTermSelect();
                }.bind(this),
            };

            // SHIFT+O
            this.removeOutputCommand = {
                shiftModifier: true,
                keyCode: 79,
                phase:   "keyup",
                action:  function() {
                    this.diagramController.removeTerminal(true);
                    this.populateTermSelect();
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

        // Insert (positive) or delete a column (byRow false) or row (byRow true) at the cursor.
        // Without a cell under the cursor, grow or shrink the grid at its edge instead.
        insertRemoveAtCursor(byRow, positive) {
            const coords = this.diagramController.getCellAtCursor();
            const axis   = byRow ? "y" : "x";
            const hasOwn = Object.hasOwn ? Object.hasOwn(coords, axis) : coords.hasOwnProperty(axis); // compatibility
            const offset = positive ? 1 : -1;

            if(hasOwn) {
                this.diagramGrid.insertRemoveRowColAt(coords[axis], positive, byRow);
            } else if(byRow) {
                this.diagramGrid.resize(this.diagramGrid.width, this.diagramGrid.height + offset);
            } else {
                this.diagramGrid.resize(this.diagramGrid.width + offset, this.diagramGrid.height);
            }
        }

        initRowColCommands() {
            // Arrow keys: 37 left, 38 up, 39 right, 40 down.
            // SHIFT + arrow shifts the grid; CTRL + arrow inserts (right/down)
            // or deletes (left/up) at the cursor.
            const shift = (byRow, offset) => () => this.diagramGrid.shift(0, byRow, offset);
            const edit  = (byRow, positive) => () => this.insertRemoveAtCursor(byRow, positive);
            const command = (keyCode, modifier, action) => ({
                keyCode:       keyCode,
                shiftModifier: modifier === "shift",
                ctrlModifier:  modifier === "ctrl",
                phase:         "keyup",
                action:        action,
            });

            this.shiftLeftCommand  = command(37, "shift", shift(false, -1));
            this.shiftUpCommand    = command(38, "shift", shift(true,  -1));
            this.shiftRightCommand = command(39, "shift", shift(false,  1));
            this.shiftDownCommand  = command(40, "shift", shift(true,   1));

            this.deleteColCommand  = command(37, "ctrl", edit(false, false));
            this.deleteRowCommand  = command(38, "ctrl", edit(true,  false));
            this.insertColCommand  = command(39, "ctrl", edit(false, true));
            this.insertRowCommand  = command(40, "ctrl", edit(true,  true));

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
                phase:   "keyup",
                action:  function() {
                    this.toggleDarkMode();
                }.bind(this),
            };

            // SHIFT + F
            this.transparencyCommand = {
                shiftModifier: true,
                keyCode: 70,
                phase:   "keyup",
                action:  function() {
                    this.toggleTransparency();
                }.bind(this),
            };
            
            // SHIFT + T
            this.themeCommand = {
                shiftModifier: true,
                keyCode: 84,
                phase:   "keyup",
                action:  function() {
                    this.changeTheme();
                }.bind(this),
            };

            // SHIFT + L
            this.gridCommand = {
                shiftModifier: true,
                keyCode: 76,
                phase:   "keyup",
                action:  function() {
                    this.toggleGrid();
                }.bind(this),
            };

            this.allCommands.push(this.darkModeCommand);
            this.allCommands.push(this.transparencyCommand);
            this.allCommands.push(this.themeCommand);
            this.allCommands.push(this.gridCommand);
        }

        toggleGrid() {
            this.diagramView.showGrid = !this.diagramView.showGrid;
            this.refreshOptions();
        }

        changeTheme() {
            if(this.diagramView.theme < DiagramView.themes.length - 1) {
                this.setTheme(this.diagramView.theme + 1);
            } else {
                this.setTheme(0);
            }
        }

        setTheme(themeIndex) {
            this.diagramView.theme = themeIndex;
            this.setUpLayerSelector();
            this.refreshOptions();
        }

        toggleTransparency() {
            this.diagramView.useFlatColors = !this.diagramView.useFlatColors;
            this.refreshOptions();
        }

        // Build the palette choices on the Options page, one per theme.
        setUpOptions() {
            const palette = document.getElementById("palette-options");

            DiagramView.themes.forEach(function(name, index) {
                const button = document.createElement("button");
                button.type = "button";
                button.setAttribute("role", "radio");
                button.textContent = name;
                button.onclick = this.setTheme.bind(this, index);
                palette.appendChild(button);
            }.bind(this));

            document.getElementById("option-dark-mode").onclick    = this.toggleDarkMode.bind(this);
            document.getElementById("option-transparency").onclick = this.toggleTransparency.bind(this);
            document.getElementById("option-grid").onclick         = this.toggleGrid.bind(this);
        }

        // Show the current appearance settings on the Options page.
        refreshOptions() {
            Array.from(document.getElementById("palette-options").children).forEach(function(button, index) {
                button.setAttribute("aria-checked", index === this.diagramView.theme);
            }.bind(this));

            document.getElementById("option-dark-mode")
                .setAttribute("aria-checked", Boolean(this.diagramView.darkMode));
            document.getElementById("option-transparency")
                .setAttribute("aria-checked", !this.diagramView.useFlatColors);
            document.getElementById("option-grid")
                .setAttribute("aria-checked", Boolean(this.diagramView.showGrid));
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
                if(!this.menuPanel.isOpen()) {
                    this.mouseupHandler(e);
                }
            }.bind(this));

            window.addEventListener("mouseup", function(e) {
                if(!this.menuPanel.isOpen()) {
                    this.mouseupHandler(e);
                }
            }.bind(this));

            window.addEventListener("touchstart", function(e) {
                if(!this.menuPanel.isOpen()) {
                    this.mousedownHandler(e);
                }
            }.bind(this));

            window.addEventListener("mousedown", function(e) {
                if(!this.menuPanel.isOpen()) {
                    this.mousedownHandler(e);
                }
            }.bind(this));

            window.addEventListener("touchmove", function(e) {
                if(!this.menuPanel.isOpen()) {
                    this.mousemoveHandler(e);
                }
            }.bind(this));

            window.addEventListener("mousemove", function(e) {
                if(!this.menuPanel.isOpen()) {
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
                if (e.button === 2 && !this.menuPanel.isOpen()) {
                    // Don't show a context menu.
                    e.preventDefault();
                }
            }.bind(this));

            // Set up the evaluate button.
            this.button = document.getElementById("evaluate-btn");
            this.button.onclick = function() {
                this.refreshTruthTable();
            }.bind(this);
        }

        // TODO: Continue to improve this function.
        setUpControls() {
            const resizeGridByOne = function(byRow, positive) {
                return function() {
                    const offset = positive ? 1 : -1;
                    const newWidth = byRow ? this.diagramGrid.width            : this.diagramGrid.width + offset;
                    const newHeight = byRow ? this.diagramGrid.height + offset : this.diagramGrid.height;
                    this.diagramGrid.resize(newWidth, newHeight);
                    this.diagramView.drawGrid();
                }.bind(this);
            }.bind(this);

            const simpleGridShift = function(byRow, positive) {
                return function() {
                    const offset = positive ? 1 : -1;
                    this.diagramGrid.shift(0, byRow, offset);
                }.bind(this);
            }.bind(this);

            this.menus.forEach(function(menuName) {
                document.getElementById("open-" + menuName + "-btn").onclick  = this.getOpenMenuFunction(menuName);
                document.getElementById("close-" + menuName + "-btn").onclick = this.getCloseMenuFunction(menuName);
            }.bind(this));

            this.setUpMenuPanel();

            const copyLinkBtn = document.getElementById("copy-link-btn");
            copyLinkBtn.onclick = function() {
                const url = window.location.href.split('?')[0] + "?d=" + this.diagram.encode();
                const label = copyLinkBtn.querySelector(".menu-row-label");
                const showResult = function(text, copied) {
                    label.textContent = text;
                    copyLinkBtn.classList.toggle("menu-row-done", copied);
                    setTimeout(() => {
                        label.textContent = "Copy sharable link";
                        copyLinkBtn.classList.remove("menu-row-done");
                    }, 1500);
                };

                navigator.clipboard.writeText(url).then(
                    () => showResult("Copied to clipboard!", true),
                    () => showResult("Couldn't copy the link", false)
                );
            }.bind(this);

            document.getElementById("download-verilog-btn").onclick = function() {
                this.refreshTruthTable();
                const verilog = HDLExporter.generateVerilog(this.truthTable, this.diagram);
                const blob = new Blob([verilog], {type: "text/plain"});
                const url = window.URL.createObjectURL(blob);
                // Download the file immediately.
                const a = document.createElement("a");
                a.href = url;
                a.download = "diagram.v";
                a.click();
                // Revoke the URL after a short delay to allow the download to complete.
                setTimeout(function() {
                    window.URL.revokeObjectURL(url);
                    a.remove();
                }, 100);
            }.bind(this);

            document.getElementById("download-irsim-btn").onclick = function() {
                const download = function(data, name) {
                    const blob = new Blob([data], {type: "text/plain"});
                    const url = window.URL.createObjectURL(blob);
                    // Download the file immediately.
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = name;
                    a.click();
                    // Revoke the URL after a short delay to allow the download to complete.
                    setTimeout(function() {
                        window.URL.revokeObjectURL(url);
                        a.remove();
                    }, 100);
                }
                this.refreshTruthTable();
                const irsim = HDLExporter.generateIRSIM(this.diagram);
                download(irsim.sim, "diagram.sim");
                download(irsim.cmd, "diagram.cmd");
            }.bind(this);

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
            };
        }

        getCloseMenuFunction(menuName) {
            return function() {
                let menu = document.getElementById(menuName);

                if(!menu.classList.contains("closed")) {
                    menu.classList.add("closed");
                    return true;
                }
            };
        }

        // Wire the slide-in main menu: its open button, and pages that render when shown.
        setUpMenuPanel() {
            document.getElementById("open-main-menu-btn").onclick = function() {
                this.menuPanel.open();
            }.bind(this);

            this.setUpOptions();
            this.refreshShortcutLabels();
            this.menuPanel.onShow("options", this.refreshOptions.bind(this));
            this.menuPanel.onShow("shortcuts", this.shortcutEditor.render.bind(this.shortcutEditor));
            this.menuPanel.onClose(this.shortcutEditor.cancel.bind(this.shortcutEditor));
        }

        closeTopMenu() {
            if(this.menuPanel.isOpen()) {
                this.menuPanel.back();
                return;
            }

            this.menus.some(function(menuName) {
                return document.getElementById("close-" + menuName + "-btn").onclick();
            });
        }

        closeAllMenus() {
            this.menuPanel.close();
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
                    tableOutputRow[jj] = this.diagram.computeOutput(ii, jj);
                    // Don't reuse the analysis in case of conflicted paths.
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
            this.truthTable = table;
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
                                let path, outputNum, outputVertexIndex;
                                outputNum = colIndex - this.diagram.inputs.length;
                                outputVertexIndex = this.diagram.outputVertices[outputNum].index;
                                path = this.diagram.analyses[rowIndex - 1][outputVertexIndex];
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

            this.refreshOptions();
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
        // Clear local storage, except for saved keyboard shortcuts.
        try {
            Object.keys(localStorage).forEach(function(key) {
                if(key !== SHORTCUT_STORAGE_KEY) {
                    localStorage.removeItem(key);
                }
            });
        } catch(e) {
            // Storage may be unavailable; there is nothing to clear.
        }

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
            const urlParams = new URLSearchParams(window.location.search);
            const runTo = urlParams.get("runto") || null;
            window.UI = UI;
            window.Diagram = Diagram;
            window.LayeredGrid = LayeredGrid;
            window.DiagramController = DiagramController;
            window.Hypergraph = Hypergraph;
            window.debugDefinitions();
            window.runTestbench();
        } else {
            const urlParams = new URLSearchParams(window.location.search);
            if(urlParams.get("d")) {
                diagram.decode(urlParams.get("d"));
                UI.populateTermSelect();
            } else if(urlParams.get("demo")) {
                UI.diagram.decode("RnhzR0F3RUJBUUVaQVJVQkN3RUZGUXdBzAFDxAVRxglJQVFBQt8JyAlINMU%2FUM5O3QFFxAVnQsQJSd8JyQkrxjbEAS%2FfX9cBSDhBZu4ApUgvLy%2FLEklJQUFCQsQISUlCZi85xHlJQi8v03BCRUVBUklnZ0NKRUbECW9DSkVWRVJJaW9pSkVWa1JJQ2tnSkFVa0JJQ2fECUVCSUNBZ0pBUUVCSUFBQUrkANJJQUVBSkFDxAlVyAlRxAlBQtJxUC83LzTlAaBPZTTuAa1BUDPmAYPKAU9BxhJELy8vZ9JN0QHlAM%2FFCVFCQUbGE1HGCOQBd8RpQUFCQWjHL%2BgBiskkUUNnxRRCQ0PJJch45QCrQUFB");
                UI.populateTermSelect();
            }
        }
    };
})();
