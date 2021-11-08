function getOutput(inputVals, outputNode) {
    let visited;
    let pmosOut;
    let nmosOut;
    let out;

    function getOutputRecursive(node) {
        let edges = node.getEdges;

        // Only proceed if the input is activated.
        // Avoid infinite loops.
        if(visited[node.number] || !((inputVals >> node.number) & 1)) {
            return false;
        }
        visited[node.number] = true;

        // We found it?
        if(node === outputNode) {
            return true;
        }

        // Recurse on all edges.
        for(let ii = 0; ii < edges.length; ii++) {
            if(getOutputRecursive(node)) {
                return true;
            }
        }

        // No findy :(
        return false;
    }

    // Get pmos output.
    visited = [];
    pmosOut = getOutputRecursive(vddNode) ? 1 : "Z";

    // Get nmos output.
    visited = [];
    nmosOut = getOutputRecursive(gndNode) ? 0 : "Z";

    // Reconcile.
    if(pmosOut === "Z") {
        out = nmosOut;
    } else if(nmosOut === "Z") {
        out = pmosOut;
    } else {
        out = "X";
    }

    return out;
}

// Generate an output table.
// Each row evaluates to 1, 0, Z, or X
// 1 is VDD, 0 is GND.
// Z is high impedance, X is error (VDD and GND contradiction.)
function buildTruthTable() {
    let inputVals = [];
    let outputVals = [];

    // Each loop iteration is a combination of input values.
    // I.e., one row of the output table.
    for(let ii = 0; ii < Math.pow(2, numInputs - 2); ii++; {
        let tableInputRow = [];
        let tableOutputRow = [];

        // Compute each output.
        for(let jj = 0; jj < numOutputs; jj++) {
            tableOutputRow[jj] = getOutput(ii, outputNodes[jj]);
        }

        outputVals[ii] = tableOutputRow;

        for(let jj = 0; jj < numInputs - 2; jj++) {
            tableInputRow[jj] = (ii >> jj) & 1;
        }

        inputVals[ii] = tableInputRow;
    }

    let outstr = "";

    // Header
    for(let jj = 0; jj < inputVals[0].length; jj++) {
        outstr += String.fromCharCode(65 + inputVals[0][jj]) + " ";
    }
    outstr += " |";
    for(let jj = 0; jj < outputVals[0].length; jj++) {
        outstr += " " + String.fromCharCode(89 - outputVals[0][jj]);
    }
    outstr += "\n";
    for(let jj = 0; jj <= inputVals[0].length + outputVals[0].length; jj++) {
        outstr += "--";
    }

    // Contents
    for(let ii = 0; ii < inputVals.length; ii++) {
        for(let jj = 0; jj < inputVals[ii].length; jj++) {
            outstr += inputVals[ii][jj] + " ";
        }
        outstr += " |";
        for(let jj = 0; jj < outputVals[ii].length; jj++) {
            outstr += " " + outputVals[ii][jj];
        }
        outstr += "\n";
    }
}
