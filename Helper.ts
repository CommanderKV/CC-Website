///////////////////////////
// Defining custom types //
///////////////////////////


export type connectionInfo = {
    ID:             number          | string,
    ws:             any             | null,
    inUse:          boolean,
    connectedTo:    connectionInfo  | null
};

export type messageFormat = {
    source: string  | number, 
    type: string,
    info: string    | string[]      | number,
    func: string    | string[]      | boolean,
    dest: string    | number,
    ws: any
};


///////////////
// Functions //
///////////////


//////////////////////
// Sending function //
//////////////////////

export function send(argss: any[]) {
    const args = argss[0];
    const conectionDetails = argss[1];

    let msg = {
        source: args.source || args.src         || conectionDetails.ID, 
        type: args.type     || "",
        info: args.msg      || args.info        || "",
        func: args.func     || args.function    || "",
        dest: args.dest     || args.destination || ""
    };

    if (args.ws.readyState == 1) {
        args.ws.send(JSON.stringify(msg));
        return true;
    } else {
        return false;
    }
    
}


///////////////////////////////////
// Get in use computers function //
///////////////////////////////////

export function getInUseComputers(computerIDS: connectionInfo[]): string[] {
    let inUse: string[] = [];
    computerIDS.forEach(function each(conn: connectionInfo) {
        if (conn.inUse == true) {
            inUse.push(conn.ID as string);
        }
    });
    return inUse || [];
}


//////////////////
// Get ws of ID //
//////////////////

export function getConnection(ID: string | number, computerIDS: connectionInfo[], websiteIDS: connectionInfo[], debug: boolean = false): any | boolean {
    if (debug) {console.log("Looking for '", ID, "'");}
    var returnMe: any | null = null;

    computerIDS.forEach(function each(computer: connectionInfo) {
        if (debug) {console.log("Computer:", computer.ID);}
        if (computer.ID == ID) {
            returnMe = computer.ws;
        }
    });

    websiteIDS.forEach(function each(website: connectionInfo) {
        if (debug) {console.log("Website:", website.ID);}
        if (website.ID == ID) {
            returnMe = website.ws;
        }
    });

    return returnMe || false
}


/////////////////////////////
// Make the computer table //
/////////////////////////////

export function makeComputerTable(msg: messageFormat, connectedComputer: string | null) {
    let tableCode: string = '<tr><th colspan="2">Computers</th><th>Status</th></tr>';

    let computers: string[] = msg.info as string[] || [];
    let inUse: string[] = msg.func as string [] || [];

    if (computers.length > 0) {
        computers.forEach(function each(computer: string){
            tableCode += "<tr><td>" + computer + '</td><td><button';
            tableCode += " id=\"" + computer + '">Select</button></td>';
            if (computer in inUse) {
                tableCode += '<td id="' + computer + 'STATUS">In Use</td>';
            
            } else if (connectedComputer !== null && connectedComputer == computer) {
                tableCode += "<td id=\"" + computer + "STATUS\">Connected";

            } else {
                tableCode += '<td id="' + computer + 'STATUS">Open</td>';
            }

            tableCode += "</tr>"
        })
    } else {
        tableCode += '<tr><td colspan="3">No computers are online</td></tr>';
    }
    
    return tableCode;

    // <button onclick="select('Computer: 0')" id="Computer: 0">Select</button>


    /*
    if (inUse.length > 0) {
        computers.forEach(function each(computer: string){
            if (computer in inUse) {
                var button = document.getElementById(computer) as HTMLInputElement;
                button.disabled = true;
            } else {
                var button = document.getElementById(computer) as HTMLInputElement;
                button.disabled = false;
            };
        });
    };*/
}


///////////////////////////////////
// Send a disconnect to computer //
///////////////////////////////////

export function disconnectComputer(computerIDS: connectionInfo[], msgParse: messageFormat){
    computerIDS.forEach(function each(computer: connectionInfo) {
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


//////////////////////////////////
// Send a disconnect to website //
//////////////////////////////////

export function disconnectWebsite(websiteIDS: connectionInfo[], msgParse: messageFormat){
    websiteIDS.forEach(function each(website: connectionInfo) {
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