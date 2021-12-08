
-- Make sure to install json --
os.loadAPI("json")


local computerName = "Computer: "..os.getComputerID()
local connection = {
    server = "ws://caac-104-222-117-183.ngrok.io",
    socket = nil,
    connectedTo = nil,
    inUse = false
}

----------------------
-- Sending function --
----------------------
function send(...)
    local args = arg[1]
    local tries = args.tries or 0

    local msg = {
        source = args.source    or computerName,
        type = args.type        or "",
        info = args.msg         or args.info            or args.information     or "",
        func = args.func        or "",
        dest = args.dest        or args.destination     or ""
    }

    connection.socket.send(json.encode(msg))
    --print("Sent a '"..msg.type.."' message")
end


------------------------
-- Conecting function --
------------------------
function connect(forceConnection)
    if not connection.socket or forceConnection then
        if connection.socket then 
            connection.socket.close() 
        end

        local ws, err = http.websocket(connection.server)

        if not ws then 
            error("Server '"..connection.server.."' is unavailable") 
        end

        if ws then
            connection.socket = ws

            -- Send our name --
            if forceConnection then
                send({type="computerNAME", info=computerName, func=false})
            else
                send({type="computerNAME", info=computerName, func=true})
            end
        end
    end
end


----------------------
-- Receive function --
----------------------
function receive(...)
    local i = arg[1] or 0

    -- Check for connection loss --
    if i > 5 then
        send({type="PING", dest="SERVER"})
        local ok, msg = pcall(connection.socket.receive)
        if msg == nil  or ok == false then
            return "RE-CONNECT"
        else
            local msg = json.decode(msg)
            if msg.type == "PONG" then
                return "RE-RUN"
            end
        end
    end

    -- Wait for message -- 
    local ok, msg = pcall(connection.socket.receive)
    if ok == false and msg == nil then
        return "RE-CONNECT"
    elseif msg == nil then
        return receive(i+1)
    else
        return json.decode(msg)
    end
end

----------------------------------
-- Drawing screen info function --
----------------------------------
function draw(...)
    function getLayout(...)
        local default = arg[1] or true
        local args = arg[2]
        local msg = {
            title=                  args.title       or  "CC - Website Link (ONLINE)",
            sec1= {
                sec1Title=          args.sec1title   or "Statistics:",
                computerIDnetwork=  args.compIDnet   or computerName,
                computerIDdefault=  args.copmIDdef   or "Computer: "..os.getComputerID(),
                lastMessageSent=    args.lastMsgsent or "",
                lastMessageRecv=    args.lastMsgRecv or ""
            },
            sec2= {
                sec2Title=          args.sec2Title   or "Message details:",
                func=               args.func        or "-----",
                source=             args.source      or "-----",
                type=               args.type        or "-----",
                dest=               args.dest        or "-----"
            }
        }
        return msg
    end

    local args = arg[1]
    local update = arg[2] or false
    local msg = getLayout(false,  args)

    -----------------------------
    -- If user wants to update --
    -- what is being displayed --
    --           then          --
    -----------------------------
    if update then
        local line = arg[3]
        term.setCursorPos(1, line)
        term.clearLine()
        term.write(args)

    ---------------
    -- Otherwise --
    ---------------
    else
        term.clear()
        term.setCursorPos(1, 1)
        term.write(msg.title)   -- 1
        

        term.setCursorPos(1, 3)
        term.write(msg.sec1.sec1Title)                                              -- 3
        
        term.setCursorPos(1, 4)
        term.write("\tComputer ID (network): '"..msg.sec1.computerIDnetwork.."'")   -- 4
        
        term.setCursorPos(1, 5)
        term.write("\tComputer ID (default): '"..msg.sec1.computerIDdefault.."'")   -- 5
        
        term.setCursorPos(1, 6)
        term.write("\tLast message (sent): '"..msg.sec1.lastMessageSent.."'")       -- 6
        
        term.setCursorPos(1, 7)
        term.write("\tLast message (received): '"..msg.sec1.lastMessageRecv.."'")   -- 7
        

        term.setCursorPos(1, 9)
        term.write(msg.sec2.sec2Title)                          -- 9
        
        term.setCursorPos(1, 10)
        term.write("\t\tSource:   "..msg.sec2.source)         -- 10

        term.setCursorPos(1, 11)
        term.write("\t\tDest:     "..msg.sec2.dest)           -- 11

        term.setCursorPos(1, 12)
        term.write("\t\tType:     "..msg.sec2.type)           -- 12

        term.setCursorPos(1, 13)
        term.write("\t\tFunc:     "..msg.sec2.func)           -- 13

    end
