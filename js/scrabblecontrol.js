var viewPort;
var magnified;
var wholeBoard;
var magnifiedTableData;
var wholeTableData;
var magnifiedBox;
var magnification;
var widthPortion, heightPortion;
var letterSize;

var selectedTileNum = 0;
var selectedIcon = "";
var tilesPut = [];

var boardLeft, boardTop, boardWidth;
var viewPortWidth, viewPortHeight;

var letters = [];
var game = new Game();
// booking array, surrounding array
var myBooking = [[], []];
var puttingFirstWord = false; // used at cancel word

var letterPutIndex = -1;

var playerConfigs;

// control buttons
const DOWN_ARROW = "downArrow";
const RIGHT_ARROW = "rightArrow";
const PAUSE = "pause";

// control methods
const CONTROL_ARROWS = 0;
const CONTROL_DIRECT_FIELDS = 1;
const CONTROL_VALUE_LIST = ["Nyilakkal", "Mezőkkel"];

// player configs
const CONFIG_CONTROL = "Szó lehelyezés";

const NUMBER_OF_RECEIVED_TILES = 7.0;

const INACTIVE_BUTTON_COLOR = "#3c3c3c";

function scrabbleInit() {
    console.log("scrabble init.");
    initConfigs();
    setFontSizeWidthtPercentage(el("header"), 4);
    setFontSizeWidthtPercentage(el("nameStr"), 8);
    setFontSizeWidthtPercentage(el("start"), 18);
    setFontSizeWidthtPercentage(el("startGameB"), 18);
    el("startGameB").style.display = "none";
    setFontSizeWidthtPercentage(el("openConfigs"), 18);

    magnified = el("boardMagnified");
    magnifiedBox = el("tablePart");
    wholeBoard = el("boardWhole");
    letterSize = (magnifiedBox.offsetWidth / NUMBER_OF_RECEIVED_TILES);

    magnified.onclick = startWord;

    el(RIGHT_ARROW).onclick = chooseIcon;
    el(DOWN_ARROW).onclick = chooseIcon;
    el("pause").onclick = chooseIcon;
    el("undo").onclick = cancelIcon;

    el("startGameB").onclick = startGame;
    el("startPuttingWord").onclick = startPuttingFieldLetters;

    el("letters").style.flexBasis = letterSize + "px";
    magnifiedTableData = boardInit("boardMagnified", el("tablePart"), "100%");
    //putWord("SPACEX", 3, 5, DOWN, magnified);
    el("lengthStrip").style.height = (el("t1").offsetHeight) + "px";
    el("boardStrip").style.height = (el("allTableDiv").offsetHeight - el("t1").offsetHeight) + "px";
    wholeTableData = boardInit("boardWhole", el("boardStrip"), null);
    //putWord("SPACEX", 3, 5, DOWN, el("boardWhole"));

    showViewport();
    letters = ['*', 'S', 'P', 'A', 'C', 'E', 'X'];
    updateLetters();
    placeRadioOptions();
    
}

function initConfigs() {
    playerConfigs = new Configs(el("configDiv"));
    playerConfigs.addConfig(CONFIG_CONTROL, CONFIGTYPE_LIST, CONTROL_DIRECT_FIELDS, controlChanged, false, CONTROL_VALUE_LIST);
    controlChanged(CONTROL_DIRECT_FIELDS);
    playerConfigs.createConfigDivContent();
    el("openConfigs").onclick = function () { el("configDiv").style.display = "block"; };
}

function setTileNumAndArrowsBg(color) {
    for(let i = 1; i <= NUMBER_OF_RECEIVED_TILES; i++) {
        let tNum = el(tileNumId(i));
        tNum.style.backgroundColor = color;
    }
    el(RIGHT_ARROW).style.backgroundColor = color;
    el(DOWN_ARROW).style.backgroundColor = color;
}

function controlChanged(newControl) {
    if (newControl == CONTROL_ARROWS ) {
        setTileNumAndArrowsBg(null);
        selectedTileNum = 0;
        selectedIcon = "";
    } else {
        setTileNumAndArrowsBg(INACTIVE_BUTTON_COLOR);
        selectedTileNum = 0;
        selectedIcon = "";
    }
}

