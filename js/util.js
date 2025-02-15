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

function setFontSizeHeightPercentage(div, percentage) {
    div.style.fontSize = (div.clientHeight * percentage / 100.0) + "px";
}

function setFontSizeWidthtPercentage(div, percentage) {
    div.style.fontSize = (div.clientWidth * percentage / 100.0) + "px";
}