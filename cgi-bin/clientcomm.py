#!python3
# -*- coding: utf-8 -*-
import socket
from time import sleep
import sys
from urllib.parse import urlparse
from urllib.parse import parse_qs
import os

MAX_TRIES = 20

def print_enc(str):
    sys.stdout.buffer.write(str.encode("utf8") + b'\n')


def getDataFromSocket(port, type, msg, name):
    receivedSet = False
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    notConnected = True
    tryNumber = 0
    exc = None
    while notConnected and tryNumber < MAX_TRIES:
        try:
            s.connect(('127.0.0.1', int(port)))
            notConnected = False
        except Exception as connectExc:
            sleep(0.1)
            tryNumber = tryNumber + 1
            exc = connectExc

    if notConnected:
        return "ERROR CONNECTION (" + str(port) +":" + name + ") ->" + str(exc)

    #print("Connected to " + str(port) +" port.")
    try:
        #print("Sending...")
        if (type == "send"):
            s.send((msg).encode())
        #print("sent: " + sys.argv[2])
        #print("Receiving response...")
        received = s.recv(1024).decode()
        receivedSet = True
        #print("Received: " + received)
    except Exception as e:
        return "ERROR Client exception (" + str(port) +":" + name + ") ->" + str(e)

    #print("Closing connection.")
    s.close()
    #print("Closed.")
    if not receivedSet:
        received = "ERROR"

    return received
    

print_enc( "Content-Type: text/html")
print_enc("")
query = os.environ.get("QUERY_STRING", "No Query String in url")
type_value = parse_qs(query)['type'][0]
if (type_value=="send"):
    msg_value = parse_qs(query)['msg'][0]
else:
    msg_value = None

port_value = parse_qs(query)['port'][0]
name_value = parse_qs(query)['name'][0]
id_value = parse_qs(query)['id'][0]
#print(name_value)
response = id_value + ":::" + getDataFromSocket(port_value, type_value, msg_value, name_value)
print_enc(response)

