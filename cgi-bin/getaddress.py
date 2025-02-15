import socket

print( "Content-Type: text/html")
print()
print(socket.gethostbyname(socket.gethostname()).strip()+":8000")