function getMagnifiedCoord(evt) {
    let x = evt.offsetX;
    let y = evt.offsetY;
    let target = evt.target;
    while (target != magnified) {
        x = x + target.offsetLeft;
        y = y + target.offsetTop;
        target = target.parentNode;
    }
    return [x, y];
}

function bookWordPlaceDirection(x, y) {
    let booked = [];
    let tiles = 0;
    console.log("Booking " + x + ", " + y +", " + selectedIcon);
    if (selectedIcon == DOWN_ARROW) {
        while (tiles < selectedTileNum) {
            booked.push(getCoordPair(x,y));
            tiles++;
            y++;
        }
    } else if (selectedIcon == RIGHT_ARROW) {
        while (tiles < selectedTileNum) {
            booked.push(getCoordPair(x,y));
            tiles++;
            x++;
        }
    }
    return booked;
}

function gatherSurrounding(booked) {
    let surrounding = [];
    for(let i = 0; i < booked.length; i++) {
        let upC = coordUp(booked[i]);
        if (fieldEmpty(magnifiedTableData, upC) && findArr(booked, upC)==-1) {
            surrounding.push(upC);
        }
        let downC = coordDown(booked[i]);
        if (fieldEmpty(magnifiedTableData, downC) && findArr(booked, downC)==-1) {
            surrounding.push(downC);
        }
        let leftC = coordLeft(booked[i]);
        if (fieldEmpty(magnifiedTableData, leftC) && findArr(booked, leftC)==-1) {
            surrounding.push(leftC);
        }
        let rightC = coordRight(booked[i]);
        if (fieldEmpty(magnifiedTableData, rightC) && findArr(booked, rightC)==-1) {
            surrounding.push(rightC);
        }
    }
    return surrounding;
}

function addReservedFields(booked, surrounding, my) {
    magnifiedTableData.addReservedBooked(booked, my );
    magnifiedTableData.addReservedSurrounding(surrounding, my );
    wholeTableData.addReservedBooked(booked, my );
    wholeTableData.addReservedSurrounding(surrounding, my );
}

const ONE_LETTER_ONLY = -1;
const HORIZONTAL_WORD = 1;
const VERTICAL_WORD = 2;
var fieldsBooked = [];
var fieldWordDirection = ONE_LETTER_ONLY;
var fieldWordContinous = true;

function startPuttingFieldLetters() {
    if (fieldsBooked.length < 2 && game.state == GAME_FIRST_WORD) {
        alert("Túl rövid szó!");
        return;
    }
    if (fieldsBooked.length == 0) {
        alert("Jelöld be a mezőket, ahova a betűket rakod!");
        return;
    }
    if (fieldWordDirection == ONE_LETTER_ONLY) {
        if (magnifiedTableData.getTileOnFieldCoord(coordDown(fieldsBooked[0])) == null &&
            magnifiedTableData.getTileOnFieldCoord(coordUp(fieldsBooked[0])) == null && 
            magnifiedTableData.getTileOnFieldCoord(coordLeft(fieldsBooked[0])) == null &&
            magnifiedTableData.getTileOnFieldCoord(coordRight(fieldsBooked[0])) == null) {
                alert("A lerakott betűnek csatlakoznia kell már letett betűkhöz.");
                return;
        }
    } else {
        let centerFound = false;
        let foundLetterInside = false;
        if (fieldWordDirection == HORIZONTAL_WORD) {
            fieldsBooked = fieldsBooked.sort(function(t1, t2){return t1[0] - t2[0]});
            console.log(fieldsBooked);
            for(let x = fieldsBooked[0][0], i = 0; i < fieldsBooked.length;) {
                x++;
                if (i == fieldsBooked.length - 1 || fieldsBooked[i+1][0] == x) {
                    if (fieldsBooked[i][0] == 7 && fieldsBooked[i][1] == 7) {
                        centerFound = true;
                    }
                    i++;
                } else {
                    if (magnifiedTableData.getTileOnField(x, fieldsBooked[0][1]) == null) {
                        alert("Egybefüggő szónak kell kijönnie!");
                        return;
                    } else {
                        foundLetterInside = true;
                    }
                }
            }
            if (!foundLetterInside &&
                magnifiedTableData.getTileOnFieldCoord(coordLeft(fieldsBooked[0])) == null &&
                magnifiedTableData.getTileOnFieldCoord(coordRight(fieldsBooked[fieldsBooked.length-1])) == null &&
                game.state != GAME_FIRST_WORD) {
                    alert("Csatlakoznod kell legalább egy lerakott betűhöz!");
                    return;
            }
        } else {
            fieldsBooked = fieldsBooked.sort(function(t1, t2){return t1[1] - t2[1]});
            console.log(fieldsBooked);
            for(let y = fieldsBooked[0][1], i = 0; i < fieldsBooked.length;) {
                y++;
                if (i == fieldsBooked.length - 1 || fieldsBooked[i+1][1] == y) {
                    if (fieldsBooked[i][0] == 7 && fieldsBooked[i][1] == 7) {
                        centerFound = true;
                    }
                    i++;
                } else {
                    if (magnifiedTableData.getTileOnField(fieldsBooked[0][0], y) == null) {
                        alert("Egybefüggő szónak kell kijönnie!");
                        return;
                    } else {
                        foundLetterInside = true;
                    }
                }
            }
            if (!foundLetterInside &&
                magnifiedTableData.getTileOnFieldCoord(coordUp(fieldsBooked[0])) == null &&
                magnifiedTableData.getTileOnFieldCoord(coordDown(fieldsBooked[fieldsBooked.length-1])) == null &&
                game.state != GAME_FIRST_WORD) {
                    alert("Csatlakoznod kell legalább egy lerakott betűhöz!");
                    return;
            }
        }
        if (game.state == GAME_FIRST_WORD) {
            if (!centerFound) {
                alert("A középső mezőnek az első szóban kell lennie!");
                return;
            }
        }
    }
    el("startPuttingWord").style.display = "none";
    let surrounding = gatherSurrounding(fieldsBooked);
    playerBookFields(fieldsBooked, surrounding);
}

