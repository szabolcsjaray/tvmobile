var myName = TV_NAME;

var players = [];

var letters = [];

var game = new Game();
var boardData;

const TILE_NUM = "tileNum";
const WORD_NUM = "wordNum";
const POINT_NUM = "pointNum";

const MAX_LETTER_NUM = 7;

const GAME_NAME = "REAL TIME SCRABBLE BATTLE";

function init() {
    console.log("init started.");
    boardData = boardInit("board", el("all"), null);
    startTv();
    updateStats(0,0,0);
    generateLetters();
}

function generateLetters() {

    for(let i = 0; i < HunLetters.length; i++) {
        for(let j = 0; j < HunLetters[i][1]; j++) {
            letters.push(HunLetters[i][0]);
        }
    }
    shuffle(letters);
    console.log(letters);
}

function updateStats(tileNum, wordNum, pointNum) {
    setSpan(TILE_NUM, tileNum);
    setSpan(WORD_NUM, wordNum);
    setSpan(POINT_NUM, pointNum);
}

function setSpan(id, value) {
    el(id).textContent = value;
}

function addWordToTable(word, player, point) {
    let wt = el("wordsTable");
    let newTr = "<tr class=\"wordRow\"><td class=\"word\">"+word+"</td><td>"+player+"</td><td class=\"point\">"+point+"</td></tr>";
    wt.innerHTML = wt.innerHTML.replace("<tbody>", "<tbody>"+newTr);
}

function addNewPlayer(player) {
    let newPlayer = new Player(player, port, players.length);
    players.push(newPlayer);
    let newPlayerRows = 
        '<tr class="nameRow">'+
        '<td class="name"><span id="pl1Name">'+player+'</scan></td><td class="point"><scan id="pl1Point'+player+'">0 p</scan></td></tr><tr class="wordRow">'+
        '<td class="word"><scan id="pl1Last">-</scan></td><td class="point"><scan id="pl1LastPoint"></scan></td></tr>';
    let pT = el("playerTable");
    pT.innerHTML = pT.innerHTML.replace("<tbody>", "<tbody>" + newPlayerRows);
}

function startTv() {
    readResource("cgi-bin\\getport.py?name="+encodeURIComponent(myName), processPorts);
}

function bookingFieldsSuccess(booked, surrounding) {
    return !(boardData.isAnyReserved(booked) || boardData.isAnyReserved(surrounding));
}

function checkAndAddFreedSurrounding(surrFields, x, y) {
    boardData.removeSurroundings(surrFields);
}

function extractCoords(tileArray) {
    let coords = [];
    for(let i = 0; i < tileArray.length; i++) {
        coords.push([tileArray[i].x, tileArray[i].y]);
    }
    return coords;
}

function freeBookingsAndAround(tiles) {
    let freedBookedCoords = [];
    let freedSurroundingFields = [];
    for(let i = 0; i < tiles.length; i++) {
        let field = tiles[i];
        freedBookedCoords.push([field.x, field.y]);

        let removedOnes = boardData.removeSurroundings(
            [[field.x-1, field.y],
            [field.x+1, field.y],
            [field.x, field.y-1],
            [field.x, field.y+1]]
        );
        freedSurroundingFields = freedSurroundingFields.concat(removedOnes);
    }
    boardData.removeBookings(freedBookedCoords);
    let freedSurroundingCoords = extractCoords(freedSurroundingFields);
    return [freedBookedCoords, freedSurroundingCoords];
}

function freeBookingsAndSurroundings(booked, surrounding) {
    boardData.removeBookings(booked);
    boardData.removeSurroundings(surrounding);
    return [booked, surrounding];
}

function addNewTiles(tiles) {
    for(let i = 0; i < tiles.length; i++) {
        boardData.addLetter(tiles[i].letter, tiles[i].x, tiles[i].y);
    }
}

