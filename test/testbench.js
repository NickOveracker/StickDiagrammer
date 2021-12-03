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
/* globals diagram: false,
           Diagram: false,
           refreshTruthTable: false,
*/

function runTestbench(runTo) {
    'use strict';
    let endTime;
    let evt;
    let executeNext = false;
    let assertNext = false;
    let tv;
    let testVector = 0;
    let p;
    let results = [];
    let startTime;
    let testCases = ["Five-stage inverter",
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
    ];
    runTo = runTo || testCases.length;

    // Set up the testbench
    while(Diagram.layers[diagram.controller.cursorIndex].name !== "metal1") {
        diagram.controller.changeLayer();
    }

    function mapX(x) {return x*diagram.view.cellWidth + diagram.view.canvas.offsetLeft + diagram.view.cellWidth;}
    function mapY(y) {return y*diagram.view.cellHeight + diagram.view.canvas.offsetTop + diagram.view.cellHeight;}

    let events = [
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

        ["mousedown", {button:  0, clientX: mapX(26),  clientY: mapY(2)}],
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

        ["mousedown", {button:  0, clientX: mapX(26),  clientY: mapY(27)}],
        ["mousemove", {button:  1, clientX: mapX(26),  clientY: mapY(28)}],
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

        // Diagram.CONTACTS
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

        ["mousedown", {button:  0, clientX: mapX(26), clientY: mapY(3)}],
        ["mouseup",   {button:  0, clientX: mapX(26), clientY: mapY(3)}],

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

        ["mousedown", {button:  0, clientX: mapX(26), clientY: mapY(27)}],
        ["mouseup",   {button:  0, clientX: mapX(26), clientY: mapY(27)}],

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

        ["mousedown", {button:  0, clientX: mapX(26), clientY: mapY(3)}],
        ["mousemove", {buttons: 1, clientX: mapX(26), clientY: mapY(4)}],
        ["mouseup",   {button:  0, clientX: mapX(26), clientY: mapY(4)}],

        0,

        // NDIFF
        ["mousedown", {button:  0, clientX: mapX(2),  clientY: mapY(25)}],
        ["mousemove", {buttons: 1, clientX: mapX(29), clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(29), clientY: mapY(25)}],

        ["mousedown", {button:  0, clientX: mapX(26), clientY: mapY(26)}],
        ["mousemove", {buttons: 1, clientX: mapX(26), clientY: mapY(27)}],
        ["mouseup",   {button:  0, clientX: mapX(26), clientY: mapY(27)}],

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


        1,

        // Place terminals
        function() {
            diagram.inputs[0].x = 3;
            diagram.inputs[0].y = 14;

            diagram.outputs[0].x = 28;
            diagram.outputs[0].y = 14;

            for(let ii = 1; ii < diagram.inputs.length; ii++) {
                diagram.inputs[ii].x = 0;
                diagram.inputs[ii].y = 0;
            }

            diagram.vddCell.x    = 1;
            diagram.vddCell.y    = 1;
            diagram.gndCell.x    = 1;
            diagram.gndCell.y    = 27;
        },

        // Clean up old contacts from terminals
        ["mousedown", {button:  2, clientX: mapX(1),  clientY: mapY(6)}],
        ["mousemove", {buttons: 2, clientX: mapX(3),  clientY: mapY(24)}],
        ["mouseup",   {button:  2, clientX: mapX(3),  clientY: mapY(24)}],

        2,
        "1010101010101010",

        /* 4-stage buffer */

        1,

        // Place terminals
        function() {
            diagram.outputs[0].x = 23;
            diagram.outputs[0].y = 14;
        },

        2,
        "0101010101010101",

        /* OR-4 */
        ["mousedown", {button:  2, clientX: mapX(3),   clientY: mapY(3)}],
        ["mousemove", {buttons: 2, clientX: mapX(20),  clientY: mapY(4)}],
        ["mouseup",   {button:  2, clientX: mapX(20),  clientY: mapY(4)}],

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
        ["mousedown", {button:  0, clientX: mapX(24), clientY: mapY(25)}],
        ["mousemove", {buttons: 1, clientX: mapX(24), clientY: mapY(27)}],
        ["mouseup",   {button:  0, clientX: mapX(24), clientY: mapY(27)}],

        ["mousedown", {button:  0, clientX: mapX(7),  clientY: mapY(12)}],
        ["mousemove", {buttons: 1, clientX: mapX(7),  clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(7),  clientY: mapY(25)}],

        ["mousedown", {button:  0, clientX: mapX(19), clientY: mapY(12)}],
        ["mousemove", {buttons: 1, clientX: mapX(19), clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(19), clientY: mapY(25)}],

        ["mousedown", {button:  0, clientX: mapX(7),  clientY: mapY(12)}],
        ["mousemove", {buttons: 1, clientX: mapX(24), clientY: mapY(12)}],
        ["mouseup",   {button:  0, clientX: mapX(24), clientY: mapY(12)}],

        0, // Metal2
        0,

        // Diagram.CONTACTS
        ["mousedown", {button:  0, clientX: mapX(7),  clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(7),  clientY: mapY(25)}],

        ["mousedown", {button:  0, clientX: mapX(19), clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(19), clientY: mapY(25)}],

        ["mousedown", {button:  0, clientX: mapX(24),   clientY: mapY(12)}],
        ["mouseup",   {button:  0, clientX: mapX(24),   clientY: mapY(12)}],

        1,

        // Place terminals
        function() {
            diagram.inputs[1].x = 3;
            diagram.inputs[1].y = 14;

            diagram.outputs[0].x = 28;
            diagram.outputs[0].y = 14;

            for(let ii = 1; ii < diagram.inputs.length; ii++) {
                diagram.inputs[ii].x = 3 + 6 * ii;
                diagram.inputs[ii].y = 14;
            }
        },

        2,
        "0111111111111111",

        /* NOR-4 */
        1,

        // Place terminals
        function() {
            diagram.outputs[0].x = 25;
            diagram.outputs[0].y = 14;
        },

        2,
        "1000000000000000",

        /* NAND-4 */
        ["mousedown", {button:  2, clientX: mapX(7),   clientY: mapY(13)}],
        ["mousemove", {buttons: 2, clientX: mapX(7),   clientY: mapY(24)}],
        ["mouseup",   {button:  2, clientX: mapX(7),   clientY: mapY(24)}],

        ["mousedown", {button:  2, clientX: mapX(14),  clientY: mapY(13)}],
        ["mousemove", {buttons: 2, clientX: mapX(14),  clientY: mapY(27)}],
        ["mouseup",   {button:  2, clientX: mapX(14),  clientY: mapY(27)}],

        ["mousedown", {button:  2, clientX: mapX(19),   clientY: mapY(13)}],
        ["mousemove", {buttons: 2, clientX: mapX(19),   clientY: mapY(24)}],
        ["mouseup",   {button:  2, clientX: mapX(19),   clientY: mapY(24)}],

        ["mousedown", {button:  2, clientX: mapX(24),   clientY: mapY(6)}],
        ["mousemove", {buttons: 2, clientX: mapX(24),   clientY: mapY(11)}],
        ["mouseup",   {button:  2, clientX: mapX(24),   clientY: mapY(11)}],

        ["mousedown", {button:  2, clientX: mapX(24),   clientY: mapY(26)}],
        ["mousemove", {buttons: 2, clientX: mapX(24),   clientY: mapY(27)}],
        ["mouseup",   {button:  2, clientX: mapX(24),   clientY: mapY(27)}],

        // Diagram.CONTACTS
        ["mousedown", {button:  0, clientX: mapX(6),   clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(6),   clientY: mapY(5)}],

        ["mousedown", {button:  0, clientX: mapX(13),   clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(13),   clientY: mapY(5)}],

        ["mousedown", {button:  0, clientX: mapX(18),   clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(18),   clientY: mapY(5)}],

        0,

        0,

        // NDIFF
        ["mousedown", {button:  0, clientX: mapX(2),  clientY: mapY(25)}],
        ["mousemove", {buttons: 1, clientX: mapX(24), clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(24), clientY: mapY(25)}],

        0,

        0,

        // METAL
        ["mousedown", {button:  0, clientX: mapX(6),   clientY: mapY(12)}],
        ["mousemove", {buttons: 1, clientX: mapX(6),   clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(6),   clientY: mapY(5)}],

        ["mousedown", {button:  0, clientX: mapX(18),   clientY: mapY(12)}],
        ["mousemove", {buttons: 1, clientX: mapX(18),   clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(18),   clientY: mapY(5)}],

        ["mousedown", {button:  0, clientX: mapX(24),   clientY: mapY(3)}],
        ["mousemove", {buttons: 1, clientX: mapX(24),   clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(24),   clientY: mapY(5)}],

        ["mousedown", {button:  0, clientX: mapX(13),   clientY: mapY(3)}],
        ["mousemove", {buttons: 1, clientX: mapX(13),   clientY: mapY(5)}],
        ["mouseup",   {button:  0, clientX: mapX(13),   clientY: mapY(5)}],

        ["mousedown", {button:  0, clientX: mapX(24),   clientY: mapY(25)}],
        ["mousemove", {buttons: 1, clientX: mapX(24),   clientY: mapY(16)}],
        ["mouseup",   {button:  0, clientX: mapX(24),   clientY: mapY(16)}],

        2,
        "1111111111111110",

        /** AND-4 **/
        1,

        // Place terminals
        function() {
            diagram.outputs[0].x = 28;
            diagram.outputs[0].y = 14;
        },

        2,
        "0000000000000001",

        /* ALWAYS FAIL TEST */
        2,
        "0000000000000011",
        
        /** VDD-Y-GND SHORT **/
        ["mousedown", {button:  2, clientX: mapX(1),   clientY: mapY(3)}],
        ["mousemove", {buttons: 2, clientX: mapX(29),  clientY: mapY(27)}],
        ["mouseup",   {button:  2, clientX: mapX(29),  clientY: mapY(27)}],
        
        // METAL
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

        // Diagram.CONTACTS
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
        "X0X0X0X0X0X0X0X0",

        ["mousedown", {button:  0, clientX: mapX(29), clientY: mapY(4)}],
        ["mouseup",   {button:  0, clientX: mapX(29), clientY: mapY(4)}],

        ["mousedown", {button:  2, clientX: mapX(29), clientY: mapY(26)}],
        ["mouseup",   {button:  2, clientX: mapX(29), clientY: mapY(26)}],
        
        2,
        "1X1X1X1X1X1X1X1X",

        /* Various open circuits */
        ["mousedown", {button:  2, clientX: mapX(2),  clientY: mapY(26)}],
        ["mouseup",   {button:  2, clientX: mapX(2),  clientY: mapY(26)}],

        ["mousedown", {button:  2, clientX: mapX(29), clientY: mapY(4)}],
        ["mouseup",   {button:  2, clientX: mapX(29), clientY: mapY(4)}],
        
        2,
        "1Z1Z1Z1Z1Z1Z1Z1Z",

        ["mousedown", {button:  0, clientX: mapX(2),  clientY: mapY(26)}],
        ["mouseup",   {button:  0, clientX: mapX(2),  clientY: mapY(26)}],

        ["mousedown", {button:  2, clientX: mapX(2),  clientY: mapY(4)}],
        ["mouseup",   {button:  2, clientX: mapX(2),  clientY: mapY(4)}],
        
        2,
        "Z0Z0Z0Z0Z0Z0Z0Z0",

        ["mousedown", {button:  2, clientX: mapX(2),  clientY: mapY(26)}],
        ["mouseup",   {button:  2, clientX: mapX(2),  clientY: mapY(26)}],

        2,
        "ZZZZZZZZZZZZZZZZ",

        /* Direct Inputs */
        1,

        // Place terminal A
        function() {
            diagram.inputs[0].x = 8;
            diagram.inputs[0].y = 4;
        },

        2,
        "0101010101010101",

        1,

        // Place terminal B
        function() {
            diagram.inputs[1].x = 20;
            diagram.inputs[1].y = 4;
        },

        2,
        "0XX10XX10XX10XX1",

        1,

        // Place terminal C
        function() {
            diagram.inputs[2].x = 8;
            diagram.inputs[2].y = 24;
        },

        2,
        "0XXXXXX10XXXXXX1",

        1,

        // Place terminal D
        function() {
            diagram.inputs[3].x = 20;
            diagram.inputs[3].y = 24;
        },

        2,
        "0XXXXXXXXXXXXXX1",

        /** A & B & (C | D) **/
        1,
        function() {
            diagram.inputs[0].x  = 2;
            diagram.inputs[0].y  = 13;
            diagram.inputs[1].x  = 6;
            diagram.inputs[1].y  = 13;
            diagram.inputs[2].x  = 16;
            diagram.inputs[2].y  = 13;
            diagram.inputs[3].x  = 20;
            diagram.inputs[3].y  = 13;
            diagram.outputs[0].x = 28;
            diagram.outputs[0].y = 13;
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
        // Diagram.CONTACTS
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
        "0000000100010001",

        0,

        /** AOI4 **/
        1,
        function() {
            diagram.inputs[0].x  = 5;
            diagram.inputs[0].y  = 8;
            diagram.inputs[1].x  = 9;
            diagram.inputs[1].y  = 8;
            diagram.inputs[2].x  = 15;
            diagram.inputs[2].y  = 8;
            diagram.inputs[3].x  = 19;
            diagram.inputs[3].y  = 8;
            diagram.outputs[0].x = 3;
            diagram.outputs[0].y = 21;
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

        // Diagram.CONTACT
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
            diagram.outputs[0].x = 15;
            diagram.outputs[0].y = 24;
        },

        2,
        "000000000000111Z",

        /** SR Latch **/
        1,
        function() {
            diagram.inputs[1].x  = 19;
            diagram.inputs[1].y  = 8;
            diagram.inputs[2].x  = 25;
            diagram.inputs[2].y  = 8;
            diagram.inputs[3].x  = 25;
            diagram.inputs[3].y  = 8;
            diagram.outputs[0].x = 11;
            diagram.outputs[0].y = 8;
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
        "101Z101Z101Z101Z",

        /** SR Latch Q' **/
        1,
        function() {
            diagram.outputs[0].x = 13;
            diagram.outputs[0].y = 7;
        },

        2,
        "110Z110Z110Z110Z",

        /** D FLIP FLOP **/
        // Automatically captured input
        // Clear the canvas
        ["mousedown", {button:  2, clientX: mapX(1),   clientY: mapY(1)}],
        ["mousemove", {buttons: 2, clientX: mapX(29),  clientY: mapY(29)}],
        ["mouseup",   {button:  2, clientX: mapX(29),  clientY: mapY(29)}],
		["mousedown",{"button":0,"clientX":436,"clientY":136},],
		["mouseup",{"button":0,"clientX":436,"clientY":136},],
		["mousedown",{"button":0,"clientX":438,"clientY":162},],
		["mouseup",{"button":0,"clientX":438,"clientY":162},],
		["mousedown",{"button":0,"clientX":421,"clientY":267},],
		["mouseup",{"button":0,"clientX":421,"clientY":267},],
		["mousedown",{"button":0,"clientX":414,"clientY":338},],
		["mouseup",{"button":0,"clientX":414,"clientY":338},],
		["mousedown",{"button":0,"clientX":492,"clientY":234},],
		["mouseup",{"button":0,"clientX":492,"clientY":234},],
		["mousedown",{"button":0,"clientX":544,"clientY":135},],
		["mouseup",{"button":0,"clientX":544,"clientY":135},],
		["mousedown",{"button":0,"clientX":641,"clientY":140},],
		["mouseup",{"button":0,"clientX":641,"clientY":140},],
		["mousedown",{"button":0,"clientX":641,"clientY":168},],
		["mouseup",{"button":0,"clientX":641,"clientY":168},],
		["mousedown",{"button":0,"clientX":637,"clientY":260},],
		["mouseup",{"button":0,"clientX":637,"clientY":260},],
		["mousedown",{"button":0,"clientX":586,"clientY":288},],
		["mouseup",{"button":0,"clientX":586,"clientY":288},],
		["mousedown",{"button":0,"clientX":544,"clientY":61},],
		["mouseup",{"button":0,"clientX":544,"clientY":61},],
		["mousedown",{"button":0,"clientX":718,"clientY":134},],
		["mouseup",{"button":0,"clientX":718,"clientY":134},],
		["mousedown",{"button":0,"clientX":718,"clientY":158},],
		["mouseup",{"button":0,"clientX":718,"clientY":158},],
		["mousedown",{"button":0,"clientX":723,"clientY":263},],
		["mouseup",{"button":0,"clientX":723,"clientY":263},],
		["mousedown",{"button":0,"clientX":764,"clientY":292},],
		["mouseup",{"button":0,"clientX":764,"clientY":292},],
		["mousedown",{"button":0,"clientX":817,"clientY":143},],
		["mouseup",{"button":0,"clientX":817,"clientY":143},],
		["mousedown",{"button":0,"clientX":825,"clientY":70},],
		["mouseup",{"button":0,"clientX":825,"clientY":70},],
		["mousedown",{"button":0,"clientX":870,"clientY":110},],
		["mouseup",{"button":0,"clientX":870,"clientY":110},],
		["mousedown",{"button":0,"clientX":944,"clientY":140},],
		["mouseup",{"button":0,"clientX":944,"clientY":140},],
		["mousedown",{"button":0,"clientX":944,"clientY":160},],
		["mouseup",{"button":0,"clientX":944,"clientY":160},],
		["mousedown",{"button":0,"clientX":938,"clientY":259},],
		["mouseup",{"button":0,"clientX":938,"clientY":259},],
		["mousedown",{"button":0,"clientX":942,"clientY":335},],
		["mouseup",{"button":0,"clientX":942,"clientY":335},],
		["mousedown",{"button":0,"clientX":817,"clientY":333},],
		["mousemove",{"buttons":1,"clientX":817,"clientY":388},],
		["mouseup",{"button":0,"clientX":817,"clientY":388},],
		["mousedown",{"button":2,"clientX":817,"clientY":367},],
		["mousemove",{"buttons":2,"clientX":817,"clientY":340},],
		["mouseup",{"button":2,"clientX":817,"clientY":340},],
		["mousedown",{"button":0,"clientX":1016,"clientY":262},],
		["mouseup",{"button":0,"clientX":1016,"clientY":262},],
		["mousedown",{"button":0,"clientX":1022,"clientY":238},],
		["mouseup",{"button":0,"clientX":1022,"clientY":238},],
		["mousedown",{"button":0,"clientX":1023,"clientY":135},],
		["mouseup",{"button":0,"clientX":1023,"clientY":135},],
		["mousedown",{"button":0,"clientX":1067,"clientY":106},],
		["mouseup",{"button":0,"clientX":1067,"clientY":106},],
		["mousedown",{"button":0,"clientX":1066,"clientY":188},],
		["mouseup",{"button":0,"clientX":1066,"clientY":188},],
		["mousedown",{"button":0,"clientX":1116,"clientY":131},],
		["mouseup",{"button":0,"clientX":1116,"clientY":131},],
		["mousedown",{"button":0,"clientX":1123,"clientY":62},],
		["mouseup",{"button":0,"clientX":1123,"clientY":62},],
		["mousedown",{"button":0,"clientX":1116,"clientY":260},],
		["mouseup",{"button":0,"clientX":1116,"clientY":260},],
		["mousedown",{"button":0,"clientX":1119,"clientY":336},],
		["mouseup",{"button":0,"clientX":1119,"clientY":336},],
		["mousedown",{"button":0,"clientX":541,"clientY":386},],
		["mouseup",{"button":0,"clientX":541,"clientY":386},],
		["mousedown",{"button":0,"clientX":417,"clientY":460},],
		["mousemove",{"buttons":1,"clientX":416,"clientY":483},],
		["mouseup",{"button":0,"clientX":416,"clientY":483},],
		["mousedown",{"button":0,"clientX":544,"clientY":471},],
		["mouseup",{"button":0,"clientX":544,"clientY":471},],
		["mousedown",{"button":0,"clientX":642,"clientY":467},],
		["mousemove",{"buttons":1,"clientX":640,"clientY":482},],
		["mouseup",{"button":0,"clientX":640,"clientY":482},],
		["mousedown",{"button":0,"clientX":721,"clientY":466},],
		["mousemove",{"buttons":1,"clientX":721,"clientY":480},],
		["mouseup",{"button":0,"clientX":721,"clientY":480},],
		["mousedown",{"button":0,"clientX":822,"clientY":460},],
		["mouseup",{"button":0,"clientX":822,"clientY":460},],
		["mousedown",{"button":0,"clientX":947,"clientY":466},],
		["mousemove",{"buttons":1,"clientX":947,"clientY":480},],
		["mouseup",{"button":0,"clientX":947,"clientY":480},],
		["mousedown",{"button":0,"clientX":948,"clientY":587},],
		["mouseup",{"button":0,"clientX":948,"clientY":587},],
		["mousedown",{"button":0,"clientX":946,"clientY":665},],
		["mouseup",{"button":0,"clientX":946,"clientY":665},],
		["mousedown",{"button":0,"clientX":1114,"clientY":669},],
		["mouseup",{"button":0,"clientX":1114,"clientY":669},],
		["mousedown",{"button":0,"clientX":720,"clientY":587},],
		["mousemove",{"buttons":1,"clientX":719,"clientY":605},],
		["mouseup",{"button":0,"clientX":719,"clientY":605},],
		["mousedown",{"button":0,"clientX":646,"clientY":565},],
		["mousemove",{"buttons":1,"clientX":646,"clientY":588},],
		["mouseup",{"button":0,"clientX":646,"clientY":588},],
		["mousedown",{"button":0,"clientX":496,"clientY":614},],
		["mouseup",{"button":0,"clientX":496,"clientY":614},],
		["mousedown",{"button":0,"clientX":417,"clientY":590},],
		["mouseup",{"button":0,"clientX":417,"clientY":590},],
		["mousedown",{"button":0,"clientX":414,"clientY":664},],
		["mouseup",{"button":0,"clientX":414,"clientY":664},],
		["mousedown",{"button":2,"clientX":473,"clientY":666},],
		["mouseup",{"button":2,"clientX":473,"clientY":666},],
		["mousedown",{"button":0,"clientX":642,"clientY":135},],
		["mousemove",{"buttons":1,"clientX":420,"clientY":132},],
		["mouseup",{"button":0,"clientX":420,"clientY":132},],
		["mousedown",{"button":0,"clientX":719,"clientY":135},],
		["mousemove",{"buttons":1,"clientX":941,"clientY":132},],
		["mouseup",{"button":0,"clientX":941,"clientY":132},],
		["mousedown",{"button":0,"clientX":1015,"clientY":134},],
		["mousemove",{"buttons":1,"clientX":1111,"clientY":140},],
		["mouseup",{"button":0,"clientX":1111,"clientY":140},],
		["mousedown",{"button":0,"clientX":423,"clientY":464},],
		["mousemove",{"buttons":1,"clientX":648,"clientY":467},],
		["mouseup",{"button":0,"clientX":648,"clientY":467},],
		["mousedown",{"button":0,"clientX":719,"clientY":468},],
		["mousemove",{"buttons":1,"clientX":940,"clientY":462},],
		["mouseup",{"button":0,"clientX":940,"clientY":462},],
		["mousedown",{"button":2,"clientX":910,"clientY":408},],
		["mouseup",{"button":2,"clientX":910,"clientY":408},],
		["mousedown",{"button":0,"clientX":637,"clientY":265},],
		["mousemove",{"buttons":1,"clientX":419,"clientY":263},],
		["mouseup",{"button":0,"clientX":419,"clientY":263},],
		["mousedown",{"button":0,"clientX":722,"clientY":264},],
		["mousemove",{"buttons":1,"clientX":939,"clientY":264},],
		["mouseup",{"button":0,"clientX":939,"clientY":264},],
		["mousedown",{"button":0,"clientX":1016,"clientY":258},],
		["mousemove",{"buttons":1,"clientX":1113,"clientY":268},],
		["mouseup",{"button":0,"clientX":1113,"clientY":268},],
		["mousedown",{"button":0,"clientX":722,"clientY":592},],
		["mousemove",{"buttons":1,"clientX":936,"clientY":592},],
		["mouseup",{"button":0,"clientX":936,"clientY":592},],
		["mousedown",{"button":0,"clientX":636,"clientY":591},],
		["mousemove",{"buttons":1,"clientX":414,"clientY":592},],
		["mouseup",{"button":0,"clientX":414,"clientY":592},],
		["mousedown",{"button":2,"clientX":535,"clientY":529},],
		["mouseup",{"button":2,"clientX":535,"clientY":529},],
		["mousedown",{"button":0,"clientX":488,"clientY":292},],
		["mousemove",{"buttons":1,"clientX":488,"clientY":104},],
		["mouseup",{"button":0,"clientX":488,"clientY":104},],
		["mousedown",{"button":0,"clientX":597,"clientY":113},],
		["mousemove",{"buttons":1,"clientX":596,"clientY":279},],
		["mouseup",{"button":0,"clientX":596,"clientY":279},],
		["mousedown",{"button":0,"clientX":770,"clientY":112},],
		["mousemove",{"buttons":1,"clientX":768,"clientY":294},],
		["mouseup",{"button":0,"clientX":768,"clientY":294},],
		["mousedown",{"button":0,"clientX":872,"clientY":108},],
		["mousemove",{"buttons":1,"clientX":867,"clientY":294},],
		["mouseup",{"button":0,"clientX":867,"clientY":294},],
		["mousedown",{"button":0,"clientX":1072,"clientY":105},],
		["mousemove",{"buttons":1,"clientX":1070,"clientY":279},],
		["mouseup",{"button":0,"clientX":1070,"clientY":279},],
		["mousedown",{"button":0,"clientX":585,"clientY":615},],
		["mousemove",{"buttons":1,"clientX":588,"clientY":372},],
		["mouseup",{"button":0,"clientX":588,"clientY":372},],
		["mousedown",{"button":0,"clientX":589,"clientY":367},],
		["mousemove",{"buttons":1,"clientX":635,"clientY":361},],
		["mouseup",{"button":0,"clientX":635,"clientY":361},],
		["mousedown",{"button":0,"clientX":635,"clientY":361},],
		["mousemove",{"buttons":1,"clientX":638,"clientY":266},],
		["mouseup",{"button":0,"clientX":638,"clientY":266},],
		["mousedown",{"button":0,"clientX":767,"clientY":613},],
		["mousemove",{"buttons":1,"clientX":757,"clientY":364},],
		["mouseup",{"button":0,"clientX":757,"clientY":364},],
		["mousedown",{"button":0,"clientX":757,"clientY":364},],
		["mousemove",{"buttons":1,"clientX":720,"clientY":371},],
		["mouseup",{"button":0,"clientX":720,"clientY":371},],
		["mousedown",{"button":0,"clientX":720,"clientY":371},],
		["mousemove",{"buttons":1,"clientX":717,"clientY":256},],
		["mouseup",{"button":0,"clientX":717,"clientY":256},],
		["mousedown",{"button":0,"clientX":897,"clientY":438},],
		["mousemove",{"buttons":1,"clientX":898,"clientY":610},],
		["mouseup",{"button":0,"clientX":898,"clientY":610},],
		["mousedown",{"button":2,"clientX":1054,"clientY":526},],
		["mouseup",{"button":2,"clientX":1054,"clientY":526},],
		["mousedown",{"button":0,"clientX":422,"clientY":62},],
		["mousemove",{"buttons":1,"clientX":1116,"clientY":63},],
		["mouseup",{"button":0,"clientX":1116,"clientY":63},],
		["mousedown",{"button":0,"clientX":864,"clientY":112},],
		["mousemove",{"buttons":1,"clientX":1068,"clientY":115},],
		["mouseup",{"button":0,"clientX":1068,"clientY":115},],
		["mousedown",{"button":0,"clientX":443,"clientY":156},],
		["mousemove",{"buttons":1,"clientX":639,"clientY":168},],
		["mouseup",{"button":0,"clientX":639,"clientY":168},],
		["mousedown",{"button":0,"clientX":494,"clientY":236},],
		["mousemove",{"buttons":1,"clientX":1014,"clientY":236},],
		["mouseup",{"button":0,"clientX":1014,"clientY":236},],
		["mousedown",{"button":0,"clientX":942,"clientY":162},],
		["mousemove",{"buttons":1,"clientX":712,"clientY":159},],
		["mouseup",{"button":0,"clientX":712,"clientY":159},],
		["mousedown",{"button":0,"clientX":589,"clientY":293},],
		["mousemove",{"buttons":1,"clientX":761,"clientY":294},],
		["mouseup",{"button":0,"clientX":761,"clientY":294},],
		["mousedown",{"button":0,"clientX":414,"clientY":335},],
		["mousemove",{"buttons":1,"clientX":1110,"clientY":336},],
		["mouseup",{"button":0,"clientX":1110,"clientY":336},],
		["mousedown",{"button":0,"clientX":822,"clientY":387},],
		["mousemove",{"buttons":1,"clientX":402,"clientY":386},],
		["mouseup",{"button":0,"clientX":402,"clientY":386},],
		["mousedown",{"button":0,"clientX":412,"clientY":388},],
		["mousemove",{"buttons":1,"clientX":817,"clientY":388},],
		["mouseup",{"button":0,"clientX":817,"clientY":388},],
		["mousedown",{"button":0,"clientX":641,"clientY":492},],
		["mousemove",{"buttons":1,"clientX":418,"clientY":485},],
		["mouseup",{"button":0,"clientX":418,"clientY":485},],
		["mousedown",{"button":0,"clientX":723,"clientY":493},],
		["mousemove",{"buttons":1,"clientX":944,"clientY":498},],
		["mouseup",{"button":0,"clientX":944,"clientY":498},],
		["mousedown",{"button":0,"clientX":645,"clientY":565},],
		["mousemove",{"buttons":1,"clientX":885,"clientY":554},],
		["mouseup",{"button":0,"clientX":885,"clientY":554},],
		["mousedown",{"button":0,"clientX":414,"clientY":666},],
		["mousemove",{"buttons":1,"clientX":1117,"clientY":661},],
		["mouseup",{"button":0,"clientX":1117,"clientY":661},],
		["mousedown",{"button":2,"clientX":1082,"clientY":586},],
		["mouseup",{"button":2,"clientX":1082,"clientY":586},],
		["mousedown",{"button":0,"clientX":420,"clientY":592},],
		["mousemove",{"buttons":1,"clientX":417,"clientY":662},],
		["mouseup",{"button":0,"clientX":417,"clientY":662},],
		["mousedown",{"button":0,"clientX":417,"clientY":453},],
		["mousemove",{"buttons":1,"clientX":417,"clientY":487},],
		["mouseup",{"button":0,"clientX":417,"clientY":487},],
		["mousedown",{"button":0,"clientX":644,"clientY":458},],
		["mousemove",{"buttons":1,"clientX":647,"clientY":584},],
		["mouseup",{"button":0,"clientX":647,"clientY":584},],
		["mousedown",{"button":0,"clientX":714,"clientY":433},],
		["mousemove",{"buttons":1,"clientX":727,"clientY":615},],
		["mouseup",{"button":0,"clientX":727,"clientY":615},],
		["mousedown",{"button":0,"clientX":948,"clientY":466},],
		["mousemove",{"buttons":1,"clientX":944,"clientY":488},],
		["mouseup",{"button":0,"clientX":944,"clientY":488},],
		["mousedown",{"button":0,"clientX":949,"clientY":581},],
		["mousemove",{"buttons":1,"clientX":936,"clientY":655},],
		["mouseup",{"button":0,"clientX":936,"clientY":655},],
		["mousedown",{"button":0,"clientX":543,"clientY":394},],
		["mousemove",{"buttons":1,"clientX":542,"clientY":464},],
		["mouseup",{"button":0,"clientX":542,"clientY":464},],
		["mousedown",{"button":0,"clientX":1124,"clientY":257},],
		["mousemove",{"buttons":1,"clientX":1114,"clientY":666},],
		["mouseup",{"button":0,"clientX":1114,"clientY":666},],
		["mousedown",{"button":0,"clientX":944,"clientY":259},],
		["mousemove",{"buttons":1,"clientX":945,"clientY":330},],
		["mouseup",{"button":0,"clientX":945,"clientY":330},],
		["mousedown",{"button":0,"clientX":413,"clientY":263},],
		["mousemove",{"buttons":1,"clientX":413,"clientY":338},],
		["mouseup",{"button":0,"clientX":413,"clientY":338},],
		["mousedown",{"button":0,"clientX":641,"clientY":133},],
		["mousemove",{"buttons":1,"clientX":644,"clientY":269},],
		["mouseup",{"button":0,"clientX":644,"clientY":269},],
		["mousedown",{"button":0,"clientX":724,"clientY":130},],
		["mousemove",{"buttons":1,"clientX":719,"clientY":263},],
		["mouseup",{"button":0,"clientX":719,"clientY":263},],
		["mousedown",{"button":0,"clientX":544,"clientY":60},],
		["mousemove",{"buttons":1,"clientX":550,"clientY":137},],
		["mouseup",{"button":0,"clientX":550,"clientY":137},],
		["mousedown",{"button":0,"clientX":436,"clientY":132},],
		["mousemove",{"buttons":1,"clientX":436,"clientY":159},],
		["mouseup",{"button":0,"clientX":436,"clientY":159},],
		["mousedown",{"button":0,"clientX":946,"clientY":139},],
		["mousemove",{"buttons":1,"clientX":945,"clientY":165},],
		["mouseup",{"button":0,"clientX":945,"clientY":165},],
		["mousedown",{"button":0,"clientX":823,"clientY":72},],
		["mousemove",{"buttons":1,"clientX":829,"clientY":142},],
		["mouseup",{"button":0,"clientX":829,"clientY":142},],
		["mousedown",{"button":0,"clientX":1123,"clientY":67},],
		["mousemove",{"buttons":1,"clientX":1117,"clientY":138},],
		["mouseup",{"button":0,"clientX":1117,"clientY":138},],
		["mousedown",{"button":0,"clientX":1022,"clientY":131},],
		["mousemove",{"buttons":1,"clientX":1022,"clientY":258},],
		["mouseup",{"button":0,"clientX":1022,"clientY":258},],
		["mousedown",{"button":2,"clientX":1018,"clientY":378},],
		["mouseup",{"button":2,"clientX":1018,"clientY":378},],
		["mousedown",{"button":0,"clientX":894,"clientY":560},],
		["mouseup",{"button":0,"clientX":894,"clientY":560},],
		["mousedown",{"button":2,"clientX":501,"clientY":509},],
		["mouseup",{"button":2,"clientX":501,"clientY":509},],
		["mousedown",{"button":2,"clientX":501,"clientY":509},],
		["mouseup",{"button":2,"clientX":501,"clientY":509},],
		["mousedown",{"button":2,"clientX":501,"clientY":509},],
		["mouseup",{"button":2,"clientX":501,"clientY":509},],
		["mousedown",{"button":0,"clientX":485,"clientY":438},],
		["mousemove",{"buttons":1,"clientX":486,"clientY":613},],
		["mouseup",{"button":0,"clientX":486,"clientY":613},],
		["mousedown",{"button":2,"clientX":549,"clientY":629},],
		["mouseup",{"button":2,"clientX":549,"clientY":629},],
        ["mousedown",{"button":0,"clientX":489,"clientY":612},],
        ["mousemove",{"buttons":1,"clientX":714,"clientY":612},],
        ["mouseup",{"button":0,"clientX":714,"clientY":612},],
        ["mousedown",{"button":2,"clientX":746,"clientY":637},],
        ["mouseup",{"button":2,"clientX":746,"clientY":637},],
        ["mousedown",{"button":0,"clientX":819,"clientY":465},],
        ["mousemove",{"buttons":1,"clientX":812,"clientY":134},],
        ["mouseup",{"button":0,"clientX":812,"clientY":134},],

        1,
        function() {
            diagram.inputs[0].x  = 26;
            diagram.inputs[0].y  = 6;
            diagram.inputs[1].x  = 7;
            diagram.inputs[1].y  = 6;
            diagram.inputs[2].x  = 28;
            diagram.inputs[2].y  = 28;
            diagram.inputs[3].x  = 28;
            diagram.inputs[3].y  = 28;
            diagram.outputs[0].x = 12;
            diagram.outputs[0].y = 16;
            diagram.gndCell.x    = 1;
            diagram.gndCell.y    = 25;
        },

        2,
        "ZZ01ZZ01ZZ01ZZ01",
   ];

    /** RUN TESTBENCH **/
    startTime = Date.now();
    for(let ii = 0; ii < events.length && testVector < runTo; ii++) {
        if(events[ii] === 0) {
            diagram.controller.changeLayer();
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

        if(executeNext) {
            events[ii]();
            executeNext = false;
        } else {
            evt = new MouseEvent(events[ii][0], {
                view: window,
                bubbles: true,
                cancelable: true,
                ...events[ii][1]
            });
            document.getElementById('canvas-container').dispatchEvent(evt);
        }

        if(assertNext) {
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

            // Do it.
            diagram.setNets();
            tv = "";
            
            for(let ii = 0; ii < diagram.outputs.length; ii++) {
                for(let jj = 0; jj < Math.pow(2, diagram.inputs.length); jj++) {
                    tv += diagram.computeOutput(jj, diagram.outputNodes[ii]);
                }
            }
        
            results[testVector] = tv === events[ii];
            testVector++;

            assertNext = false;
        }
    }
    endTime = Date.now();
    refreshTruthTable();

    // Only overwrite the results if all tests were run.
    if(runTo < testCases.length) {
        return;
    }

    // Clear #instructions-text and replace its contents with the elapsed time
    document.getElementById("instructions-text").innerHTML = "";
    p = document.createElement("p");
    p.innerHTML = `<b>Elapsed time:</b> ${endTime - startTime}ms`;
    document.getElementById("instructions-text").appendChild(p);
    document.getElementById("instructions-text").appendChild(document.createElement("br"));

    // Add indidual test results to #instructions-text as PASS or FAIL
    // Label with their test case names.
    results.forEach(function(result, index) {
        p = document.createElement("p");
        p.innerHTML = `<span style="cursor:pointer" onclick="runTestbench(${index + 1})"><b>Test ${index}:</b> ${testCases[index]}</span>`;
        p.innerHTML += `<b style='float:right;color:${result ? "green'>PASS" : "red'>FAIL"}</b>`;
        document.getElementById("instructions-text").appendChild(p);
    });
}