function playerBookFields(booked, surrounding) {
    game.state = GAME_TRY_BOOKING;
                
    let msgData = '"booked" : ' + JSON.stringify(booked) + ', "surrounding" : '+ JSON.stringify(surrounding);
    let bookMessage = new Message(myName, TV_NAME, MSG_BOOK_FIELDS, msgData);
    myBooking = [booked, surrounding];
    fieldsBooked = [];
    fieldWordDirection = ONE_LETTER_ONLY;
    bookMessage.send();
}

function checkBookingAndBook(x, y) {
    let booked;
    if ((magnifiedTableData.getTileOnField(x, y) != null)) {
        alert("Nem üres mező!");
        return null;
    }
    if (playerConfigs.readConfig(CONFIG_CONTROL) == CONTROL_ARROWS) {
        if (selectedTileNum < 2 && game.state == GAME_FIRST_WORD ) {
            alert("Minimum 2 betűből álló szóval kezdhetsz csak!");
            return null;
        }
        if (selectedTileNum < 1 ) {
            alert("Válassz lerakott betű számot!");
            return;
        }
        if (selectedIcon != DOWN_ARROW && selectedIcon != RIGHT_ARROW ) {
            alert("Válassz egy irányt!");
            return null;
        }
        if (game.state == GAME_FIRST_WORD) {
            if (selectedIcon == DOWN_ARROW) {
                if (x != 7 || y <= 7 - selectedTileNum || y > 7) {
                    alert("Középmezőnek a szóban kell lennie!");
                    return null;
                }
            }
            if (selectedIcon == RIGHT_ARROW) {
                if (y != 7 || x <= 7 - selectedTileNum || x > 7) {
                    alert("Középmezőnek a szóban kell lennie!");
                    return null;
                }
            }
        }

        if (game.state == GAME_FIRST_WORD) {
            booked = bookWordPlaceDirection(x, y);
        }
        if (game.state == GAME_PLAYER_BOOKS_NEW) {
            let dx = (selectedIcon == RIGHT_ARROW ? 1 : 0);
            let dy = (selectedIcon == DOWN_ARROW ? 1 : 0);
            let tileI = 0;
            let foundLetter = (magnifiedTableData.getTileOnField(x-dx, y-dy) != null);
            let booked = [];
            let checkX = x;
            let checkY = y;
            while (checkX < TABLE_FIELD_WIDTH && checkY < TABLE_FIELD_WIDTH && tileI < selectedTileNum) {
                let tileAtPos = magnifiedTableData.getTileOnField(checkX, checkY);
                if (tileAtPos == null) {
                    booked.push(getCoordPair(checkX,checkY));
                    tileI++;
                } else {
                    foundLetter = true;
                }
                checkX = checkX + dx;
                checkY = checkY + dy;
            }
            foundLetter |= (magnifiedTableData.getTileOnField(checkX, checkY) != null);
            if (!foundLetter) {
                alert("Nem csatlakozik már letett szóhoz!");
                return null;
            }
            if (tileI != selectedTileNum) {
                alert("Nincs elég hely.");
                return null;
            }
        }

        
        let surrounding = gatherSurrounding(booked);
        addReservedFields(booked, surrounding, true);
        playerBookFields(booked, surrounding);
        if (game.state == GAME_FIRST_WORD) {
            puttingFirstWord = true;
        }
    } else {
        console.log("Book by fields: " + x + ", " + y);
        if ((magnifiedTableData.getTileOnField(x, y) != null)) {
            alert("Üres mezőt lehet csak jelölni!");
            return null;
        }
        if (fieldsBooked.length == 0) {
            fieldsBooked.push(getCoordPair(x,y));
            fieldWordContinous = true;
            el("startPuttingWord").style.display = "block";

            setFontSizeHeightPercentage(el("startPuttingWord"), 80);
        } else {
            let actCoords = getCoordPair(x,y);
            let fieldInd = findArr(fieldsBooked, actCoords);
            if (fieldInd != -1) {
                fieldsBooked.splice(fieldInd, 1);
                if (fieldsBooked.length <= 1) {
                    fieldWordDirection = ONE_LETTER_ONLY;
                }
            } else {
                if (fieldsBooked.length == 1) {
                    if (x == fieldsBooked[0][0] || y == fieldsBooked[0][1]) {
                        if (x == fieldsBooked[0][0]) {
                            fieldWordDirection = VERTICAL_WORD;
                        } else {
                            fieldWordDirection = HORIZONTAL_WORD;
                        }
                    } else {
                        alert("Egy sorban vagy oszlopban lehet csak szót jelölni!");
                        return null;
                    }
                }
                if (fieldWordDirection == HORIZONTAL_WORD 
                    && y != fieldsBooked[0][1]) {
                        alert("Egy sorban kell lenniük a betűknek!");
                        return null;
                }
                if (fieldWordDirection == VERTICAL_WORD
                    && x != fieldsBooked[0][0]) {
                        alert("Egy oszlopban kell lenniük a betűknek!");
                        return null;
                }
                fieldsBooked.push(getCoordPair(x,y));
            }
        }
        magnifiedTableData.removeMyBookings();
        magnifiedTableData.removeMySurroundings();
        let mySurroundings = gatherSurrounding(fieldsBooked);
        addReservedFields(fieldsBooked, mySurroundings, true);
        return fieldsBooked;
    }
}

