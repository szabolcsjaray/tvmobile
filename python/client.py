import socket
from time import sleep
import sys

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

port = 14532
if (sys.argv[1] != "-"):
    port = int(sys.argv[1])
else:
    print("Default port.")

print("Using "+ str(port) + " connecting port.")

try:
    s.connect(('127.0.0.1', port))
except Exception as e1:
    print("Exception at connecting: " + str(e1))

print("Connected to " + str(port) +" port.")
try:
    print("Sending...")
    s.send(sys.argv[2].encode())
    print("sent: " + sys.argv[2])
    print("Receiving response...")
    received = s.recv(1024).decode()
    print("Received: " + received)
except Exception as e:
    print("Client exception: " + str(e))

print("Closing connection.")
s.close()
print("Closed.")

