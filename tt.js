function computeOutput(inputVals, outputNode) {
    let visited;
    let pmosOut;
    let nmosOut;
    let out;
    let firstLevel;

    function computeOutputRecursive(node) {
        let edges = node.getEdges;

        // Avoid infinite loops.
        if(visited[node.number]) {
            return false;
        }
        visited[node.number] = true;

        // Only proceed if the input is activated.
        if((node !== vddNode) && (node !== gndNode)) {
            // Convert node.getName() to a number.
            let inputNum = node.getName().charCodeAt(0) - 65;
            if(!((inputVals >> inputNum) & 1)) {
                return false;
            }
        }

        // Return if this is not the first level and the node is vddNode or gndNode.
        // The rail nodes won't play nice with the rest of this.
        if(!firstLevel && ((node === vddNode) || (node === gndNode))) {
            return false;
        }

        firstLevel = false;

        // We found it?
        if(node === outputNode) {
            return true;
        }

        // Recurse on all edges.
        for(let ii = 0; ii < edges.length; ii++) {
            if(computeOutputRecursive(node)) {
                return true;
            }
        }

        // No findy :(
        return false;
    }

    // Get pmos output.
    visited = [];
    firstLevel = true;
    pmosOut = computeOutputRecursive(vddNode) ? 1 : "Z";

    // Get nmos output.
    visited = [];
    firstLevel = true;
    nmosOut = computeOutputRecursive(gndNode) ? 0 : "Z";

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
    for(let ii = 0; ii < Math.pow(2, numInputs - 2); ii++) {
        let tableInputRow = [];
        let tableOutputRow = [];

        // Compute each output.
        for(let jj = 0; jj < numOutputs; jj++) {
            tableOutputRow[jj] = computeOutput(ii, outputNodes[jj]);
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
