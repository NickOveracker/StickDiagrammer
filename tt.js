function computeOutput(inputVals, outputNode) {
    let visited;
    let pmosOut;
    let nmosOut;
    let out;
    let firstLevel;
    let passWhenPos;

    function computeOutputRecursive(node) {
        // We found it?
        if(node === outputNode) {
            return true;
        }

        // Avoid infinite loops.
        if(visited[node.getCell().x + "," + node.getCell().y]) {
            return false;
        }
        visited[node.getCell().x + "," + node.getCell().y] = true;

        // Only proceed if the input is activated.
        if((node !== vddNode) && (node !== gndNode)) {
            // Convert node.getName() to a number.
            let inputNum = node.getName().charCodeAt(0) - 65;
            let evalInput = !!((inputVals >> inputNum) & 1);
            if(evalInput !== passWhenPos) {
                return false;
            }
        }

        // Return if this is not the first level and the node is vddNode or gndNode.
        // The rail nodes won't play nice with the rest of this.
        if(!firstLevel && ((node === vddNode) || (node === gndNode))) {
            return false;
        }

        firstLevel = false;

        // Recurse on all edges.
        let edges = node.getEdges();
        for(let ii = 0; ii < edges.length; ii++) {
            if(computeOutputRecursive(edges[ii].getOtherNode(node))) {
                return true;
            }
        }

        // No findy :(
        return false;
    }

    // Get pmos output.
    visited = {};
    firstLevel = true;
    passWhenPos = false;
    pmosOut = computeOutputRecursive(vddNode) ? 1 : "Z";

    // Get nmos output.
    visited = {};
    firstLevel = true;
    passWhenPos = true;
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
    for(let ii = 0; ii < Math.pow(2, numInputs); ii++) {
        let tableInputRow = [];
        let tableOutputRow = [];

        // Compute each output.
        for(let jj = 0; jj < numOutputs; jj++) {
            tableOutputRow[jj] = computeOutput(ii, outputNodes[jj]);
        }

        outputVals[ii] = tableOutputRow;

        for(let jj = 0; jj < numInputs; jj++) {
            tableInputRow[jj] = (ii >> jj) & 1;
        }

        inputVals[ii] = tableInputRow;
    }

    let outstr = "";

    // Header
    for(let jj = inputVals[0].length - 1; jj >= 0; jj--) {
        outstr += String.fromCharCode(65 + jj) + " ";
    }
    outstr += " |";
    for(let jj = 0; jj < outputVals[0].length; jj++) {
        outstr += " " + String.fromCharCode(89 - jj);
    }
    outstr += "\n";
    for(let jj = 0; jj <= inputVals[0].length + outputVals[0].length; jj++) {
        outstr += "--";
    }
    outstr += "\n";

    // Contents
    for(let ii = 0; ii < inputVals.length; ii++) {
        for(let jj = inputVals[ii].length - 1; jj >= 0; jj--) {
            outstr += inputVals[ii][jj] + " ";
        }
        outstr += " |";
        for(let jj = 0; jj < outputVals[ii].length; jj++) {
            outstr += " " + outputVals[ii][jj];
        }
        outstr += "\n";
    }

    console.log(outstr);
}