end 



-------------------
-- Main function --
-------------------
local lastMSG = ""
local lastMSGsentG = ""
local lastMsgFull = {source=false, type=false, dest=false,func=false};
function main()
    term.clear()
    while true do
        
        local titleMade = nil
        if connection.connectedTo ~= nil then
            titleMade = "CC - Website Link (Connected To) "..connection.connectedTo
        end


        draw({
            title=          titleMade,
            lastMsgRecv=    lastMSG,
            lastMsgsent=    lastMSGsentG,
            source=         lastMsgFull.source,
            type=           lastMsgFull.type,
            dest=           lastMsgFull.dest,
            func=           lastMsgFull.func,
        })

        local obj = receive()
        -- print("OBJ:", obj)
        if obj == string then
            if obj == "RE-RUN" then
                while obj == "RE-RUN" do
                    local obj = receive()
                end
            elseif obj == "RE-CONNECT" then
                connect(true)
            else
                error(obj)
            end
        end

        if obj == nil then
            error("Terminated")
        end

        local sentBy = obj.source
        lastMsgFull = obj

        

        -------------------------------------
        -- Make sure the package is for me --
        -------------------------------------
        if obj.dest == computerName then


            ------------------------------
            -- If the server sends us a --
            --  command or the user we  --
            --   are connected to does  --
            --    then execute it and   --
            --     return the value     --
            ------------------------------
            if obj.type == "COMMAND" and (obj.source == connection.connectedTo or obj.source == "SERVER") then
                local func = loadstring(obj.func)
                local res = func()

                send({type="RETURN", msg=res, dest=connection.connectedTo})


                lastMSGsentG = "RETURN"
                lastMSG = "COMMAND"
            

            -------------------------------------
            -- If a connection request is sent --
            --  from a website then decide if  --
            --      we can connect or not      --
            -------------------------------------
            elseif obj.type == "conREQUEST" then
                local senderID = obj.info
                if sentBy == senderID then
                    if not connection.inUse then
                        send({type="conACCEPT", dest=senderID})
                        connection.connectedTo = sentBy
                        connection.inUse = true
                        lastMSGsentG = "conACCEPT"
                        --print("Sent conACCEPT", lastMSGsent)

                    else
                        send({type="conDENIED", dest=senderID})
                        lastMSGsentG = "conDENIED"

                    end
                end
                lastMSG = "conREQUEST"


            -------------------------------------
            -- If the website we are connected --
            --  to disconnects then reset our  --
            --               info              --
            -------------------------------------
            elseif obj.type == "DISCONNECT" then
                connection.inUse = false
                connection.connectedTo = nil
                lastMSG = "DISCONNECT"


            --------------------------------
            -- We don't want this to ever -- 
            --   happen but just in case  --
            --------------------------------
            elseif obj.type == "updateNAME" then
                local name = obj.info
                computerName = name
                lastMSG = "updateNAME"
                os.setComputerLabel(computerName)
            end
        
        else
            print("Got a package that was not for me:")
            print(obj)
            sleep(1)
        end
    end
end



------------------------------
-- Connect to the webSocket --
------------------------------
connect()
if connection.socket then
    local ok, val = pcall(main)
    os.setComputerLabel(computerName)
    if not ok then
        if string.find(val, "Terminated") then
            connection.socket.close()
            print("\nProgram terminated")
        else
            connection.socket.close()
            print(textutils.serialise(val))
        end
    end
end
