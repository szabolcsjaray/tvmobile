var width;
var height;
var tileWidth;
var tileHeight;

const TABLE_FIELD_WIDTH = 15.0;

const RIGHT = 1;
const DOWN = 2;

var board;

const BOOK_TYPE_WORD = 1;
const BOOK_TYPE_SURROUNDING = 2;


function el(id) {
    return document.getElementById(id);
}

function boardInit(boardName, boardDiv, boardWidth = null) {
    console.log("board init started.");
    board = el(boardName);

    let scrWidth =  boardDiv.getBoundingClientRect().width;//window.screen.availWidth;
    let scrHeight = boardDiv.getBoundingClientRect().height; //window.screen.availHeight;

    let wholeWidth;

    if (boardWidth == null) {

        wholeWidth = (scrHeight *0.86);
        board.style.height = wholeWidth + "px";
        board.style.top = (scrHeight *0.07) + "px";
        board.style.width = board.style.height;
        
    } else {
        let tileCalcWidth = scrWidth / 7.0;
        wholeWidth = tileCalcWidth * TABLE_FIELD_WIDTH;
        board.style.width = wholeWidth + "px";
        board.style.height = wholeWidth + "px";
    }

    width = wholeWidth - (3* (wholeWidth/800.0));
    height = wholeWidth -(3* (wholeWidth/800.0));
    tileWidth = (width / TABLE_FIELD_WIDTH);
    tileHeight = (height / TABLE_FIELD_WIDTH);

    let boardData = new BoardData(board, width, tileWidth);
    drawSpecialFields(boardData);
    drawLines();

    return boardData;

    /*putWord("ALMA", 3, 6, DOWN);
    putWord("LAMINÁRIS", 3, 7, RIGHT);
    putWord("AKÁRMILYEN", 8, 5, DOWN);
    putLetter("LY", 2, 2);
    putLetter("CS", 14, 1);*/

}

function sc(val) {
    return val * width / 800.0;
}

function posX(x) {
    return (width / TABLE_FIELD_WIDTH * x + sc(1.5));
}

function posY(y) {
    return (height / TABLE_FIELD_WIDTH * y + sc(1.5));
}

const tripleWorldFields = [
    [0,0],
    [7,0],
    [14,0],
    [0,7],
    [14,7],
    [0,14],
    [7,14],
    [14,14]
 ];

 const doubleLetterFields = [
    [3,0],
    [11,0],
    [6,2],
    [8,2],
    [0,3],
    [7,3],
    [14,3],
    [2,6],
    [6,6],
    [8,6],
    [12,6],
    [3,7],
    [11,7],
    [2,8],
    [6,8],
    [8,8],
    [12,8],
    [0,11],
    [7,11],
    [14,11],    
    [6,12],
    [8,12],
    [3,14],
    [11,14]
 ];

 const doubleWordFields = [
    [1,1],
    [13,1],
    [2,2],
    [12,2],
    [3,3],
    [11,3],
    [4,4],
    [10,4],
    [7,7],
    [1,13],
    [13,13],
    [2,12],
    [12,12],
    [3,11],
    [11,11],
    [4,10],
    [10,10]
 ];

 const tripleLetterFields = [
    [5,1],
    [9,1],
    [1,5],
    [5,5],
    [9,5],
    [13,5],
    [5,13],
    [9,13],
    [1,9],
    [5,9],
    [9,9],
    [13,9]
 ];

 const TRIPLE_WORD = 0;
 const TRIPLE_LETTER = 2;
 const DOUBLE_WORD = 1;
 const DOUBLE_LETTER = 3;
 const specialTile = [
    {col : "#d90f0f", text: "Három-<br>szoros<br>szó<br>érték"},
    {col : "pink", text: "Két-<br>szeres<br>szó<br>érték"},
    {col : "#3535ff", text: "Három-<br>szoros<br>betű<br>érték"},
    {col : "lightblue", text: "Két-<br>szeres<br>betű<br>érték"}
 ];

 function addNewSpecialField(boardData, coord, type) {
    let div = document.createElement("div");
    div.className = "specialTile";
    div.style.width = tileWidth + "px";
    div.style.height = tileHeight + "px";
    div.style.top = posY(coord[1]) + "px";
    div.style.left = posX(coord[0]) + "px";
    div.style.backgroundColor = specialTile[type].col;
    div.innerHTML = specialTile[type].text;
    div.style.fontSize = sc(8.5) + "px";
    div.style.paddingTop = sc(5.0) + "px";
    board.appendChild(div);
    boardData.addSpecialField(coord, type);
 }

function drawSpecialFieldTpye(boardData, fieldsList, fieldType) {
    for(let i = 0; i < fieldsList.length; i++) {
        addNewSpecialField(boardData, fieldsList[ i ], fieldType);
    }

}

function drawSpecialFields(boardData) {
    drawSpecialFieldTpye(boardData, tripleWorldFields, TRIPLE_WORD);
    drawSpecialFieldTpye(boardData, doubleWordFields, DOUBLE_WORD);
    drawSpecialFieldTpye(boardData, tripleLetterFields, TRIPLE_LETTER);
    drawSpecialFieldTpye(boardData, doubleLetterFields, DOUBLE_LETTER);
}

function coordKey(x,y) {
    return ""+x+"-"+y;
}

