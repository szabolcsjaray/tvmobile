import socket
import threading
from time import sleep
from queue import Queue
import json

connections = []
overStr = ""
ports = {}

acceptingSocketPort = 14532

LISTEN_TYPE = 1
SEND_TYPE = 2
PORTS_START = 14540
PORTS_END = 14560

TV_NAME = "__TV"
TO_EVERYONE = "*"
tvSendConnection = None
tvReceiveConnection = None

def portDesc(name, port, typeStr):
    return "["+name+":"+str(port)+"/"+typeStr+"]"

def portThread(name, port, queue, type):
    global overStr
    global connections

    typeStr = "listening" if type == LISTEN_TYPE else "sending"
    print(portDesc(name, port, typeStr)+" New thread is starting for port: " + str(port) + " " + typeStr)
    notOver = True
    while notOver:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)    
        s.bind(('', port))
        s.listen(5)
        print(portDesc(name, port, typeStr)+" Waiting for connection...")
        c, addr = s.accept()
        print(portDesc(name, port, typeStr)+" Connection opened on port: " +str(port))
        try:
            if type==SEND_TYPE:
                print(portDesc(name, port, typeStr)+" waiting for new message...")
                received = c.recv(1024)
                if (received == b''):
                    print(portDesc(name, port, typeStr)+" Client socket closed.")
                else:
                    message = received.decode()
                    jsonMsg = json.loads(message)

                    print(portDesc(name, port, typeStr)+" Message arrived: " + message)
                    for con in connections:
                        if (con["name"] != name and con["type"] == LISTEN_TYPE):
                            if jsonMsg["to"] == TO_EVERYONE or jsonMsg["to"] == con["name"]:
                                print(portDesc(name, port, typeStr)+" put " + message + " on queue for port: " + str(con["port"]))
                                con["queue"].put(message)
                    c.sendall("OK".encode())
                    print(portDesc(name, port, typeStr)+" Sent back OK.")

            else:  #LISTEN_TYPE
                print(portDesc(name, port, typeStr)+" Waiting for queue data....")
                broadcast = queue.get()
                print(portDesc(name, port, typeStr)+" Received broadcast to send back: " + broadcast)
                c.sendall(broadcast.encode())
                print(portDesc(name, port, typeStr)+" Broadcast was sent back")

            if (overStr=="over"):
                notOver = False

            c.close()
            s.close()
        except Exception as e:
            print(portDesc(name, port, typeStr)+" Exception in listener: " + str(e))
            overStr = "over"
            notOver = False
    
    print(portDesc(name, port, typeStr)+" Freeing port " + str(port))
    ports[port] = None
    fcon = None
    for con in connections:
        if (con["port"] == port):
            fcon = con
            break
    if (fcon != None):
        connections.pop(connections.index(fcon))
    print(portDesc(name, port, typeStr)+" Port thread ended.")


def accepting():
    global overStr
    global ports
    global acceptingSocketPort
    global tvSendConnection
    global tvListenConnection

    print("accepting thread started")
    notOver = True
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind(('', acceptingSocketPort))
    s.listen(5)
    print("Server socket for accepting is created.")
    while notOver:
        try:
            print("Waiting for new connection in accepting...")
            c, addr = s.accept()
            print("New connection accepted:")
            print(str(c) + str(addr))
            print("Receiving message...")
            received = c.recv(1024)
            sentResponse = False
            name = received.decode()
            print("Received name:" + name)
            overStr = name
            if overStr=="over":
                notOver = False
            else:
                listenPort = findListenPort(name)
                if listenPort == None:
                    listenPort = findEmptyPort()
                    if (listenPort == None):
                        raise Exception("Out of ports.")
                    print("Found empty port for new connection/listen:" + str(listenPort))
                    newListenQueue = Queue()
                    newListenThread = threading.Thread(target=portThread, args=(name, listenPort, newListenQueue, LISTEN_TYPE), daemon=True)
                    ports[listenPort] = newListenThread
                    
                    sendPort = findEmptyPort()
                    if (sendPort == None):
                        raise Exception("Out of ports.")
                    print("Found empty port for new connection/send:" + str(sendPort))
                    newSendThread = threading.Thread(target=portThread, args=(name, sendPort, None, SEND_TYPE), daemon=True)
                    ports[sendPort] = newSendThread
                    
                    connections.append({"port" : listenPort, "name" : name, "queue": newListenQueue, "type": LISTEN_TYPE})
                    connections.append({"port" : sendPort, "name" : name, "queue": None, "type": SEND_TYPE})
                    if (name==TV_NAME):
                        tvListenConnection = connections[len(connections)-2]
                        tvSendConnection = connections[len(connections)-1]
                        print("Starting new TV threads...")
                        newListenThread.start()
                        newSendThread.start()
                        print("New TV threads started.")
                    else:
                        reportSuccess = reportPlayerToTV(name)
                        if not reportSuccess:
                            print("Sending empty response, as no TV was registered.")
                            c.sendAll("-,-")
                            sentResponse = True
                            print("Removing added conections.")
                            connections.pop()
                            connections.pop()
                        else:
                            print("Starting new player threads...")
                            newListenThread.start()
                            newSendThread.start()
                            print("New player threads started.")
                else:
                    sendPort = findSendPort(name)

                if not sentResponse:
                    print("Send listen and send ports back...")
                    c.sendall((str(listenPort) + "," + str(sendPort)).encode())

                print("Closing acceptance connection.")
                c.close()
                
        except Exception as e:
            print("Exception in accepting: " + str(e))
            overStr = "over"
            notOver = False

    s.close()
    print("Accepting new connections closed.")

def reportPlayerToTV(name):
    global tvListenConnection

    if tvListenConnection == None:
        print("TV connections are not yet registered!")
        return False
    
    print("Reporting new player"+name+" to TV...")
    tvListenConnection["queue"].put('{"sender":"server","msg":"newPlayer","name":"'+name+'"}')
    print("Reporting completed.")
    return True

def findListenPort(name):
    for connection in connections:
        if connection["name"] == name and connection["type"] == LISTEN_TYPE:
            return connection["port"]
    return None

def findSendPort(name):
    for connection in connections:
        if connection["name"] == name and connection["type"] == SEND_TYPE:
            return connection["port"]
    return None



def findEmptyPort():
    global ports
    for port in ports:
        if (ports[ port ] == None):
            return port
    return None


def initPorts():
    global ports
    global PORTS_START
    global PORTS_END

    i = PORTS_START
    while (i < PORTS_END):
        ports[i] = None
        i = i + 1


print("TMserver started")
initPorts()

t1 = threading.Thread(target=accepting, args=())
t1.start()
running = True
lastLen = len(connections)

while running:
    try:
        if overStr=="over":
            running = False

        if (lastLen == len(connections)):
            sleep(1)
        else:
            lastLen = len(connections)
            print("----------")
            print("Connection update:")
            print(connections)
            print("----------")
    except:
        running = False
print("print cycle over")
