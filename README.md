# Stixu: VLSI Stick Diagrammer

## Live Site
* [Stixu.io](https://stixu.io) (Hosting provided by Github.io)

## Legal Stuff
* This project is dual-licensed. The public release is under GPLv3. Commercial licenses are available upon request.
    * Copyright for commercially licensed code is held by Nicholas Overacker & Miho Kobayashi.
    * No code contributed by third-party developers will be covered by commercially licensed releases.
        * At present (May 21, 2025), Nicholas and Miho are the sole developers, and all code is commercially licensable.
        * If third-party developers contribute code, then the commmercial code and public code will diverge. The copyleft code will be _full-featured_, and commercial code may lack future functionality.
* For a commercial license, please contact: [nick.overacker@okstate.edu](mailto:nick.overacker@okstate.edu).

## Dogma of Development
* [Everything we do will be excellent.](https://www.researchgate.net/profile/Mark-Rockley-2)
* Above all else, above the following points, code in main must work.
* Javascript errors or warnings must not be tolerated on the live page.
* All functions must be in strict mode.
* Live code must always clear JSHint with no errors or warnings.
* Live code must always pass the testbench with no errors.
* Software entropy must not increase.

## Feature Requests (High Priority!!)
### Most Feasible
* Cell library support
* Resistive pull-up support
* Euler graph verification (suggest fixes for mismatches)
* Export production rules
* Allow users to configure layers
* Real-time collaboration ("multiplayer")
* Support for multiple drive strengths
    * Although resistive pull-up might be easy to implement by using directed edges, going beyond that might require substantial changes to the underlying hypergraph model. I will see what I can do.
* "Game mode"
    * This has been at the back of my mind for a long time. It's going to happen someday.

## Feature Wishlist
* Allow users to save designs, and use their outputs as inputs to other designs to produce complex, modular circuitry.
* Generate Magic files from design for a given technology.
* Sequenced output for state-dependent circuits like DFFs. UPDATE: Instead, produce test vectors for external tools.
* Allow user to define custom color scheme.
* Allow user to selectively hide layers (to verify connections).
* Allow custom command mappings.
* Allow custom terminal labels.
* Student/Teacher modes with generating/grading homework, practice problems, etc.
* Draw CMOS circuit schematic corresponding to the painted topology.
* Logical effort calculations (allow user to set constants)
* Export netlist for use in electronics design software.
* ~~HDL generation.~~ *Implemented 2025/5/7*
* ~~Share small diagrams by URL arguments and QR codes.~~ *Implemented 2023/2/8*
* ~~Interactive tutorial.~~ *Implemented 2023/2/4*
* ~~Replace pullup/pulldown alert popups with less obtrusive warnings.~~ *Implemented 2023/1/29*
* ~~Allow users to select where to insert rows and columns.~~ *Implemented 2023/1/29*
* ~~Show which layers are set in highlighted cell.~~ *Implemented 2023/1/29*
* ~~Show at least one path from rail voltage to output for each input.~~ *Implemented 2021/12/11*
* ~~Warn user when pulling up with NMOS or pulling down with PMOS.~~ *Implemented 2021/12/10*
* ~~Arbitrary number of I/O.~~ *Implemented 2020/12/10*
* ~~Colorblind-friendly mode.~~ *Implemented 2021/12/8*
* ~~Mobile interface.~~ *Implemented 2021/12/6*
* ~~Record user input sequence in debug mode for the testbench.~~ *Implemented 2021/12/4*
* ~~HTML button interface for those who prefer not to use a keyboard.~~ *Implemented 2021/12/2*
* ~~Arbitrary width/height.~~ *Implemented 2021/11/28*
* ~~More efficient data structure for the grid.~~ *Implemented 2021/11/25*
* ~~Foolproof usage instructions.~~ *Implemented 2021/11/21*
* ~~More metal layers.~~ *Implemented 2021/11/21*
* ~~Moveable VDD/GND terminals.~~ *Implemented 2021/11/21*
* ~~Show every layer in a cell, not just the top.~~ *Implemented 2021/11/21*

## Absolute Pie in the Sky
* Accommodate blind users somehow? Engineering isn't just for the sighted.
* Nobel Peace Prize
* Various accolades
* ~~Knowing that I spelled "accolades" correctly (I don't feel like Googling it)~~ *Resolved 2021/11/20*

## Known Bugs
* UI bug: horizontal overflow on mobile after adding the logo.
* Warning message displays when it shouldn't. (Testbench case 62)
* ~~Logo display bug on Chromium-based browsers.~~ *Resolved 2025/5/17*
* ~~Incorrect output for asymmetric C-element.~~ *Resolved 2025/1/29* (Testbench case 65)
* ~~Incorrect output for testbench case 61.~~ *Resolved 2025/1/6* (Testbench cases 61, 62)
* ~~Unable to detect many cases up invalid pull-up/pull-down~~ *Resolved 2024/11/25* (Testbench case 60)
* ~~Base64 decoding problems. Diagrams such as testbench case 60 can't properly decode as URL arguments.~~ *Resolved 2024/11/21*
* ~~L and H outputs are not handled properly depending on orientation.~~ *Resolved 2024/5/26* (Testbench case 59)
* ~~Gates with VDD/GND shorts are not handled properly depending on orientation.~~ *Resolved 2024/5/17* (Testbench cases 40, 49, 50, 51)
* ~~Some transistors with floating gates are still not handled properly.~~ *Resolved 2024/3/23* (Testbench case 56-58)
* ~~Transistors with floating gates are not handled properly.~~ *Resolved 2024/3/21* (Testbench case 55)
* ~~Infinite (or practically infinite) computation time for certain complex topologies.~~ *Resolved 2024/3/18* (Testbench case 54)
* ~~Incorrect output when overdriven transistors drive multiple outputs.~~ *Resolved 2023/2/6* (Testbench cases 49, 53)
* ~~Incorrect output when dead-end overdriven transistors are behind inputs~~ *Resolved 2023/2/6* (Testbench cases 51, 52)
* ~~The pullup/pulldown alert div displaces the canvas by too much in some browsers, even when not visible.~~ *Resolved 2023/1/30*
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
