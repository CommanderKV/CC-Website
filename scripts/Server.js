import { send, getInUseComputers, getConnection, disconnectComputer, disconnectWebsite } from "./Helper.js";
import { WebSocket, WebSocketServer } from "ws";
const wss = new WebSocketServer({ port: 8081 });
let computerIDSonly = [];
let computerIDS = [];
let websiteIDSonly = [];
let websiteIDS = [];
class Socket extends WebSocket {
    On(...args) {
        return this.on(args[0], args[1]);
    }
    ;
}
;
var lastLogedType = "";
var ammount = 0;
function log(type, ID) {
    if (type == "webNAME") {
        if (lastLogedType != type) {
            console.log("\nProcessing a 'webNAME' command ...");
        }
        else if (ammount <= 2) {
            console.log("Completed command. ID set for:", ID);
        }
    }
    else if (type == "computerNAME") {
        if (lastLogedType != type) {
            console.log("\nProcessing a 'computerNAME' command ...");
        }
        else if (ammount <= 2) {
            console.log("Completed command. Computer name set for:", ID);
        }
    }
    else if (type == "RETURN") {
        console.log("\nForwarding a 'RETURN' to:", ID);
    }
    else if (type == "COOMMAND") {
        console.log("\nForwarding a 'COMMAND' to:", ID);
    }
    else if (type == "computersREQUEST") {
        if (lastLogedType != type) {
            console.log("\nProcessing a 'computersREQUEST' command ...");
        }
        else if (ammount <= 2) {
            console.log("Computers:", computerIDSonly);
            console.log("Websites:", websiteIDSonly);
            console.log("Completed command. Sent data to:", ID);
        }
    }
    else if (type == "conREQUEST") {
        console.log("\nForwarding a 'conREQUEST' to:", ID);
    }
    else if (type == "conACCEPT") {
        console.log("\nForwarding a 'conACCEPT' to:", ID);
    }
    else if (type == "conDENIED") {
        console.log("\nForwarding a 'conDENIED' to:", ID);
    }
    else if (type == "PING") {
        if (lastLogedType != type) {
            console.log("\nProcessing a 'PING' command ...");
        }
        else if (ammount <= 2) {
            console.log("Completed command. 'PONG' sent back to:", ID);
        }
    }
    if (lastLogedType == type) {
        ammount++;
    }
    else {
        lastLogedType = type;
    }
}
var lastINmsgType = "";
wss.on("connection", function connection(ws) {
    ws.on("message", function message(msg) {
        let msgParse = JSON.parse(msg);
        if (lastINmsgType != msgParse.type) {
            console.log("\nIncoming message: ", msgParse);
            lastINmsgType = msgParse.type;
        }
        switch (msgParse.type) {
            case "webNAME":
                log(msgParse.type, +msgParse.info);
                var ID = +msgParse.info;
                while (ID in websiteIDSonly) {
                    ID++;
                }
                websiteIDSonly.push(ID);
                websiteIDS.push({ ID: ID, ws: ws, inUse: false, connectedTo: null });
                ws.ID = ID;
                log(msgParse.type, +msgParse.info);
                break;
            case "computerNAME":
                log(msgParse.type, msgParse.info);
                var computerID = msgParse.info;
                if (msgParse.func == true) {
                    var oriComputerID = computerID;
                    while (computerIDSonly.includes(computerID)) {
                        let text = computerID.split(": ");
                        var ID = +text[1] + 1;
                        computerID = text[0] + ": " + ID;
                    }
                    if (oriComputerID !== computerID) {
                        send([{ type: "updateNAME", info: computerID, dest: oriComputerID, source: "SERVER", ws: ws }]);
                    }
                    ws.ID = computerID;
                    computerIDSonly.push(computerID);
                    computerIDS.push({ ID: computerID, ws: ws, inUse: false, connectedTo: null });
                }
                else {
                    if (computerIDSonly.includes(computerID)) {
                        computerIDS.forEach(function each(computer) {
                            if (computer.ID == computerID) {
                                computer.ws = ws;
                                computer.inUse = false;
                                if (computer.connectedTo !== null) {
                                    ws.send([{ source: computer.connectedTo.ID, type: "conREQUEST", info: computer.connectedTo.ID, dest: computerID, ws: ws }]);
                                }
                                else {
                                    computer.connectedTo = null;
                                }
                            }
                        });
                    }
                    else {
                        ws.ID = computerID;
                        computerIDSonly.push(computerID);
                        computerIDS.push({ ID: computerID, ws: ws, inUse: false, connectedTo: null });
                    }
                }
                log(msgParse.type, msgParse.info);
                break;
            case "RETURN":
                log(msgParse.type, msgParse.info);
                var conn = getConnection(msgParse.dest, computerIDS, websiteIDS);
                if (conn != false) {
                    msgParse.ws = conn;
                    send([msgParse]);
                }
                else {
                    disconnectComputer(computerIDS, msgParse);
                }
                break;
            case "COMMAND":
                log(msgParse.type, msgParse.info);
                var conn = getConnection(msgParse.dest, computerIDS, websiteIDS);
                if (conn != false) {
                    msgParse.ws = conn;
                    send([msgParse]);
                }
                else {
                    disconnectWebsite(websiteIDS, msgParse);
                }
                break;
            case "computersREQUEST":
                log(msgParse.type, msgParse.source);
                let inUse = getInUseComputers(computerIDS);
                var conn = getConnection(msgParse.source, computerIDS, websiteIDS);
                if (conn != false) {
                    send([{
                            source: "SERVER",
                            type: "computersACCEPT",
                            msg: computerIDSonly,
                            func: inUse,
                            dest: msgParse.source,
                            ws: conn
                        }]);
                    log(msgParse.type, msgParse.source);
                }
                else {
                    console.log("[ERROR]  A 'computersREQUEST' was sent but '" + msgParse.source + "' is not a vaild destination");
                }
                break;
            case "conREQUEST":
                log(msgParse.type, msgParse.info);
                var conn = getConnection(msgParse.dest, computerIDS, websiteIDS);
                if (conn != false) {
                    msgParse.ws = conn;
                    send([msgParse]);
                }
                else {
                    disconnectWebsite(websiteIDS, msgParse);
                    console.log("[ERROR]  A 'conREQUEST' was sent but '" + msgParse.source + "' is not a vaild destination");
                }
                break;
            case "conACCEPT":
                log(msgParse.type, msgParse.info);
                var conn = getConnection(msgParse.dest, computerIDS, websiteIDS);
                if (conn != false) {
                    computerIDS.forEach(function each(computer) {
                        var web;
                        if (computer.ID === msgParse.source) {
                            web = null;
                            websiteIDS.forEach(function each(website) {
                                if (website.ID === msgParse.dest) {
                                    web = website;
                                    return;
                                }
                            });
                            if (web !== null) {
                                var webb = web;
                                webb.connectedTo = computer;
                                webb.inUse = true;
                                computer.connectedTo = web;
                                computer.inUse = true;
                                msgParse.ws = conn;
                                send([msgParse]);
                                websiteIDS.forEach(function each(website) {
                                    if (website.ID === webb.ID) {
                                        website = webb;
                                    }
                                });
                            }
                            else {
                                disconnectComputer(computerIDS, msgParse);
                                console.log("Sent discconect to:", msgParse.source);
                                computer.connectedTo = null;
                                computer.inUse = false;
                            }
                        }
                    });
                    console.log("Sent a 'conACCEPT' command to :", msgParse.dest);
                }
                else {
                    disconnectComputer(computerIDS, msgParse);
                }
                break;
            case "conDENIED":
                log(msgParse.type, msgParse.info);
                var conn = getConnection(msgParse.dest, computerIDS, websiteIDS);
                if (conn != false) {
                    msgParse.ws = conn;
                    send([msgParse]);
                    console.log("Sent a 'conDENIED' command to:", msgParse.dest);
                }
                else {
                    disconnectComputer(computerIDS, msgParse);
                }
                break;
            case "PING":
                log(msgParse.type, msgParse.info);
                var conn = getConnection(msgParse.source, computerIDS, websiteIDS);
                if (conn != false) {
                    msgParse.ws = conn;
                    msgParse.dest = msgParse.source;
                    msgParse.source = "SERVER";
                    msgParse.type = "PONG";
                    send([msgParse]);
                    log(msgParse.type, msgParse.info);
                }
                else {
                    console.log("Failed to send a 'PONG' reply to:", msgParse.source);
                }
                break;
            default:
                wss.clients.forEach(function each(client) {
                    client.send(JSON.stringify(msgParse));
                });
                console.log("[WARNING]  A broadcast was sent. Msg:", msgParse);
                break;
        }
        ;
    });
    ws.onclose = function close(event) {
        console.log();
        let delMe = { ID: "NONE", ws: null, inUse: false, connectedTo: null };
        websiteIDS.forEach(function each(website) {
            if (website.ID === ws.ID) {
                delMe = website;
                return;
            }
        });
        if (delMe.ID == "NONE") {
            computerIDS.forEach(function each(computer) {
                if (computer.ID === ws.ID) {
                    delMe = computer;
                    return;
                }
            });
        }
        if (delMe.connectedTo != null) {
            if (delMe.connectedTo != null) {
                var conn = delMe.connectedTo;
                conn.inUse = false;
                send([{ source: delMe.ID, type: "DISCONNECT", info: "From Server.ts:338", dest: conn.ID, ws: conn.ws }]);
                console.log("Sent 'DISCONNECT' command to:", conn.ID);
            }
        }
        websiteIDSonly.forEach((value, index) => {
            if (value == delMe.ID) {
                websiteIDSonly.splice(index, 1);
            }
        });
        websiteIDS.forEach((value, index) => {
            if (value.ID == delMe.ID) {
                websiteIDS.splice(index, 1);
            }
        });
        console.log(websiteIDSonly);
        computerIDSonly.forEach((value, index) => {
            if (value == delMe.ID) {
                computerIDSonly.splice(index, 1);
            }
        });
        computerIDS.forEach((value, index) => {
            if (value.ID == delMe.ID) {
                computerIDS.splice(index, 1);
            }
        });
        console.log(computerIDSonly);
        console.log("DelMe.ID:", delMe.ID);
        console.log("Connection closed to:", ws.ID, "\n");
    };
});
//# sourceMappingURL=Server.js.map