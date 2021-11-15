// Represent the graph visually as a graph in the console.
Graph.prototype.print = function() {
    console.log('graph G {');
    for (let node of this.nodes) {
        console.log(node.getName() + ';');
    }
    for (let edge of this.edges) {
        console.log(edge.getNode1().getName() + ' <-> ' + edge.getNode2().getName() + ';');
    }
    console.log('}');
}

function printNodeNodeMap() {
    let str = " ";
    for(let ii = 0; ii < nodeNodeMap.length; ii++) {
        str += ii + " ";
    }
    str += "\n";
    for(let ii = 0; ii < nodeNodeMap.length; ii++) {
        str += ii + " ";
        for(let jj = 0; jj < nodeNodeMap.length; jj++) {
            if(nodeNodeMap[ii][jj] === null) {
                str += "? ";
            } else if(nodeNodeMap[ii][jj] === undefined) {
                str += "  ";
            } else if(nodeNodeMap[ii][jj] === true) {
                str += "1 ";
            } else {
                str += "0 ";
            }
        }
        str += "\n";
    }
  
    console.log(str)
}

// Print a grid with in all cells that are in a given net.
function printGrid(net, name) {
    let grid = [];
    for(let ii = 0; ii < gridsize; ii++) {
        grid[ii] = [];
        for(let jj = 0; jj < gridsize; jj++) {
            grid[ii][jj] = "_";
            // If any of the layers are in netA, set the cell to "A".
            for(let kk = 0; kk < layers; kk++) {
                if(layeredGrid[ii][jj][kk].isSet && net.containsCell(layeredGrid[ii][jj][kk])) {
                    grid[ii][jj] = name;
                }
                else if(pmos.has(layeredGrid[ii][jj][kk]) || nmos.has(layeredGrid[ii][jj][kk])) {
                    grid[ii][jj] = "T";
                }
            }
        }
    }

    // Print to the console, rotated 90 degrees.
    str = ""
    for(let ii = 0; ii < grid.length; ii++) {
        let row = "";
        for(let jj = 0; jj < grid[ii].length; jj++) {
            row += grid[jj][ii];
        }
        str += row + "\n";
    }
    console.log(str);
}

getCell = function(clientX, clientY) {
    // Ignore if not inside the canvas
    if (clientX > canvas.offsetLeft + cellWidth &&
        clientX < canvas.offsetLeft + canvas.width - cellWidth &&
        clientY > canvas.offsetTop + cellHeight &&
        clientY < canvas.offsetTop + canvas.height - cellHeight)
    {
        let x = Math.floor((clientX - canvas.offsetLeft - cellWidth) / cellWidth);
        let y = Math.floor((clientY - canvas.offsetTop - cellHeight) / cellHeight);
        console.log(x, y);
        return {x: x, y: y};
    }
    console.log("Out of bounds");
    return null;
}