function startWord(evt) {
    if (game.state == GAME_FIRST_WORD || game.state == GAME_PLAYER_BOOKS_NEW) {
        let coord = getMagnifiedCoord(evt);
        // console.log("" + magnifiedTableData.getCoord(coord[0]) + " - " + magnifiedTableData.getCoord(coord[1]));
        let x = magnifiedTableData.getCoord(coord[0]);
        let y = magnifiedTableData.getCoord(coord[1]);

        let checkResult = checkBookingAndBook(x, y);
        if (checkResult == null) {
            return;
        }
    }
}

function ackSent(ackMsg) {
    console.log("Acked sent data." + ackMsg);
}

function removeTilesFromLettersDiv() {
    let ld = el("lettersDiv");
    let toRemove = [];
    for (var i = 0; i < ld.childNodes.length; i++) {
        if (ld.childNodes[i].className == "tile") {
            toRemove.push(ld.childNodes[i]);
        }        
    }

    for(let j = 0; j < toRemove.length; j++) {
        ld.removeChild(toRemove[j]);
    }
}

function updateLetters() {
    removeTilesFromLettersDiv();
    for(let i = 0; i < letters.length; i++) {
        putLetterToAnywhere(letters[ i ], letterPos(i), 0, el("lettersDiv"), letterSize, letterSize, "l"+i );
    }
}

function placeRadioOptions() {
    for(let i = 1; i <= NUMBER_OF_RECEIVED_TILES; i++) {
        let tNum = el(tileNumId(i));
        tNum.style.left = letterPos(i-1) + "px";
        tNum.style.width = letterSize + "px";
        tNum.innerHTML = "" + i;
        tNum.onclick = selectTileNum;
    }
}

