export function send(argss) {
    const args = argss[0];
    const conectionDetails = argss[1];
    let msg = {
        source: args.source || args.src || conectionDetails.ID,
        type: args.type || "",
        info: args.msg || args.info || "",
        func: args.func || args.function || "",
        dest: args.dest || args.destination || ""
    };
    if (args.ws.readyState == 1) {
        args.ws.send(JSON.stringify(msg));
        return true;
    }
    else {
        return false;
    }
}
export function getInUseComputers(computerIDS) {
    let inUse = [];
    computerIDS.forEach(function each(conn) {
        if (conn.inUse == true) {
            inUse.push(conn.ID);
        }
    });
    return inUse || [];
}
export function getConnection(ID, computerIDS, websiteIDS, debug = false) {
    if (debug) {
        console.log("Looking for '", ID, "'");
    }
    var returnMe = null;
    computerIDS.forEach(function each(computer) {
        if (debug) {
            console.log("Computer:", computer.ID);
        }
        if (computer.ID == ID) {
            returnMe = computer.ws;
        }
    });
    websiteIDS.forEach(function each(website) {
        if (debug) {
            console.log("Website:", website.ID);
        }
        if (website.ID == ID) {
            returnMe = website.ws;
        }
    });
    return returnMe || false;
}
export function makeComputerTable(msg) {
    let tableCode = '<tr><th colspan="2">Computers</th><th>Status</th></tr>';
    let computers = msg.info || [];
    let inUse = msg.func || [];
    if (computers.length > 0) {
        computers.forEach(function each(computer) {
            tableCode += "<tr><td>" + computer + '</td><td><button';
            tableCode += " id=\"" + computer + '">Select</button></td>';
            if (computer in inUse) {
                tableCode += '<td id="' + computer + 'STATUS">In Use</td>';
            }
            else {
                tableCode += '<td id="' + computer + 'STATUS">Open</td>';
            }
            tableCode += "</tr>";
        });
    }
    else {
        tableCode += '<tr><td colspan="3">No computers are online</td></tr>';
    }
    return tableCode;
}
export function disconnectComputer(computerIDS, msgParse) {
    computerIDS.forEach(function each(computer) {
        if (computer.ID === msgParse.source) {
            send([
                {
                    source: "SERVER",
                    dest: msgParse.source,
                    type: "DISCONNECT",
                    ws: computer.ws
                }
            ]);
        }
    });
}
export function disconnectWebsite(websiteIDS, msgParse) {
    websiteIDS.forEach(function each(website) {
        if (website.ID === msgParse.source) {
            send([
                {
                    source: "SERVER",
                    dest: msgParse.source,
                    type: "DISCONNECT",
                    ws: website.ws
                }
            ]);
        }
    });
}
//# sourceMappingURL=Helper.js.map