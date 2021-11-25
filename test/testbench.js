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
/* globals cellWidth: false,
           canvas: false,
           cellHeight: false,
           inputs: false,
           outputs: false,
           changeLayer: false,
           setNets: false,
           computeOutput: false,
           outputNodes: false
           cursorColorIndex: false,
           METAL1: false,
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
                    "Short-circuit #1",
                    "Short-circuit #2",
                    "Short-circuit #3",
                    "Short-circuit #4",
                    "Short-circuit #5",
                    "Short-circuit #6",
                    "Open-circuit #1",
                    "Open-circuit #2",
                    "Open-circuit #3",
                    "Direct input #1:",
                    "Direct input #2:",
                    "Direct input #3:",
                    "Direct input #4:",
                    "A*B*(C+D)",
                    "AOI4"
    ];
    runTo = runTo || testCases.length;

    // Set up the testbench
    while(cursorColorIndex !== METAL1) {
        changeLayer();
    }

    function mapX(x) {return x*cellWidth + canvas.offsetLeft + cellWidth;}
    function mapY(y) {return y*cellHeight + canvas.offsetTop + cellHeight;}

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
            inputs[0].x = 3;
            inputs[0].y = 14;

            outputs[0].x = 28;
            outputs[0].y = 14;

            for(let ii = 1; ii < inputs.length; ii++) {
                inputs[ii].x = 0;
                inputs[ii].y = 0;
            }
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
            outputs[0].x = 23;
            outputs[0].y = 14;
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

        // CONTACTS
        ["mousedown", {button:  0, clientX: mapX(7),  clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(7),  clientY: mapY(25)}],

        ["mousedown", {button:  0, clientX: mapX(19), clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(19), clientY: mapY(25)}],

        ["mousedown", {button:  0, clientX: mapX(24),   clientY: mapY(12)}],
        ["mouseup",   {button:  0, clientX: mapX(24),   clientY: mapY(12)}],

        1,

        // Place terminals
        function() {
            inputs[1].x = 3;
            inputs[1].y = 14;

            outputs[0].x = 28;
            outputs[0].y = 14;

            for(let ii = 1; ii < inputs.length; ii++) {
                inputs[ii].x = 3 + 6 * ii;
                inputs[ii].y = 14;
            }
        },

        2,
        "0111111111111111",

        /* NOR-4 */
        1,

        // Place terminals
        function() {
            outputs[0].x = 25;
            outputs[0].y = 14;
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

        // CONTACTS
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
            outputs[0].x = 28;
            outputs[0].y = 14;
        },

        2,
        "0000000000000001",
        
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
            inputs[0].x = 8;
            inputs[0].y = 4;
        },

        2,
        "0101010101010101",

        1,

        // Place terminal B
        function() {
            inputs[1].x = 20;
            inputs[1].y = 4;
        },

        2,
        "0XX10XX10XX10XX1",

        1,

        // Place terminal C
        function() {
            inputs[2].x = 8;
            inputs[2].y = 24;
        },

        2,
        "0XXXXXX10XXXXXX1",

        1,

        // Place terminal D
        function() {
            inputs[3].x = 20;
            inputs[3].y = 24;
        },

        2,
        "0XXXXXXXXXXXXXX1",

        /** A & B & (C | D) **/
        1,
        function() {
            inputs[0].x  = 2;
            inputs[0].y  = 13;
            inputs[1].x  = 6;
            inputs[1].y  = 13;
            inputs[2].x  = 16;
            inputs[2].y  = 13;
            inputs[3].x  = 20;
            inputs[3].y  = 13;
            outputs[0].x = 28;
            outputs[0].y = 13;
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
        "0000000100010001",

        0,

        /** AOI4 **/
        1,
        function() {
            inputs[0].x  = 6;
            inputs[0].y  = 9;
            inputs[1].x  = 10;
            inputs[1].y  = 9;
            inputs[2].x  = 16;
            inputs[2].y  = 9;
            inputs[3].x  = 20;
            inputs[3].y  = 9;
            outputs[0].x = 21;
            outputs[0].y = 9;
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
        ["mousemove", {buttons: 1, clientX: mapX(25), clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(25), clientY: mapY(28)}],

        ["mousedown", {button:  0, clientX: mapX(29), clientY: mapY(2)}],
        ["mousemove", {buttons: 1, clientX: mapX(29), clientY: mapY(16)}],
        ["mouseup",   {button:  0, clientX: mapX(29), clientY: mapY(16)}],

        0,

        // CONTACT
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

        ["mousedown", {button:  0, clientX: mapX(18), clientY: mapY(19)}],
        ["mouseup",   {button:  0, clientX: mapX(18), clientY: mapY(19)}],

        ["mousedown", {button:  0, clientX: mapX(18), clientY: mapY(16)}],
        ["mouseup",   {button:  0, clientX: mapX(18), clientY: mapY(16)}],

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

        ["mousedown", {button:  0, clientX: mapX(25), clientY: mapY(21)}],
        ["mouseup",   {button:  0, clientX: mapX(25), clientY: mapY(21)}],

        ["mousedown", {button:  0, clientX: mapX(25), clientY: mapY(19)}],
        ["mouseup",   {button:  0, clientX: mapX(25), clientY: mapY(19)}],

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
   ];

    /** RUN TESTBENCH **/
    startTime = Date.now();
    for(let ii = 0; ii < events.length && testVector < runTo; ii++) {
        if(events[ii] === 0) {
            changeLayer();
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
            window.dispatchEvent(evt);
        }

        if(assertNext) {
            setNets();
            tv = "";
            
            for(let ii = 0; ii < outputs.length; ii++) {
                for(let jj = 0; jj < Math.pow(2, inputs.length); jj++) {
                    tv += computeOutput(jj, outputNodes[ii]);
                }
            }
        
            results[testVector] = tv === events[ii];
            testVector++;

            assertNext = false;
        }
    }
    endTime = Date.now();

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