function tileNumId(num) {
    return "t" + num;
}

function selectTileNum(evt) {
    if (game.state == GAME_PLAYER_PUTTING_WORD || game.state == GAME_TRY_BOOKING) {
        return;
    }

    if (selectedTileNum != 0) {
        el(tileNumId(selectedTileNum)).style.backgroundColor = null;
    }
    evt.target.style.backgroundColor = "rgb(0, 228, 38)";;
    selectedTileNum = evt.target.id[1];
}

function letterPos(x) {
    return x * letterSize;
}

function showViewport() {
    console.log("Viewport init started.");
    viewPort = document.createElement("div");
    viewPort.id = "viewPort";
    el("boardWhole").appendChild(viewPort);
    let boardRect = el("boardWhole").getBoundingClientRect();
    boardLeft = boardRect.left;
    boardTop = boardRect.top;
    boardWidth = boardRect.right - boardLeft;
    widthPortion = magnifiedBox.offsetWidth / pxVal(magnified.style.width);
    viewPort.style.width = widthPortion * 100.0 + "%";
    heightPortion = magnifiedBox.offsetHeight / pxVal(magnified.style.height);
    viewPort.style.height = heightPortion * 100.0 + "%";
    console.log("Viewport init completed.");
    /*viewPort.onmousedown = viewPortGrabbed;
    viewPort.onmousemove = viewPortMove;
    viewPort.onmouseup = viewPortReleased;
    viewPort.onmouseout = viewPortReleased;*/
    el("boardWhole").onmousedown = jumpViewPort;

    viewPort.addEventListener( "pointerdown", jumpViewPortM, {passive: false});
   // viewPort.addEventListener( "pointermove", viewPortMoveM, {passive: false});
    //viewPort.addEventListener( "pointerup", viewPortReleasedM, {passive: false});;    

    magnification = pxVal(magnified.style.width) / pxVal(el("boardWhole").style.width);

    let vpRect = viewPort.getBoundingClientRect();
    viewPortWidth = vpRect.right - vpRect.left;
    viewPortHeight = vpRect.bottom - vpRect.top;
}

var xDown, yDown;
var vpX, vpY;
var down = false;

function jumpViewPort(evt) {
    xDown = evt.clientX;
    yDown = evt.clientY;
    let relX = xDown - boardLeft;
    let relY = yDown - boardTop;

    let left = relX - viewPortWidth / 2;
    let top = relY - viewPortHeight / 2;

    if (left < 0) {
        left = 0;
    } else if (left > boardWidth - viewPortWidth) {
        left = boardWidth - viewPortWidth;
    }
    if (top < 0) {
        top = 0;
    } else if (top > boardWidth - viewPortHeight) {
        top = boardWidth - viewPortHeight;
    }
    viewPort.style.left = left + "px";
    magnified.style.left = (-left * magnification) + "px";
    viewPort.style.top = top + "px";
    magnified.style.top = (-top * magnification) + "px";

    //console.log("xDown: "+ xDown+", yDown: " + yDown + ", boardX: " +boardLeft);

}

function viewPortGrabbed(evt) {
    if (!down) {

        //console.log("down: ");
        down = true;
        xDown = evt.clientX;
        yDown = evt.clientY;
        vpX = viewPort.offsetLeft;
        vpY = viewPort.offsetTop;
        //console.log("xDown: "+ xDown+",yDown: " + yDown + ",vpX: " + vpX + ",vpY: " + vpY);
    }
}

function jumpViewPortM(evt) {
    xDown = evt.clientX;
    yDown = evt.clientY;
    let relX = xDown - boardLeft;
    let relY = yDown - boardTop;

    let left = relX - viewPortWidth / 2;
    let top = relY - viewPortHeight / 2;

    if (left < 0) {
        left = 0;
    } else if (left > boardWidth - viewPortWidth) {
        left = boardWidth - viewPortWidth;
    }
    if (top < 0) {
        top = 0;
    } else if (top > boardWidth - viewPortHeight) {
        top = boardWidth - viewPortHeight;
    }
    viewPort.style.left = left + "px";
    magnified.style.left = (-left * magnification) + "px";
    viewPort.style.top = top + "px";
    magnified.style.top = (-top * magnification) + "px";

}


