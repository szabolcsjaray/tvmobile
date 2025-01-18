import json

msg = '{"sender": "randomSender", "to": "Bela","letters": ["A", "B"]}'
y = json.loads(msg)
print(y["to"])