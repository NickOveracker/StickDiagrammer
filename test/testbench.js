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
/* jshint esversion: 9 */
/* jshint forin: true */
/* jshint freeze: true */
/* jshint futurehostile: true */
/* jshint leanswitch: true */
/* jshint maxcomplexity: 15 */
/* jshint maxdepth: 4 */
/* jshint maxparams: 4 */
/* jshint noarg: true */
/* jshint nocomma: false */
/* jshint nonbsp: true */
/* jshint nonew: true */
/* jshint noreturnawait: true */
/* jshint regexpu: true */
/* jshint strict: true */
/* jshint trailingcomma: false */
/* jshint undef: true */
/* jshint unused: false */
/* jshint varstmt: true */
/* jshint browser: true */
/* globals UI: false,
           LayeredGrid: false,
*/

function runTestbench(runTo) {
    'use strict';
    let endTime;
    let evt;
    let executeNext = false;
    let assertNext = false;
    let evalBooleanNext = false;
    let tv;
    let testVector = 0;
    let p;
    let results = [];
    let startTime;
    const testCases = ["Five-stage inverter",
                       "Four-stage buffer",
                       "OR-4",
                       "NOR-4",
                       "NAND-4",
                       "AND-4",
                       "This test always fails",
                       "Short-circuit #1",
                       "Short-circuit #2",
                       "Short-circuit #3",
                       "Short-circuit #4",
                       "Short-circuit #5",
                       "Short-circuit #6",
                       "Open-circuit #1",
                       "Open-circuit #2",
                       "Open-circuit #3",
                       "Direct input #1",
                       "Direct input #2",
                       "Direct input #3",
                       "Direct input #4",
                       "A*B*(C+D)",
                       "AOI4",
                       "Between transistors",
                       "SR latch Q",
                       "SR latch Q'",
                       "D flip-flop",
                       "VDD & GND driving single PMOS gate",
                       "Two inputs driving single PMOS gate",
                       "VDD & GND driving single NMOS gate",
                       "Two inputs driving single NMOS gate",
                       "Indirectly overdriven output via NMOS",
                       "Indirectly overdriven output via PMOS",
                       "Indirectly overdriven gates via PMOS",
                       "Indirectly overdriven gates via NMOS",
                       "Overdriven dead-end transistor",
                       "One overdriven transistor in series with VDD w/ grounded gate",
                       "Two overdriven dead-end transistors in series",
                       "Two overdriven transistors in series with VDD",
                       "Two overdriven transistors in series with VDD w/ grounded gate",
                       "One transistor driven by VDD & GND in series w/ singly-driven gate & direct input",
                       "One transistor driven by VDD & GND in series w/ overdriven gate & direct input",
                       "Dark mode toggle button test",
                       "Dark mode toggle keyboard test",
                       "Theme change keyboard test",
                       "Transparency toggle keyboard test",
                       "Add two inputs keyboard test",
                       "Remove one input keyboard test",
                       "Add two outputs keyboard test",
                       "Remove one output keyboard test",
                       "Three overdriven transistors in series with input and two outputs (Known bug)",
    ];
    runTo = runTo || testCases.length;

    // Set up the testbench
    while(LayeredGrid.layers[UI.diagramController.cursorIndex].name !== "metal1") {
        UI.diagramController.changeLayer();
    }

    function mapX(x) {return Math.floor(x*UI.diagramView.cellWidth + UI.diagramView.canvas.getBoundingClientRect().left + UI.diagramView.cellWidth);}
    function mapY(y) {return Math.floor(y*UI.diagramView.cellHeight + UI.diagramView.canvas.getBoundingClientRect().top + UI.diagramView.cellHeight);}

    let events = [
        1,
        // Place terminals
        function() {
            UI.diagram.inputs[0].x = 3;
            UI.diagram.inputs[0].y = 14;

            UI.diagram.outputs[0].x = 28;
            UI.diagram.outputs[0].y = 14;

            for(let ii = 1; ii < UI.diagram.inputs.length; ii++) {
                UI.diagram.inputs[ii].x = 0;
                UI.diagram.inputs[ii].y = 0;
            }

            UI.diagram.vddCell.x    = 1;
            UI.diagram.vddCell.y    = 1;
            UI.diagram.gndCell.x    = 1;
            UI.diagram.gndCell.y    = 27;
        },

        // Clear the canvas
        ["mousedown", {button:  2, clientX: mapX(1),   clientY: mapY(1)}],
        ["mousemove", {buttons: 2, clientX: mapX(29),  clientY: mapY(29)}],
        ["mouseup",   {button:  2, clientX: mapX(29),  clientY: mapY(29)}],

        /* 5-stage inverter */
        // VDD/GND rails.
        ["mousedown", {button:  0, clientX: mapX(2),  clientY: mapY(2)}],
        ["mousemove", {buttons: 1, clientX: mapX(28), clientY: mapY(2)}],
        ["mouseup",   {button:  0, clientX: mapX(28), clientY: mapY(2)}],

        ["mousedown", {button:  0, clientX: mapX(2),  clientY: mapY(28)}],
        ["mousemove", {buttons: 1, clientX: mapX(28), clientY: mapY(28)}],
        ["mouseup",   {button:  0, clientX: mapX(28), clientY: mapY(28)}],

        // METAL TO POLY
        ["mousedown", {button:  0, clientX: mapX(6),   clientY: mapY(15)}],
        ["mousemove", {buttons: 1, clientX: mapX(10),  clientY: mapY(15)}],
        ["mouseup",   {button:  0, clientX: mapX(10),  clientY: mapY(15)}],

        ["mousedown", {button:  0, clientX: mapX(12),  clientY: mapY(15)}],
        ["mousemove", {buttons: 1, clientX: mapX(16),  clientY: mapY(15)}],
        ["mouseup",   {button:  0, clientX: mapX(16),  clientY: mapY(15)}],

        ["mousedown", {button:  0, clientX: mapX(18),  clientY: mapY(15)}],
        ["mousemove", {buttons: 1, clientX: mapX(22),  clientY: mapY(15)}],
        ["mouseup",   {button:  0, clientX: mapX(22),  clientY: mapY(15)}],

        ["mousedown", {button:  0, clientX: mapX(24),  clientY: mapY(15)}],
        ["mousemove", {buttons: 1, clientX: mapX(27),  clientY: mapY(15)}],
        ["mouseup",   {button:  0, clientX: mapX(27),  clientY: mapY(15)}],

        0,

        // METAL2
        // VDD to PDIFF
        ["mousedown", {button:  0, clientX: mapX(2),   clientY: mapY(5)}],
        ["mousemove", {buttons: 1, clientX: mapX(2),   clientY: mapY(2)}],
        ["mouseup",   {button:  0, clientX: mapX(2),   clientY: mapY(2)}],

        ["mousedown", {button:  0, clientX: mapX(8),   clientY: mapY(5)}],
        ["mousemove", {buttons: 1, clientX: mapX(8),   clientY: mapY(2)}],
        ["mouseup",   {button:  0, clientX: mapX(8),   clientY: mapY(2)}],

        ["mousedown", {button:  0, clientX: mapX(14),  clientY: mapY(5)}],
        ["mousemove", {buttons: 1, clientX: mapX(14),  clientY: mapY(2)}],
        ["mouseup",   {button:  0, clientX: mapX(14),  clientY: mapY(2)}],

        ["mousedown", {button:  0, clientX: mapX(20),  clientY: mapY(5)}],
        ["mousemove", {buttons: 1, clientX: mapX(20),  clientY: mapY(2)}],
        ["mouseup",   {button:  0, clientX: mapX(20),  clientY: mapY(2)}],

        ["mousedown", {button:  0, clientX: mapX(26),  clientY: mapY(5)}],
        ["mousemove", {buttons: 1, clientX: mapX(26),  clientY: mapY(2)}],
        ["mouseup",   {button:  0, clientX: mapX(26),  clientY: mapY(2)}],

        // GND to NDIFF
        ["mousedown", {button:  0, clientX: mapX(2),   clientY: mapY(25)}],
        ["mousemove", {buttons: 1, clientX: mapX(2),   clientY: mapY(28)}],
        ["mouseup",   {button:  0, clientX: mapX(2),   clientY: mapY(28)}],

        ["mousedown", {button:  0, clientX: mapX(8),   clientY: mapY(25)}],
        ["mousemove", {buttons: 1, clientX: mapX(8),   clientY: mapY(28)}],
        ["mouseup",   {button:  0, clientX: mapX(8),   clientY: mapY(28)}],

        ["mousedown", {button:  0, clientX: mapX(14),  clientY: mapY(25)}],
        ["mousemove", {buttons: 1, clientX: mapX(14),  clientY: mapY(28)}],
        ["mouseup",   {button:  0, clientX: mapX(14),  clientY: mapY(28)}],

        ["mousedown", {button:  0, clientX: mapX(20),  clientY: mapY(25)}],
        ["mousemove", {buttons: 1, clientX: mapX(20),  clientY: mapY(28)}],
        ["mouseup",   {button:  0, clientX: mapX(20),  clientY: mapY(28)}],

        ["mousedown", {button:  0, clientX: mapX(26),  clientY: mapY(25)}],
        ["mousemove", {buttons: 1, clientX: mapX(26),  clientY: mapY(28)}],
        ["mouseup",   {button:  0, clientX: mapX(26),  clientY: mapY(28)}],
    
        // PDIFF to NDIFF
        ["mousedown", {button:  0, clientX: mapX(6),   clientY: mapY(5)}],
        ["mousemove", {buttons: 1, clientX: mapX(6),   clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(6),   clientY: mapY(25)}],

        ["mousedown", {button:  0, clientX: mapX(12),  clientY: mapY(5)}],
        ["mousemove", {buttons: 1, clientX: mapX(12),  clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(12),  clientY: mapY(25)}],

        ["mousedown", {button:  0, clientX: mapX(18),  clientY: mapY(5)}],
        ["mousemove", {buttons: 1, clientX: mapX(18),  clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(18),  clientY: mapY(25)}],

        ["mousedown", {button:  0, clientX: mapX(24),  clientY: mapY(5)}],
        ["mousemove", {buttons: 1, clientX: mapX(24),  clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(24),  clientY: mapY(25)}],

        ["mousedown", {button:  0, clientX: mapX(29),  clientY: mapY(5)}],
        ["mousemove", {buttons: 1, clientX: mapX(29),  clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(29),  clientY: mapY(25)}],

        0,

        // CONTACTS
        // METAL1 to METAL2
        ["mousedown", {button:  0, clientX: mapX(2),   clientY: mapY(2)}],
        ["mouseup",   {button:  0, clientX: mapX(2),   clientY: mapY(2)}],

        ["mousedown", {button:  0, clientX: mapX(8),   clientY: mapY(2)}],
        ["mouseup",   {button:  0, clientX: mapX(8),   clientY: mapY(2)}],

        ["mousedown", {button:  0, clientX: mapX(14),  clientY: mapY(2)}],
        ["mouseup",   {button:  0, clientX: mapX(14),  clientY: mapY(2)}],

        ["mousedown", {button:  0, clientX: mapX(20),  clientY: mapY(2)}],
        ["mouseup",   {button:  0, clientX: mapX(20),  clientY: mapY(2)}],

        ["mousedown", {button:  0, clientX: mapX(26),  clientY: mapY(2)}],
        ["mouseup",   {button:  0, clientX: mapX(26),  clientY: mapY(2)}],

        // GND to NDIFF
        ["mousedown", {button:  0, clientX: mapX(2),   clientY: mapY(28)}],
        ["mouseup",   {button:  0, clientX: mapX(2),   clientY: mapY(28)}],

        ["mousedown", {button:  0, clientX: mapX(8),   clientY: mapY(28)}],
        ["mouseup",   {button:  0, clientX: mapX(8),   clientY: mapY(28)}],

        ["mousedown", {button:  0, clientX: mapX(14),  clientY: mapY(28)}],
        ["mouseup",   {button:  0, clientX: mapX(14),  clientY: mapY(28)}],

        ["mousedown", {button:  0, clientX: mapX(20),  clientY: mapY(28)}],
        ["mouseup",   {button:  0, clientX: mapX(20),  clientY: mapY(28)}],

        ["mousedown", {button:  0, clientX: mapX(26),  clientY: mapY(28)}],
        ["mouseup",   {button:  0, clientX: mapX(26),  clientY: mapY(28)}],

        // PDIFF to METAL
        ["mousedown", {button:  0, clientX: mapX(2),  clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(2),  clientY: mapY(5)}],

        ["mousedown", {button:  0, clientX: mapX(6),  clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(6),  clientY: mapY(5)}],

        ["mousedown", {button:  0, clientX: mapX(8),  clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(8),  clientY: mapY(5)}],

        ["mousedown", {button:  0, clientX: mapX(12), clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(12), clientY: mapY(5)}],

        ["mousedown", {button:  0, clientX: mapX(14), clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(14), clientY: mapY(5)}],

        ["mousedown", {button:  0, clientX: mapX(18), clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(18), clientY: mapY(5)}],

        ["mousedown", {button:  0, clientX: mapX(20), clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(20), clientY: mapY(5)}],

        ["mousedown", {button:  0, clientX: mapX(24), clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(24), clientY: mapY(5)}],

        ["mousedown", {button:  0, clientX: mapX(26), clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(26), clientY: mapY(5)}],

        ["mousedown", {button:  0, clientX: mapX(29), clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(29), clientY: mapY(5)}],

        // NDIFF to METAL
        ["mousedown", {button:  0, clientX: mapX(2),  clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(2),  clientY: mapY(25)}],

        ["mousedown", {button:  0, clientX: mapX(6),  clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(6),  clientY: mapY(25)}],

        ["mousedown", {button:  0, clientX: mapX(8),  clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(8),  clientY: mapY(25)}],

        ["mousedown", {button:  0, clientX: mapX(12), clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(12), clientY: mapY(25)}],

        ["mousedown", {button:  0, clientX: mapX(14), clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(14), clientY: mapY(25)}],

        ["mousedown", {button:  0, clientX: mapX(18), clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(18), clientY: mapY(25)}],

        ["mousedown", {button:  0, clientX: mapX(20), clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(20), clientY: mapY(25)}],

        ["mousedown", {button:  0, clientX: mapX(24), clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(24), clientY: mapY(25)}],

        ["mousedown", {button:  0, clientX: mapX(26), clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(26), clientY: mapY(25)}],

        ["mousedown", {button:  0, clientX: mapX(29), clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(29), clientY: mapY(25)}],

        // TRANSISTOR OUTPUTS
        ["mousedown", {button:  0, clientX: mapX(6),   clientY: mapY(15)}],
        ["mouseup",   {button:  0, clientX: mapX(6),   clientY: mapY(15)}],

        ["mousedown", {button:  0, clientX: mapX(10),  clientY: mapY(15)}],
        ["mouseup",   {button:  0, clientX: mapX(10),  clientY: mapY(15)}],

        ["mousedown", {button:  0, clientX: mapX(12),  clientY: mapY(15)}],
        ["mouseup",   {button:  0, clientX: mapX(12),  clientY: mapY(15)}],

        ["mousedown", {button:  0, clientX: mapX(16),  clientY: mapY(15)}],
        ["mouseup",   {button:  0, clientX: mapX(16),  clientY: mapY(15)}],

        ["mousedown", {button:  0, clientX: mapX(18),  clientY: mapY(15)}],
        ["mouseup",   {button:  0, clientX: mapX(18),  clientY: mapY(15)}],

        ["mousedown", {button:  0, clientX: mapX(22),  clientY: mapY(15)}],
        ["mouseup",   {button:  0, clientX: mapX(22),  clientY: mapY(15)}],

        ["mousedown", {button:  0, clientX: mapX(24),  clientY: mapY(15)}],
        ["mouseup",   {button:  0, clientX: mapX(24),  clientY: mapY(15)}],

        ["mousedown", {button:  0, clientX: mapX(27),  clientY: mapY(15)}],
        ["mouseup",   {button:  0, clientX: mapX(27),  clientY: mapY(15)}],

        0,

        // PDIFF
        ["mousedown", {button:  0, clientX: mapX(2),  clientY: mapY(5)}],
        ["mousemove", {buttons: 1, clientX: mapX(29), clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(29), clientY: mapY(5)}],

        0,

        // NDIFF
        ["mousedown", {button:  0, clientX: mapX(2),  clientY: mapY(25)}],
        ["mousemove", {buttons: 1, clientX: mapX(29), clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(29), clientY: mapY(25)}],

        0,

        // POLY
        ["mousedown", {button:  0, clientX: mapX(4),  clientY: mapY(4)}],
        ["mousemove", {buttons: 1, clientX: mapX(4),  clientY: mapY(26)}],
        ["mouseup",   {button:  0, clientX: mapX(4),  clientY: mapY(26)}],

        ["mousedown", {button:  2, clientX: mapX(7),  clientY: mapY(5)}],
        ["mouseup",   {button:  2, clientX: mapX(7),  clientY: mapY(5)}],

        ["mousedown", {button:  2, clientX: mapX(7),  clientY: mapY(25)}],
        ["mouseup",   {button:  2, clientX: mapX(7),  clientY: mapY(25)}],

        ["mousedown", {button:  0, clientX: mapX(10),  clientY: mapY(4)}],
        ["mousemove", {buttons: 1, clientX: mapX(10),  clientY: mapY(26)}],
        ["mouseup",   {button:  0, clientX: mapX(10),  clientY: mapY(26)}],

        ["mousedown", {button:  2, clientX: mapX(13),  clientY: mapY(5)}],
        ["mouseup",   {button:  2, clientX: mapX(13),  clientY: mapY(5)}],

        ["mousedown", {button:  2, clientX: mapX(13),  clientY: mapY(25)}],
        ["mouseup",   {button:  2, clientX: mapX(13),  clientY: mapY(25)}],

        ["mousedown", {button:  0, clientX: mapX(16),  clientY: mapY(4)}],
        ["mousemove", {buttons: 1, clientX: mapX(16),  clientY: mapY(26)}],
        ["mouseup",   {button:  0, clientX: mapX(16),  clientY: mapY(26)}],

        ["mousedown", {button:  2, clientX: mapX(19),  clientY: mapY(5)}],
        ["mouseup",   {button:  2, clientX: mapX(19),  clientY: mapY(5)}],

        ["mousedown", {button:  2, clientX: mapX(19),  clientY: mapY(25)}],
        ["mouseup",   {button:  2, clientX: mapX(19),  clientY: mapY(25)}],

        ["mousedown", {button:  0, clientX: mapX(22),  clientY: mapY(4)}],
        ["mousemove", {buttons: 1, clientX: mapX(22),  clientY: mapY(26)}],
        ["mouseup",   {button:  0, clientX: mapX(22),  clientY: mapY(26)}],

        ["mousedown", {button:  2, clientX: mapX(25),  clientY: mapY(5)}],
        ["mouseup",   {button:  2, clientX: mapX(25),  clientY: mapY(5)}],

        ["mousedown", {button:  2, clientX: mapX(25),  clientY: mapY(25)}],
        ["mouseup",   {button:  2, clientX: mapX(25),  clientY: mapY(25)}],

        ["mousedown", {button:  0, clientX: mapX(27),  clientY: mapY(4)}],
        ["mousemove", {buttons: 1, clientX: mapX(27),  clientY: mapY(26)}],
        ["mouseup",   {button:  0, clientX: mapX(27),  clientY: mapY(26)}],

        0, // METAL1
        0, // METAL2
        0,

        2,
        "1111111100000000",

        /* 4-stage buffer */

        1,

        // Place terminals
        function() {
            UI.diagram.outputs[0].x = 23;
            UI.diagram.outputs[0].y = 14;
        },

        2,
        "0000000011111111",

        /* OR-4 */
        ["mousedown", {button:  2, clientX: mapX(3),   clientY: mapY(3)}],
        ["mousemove", {buttons: 2, clientX: mapX(20),  clientY: mapY(4)}],
        ["mouseup",   {button:  2, clientX: mapX(20),  clientY: mapY(4)}],

        ["mousedown", {button:  2, clientX: mapX(3),   clientY: mapY(2)}],
        ["mousemove", {buttons: 2, clientX: mapX(25),  clientY: mapY(2)}],
        ["mouseup",   {button:  2, clientX: mapX(25),  clientY: mapY(2)}],

        ["mousedown", {button:  2, clientX: mapX(5),   clientY: mapY(5)}],
        ["mousemove", {buttons: 2, clientX: mapX(9),   clientY: mapY(27)}],
        ["mouseup",   {button:  2, clientX: mapX(9),   clientY: mapY(27)}],

        ["mousedown", {button:  2, clientX: mapX(11),   clientY: mapY(5)}],
        ["mousemove", {buttons: 2, clientX: mapX(15),   clientY: mapY(24)}],
        ["mouseup",   {button:  2, clientX: mapX(15),   clientY: mapY(24)}],

        ["mousedown", {button:  2, clientX: mapX(11),   clientY: mapY(5)}],
        ["mousemove", {buttons: 2, clientX: mapX(13),   clientY: mapY(25)}],
        ["mouseup",   {button:  2, clientX: mapX(13),   clientY: mapY(25)}],

        ["mousedown", {button:  2, clientX: mapX(17),   clientY: mapY(5)}],
        ["mousemove", {buttons: 2, clientX: mapX(21),   clientY: mapY(27)}],
        ["mouseup",   {button:  2, clientX: mapX(21),   clientY: mapY(27)}],

        ["mousedown", {button:  2, clientX: mapX(23),   clientY: mapY(16)}],
        ["mousemove", {buttons: 2, clientX: mapX(24),   clientY: mapY(24)}],
        ["mouseup",   {button:  2, clientX: mapX(24),   clientY: mapY(24)}],

        ["mousedown", {button:  2, clientX: mapX(8),    clientY: mapY(28)}],
        ["mouseup",   {button:  2, clientX: mapX(8),    clientY: mapY(28)}],

        ["mousedown", {button:  2, clientX: mapX(20),   clientY: mapY(28)}],
        ["mouseup",   {button:  2, clientX: mapX(20),   clientY: mapY(28)}],

        0,

        // PDIFF
        ["mousedown", {button:  0, clientX: mapX(2),  clientY: mapY(5)}],
        ["mousemove", {buttons: 1, clientX: mapX(24), clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(24), clientY: mapY(5)}],

        0,

        // NDIFF
        ["mousedown", {button:  0, clientX: mapX(2),  clientY: mapY(25)}],
        ["mousemove", {buttons: 1, clientX: mapX(24), clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(24), clientY: mapY(25)}],

        0,

        0,
        // METAL
        ["mousedown", {button:  0, clientX: mapX(7),  clientY: mapY(12)}],
        ["mousemove", {buttons: 1, clientX: mapX(24), clientY: mapY(12)}],
        ["mouseup",   {button:  0, clientX: mapX(24), clientY: mapY(12)}],

        ["mousedown", {button:  0, clientX: mapX(3),   clientY: mapY(2)}],
        ["mousemove", {buttons: 1, clientX: mapX(25),  clientY: mapY(2)}],
        ["mouseup",   {button:  0, clientX: mapX(25),  clientY: mapY(2)}],

        ["mousedown", {button:  0, clientX: mapX(8),    clientY: mapY(28)}],
        ["mouseup",   {button:  0, clientX: mapX(8),    clientY: mapY(28)}],

        ["mousedown", {button:  0, clientX: mapX(20),   clientY: mapY(28)}],
        ["mouseup",   {button:  0, clientX: mapX(20),   clientY: mapY(28)}],

        0,
        // Metal2
        ["mousedown", {button:  0, clientX: mapX(24), clientY: mapY(25)}],
        ["mousemove", {buttons: 1, clientX: mapX(24), clientY: mapY(28)}],
        ["mouseup",   {button:  0, clientX: mapX(24), clientY: mapY(28)}],

        ["mousedown", {button:  0, clientX: mapX(7),  clientY: mapY(12)}],
        ["mousemove", {buttons: 1, clientX: mapX(7),  clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(7),  clientY: mapY(25)}],

        ["mousedown", {button:  0, clientX: mapX(19), clientY: mapY(12)}],
        ["mousemove", {buttons: 1, clientX: mapX(19), clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(19), clientY: mapY(25)}],

 
        0,

        // Contacts
        ["mousedown", {button:  0, clientX: mapX(7),  clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(7),  clientY: mapY(25)}],

        ["mousedown", {button:  0, clientX: mapX(19), clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(19), clientY: mapY(25)}],

        ["mousedown", {button:  0, clientX: mapX(24),   clientY: mapY(12)}],
        ["mouseup",   {button:  0, clientX: mapX(24),   clientY: mapY(12)}],

        ["mousedown", {button:  0, clientX: mapX(24), clientY: mapY(28)}],
        ["mouseup",   {button:  0, clientX: mapX(24), clientY: mapY(28)}],

        ["mousedown", {button:  0, clientX: mapX(7),  clientY: mapY(12)}],
        ["mouseup",   {button:  0, clientX: mapX(7),  clientY: mapY(12)}],

        ["mousedown", {button:  0, clientX: mapX(19), clientY: mapY(12)}],
        ["mouseup",   {button:  0, clientX: mapX(19), clientY: mapY(12)}],

        1,

        // Place terminals
        function() {
            UI.diagram.inputs[1].x = 3;
            UI.diagram.inputs[1].y = 14;

            UI.diagram.outputs[0].x = 28;
            UI.diagram.outputs[0].y = 14;

            for(let ii = 1; ii < UI.diagram.inputs.length; ii++) {
                UI.diagram.inputs[ii].x = 3 + 6 * ii;
                UI.diagram.inputs[ii].y = 14;
            }
        },

        2,
        "0111111111111111",

        /* NOR-4 */
        1,

        // Place terminals
        function() {
            UI.diagram.outputs[0].x = 26;
            UI.diagram.outputs[0].y = 14;
        },

        2,
        "1000000000000000",

        /* NAND-4 */
        ["mousedown", {button:  2, clientX: mapX(7),   clientY: mapY(12)}],
        ["mousemove", {buttons: 2, clientX: mapX(7),   clientY: mapY(25)}],
        ["mouseup",   {button:  2, clientX: mapX(7),   clientY: mapY(25)}],

        ["mousedown", {button:  2, clientX: mapX(14),  clientY: mapY(13)}],
        ["mousemove", {buttons: 2, clientX: mapX(14),  clientY: mapY(28)}],
        ["mouseup",   {button:  2, clientX: mapX(14),  clientY: mapY(28)}],

        ["mousedown", {button:  2, clientX: mapX(19),   clientY: mapY(12)}],
        ["mousemove", {buttons: 2, clientX: mapX(19),   clientY: mapY(25)}],
        ["mouseup",   {button:  2, clientX: mapX(19),   clientY: mapY(25)}],

        ["mousedown", {button:  2, clientX: mapX(24),   clientY: mapY(6)}],
        ["mousemove", {buttons: 2, clientX: mapX(24),   clientY: mapY(11)}],
        ["mouseup",   {button:  2, clientX: mapX(24),   clientY: mapY(11)}],

        ["mousedown", {button:  2, clientX: mapX(24),   clientY: mapY(26)}],
        ["mousemove", {buttons: 2, clientX: mapX(24),   clientY: mapY(28)}],
        ["mouseup",   {button:  2, clientX: mapX(24),   clientY: mapY(28)}],

        // CONTACTS
        ["mousedown", {button:  0, clientX: mapX(6),   clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(6),   clientY: mapY(5)}],

        ["mousedown", {button:  0, clientX: mapX(6),   clientY: mapY(12)}],
        ["mouseup",   {button:  0, clientX: mapX(6),   clientY: mapY(12)}],

        ["mousedown", {button:  0, clientX: mapX(13),   clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(13),   clientY: mapY(5)}],

        ["mousedown", {button:  0, clientX: mapX(13),  clientY: mapY(2)}],
        ["mouseup",   {button:  0, clientX: mapX(13),  clientY: mapY(2)}],

        ["mousedown", {button:  0, clientX: mapX(18),   clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(18),   clientY: mapY(5)}],

        ["mousedown", {button:  0, clientX: mapX(18),   clientY: mapY(12)}],
        ["mouseup",   {button:  0, clientX: mapX(18),   clientY: mapY(12)}],

        ["mousedown", {button:  0, clientX: mapX(24),  clientY: mapY(2)}],
        ["mouseup",   {button:  0, clientX: mapX(24),  clientY: mapY(2)}],

        0, // PDIFF
        0, // NDIFF
        ["mousedown", {button:  0, clientX: mapX(2),  clientY: mapY(25)}],
        ["mousemove", {buttons: 1, clientX: mapX(24), clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(24), clientY: mapY(25)}],

        0, // POLY
        0, // METAL1
        ["mousedown", {button:  0, clientX: mapX(2),  clientY: mapY(28)}],
        ["mousemove", {buttons: 1, clientX: mapX(28), clientY: mapY(28)}],
        ["mouseup",   {button:  0, clientX: mapX(28), clientY: mapY(28)}],

        ["mousedown", {button:  0, clientX: mapX(6),   clientY: mapY(12)}],
        ["mouseup",   {button:  0, clientX: mapX(6),   clientY: mapY(12)}],

        ["mousedown", {button:  0, clientX: mapX(7),   clientY: mapY(12)}],
        ["mouseup",   {button:  0, clientX: mapX(7),   clientY: mapY(12)}],

        ["mousedown", {button:  0, clientX: mapX(19),  clientY: mapY(12)}],
        ["mouseup",   {button:  0, clientX: mapX(19),  clientY: mapY(12)}],

        0, // METAL2
        ["mousedown", {button:  0, clientX: mapX(6),   clientY: mapY(12)}],
        ["mousemove", {buttons: 1, clientX: mapX(6),   clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(6),   clientY: mapY(5)}],

        ["mousedown", {button:  0, clientX: mapX(18),   clientY: mapY(12)}],
        ["mousemove", {buttons: 1, clientX: mapX(18),   clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(18),   clientY: mapY(5)}],

        ["mousedown", {button:  0, clientX: mapX(13),   clientY: mapY(2)}],
        ["mousemove", {buttons: 1, clientX: mapX(13),   clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(13),   clientY: mapY(5)}],

        ["mousedown", {button:  0, clientX: mapX(24),   clientY: mapY(25)}],
        ["mousemove", {buttons: 1, clientX: mapX(24),   clientY: mapY(16)}],
        ["mouseup",   {button:  0, clientX: mapX(24),   clientY: mapY(16)}],

        ["mousedown", {button:  0, clientX: mapX(24),   clientY: mapY(2)}],
        ["mousemove", {buttons: 1, clientX: mapX(24),   clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(24),   clientY: mapY(5)}],

        0, // CONTACT
        0, // PDIFF
        0, // NDIFF
        0, // POLY
        0, // METAL1
 
        2,
        "1111111111111110",

        /** AND-4 **/
        1,

        // Place terminals
        function() {
            UI.diagram.outputs[0].x = 28;
            UI.diagram.outputs[0].y = 14;
        },

        2,
        "0000000000000001",

        /* ALWAYS FAIL TEST */
        2,
        "0000000000000011",
        
        /** VDD-Y-GND SHORT **/
        ["mousedown", {button:  2, clientX: mapX(1),   clientY: mapY(2)}],
        ["mousemove", {buttons: 2, clientX: mapX(29),  clientY: mapY(28)}],
        ["mouseup",   {button:  2, clientX: mapX(29),  clientY: mapY(28)}],
        
        // METAL
        ["mousedown", {button:  0, clientX: mapX(2),    clientY: mapY(2)}],
        ["mousemove", {buttons: 1, clientX: mapX(29),   clientY: mapY(2)}],
        ["mouseup",   {button:  0, clientX: mapX(29),   clientY: mapY(2)}],

        ["mousedown", {button:  0, clientX: mapX(2),    clientY: mapY(28)}],
        ["mousemove", {buttons: 1, clientX: mapX(29),   clientY: mapY(28)}],
        ["mouseup",   {button:  0, clientX: mapX(29),   clientY: mapY(28)}],

        ["mousedown", {button:  0, clientX: mapX(29),   clientY: mapY(2)}],
        ["mousemove", {buttons: 1, clientX: mapX(29),   clientY: mapY(28)}],
        ["mouseup",   {button:  0, clientX: mapX(29),   clientY: mapY(28)}],
        
        2,
        "XXXXXXXXXXXXXXXX",

        /** Various transistor shorts **/
        // METAL
        // VDD to PDIFF
        ["mousedown", {button:  0, clientX: mapX(2),   clientY: mapY(5)}],
        ["mousemove", {buttons: 1, clientX: mapX(2),   clientY: mapY(3)}],
        ["mouseup",   {button:  0, clientX: mapX(2),   clientY: mapY(3)}],

        // GND to NDIFF
        ["mousedown", {button:  0, clientX: mapX(2),   clientY: mapY(25)}],
        ["mousemove", {buttons: 1, clientX: mapX(2),   clientY: mapY(28)}],
        ["mouseup",   {button:  0, clientX: mapX(2),   clientY: mapY(28)}],
        
        0, // Metal2
        0,

        // CONTACTS
        ["mousedown", {button:  0, clientX: mapX(29), clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(29), clientY: mapY(5)}],

        ["mousedown", {button:  0, clientX: mapX(29), clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(29), clientY: mapY(25)}],


        ["mousedown", {button:  0, clientX: mapX(2),  clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(2),  clientY: mapY(5)}],

        ["mousedown", {button:  0, clientX: mapX(2),  clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(2),  clientY: mapY(25)}],

        0,
        
        // PDIFF
        ["mousedown", {button:  0, clientX: mapX(2),  clientY: mapY(5)}],
        ["mousemove", {buttons: 1, clientX: mapX(29), clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(29), clientY: mapY(5)}],
        0,

        // NDIFF
        ["mousedown", {button:  0, clientX: mapX(2),  clientY: mapY(25)}],
        ["mousemove", {buttons: 1, clientX: mapX(29), clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(29), clientY: mapY(25)}],

        0,

        // POLY
        ["mousedown", {button:  0, clientX: mapX(4),  clientY: mapY(4)}],
        ["mousemove", {buttons: 1, clientX: mapX(4),  clientY: mapY(26)}],
        ["mouseup",   {button:  0, clientX: mapX(4),  clientY: mapY(26)}],
        
        2,
        "XXXXXXXXXXXXXXXX",

        ["mousedown", {button:  2, clientX: mapX(2),  clientY: mapY(4)}],
        ["mouseup",   {button:  2, clientX: mapX(2),  clientY: mapY(4)}],
        
        2,
        "XXXXXXXXXXXXXXXX",

        0, // Metal1

        ["mousedown", {button:  0, clientX: mapX(2),  clientY: mapY(4)}],
        ["mouseup",   {button:  0, clientX: mapX(2),  clientY: mapY(4)}],

        ["mousedown", {button:  2, clientX: mapX(2),  clientY: mapY(26)}],
        ["mouseup",   {button:  2, clientX: mapX(2),  clientY: mapY(26)}],
        
        2,
        "XXXXXXXXXXXXXXXX",

        ["mousedown", {button:  0, clientX: mapX(2),  clientY: mapY(26)}],
        ["mouseup",   {button:  0, clientX: mapX(2),  clientY: mapY(26)}],

        ["mousedown", {button:  2, clientX: mapX(29), clientY: mapY(4)}],
        ["mouseup",   {button:  2, clientX: mapX(29), clientY: mapY(4)}],
        
        2,
        "XXXXXXXX00000000",

        ["mousedown", {button:  0, clientX: mapX(29), clientY: mapY(4)}],
        ["mouseup",   {button:  0, clientX: mapX(29), clientY: mapY(4)}],

        ["mousedown", {button:  2, clientX: mapX(29), clientY: mapY(26)}],
        ["mouseup",   {button:  2, clientX: mapX(29), clientY: mapY(26)}],
        
        2,
        "11111111XXXXXXXX",

        /* Various open circuits */
        ["mousedown", {button:  2, clientX: mapX(2),  clientY: mapY(26)}],
        ["mouseup",   {button:  2, clientX: mapX(2),  clientY: mapY(26)}],

        ["mousedown", {button:  2, clientX: mapX(29), clientY: mapY(4)}],
        ["mouseup",   {button:  2, clientX: mapX(29), clientY: mapY(4)}],
        
        2,
        "11111111ZZZZZZZZ",

        ["mousedown", {button:  0, clientX: mapX(2),  clientY: mapY(26)}],
        ["mouseup",   {button:  0, clientX: mapX(2),  clientY: mapY(26)}],

        ["mousedown", {button:  2, clientX: mapX(2),  clientY: mapY(4)}],
        ["mouseup",   {button:  2, clientX: mapX(2),  clientY: mapY(4)}],
        
        2,
        "ZZZZZZZZ00000000",

        ["mousedown", {button:  2, clientX: mapX(2),  clientY: mapY(26)}],
        ["mouseup",   {button:  2, clientX: mapX(2),  clientY: mapY(26)}],

        2,
        "ZZZZZZZZZZZZZZZZ",

        /* Direct Inputs */
        1,

        // Place terminal A
        function() {
            UI.diagram.inputs[0].x = 8;
            UI.diagram.inputs[0].y = 4;
        },

        2,
        "0000000011111111",

        1,

        // Place terminal B
        function() {
            UI.diagram.inputs[1].x = 20;
            UI.diagram.inputs[1].y = 4;
        },

        2,
        "0000XXXXXXXX1111",

        1,

        // Place terminal C
        function() {
            UI.diagram.inputs[2].x = 8;
            UI.diagram.inputs[2].y = 24;
        },

        2,
        "00XXXXXXXXXXXX11",

        1,

        // Place terminal D
        function() {
            UI.diagram.inputs[3].x = 20;
            UI.diagram.inputs[3].y = 24;
        },

        2,
        "0XXXXXXXXXXXXXX1",

        /** A & B & (C | D) **/
        1,
        function() {
            UI.diagram.inputs[0].x  = 2;
            UI.diagram.inputs[0].y  = 13;
            UI.diagram.inputs[1].x  = 6;
            UI.diagram.inputs[1].y  = 13;
            UI.diagram.inputs[2].x  = 16;
            UI.diagram.inputs[2].y  = 13;
            UI.diagram.inputs[3].x  = 20;
            UI.diagram.inputs[3].y  = 13;
            UI.diagram.outputs[0].x = 28;
            UI.diagram.outputs[0].y = 13;
        },

        ["mousedown", {button:  2, clientX: mapX(1),   clientY: mapY(1)}],
        ["mousemove", {buttons: 2, clientX: mapX(29),  clientY: mapY(29)}],
        ["mouseup",   {button:  2, clientX: mapX(29),  clientY: mapY(29)}],

        // VDD/GND rails.
        ["mousedown", {button:  0, clientX: mapX(1),  clientY: mapY(2)}],
        ["mousemove", {buttons: 1, clientX: mapX(29), clientY: mapY(2)}],
        ["mouseup",   {button:  0, clientX: mapX(29), clientY: mapY(2)}],

        ["mousedown", {button:  0, clientX: mapX(1),  clientY: mapY(28)}],
        ["mousemove", {buttons: 1, clientX: mapX(29), clientY: mapY(28)}],
        ["mouseup",   {button:  0, clientX: mapX(29), clientY: mapY(28)}],
        
        // Internal connections
        ["mousedown", {button:  0, clientX: mapX(1),  clientY: mapY(11)}],
        ["mousemove", {buttons: 1, clientX: mapX(28), clientY: mapY(11)}],
        ["mouseup",   {button:  0, clientX: mapX(28), clientY: mapY(11)}],

        ["mousedown", {button:  0, clientX: mapX(11), clientY: mapY(16)}],
        ["mousemove", {buttons: 1, clientX: mapX(25), clientY: mapY(16)}],
        ["mouseup",   {button:  0, clientX: mapX(25), clientY: mapY(16)}],

        ["mousedown", {button:  0, clientX: mapX(15), clientY: mapY(21)}],
        ["mousemove", {buttons: 1, clientX: mapX(23), clientY: mapY(21)}],
        ["mouseup",   {button:  0, clientX: mapX(23), clientY: mapY(21)}],

        0,
        // METAL2
        // VDD to PDIFF
        ["mousedown", {button:  0, clientX: mapX(5),  clientY: mapY(2)}],
        ["mousemove", {buttons: 1, clientX: mapX(5),  clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(5),  clientY: mapY(5)}],

        ["mousedown", {button:  0, clientX: mapX(13), clientY: mapY(2)}],
        ["mousemove", {buttons: 1, clientX: mapX(13), clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(13), clientY: mapY(5)}],

        ["mousedown", {button:  0, clientX: mapX(23), clientY: mapY(2)}],
        ["mousemove", {buttons: 1, clientX: mapX(23), clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(23), clientY: mapY(5)}],

        ["mousedown", {button:  0, clientX: mapX(25), clientY: mapY(2)}],
        ["mousemove", {buttons: 1, clientX: mapX(25), clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(25), clientY: mapY(5)}],

        // GND to NDIFF
        ["mousedown", {button:  0, clientX: mapX(1),  clientY: mapY(25)}],
        ["mousemove", {buttons: 1, clientX: mapX(1),  clientY: mapY(28)}],
        ["mouseup",   {button:  0, clientX: mapX(1),  clientY: mapY(28)}],

        ["mousedown", {button:  0, clientX: mapX(15), clientY: mapY(25)}],
        ["mousemove", {buttons: 1, clientX: mapX(15), clientY: mapY(28)}],
        ["mouseup",   {button:  0, clientX: mapX(15), clientY: mapY(28)}],

        ["mousedown", {button:  0, clientX: mapX(23), clientY: mapY(25)}],
        ["mousemove", {buttons: 1, clientX: mapX(23), clientY: mapY(28)}],
        ["mouseup",   {button:  0, clientX: mapX(23), clientY: mapY(28)}],

        ["mousedown", {button:  0, clientX: mapX(25), clientY: mapY(25)}],
        ["mousemove", {buttons: 1, clientX: mapX(25), clientY: mapY(28)}],
        ["mouseup",   {button:  0, clientX: mapX(25), clientY: mapY(28)}],

        // Internal connections
        ["mousedown", {button:  0, clientX: mapX(1),  clientY: mapY(5)}],
        ["mousemove", {buttons: 1, clientX: mapX(1),  clientY: mapY(11)}],
        ["mouseup",   {button:  0, clientX: mapX(1),  clientY: mapY(11)}],

        ["mousedown", {button:  0, clientX: mapX(9),  clientY: mapY(5)}],
        ["mousemove", {buttons: 1, clientX: mapX(9),  clientY: mapY(11)}],
        ["mouseup",   {button:  0, clientX: mapX(9),  clientY: mapY(11)}],

        ["mousedown", {button:  0, clientX: mapX(13), clientY: mapY(11)}],
        ["mousemove", {buttons: 1, clientX: mapX(13), clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(13), clientY: mapY(25)}],

        ["mousedown", {button:  0, clientX: mapX(15), clientY: mapY(5)}],
        ["mousemove", {buttons: 1, clientX: mapX(15), clientY: mapY(21)}],
        ["mouseup",   {button:  0, clientX: mapX(15), clientY: mapY(21)}],

        ["mousedown", {button:  0, clientX: mapX(19), clientY: mapY(21)}],
        ["mousemove", {buttons: 1, clientX: mapX(19), clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(19), clientY: mapY(25)}],

        ["mousedown", {button:  0, clientX: mapX(25), clientY: mapY(9)}],
        ["mousemove", {buttons: 1, clientX: mapX(25), clientY: mapY(21)}],
        ["mouseup",   {button:  0, clientX: mapX(25), clientY: mapY(21)}],

        ["mousedown", {button:  0, clientX: mapX(29), clientY: mapY(6)}],
        ["mousemove", {buttons: 1, clientX: mapX(29), clientY: mapY(24)}],
        ["mouseup",   {button:  0, clientX: mapX(29), clientY: mapY(24)}],

        0,
        // CONTACTS
        ["mousedown", {button:  0, clientX: mapX(1),  clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(1),  clientY: mapY(5)}],

        ["mousedown", {button:  0, clientX: mapX(1),  clientY: mapY(11)}],
        ["mouseup",   {button:  0, clientX: mapX(1),  clientY: mapY(11)}],

        ["mousedown", {button:  0, clientX: mapX(1),  clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(1),  clientY: mapY(25)}],

        ["mousedown", {button:  0, clientX: mapX(1),  clientY: mapY(28)}],
        ["mouseup",   {button:  0, clientX: mapX(1),  clientY: mapY(28)}],

        ["mousedown", {button:  0, clientX: mapX(5),  clientY: mapY(2)}],
        ["mouseup",   {button:  0, clientX: mapX(5),  clientY: mapY(2)}],

        ["mousedown", {button:  0, clientX: mapX(5),  clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(5),  clientY: mapY(5)}],

        ["mousedown", {button:  0, clientX: mapX(9),  clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(9),  clientY: mapY(5)}],

        ["mousedown", {button:  0, clientX: mapX(9),  clientY: mapY(11)}],
        ["mouseup",   {button:  0, clientX: mapX(9),  clientY: mapY(11)}],

        ["mousedown", {button:  0, clientX: mapX(11), clientY: mapY(16)}],
        ["mouseup",   {button:  0, clientX: mapX(11), clientY: mapY(16)}],

        ["mousedown", {button:  0, clientX: mapX(13), clientY: mapY(2)}],
        ["mouseup",   {button:  0, clientX: mapX(13), clientY: mapY(2)}],

        ["mousedown", {button:  0, clientX: mapX(13), clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(13), clientY: mapY(5)}],

        ["mousedown", {button:  0, clientX: mapX(13), clientY: mapY(11)}],
        ["mouseup",   {button:  0, clientX: mapX(13), clientY: mapY(11)}],

        ["mousedown", {button:  0, clientX: mapX(13), clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(13), clientY: mapY(25)}],

        ["mousedown", {button:  0, clientX: mapX(15), clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(15), clientY: mapY(5)}],

        ["mousedown", {button:  0, clientX: mapX(15), clientY: mapY(21)}],
        ["mouseup",   {button:  0, clientX: mapX(15), clientY: mapY(21)}],

        ["mousedown", {button:  0, clientX: mapX(15), clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(15), clientY: mapY(25)}],

        ["mousedown", {button:  0, clientX: mapX(15), clientY: mapY(28)}],
        ["mouseup",   {button:  0, clientX: mapX(15), clientY: mapY(28)}],
 
        ["mousedown", {button:  0, clientX: mapX(19), clientY: mapY(21)}],
        ["mouseup",   {button:  0, clientX: mapX(19), clientY: mapY(21)}],

        ["mousedown", {button:  0, clientX: mapX(19), clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(19), clientY: mapY(25)}],

        ["mousedown", {button:  0, clientX: mapX(23), clientY: mapY(2)}],
        ["mouseup",   {button:  0, clientX: mapX(23), clientY: mapY(2)}],

        ["mousedown", {button:  0, clientX: mapX(23), clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(23), clientY: mapY(5)}],

        ["mousedown", {button:  0, clientX: mapX(23), clientY: mapY(21)}],
        ["mouseup",   {button:  0, clientX: mapX(23), clientY: mapY(21)}],

        ["mousedown", {button:  0, clientX: mapX(23), clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(23), clientY: mapY(25)}],

        ["mousedown", {button:  0, clientX: mapX(23), clientY: mapY(28)}],
        ["mouseup",   {button:  0, clientX: mapX(23), clientY: mapY(28)}],

        ["mousedown", {button:  0, clientX: mapX(25), clientY: mapY(2)}],
        ["mouseup",   {button:  0, clientX: mapX(25), clientY: mapY(2)}],

        ["mousedown", {button:  0, clientX: mapX(25), clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(25), clientY: mapY(5)}],

        ["mousedown", {button:  0, clientX: mapX(25), clientY: mapY(9)}],
        ["mouseup",   {button:  0, clientX: mapX(25), clientY: mapY(9)}],

        ["mousedown", {button:  0, clientX: mapX(25), clientY: mapY(16)}],
        ["mouseup",   {button:  0, clientX: mapX(25), clientY: mapY(16)}],

        ["mousedown", {button:  0, clientX: mapX(25), clientY: mapY(21)}],
        ["mouseup",   {button:  0, clientX: mapX(25), clientY: mapY(21)}],

        ["mousedown", {button:  0, clientX: mapX(25), clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(25), clientY: mapY(25)}],

        ["mousedown", {button:  0, clientX: mapX(25), clientY: mapY(28)}],
        ["mouseup",   {button:  0, clientX: mapX(25), clientY: mapY(28)}],

        ["mousedown", {button:  0, clientX: mapX(27), clientY: mapY(2)}],
        ["mouseup",   {button:  0, clientX: mapX(27), clientY: mapY(2)}],

        ["mousedown", {button:  0, clientX: mapX(28), clientY: mapY(11)}],
        ["mouseup",   {button:  0, clientX: mapX(28), clientY: mapY(11)}],

        ["mousedown", {button:  0, clientX: mapX(27), clientY: mapY(28)}],
        ["mouseup",   {button:  0, clientX: mapX(27), clientY: mapY(28)}],

        ["mousedown", {button:  0, clientX: mapX(29), clientY: mapY(6)}],
        ["mouseup",   {button:  0, clientX: mapX(29), clientY: mapY(6)}],

        ["mousedown", {button:  0, clientX: mapX(29), clientY: mapY(24)}],
        ["mouseup",   {button:  0, clientX: mapX(29), clientY: mapY(24)}],

        0,

        // PDIFF
        ["mousedown", {button:  0, clientX: mapX(1),  clientY: mapY(5)}],
        ["mousemove", {buttons: 1, clientX: mapX(29), clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(29), clientY: mapY(5)}],

        ["mousedown", {button:  2, clientX: mapX(14), clientY: mapY(5)}],
        ["mouseup",   {button:  2, clientX: mapX(14), clientY: mapY(5)}],

        ["mousedown", {button:  2, clientX: mapX(24), clientY: mapY(5)}],
        ["mouseup",   {button:  2, clientX: mapX(24), clientY: mapY(5)}],

        ["mousedown", {button:  2, clientX: mapX(26), clientY: mapY(5)}],
        ["mouseup",   {button:  2, clientX: mapX(26), clientY: mapY(5)}],

        ["mousedown", {button:  0, clientX: mapX(27), clientY: mapY(2)}],
        ["mousemove", {buttons: 1, clientX: mapX(27), clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(27), clientY: mapY(5)}],

        ["mousedown", {button:  0, clientX: mapX(25), clientY: mapY(5)}],
        ["mousemove", {buttons: 1, clientX: mapX(25), clientY: mapY(9)}],
        ["mouseup",   {button:  0, clientX: mapX(25), clientY: mapY(9)}],

        ["mousedown", {button:  0, clientX: mapX(29), clientY: mapY(6)}],
        ["mouseup",   {button:  0, clientX: mapX(29), clientY: mapY(6)}],

        0,

        // NDIFF
        ["mousedown", {button:  0, clientX: mapX(1),  clientY: mapY(25)}],
        ["mousemove", {buttons: 1, clientX: mapX(29), clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(29), clientY: mapY(25)}],

        ["mousedown", {button:  2, clientX: mapX(14), clientY: mapY(25)}],
        ["mouseup",   {button:  2, clientX: mapX(14), clientY: mapY(25)}],

        ["mousedown", {button:  2, clientX: mapX(24), clientY: mapY(25)}],
        ["mouseup",   {button:  2, clientX: mapX(24), clientY: mapY(25)}],

        ["mousedown", {button:  2, clientX: mapX(26), clientY: mapY(25)}],
        ["mouseup",   {button:  2, clientX: mapX(26), clientY: mapY(25)}],

        ["mousedown", {button:  0, clientX: mapX(27), clientY: mapY(28)}],
        ["mousemove", {buttons: 1, clientX: mapX(27), clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(27), clientY: mapY(25)}],

        ["mousedown", {button:  0, clientX: mapX(25), clientY: mapY(25)}],
        ["mousemove", {buttons: 1, clientX: mapX(25), clientY: mapY(21)}],
        ["mouseup",   {button:  0, clientX: mapX(25), clientY: mapY(21)}],

        ["mousedown", {button:  0, clientX: mapX(29), clientY: mapY(24)}],
        ["mouseup",   {button:  0, clientX: mapX(29), clientY: mapY(24)}],

        0,
        // POLY and sweet relief
        ["mousedown", {button:  0, clientX: mapX(3),  clientY: mapY(4)}],
        ["mousemove", {buttons: 1, clientX: mapX(3),  clientY: mapY(26)}],
        ["mouseup",   {button:  0, clientX: mapX(3),  clientY: mapY(26)}],

        ["mousedown", {button:  0, clientX: mapX(7),  clientY: mapY(4)}],
        ["mousemove", {buttons: 1, clientX: mapX(7),  clientY: mapY(26)}],
        ["mouseup",   {button:  0, clientX: mapX(7),  clientY: mapY(26)}],

        ["mousedown", {button:  0, clientX: mapX(11), clientY: mapY(4)}],
        ["mousemove", {buttons: 1, clientX: mapX(11), clientY: mapY(26)}],
        ["mouseup",   {button:  0, clientX: mapX(11), clientY: mapY(26)}],

        ["mousedown", {button:  0, clientX: mapX(17), clientY: mapY(4)}],
        ["mousemove", {buttons: 1, clientX: mapX(17), clientY: mapY(26)}],
        ["mouseup",   {button:  0, clientX: mapX(17), clientY: mapY(26)}],

        ["mousedown", {button:  0, clientX: mapX(21), clientY: mapY(4)}],
        ["mousemove", {buttons: 1, clientX: mapX(21), clientY: mapY(26)}],
        ["mouseup",   {button:  0, clientX: mapX(21), clientY: mapY(26)}],

        ["mousedown", {button:  0, clientX: mapX(23), clientY: mapY(7)}],
        ["mousemove", {buttons: 1, clientX: mapX(23), clientY: mapY(23)}],
        ["mouseup",   {button:  0, clientX: mapX(23), clientY: mapY(23)}],

        ["mousedown", {button:  0, clientX: mapX(23), clientY: mapY(7)}],
        ["mousemove", {buttons: 1, clientX: mapX(26), clientY: mapY(7)}],
        ["mouseup",   {button:  0, clientX: mapX(26), clientY: mapY(7)}],

        ["mousedown", {button:  0, clientX: mapX(23), clientY: mapY(23)}],
        ["mousemove", {buttons: 1, clientX: mapX(26), clientY: mapY(23)}],
        ["mouseup",   {button:  0, clientX: mapX(26), clientY: mapY(23)}],

        ["mousedown", {button:  0, clientX: mapX(28), clientY: mapY(4)}],
        ["mousemove", {buttons: 1, clientX: mapX(28), clientY: mapY(26)}],
        ["mouseup",   {button:  0, clientX: mapX(28), clientY: mapY(26)}],

        2,
        "0000000000000111",

        0,

        /** AOI4 **/
        1,
        function() {
            UI.diagram.inputs[0].x  = 5;
            UI.diagram.inputs[0].y  = 8;
            UI.diagram.inputs[1].x  = 9;
            UI.diagram.inputs[1].y  = 8;
            UI.diagram.inputs[2].x  = 15;
            UI.diagram.inputs[2].y  = 8;
            UI.diagram.inputs[3].x  = 19;
            UI.diagram.inputs[3].y  = 8;
            UI.diagram.outputs[0].x = 3;
            UI.diagram.outputs[0].y = 21;
        },

        ["mousedown", {button:  2, clientX: mapX(1),   clientY: mapY(1)}],
        ["mousemove", {buttons: 2, clientX: mapX(29),  clientY: mapY(29)}],
        ["mouseup",   {button:  2, clientX: mapX(29),  clientY: mapY(29)}],

        // METAL1
        ["mousedown", {button:  0, clientX: mapX(1),  clientY: mapY(2)}],
        ["mousemove", {buttons: 1, clientX: mapX(29), clientY: mapY(2)}],
        ["mouseup",   {button:  0, clientX: mapX(29), clientY: mapY(2)}],

        ["mousedown", {button:  0, clientX: mapX(1),  clientY: mapY(28)}],
        ["mousemove", {buttons: 1, clientX: mapX(29), clientY: mapY(28)}],
        ["mouseup",   {button:  0, clientX: mapX(29), clientY: mapY(28)}],

        ["mousedown", {button:  0, clientX: mapX(4),  clientY: mapY(7)}],
        ["mousemove", {buttons: 1, clientX: mapX(12), clientY: mapY(7)}],
        ["mouseup",   {button:  0, clientX: mapX(12), clientY: mapY(7)}],

        ["mousedown", {button:  0, clientX: mapX(14), clientY: mapY(7)}],
        ["mousemove", {buttons: 1, clientX: mapX(22), clientY: mapY(7)}],
        ["mouseup",   {button:  0, clientX: mapX(22), clientY: mapY(7)}],

        ["mousedown", {button:  0, clientX: mapX(1),  clientY: mapY(14)}],
        ["mousemove", {buttons: 1, clientX: mapX(14), clientY: mapY(14)}],
        ["mouseup",   {button:  0, clientX: mapX(14), clientY: mapY(14)}],

        ["mousedown", {button:  0, clientX: mapX(8),  clientY: mapY(16)}],
        ["mousemove", {buttons: 1, clientX: mapX(29), clientY: mapY(16)}],
        ["mouseup",   {button:  0, clientX: mapX(29), clientY: mapY(16)}],

        ["mousedown", {button:  0, clientX: mapX(6),  clientY: mapY(21)}],
        ["mousemove", {buttons: 1, clientX: mapX(24), clientY: mapY(21)}],
        ["mouseup",   {button:  0, clientX: mapX(24), clientY: mapY(21)}],

        0,

        // METAL2
        ["mousedown", {button:  0, clientX: mapX(1),  clientY: mapY(14)}],
        ["mousemove", {buttons: 1, clientX: mapX(1),  clientY: mapY(28)}],
        ["mouseup",   {button:  0, clientX: mapX(1),  clientY: mapY(28)}],

        ["mousedown", {button:  0, clientX: mapX(4),  clientY: mapY(5)}],
        ["mousemove", {buttons: 1, clientX: mapX(4),  clientY: mapY(7)}],
        ["mouseup",   {button:  0, clientX: mapX(4),  clientY: mapY(7)}],

        ["mousedown", {button:  0, clientX: mapX(4),  clientY: mapY(11)}],
        ["mousemove", {buttons: 1, clientX: mapX(4),  clientY: mapY(14)}],
        ["mouseup",   {button:  0, clientX: mapX(4),  clientY: mapY(14)}],

        ["mousedown", {button:  0, clientX: mapX(4),  clientY: mapY(19)}],
        ["mousemove", {buttons: 1, clientX: mapX(4),  clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(4),  clientY: mapY(25)}],

        ["mousedown", {button:  0, clientX: mapX(8),  clientY: mapY(2)}],
        ["mousemove", {buttons: 1, clientX: mapX(8),  clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(8),  clientY: mapY(5)}],

        ["mousedown", {button:  0, clientX: mapX(8),  clientY: mapY(16)}],
        ["mousemove", {buttons: 1, clientX: mapX(8),  clientY: mapY(19)}],
        ["mouseup",   {button:  0, clientX: mapX(8),  clientY: mapY(19)}],

        ["mousedown", {button:  0, clientX: mapX(8),  clientY: mapY(25)}],
        ["mousemove", {buttons: 1, clientX: mapX(8),  clientY: mapY(28)}],
        ["mouseup",   {button:  0, clientX: mapX(8),  clientY: mapY(28)}],

        ["mousedown", {button:  0, clientX: mapX(10), clientY: mapY(19)}],
        ["mousemove", {buttons: 1, clientX: mapX(10), clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(10), clientY: mapY(25)}],

        ["mousedown", {button:  0, clientX: mapX(10), clientY: mapY(19)}],
        ["mousemove", {buttons: 1, clientX: mapX(10), clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(10), clientY: mapY(25)}],

        ["mousedown", {button:  0, clientX: mapX(12), clientY: mapY(5)}],
        ["mousemove", {buttons: 1, clientX: mapX(12), clientY: mapY(18)}],
        ["mouseup",   {button:  0, clientX: mapX(12), clientY: mapY(18)}],

        ["mousedown", {button:  0, clientX: mapX(14), clientY: mapY(5)}],
        ["mousemove", {buttons: 1, clientX: mapX(14), clientY: mapY(7)}],
        ["mouseup",   {button:  0, clientX: mapX(14), clientY: mapY(7)}],

        ["mousedown", {button:  0, clientX: mapX(14),  clientY: mapY(11)}],
        ["mousemove", {buttons: 1, clientX: mapX(14),  clientY: mapY(14)}],
        ["mouseup",   {button:  0, clientX: mapX(14),  clientY: mapY(14)}],

        ["mousedown", {button:  0, clientX: mapX(17),  clientY: mapY(16)}],
        ["mousemove", {buttons: 1, clientX: mapX(17),  clientY: mapY(19)}],
        ["mouseup",   {button:  0, clientX: mapX(17),  clientY: mapY(19)}],

        ["mousedown", {button:  0, clientX: mapX(18),  clientY: mapY(2)}],
        ["mousemove", {buttons: 1, clientX: mapX(18),  clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(18),  clientY: mapY(5)}],

        ["mousedown", {button:  0, clientX: mapX(22), clientY: mapY(5)}],
        ["mousemove", {buttons: 1, clientX: mapX(22), clientY: mapY(18)}],
        ["mouseup",   {button:  0, clientX: mapX(22), clientY: mapY(18)}],

        ["mousedown", {button:  0, clientX: mapX(24), clientY: mapY(19)}],
        ["mousemove", {buttons: 1, clientX: mapX(24), clientY: mapY(21)}],
        ["mouseup",   {button:  0, clientX: mapX(24), clientY: mapY(21)}],

        ["mousedown", {button:  0, clientX: mapX(25), clientY: mapY(25)}],
        ["mousemove", {buttons: 1, clientX: mapX(25), clientY: mapY(28)}],
        ["mouseup",   {button:  0, clientX: mapX(25), clientY: mapY(28)}],

        ["mousedown", {button:  0, clientX: mapX(29), clientY: mapY(2)}],
        ["mousemove", {buttons: 1, clientX: mapX(29), clientY: mapY(16)}],
        ["mouseup",   {button:  0, clientX: mapX(29), clientY: mapY(16)}],

        0,

        // CONTACTS
        ["mousedown", {button:  0, clientX: mapX(1), clientY: mapY(14)}],
        ["mouseup",   {button:  0, clientX: mapX(1), clientY: mapY(14)}],

        ["mousedown", {button:  0, clientX: mapX(1), clientY: mapY(28)}],
        ["mouseup",   {button:  0, clientX: mapX(1), clientY: mapY(28)}],

        ["mousedown", {button:  0, clientX: mapX(4), clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(4), clientY: mapY(5)}],

        ["mousedown", {button:  0, clientX: mapX(4), clientY: mapY(7)}],
        ["mouseup",   {button:  0, clientX: mapX(4), clientY: mapY(7)}],

        ["mousedown", {button:  0, clientX: mapX(4), clientY: mapY(11)}],
        ["mouseup",   {button:  0, clientX: mapX(4), clientY: mapY(11)}],

        ["mousedown", {button:  0, clientX: mapX(4), clientY: mapY(14)}],
        ["mouseup",   {button:  0, clientX: mapX(4), clientY: mapY(14)}],

        ["mousedown", {button:  0, clientX: mapX(4), clientY: mapY(19)}],
        ["mouseup",   {button:  0, clientX: mapX(4), clientY: mapY(19)}],

        ["mousedown", {button:  0, clientX: mapX(4), clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(4), clientY: mapY(25)}],

        ["mousedown", {button:  0, clientX: mapX(6), clientY: mapY(21)}],
        ["mouseup",   {button:  0, clientX: mapX(6), clientY: mapY(21)}],

        ["mousedown", {button:  0, clientX: mapX(8), clientY: mapY(2)}],
        ["mouseup",   {button:  0, clientX: mapX(8), clientY: mapY(2)}],

        ["mousedown", {button:  0, clientX: mapX(8), clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(8), clientY: mapY(5)}],

        ["mousedown", {button:  0, clientX: mapX(8), clientY: mapY(16)}],
        ["mouseup",   {button:  0, clientX: mapX(8), clientY: mapY(16)}],

        ["mousedown", {button:  0, clientX: mapX(8), clientY: mapY(19)}],
        ["mouseup",   {button:  0, clientX: mapX(8), clientY: mapY(19)}],

        ["mousedown", {button:  0, clientX: mapX(8), clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(8), clientY: mapY(25)}],

        ["mousedown", {button:  0, clientX: mapX(8), clientY: mapY(28)}],
        ["mouseup",   {button:  0, clientX: mapX(8), clientY: mapY(28)}],

        ["mousedown", {button:  0, clientX: mapX(10), clientY: mapY(19)}],
        ["mouseup",   {button:  0, clientX: mapX(10), clientY: mapY(19)}],

        ["mousedown", {button:  0, clientX: mapX(10), clientY: mapY(21)}],
        ["mouseup",   {button:  0, clientX: mapX(10), clientY: mapY(21)}],

        ["mousedown", {button:  0, clientX: mapX(10), clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(10), clientY: mapY(25)}],

        ["mousedown", {button:  0, clientX: mapX(12), clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(12), clientY: mapY(5)}],

        ["mousedown", {button:  0, clientX: mapX(12), clientY: mapY(7)}],
        ["mouseup",   {button:  0, clientX: mapX(12), clientY: mapY(7)}],

        ["mousedown", {button:  0, clientX: mapX(12), clientY: mapY(11)}],
        ["mouseup",   {button:  0, clientX: mapX(12), clientY: mapY(11)}],

        ["mousedown", {button:  0, clientX: mapX(12), clientY: mapY(18)}],
        ["mouseup",   {button:  0, clientX: mapX(12), clientY: mapY(18)}],

        ["mousedown", {button:  0, clientX: mapX(14), clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(14), clientY: mapY(5)}],

        ["mousedown", {button:  0, clientX: mapX(14), clientY: mapY(7)}],
        ["mouseup",   {button:  0, clientX: mapX(14), clientY: mapY(7)}],

        ["mousedown", {button:  0, clientX: mapX(14), clientY: mapY(7)}],
        ["mouseup",   {button:  0, clientX: mapX(14), clientY: mapY(7)}],

        ["mousedown", {button:  0, clientX: mapX(14), clientY: mapY(11)}],
        ["mouseup",   {button:  0, clientX: mapX(14), clientY: mapY(11)}],

        ["mousedown", {button:  0, clientX: mapX(14), clientY: mapY(14)}],
        ["mouseup",   {button:  0, clientX: mapX(14), clientY: mapY(14)}],

        ["mousedown", {button:  0, clientX: mapX(17), clientY: mapY(19)}],
        ["mouseup",   {button:  0, clientX: mapX(17), clientY: mapY(19)}],

        ["mousedown", {button:  0, clientX: mapX(17), clientY: mapY(16)}],
        ["mouseup",   {button:  0, clientX: mapX(17), clientY: mapY(16)}],

        ["mousedown", {button:  0, clientX: mapX(18), clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(18), clientY: mapY(5)}],

        ["mousedown", {button:  0, clientX: mapX(18), clientY: mapY(2)}],
        ["mouseup",   {button:  0, clientX: mapX(18), clientY: mapY(2)}],

        ["mousedown", {button:  0, clientX: mapX(22), clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(22), clientY: mapY(5)}],

        ["mousedown", {button:  0, clientX: mapX(22), clientY: mapY(7)}],
        ["mouseup",   {button:  0, clientX: mapX(22), clientY: mapY(7)}],

        ["mousedown", {button:  0, clientX: mapX(22), clientY: mapY(11)}],
        ["mouseup",   {button:  0, clientX: mapX(22), clientY: mapY(11)}],

        ["mousedown", {button:  0, clientX: mapX(22), clientY: mapY(18)}],
        ["mouseup",   {button:  0, clientX: mapX(22), clientY: mapY(18)}],

        ["mousedown", {button:  0, clientX: mapX(25), clientY: mapY(28)}],
        ["mouseup",   {button:  0, clientX: mapX(25), clientY: mapY(28)}],

        ["mousedown", {button:  0, clientX: mapX(25), clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(25), clientY: mapY(25)}],

        ["mousedown", {button:  0, clientX: mapX(24), clientY: mapY(21)}],
        ["mouseup",   {button:  0, clientX: mapX(24), clientY: mapY(21)}],

        ["mousedown", {button:  0, clientX: mapX(24), clientY: mapY(19)}],
        ["mouseup",   {button:  0, clientX: mapX(24), clientY: mapY(19)}],

        ["mousedown", {button:  0, clientX: mapX(29), clientY: mapY(16)}],
        ["mouseup",   {button:  0, clientX: mapX(29), clientY: mapY(16)}],

        ["mousedown", {button:  0, clientX: mapX(29), clientY: mapY(2)}],
        ["mouseup",   {button:  0, clientX: mapX(29), clientY: mapY(2)}],

        0,

        // PDIFF
        ["mousedown", {button:  0, clientX: mapX(4),  clientY: mapY(5)}],
        ["mousemove", {buttons: 1, clientX: mapX(12), clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(12), clientY: mapY(5)}],

        ["mousedown", {button:  0, clientX: mapX(4),  clientY: mapY(19)}],
        ["mousemove", {buttons: 1, clientX: mapX(8),  clientY: mapY(19)}],
        ["mouseup",   {button:  0, clientX: mapX(8),  clientY: mapY(19)}],

        ["mousedown", {button:  0, clientX: mapX(14), clientY: mapY(5)}],
        ["mousemove", {buttons: 1, clientX: mapX(22), clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(22), clientY: mapY(5)}],

        ["mousedown", {button:  0, clientX: mapX(10), clientY: mapY(19)}],
        ["mousemove", {buttons: 1, clientX: mapX(25), clientY: mapY(19)}],
        ["mouseup",   {button:  0, clientX: mapX(25), clientY: mapY(19)}],

        0,

        // NDIFF
        ["mousedown", {button:  0, clientX: mapX(4),  clientY: mapY(11)}],
        ["mousemove", {buttons: 1, clientX: mapX(12), clientY: mapY(11)}],
        ["mouseup",   {button:  0, clientX: mapX(12), clientY: mapY(11)}],

        ["mousedown", {button:  0, clientX: mapX(4),  clientY: mapY(25)}],
        ["mousemove", {buttons: 1, clientX: mapX(8),  clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(8),  clientY: mapY(25)}],

        ["mousedown", {button:  0, clientX: mapX(14), clientY: mapY(11)}],
        ["mousemove", {buttons: 1, clientX: mapX(22), clientY: mapY(11)}],
        ["mouseup",   {button:  0, clientX: mapX(22), clientY: mapY(11)}],

        ["mousedown", {button:  0, clientX: mapX(10), clientY: mapY(25)}],
        ["mousemove", {buttons: 1, clientX: mapX(25), clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(25), clientY: mapY(25)}],

        0,

        // POLY
        ["mousedown", {button:  0, clientX: mapX(6),  clientY: mapY(4)}],
        ["mousemove", {buttons: 1, clientX: mapX(6),  clientY: mapY(12)}],
        ["mouseup",   {button:  0, clientX: mapX(6),  clientY: mapY(12)}],

        ["mousedown", {button:  0, clientX: mapX(10), clientY: mapY(4)}],
        ["mousemove", {buttons: 1, clientX: mapX(10), clientY: mapY(12)}],
        ["mouseup",   {button:  0, clientX: mapX(10), clientY: mapY(12)}],

        ["mousedown", {button:  0, clientX: mapX(16), clientY: mapY(4)}],
        ["mousemove", {buttons: 1, clientX: mapX(16), clientY: mapY(12)}],
        ["mouseup",   {button:  0, clientX: mapX(16), clientY: mapY(12)}],

        ["mousedown", {button:  0, clientX: mapX(20), clientY: mapY(4)}],
        ["mousemove", {buttons: 1, clientX: mapX(20), clientY: mapY(12)}],
        ["mouseup",   {button:  0, clientX: mapX(20), clientY: mapY(12)}],

        ["mousedown", {button:  0, clientX: mapX(6),  clientY: mapY(18)}],
        ["mousemove", {buttons: 1, clientX: mapX(6),  clientY: mapY(26)}],
        ["mouseup",   {button:  0, clientX: mapX(6),  clientY: mapY(26)}],

        ["mousedown", {button:  0, clientX: mapX(12), clientY: mapY(18)}],
        ["mousemove", {buttons: 1, clientX: mapX(12), clientY: mapY(26)}],
        ["mouseup",   {button:  0, clientX: mapX(12), clientY: mapY(26)}],

        ["mousedown", {button:  0, clientX: mapX(22), clientY: mapY(18)}],
        ["mousemove", {buttons: 1, clientX: mapX(22), clientY: mapY(26)}],
        ["mouseup",   {button:  0, clientX: mapX(22), clientY: mapY(26)}],

        2,
        "1110111011100000",

        /** Between transistors **/
        1,
        function() {
            UI.diagram.outputs[0].x = 15;
            UI.diagram.outputs[0].y = 24;
        },

        2,
        "000100010001000Z",

        /** SR Latch **/
        1,
        function() {
            UI.diagram.inputs[1].x  = 19;
            UI.diagram.inputs[1].y  = 8;
            UI.diagram.inputs[2].x  = 25;
            UI.diagram.inputs[2].y  = 8;
            UI.diagram.inputs[3].x  = 25;
            UI.diagram.inputs[3].y  = 8;
            UI.diagram.outputs[0].x = 11;
            UI.diagram.outputs[0].y = 8;
            UI.diagram.gndCell.x    = 0;
            UI.diagram.gndCell.y    = 27;
        },

        ["mousedown", {button:  2, clientX: mapX(2),  clientY: mapY(15)}],
        ["mousemove", {buttons: 2, clientX: mapX(29), clientY: mapY(29)}],
        ["mouseup",   {button:  2, clientX: mapX(29), clientY: mapY(29)}],

        ["mousedown", {button:  2, clientX: mapX(23), clientY: mapY(1)}],
        ["mousemove", {buttons: 2, clientX: mapX(29), clientY: mapY(14)}],
        ["mouseup",   {button:  2, clientX: mapX(29), clientY: mapY(14)}],

        // POLY
        ["mousedown", {button:  0, clientX: mapX(10), clientY: mapY(4)}],
        ["mousemove", {buttons: 1, clientX: mapX(14), clientY: mapY(4)}],
        ["mouseup",   {button:  0, clientX: mapX(14), clientY: mapY(4)}],

        ["mousedown", {button:  0, clientX: mapX(14), clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(14), clientY: mapY(5)}],

        ["mousedown", {button:  0, clientX: mapX(12), clientY: mapY(10)}],
        ["mousemove", {buttons: 1, clientX: mapX(16), clientY: mapY(10)}],
        ["mouseup",   {button:  0, clientX: mapX(16), clientY: mapY(10)}],

        0,
        0,
        0,

        // CONTACT
        ["mousedown", {button:  0, clientX: mapX(12), clientY: mapY(10)}],
        ["mouseup",   {button:  0, clientX: mapX(12), clientY: mapY(10)}],

        2,
        "111111110000ZZZZ",

        /** SR Latch Q' **/
        1,
        function() {
            UI.diagram.outputs[0].x = 13;
            UI.diagram.outputs[0].y = 6;
        },

        2,
        "111100001111ZZZZ",

        /** D FLIP FLOP **/
        // Automatically captured input
        // Clear the canvas
        ["mousedown", {button:  2, clientX: mapX(1),   clientY: mapY(1)}],
        ["mousemove", {buttons: 2, clientX: mapX(29),  clientY: mapY(29)}],
        ["mouseup",   {button:  2, clientX: mapX(29),  clientY: mapY(29)}],

        1,
        function() {
            UI.diagram.inputs[0].x  = 26;
            UI.diagram.inputs[0].y  = 6;
            UI.diagram.inputs[1].x  = 7;
            UI.diagram.inputs[1].y  = 6;
            UI.diagram.inputs[2].x  = 28;
            UI.diagram.inputs[2].y  = 28;
            UI.diagram.inputs[3].x  = 28;
            UI.diagram.inputs[3].y  = 28;
            UI.diagram.outputs[0].x = 12;
            UI.diagram.outputs[0].y = 16;
            UI.diagram.gndCell.x    = 0;
            UI.diagram.gndCell.y    = 24;
        },

        ["mousedown",{"button":0,"clientX":mapX(2),"clientY":mapY(5)}],
        ["mouseup",{"button":0,"clientX":mapX(2),"clientY":mapY(5)}],
        ["mousedown",{"button":0,"clientX":mapX(2),"clientY":mapY(6)}],
        ["mouseup",{"button":0,"clientX":mapX(2),"clientY":mapY(6)}],
        ["mousedown",{"button":0,"clientX":mapX(1),"clientY":mapY(10)}],
        ["mouseup",{"button":0,"clientX":mapX(1),"clientY":mapY(10)}],
        ["mousedown",{"button":0,"clientX":mapX(1),"clientY":mapY(13)}],
        ["mouseup",{"button":0,"clientX":mapX(1),"clientY":mapY(13)}],
        ["mousedown",{"button":0,"clientX":mapX(4),"clientY":mapY(9)}],
        ["mouseup",{"button":0,"clientX":mapX(4),"clientY":mapY(9)}],
        ["mousedown",{"button":0,"clientX":mapX(6),"clientY":mapY(5)}],
        ["mouseup",{"button":0,"clientX":mapX(6),"clientY":mapY(5)}],
        ["mousedown",{"button":0,"clientX":mapX(10),"clientY":mapY(5)}],
        ["mouseup",{"button":0,"clientX":mapX(10),"clientY":mapY(5)}],
        ["mousedown",{"button":0,"clientX":mapX(10),"clientY":mapY(6)}],
        ["mouseup",{"button":0,"clientX":mapX(10),"clientY":mapY(6)}],
        ["mousedown",{"button":0,"clientX":mapX(10),"clientY":mapY(10)}],
        ["mouseup",{"button":0,"clientX":mapX(10),"clientY":mapY(10)}],
        ["mousedown",{"button":0,"clientX":mapX(8),"clientY":mapY(11)}],
        ["mouseup",{"button":0,"clientX":mapX(8),"clientY":mapY(11)}],
        ["mousedown",{"button":0,"clientX":mapX(6),"clientY":mapY(2)}],
        ["mouseup",{"button":0,"clientX":mapX(6),"clientY":mapY(2)}],
        ["mousedown",{"button":0,"clientX":mapX(13),"clientY":mapY(5)}],
        ["mouseup",{"button":0,"clientX":mapX(13),"clientY":mapY(5)}],
        ["mousedown",{"button":0,"clientX":mapX(13),"clientY":mapY(6)}],
        ["mouseup",{"button":0,"clientX":mapX(13),"clientY":mapY(6)}],
        ["mousedown",{"button":0,"clientX":mapX(13),"clientY":mapY(10)}],
        ["mouseup",{"button":0,"clientX":mapX(13),"clientY":mapY(10)}],
        ["mousedown",{"button":0,"clientX":mapX(15),"clientY":mapY(11)}],
        ["mouseup",{"button":0,"clientX":mapX(15),"clientY":mapY(11)}],
        ["mousedown",{"button":0,"clientX":mapX(17),"clientY":mapY(5)}],
        ["mouseup",{"button":0,"clientX":mapX(17),"clientY":mapY(5)}],
        ["mousedown",{"button":0,"clientX":mapX(17),"clientY":mapY(2)}],
        ["mouseup",{"button":0,"clientX":mapX(17),"clientY":mapY(2)}],
        ["mousedown",{"button":0,"clientX":mapX(19),"clientY":mapY(4)}],
        ["mouseup",{"button":0,"clientX":mapX(19),"clientY":mapY(4)}],
        ["mousedown",{"button":0,"clientX":mapX(22),"clientY":mapY(5)}],
        ["mouseup",{"button":0,"clientX":mapX(22),"clientY":mapY(5)}],
        ["mousedown",{"button":0,"clientX":mapX(22),"clientY":mapY(6)}],
        ["mouseup",{"button":0,"clientX":mapX(22),"clientY":mapY(6)}],
        ["mousedown",{"button":0,"clientX":mapX(22),"clientY":mapY(10)}],
        ["mouseup",{"button":0,"clientX":mapX(22),"clientY":mapY(10)}],
        ["mousedown",{"button":0,"clientX":mapX(22),"clientY":mapY(13)}],
        ["mouseup",{"button":0,"clientX":mapX(22),"clientY":mapY(13)}],
        ["mousedown",{"button":0,"clientX":mapX(17),"clientY":mapY(13)}],
        ["mousemove",{"buttons":1,"clientX":mapX(17),"clientY":mapY(15)}],
        ["mouseup",{"button":0,"clientX":mapX(17),"clientY":mapY(15)}],
        ["mousedown",{"button":2,"clientX":mapX(17),"clientY":mapY(14)}],
        ["mousemove",{"buttons":2,"clientX":mapX(17),"clientY":mapY(13)}],
        ["mouseup",{"button":2,"clientX":mapX(17),"clientY":mapY(13)}],
        ["mousedown",{"button":0,"clientX":mapX(25),"clientY":mapY(10)}],
        ["mouseup",{"button":0,"clientX":mapX(25),"clientY":mapY(10)}],
        ["mousedown",{"button":0,"clientX":mapX(25),"clientY":mapY(9)}],
        ["mouseup",{"button":0,"clientX":mapX(25),"clientY":mapY(9)}],
        ["mousedown",{"button":0,"clientX":mapX(25),"clientY":mapY(5)}],
        ["mouseup",{"button":0,"clientX":mapX(25),"clientY":mapY(5)}],
        ["mousedown",{"button":0,"clientX":mapX(27),"clientY":mapY(4)}],
        ["mouseup",{"button":0,"clientX":mapX(27),"clientY":mapY(4)}],
        ["mousedown",{"button":0,"clientX":mapX(27),"clientY":mapY(7)}],
        ["mouseup",{"button":0,"clientX":mapX(27),"clientY":mapY(7)}],
        ["mousedown",{"button":0,"clientX":mapX(29),"clientY":mapY(5)}],
        ["mouseup",{"button":0,"clientX":mapX(29),"clientY":mapY(5)}],
        ["mousedown",{"button":0,"clientX":mapX(29),"clientY":mapY(2)}],
        ["mouseup",{"button":0,"clientX":mapX(29),"clientY":mapY(2)}],
        ["mousedown",{"button":0,"clientX":mapX(29),"clientY":mapY(10)}],
        ["mouseup",{"button":0,"clientX":mapX(29),"clientY":mapY(10)}],
        ["mousedown",{"button":0,"clientX":mapX(29),"clientY":mapY(13)}],
        ["mouseup",{"button":0,"clientX":mapX(29),"clientY":mapY(13)}],
        ["mousedown",{"button":0,"clientX":mapX(6),"clientY":mapY(15)}],
        ["mouseup",{"button":0,"clientX":mapX(6),"clientY":mapY(15)}],
        ["mousedown",{"button":0,"clientX":mapX(1),"clientY":mapY(18)}],
        ["mouseup",{"button":0,"clientX":mapX(1),"clientY":mapY(18)}],
        ["mousedown",{"button":0,"clientX":mapX(1),"clientY":mapY(19)}],
        ["mouseup",{"button":0,"clientX":mapX(1),"clientY":mapY(19)}],
        ["mousedown",{"button":0,"clientX":mapX(6),"clientY":mapY(18)}],
        ["mouseup",{"button":0,"clientX":mapX(6),"clientY":mapY(18)}],
        ["mousedown",{"button":0,"clientX":mapX(10),"clientY":mapY(18)}],
        ["mouseup",{"button":0,"clientX":mapX(10),"clientY":mapY(18)}],
        ["mousedown",{"button":0,"clientX":mapX(10),"clientY":mapY(19)}],
        ["mouseup",{"button":0,"clientX":mapX(10),"clientY":mapY(19)}],
        ["mousedown",{"button":0,"clientX":mapX(13),"clientY":mapY(18)}],
        ["mouseup",{"button":0,"clientX":mapX(13),"clientY":mapY(18)}],
        ["mousedown",{"button":0,"clientX":mapX(13),"clientY":mapY(19)}],
        ["mouseup",{"button":0,"clientX":mapX(13),"clientY":mapY(19)}],
        ["mousedown",{"button":0,"clientX":mapX(17),"clientY":mapY(18)}],
        ["mouseup",{"button":0,"clientX":mapX(17),"clientY":mapY(18)}],
        ["mousedown",{"button":0,"clientX":mapX(22),"clientY":mapY(18)}],
        ["mouseup",{"button":0,"clientX":mapX(22),"clientY":mapY(18)}],
        ["mousedown",{"button":0,"clientX":mapX(22),"clientY":mapY(19)}],
        ["mouseup",{"button":0,"clientX":mapX(22),"clientY":mapY(19)}],
        ["mousedown",{"button":0,"clientX":mapX(22),"clientY":mapY(23)}],
        ["mouseup",{"button":0,"clientX":mapX(22),"clientY":mapY(23)}],
        ["mousedown",{"button":0,"clientX":mapX(22),"clientY":mapY(26)}],
        ["mouseup",{"button":0,"clientX":mapX(22),"clientY":mapY(26)}],
        ["mousedown",{"button":0,"clientX":mapX(29),"clientY":mapY(26)}],
        ["mouseup",{"button":0,"clientX":mapX(29),"clientY":mapY(26)}],
        ["mousedown",{"button":0,"clientX":mapX(13),"clientY":mapY(23)}],
        ["mouseup",{"button":0,"clientX":mapX(13),"clientY":mapY(23)}],
        ["mousedown",{"button":0,"clientX":mapX(13),"clientY":mapY(24)}],
        ["mouseup",{"button":0,"clientX":mapX(13),"clientY":mapY(24)}],
        ["mousedown",{"button":0,"clientX":mapX(10),"clientY":mapY(22)}],
        ["mouseup",{"button":0,"clientX":mapX(10),"clientY":mapY(22)}],
        ["mousedown",{"button":0,"clientX":mapX(10),"clientY":mapY(23)}],
        ["mouseup",{"button":0,"clientX":mapX(10),"clientY":mapY(23)}],
        ["mousedown",{"button":0,"clientX":mapX(4),"clientY":mapY(24)}],
        ["mouseup",{"button":0,"clientX":mapX(4),"clientY":mapY(24)}],
        ["mousedown",{"button":0,"clientX":mapX(1),"clientY":mapY(23)}],
        ["mouseup",{"button":0,"clientX":mapX(1),"clientY":mapY(23)}],
        ["mousedown",{"button":0,"clientX":mapX(1),"clientY":mapY(26)}],
        ["mouseup",{"button":0,"clientX":mapX(1),"clientY":mapY(26)}],
        ["mousedown",{"button":2,"clientX":mapX(3),"clientY":mapY(26)}],
        ["mouseup",{"button":2,"clientX":mapX(3),"clientY":mapY(26)}],
        ["mousedown",{"button":0,"clientX":mapX(10),"clientY":mapY(5)}],
        ["mousemove",{"buttons":1,"clientX":mapX(1),"clientY":mapY(5)}],
        ["mouseup",{"button":0,"clientX":mapX(1),"clientY":mapY(5)}],
        ["mousedown",{"button":0,"clientX":mapX(13),"clientY":mapY(5)}],
        ["mousemove",{"buttons":1,"clientX":mapX(22),"clientY":mapY(5)}],
        ["mouseup",{"button":0,"clientX":mapX(22),"clientY":mapY(5)}],
        ["mousedown",{"button":0,"clientX":mapX(25),"clientY":mapY(5)}],
        ["mousemove",{"buttons":1,"clientX":mapX(29),"clientY":mapY(5)}],
        ["mouseup",{"button":0,"clientX":mapX(29),"clientY":mapY(5)}],
        ["mousedown",{"button":0,"clientX":mapX(1),"clientY":mapY(18)}],
        ["mousemove",{"buttons":1,"clientX":mapX(10),"clientY":mapY(18)}],
        ["mouseup",{"button":0,"clientX":mapX(10),"clientY":mapY(18)}],
        ["mousedown",{"button":0,"clientX":mapX(13),"clientY":mapY(18)}],
        ["mousemove",{"buttons":1,"clientX":mapX(22),"clientY":mapY(18)}],
        ["mouseup",{"button":0,"clientX":mapX(22),"clientY":mapY(18)}],
        ["mousedown",{"button":2,"clientX":mapX(21),"clientY":mapY(16)}],
        ["mouseup",{"button":2,"clientX":mapX(21),"clientY":mapY(16)}],
        ["mousedown",{"button":0,"clientX":mapX(10),"clientY":mapY(10)}],
        ["mousemove",{"buttons":1,"clientX":mapX(1),"clientY":mapY(10)}],
        ["mouseup",{"button":0,"clientX":mapX(1),"clientY":mapY(10)}],
        ["mousedown",{"button":0,"clientX":mapX(13),"clientY":mapY(10)}],
        ["mousemove",{"buttons":1,"clientX":mapX(22),"clientY":mapY(10)}],
        ["mouseup",{"button":0,"clientX":mapX(22),"clientY":mapY(10)}],
        ["mousedown",{"button":0,"clientX":mapX(25),"clientY":mapY(10)}],
        ["mousemove",{"buttons":1,"clientX":mapX(29),"clientY":mapY(10)}],
        ["mouseup",{"button":0,"clientX":mapX(29),"clientY":mapY(10)}],
        ["mousedown",{"button":0,"clientX":mapX(13),"clientY":mapY(23)}],
        ["mousemove",{"buttons":1,"clientX":mapX(22),"clientY":mapY(23)}],
        ["mouseup",{"button":0,"clientX":mapX(22),"clientY":mapY(23)}],
        ["mousedown",{"button":0,"clientX":mapX(10),"clientY":mapY(23)}],
        ["mousemove",{"buttons":1,"clientX":mapX(1),"clientY":mapY(23)}],
        ["mouseup",{"button":0,"clientX":mapX(1),"clientY":mapY(23)}],
        ["mousedown",{"button":2,"clientX":mapX(6),"clientY":mapY(21)}],
        ["mouseup",{"button":2,"clientX":mapX(6),"clientY":mapY(21)}],
        ["mousedown",{"button":0,"clientX":mapX(4),"clientY":mapY(11)}],
        ["mousemove",{"buttons":1,"clientX":mapX(4),"clientY":mapY(4)}],
        ["mouseup",{"button":0,"clientX":mapX(4),"clientY":mapY(4)}],
        ["mousedown",{"button":0,"clientX":mapX(8),"clientY":mapY(4)}],
        ["mousemove",{"buttons":1,"clientX":mapX(8),"clientY":mapY(11)}],
        ["mouseup",{"button":0,"clientX":mapX(8),"clientY":mapY(11)}],
        ["mousedown",{"button":0,"clientX":mapX(15),"clientY":mapY(4)}],
        ["mousemove",{"buttons":1,"clientX":mapX(15),"clientY":mapY(11)}],
        ["mouseup",{"button":0,"clientX":mapX(15),"clientY":mapY(11)}],
        ["mousedown",{"button":0,"clientX":mapX(19),"clientY":mapY(4)}],
        ["mousemove",{"buttons":1,"clientX":mapX(19),"clientY":mapY(11)}],
        ["mouseup",{"button":0,"clientX":mapX(19),"clientY":mapY(11)}],
        ["mousedown",{"button":0,"clientX":mapX(27),"clientY":mapY(4)}],
        ["mousemove",{"buttons":1,"clientX":mapX(27),"clientY":mapY(11)}],
        ["mouseup",{"button":0,"clientX":mapX(27),"clientY":mapY(11)}],
        ["mousedown",{"button":0,"clientX":mapX(8),"clientY":mapY(24)}],
        ["mousemove",{"buttons":1,"clientX":mapX(8),"clientY":mapY(14)}],
        ["mouseup",{"button":0,"clientX":mapX(8),"clientY":mapY(14)}],
        ["mousedown",{"button":0,"clientX":mapX(8),"clientY":mapY(14)}],
        ["mousemove",{"buttons":1,"clientX":mapX(10),"clientY":mapY(14)}],
        ["mouseup",{"button":0,"clientX":mapX(10),"clientY":mapY(14)}],
        ["mousedown",{"button":0,"clientX":mapX(10),"clientY":mapY(14)}],
        ["mousemove",{"buttons":1,"clientX":mapX(10),"clientY":mapY(10)}],
        ["mouseup",{"button":0,"clientX":mapX(10),"clientY":mapY(10)}],
        ["mousedown",{"button":0,"clientX":mapX(15),"clientY":mapY(24)}],
        ["mousemove",{"buttons":1,"clientX":mapX(15),"clientY":mapY(14)}],
        ["mouseup",{"button":0,"clientX":mapX(15),"clientY":mapY(14)}],
        ["mousedown",{"button":0,"clientX":mapX(15),"clientY":mapY(14)}],
        ["mousemove",{"buttons":1,"clientX":mapX(13),"clientY":mapY(14)}],
        ["mouseup",{"button":0,"clientX":mapX(13),"clientY":mapY(14)}],
        ["mousedown",{"button":0,"clientX":mapX(13),"clientY":mapY(14)}],
        ["mousemove",{"buttons":1,"clientX":mapX(13),"clientY":mapY(10)}],
        ["mouseup",{"button":0,"clientX":mapX(13),"clientY":mapY(10)}],
        ["mousedown",{"button":0,"clientX":mapX(20),"clientY":mapY(17)}],
        ["mousemove",{"buttons":1,"clientX":mapX(20),"clientY":mapY(24)}],
        ["mouseup",{"button":0,"clientX":mapX(20),"clientY":mapY(24)}],
        ["mousedown",{"button":2,"clientX":mapX(26),"clientY":mapY(20)}],
        ["mouseup",{"button":2,"clientX":mapX(26),"clientY":mapY(20)}],
        ["mousedown",{"button":0,"clientX":mapX(1),"clientY":mapY(2)}],
        ["mousemove",{"buttons":1,"clientX":mapX(29),"clientY":mapY(2)}],
        ["mouseup",{"button":0,"clientX":mapX(29),"clientY":mapY(2)}],
        ["mousedown",{"button":0,"clientX":mapX(19),"clientY":mapY(4)}],
        ["mousemove",{"buttons":1,"clientX":mapX(27),"clientY":mapY(4)}],
        ["mouseup",{"button":0,"clientX":mapX(27),"clientY":mapY(4)}],
        ["mousedown",{"button":0,"clientX":mapX(2),"clientY":mapY(6)}],
        ["mousemove",{"buttons":1,"clientX":mapX(10),"clientY":mapY(6)}],
        ["mouseup",{"button":0,"clientX":mapX(10),"clientY":mapY(6)}],
        ["mousedown",{"button":0,"clientX":mapX(4),"clientY":mapY(9)}],
        ["mousemove",{"buttons":1,"clientX":mapX(25),"clientY":mapY(9)}],
        ["mouseup",{"button":0,"clientX":mapX(25),"clientY":mapY(9)}],
        ["mousedown",{"button":0,"clientX":mapX(22),"clientY":mapY(6)}],
        ["mousemove",{"buttons":1,"clientX":mapX(13),"clientY":mapY(6)}],
        ["mouseup",{"button":0,"clientX":mapX(13),"clientY":mapY(6)}],
        ["mousedown",{"button":0,"clientX":mapX(8),"clientY":mapY(11)}],
        ["mousemove",{"buttons":1,"clientX":mapX(15),"clientY":mapY(11)}],
        ["mouseup",{"button":0,"clientX":mapX(15),"clientY":mapY(11)}],
        ["mousedown",{"button":0,"clientX":mapX(1),"clientY":mapY(13)}],
        ["mousemove",{"buttons":1,"clientX":mapX(29),"clientY":mapY(13)}],
        ["mouseup",{"button":0,"clientX":mapX(29),"clientY":mapY(13)}],
        ["mousedown",{"button":0,"clientX":mapX(17),"clientY":mapY(15)}],
        ["mousemove",{"buttons":1,"clientX":mapX(0),"clientY":mapY(15)}],
        ["mouseup",{"button":0,"clientX":mapX(0),"clientY":mapY(15)}],
        ["mousedown",{"button":0,"clientX":mapX(1),"clientY":mapY(15)}],
        ["mousemove",{"buttons":1,"clientX":mapX(17),"clientY":mapY(15)}],
        ["mouseup",{"button":0,"clientX":mapX(17),"clientY":mapY(15)}],
        ["mousedown",{"button":0,"clientX":mapX(10),"clientY":mapY(19)}],
        ["mousemove",{"buttons":1,"clientX":mapX(1),"clientY":mapY(19)}],
        ["mouseup",{"button":0,"clientX":mapX(1),"clientY":mapY(19)}],
        ["mousedown",{"button":0,"clientX":mapX(13),"clientY":mapY(19)}],
        ["mousemove",{"buttons":1,"clientX":mapX(22),"clientY":mapY(19)}],
        ["mouseup",{"button":0,"clientX":mapX(22),"clientY":mapY(19)}],
        ["mousedown",{"button":0,"clientX":mapX(10),"clientY":mapY(22)}],
        ["mousemove",{"buttons":1,"clientX":mapX(20),"clientY":mapY(22)}],
        ["mouseup",{"button":0,"clientX":mapX(20),"clientY":mapY(22)}],
        ["mousedown",{"button":0,"clientX":mapX(1),"clientY":mapY(26)}],
        ["mousemove",{"buttons":1,"clientX":mapX(29),"clientY":mapY(26)}],
        ["mouseup",{"button":0,"clientX":mapX(29),"clientY":mapY(26)}],
        ["mousedown",{"button":2,"clientX":mapX(27),"clientY":mapY(23)}],
        ["mouseup",{"button":2,"clientX":mapX(27),"clientY":mapY(23)}],
        ["mousedown",{"button":0,"clientX":mapX(1),"clientY":mapY(23)}],
        ["mousemove",{"buttons":1,"clientX":mapX(1),"clientY":mapY(26)}],
        ["mouseup",{"button":0,"clientX":mapX(1),"clientY":mapY(26)}],
        ["mousedown",{"button":0,"clientX":mapX(1),"clientY":mapY(18)}],
        ["mousemove",{"buttons":1,"clientX":mapX(1),"clientY":mapY(19)}],
        ["mouseup",{"button":0,"clientX":mapX(1),"clientY":mapY(19)}],
        ["mousedown",{"button":0,"clientX":mapX(10),"clientY":mapY(18)}],
        ["mousemove",{"buttons":1,"clientX":mapX(10),"clientY":mapY(23)}],
        ["mouseup",{"button":0,"clientX":mapX(10),"clientY":mapY(23)}],
        ["mousedown",{"button":0,"clientX":mapX(13),"clientY":mapY(17)}],
        ["mousemove",{"buttons":1,"clientX":mapX(13),"clientY":mapY(24)}],
        ["mouseup",{"button":0,"clientX":mapX(13),"clientY":mapY(24)}],
        ["mousedown",{"button":0,"clientX":mapX(22),"clientY":mapY(18)}],
        ["mousemove",{"buttons":1,"clientX":mapX(22),"clientY":mapY(19)}],
        ["mouseup",{"button":0,"clientX":mapX(22),"clientY":mapY(19)}],
        ["mousedown",{"button":0,"clientX":mapX(22),"clientY":mapY(23)}],
        ["mousemove",{"buttons":1,"clientX":mapX(22),"clientY":mapY(26)}],
        ["mouseup",{"button":0,"clientX":mapX(22),"clientY":mapY(26)}],
        ["mousedown",{"button":0,"clientX":mapX(6),"clientY":mapY(15)}],
        ["mousemove",{"buttons":1,"clientX":mapX(6),"clientY":mapY(18)}],
        ["mouseup",{"button":0,"clientX":mapX(6),"clientY":mapY(18)}],
        ["mousedown",{"button":0,"clientX":mapX(29),"clientY":mapY(10)}],
        ["mousemove",{"buttons":1,"clientX":mapX(29),"clientY":mapY(26)}],
        ["mouseup",{"button":0,"clientX":mapX(29),"clientY":mapY(26)}],
        ["mousedown",{"button":0,"clientX":mapX(22),"clientY":mapY(10)}],
        ["mousemove",{"buttons":1,"clientX":mapX(22),"clientY":mapY(13)}],
        ["mouseup",{"button":0,"clientX":mapX(22),"clientY":mapY(13)}],
        ["mousedown",{"button":0,"clientX":mapX(1),"clientY":mapY(10)}],
        ["mousemove",{"buttons":1,"clientX":mapX(1),"clientY":mapY(13)}],
        ["mouseup",{"button":0,"clientX":mapX(1),"clientY":mapY(13)}],
        ["mousedown",{"button":0,"clientX":mapX(10),"clientY":mapY(5)}],
        ["mousemove",{"buttons":1,"clientX":mapX(10),"clientY":mapY(10)}],
        ["mouseup",{"button":0,"clientX":mapX(10),"clientY":mapY(10)}],
        ["mousedown",{"button":0,"clientX":mapX(13),"clientY":mapY(5)}],
        ["mousemove",{"buttons":1,"clientX":mapX(13),"clientY":mapY(10)}],
        ["mouseup",{"button":0,"clientX":mapX(13),"clientY":mapY(10)}],
        ["mousedown",{"button":0,"clientX":mapX(6),"clientY":mapY(2)}],
        ["mousemove",{"buttons":1,"clientX":mapX(6),"clientY":mapY(5)}],
        ["mouseup",{"button":0,"clientX":mapX(6),"clientY":mapY(5)}],
        ["mousedown",{"button":0,"clientX":mapX(2),"clientY":mapY(5)}],
        ["mousemove",{"buttons":1,"clientX":mapX(2),"clientY":mapY(6)}],
        ["mouseup",{"button":0,"clientX":mapX(2),"clientY":mapY(6)}],
        ["mousedown",{"button":0,"clientX":mapX(22),"clientY":mapY(5)}],
        ["mousemove",{"buttons":1,"clientX":mapX(22),"clientY":mapY(6)}],
        ["mouseup",{"button":0,"clientX":mapX(22),"clientY":mapY(6)}],
        ["mousedown",{"button":0,"clientX":mapX(17),"clientY":mapY(2)}],
        ["mousemove",{"buttons":1,"clientX":mapX(17),"clientY":mapY(5)}],
        ["mouseup",{"button":0,"clientX":mapX(17),"clientY":mapY(5)}],
        ["mousedown",{"button":0,"clientX":mapX(29),"clientY":mapY(2)}],
        ["mousemove",{"buttons":1,"clientX":mapX(29),"clientY":mapY(5)}],
        ["mouseup",{"button":0,"clientX":mapX(29),"clientY":mapY(5)}],
        ["mousedown",{"button":0,"clientX":mapX(25),"clientY":mapY(5)}],
        ["mousemove",{"buttons":1,"clientX":mapX(25),"clientY":mapY(10)}],
        ["mouseup",{"button":0,"clientX":mapX(25),"clientY":mapY(10)}],
        ["mousedown",{"button":2,"clientX":mapX(25),"clientY":mapY(15)}],
        ["mouseup",{"button":2,"clientX":mapX(25),"clientY":mapY(15)}],
        ["mousedown",{"button":0,"clientX":mapX(20),"clientY":mapY(22)}],
        ["mouseup",{"button":0,"clientX":mapX(20),"clientY":mapY(22)}],
        ["mousedown",{"button":2,"clientX":mapX(4),"clientY":mapY(20)}],
        ["mouseup",{"button":2,"clientX":mapX(4),"clientY":mapY(20)}],
        ["mousedown",{"button":2,"clientX":mapX(4),"clientY":mapY(20)}],
        ["mouseup",{"button":2,"clientX":mapX(4),"clientY":mapY(20)}],
        ["mousedown",{"button":2,"clientX":mapX(4),"clientY":mapY(20)}],
        ["mouseup",{"button":2,"clientX":mapX(4),"clientY":mapY(20)}],
        ["mousedown",{"button":0,"clientX":mapX(4),"clientY":mapY(17)}],
        ["mousemove",{"buttons":1,"clientX":mapX(4),"clientY":mapY(24)}],
        ["mouseup",{"button":0,"clientX":mapX(4),"clientY":mapY(24)}],
        ["mousedown",{"button":2,"clientX":mapX(6),"clientY":mapY(25)}],
        ["mouseup",{"button":2,"clientX":mapX(6),"clientY":mapY(25)}],
        ["mousedown",{"button":0,"clientX":mapX(4),"clientY":mapY(24)}],
        ["mousemove",{"buttons":1,"clientX":mapX(13),"clientY":mapY(24)}],
        ["mouseup",{"button":0,"clientX":mapX(13),"clientY":mapY(24)}],
        ["mousedown",{"button":2,"clientX":mapX(14),"clientY":mapY(25)}],
        ["mouseup",{"button":2,"clientX":mapX(14),"clientY":mapY(25)}],
        ["mousedown",{"button":0,"clientX":mapX(17),"clientY":mapY(18)}],
        ["mousemove",{"buttons":1,"clientX":mapX(17),"clientY":mapY(5)}],
        ["mouseup",{"button":0,"clientX":mapX(17),"clientY":mapY(5)}],
        ["mousedown",{"button":2,"clientX":mapX(25),"clientY":mapY(17)}],
        ["mouseup",{"button":2,"clientX":mapX(25),"clientY":mapY(17)}],
        ["mousedown",{"button":2,"clientX":mapX(25),"clientY":mapY(17)}],
        ["mouseup",{"button":2,"clientX":mapX(25),"clientY":mapY(17)}],
        ["mousedown",{"button":2,"clientX":mapX(25),"clientY":mapY(17)}],
        ["mouseup",{"button":2,"clientX":mapX(25),"clientY":mapY(17)}],
        ["mousedown",{"button":2,"clientX":mapX(25),"clientY":mapY(17)}],
        ["mouseup",{"button":2,"clientX":mapX(25),"clientY":mapY(17)}],
        ["mousedown",{"button":2,"clientX":mapX(25),"clientY":mapY(17)}],
        ["mouseup",{"button":2,"clientX":mapX(25),"clientY":mapY(17)}],
        ["mousedown",{"button":2,"clientX":mapX(20),"clientY":mapY(9)}],
        ["mouseup",{"button":2,"clientX":mapX(20),"clientY":mapY(9)}],
        ["mousedown",{"button":2,"clientX":mapX(26),"clientY":mapY(9)}],
        ["mouseup",{"button":2,"clientX":mapX(26),"clientY":mapY(9)}],
        ["mousedown",{"button":2,"clientX":mapX(14),"clientY":mapY(7)}],
        ["mouseup",{"button":2,"clientX":mapX(14),"clientY":mapY(7)}],
        ["mousedown",{"button":2,"clientX":mapX(6),"clientY":mapY(9)}],
        ["mouseup",{"button":2,"clientX":mapX(6),"clientY":mapY(9)}],
        ["mousedown",{"button":0,"clientX":mapX(6),"clientY":mapY(9)}],
        ["mousemove",{"buttons":1,"clientX":mapX(25),"clientY":mapY(9)}],
        ["mouseup",{"button":0,"clientX":mapX(25),"clientY":mapY(9)}],

        2,
        "ZZZZ0000ZZZZ1111",

        /** GND and VDD on single PMOS gate **/
        1,
        function() {
            UI.diagram.inputs[0].x  = 7;
            UI.diagram.inputs[0].y  = 6;
            UI.diagram.inputs[1].x  = 28;
            UI.diagram.inputs[1].y  = 28;
            UI.diagram.inputs[2].x  = 28;
            UI.diagram.inputs[2].y  = 28;
            UI.diagram.inputs[3].x  = 28;
            UI.diagram.inputs[3].y  = 28;
            UI.diagram.outputs[0].x = 21;
            UI.diagram.outputs[0].y = 6;
            UI.diagram.vddCell.x    = 14;
            UI.diagram.vddCell.y    = 12;
            UI.diagram.gndCell.x    = 14;
            UI.diagram.gndCell.y    = 14;
        },

        // Clear the canvas
        ["mousedown", {button:  2, clientX: mapX(1),   clientY: mapY(1)}],
        ["mousemove", {buttons: 2, clientX: mapX(29),  clientY: mapY(29)}],
        ["mouseup",   {button:  2, clientX: mapX(29),  clientY: mapY(29)}],

        0,
        0,
        0,

        // PDIFF
        ["mousedown", {button:  0, clientX: mapX(1),  clientY: mapY(7)}],
        ["mousemove", {buttons: 1, clientX: mapX(29), clientY: mapY(7)}],
        ["mouseup",   {button:  0, clientX: mapX(29), clientY: mapY(7)}],

        0,
        0,

        // POLY
        ["mousedown", {button:  0, clientX: mapX(15), clientY: mapY(1)}],
        ["mousemove", {buttons: 1, clientX: mapX(15), clientY: mapY(29)}],
        ["mouseup",   {button:  0, clientX: mapX(15), clientY: mapY(29)}],

        2,
        "XXXXXXXXXXXXXXXX",

        /* Two inputs driving single PMOS gate */
        1,
        function() {
            UI.diagram.inputs[0].x  = 14;
            UI.diagram.inputs[0].y  = 12;
            UI.diagram.inputs[1].x  = 14;
            UI.diagram.inputs[1].y  = 14;
            UI.diagram.inputs[2].x  = 28;
            UI.diagram.inputs[2].y  = 28;
            UI.diagram.inputs[3].x  = 28;
            UI.diagram.inputs[3].y  = 28;
            UI.diagram.outputs[0].x = 21;
            UI.diagram.outputs[0].y = 6;
            UI.diagram.vddCell.x    = 7;
            UI.diagram.vddCell.y    = 6;
            UI.diagram.gndCell.x    = 28;
            UI.diagram.gndCell.y    = 28;
        },

        2,
        "1111XXXXXXXXZZZZ",

        /** GND and VDD on single NMOS gate **/
        1,
        function() {
            UI.diagram.inputs[0].x  = 7;
            UI.diagram.inputs[0].y  = 6;
            UI.diagram.inputs[1].x  = 28;
            UI.diagram.inputs[1].y  = 28;
            UI.diagram.inputs[2].x  = 28;
            UI.diagram.inputs[2].y  = 28;
            UI.diagram.inputs[3].x  = 28;
            UI.diagram.inputs[3].y  = 28;
            UI.diagram.outputs[0].x = 21;
            UI.diagram.outputs[0].y = 6;
            UI.diagram.vddCell.x    = 14;
            UI.diagram.vddCell.y    = 12;
            UI.diagram.gndCell.x    = 14;
            UI.diagram.gndCell.y    = 14;
        },

        // Clear the canvas
        ["mousedown", {button:  2, clientX: mapX(1),   clientY: mapY(1)}],
        ["mousemove", {buttons: 2, clientX: mapX(29),  clientY: mapY(29)}],
        ["mouseup",   {button:  2, clientX: mapX(29),  clientY: mapY(29)}],

        // POLY
        ["mousedown", {button:  0, clientX: mapX(15), clientY: mapY(1)}],
        ["mousemove", {buttons: 1, clientX: mapX(15), clientY: mapY(29)}],
        ["mouseup",   {button:  0, clientX: mapX(15), clientY: mapY(29)}],

        0,
        0,
        0,
        0,
        0,

        // NDIFF
        ["mousedown", {button:  0, clientX: mapX(1),  clientY: mapY(7)}],
        ["mousemove", {buttons: 1, clientX: mapX(29), clientY: mapY(7)}],
        ["mouseup",   {button:  0, clientX: mapX(29), clientY: mapY(7)}],


        2,
        "XXXXXXXXXXXXXXXX",

        /* Two inputs driving single NMOS gate */
        1,
        function() {
            UI.diagram.inputs[0].x  = 14;
            UI.diagram.inputs[0].y  = 12;
            UI.diagram.inputs[1].x  = 14;
            UI.diagram.inputs[1].y  = 14;
            UI.diagram.inputs[2].x  = 28;
            UI.diagram.inputs[2].y  = 28;
            UI.diagram.inputs[3].x  = 28;
            UI.diagram.inputs[3].y  = 28;
            UI.diagram.outputs[0].x = 21;
            UI.diagram.outputs[0].y = 6;
            UI.diagram.vddCell.x    = 28;
            UI.diagram.vddCell.y    = 28;
            UI.diagram.gndCell.x    = 7;
            UI.diagram.gndCell.y    = 6;
        },

        2,
        "ZZZZXXXXXXXX0000",

        /** Indirectly overdriven output via NMOS **/
        1,
        function() {
            UI.diagram.inputs[0].x  = 6;
            UI.diagram.inputs[0].y  = 14;
            UI.diagram.inputs[1].x  = 22;
            UI.diagram.inputs[1].y  = 14;
            UI.diagram.inputs[2].x  = 3;
            UI.diagram.inputs[2].y  = 6;
            UI.diagram.inputs[3].x  = 25;
            UI.diagram.inputs[3].y  = 6;
            UI.diagram.outputs[0].x = 14;
            UI.diagram.outputs[0].y = 6;
            UI.diagram.vddCell.x    = 0;
            UI.diagram.vddCell.y    = 0;
            UI.diagram.gndCell.x    = 0;
            UI.diagram.gndCell.y    = 28;
        },

        // Clear the canvas
        ["mousedown", {button:  2, clientX: mapX(1),   clientY: mapY(1)}],
        ["mousemove", {buttons: 2, clientX: mapX(29),  clientY: mapY(29)}],
        ["mouseup",   {button:  2, clientX: mapX(29),  clientY: mapY(29)}],

        // NDIFF
        ["mousedown", {button:  0, clientX: mapX(1),  clientY: mapY(7)}],
        ["mousemove", {buttons: 1, clientX: mapX(29), clientY: mapY(7)}],
        ["mouseup",   {button:  0, clientX: mapX(29), clientY: mapY(7)}],

        0,

        // POLY
        ["mousedown", {button:  0, clientX: mapX(7),  clientY: mapY(1)}],
        ["mousemove", {buttons: 1, clientX: mapX(7),  clientY: mapY(29)}],
        ["mouseup",   {button:  0, clientX: mapX(7),  clientY: mapY(29)}],

        ["mousedown", {button:  0, clientX: mapX(23), clientY: mapY(1)}],
        ["mousemove", {buttons: 1, clientX: mapX(23), clientY: mapY(29)}],
        ["mouseup",   {button:  0, clientX: mapX(23), clientY: mapY(29)}],

        2,
        "ZZZZ010100110XX1",

        /** Indirectly overdriven output via PMOS **/

        // Clear the canvas
        ["mousedown", {button:  2, clientX: mapX(1),   clientY: mapY(1)}],
        ["mousemove", {buttons: 2, clientX: mapX(29),  clientY: mapY(29)}],
        ["mouseup",   {button:  2, clientX: mapX(29),  clientY: mapY(29)}],

        // POLY
        ["mousedown", {button:  0, clientX: mapX(7),  clientY: mapY(1)}],
        ["mousemove", {buttons: 1, clientX: mapX(7),  clientY: mapY(29)}],
        ["mouseup",   {button:  0, clientX: mapX(7),  clientY: mapY(29)}],

        ["mousedown", {button:  0, clientX: mapX(23), clientY: mapY(1)}],
        ["mousemove", {buttons: 1, clientX: mapX(23), clientY: mapY(29)}],
        ["mouseup",   {button:  0, clientX: mapX(23), clientY: mapY(29)}],

        0,
        0,
        0,
        0,

        // PDIFF
        ["mousedown", {button:  0, clientX: mapX(1),  clientY: mapY(7)}],
        ["mousemove", {buttons: 1, clientX: mapX(29), clientY: mapY(7)}],
        ["mouseup",   {button:  0, clientX: mapX(29), clientY: mapY(7)}],

        2,
        "0XX100110101ZZZZ",

        /* Indirectly overdriven gates via PMOS */
        1,
        function() {
            UI.diagram.inputs[0].x  = 8;
            UI.diagram.inputs[0].y  = 14;
            UI.diagram.inputs[1].x  = 20;
            UI.diagram.inputs[1].y  = 14;
            UI.diagram.inputs[2].x  = 4;
            UI.diagram.inputs[2].y  = 1;
            UI.diagram.inputs[3].x  = 18;
            UI.diagram.inputs[3].y  = 1;
            UI.diagram.outputs[0].x = 26;
            UI.diagram.outputs[0].y = 14;
            UI.diagram.vddCell.x    = 12;
            UI.diagram.vddCell.y    = 1;
            UI.diagram.gndCell.x    = 12;
            UI.diagram.gndCell.y    = 27;
        },

        // Clear the canvas
        ["mousedown", {button:  2, clientX: mapX(1),   clientY: mapY(1)}],
        ["mousemove", {buttons: 2, clientX: mapX(29),  clientY: mapY(29)}],
        ["mouseup",   {button:  2, clientX: mapX(29),  clientY: mapY(29)}],

        // PDIFF
        ["mousedown", {button:  0, clientX: mapX(1),  clientY: mapY(2)}],
        ["mousemove", {buttons: 1, clientX: mapX(11), clientY: mapY(2)}],
        ["mouseup",   {button:  0, clientX: mapX(11), clientY: mapY(2)}],

        ["mousedown", {button:  0, clientX: mapX(13), clientY: mapY(2)}],
        ["mousemove", {buttons: 1, clientX: mapX(17), clientY: mapY(2)}],
        ["mouseup",   {button:  0, clientX: mapX(17), clientY: mapY(2)}],

        ["mousedown", {button:  0, clientX: mapX(19), clientY: mapY(2)}],
        ["mousemove", {buttons: 1, clientX: mapX(25), clientY: mapY(2)}],
        ["mouseup",   {button:  0, clientX: mapX(25), clientY: mapY(2)}],

        ["mousedown", {button:  0, clientX: mapX(27), clientY: mapY(2)}],
        ["mousemove", {buttons: 1, clientX: mapX(29), clientY: mapY(2)}],
        ["mouseup",   {button:  0, clientX: mapX(29), clientY: mapY(2)}],

        0,

        // NDIFF
        ["mousedown", {button:  0, clientX: mapX(13), clientY: mapY(28)}],
        ["mousemove", {buttons: 1, clientX: mapX(17), clientY: mapY(28)}],
        ["mouseup",   {button:  0, clientX: mapX(17), clientY: mapY(28)}],

        0,

        // POLY
        ["mousedown", {button:  0, clientX: mapX(9),  clientY: mapY(1)}],
        ["mousemove", {buttons: 1, clientX: mapX(9),  clientY: mapY(29)}],
        ["mouseup",   {button:  0, clientX: mapX(9),  clientY: mapY(29)}],

        ["mousedown", {button:  0, clientX: mapX(15), clientY: mapY(1)}],
        ["mousemove", {buttons: 1, clientX: mapX(15), clientY: mapY(29)}],
        ["mouseup",   {button:  0, clientX: mapX(15), clientY: mapY(29)}],

        ["mousedown", {button:  0, clientX: mapX(21), clientY: mapY(1)}],
        ["mousemove", {buttons: 1, clientX: mapX(21), clientY: mapY(29)}],
        ["mouseup",   {button:  0, clientX: mapX(21), clientY: mapY(29)}],

        0,

        // METAL1
        ["mousedown", {button:  0, clientX: mapX(11), clientY: mapY(2)}],
        ["mousemove", {buttons: 1, clientX: mapX(11), clientY: mapY(7)}],
        ["mouseup",   {button:  0, clientX: mapX(11), clientY: mapY(7)}],

        ["mousedown", {button:  0, clientX: mapX(11), clientY: mapY(7)}],
        ["mousemove", {buttons: 1, clientX: mapX(15), clientY: mapY(7)}],
        ["mouseup",   {button:  0, clientX: mapX(15), clientY: mapY(7)}],

        ["mousedown", {button:  0, clientX: mapX(25), clientY: mapY(2)}],
        ["mousemove", {buttons: 1, clientX: mapX(25), clientY: mapY(10)}],
        ["mouseup",   {button:  0, clientX: mapX(25), clientY: mapY(10)}],

        ["mousedown", {button:  0, clientX: mapX(15), clientY: mapY(10)}],
        ["mousemove", {buttons: 1, clientX: mapX(25), clientY: mapY(10)}],
        ["mouseup",   {button:  0, clientX: mapX(25), clientY: mapY(10)}],

        ["mousedown", {button:  0, clientX: mapX(27), clientY: mapY(2)}],
        ["mousemove", {buttons: 1, clientX: mapX(27), clientY: mapY(22)}],
        ["mouseup",   {button:  0, clientX: mapX(27), clientY: mapY(22)}],

        ["mousedown", {button:  0, clientX: mapX(17), clientY: mapY(22)}],
        ["mousemove", {buttons: 1, clientX: mapX(27), clientY: mapY(22)}],
        ["mouseup",   {button:  0, clientX: mapX(27), clientY: mapY(22)}],

        0,

        // METAL2
        ["mousedown", {button:  0, clientX: mapX(17), clientY: mapY(2)}],
        ["mousemove", {buttons: 1, clientX: mapX(17), clientY: mapY(28)}],
        ["mouseup",   {button:  0, clientX: mapX(17), clientY: mapY(28)}],

        0,

        // CONTACT
        ["mousedown", {button:  0, clientX: mapX(11), clientY: mapY(2)}],
        ["mouseup",   {button:  0, clientX: mapX(11), clientY: mapY(2)}],

        ["mousedown", {button:  0, clientX: mapX(17), clientY: mapY(2)}],
        ["mouseup",   {button:  0, clientX: mapX(17), clientY: mapY(2)}],

        ["mousedown", {button:  0, clientX: mapX(25), clientY: mapY(2)}],
        ["mouseup",   {button:  0, clientX: mapX(25), clientY: mapY(2)}],

        ["mousedown", {button:  0, clientX: mapX(27), clientY: mapY(2)}],
        ["mouseup",   {button:  0, clientX: mapX(27), clientY: mapY(2)}],

        ["mousedown", {button:  0, clientX: mapX(15), clientY: mapY(7)}],
        ["mouseup",   {button:  0, clientX: mapX(15), clientY: mapY(7)}],

        ["mousedown", {button:  0, clientX: mapX(15), clientY: mapY(10)}],
        ["mouseup",   {button:  0, clientX: mapX(15), clientY: mapY(10)}],

        ["mousedown", {button:  0, clientX: mapX(17), clientY: mapY(22)}],
        ["mouseup",   {button:  0, clientX: mapX(17), clientY: mapY(22)}],

        ["mousedown", {button:  0, clientX: mapX(17), clientY: mapY(28)}],
        ["mouseup",   {button:  0, clientX: mapX(17), clientY: mapY(28)}],

        2,
        "1XX011001010ZZZZ",

        /* Indirectly overdriven gates via NMOS */
        1,
        function() {
            UI.diagram.inputs[0].x  = 8;
            UI.diagram.inputs[0].y  = 14;
            UI.diagram.inputs[1].x  = 20;
            UI.diagram.inputs[1].y  = 14;
            UI.diagram.inputs[2].x  = 4;
            UI.diagram.inputs[2].y  = 1;
            UI.diagram.inputs[3].x  = 18;
            UI.diagram.inputs[3].y  = 1;
            UI.diagram.outputs[0].x = 26;
            UI.diagram.outputs[0].y = 14;
            UI.diagram.vddCell.x    = 12;
            UI.diagram.vddCell.y    = 27;
            UI.diagram.gndCell.x    = 12;
            UI.diagram.gndCell.y    = 1;
        },

        // Clear the canvas
        ["mousedown", {button:  2, clientX: mapX(1),   clientY: mapY(1)}],
        ["mousemove", {buttons: 2, clientX: mapX(29),  clientY: mapY(29)}],
        ["mouseup",   {button:  2, clientX: mapX(29),  clientY: mapY(29)}],

        0,

        // PDIFF
        ["mousedown", {button:  0, clientX: mapX(13), clientY: mapY(28)}],
        ["mousemove", {buttons: 1, clientX: mapX(17), clientY: mapY(28)}],
        ["mouseup",   {button:  0, clientX: mapX(17), clientY: mapY(28)}],

        0,

        // NDIFF
        ["mousedown", {button:  0, clientX: mapX(1),  clientY: mapY(2)}],
        ["mousemove", {buttons: 1, clientX: mapX(11), clientY: mapY(2)}],
        ["mouseup",   {button:  0, clientX: mapX(11), clientY: mapY(2)}],

        ["mousedown", {button:  0, clientX: mapX(13), clientY: mapY(2)}],
        ["mousemove", {buttons: 1, clientX: mapX(17), clientY: mapY(2)}],
        ["mouseup",   {button:  0, clientX: mapX(17), clientY: mapY(2)}],

        ["mousedown", {button:  0, clientX: mapX(19), clientY: mapY(2)}],
        ["mousemove", {buttons: 1, clientX: mapX(25), clientY: mapY(2)}],
        ["mouseup",   {button:  0, clientX: mapX(25), clientY: mapY(2)}],

        ["mousedown", {button:  0, clientX: mapX(27), clientY: mapY(2)}],
        ["mousemove", {buttons: 1, clientX: mapX(29), clientY: mapY(2)}],
        ["mouseup",   {button:  0, clientX: mapX(29), clientY: mapY(2)}],

        0,

        // POLY
        ["mousedown", {button:  0, clientX: mapX(9),  clientY: mapY(1)}],
        ["mousemove", {buttons: 1, clientX: mapX(9),  clientY: mapY(29)}],
        ["mouseup",   {button:  0, clientX: mapX(9),  clientY: mapY(29)}],

        ["mousedown", {button:  0, clientX: mapX(15), clientY: mapY(1)}],
        ["mousemove", {buttons: 1, clientX: mapX(15), clientY: mapY(29)}],
        ["mouseup",   {button:  0, clientX: mapX(15), clientY: mapY(29)}],

        ["mousedown", {button:  0, clientX: mapX(21), clientY: mapY(1)}],
        ["mousemove", {buttons: 1, clientX: mapX(21), clientY: mapY(29)}],
        ["mouseup",   {button:  0, clientX: mapX(21), clientY: mapY(29)}],

        0,

        // METAL1
        ["mousedown", {button:  0, clientX: mapX(11), clientY: mapY(2)}],
        ["mousemove", {buttons: 1, clientX: mapX(11), clientY: mapY(7)}],
        ["mouseup",   {button:  0, clientX: mapX(11), clientY: mapY(7)}],

        ["mousedown", {button:  0, clientX: mapX(11), clientY: mapY(7)}],
        ["mousemove", {buttons: 1, clientX: mapX(15), clientY: mapY(7)}],
        ["mouseup",   {button:  0, clientX: mapX(15), clientY: mapY(7)}],

        ["mousedown", {button:  0, clientX: mapX(25), clientY: mapY(2)}],
        ["mousemove", {buttons: 1, clientX: mapX(25), clientY: mapY(10)}],
        ["mouseup",   {button:  0, clientX: mapX(25), clientY: mapY(10)}],

        ["mousedown", {button:  0, clientX: mapX(15), clientY: mapY(10)}],
        ["mousemove", {buttons: 1, clientX: mapX(25), clientY: mapY(10)}],
        ["mouseup",   {button:  0, clientX: mapX(25), clientY: mapY(10)}],

        ["mousedown", {button:  0, clientX: mapX(27), clientY: mapY(2)}],
        ["mousemove", {buttons: 1, clientX: mapX(27), clientY: mapY(22)}],
        ["mouseup",   {button:  0, clientX: mapX(27), clientY: mapY(22)}],

        ["mousedown", {button:  0, clientX: mapX(17), clientY: mapY(22)}],
        ["mousemove", {buttons: 1, clientX: mapX(27), clientY: mapY(22)}],
        ["mouseup",   {button:  0, clientX: mapX(27), clientY: mapY(22)}],

        0,

        // METAL2
        ["mousedown", {button:  0, clientX: mapX(17), clientY: mapY(2)}],
        ["mousemove", {buttons: 1, clientX: mapX(17), clientY: mapY(28)}],
        ["mouseup",   {button:  0, clientX: mapX(17), clientY: mapY(28)}],

        0,

        // CONTACT
        ["mousedown", {button:  0, clientX: mapX(11), clientY: mapY(2)}],
        ["mouseup",   {button:  0, clientX: mapX(11), clientY: mapY(2)}],

        ["mousedown", {button:  0, clientX: mapX(17), clientY: mapY(2)}],
        ["mouseup",   {button:  0, clientX: mapX(17), clientY: mapY(2)}],

        ["mousedown", {button:  0, clientX: mapX(25), clientY: mapY(2)}],
        ["mouseup",   {button:  0, clientX: mapX(25), clientY: mapY(2)}],

        ["mousedown", {button:  0, clientX: mapX(27), clientY: mapY(2)}],
        ["mouseup",   {button:  0, clientX: mapX(27), clientY: mapY(2)}],

        ["mousedown", {button:  0, clientX: mapX(15), clientY: mapY(7)}],
        ["mouseup",   {button:  0, clientX: mapX(15), clientY: mapY(7)}],

        ["mousedown", {button:  0, clientX: mapX(15), clientY: mapY(10)}],
        ["mouseup",   {button:  0, clientX: mapX(15), clientY: mapY(10)}],

        ["mousedown", {button:  0, clientX: mapX(17), clientY: mapY(22)}],
        ["mouseup",   {button:  0, clientX: mapX(17), clientY: mapY(22)}],

        ["mousedown", {button:  0, clientX: mapX(17), clientY: mapY(28)}],
        ["mouseup",   {button:  0, clientX: mapX(17), clientY: mapY(28)}],

        2,
        "ZZZZ101011001XX0",

        /* Overdriven dead-end transistor */
         1,
        function() {
            UI.diagram.inputs[0].x  = 7;
            UI.diagram.inputs[0].y  = 5;
            UI.diagram.inputs[1].x  = 7;
            UI.diagram.inputs[1].y  = 11;
            UI.diagram.inputs[2].x  = 7;
            UI.diagram.inputs[2].y  = 17;
            UI.diagram.inputs[3].x  = 7;
            UI.diagram.inputs[3].y  = 23;
            UI.diagram.outputs[0].x = 19;
            UI.diagram.outputs[0].y = 13;
            UI.diagram.vddCell.x    = 0;
            UI.diagram.vddCell.y    = 0;
            UI.diagram.gndCell.x    = 0;
            UI.diagram.gndCell.y    = 0;
        },

        // Clear the canvas
        ["mousedown", {button:  2, clientX: mapX(1),   clientY: mapY(1)}],
        ["mousemove", {buttons: 2, clientX: mapX(29),  clientY: mapY(29)}],
        ["mouseup",   {button:  2, clientX: mapX(29),  clientY: mapY(29)}],

        0, // PDIFF
        ["mousedown", {button:  0, clientX: mapX(1),  clientY: mapY(14)}],
        ["mousemove", {buttons: 1, clientX: mapX(29), clientY: mapY(14)}],
        ["mouseup",   {button:  0, clientX: mapX(29), clientY: mapY(14)}],

        0, //NDIFF
        0, // POLY

        ["mousedown", {button:  0, clientX: mapX(8), clientY: mapY(1)}],
        ["mousemove", {buttons: 1, clientX: mapX(8), clientY: mapY(29)}],
        ["mouseup",   {button:  1, clientX: mapX(8), clientY: mapY(29)}],
        
        2,
        "ZZZZZZZZZZZZZZZZ",
               
        /* One overdriven transistor in series with VDD w/ grounded gate */
         1,
        function() {
            UI.diagram.inputs[0].x  = 7;
            UI.diagram.inputs[0].y  = 5;
            UI.diagram.inputs[1].x  = 7;
            UI.diagram.inputs[1].y  = 11;
            UI.diagram.inputs[2].x  = 7;
            UI.diagram.inputs[2].y  = 17;
            UI.diagram.inputs[3].x  = 7;
            UI.diagram.inputs[3].y  = 23;
            UI.diagram.outputs[0].x = 19;
            UI.diagram.outputs[0].y = 13;
            UI.diagram.vddCell.x    = 1;
            UI.diagram.vddCell.y    = 13;
            UI.diagram.gndCell.x    = 7;
            UI.diagram.gndCell.y    = 20;
        },

        2,
        "1XXXXXXXXXXXXXXX",

        /* Two overdriven dead-end transistors in series */
         1,
        function() {
            UI.diagram.inputs[0].x  = 7;
            UI.diagram.inputs[0].y  = 5;
            UI.diagram.inputs[1].x  = 7;
            UI.diagram.inputs[1].y  = 11;
            UI.diagram.inputs[2].x  = 5;
            UI.diagram.inputs[2].y  = 17;
            UI.diagram.inputs[3].x  = 5;
            UI.diagram.inputs[3].y  = 23;
            UI.diagram.outputs[0].x = 19;
            UI.diagram.outputs[0].y = 13;
            UI.diagram.vddCell.x    = 0;
            UI.diagram.vddCell.y    = 0;
            UI.diagram.gndCell.x    = 0;
            UI.diagram.gndCell.y    = 0;
        },

        // Clear some of the poly to remove old contacts
        ["mousedown", {button:  2, clientX: mapX(8),  clientY: mapY(15)}],
        ["mousemove", {buttons: 2, clientX: mapX(8),  clientY: mapY(29)}],
        ["mouseup",   {button:  2, clientX: mapX(8),  clientY: mapY(29)}],

        // POLY
        ["mousedown", {button:  0, clientX: mapX(6), clientY: mapY(1)}],
        ["mousemove", {buttons: 1, clientX: mapX(6), clientY: mapY(29)}],
        ["mouseup",   {button:  1, clientX: mapX(6), clientY: mapY(29)}],
        
        ["mousedown", {button:  0, clientX: mapX(8), clientY: mapY(15)}],
        ["mousemove", {buttons: 1, clientX: mapX(8), clientY: mapY(29)}],
        ["mouseup",   {button:  1, clientX: mapX(8), clientY: mapY(29)}],

        2,
        "ZZZZZZZZZZZZZZZZ",

        /* Two overdriven transistors in series with VDD */
         1,
        function() {
            UI.diagram.inputs[0].x  = 7;
            UI.diagram.inputs[0].y  = 5;
            UI.diagram.inputs[1].x  = 7;
            UI.diagram.inputs[1].y  = 11;
            UI.diagram.inputs[2].x  = 5;
            UI.diagram.inputs[2].y  = 17;
            UI.diagram.inputs[3].x  = 5;
            UI.diagram.inputs[3].y  = 23;
            UI.diagram.outputs[0].x = 19;
            UI.diagram.outputs[0].y = 13;
            UI.diagram.vddCell.x    = 1;
            UI.diagram.vddCell.y    = 13;
            UI.diagram.gndCell.x    = 0;
            UI.diagram.gndCell.y    = 0;
        },

        2,
        "1XXZXXXZXXXZZZZZ",

        /* Two overdriven transistors in series with VDD w/ grounded gate */
         1,
        function() {
            UI.diagram.inputs[0].x  = 7;
            UI.diagram.inputs[0].y  = 5;
            UI.diagram.inputs[1].x  = 7;
            UI.diagram.inputs[1].y  = 11;
            UI.diagram.inputs[2].x  = 5;
            UI.diagram.inputs[2].y  = 17;
            UI.diagram.inputs[3].x  = 5;
            UI.diagram.inputs[3].y  = 23;
            UI.diagram.outputs[0].x = 19;
            UI.diagram.outputs[0].y = 13;
            UI.diagram.vddCell.x    = 1;
            UI.diagram.vddCell.y    = 13;
            UI.diagram.gndCell.x    = 7;
            UI.diagram.gndCell.y    = 17;
        },

        2,
        "1XXZXXXZXXXZXXXZ",

        /* One transistor driven by VDD & GND in series w/ singly-driven gate & direct input */
        1,
        function() {
            UI.diagram.inputs[0].x  = 1;
            UI.diagram.inputs[0].y  = 13;
            UI.diagram.inputs[1].x  = 5;
            UI.diagram.inputs[1].y  = 5;
            UI.diagram.inputs[2].x  = 0;
            UI.diagram.inputs[2].y  = 0;
            UI.diagram.inputs[3].x  = 0;
            UI.diagram.inputs[3].y  = 0;
            UI.diagram.outputs[0].x = 19;
            UI.diagram.outputs[0].y = 13;
            UI.diagram.vddCell.x    = 7;
            UI.diagram.vddCell.y    = 5;
            UI.diagram.gndCell.x    = 7;
            UI.diagram.gndCell.y    = 23;
        },

        // Clear some of the poly to remove old contacts
        ["mousedown", {button:  2, clientX: mapX(6),  clientY: mapY(1)}],
        ["mousemove", {buttons: 2, clientX: mapX(6),  clientY: mapY(13)}],
        ["mouseup",   {button:  2, clientX: mapX(6),  clientY: mapY(13)}],
        
        ["mousedown", {button:  2, clientX: mapX(8),  clientY: mapY(1)}],
        ["mousemove", {buttons: 2, clientX: mapX(8),  clientY: mapY(13)}],
        ["mouseup",   {button:  2, clientX: mapX(8),  clientY: mapY(13)}],

        ["mousedown", {button:  2, clientX: mapX(6),  clientY: mapY(15)}],
        ["mousemove", {buttons: 2, clientX: mapX(6),  clientY: mapY(29)}],
        ["mouseup",   {button:  2, clientX: mapX(6),  clientY: mapY(29)}],
        
        ["mousedown", {button:  2, clientX: mapX(8),  clientY: mapY(15)}],
        ["mousemove", {buttons: 2, clientX: mapX(8),  clientY: mapY(29)}],
        ["mouseup",   {button:  2, clientX: mapX(8),  clientY: mapY(29)}],

        // POLY
        ["mousedown", {button:  0, clientX: mapX(6), clientY: mapY(1)}],
        ["mousemove", {buttons: 1, clientX: mapX(6), clientY: mapY(29)}],
        ["mouseup",   {button:  1, clientX: mapX(6), clientY: mapY(29)}],
        
        ["mousedown", {button:  0, clientX: mapX(8), clientY: mapY(1)}],
        ["mousemove", {buttons: 1, clientX: mapX(8), clientY: mapY(29)}],
        ["mouseup",   {button:  1, clientX: mapX(8), clientY: mapY(29)}],

        2,
        "XXXXZZZZXXXXZZZZ",

        /* One transistor driven by VDD & GND in series w/ overdriven gate & direct input */
        1,
        function() {
            UI.diagram.inputs[0].x  = 1;
            UI.diagram.inputs[0].y  = 13;
            UI.diagram.inputs[1].x  = 5;
            UI.diagram.inputs[1].y  = 5;
            UI.diagram.inputs[2].x  = 5;
            UI.diagram.inputs[2].y  = 23;
            UI.diagram.inputs[3].x  = 0;
            UI.diagram.inputs[3].y  = 0;
            UI.diagram.outputs[0].x = 19;
            UI.diagram.outputs[0].y = 13;
            UI.diagram.vddCell.x    = 7;
            UI.diagram.vddCell.y    = 5;
            UI.diagram.gndCell.x    = 7;
            UI.diagram.gndCell.y    = 23;
        },

        2,
        "XXXXXXZZXXXXXXZZ",

        /* Toggle dark mode via simulated button click */
        3,
        function() {
            let compareTo = window.UI.diagramView.darkMode;
            document.getElementById("dark-mode-btn").click();
            return window.UI.diagramView.darkMode !== compareTo;
        },

        /* Toggle dark mode via simulated keyboard shortcut */
        3,
        function() {
            let compareTo = window.UI.diagramView.darkMode;

            let keyboardEvent = new KeyboardEvent("keyup", {
                bubbles : true,
                cancelable : true,
                shiftKey : window.UI.darkModeCommand.shiftModifier,
                ctrlKey: window.UI.darkModeCommand.ctrlModifier,
                keyCode: window.UI.darkModeCommand.keyCode, 
            });
            document.dispatchEvent(keyboardEvent);

            return window.UI.diagramView.darkMode !== compareTo;
        },

        /* Change the theme via simulated keyboard shortcut */
        3,
        function() {
            let compareTo = window.UI.diagramView.theme;

            let keyboardEvent = new KeyboardEvent("keyup", {
                bubbles : true,
                cancelable : true,
                shiftKey : window.UI.themeCommand.shiftModifier,
                ctrlKey: window.UI.themeCommand.ctrlModifier,
                keyCode: window.UI.themeCommand.keyCode, 
            });
            document.dispatchEvent(keyboardEvent);

            return window.UI.diagramView.theme !== compareTo;
        },

        /* Toggle transparency via simulated keyboard shortcut */
        3,
        function() {
            let compareTo = window.UI.diagramView.useFlatColors;

            let keyboardEvent = new KeyboardEvent("keyup", {
                bubbles : true,
                cancelable : true,
                shiftKey : window.UI.transparencyCommand.shiftModifier,
                ctrlKey: window.UI.transparencyCommand.ctrlModifier,
                keyCode: window.UI.transparencyCommand.keyCode, 
            });
            document.dispatchEvent(keyboardEvent);

            return window.UI.diagramView.useFlatColors !== compareTo;
        },

        /* Add two inputs via simulated keyboard shortcut */
        3,
        function() {
            let compareTo = window.UI.diagram.inputs.length;

            let keyboardEvent = new KeyboardEvent("keyup", {
                bubbles : true,
                cancelable : true,
                shiftKey : window.UI.addInputCommand.shiftModifier,
                ctrlKey: window.UI.addInputCommand.ctrlModifier,
                keyCode: window.UI.addInputCommand.keyCode, 
            });
            document.dispatchEvent(keyboardEvent);
            document.dispatchEvent(keyboardEvent);

            return window.UI.diagram.inputs.length === compareTo + 2;
        },

        /* Remove an input via simulated keyboard shortcut */
        3,
        function() {
            let compareTo = window.UI.diagram.inputs.length;

            let keyboardEvent = new KeyboardEvent("keyup", {
                bubbles : true,
                cancelable : true,
                shiftKey : window.UI.removeInputCommand.shiftModifier,
                ctrlKey: window.UI.removeInputCommand.ctrlModifier,
                keyCode: window.UI.removeInputCommand.keyCode, 
            });
            document.dispatchEvent(keyboardEvent);

            return window.UI.diagram.inputs.length === compareTo - 1;
        },

        /* Add two outputs via simulated keyboard shortcut */
        3,
        function() {
            let compareTo = window.UI.diagram.outputs.length;

            let keyboardEvent = new KeyboardEvent("keyup", {
                bubbles : true,
                cancelable : true,
                shiftKey : window.UI.addOutputCommand.shiftModifier,
                ctrlKey: window.UI.addOutputCommand.ctrlModifier,
                keyCode: window.UI.addOutputCommand.keyCode, 
            });
            document.dispatchEvent(keyboardEvent);
            document.dispatchEvent(keyboardEvent);

            return window.UI.diagram.outputs.length === compareTo + 2;
        },

        /* Remove an output via simulated keyboard shortcut */
        3,
        function() {
            let compareTo = window.UI.diagram.outputs.length;

            let keyboardEvent = new KeyboardEvent("keyup", {
                bubbles : true,
                cancelable : true,
                shiftKey : window.UI.removeOutputCommand.shiftModifier,
                ctrlKey: window.UI.removeOutputCommand.ctrlModifier,
                keyCode: window.UI.removeOutputCommand.keyCode, 
            });
            document.dispatchEvent(keyboardEvent);

            return window.UI.diagram.outputs.length === compareTo - 1;
        },

        /* Three overdriven transistors in series with input and two outputs */
        1,
        function() {
            UI.diagram.inputs[0].x  = 9;
            UI.diagram.inputs[0].y  = 5;
            UI.diagram.inputs[1].x  = 9;
            UI.diagram.inputs[1].y  = 23;
            UI.diagram.inputs[2].x  = 5;
            UI.diagram.inputs[2].y  = 23;
            UI.diagram.inputs[3].x  = 5;
            UI.diagram.inputs[3].y  = 5;
            UI.diagram.inputs[4].x  = 1;
            UI.diagram.inputs[4].y  = 13;
            UI.diagram.outputs[0].x = 19;
            UI.diagram.outputs[0].y = 13;
            UI.diagram.outputs[1].x = 21;
            UI.diagram.outputs[1].y = 13;
            UI.diagram.vddCell.x    = 7;
            UI.diagram.vddCell.y    = 5;
            UI.diagram.gndCell.x    = 7;
            UI.diagram.gndCell.y    = 23;
        },

        ["mousedown", {button:  0, clientX: mapX(10), clientY: mapY(1)}],
        ["mousemove", {buttons: 1, clientX: mapX(10), clientY: mapY(29)}],
        ["mouseup",   {button:  1, clientX: mapX(10), clientY: mapY(29)}],

        2,
        "XXXXXXZZXXXXXXZZXXXXXXZZZZZZZZZZXXXXXXZZXXXXXXZZXXXXXXZZZZZZZZZZ",
   ];

    /** RUN TESTBENCH **/
    startTime = Date.now();
    for(let ii = 0; ii < events.length && testVector < runTo; ii++) {
        if(events[ii] === 0) {
            UI.diagramController.changeLayer();
            continue;
        }

        if(events[ii] === 1) {
            executeNext = true;
            continue;
        }

        if(events[ii] === 2) {
            assertNext = true;
            continue;
        }

        if(events[ii] === 3) {
            evalBooleanNext = true;
            continue;
        }

        if(executeNext) {
            events[ii]();
            executeNext = false;
        } else if(assertNext) {
            // Set CONTACT at the coordinates of each input and output.
            UI.diagram.inputs.forEach(function(input) {
                UI.diagram.layeredGrid.set(input.x, input.y, LayeredGrid.CONTACT);
            });
            UI.diagram.outputs.forEach(function(output) {
                UI.diagram.layeredGrid.set(output.x, output.y, LayeredGrid.CONTACT);
            });

            // Set the CONTACT layer on the VDD and GND cells.
            UI.diagram.layeredGrid.set(UI.diagram.vddCell.x, UI.diagram.vddCell.y, LayeredGrid.CONTACT);
            UI.diagram.layeredGrid.set(UI.diagram.gndCell.x, UI.diagram.gndCell.y, LayeredGrid.CONTACT);

            // Do it.
            UI.diagram.setNets();
            UI.diagram.clearAnalyses();
            tv = "";
            
            for(let ii = 0; ii < UI.diagram.outputs.length; ii++) {
                for(let jj = 0; jj < Math.pow(2, UI.diagram.inputs.length); jj++) {
                    tv += UI.diagram.computeOutput(jj, UI.diagram.outputNodes[ii]);
                }
            }
        
            results[testVector] = tv === events[ii];
            testVector++;

            assertNext = false;
        } else if(evalBooleanNext) {
            results[testVector] = events[ii]();
            testVector++;
            evalBooleanNext = false;
        } else {
            evt = new MouseEvent(events[ii][0], {
                view: window,
                bubbles: true,
                cancelable: true,
                ...events[ii][1]
            });
            document.getElementById('canvas-wrapper').dispatchEvent(evt);
        }
    }
    endTime = Date.now();
    UI.refreshTruthTable(/*true*/);

    // Only overwrite the results if all tests were run.
    if(runTo < testCases.length) {
        return;
    }

    // Clear #instructions-text and replace its contents with the elapsed time
    // Make a new div.
    let resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";

    p = document.createElement("p");
    p.innerHTML = `<b>Elapsed time:</b> ${endTime - startTime}ms`;

    resultsDiv.appendChild(p);
    resultsDiv.appendChild(document.createElement("br"));

    // Add indidual test results to #instructions-text as PASS or FAIL
    // Label with their test case names.
    results.forEach(function(result, index) {
        p = document.createElement("p");
        p.innerHTML = `<span style="cursor:pointer" onclick="window.scrollTo({top: 0, left: 0, behavior: 'auto'}); setTimeout(runTestbench, 10, ${index + 1});"><b>Test ${index}:</b> ${testCases[index]}</span>`;
        p.innerHTML += `<b style='float:right;color:${result ? "green'>PASS" : "red'>FAIL"}</b>`;
        resultsDiv.appendChild(p);
    });
}