function viewPortMove(evt) {
    if (down) {
        //console.log("evt.clientX "+ evt.clientX + " , evt.clientY" + evt.clientY);
        let left = (vpX + evt.clientX - xDown)
        if (left>=0 && left < pxVal(el("boardWhole").style.width) - viewPort.clientWidth) {
            viewPort.style.left = left + "px";
            magnified.style.left = (-left * magnification) + "px";
        }

        let top = (vpY + evt.clientY - yDown);
        if (top >= 0 && top < pxVal(el("boardWhole").style.height) - viewPort.clientHeight) {
            viewPort.style.top = top + "px";
            magnified.style.top = (-top * magnification) + "px";
        }

    }
}

function viewPortMoveM(evt) {
    if (down) {
        evt.preventDefault();
        //console.log("evt.clientX "+ evt.clientX + " , evt.clientY" + evt.clientY);
        let left = (vpX + evt.clientX - xDown)
        if (left>=0 && left < pxVal(el("boardWhole").style.width) - viewPort.clientWidth) {
            viewPort.style.left = left + "px";
            magnified.style.left = (-left * magnification) + "px";
        }

        let top = (vpY + evt.clientY - yDown);
        if (top >= 0 && top < pxVal(el("boardWhole").style.height) - viewPort.clientHeight) {
            viewPort.style.top = top + "px";
            magnified.style.top = (-top * magnification) + "px";
        }

    }
}

function viewPortReleased(evt) {
    //console.log("mouse up");
    down = false;
}

function viewPortReleasedM(evt) {
    //console.log("mouse up");
    evt.preventDefault();
    down = false;
    viewPort.style.backgroundColor = "rgba(255, 255, 255, 0.4)";
}

function chooseIcon(evt) {
    if (game.state == GAME_PLAYER_PUTTING_WORD || game.state == GAME_TRY_BOOKING) {
        return;
    }

    if (selectedIcon!="") {
        el(selectedIcon).style.backgroundColor = null;
    }
    selectedIcon = evt.target.id;
    el(selectedIcon).style.backgroundColor = "rgb(0, 228, 38)";
}

function cancelIcon(evt) {
    if (game.state != GAME_PLAYER_PUTTING_WORD) {
        return;
    }

    let cancelBookingMessage = new Message( myName, TV_NAME, MSG_PLAYER_CANCEL_BOOKING, 
        '"booked":' + JSON.stringify(myBooking[0]) + ', "surrounding":' + JSON.stringify(myBooking[1]));
    cancelBookingMessage.send();
    cleanMyBookingsAndSurroundings();
    removeTilesPut();

    game.state = (puttingFirstWord ? GAME_FIRST_WORD : GAME_PLAYER_BOOKS_NEW);
    puttingFirstWord = false;
}

function startGame() {
    let msg = '{"sender":"'+myName+'","to": "'+ TV_NAME +'", "msg":"startGame"}';
    processSend(msg, "CLIENT");
}

function cleanMyBookingsAndSurroundings() {
    magnifiedTableData.removeMyBookings();
    magnifiedTableData.removeMySurroundings();
    myBooking = [[], []];
}

function addNewReservedFieldsToBoardData(newFieldArrays, boardData) {
    boardData.addReservedBooked(newFieldArrays[0], false);
    boardData.addReservedSurrounding(newFieldArrays[1], false);
}

function addNewReservedFields(newFieldArrays) {
    addNewReservedFieldsToBoardData(newFieldArrays, magnifiedTableData);
    addNewReservedFieldsToBoardData(newFieldArrays, wholeTableData);
}

function markNextLetterField() {
    let bookCoord = myBooking[0][letterPutIndex];
    let bookingMark = el(magnifiedTableData.getBookedId(bookCoord[0], bookCoord[1], true));
    bookingMark.style.borderColor = "white";
}

function startPuttingLetters() {
    resetAndCleanLetterSwap();

    letterPutIndex = 0;
    markNextLetterField();
}

function removeLetter(letter) {
    for(let i = 0; i < letters.length; i++) {
        if (letters[i]==letter) {
            letters.splice(i, 1);
            return;
        }
    }
}

