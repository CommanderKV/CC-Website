import { messageFormat, send, makeComputerTable } from "./Helper.js";

var ws = new WebSocket("wss://caac-104-222-117-183.ngrok.io"); // ws://localhost:8081

function getID(max: number): number {
    return Math.floor(Math.random() * max+1);
};


var connectionDetails: details = {
    ID: getID(100000),
    computerName: null,
    conRequest: null
};

type details = {
    ID: number, 
    computerName: string | number | null,
    conRequest: string | null
};

//////////////////////////////
// When we recive a message //
//////////////////////////////

ws.onmessage = function (event) {
    let msg: messageFormat = JSON.parse(event.data);

    switch (msg.type) {
    
        case "COMPUTERNAME":
            console.log("Processing a 'COMPUTERNAME' command ...");
        
            connectionDetails.computerName = msg.source;

            console.log("Completed 'COMPUTERNAME' command ...");

            break;


        ///////////////////////////////
        // Set the computer table up //
        ///////////////////////////////

        case "computersACCEPT" || "COMPUTERS": 

            var table: string = makeComputerTable(msg, connectionDetails.computerName as string);
            var tableLink = <HTMLTableElement>document.getElementById("Computers");
            tableLink.innerHTML = table;

            var computers: string[] = msg.info as string[] || [];
            if (computers.length > 0) {
                computers.forEach(function each(computer: string) {
                    let link = document.getElementById(computer);
                    link?.addEventListener("click", () => {
                        select(computer);
                    });
                })
            } 

            break;


        ////////////////////////////////////////
        // Connection request from website to //
        //   Computer | Turtle was accepted   //
        ////////////////////////////////////////
        
        case "conACCEPT":
            console.log("Processing a 'conACCEPT' command ...");

            var ID: string = connectionDetails.conRequest as string;
            connectionDetails.conRequest = null;
            connectionDetails.computerName = msg.source;
            var status = <HTMLTableCellElement>document.getElementById(ID+"STATUS");
            status.innerHTML = "Connected";

            console.log("Completed 'conACCEPT' command ...");

            break;


        ////////////////////////////////////////
        // Connection request from website to //
        //    Computer | Turtle was denied    //
        ////////////////////////////////////////

        case "conDENIED":
            console.log("Processing a 'conDENIED' command ...");

            makeComputerTable(msg, connectionDetails.computerName as string);

            console.log("Completed 'conDENIED' command ...");

            break;


        /////////////////////////////////////
        // Whoever we are connected to has //
        //  disconnected from the network  //
        /////////////////////////////////////
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
    };
};



ws.onopen = function(event) {
    console.log("Websocket is open");
    console.log(connectionDetails.ID);
    console.log("Sent a 'webNAME' command");
    var res = send([{type: "webNAME", msg: connectionDetails.ID, ws: ws}, connectionDetails]);
}






function select(ID: any) {
    // Contact that Computer | Turtle and attempt connection
    // If the connection is successful then change 
    // connectionDetails.computerName to the computers ID
    connectionDetails.conRequest = ID;
    console.log("Sent a 'conREQUEST' command");
    send([{source: connectionDetails.ID, type: "conREQUEST", msg: connectionDetails.ID, dest: ID, ws: ws}, connectionDetails])
}


document.getElementById("RefreshComps")?.addEventListener("click", refreshComputers)
function refreshComputers() {
    console.log("Sent a 'computersREQUEST' command");
    send([{type: "computersREQUEST", dest: "SERVER", ws: ws}, connectionDetails]);
}

setInterval(() => {
    console.log("Sent a 'computersREQUEST' command");
    send([{type: "computersREQUEST", dest: "SERVER", ws: ws}, connectionDetails]);
}, 10*1000);

window.onunload = function() {
    ws.close();
};


var directions = [
    "Forward",
    "Back",
    "Right",
    "Left",
    "Up",
    "Down"
]

var directionCommands = [
    forward,
    back,
    right,
    left,
    up,
    down
]

directions.forEach(function each(direction, index) {
    document.getElementById(direction)?.addEventListener("click", directionCommands[index]);
});


function forward(){
    if (connectionDetails.computerName !== null) {
        console.log("Sent a 'COMMAND' command");
        send([{
                type:"COMMAND", 
                dest:connectionDetails.computerName, 
                func:"return turtle.forward()", 
                ws: ws
            },
            connectionDetails
        ]);
    }
}

function right(){
    if (connectionDetails.computerName !== null){
        console.log("Sent a 'COMMAND' command");
        send([{
                type:"COMMAND", 
                dest:connectionDetails.computerName, 
                func:"return turtle.turnRight()", 
                ws: ws
            },
            connectionDetails
        ]);
    }
}

function left(){
    if (connectionDetails.computerName !== null){
        console.log("Sent a 'COMMAND' command");
        send([{
                type:"COMMAND", 
                dest:connectionDetails.computerName, 
                func:"return turtle.turnLeft()", 
                ws: ws
            },
            connectionDetails
        ]);
    }
}

function back(){
    if (connectionDetails.computerName !== null){
        console.log("Sent a 'COMMAND' command");
        send([{
                type:"COMMAND", 
                dest:connectionDetails.computerName, 
                func:"return turtle.back()", 
                ws: ws
            },
            connectionDetails
        ]);
    }
}

function up(){
    if (connectionDetails.computerName !== null){
        console.log("Sent a 'COMMAND' command");
        send([{
                type:"COMMAND", 
                dest:connectionDetails.computerName, 
                func:"return turtle.up()", 
                ws: ws
            },
            connectionDetails
        ]);
    }
}

function down(){
    if (connectionDetails.computerName !== null){
        console.log("Sent a 'COMMAND' command");
        send([{
                type:"COMMAND", 
                dest:connectionDetails.computerName, 
                func:"return turtle.down()", 
                ws: ws
            },
            connectionDetails
        ]);
    }
}