function processReceivedData(data) {
    if (data.length == 0) {
        alert("Start game server on the computer first.\nThen reload page.");
        return;
    }
    let dataParts = data.split(":::");
    let msgId = dataParts[0];
    let msg = dataParts[1];
    if (msg.startsWith("ERROR")) {
        console.log("Error receiving data! Id:" + msgId);
        console.log("Errorous data: " + data)
        return;
    }

    let dataObj;
    try {
        dataObj = JSON.parse(msg);
        console.log("Msg parsed.");
    } catch (error) {
        alert("Bad message format: " + error + "\n message: " + msg);
        readResource(createReqUrl(CLIENT_URL_BASE, LISTEN_TYPE, myName, listenPort, null, null), processReceivedData);
        return;
    }
    console.log("Received message type: " + dataObj.msg);
    if (dataObj.msg == MSG_NEW_PLAYER) {
        if (game.state == GAME_GATHERING) {
            console.log("Adding new player.");
            addNewPlayer(dataObj.name);
            console.log("Added "+dataObj.name);
        } else {
            console.log("Cannot add new player. Game is already started.");
        }
    } else if (dataObj.msg == MSG_START_GAME) {
        if (game.state == GAME_GATHERING) {
            console.log("start the game!");
            startTheGame();
        } else {

            console.log("Game can only started from gathering state.");
        }
    } else if (dataObj.msg == MSG_BOOK_FIELDS) {
        console.log("Booking fields:");
        console.log(dataObj);
        let success = false;
        if (bookingFieldsSuccess(dataObj.booked, dataObj.surrounding)) {
            boardData.addReservedBooked(dataObj.booked, false);
            boardData.addReservedSurrounding(dataObj.surrounding, false);
            let successMsg = new Message(TV_NAME, dataObj.sender, MSG_BOOKING_SUCCESS, null);
            successMsg.send();
            let newReservedFieldsMsg = new Message(TV_NAME, TO_EVERYONE, MSG_NEW_RESERVED_FIELDS,
                '"reservedFields": ' + JSON.stringify([dataObj.booked, dataObj.surrounding]));
            newReservedFieldsMsg.send();
            success = true;
        } else {
            let failedMsg = new Message(TV_NAME, dataObj.sender, MSG_BOOKING_FAILED, null);
            failedMsg.send();
        }
    } else if (dataObj.msg == MSG_PLAYER_SEND_WORD_TILES) {
        setGameStateMessage("Harc");
        console.log("Player sent tiles:");
        console.log(dataObj);
        let freedBookingsAndSurroundings = freeBookingsAndAround(dataObj.tiles);
        addNewTiles(dataObj.tiles);
        newWords = collectWords(dataObj.tiles);
        addNewWordsToList(newWords, dataObj.sender);
        console.log("new worlds:");
        console.log(newWords);
        let updateMsg = new Message(TV_NAME, TO_EVERYONE, MSG_UPDATE_TABLE, 
            '"freedFields":' + JSON.stringify(freedBookingsAndSurroundings) + ', "newTiles":' + JSON.stringify(dataObj.tiles));
        updateMsg.send();

        let player = findPlayer(dataObj.sender);
        let lettersStr = getLetters(dataObj.tiles.length, player);
        let giveNewTilesMsg = new Message(TV_NAME, dataObj.sender, MSG_GIVE_NEW_TILES, '"newTiles": [' + lettersStr + ']');
        giveNewTilesMsg.send();

    } else if (dataObj.msg = MSG_PLAYER_CANCEL_BOOKING) {
        console.log("Player cancels word.");
        console.log(dataObj);
        let freedBookingsAndSurroundings = freeBookingsAndSurroundings( dataObj.booked, dataObj.surrounding );
        let updateMsg = new Message(TV_NAME, TO_EVERYONE, MSG_UPDATE_TABLE, 
            '"freedFields":' + JSON.stringify(freedBookingsAndSurroundings) + ', "newTiles": []');
        updateMsg.send();
    }
    readResource(createReqUrl(CLIENT_URL_BASE, LISTEN_TYPE, myName, listenPort, null, null), processReceivedData);    
}

function getWord(tiles) {
    let word = "";
    for(let i = 0; i < tiles.length; i++) {
        word += tiles[i].letter;
    }
    return word;
}

