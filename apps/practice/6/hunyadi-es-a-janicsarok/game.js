const isMachineDue = () => {
    const whoisDueDescription = document
        .querySelector('#hunyadi-es-a-janicsarok')
        .querySelector('.game__step-cta-text')
        .innerHTML;
    return whoisDueDescription === 'Mi jövünk.';
}

//The game board handles all the dom interaction
//Drawing the board and listening for click events
const gameBoard = function(nim) {
    const n = nim;
    let move = n.board();
    const gameContainer = document.querySelector('#hunyadi-es-a-janicsarok');
    const boardContainer = gameContainer.querySelector('.game__board');

    const createGamePiece = function(num, source) {
        const piece = document.createElement('span');
        piece.classList.add(num, 'game__piece', `game__piece-${source ? 'red' : 'blue'}`);
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
        if (n.status().isGameOn)
            if (!n.state()) pubSub.pub('PLAYER_MOVE', move);
    }

    const killBlue = function() {
        if (n.status().isGameOn)
            if (n.state()) pubSub.pub('PLAYER_MOVE', true);
    }

    const killRed = function() {
        if (n.status().isGameOn)
            if (n.state()) pubSub.pub('PLAYER_MOVE', false);
    }

    const makeMove = function() {
        if (n.status().isGameOn) {
            if (n.state() === false) {
                const pile = parseInt(this.parentElement.id.replace(/row\_/, ''));
                const matches = this.classList[0] - 1;
                move[pile][matches] = !move[pile][matches];
                drawBoard(move);
            }
        }

    }

    const appendEventsToBoard = function() {
        const imgs = boardContainer.querySelectorAll('span');
        for (let i = imgs.length - 1; i >= 0; i--) {
            imgs[i].addEventListener('click', makeMove);
        };
        gameContainer.querySelector('#game-red').addEventListener('click', killRed);
        gameContainer.querySelector('#game-blue').addEventListener('click', killBlue);
        gameContainer.querySelector('[class*="game__step-for-first"]').addEventListener('click', step);
    };

    const disablePlayerMoves = function() {
        [...gameContainer.querySelectorAll('[class*="game__step-for"]')].map(el => el.setAttribute('disabled', true));
        [...gameContainer.querySelector('.game__board').querySelectorAll('span')].map(el => {
            el.style.opacity = 0.5;
            el.removeEventListener('click', makeMove);
        });
        gameContainer.querySelector('.game__ai-loader').style.display = displayStyle(true);
    };

    const enablePlayerMoves = function() {
        [...gameContainer.querySelectorAll('[class*="game__step-for"]')].map(el => el.removeAttribute('disabled'));
        gameContainer.querySelector('.game__ai-loader').style.display = displayStyle(false);
    };

    const emptyPile = function(el) {
        if (el && el.firstChild) {
            while (el.firstChild) {
                el.removeChild(el.firstChild);
            }
        }
    };

    const drawBoard = function(board) {
        move = board;
        //loop through the board
        for (const i in board) {
            if (board.hasOwnProperty(i) && typeof i !== 'undefined') {
                //get images
                const frag = drawPile(board[i].length, board[i]);
                //append images to the pile
                emptyPile(boardContainer.querySelector(`#row_${i}`));
                boardContainer.querySelector(`#row_${i}`).appendChild(frag);
            }
        }
        appendEventsToBoard();
    };

    const toggleGameStartButtons = function(showGameStart) {
        toggleVisibilityForElements('game__role-selector', showGameStart);
        toggleVisibilityForElements('game__reset-game', !showGameStart);
    }

    const toggleVisibilityForElements = (classPrefix, toShow) => {
        [
            ...gameContainer.querySelectorAll(`[class*="${classPrefix}"]`)
        ].map(el => el.style.display = displayStyle(toShow));
    }

    return {
        drawBoard: drawBoard,
        toggleGameStartButtons: toggleGameStartButtons,
        toggleVisibilityForElements: toggleVisibilityForElements,
        disablePlayerMoves: disablePlayerMoves,
        enablePlayerMoves: enablePlayerMoves
    }
}


const game = (function() {
    const ai = nimAi();
    const n = nim();
    const board = gameBoard(n);
    const gameContainer = document.querySelector('#hunyadi-es-a-janicsarok');

    pubSub.sub('PLAYER_MOVE', function(move) {
        board.drawBoard(n.move(move));
        checkGame();
        const time = Math.floor(Math.random() * 750 + 750);
        board.disablePlayerMoves();
        setTimeout(aiMove, time);
    });

    const checkGame = function() {
        gameContainer.querySelector('.game__step-cta-text').innerHTML = n.status().player;
        if (isMachineDue()) {
            gameContainer.querySelector('.game__step-description').innerHTML = '';
        } else {
            gameContainer.querySelector('.game__step-description').innerHTML = n.state() 
                ? 'Válaszd ki, hogy ma a piros vagy kék hadtestet semmisíted meg.' 
                : 'Kattints  a korongokra és válaszd két részre a seregedet.';
        }

        if (!n.status().isGameOn) {
            gameContainer.querySelector('.game__step-description').innerHTML = '';
            board.toggleVisibilityForElements('game__step-for', false);

            board.toggleGameStartButtons(false);
            gameContainer.querySelector('.game__ai-loader').style.display = displayStyle(false);
        }
        n.isBeginningOfGame = false;
    }

    const aiMove = function() {
        if (n.status().isGameOn) {
            board.drawBoard(n.move(ai.makeMove(n.board(), n.state())));
            checkGame();
            board.enablePlayerMoves();
        } else {
            gameContainer.querySelector('.game__ai-loader').style.display = displayStyle(false);
        }
    }

    const startGameAsPlayer = function(isFirstPlayer) {
        n.startGameAsPlayer(isFirstPlayer);
        n.isBeginningOfGame = true;

        board.toggleGameStartButtons(false);

        board.toggleVisibilityForElements('game__step-for-first', isFirstPlayer);
        board.toggleVisibilityForElements('game__step-for-second', !isFirstPlayer);

        gameContainer.querySelector('.game__step-cta-text').innerHTML = n.status().player;
        board.drawBoard(n.board());

        checkGame();
        if (!isFirstPlayer) {
            const time = Math.floor(Math.random() * 750 + 750);
            board.disablePlayerMoves();
            setTimeout(aiMove, time);
        }
    }

    const resetGame = function() {
        board.drawBoard(n.newBoard());
        gameContainer.querySelector('.game__step-description').innerHTML = '';
        gameContainer.querySelector('.game__step-cta-text').innerHTML = 'A gombra kattintva tudod elindítani a játékot.';
        board.toggleGameStartButtons(true);
        board.toggleVisibilityForElements('game__step-for-', false);
        gameContainer.querySelector('.game__ai-loader').style.display = displayStyle(false);
    }

    board.drawBoard(n.board());

    return {
        startGameAsPlayer: startGameAsPlayer,
        resetGame: resetGame
    }

})();

window.game = game;
