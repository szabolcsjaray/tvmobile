const GAME_GATHERING = 0;
const GAME_FIRST_WORD = 1;
const GAME_PLAYING = 2;
const GAME_PAUSED = 3;
const GAME_FINISHED = 4;
const GAME_TRY_BOOKING = 5;
const GAME_BOOKED_PUTTING_TILES = 6;
const GAME_PLAYER_PUTTING_WORD = 7;
const GAME_PLAYER_BOOKS_NEW = 8;

class Game {
    constructor() {
        this.state = GAME_GATHERING;
    }

}