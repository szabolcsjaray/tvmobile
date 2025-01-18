import socket
from time import sleep


s = socket.socket()
port = 14532
s.bind(('', port))
s.listen(5)
c, addr = s.accept()
print("connection accepted:" + str(c) + str(addr))
going = True
while going:
    #sleep(10)
    received = c.recv(1024)
    print(received.decode())
    if (received.decode()=="over"):
        going = False
    else:
        respMessage = 'this is sent'
        response_headers = {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                'Content-Length': len(respMessage),
                'Connection': 'close',
        }

        response_headers_raw = ''.join('%s: %s\r\n' % (k, v) for k, v in response_headers.items())
        response_proto = 'HTTP/1.1'
        response_status = '200'
        response_status_text = 'OK' # this can be random

        # sending all this stuff
        r = '%s %s %s\r\n' % (response_proto, response_status, response_status_text)
        c.sendall(r.encode())
        c.sendall(response_headers_raw.encode())
        c.sendall(b'\r\n')        
        c.sendall('this is sent'.encode())


c.close()
print("program is over")
