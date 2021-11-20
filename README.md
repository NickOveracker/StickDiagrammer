# StickDiagrammer

## Legal Stuff
All rights are reserved by Nick Overacker.

Free for (personal ∧ non-professional ∧ non-commercial) use.

For (professional ⋁ commercial ⋁ institutional) use, please contact: [nick.overacker@okstate.edu](mailto:nick.overacker@okstate.edu)

A proper source-available or open-source license will be added at some point.

## Known Bugs
~~* Unexpected output when both terminals on one side of an inverter are shorted to VDD or GND.~~ *Resolved 2021/11/20*
~~* * Short PMOS side to VDD: Output is 11111111. . .~~
~~* * Short NMOS side to GND: Output is 0Z0Z0Z0Z. . .~~
~~* Directly connecting output to input produces output of Z instead of reproducing the input.~~ *Resolved 2021/11/20*
* ~~Directly connecting VDD to GND produces output of Z instead of the correct output X.~~ *Resolved 2021/11/18*
* ~~Cells adjacent to painted cells are added to the same net, even if they aren't filled in.~~ *Resolved 2021/11/18*
* ~~Lines can be dragged up or left while drawing.~~ *Resolved 2021/11/18*
* ~~Clicking on right edge and dragging behaves as if clicked at (1,1).~~ *Resolved 2021/11/17*

## Feature Wishlist
* Arbitrary number of I/O.
* Arbitrary width/height.
* Moveable VDD/GND terminals.
* Show every layer in a cell, not just the top.
* HTML button interface for those who prefer not to use a keyboard.
* Mobile interface.
* Foolproof usage instructions.
* Student/Teacher modes with generating/grading homework, practice problems, etc.
* Show at least one (ideally every) path from rail voltage to output for each input configuration.
* Record user input sequence in debug mode for the testbench.
* Draw CMOS circuit schematic corresponding to the painted topology.
* More metal layers.
* Export netlist for use in electronics design software.

## Absolute Pie in the Sky
* Allow users to save designs, and use their outputs as inputs to other designs to produce complex, modular circuitry.
* Generate Magic files (todo: check legality) from design for a given technology.
* Nobel Peace Prize
* Various accolades
* Knowing that I spelled "accolades" correctly (I don't feel like Googling it)
