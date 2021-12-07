import {
    connectionInfo, 
    messageFormat,
    send, 
    getInUseComputers, 
    getConnection, 
    disconnectComputer,
    disconnectWebsite 
} from "./Helper.js";

import { WebSocket, WebSocketServer } from "ws";

const wss = new WebSocketServer({port: 8081});

let computerIDSonly: string[] = [];
let computerIDS: connectionInfo[] = [];

let websiteIDSonly: number[] = [];
let websiteIDS: connectionInfo[] = [];

class Socket extends WebSocket {
    ID!: number | string;
    public On(...args: any) {
        return this.on(args[0], args[1]);
    };
};


/////////////////////////////////
// Function to log information //
/////////////////////////////////
var lastLogedType = "";
var ammount = 0;
function log(type: string, ID: number | string) {
    if (type == "webNAME") {
        if (lastLogedType == type) {
            console.log("Completed command. ID set for:", ID);

        } else if (ammount <= 2) {
            console.log("\nProcessing a 'webNAME' command ...");
        }

    } else if (type == "computerNAME") {
        if (lastLogedType != type){
            console.log("\nProcessing a 'computerNAME' command ...");

        } else if (ammount <= 2) {
            console.log("Completed command. Computer name set for:", ID);
        }

    } else if (type == "RETURN") {
        console.log("\nForwarding a 'RETURN' to:", ID);
    
    } else if (type == "COOMMAND") {
        console.log("\nForwarding a 'COMMAND' to:", ID);
    
    } else if (type == "computersREQUEST") {
        if (lastLogedType != type){
            console.log("\nProcessing a 'computersREQUEST' command ...");
        
        } else if (ammount <= 2) {
            console.log("Computers:", computerIDSonly);
            console.log("Websites:", websiteIDSonly);
            console.log("Completed command. Sent data to:", ID);
        }

    } else if (type == "conREQUEST") {
        console.log("\nForwarding a 'conREQUEST' to:", ID);

    } else if (type == "conACCEPT") {
        console.log("\nForwarding a 'conACCEPT' to:", ID);
        
    } else if (type == "conDENIED") {
        console.log("\nForwarding a 'conDENIED' to:", ID);

    } else if (type == "PING") {
        if (lastLogedType != type){
            console.log("\nProcessing a 'PING' command ...");

        } else if (ammount <= 2) {
            console.log("Completed command. 'PONG' sent back to:", ID);
        }
    }
    if (lastLogedType == type){
        ammount++;
    } else {
        lastLogedType = type; 
    }
}


/////////////////////////////////////
//      On connection function     //
/////////////////////////////////////
// When a conection is established //
// to the server run this function //
/////////////////////////////////////

