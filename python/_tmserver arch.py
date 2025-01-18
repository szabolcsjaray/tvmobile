import socket
import threading
from time import sleep
from queue import Queue

connections = []
overStr = ""
threads = []
ports = {}

acceptingSocketPort = 14532

def listenerThread(name, port, queue):
    global overStr
    global connections

    print("["+name+":"+str(port)+"] New thread is starting for port: " + str(port))
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)    
    s.bind(('', port))
    s.listen(5)
    print("["+name+":"+str(port)+"] Waiting for connection...")
    c, addr = s.accept()
    print("["+name+":"+str(port)+"] Connection opened on port: " +str(port))
    notOver = True
    while notOver:
        try:
            print("["+name+":"+str(port)+"] waiting for new message...")
            received = c.recv(1024)
            if (received == b''):
                print("["+name+":"+str(port)+"] Client socket closed.")
                notOver = False
            else:
                message = received.decode()
                print("["+name+":"+str(port)+"] Message arrived: " + message)
                if (message=="listen"):
                    print("["+name+":"+str(port)+"] Waiting for queue data....")
                    broadcast = queue.get()
                    print("["+name+":"+str(port)+"] Received broadcast to send back: " + broadcast)
                    c.sendall(broadcast.encode())
                    print("["+name+":"+str(port)+"] Broadcast was sent back")
                    notOver = False
                else:
                    for con in connections:
                        if (con["name"] != name):
                            print("["+name+":"+str(port)+"] put " + message + " on queue for port: " + str(con["port"]))
                            con["queue"].put(message)
                    c.sendall("OK".encode())
                    print("["+name+":"+str(port)+"] Sent back OK.")
            if (overStr=="over"):
                notOver = False
        except Exception as e:
            print("["+name+":"+str(port)+"] Exception in listener: " + str(e))
            overStr = "over"
            notOver = False
    
    c.close()
    s.close()
    print("["+name+":"+str(port)+"] Freeing port " + str(port))
    ports[port] = None
    fcon = None
    for con in connections:
        if (con["port"] == port):
            fcon = con
            break
    if (fcon != None):
        connections.pop(connections.index(fcon))


def accepting():
    global overStr
    global ports
    global acceptingSocketPort

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
            receivedStr = received.decode()
            print("Received message:" + receivedStr)
            overStr = receivedStr
            if overStr=="over":
                notOver = False
            else:
                emptyPort = findEmptyPort()
                print("Found empty port for new connection:" + str(emptyPort))
                newQueue = Queue()
                connections.append({"port" : emptyPort, "name" : receivedStr, "queue": newQueue})
                print("Send empty port back...")
                c.sendall(str(emptyPort).encode())
                print("Closing acceptance connection.")
                c.close()
                
                newThread = threading.Thread(target=listenerThread, args=(receivedStr, emptyPort, newQueue), daemon=True)
                ports[emptyPort] = newThread
                threads.append({"name" : receivedStr,  "thread" : newThread})
                print("Starting new thread...")
                newThread.start()
                print("New thread started.")
        except Exception as e:
            print("Exception in accepting: " + str(e))
            overStr = "over"
            notOver = False

    s.close()


def findEmptyPort():
    global ports
    for port in ports:
        if (ports[ port ] == None):
            return port
    return None


def initPorts():
    global ports
    i = 14540
    while (i < 14580):
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