function removeTilesPut() {
    for(let i = 0; i < tilesPut.length; i++) {
        let tile = tilesPut[i];
        magnifiedTableData.removeTileOnField(tile.x, tile.y);
        wholeTableData.removeTileOnField(tile.x, tile.y);;
        letters.push(tile.letter);
    }
    updateLetters();
}

function playerPutLetter(letterDiv) {
    let bookCoord = myBooking[0][letterPutIndex];
    let bookingMark = el(magnifiedTableData.getBookedId(bookCoord[0], bookCoord[1], true));
    bookingMark.remove();

    let letterRowIndex = letterDiv.id[1];
    magnifiedTableData.addLetter(letterDiv.letter, bookCoord[0], bookCoord[1]);
    wholeTableData.addLetter(letterDiv.letter, bookCoord[0], bookCoord[1]);
    tilesPut.push( {"x": bookCoord[0], "y" :  bookCoord[1], "letter" : letterDiv.letter});
    letterDiv.remove();
    removeLetter(letterDiv.letter);
    letterPutIndex++;
    if (letterPutIndex >= myBooking[0].length) {
        let sendWordTilesMsg = new Message( myName, TV_NAME, MSG_PLAYER_SEND_WORD_TILES, 
            '"tiles":' + JSON.stringify(tilesPut));
        sendWordTilesMsg.send();
        puttingFirstWord = false;
    } else {
        markNextLetterField();
    }
    
}

function updateTable(dataObj) {
    magnifiedTableData.removeBookings(dataObj.freedFields[0]);
    magnifiedTableData.removeSurroundings(dataObj.freedFields[1]);
    wholeTableData.removeBookings(dataObj.freedFields[0]);
    wholeTableData.removeSurroundings(dataObj.freedFields[1]);

    for(let i = 0; i < dataObj.newTiles.length; i++) {
        let tile = dataObj.newTiles[i];
        magnifiedTableData.addLetter(tile.letter, tile.x, tile.y);
        wholeTableData.addLetter(tile.letter, tile.x, tile.y);
    }
}

function processReceivedData(data) {
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
    } catch (error) {
        alert("Bad message format: " + error + "\n message: " + msg);
        readResource(createReqUrl(CLIENT_URL_BASE, LISTEN_TYPE, myName, listenPort, null, null), processReceivedData);
        return;
    }
    console.log("process received message start for " + dataObj.msg);
    if (dataObj.msg == MSG_INIT_LETTERS) {
        el("startGameB").style.display = "none";
        letters = dataObj.letters;
        updateLetters();
        console.log("Game starting.\nLetters received: " + dataObj.letters);
        magnifiedTableData.cleanTiles();
        wholeTableData.cleanTiles();
        game.state = GAME_FIRST_WORD;
        console.log("Game state: GAME_FIRST_WORD");
    } else if (dataObj.msg == MSG_BOOKING_SUCCESS) {
        game.state = GAME_PLAYER_PUTTING_WORD;
        tilesPut = [];
        console.log("Game state: GAME_PLAYER_PUTTING_WORD");
        startPuttingLetters();
    } else if (dataObj.msg == MSG_BOOKING_FAILED) {
        cleanMyBookingsAndSurroundings();
        game.state = GAME_PLAYER_BOOKS_NEW;
        console.log("Game state: GAME_PLAYER_BOOKS_NEW");
        alert("Bocs, valaki megelőzött. Foglalt mezők.");
    } else if (dataObj.msg == MSG_NEW_RESERVED_FIELDS) {
        addNewReservedFields(dataObj.reservedFields);
    } else if (dataObj.msg == MSG_UPDATE_TABLE) {
        if (game.state == GAME_FIRST_WORD && dataObj.newTiles.length > 0) {
            console.log("Game state: GAME_PLAYER_BOOKS_NEW");
            game.state = GAME_PLAYER_BOOKS_NEW;
        }
        updateTable(dataObj);
    } else if (dataObj.msg == MSG_GIVE_NEW_TILES) {
        console.log("Received new tiles: ");
        console.log(dataObj.newTiles);
        letters = letters.concat(dataObj.newTiles);
        updateLetters();
        game.state = GAME_PLAYER_BOOKS_NEW;
        console.log("Game state: GAME_PLAYER_BOOKS_NEW");
    }
    console.log("process received message completed for " + dataObj.msg);
    readResource(createReqUrl(CLIENT_URL_BASE, LISTEN_TYPE, myName, listenPort, null, null), processReceivedData);
}