var lastINmsgType = "";
wss.on("connection", function connection(ws: Socket) {
    
    ///////////////////////////////
    //    On message function    //
    ///////////////////////////////
    // When a message is recived //
    //     run this function     //
    ///////////////////////////////

    ws.on("message", function message(msg: string) {
        // Turn the message into our message format
        let msgParse: messageFormat = JSON.parse(msg);
        if (lastINmsgType != msgParse.type) {
            console.log("\nIncoming message: ", msgParse);
            lastINmsgType = msgParse.type;
        }
          

        ////////////////////////////////////////////
        // Figure out what to do with the message //
        ////////////////////////////////////////////

        switch (msgParse.type) {
            
            /////////////////////////////////////
            //      Website is connecting      //
            /////////////////////////////////////
            // When a website connects for the //
            //    first time run this to add   //
            //     the ID to the IDS Array     //
            /////////////////////////////////////

            case "webNAME": 

                log(msgParse.type, +msgParse.info);
                    
                ////////////////////////////////////////////
                // Making sure there are no duplicate IDs //
                ////////////////////////////////////////////

                var ID: number = +msgParse.info;
                while (ID in websiteIDSonly) {
                    ID++;
                }
                websiteIDSonly.push(ID);
                websiteIDS.push({ID: ID, ws: ws, inUse: false, connectedTo: null});

                ////////////////////
                // Setting the ID //
                ////////////////////

                ws.ID = ID;
                log(msgParse.type, +msgParse.info);

                break;
            
            
            ///////////////////////////////////////
            //  Computer | Turtle is connecting  //
            ///////////////////////////////////////
            // When a Computer | Turtle connects //
            //   run this to add its name/ID to  //
            //       the computerIDS Array       //
            ///////////////////////////////////////

            case "computerNAME":

                log(msgParse.type, <string>msgParse.info);

                /////////////////////////////////////
                //  Check if Computer | Turtle is  //
                // reconnecting or not and perform //
                //         necessary tasks         //
                /////////////////////////////////////
                var computerID: string = msgParse.info as string;
                if (msgParse.func == true) {

                    /////////////////////////////
                    // Check for duplicate IDS //
                    /////////////////////////////
                    var oriComputerID: string = computerID;
                    while (computerIDSonly.includes(computerID)) {
                        let text = computerID.split(": ");
                        var ID: number = +text[1] + 1;
                        computerID = text[0] + ": " + ID;
                    }

                    //////////////////////////////////
                    // Send computer their new name //
                    //////////////////////////////////
                    if (oriComputerID !== computerID) {
                        send([{type: "updateNAME", info: computerID, dest: oriComputerID, source: "SERVER", ws: ws}])
                    }

                    ////////////////////////////////
                    // Insert ID into computerIDS //
                    ////////////////////////////////

                    ws.ID = computerID
                    computerIDSonly.push(computerID);
                    computerIDS.push({ ID: computerID, ws: ws, inUse: false, connectedTo: null});


                } else {

                    ///////////////////////////////////
                    //  Update the connections info  //
                    //   and if they were connected  //
                    // with someone before they lost //
                    //  connection then reestablish  //
                    //           connection          //
                    ///////////////////////////////////
                    if (computerIDSonly.includes(computerID)) {
                        computerIDS.forEach(function each(computer){
                            if (computer.ID == computerID) {
                                computer.ws = ws;
                                computer.inUse = false;
                                if (computer.connectedTo !== null){
                                    ws.send([{source: computer.connectedTo.ID, type: "conREQUEST", info: computer.connectedTo.ID, dest: computerID, ws: ws}])
                                } else {
                                    computer.connectedTo = null;
                                }
                            }
                        })

                    ////////////////////////////////////////////
                    // If there is no record of this computer //
                    ////////////////////////////////////////////
                    } else {

                        ////////////////////////////////
                        // Insert ID into computerIDS //
                        ////////////////////////////////

                        ws.ID = computerID
                        computerIDSonly.push(computerID);
                        computerIDS.push({ ID: computerID, ws: ws, inUse: false, connectedTo: null});
                    }
                }

                log(msgParse.type, <string>msgParse.info);

                break;
            
            
            ///////////////////////////////////////////////
            //    Computer | Turtle result of function   //
            ///////////////////////////////////////////////
            // When code we asked the turtle to runs and //
            // and returns something this is the result. //
            //  We now need to forwrd that info alng to  //
            //              the right person             //
            ///////////////////////////////////////////////

            ///////////////////////////////////////////////
            //  NOTE: Might be able to just forward the  //
            //   data to the dest and have the webpage   //
            //    store the world there or store it on   //
            //           the Computer | Turtle           //
            ///////////////////////////////////////////////

            case "RETURN":
                log(msgParse.type, <string>msgParse.info);
                
                var conn = getConnection(msgParse.dest, computerIDS, websiteIDS);
                if (conn != false) {
                    msgParse.ws = conn as Socket;
                    send([msgParse]);

                } else {
                    disconnectComputer(computerIDS, msgParse);
                }

                break;
            
            
            ////////////////////////////////////////////
            //        Website sends command to        //
            //            Computer | Turtle           //
            ////////////////////////////////////////////
            // When the website sends us data to send //
            //    to the Computer | Turtle we will    //
            //      forward the entire msg to the     //
            //            Computer | Turtle           //
            ////////////////////////////////////////////

            case "COMMAND":
                log(msgParse.type, <string>msgParse.info);

                var conn = getConnection(msgParse.dest, computerIDS, websiteIDS);
                if (conn != false) {
                    msgParse.ws = conn as Socket;
                    send([msgParse]);

                } else {
                    disconnectWebsite(websiteIDS, msgParse);
                }



                break;

            
            /////////////////////////////////////////////
            //     Website sends a computersREQUEST    //
            //             command to server           //
            /////////////////////////////////////////////
            // When the website sends this command the //
            //       server will return a list of      //
            //   all the computers currenty connected  //
            /////////////////////////////////////////////

            case "computersREQUEST":
                log(msgParse.type, msgParse.source);

                let inUse: string[] = getInUseComputers(computerIDS);
                var conn = getConnection(msgParse.source, computerIDS, websiteIDS);

                if (conn != false) {
                    send([{
                        source: "SERVER",
                        type: "computersACCEPT", 
                        msg: computerIDSonly,
                        func: inUse, 
                        dest: msgParse.source,
                        ws: conn as Socket
                    }]);
                    log(msgParse.type, msgParse.source);

                } else {
                    // This should never happen but just in case 
                    console.log("[ERROR]  A 'computersREQUEST' was sent but '" + msgParse.source + "' is not a vaild destination");
                }

                break;


            ////////////////////////////////////////////////////
            //       Website sends a connection request       //
            //             to a Computer | Turtle             // 
            ////////////////////////////////////////////////////
            // When the website sends this command the server //
            //    will forward the message to the selected    //
            //                Computer | Turtle               //
            ////////////////////////////////////////////////////

            case "conREQUEST":
                log(msgParse.type, <string>msgParse.info);

                var conn = getConnection(msgParse.dest, computerIDS, websiteIDS);
                if (conn != false) {
                    msgParse.ws = conn as Socket;
                    send([msgParse]);

                } else {
                    disconnectWebsite(websiteIDS, msgParse);

                    // This might happen but very low chance of it hapening
                    console.log("[ERROR]  A 'conREQUEST' was sent but '" + msgParse.source + "' is not a vaild destination");
                }

                break;
                

            ///////////////////////////////////////////////////
            //  Computer | Turtle sends a connection accept  //
            //              mesage to a Website              //
            ///////////////////////////////////////////////////
            // When the Computer | Turtle sends a connection //
            //     accept mesage to a Website forward the    //
            //     message and update the connectionInfo     //
            ///////////////////////////////////////////////////

            case "conACCEPT":
                log(msgParse.type, <string>msgParse.info);

                var conn = getConnection(msgParse.dest, computerIDS, websiteIDS);
                if (conn != false) {

                    computerIDS.forEach(function each(computer: connectionInfo) {
                        if (computer.ID === msgParse.source) {
                            var web: connectionInfo | null = null;
                            websiteIDS.forEach(function each(website: connectionInfo) {
                                if (website.ID === msgParse.dest) {
                                    web = website;
                                }
                            });
                            
                            if (web != null) {
                                computer.connectedTo = web;
                                msgParse.ws = conn as Socket;
                                send([msgParse]);

                            } else {
                                send([{
                                    source: "SERVER", 
                                    dest: msgParse.source, 
                                    type: "DISCONNECT",
                                    ws: computer.ws
                                }]);
                            }
                        }
                    });

                    console.log("Sent a 'conACCEPT' command to :", msgParse.dest);

                } else {
                    disconnectComputer(computerIDS, msgParse);
                }

                break;


            ////////////////////////////////////////////////// 
            // Computer | Turtle sends a coonnection denied //
            //             message to a website             //
            //////////////////////////////////////////////////
            //      When the Computer | Turtle sends a      //
            //    connection denied message to a website    //
            //  then send an updated list of computers and  //
            //         what is in use to the website        //
            //////////////////////////////////////////////////

            case "conDENIED":
                log(msgParse.type, <string>msgParse.info);

                var conn = getConnection(msgParse.dest, computerIDS, websiteIDS);
                if (conn != false) {
                    msgParse.ws = conn as Socket;
                    send([msgParse]);
                    console.log("Sent a 'conDENIED' command to:", msgParse.dest);
                } else {
                    disconnectComputer(computerIDS, msgParse);
                }

                break;


            case "PING":
                log(msgParse.type, <string>msgParse.info);

                var conn = getConnection(msgParse.source, computerIDS, websiteIDS);
                if (conn != false) {
                    msgParse.ws = conn as Socket; 
                    msgParse.dest = msgParse.source;
                    msgParse.source = "SERVER";
                    msgParse.type = "PONG";
                    send([msgParse]);
                    send([{source: "SERVER", type:"COMMAND", func:"turtle.forward()", dest: msgParse.source, ws: conn}])
                    
                    log(msgParse.type, <string>msgParse.info);

                } else {
                    console.log("Failed to send a 'PONG' reply to:", msgParse.source);
                }
                break;

            
            // Should get rid of this becuase we don't want someone to be 
            // able to send commands to all computers
            default:
                wss.clients.forEach(function each(client: any) {
                    client.send(JSON.stringify(msgParse));
                });

                console.log("[WARNING]  A broadcast was sent. Msg:", msgParse);

                break; 
        };
    });


    ////////////////////////////////////
    //        On close function       //
    ////////////////////////////////////
    // When a conection is closed the //
    // server will remove it from the //
    //             entrys             //
    ////////////////////////////////////
    
    ws.onclose = function close(event) {
        let delMe: connectionInfo = {ID: "NONE", ws: null, inUse: false, connectedTo: null};
        websiteIDS.forEach(function each(website: connectionInfo) {
            if (website.ws === ws) {
                delMe = website;
            }
        });

        if (delMe.ID == "NONE"){
            computerIDS.forEach(function each(computer: connectionInfo) {
                if (computer.ws === ws) {
                    delMe = computer;
                }
            });
        }



        if (delMe.connectedTo != null) {
            if (delMe.connectedTo != null) {
                var conn: connectionInfo = delMe.connectedTo as connectionInfo;
                conn.inUse = false;
                send([{source: delMe.ID, type: "DISCONNECT", info:"From Server.ts:338", dest: conn.ID, ws: conn.ws}]);
            }
        }


        /////////////////////////////////////
        // Remove the website from records //
        /////////////////////////////////////
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


    
        //////////////////////////////////////////
        // Remove the computer from the records //
        //////////////////////////////////////////
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


        console.log("DelMe.ID:", delMe.ID)
        console.log("Connection closed to:", ws.ID, "\n");
    }
});