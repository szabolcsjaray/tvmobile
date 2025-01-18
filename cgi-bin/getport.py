#!python3
import socket
from time import sleep
import sys
from urllib.parse import urlparse
from urllib.parse import parse_qs
import os


def answer(port):
    print(str(port))

def getDataFromSocket(name):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    port = 14532

    s.connect(('127.0.0.1', port))
    #print("Connected to " + str(port) +" port.")
    try:
        #print("Sending...")
        s.send(name.encode())
        #print("sent: " + sys.argv[2])
        #print("Receiving response...")
        received = s.recv(1024).decode()
        #print("Received: " + received)
    except Exception as e:
        print("Client exception: " + str(e))

    #print("Closing connection.")
    s.close()
    #print("Closed.")
    return received
    

print( "Content-Type: text/html")
print()
query = os.environ.get("QUERY_STRING", "No Query String in url")
name_value = parse_qs(query)['name'][0]
#print(name_value)
receivedports = getDataFromSocket(name_value)
answer(receivedports)

