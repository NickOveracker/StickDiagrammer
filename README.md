# Stixu: VLSI Stick Diagrammer

## Live Pages
* Stable site: [Stixu.io](https://stixu.io)
* Development: [Github.io](https://nickoveracker.github.io/StickDiagrammer)

## Legal Stuff
* All rights are reserved by Nick Overacker.
* Free for (personal ∧ non-professional ∧ non-commercial) use.
* For (professional ⋁ commercial ⋁ institutional) use, please contact: [nick.overacker@okstate.edu](mailto:nick.overacker@okstate.edu)
* A proper source-available or open-source license will be added at some point.

## Dogma of Development
* Everything we do will be excellent.
* Above all else, above the following points, code in main must work.
* Javascript errors or warnings must not be tolerated on the live page.
* All functions must be in strict mode.
* Live code must always clear JSHint with no errors or warnings.
* Live code must always pass the testbench with no errors.
* Software entropy must not increase.

## Feature Wishlist
* Student/Teacher modes with generating/grading homework, practice problems, etc.
* Draw CMOS circuit schematic corresponding to the painted topology.
* Logical effort calculations (allow user to set constants)
* Export netlist for use in electronics design software.
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
* ~~Moveable VDD/GND terminals.~~ *Resolved 2021/11/21 (move with + and - keys)*
* ~~Show every layer in a cell, not just the top.~~ *Resolved 2021/11/21*

## Absolute Pie in the Sky
* Alternate braille display???
* Allow users to save designs, and use their outputs as inputs to other designs to produce complex, modular circuitry.
* Generate Magic files (todo: check legality) from design for a given technology.
* Nobel Peace Prize
* Various accolades
* ~~Knowing that I spelled "accolades" correctly (I don't feel like Googling it)~~ *Resolved 2021/11/20*

## Known Bugs
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
