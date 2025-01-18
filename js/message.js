const MESSAGE_STATUS_NEW = 0;
const MESSAGE_STATUS_SENDING = 1;
const MESSAGE_STATUS_SENT = 2;

var messages = [];

var messageCounter = 0;

function ackSent(ackMsg) {
    let ackParts = ackMsg.split(':::');
    let msgId = ackParts[0];
    if (ackParts[1].startsWith("ERROR")) {
        console.log("Error sending the message ("+ msgId +"). ");
        msg = findMessage(msgId);
        if (msg==null) {
            console.log("Message not found for resending!");
            return;
        } else {
            msg.send();
        }
    } else {
        console.log("Acked sent data." + ackMsg);
        msg = findMessage(msgId);
        if (msg==null) {
            console.log("Message "+ msgId +" not found for removing from messages!");
            return;
        } else {
            messages.splice(msg.index, 1);
        }
    }
}

function findMessage(msgId) {
    for(let i = 0; i< messages.length; i++) {
        if (messages[ i ].id == msgId) {
            return messages[ i ];
        }
    }
    return null;
}

class Message {
    constructor(sender, to, msgType,  msgData) {
        this.sender = sender;
        this.to = to;
        this.msgType = msgType;
        this.msgData = msgData;
        this.msg = this.createMsgBody();
        this.status = MESSAGE_STATUS_NEW;
        this.id = messageCounter;
        messageCounter++;
        this.index = messages.length;
        messages.push(this);
    }

    createMsgBody() {
        let msgBody = '{"sender": "'+ this.sender +'", "to": "'+this.to + '", "msg" : "' + this.msgType + '"';
        if (this.msgData == null) {
            msgBody += '}';
        } else {
            msgBody += ', ' + this.msgData + '}';
        }
        console.log("Message body:\n" + msgBody);
        return msgBody;
    }

    send() {
        this.status = MESSAGE_STATUS_SENDING;
        processSend(this.msg, this.id);
    }
}