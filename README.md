# Stixu: VLSI Stick Diagrammer

## Live Pages
* Stable site: [Stixu.io](https://stixu.io)
* Development: [Github.io](https://nickoveracker.github.io/StickDiagrammer)

## Legal Stuff
* Copyright Nick Overacker & Miho Kobayashi.
* This code is offered under the [PolyForm Strict License 1.0.0](https://polyformproject.org/licenses/strict/1.0.0/), which permits users to use this code for noncommercial purposes but reserves most right for the copyright holders.
* For uses not permitted under the license, please contact: [nick.overacker@okstate.edu](mailto:nick.overacker@okstate.edu)

## Dogma of Development
* Everything we do will be excellent.
* Above all else, above the following points, code in main must work.
* Javascript errors or warnings must not be tolerated on the live page.
* All functions must be in strict mode.
* Live code must always clear JSHint with no errors or warnings.
* Live code must always pass the testbench with no errors.
* Software entropy must not increase.

## Feature Wishlist
* Allow user to define custom color scheme.
* Allow user to selectively hide layers (to verify connections).
* Allow custom command mappings.
* Allow custom terminal labels.
* Share small diagrams by URL arguments and QR codes.
* Replace pullup/pulldown alert popups with less obtrusive warnings.
* HDL generation.
* Interactive tutorial.
* Student/Teacher modes with generating/grading homework, practice problems, etc.
* Draw CMOS circuit schematic corresponding to the painted topology.
* Logical effort calculations (allow user to set constants)
* Export netlist for use in electronics design software.
* ~~Allow users to select where to insert rows and columns.~~ *Resolved 2023/1/29*
* ~~Show which layers are set in highlighted cell.~~ *Resolved 2023/1/29*
* ~~Show at least one path from rail voltage to output for each input.~~ *Resolved 2021/12/11*
* ~~Warn user when pulling up with NMOS or pulling down with PMOS.~~ *Resolved 2021/12/10*
* ~~Arbitrary number of I/O.~~ *Resolved 20201/12/10*
* ~~Colorblind-friendly mode.~~ *Resolved 2021/12/8*
* ~~Mobile interface.~~ *Resolved 2021/12/6*
* ~~Record user input sequence in debug mode for the testbench.~~ *Resolved 2021/12/4*
* ~~HTML button interface for those who prefer not to use a keyboard.~~ *Resolved 2021/12/2*
* ~~Arbitrary width/height.~~ *Resolved 2021/11/28*
* ~~More efficient data structure for the grid.~~ *Resolved 2021/11/25*
* ~~Foolproof usage instructions.~~ *Resolved 2021/11/21*
* ~~More metal layers.~~ *Resolved 2021/11/21*
* ~~Moveable VDD/GND terminals.~~ *Resolved 2021/11/21*
* ~~Show every layer in a cell, not just the top.~~ *Resolved 2021/11/21*

## Absolute Pie in the Sky
* Sequenced output for state-dependent circuits like DFFs.
* Alternate braille display???
* Allow users to save designs, and use their outputs as inputs to other designs to produce complex, modular circuitry.
* Generate Magic files (todo: check legality) from design for a given technology.
* Nobel Peace Prize
* Various accolades
* ~~Knowing that I spelled "accolades" correctly (I don't feel like Googling it)~~ *Resolved 2021/11/20*

## Known Bugs
* ~~Highlighted nets are no longer comprehensive.~~ *Resolved 2023/1/22*
* ~~Incorrect output for two input-overdriven transistors in series with a VDD+GND overdriven transistor in series with direct input.~~ *Resolved 2023/1/22*
* ~~Incorrect output when GND and VDD are directly assigned to the same gate in series with overdriven transistor.~~ *Resolved 2023/1/17*
* ~~GND or VDD incorrectly override input nodes directly assigned to the same gate as them.~~ *Resolved 2023/1/16*
* ~~Incorrectly assigns Z for certain configurations of overdriven transistors when X is expected.~~ *Resolved 2023/1/15*
* ~~Incorrectly assigns X instead of Z for circuits with a dead-end overdriven transistor.~~ *Resolved 2023/1/14*
* ~~Evaluator aborts when poly is placed over the end of NDIFF or PDIFF on the edge of the canvas.~~ *Resolved 2023/1/10*
* ~~Invalid output when two conflicting signals other than direct inputs drive a single gate~~ *Resolved 2022/12/30*
* ~~Crashes silently when a transistor is missing a source or drain~~ *Resolved 2022/12/29*
* ~~Invalid output produced when two inputs directly drive the same gate~~ *Resolved 2022/12/29*
* ~~Invalid output produced when two inputs INdirectly drive the same gate~~ *Resolved 2022/12/28*
* ~~Minor visual glitches while drawing (due to canvas refresh)~~ *Resolved 2021/11/27*
* ~~Issue #7 (regarding NAND3 in complex circuit)~~ *Resolved 2021/11/23*
* ~~Directly connecting output to input produces output of Z instead of reproducing the input.~~ *Resolved 2021/11/20*
* ~~Unexpected output when both terminals of a transistor are shorted to VDD or GND.~~ *Resolved 2021/11/20*
* * ~~Short PMOS side to VDD: Output is 11111111. . .~~
* * ~~Short NMOS side to GND: Output is 0Z0Z0Z0Z. . .~~
* ~~Directly connecting VDD to GND produces output of Z instead of the correct output X.~~ *Resolved 2021/11/18*
* ~~Cells adjacent to painted cells are added to the same net, even if they aren't filled in.~~ *Resolved 2021/11/18*
* ~~Lines can be dragged up or left while drawing.~~ *Resolved 2021/11/18*
* ~~Clicking on right edge and dragging behaves as if clicked at (1,1).~~ *Resolved 2021/11/17*
