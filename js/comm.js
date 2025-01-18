// message types ; c: client sends, s: server (TV) sends
const MSG_NEW_PLAYER = "newPlayer"; //c
const MSG_START_GAME = "startGame"; //c
const MSG_INIT_LETTERS = "initLetters"; //s
const MSG_BOOK_FIELDS = "bookFields"; //c
const MSG_BOOKING_SUCCESS = "bookingSuccess"; //s
const MSG_BOOKING_FAILED = "bookingFailed"; //s
const MSG_NEW_RESERVED_FIELDS = "newReservedFields"; //s
const MSG_PLAYER_SEND_WORD_TILES = "playerSendingTiles";  //c
const MSG_PLAYER_CANCEL_BOOKING = "playerCancelBooking"; //c
const MSG_UPDATE_TABLE = "updateTable"; //s
const MSG_GIVE_NEW_TILES = "giveNewTiles"; //s

const CLIENT_URL_BASE = "cgi-bin\\clientcomm.py";

const TV_NAME = "__TV";
const TO_EVERYONE = "*";

const LISTEN_TYPE = "listen";
const SEND_TYPE = "send";

var listenMessageId = 1000;

// util functions  //////////////

function el(id) {
    return document.getElementById(id);
}

// Fisher-Yates (Knuth)
function shuffle(array) {
    let currentIndex = array.length;
  
    while (currentIndex != 0) {
      let randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
}

function getCoordPair(x,y) {
    return [x, y];
}

function coordUp(coordPair) {
    return [coordPair[0], coordPair[1]-1];
}
function coordDown(coordPair) {
    return [coordPair[0], coordPair[1]+1];
}
function coordLeft(coordPair) {
    return [coordPair[0]-1, coordPair[1]];
}
function coordRight(coordPair) {
    return [coordPair[0]+1, coordPair[1]];
}

// finds an array in an array of arrays
function findArr(inArray, arrayToFind) {
    for(let i = 0; i < inArray.length; i++ ) {
        let checkArray = inArray[ i ];
        let match = (checkArray.length == arrayToFind.length);
        for(let j = 0; match && j < checkArray.length; j ++) {
            match &= (arrayToFind[j] == checkArray[ j ]);
        }
        if (match) {
            return i;
        }
    }
    return -1;
}

// comm functions  /////////////

function createReqUrl(urlBase, queryType, name, port, msg, id) {

    return urlBase + "?type=" + queryType 
        + "&port=" + port 
        + "&name=" + encodeURIComponent(name)
        + "&id=" + (queryType == LISTEN_TYPE ? listenMessageId++ : id)
        + (msg!=null ? "&msg=" + encodeURIComponent(msg) : "");
}

function processSend(msg, id) {
    console.log("Sending message " + id + ", " + msg);
    readResource(createReqUrl(CLIENT_URL_BASE, SEND_TYPE, myName, sendPort, msg, id), ackSent);
}

// implement this in the application!
/*
function ackSent(ackMsg) {
    console.log("Acked sent data." + ackMsg);
}*/

function processPorts(text) {
    port = text;
    console.log("ports read:" + port);
    listenPort = port.split(',')[0];
    sendPort = port.split(',')[1];
    console.log("ports: "+ listenPort + ", " + sendPort);
    readResource(createReqUrl(CLIENT_URL_BASE, LISTEN_TYPE, myName, listenPort, null, null), processReceivedData);
}

// the processReceivedData function must be implemented in the device/app specific js file!
/*function processReceivedData(data) {
    if (data==null || data.length == 0) {
        return;
    }
    el("resultreceived").innerHTML = "received data: " + data;
    el("allmessages").innerHTML = el("allmessages").innerHTML + "<br>" + data + " - " + new Date().getTime();
    readResource("cgi-bin\\clientcomm.py?type=listen&port="+listenPort+"&name="+encodeURIComponent(myName), processReceivedData);
}*/

function readResource(resource, process) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            // Typical action to be performed when the document is ready:
            console.log("returned value: " + xhttp.responseText);
            process(xhttp.responseText);
        }
    };
    xhttp.open("GET", resource, true);
    xhttp.send();
}
