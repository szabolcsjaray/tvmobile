const MY_PREFIX = "m";
const BOOK_FIELD_PREFX = "b";

class BoardData {
    constructor(board, width, tileWidth) {
        this.width = width;
        this.tileWidth = tileWidth;
        this.board = board;
        this.reservedBooked = [];
        this.reservedSurrounding = [];
        this.lettersOnBoard = [];
        this.boardId = board.id;
        this.specialFields = [];
    }

    getCoord(leftOrTop) {
        return Math.floor(leftOrTop / this.tileWidth);
    }

    sc(val) {
        return val * this.width / 800.0;
    }

    posX(x) {
        return (this.width / 15.0 * x + this.sc(1.5));
    }

    posY(y) {
        return (this.width / 15.0 * y + this.sc(1.5));
    }

    getBookedId(x, y, my) {
        return (my ? MY_PREFIX : "") + BOOK_FIELD_PREFX + x + "-" + y + this.boardId;
    }

    createBookDiv(x, y, markTypeClass, my) {
        let fieldDiv = document.createElement("div");
        fieldDiv.id = this.getBookedId(x, y, my);
        let ownerType = (my ? "" : "Other");
        fieldDiv.className = "markField " + (markTypeClass == BOOK_TYPE_WORD ? "bookType" : "surroundType") + ownerType;
        fieldDiv.style.width = this.tileWidth + "px";
        fieldDiv.style.height = this.tileWidth + "px";
        fieldDiv.style.borderWidth = this.sc(3.5) + "px";
        fieldDiv.style.left = this.posX(x) + "px";
        fieldDiv.style.top = this.posY(y) + "px";
        this.board.appendChild(fieldDiv);
        return fieldDiv;
    }

    getBookedField(x, y) {
        for(let i = 0; i < this.reservedBooked.length; i++) {
            if (this.reservedBooked[i].x == x && this.reservedBooked[i].y == y) {
                return this.reservedBooked[i];
            }
        }
        return null;
    }

    isBookedField(x, y) {
        return (this.getBookedField(x, y) != null);
    }

    addReservedBooked(fieldArray, my) {
        for(let i = 0; i < fieldArray.length; i++) {
            let bookField = this.getBookedField(fieldArray[i][0], fieldArray[i][1]);
            if (bookField == null) {
                let bookDiv = this.createBookDiv(fieldArray[i][0], fieldArray[i][1], BOOK_TYPE_WORD, my);
                this.reservedBooked.push({"x" : fieldArray[i][0], "y" : fieldArray[i][1], "div" : bookDiv, "my" : my});
            } else {
                if (bookField.my && !my) {
                    bookField.my = false;
                    bookField.div.className = "markField bookTypeOther";
                }
            }
        }
    }

    getSurroundingField(x, y) {
        for(let i = 0; i < this.reservedSurrounding.length; i++) {
            if (this.reservedSurrounding[i].x == x && this.reservedSurrounding[i].y == y) {
                return this.reservedSurrounding[i];
            }
        }
        return null;
    }

    isSurroundingField(x, y) {
        return (this.getSurroundingField(x, y) != null);
    }

    addReservedSurrounding(fieldArray, my) {
        for(let i = 0; i < fieldArray.length; i++) {
            let surrField = this.getSurroundingField(fieldArray[i][0], fieldArray[i][1]);
            if (surrField == null) {
                let bookDiv = this.createBookDiv(fieldArray[i][0], fieldArray[i][1], BOOK_TYPE_SURROUNDING, my);
                this.reservedSurrounding.push({"x" : fieldArray[i][0], "y" : fieldArray[i][1], "div" : bookDiv, "my" : my});
            } else {
                if (surrField.my && !my) {
                    surrField.my = false;
                    surrField.div.className = "markField surroundTypeOther";
                }
            }
        }        
    }

    isAnyReserved(fieldArray) {
        for(let i = 0; i < fieldArray.length; i++) {
            if (this.isBookedField(fieldArray[i][0], fieldArray[i][1])) {
                return true;
            }
            if (this.isSurroundingField(fieldArray[i][0], fieldArray[i][1])) {
                return true;
            }
        }
        return false;
    }