function putLetter(letter, x, y, boardData= null) {
    /*let lButton = document.createElement("button");
    lButton.className = "tile";
    lButton.style.left = posX(x) + "px"; 
    lButton.style.top = posY(y) + "px";
    lButton.style.width = tileWidth + "px";
    lButton.style.height = tileHeight + "px";
    lButton.innerHTML = letter;
    board.appendChild(lButton);*/

    if (boardData != null) {
        boardData.addLetter(letter, x, y);
        console.log("Added letter to board: " + letter);
    } else {
        putLetterToAnywhere(letter, posX(x), posY(y), board, tileWidth, tileWidth, null);
    }
}

function putLetterToAnywhere(letter, x, y, element, tWidth, tHeight, id = null) {
    let lButton = document.createElement("button");
    if (id != null) {
        lButton.id = id;
    }
    lButton.className = "tile";
    lButton.style.left = x + "px";
    lButton.style.top = y + "px";
    lButton.style.width = tWidth + "px";
    lButton.style.height = tHeight + "px";
    lButton.style.borderWidth = (tWidth/10) + "px";
    //lButton.style.borderBottomWidth = (tHeight/10) + "px";
    lButton.style.fontSize = (tWidth / 50 *25) + "px";
    lButton.innerHTML = letter;
    lButton.letter = letter;

    
    let valueSize = (tWidth / 50.0) * 11.0;
    if (valueSize > 1) {
        let valueDiv = document.createElement("div");
        valueDiv.className = "letterValue";
        valueDiv.style.fontSize = valueSize + "px";
        valueDiv.style.top = ((tWidth / 50.0) * 29.0) + "px";
        valueDiv.style.left = ((tWidth / 50.0) * 35.0) + "px";
        valueDiv.innerHTML = findLetter(letter)[2];
        lButton.appendChild(valueDiv);
    }


    lButton.onclick = buttonClick;
    element.appendChild(lButton);
    return lButton;
}

const SWAP_INACTIVE = 0;
const SWAP_ONE_SELECTED = 1;

var buttonSwapState = SWAP_INACTIVE;
var idSelected;

function getTileNodeId(node) {
    if (node.className == "letterValue") {
        return node.parentNode.id;
    }
    return node.id;
}

function buttonClick(evt) {
    if (evt.target.id==null || evt.target.id=="") {
        return;
    }

    if (game.state == GAME_PLAYER_PUTTING_WORD) {
        playerPutLetter(evt.target);
        return;
    }

    if (buttonSwapState == SWAP_INACTIVE) {
        idSelected = getTileNodeId(evt.target);
        if (idSelected == null || idSelected == undefined || el(idSelected) == null) {
            idSelected = null;
            return;
        }
        el(idSelected).style.backgroundColor = "#0b4608";
        buttonSwapState = SWAP_ONE_SELECTED;
    } else if (buttonSwapState == SWAP_ONE_SELECTED) {
        let otherId = getTileNodeId(evt.target);
        if (otherId == null || otherId == undefined || el(otherId) == null
                || otherId == idSelected) {
            el(idSelected).style.backgroundColor = null;
            buttonSwapState = SWAP_INACTIVE;
        } else {
            let otherIndex = otherId[1];
            let swapLetter = letters[otherIndex];
            letters[otherIndex] = letters[idSelected[1]];
            letters[idSelected[1]] = swapLetter;
            buttonSwapState = SWAP_INACTIVE;
            updateLetters();
        }
    }
}

function resetAndCleanLetterSwap() {
    if (buttonSwapState == SWAP_ONE_SELECTED) {
        el(idSelected).style.backgroundColor = null;
        idSelected = null;
        buttonSwapState = SWAP_INACTIVE;
        updateLetters();
    }
}

function putWord(word, startX, startY, direction, toBoard) {

    let x = startX;
    let y = startY;

    for(let i = 0; i < word.length; i++) {
        putLetter(word[i], x, y, toBoard);
        x = x + (direction == RIGHT ? 1 : 0);
        y = y + (direction == DOWN ? 1 : 0);
    }
}

function drawLines() {
    let startX = board.offsetLeft;
    let startY = board.offsetTop;

    for(let x = 0; x <= 15; x++) {
        let vlines = document.createElement("div");
        vlines.className = "vlineshadow";
        vlines.style.top = "0px";
        vlines.style.left = x * (width / TABLE_FIELD_WIDTH) + "px";
        vlines.style.width = sc(10) + "px";
        board.appendChild(vlines);
    }
    for(let y = 0; y <= 15; y++) {
        let hlines = document.createElement("div");
        hlines.className = "hlineshadow";
        hlines.style.left = "0px";
        hlines.style.height = sc(10) + "px";
        hlines.style.top = y * (height / TABLE_FIELD_WIDTH) + "px";
        board.appendChild(hlines);
    }

    for(let x = 0; x <= 15; x++) {
        let vline = document.createElement("div");
        vline.className = "vline";
        vline.style.top = "0px";
        vline.style.left = x * (width / TABLE_FIELD_WIDTH) + "px";
        vline.style.width = sc(3) + "px";
        board.appendChild(vline);
    }
    for(let y = 0; y <= 15; y++) {
        let hline = document.createElement("div");
        hline.className = "hline";
        hline.style.left = "0px";
        hline.style.height = sc(3) + "px";
        hline.style.top = y * (height / TABLE_FIELD_WIDTH) + "px";
        board.appendChild(hline);
    }
}

function fieldEmpty(boardData, fieldCoord) {
    let tileOnBoard = boardData.getTileOnField(fieldCoord[0], fieldCoord[1]);

    return tileOnBoard == null;
}

