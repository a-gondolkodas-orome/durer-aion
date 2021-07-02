import { getStatus } from './communication';
import { reactToPlayerMove } from './game';

//The game board handles all the dom interaction
//Drawing the board and listening for click events

const gameContainer = () => document.querySelector('#hunyadi-es-a-janicsarok');
const boardContainer = () => gameContainer().querySelector('.game__board');

let move;

export const disablePlayerMoves = function() {
    [...gameContainer().querySelectorAll('[class*="game__step-for"]')].map(el => el.setAttribute('disabled', true));
    [...gameContainer().querySelector('.game__board').querySelectorAll('span')].map(el => {
        el.style.opacity = '0.5';
        el.removeEventListener('click', makeMove);
    });
    gameContainer().querySelector('.game__loader').style.visibility = 'visible';
};

export const enablePlayerMoves = function() {
    [...gameContainer().querySelectorAll('[class*="game__step-for"]')].map(el => el.removeAttribute('disabled'));
    gameContainer().querySelector('.game__loader').style.visibility = 'hidden';
};

const emptyPile = function(el) {
    if (el && el.firstChild) {
        while (el.firstChild) {
            el.removeChild(el.firstChild);
        }
    }
};

export const drawBoard = function(board) {
    move = board;
    //loop through the board
    for (const i in board) {
        if (board[i]) {
            //get images
            const frag = drawPile(board[i].length, board[i]);
            //append images to the pile
            emptyPile(boardContainer().querySelector(`#row_${i}`));
            boardContainer().querySelector(`#row_${i}`).appendChild(frag);
        }
    }
    appendEventsToBoard();
};

export const toggleGameStartButtons = function(showGameStart) {
    toggleVisibilityForElements('game__role-selector', showGameStart);
    toggleVisibilityForElements('game__reset-game', !showGameStart);
}

export const toggleVisibilityForElements = (classPrefix, toShow) => {
    [
        ...gameContainer().querySelectorAll(`[class*="${classPrefix}"]`)
    ].map(el => el.style.display = toShow ? 'block' : 'none');
}

const ctaText = function() {
    if (getStatus().isGameInProgress) {
        return getStatus().shouldPlayerMoveNext ? 'Te jössz.' : 'Mi jövünk.';
    } else if (getStatus().isGameFinished) {
        return getStatus().isPlayerWinner ? 'Nyertél. Gratulálunk! :)' : 'Sajnos, most nem nyertél, de ne add fel.';
    } else { // ready to start
        return 'A gombra kattintva tudod elindítani a játékot.';
    }
};

const stepDescription = function() {
    if (!getStatus().isGameInProgress) return '';
    if (!getStatus().shouldPlayerMoveNext) return '';
    return getStatus().killState
        ? ''
        : 'Kattints  a korongokra és válaszd két részre a seregedet.';
};

export const updateGamePrompts = function() {
    gameContainer().querySelector('.game__step-cta-text').innerHTML = ctaText();
    gameContainer().querySelector('.game__step-description').innerHTML = stepDescription();
};

const createGamePiece = function(num, source) {
    const piece = document.createElement('span');
    piece.classList.add(num);
    piece.innerHTML = `<svg class="game__piece game__svg-piece-${source ? 'red' : 'blue'}">
        <use xlink:href="#game-soldier-icon" />
    </svg>`;
    return piece;
}


const drawPile = function(num, array) {
    //create a document fragment once
    const frag = document.createDocumentFragment();
    //create all num images
    for (let i = 0; i < num; i = i + 1) {
        //const lastTwo = false;
        //if (i + 2 < num) lastTwo = true;
        let img = createGamePiece(i + 1, true);
        if (array[i]) {
            img = createGamePiece(i + 1, false);
        }

        frag.appendChild(img);
    }
    //return the fragment
    return frag;
}

const step = function() {
    if (getStatus().isGameInProgress) {
      if (!getStatus().killState) reactToPlayerMove(move);
    }
}

const killBlue = function() {
    if (getStatus().isGameInProgress) {
      if (getStatus().killState) reactToPlayerMove(true);
    }
}

const killRed = function() {
    if (getStatus().isGameInProgress) {
      if (getStatus().killState) reactToPlayerMove(false);
    }
}

const makeMove = function() {
    if (getStatus().isGameInProgress) {
        if (getStatus().killState === false) {
            const pile = parseInt(this.parentElement.id.replace(/row_/, ''));
            const matches = this.classList[0] - 1;
            move[pile][matches] = !move[pile][matches];
            drawBoard(move);
        }
    }

}

const appendEventsToBoard = function() {
    [...boardContainer().querySelectorAll('span')].forEach(img => img.addEventListener('click', makeMove));
    gameContainer().querySelector('#game-red').addEventListener('click', killRed);
    gameContainer().querySelector('#game-blue').addEventListener('click', killBlue);
    gameContainer().querySelector('[class*="game__step-for-first"]').addEventListener('click', step);
};
