/* jshint bitwise: true */
/* jshint curly: true */
/* jshint eqeqeq: true */
/* jshint esversion: 9 */
/* jshint forin: true */
/* jshint freeze: true */
/* jshint futurehostile: true */
/* jshint leanswitch: true */
/* jshint maxcomplexity: 10 */
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
*/

function runTestbench() {
    'use strict';
    let evt;
    let executeNext = false;
    let assertNext = false;
    let tv;
    let testVector = 0;

    function mapX(x) {return x*cellWidth + canvas.offsetLeft + cellWidth;}
    function mapY(y) {return y*cellHeight + canvas.offsetTop + cellHeight;}

    let events = [
        /* 5-stage inverter */
        // VDD/GND rails.
        ["mousedown", {button:  0, clientX: mapX(2),  clientY: mapY(2)}],
        ["mousemove", {buttons: 1, clientX: mapX(28), clientY: mapY(2)}],
        ["mouseup",   {button:  0, clientX: mapX(28), clientY: mapY(2)}],

        ["mousedown", {button:  0, clientX: mapX(2),  clientY: mapY(28)}],
        ["mousemove", {buttons: 1, clientX: mapX(28), clientY: mapY(28)}],
        ["mouseup",   {button:  0, clientX: mapX(28), clientY: mapY(28)}],

        0,

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

        ["mousedown", {button:  2, clientX: mapX(7),  clientY: mapY(4)}],
        ["mousemove", {buttons: 2, clientX: mapX(7),  clientY: mapY(26)}],
        ["mouseup",   {button:  2, clientX: mapX(7),  clientY: mapY(26)}],

        ["mousedown", {button:  0, clientX: mapX(10),  clientY: mapY(4)}],
        ["mousemove", {buttons: 1, clientX: mapX(10),  clientY: mapY(26)}],
        ["mouseup",   {button:  0, clientX: mapX(10),  clientY: mapY(26)}],

        ["mousedown", {button:  2, clientX: mapX(13),  clientY: mapY(4)}],
        ["mousemove", {buttons: 2, clientX: mapX(13),  clientY: mapY(26)}],
        ["mouseup",   {button:  2, clientX: mapX(13),  clientY: mapY(26)}],

        ["mousedown", {button:  0, clientX: mapX(16),  clientY: mapY(4)}],
        ["mousemove", {buttons: 1, clientX: mapX(16),  clientY: mapY(26)}],
        ["mouseup",   {button:  0, clientX: mapX(16),  clientY: mapY(26)}],

        ["mousedown", {button:  2, clientX: mapX(19),  clientY: mapY(4)}],
        ["mousemove", {buttons: 2, clientX: mapX(19),  clientY: mapY(26)}],
        ["mouseup",   {button:  2, clientX: mapX(19),  clientY: mapY(26)}],

        ["mousedown", {button:  0, clientX: mapX(22),  clientY: mapY(4)}],
        ["mousemove", {buttons: 1, clientX: mapX(22),  clientY: mapY(26)}],
        ["mouseup",   {button:  0, clientX: mapX(22),  clientY: mapY(26)}],

        ["mousedown", {button:  2, clientX: mapX(25),  clientY: mapY(4)}],
        ["mousemove", {buttons: 2, clientX: mapX(25),  clientY: mapY(26)}],
        ["mouseup",   {button:  2, clientX: mapX(25),  clientY: mapY(26)}],

        ["mousedown", {button:  0, clientX: mapX(27),  clientY: mapY(4)}],
        ["mousemove", {buttons: 1, clientX: mapX(27),  clientY: mapY(26)}],
        ["mouseup",   {button:  0, clientX: mapX(27),  clientY: mapY(26)}],

        0,

        // METAL
        // VDD to PDIFF
        ["mousedown", {button:  0, clientX: mapX(2),   clientY: mapY(5)}],
        ["mousemove", {buttons: 1, clientX: mapX(2),   clientY: mapY(3)}],
        ["mouseup",   {button:  0, clientX: mapX(2),   clientY: mapY(3)}],

        ["mousedown", {button:  0, clientX: mapX(8),   clientY: mapY(5)}],
        ["mousemove", {buttons: 1, clientX: mapX(8),   clientY: mapY(3)}],
        ["mouseup",   {button:  0, clientX: mapX(8),   clientY: mapY(3)}],

        ["mousedown", {button:  0, clientX: mapX(14),  clientY: mapY(5)}],
        ["mousemove", {buttons: 1, clientX: mapX(14),  clientY: mapY(3)}],
        ["mouseup",   {button:  0, clientX: mapX(14),  clientY: mapY(3)}],

        ["mousedown", {button:  0, clientX: mapX(20),  clientY: mapY(5)}],
        ["mousemove", {buttons: 1, clientX: mapX(20),  clientY: mapY(3)}],
        ["mouseup",   {button:  0, clientX: mapX(20),  clientY: mapY(3)}],

        ["mousedown", {button:  0, clientX: mapX(26),  clientY: mapY(3)}],
        ["mouseup",   {button:  0, clientX: mapX(26),  clientY: mapY(3)}],

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
        ["mouseup",   {button:  0, clientX: mapX(26),  clientY: mapY(27)}],
    
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

        // CONTACTS
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
        ["mousedown", {button:  0, clientX: mapX(10),  clientY: mapY(15)}],
        ["mouseup",   {button:  0, clientX: mapX(10),  clientY: mapY(15)}],

        ["mousedown", {button:  0, clientX: mapX(16),  clientY: mapY(15)}],
        ["mouseup",   {button:  0, clientX: mapX(16),  clientY: mapY(15)}],

        ["mousedown", {button:  0, clientX: mapX(22),  clientY: mapY(15)}],
        ["mouseup",   {button:  0, clientX: mapX(22),  clientY: mapY(15)}],

        ["mousedown", {button:  0, clientX: mapX(27),  clientY: mapY(15)}],
        ["mouseup",   {button:  0, clientX: mapX(27),  clientY: mapY(15)}],

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

        0,

        // CONTACTS
        ["mousedown", {button:  0, clientX: mapX(7),  clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(7),  clientY: mapY(25)}],

        ["mousedown", {button:  0, clientX: mapX(19), clientY: mapY(25)}],
        ["mouseup",   {button:  0, clientX: mapX(19), clientY: mapY(25)}],

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

        /** NOR-4 **/
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

        0,

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
    ];

    /** RUN TESTBENCH **/

    for(let ii = 0; ii < events.length; ii++) {
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
        
            console.assert(tv === events[ii], "Error on vector #%d", testVector);
            testVector++;

            assertNext = false;
        }
    }
    console.log("tests done");
}