    removeMyBookings() {
        let i = 0;
        while (i < this.reservedBooked.length) {
            let booked = this.reservedBooked[i];
            if (booked.my) {
                booked.div.remove();
                this.reservedBooked.splice(i, 1);
            } else {
                i++;
            }
        }
    }

    removeMySurroundings() {
        let i = 0;
        while (i < this.reservedSurrounding.length) {
            let booked = this.reservedSurrounding[i];
            if (booked.my) {
                booked.div.remove();
                this.reservedSurrounding.splice(i, 1);
            } else {
                i++;
            }
        }
    }

    removeSurrondingField(x, y) {
        for(let i = 0; i < this.reservedSurrounding.length; i++) {
            if (this.reservedSurrounding[i].x == x && this.reservedSurrounding[i].y == y) {
                this.reservedSurrounding[i].div.remove();
                let removedField = this.reservedSurrounding[i];
                this.reservedSurrounding.splice(i, 1);
                return removedField;
            }
        }
        return null;
    }

    removeBookingField(x, y) {
        for(let i = 0; i < this.reservedBooked.length; i++) {
            if (this.reservedBooked[i].x == x && this.reservedBooked[i].y == y) {
                this.reservedBooked[i].div.remove();
                let removedField = this.reservedBooked[i];
                this.reservedBooked.splice(i, 1);
                return removedField;
            }
        }
        return null;
    }

    removeSurroundings(surroundings) {
        let removedOnes = [];
        for(let i = 0; i <surroundings.length; i++) {
            let removed = this.removeSurrondingField(surroundings[i][0], surroundings[i][1]);
            if (removed !=null) {
                removedOnes.push(removed);
            }
        }
        return removedOnes;
    }

    removeBookings(bookings) {
        let removedOnes = [];
        for(let i = 0; i <bookings.length; i++) {
            let removed = this.removeBookingField(bookings[i][0], bookings[i][1]);
            if (removed !=null) {
                removedOnes.push(removed);
            }
        }
        return removedOnes;
    }

    removeLetter(i) {
        if (this.lettersOnBoard.length <= i || i < 0) {
            return;
        }
        this.lettersOnBoard[i].div.remove();
        this.lettersOnBoard.splice(i, 1);
    }


    addLetter(letter, x, y) {
        let tileOnPos = this.getTileOnField(x, y);
        if (tileOnPos == null) {
            let buttonEl = putLetterToAnywhere(letter, this.posX(x), this.posY(y), this.board, this.tileWidth, this.tileWidth, null);
            this.lettersOnBoard.push({"letter" : letter, "div" : buttonEl, "x" : x, "y" : y});
        } else {
            if (tileOnPos.letter != letter) {
                console.error("Want to put different letter" + letter +" to board. (On board: " + tileOnPos.letter + ")");
            }
        }
    }

    getTileOnField(x, y) {
        let i = 0;
        while (i < this.lettersOnBoard.length) {
            if (this.lettersOnBoard[i].x == x && this.lettersOnBoard[i].y == y) {
                return this.lettersOnBoard[i];
            }
            i++;
        }
        return null;
    }

    getTileIndexOnField(x, y) {
        let i = 0;
        while (i < this.lettersOnBoard.length) {
            if (this.lettersOnBoard[i].x == x && this.lettersOnBoard[i].y == y) {
                return i;
            }
            i++;
        }
        return -1;
    }

    removeTileOnField(x, y) {
        let letterIndex = this.getTileIndexOnField(x, y);
        this.removeLetter(letterIndex);
    }

    cleanTiles() {
        while (this.lettersOnBoard.length > 0) {
            this.removeLetter(i);
        }
    }

    addSpecialField(coord, fieldType) {
        this.specialFields.push({"x" : coord[0], "y" : coord[1], "type" : fieldType});
    }

    getSpecialField(x, y) {
        for(let i = 0; i < this.specialFields.length; i++) {
            if (this.specialFields[i].x == x && this.specialFields[i].y == y) {
                return this.specialFields[i];
            }
        }
        return null;
    }
}