function getPoint(tiles) {
    let point = 0;
    let wordFactor = 1;
    for(let i = 0; i < tiles.length; i++) {
        let tile = tiles[i];
        let special = boardData.getSpecialField(tile.x, tile.y);
        let tileFactor = 1;
        if (special != null) {
            tileFactor = special.type == DOUBLE_LETTER ? 2 
                : special.type == TRIPLE_LETTER ? 3 : 1;
            wordFactor *= special.type == DOUBLE_WORD ? 2
                : special.type == TRIPLE_WORD ? 3 : 1;
        }
        let letter = findLetter(tile.letter);
        point += (letter[2] * tileFactor);
    }
    return point * wordFactor;
}

function addNewWordsToList(words, player) {
    let sumPoint = 0;
    for(let i = 0; i < words.length; i++) {
        let word = getWord(words[i]);
        let point = getPoint(words[i]);
        sumPoint += point;
        addWordToTable(word, player, point + " p");
    }
    let playerObj = findPlayer(player);
    playerObj.point += sumPoint;
    el('pl1Point'+player).innerHTML = playerObj.point + " p";
}

function findWordsOfTile(tile) {
    let y = tile.y;
    while (y >= 0 && boardData.getTileOnField(tile.x, y) != null) {
        y--;
    }
    y++;
    let verticalWord = [];
    let vTile = boardData.getTileOnField(tile.x, y);
    while (vTile!=null) {
        verticalWord.push(vTile);
        y++;
        vTile = boardData.getTileOnField(tile.x, y);
    }

    let x = tile.x;
    while (x >= 0 && boardData.getTileOnField(x, tile.y) != null) {
        x--;
    }
    x++;
    let horizontalWord = [];
    let hTile = boardData.getTileOnField(x, tile.y);
    while (hTile!=null) {
        horizontalWord.push(hTile);
        x++;
        hTile = boardData.getTileOnField(x, tile.y);
    }
    return [(horizontalWord.length > 1 ? horizontalWord : null), 
        (verticalWord.length > 1 ? verticalWord : null)];
}

function sameWord(word1, word2) {
    if (word1.length!=word2.length) {
        return false;
    }
    return (word1[0].x == word2[0].x && word1[0].y == word2[0].y);
}

function wordInCollection(word, collection) {
    if (word==null) {
        return true;
    }
    for(let i = 0; i< collection.length; i++) {
        if (sameWord(collection[i], word)) {
            return true;
        }
    }
    return false;
}

function collectWords(tiles) {
    let collectedWords = [];
    for(let i = 0; i < tiles.length; i++) {
        let wordsOfTile = findWordsOfTile(tiles[i]);
        if (!wordInCollection(wordsOfTile[0], collectedWords)) {
            collectedWords.push(wordsOfTile[0]);
        }
        if (!wordInCollection(wordsOfTile[1], collectedWords)) {
            collectedWords.push(wordsOfTile[1]);
        }
    }
    return collectedWords;
}

function findPlayer(name) {
    for(let i = 0; i < players.length; i++) {
        if (players[i].name == name) {
            return players[i];
        }
    }
    return null;
}

function setGameStateMessage(state) {
    el("status").innerHTML = "- "+state+" -";
}

function getLetters(num, player) {
    let lettersStr = "";
    let comma = "";
    for(let j = 0; j < num && letters.length > 0; j++) {
        let letterI = Math.floor(Math.random() * letters.length);
        player.letters.push(letters[letterI]);
        lettersStr += comma + '"' + letters[letterI] + '"';
        comma = ",";
        letters.splice(letterI, 1);
    }
    return lettersStr;
}

function startTheGame() {
    for(let i = 0; i < players.length; i++) {
        let lettersStr = getLetters(MAX_LETTER_NUM, players[i]);
        let msgData = '"letters": ['+ lettersStr+']';

        console.log("Sending init letters to " + players[ i ].name);
        let msg = new Message(myName, players[ i ].name, MSG_INIT_LETTERS,  msgData);
        msg.send();
    }

    setGameStateMessage("Első szó");
    game.state = GAME_FIRST_WORD;
}

window.onload = init;