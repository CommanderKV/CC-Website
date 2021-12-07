var _a;
import { send, makeComputerTable } from "./Helper.js";
var ws = new WebSocket("ws://6f92-104-222-117-183.ngrok.io");
function getID(max) {
    return Math.floor(Math.random() * max + 1);
}
;
var connectionDetails = {
    ID: getID(100000),
    computerName: null,
    conRequest: null
};
ws.onmessage = function (event) {
    let msg = JSON.parse(event.data);
    switch (msg.type) {
        case "COMPUTERNAME":
            console.log("Processing a 'COMPUTERNAME' command ...");
            connectionDetails.computerName = msg.source;
            console.log("Completed 'COMPUTERNAME' command ...");
            break;
        case "computersACCEPT" || "COMPUTERS":
            console.log("Processing a 'computersACCEPT' command ...");
            var table = makeComputerTable(msg);
            var tableLink = document.getElementById("Computers");
            tableLink.innerHTML = table;
            var computers = msg.info || [];
            if (computers.length > 0) {
                computers.forEach(function each(computer) {
                    let link = document.getElementById(computer);
                    link === null || link === void 0 ? void 0 : link.addEventListener("click", () => {
                        select(computer);
                    });
                });
            }
            console.log("Completed 'computersACCEPT' command ...");
            break;
        case "conACCEPT":
            console.log("Processing a 'conACCEPT' command ...");
            var ID = connectionDetails.conRequest;
            connectionDetails.conRequest = null;
            connectionDetails.computerName = msg.source;
            var status = document.getElementById(ID + "STATUS");
            status.innerHTML = "Connected";
            console.log("Completed 'conACCEPT' command ...");
            break;
        case "conDENIED":
            console.log("Processing a 'conDENIED' command ...");
            makeComputerTable(msg);
            console.log("Completed 'conDENIED' command ...");
            break;
        case "DISCONNECT":
            console.log("Processing a 'DISCONNECT' command ...");
            if (connectionDetails.conRequest != null) {
                connectionDetails.conRequest = null;
            }
            connectionDetails.computerName = null;
            console.log("Completed 'DISCONNECT' command");
            break;
        default:
            console.log("Unknown command", msg.type);
            break;
    }
    ;
};
ws.onopen = function (event) {
    console.log("Websocket is open");
    console.log(connectionDetails.ID);
    console.log("Sent a 'webNAME' command");
    var res = send([{ type: "webNAME", msg: connectionDetails.ID, ws: ws }, connectionDetails]);
};
function select(ID) {
    connectionDetails.conRequest = ID;
    console.log("Sent a 'conREQUEST' command");
    send([{ source: connectionDetails.ID, type: "conREQUEST", msg: connectionDetails.ID, dest: ID, ws: ws }, connectionDetails]);
}
(_a = document.getElementById("RefreshComps")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", refreshComputers);
function refreshComputers() {
    console.log("Sent a 'computersREQUEST' command");
    send([{ type: "computersREQUEST", dest: "SERVER", ws: ws }, connectionDetails]);
}
setInterval(() => {
    console.log("Sent a 'computersREQUEST' command");
    send([{ type: "computersREQUEST", dest: "SERVER", ws: ws }, connectionDetails]);
}, 10 * 1000);
window.onunload = function () {
    ws.close();
};
function forward() {
    if (connectionDetails.computerName !== null) {
        console.log("Sent a 'COMMAND' command");
        send([{
                type: "COMMAND",
                dest: connectionDetails.computerName,
                func: "return turtle.forward()",
                ws: ws
            },
            connectionDetails
        ]);
    }
}
function right() {
    if (connectionDetails.computerName !== null) {
        console.log("Sent a 'COMMAND' command");
        send([{
                type: "COMMAND",
                dest: connectionDetails.computerName,
                func: "return turtle.turnRight()",
                ws: ws
            },
            connectionDetails
        ]);
    }
}
function left() {
    if (connectionDetails.computerName !== null) {
        console.log("Sent a 'COMMAND' command");
        send([{
                type: "COMMAND",
                dest: connectionDetails.computerName,
                func: "return turtle.turnLeft()",
                ws: ws
            },
            connectionDetails
        ]);
    }
}
function back() {
    if (connectionDetails.computerName !== null) {
        console.log("Sent a 'COMMAND' command");
        send([{
                type: "COMMAND",
                dest: connectionDetails.computerName,
                func: "return turtle.back()",
                ws: ws
            },
            connectionDetails
        ]);
    }
}
function up() {
    if (connectionDetails.computerName !== null) {
        console.log("Sent a 'COMMAND' command");
        send([{
                type: "COMMAND",
                dest: connectionDetails.computerName,
                func: "return turtle.up()",
                ws: ws
            },
            connectionDetails
        ]);
    }
}
function down() {
    if (connectionDetails.computerName !== null) {
        console.log("Sent a 'COMMAND' command");
        send([{
                type: "COMMAND",
                dest: connectionDetails.computerName,
                func: "return turtle.down()",
                ws: ws
            },
            connectionDetails
        ]);
    }
}
//# sourceMappingURL=Website.js.map