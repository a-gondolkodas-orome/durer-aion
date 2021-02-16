//The game board handles all the dom interaction
//Drawing the board and listening for click events
const gameBoard = function(nim) {
    const n = nim;
    const gameContainer = document.querySelector('#kupac-ketteoszto');
    const boardContainer = gameContainer.querySelector('.game__board');

    let move;

    //create an image node
    const createGamePiece = function(num) {
        const piece = document.createElement('span');
        piece.classList.add(num, 'game__piece', 'game__piece-blue', 'game__circle');
        return piece;
    }

    const drawPile = function(num) {
        //create a document fragment once
        const frag = document.createDocumentFragment();
        //create all num images
        for (let i = 0; i < num; i = i + 1) {
            frag.appendChild(createGamePiece(i + 1, true));
        }
        return frag;
    }

    const hoverEvent = function() {
        const parent = this.parentElement;
        parent.classList[1];
        const matches = parseInt(this.classList[0], 10) - 1;
        if (matches != 0 && n.getStatus().isGameInProgress)
            for (let i = this.parentElement.children.length - 1; i >= 0; i--) {
                if (parseInt(this.parentElement.children[i].classList[0], 10) - 1 >= matches) {
                    this.parentElement.children[i].style.opacity = '0.5';
                }
            }
    }

    const hoverOutEvent = function() {
        const parent = this.parentElement;
        parent.classList[1];
        const matches = parseInt(this.classList[0], 10) - 1;
        if (matches != 0)
            for (let i = this.parentElement.children.length - 1; i >= 0; i--) {
                if (parseInt(this.parentElement.children[i].classList[0], 10) - 1 >= matches) {
                    this.parentElement.children[i].style.opacity = '1';
                }
            }
    }


    const makeMove = function() {
        if (n.getStatus().isGameInProgress) {
            const pile = parseInt(this.parentElement.id.replace(/row_/, ''));
            const num = parseInt(this.parentElement.querySelectorAll('span').length, 10);
            const rem = parseInt(this.classList[0], 10);
            const diff = num - (rem - 1);

            if (move[pile] <= 1 || rem - 1 < 1 || diff < 1) {
                console.error('Nincs elég/nem marad elég korong a sorban, hogy kettéoszd.');
            } else {
                move[pile] = rem - 1;
                move[(pile + 1) % 2] = diff;

                drawBoard(move);
                pubSub.pub('PLAYER_MOVE', move);
            }
        }
    }


    const appendEventsToBoard = function() {
        const imgs = boardContainer.querySelectorAll('span');
        for (let i = imgs.length - 1; i >= 0; i--) {
            imgs[i].addEventListener('click', makeMove);
            imgs[i].addEventListener('mouseover', hoverEvent);
            imgs[i].addEventListener('mouseout', hoverOutEvent);
        };
    };

    const disablePlayerMoves = function() {
        [...gameContainer.querySelector('.game__board').querySelectorAll('span')].map(el => {
            el.style.opacity = 0.5;
            el.removeEventListener('click', makeMove);
            el.removeEventListener('mouseover', hoverEvent);
            el.removeEventListener('mouseout', hoverOutEvent);
        });
        gameContainer.querySelector('.game__loader').style.visibility = 'visible';
    };

    const enablePlayerMoves = function() {
        gameContainer.querySelector('.game__loader').style.visibility = 'hidden';
    };

    const emptyPile = function(el) {
        if (el && el.firstChild) {
            while (el.firstChild) {
                el.removeChild(el.firstChild);
            }
        }
    }

    const drawBoard = function(board) {
        move = board;
        //loop through the board
        for (const i in board) {
            if (board.hasOwnProperty(i) && typeof i !== 'undefined') {
                const frag = drawPile(board[i]);
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
        ].map(el => el.style.display = toShow ? 'block' : 'none');
    }

    const ctaText = function() {
        if (n.getStatus().isGameInProgress) {
            return n.getStatus().shouldPlayerMoveNext ? 'Te jössz.' : 'Mi jövünk.';
        } else if (n.getStatus().isGameFinished) {
            return n.getStatus().isPlayerWinner ? 'Nyertél. Gratulálunk! :)' : 'Sajnos, most nem nyertél, de ne add fel.';
        } else { // ready to start
            return 'A gombra kattintva tudod elindítani a játékot.';
        }
    }

    const updateGamePrompts = function() {
        gameContainer.querySelector('.game__step-cta-text').innerHTML = ctaText();
        
        const stepDescription = n.getStatus().isGameInProgress && n.getStatus().shouldPlayerMoveNext
            ? 'Kattints egy korongra, hogy azzal kettéosztd azt a kupacot. Amelyik korongra kattintasz, az és a tőle jobbra lévők kerülnek az új kupacba.'
            : '';
        gameContainer.querySelector('.game__step-description').innerHTML = stepDescription;
    };

    return {
        drawBoard,
        toggleGameStartButtons,
        disablePlayerMoves,
        enablePlayerMoves,
        updateGamePrompts
    };
}


const game = (function() {
    const enemyStrategy = strategy();
    const n = nim();
    const board = gameBoard(n);
    const gameContainer = document.querySelector('#kupac-ketteoszto');
    let enemyMoveTimeoutHandle;

    pubSub.sub('PLAYER_MOVE', function(move) {
        board.drawBoard(n.move(move));
        checkGame();
        if (n.getStatus().isGameInProgress) aiMove();
    });

    const checkGame = function() {
        board.updateGamePrompts();

        if (!n.getStatus().isGameInProgress) {
            board.toggleGameStartButtons(false);
            gameContainer.querySelector('.game__loader').style.visibility = 'hidden';
        }
    }

    const aiMove = function() {
        board.disablePlayerMoves();

        const time = Math.floor(Math.random() * 750 + 750);
        enemyMoveTimeoutHandle = setTimeout(() => {
            board.drawBoard(n.move(enemyStrategy.makeMove(n.getBoard())))
            checkGame();
            board.enablePlayerMoves();
        }, time);
    }

    const startGameAsPlayer = function(isFirstPlayer) {
        n.startGameAsPlayer(isFirstPlayer);

        board.toggleGameStartButtons(false);
        board.updateGamePrompts();

        if (!isFirstPlayer) aiMove();
    }

    const resetGame = function() {
        // If new board is requested while enemy move is in progress
        clearTimeout(enemyMoveTimeoutHandle);
        gameContainer.querySelector('.game__loader').style.visibility = 'hidden';

        board.drawBoard(n.generateNewBoard());
        board.updateGamePrompts();
        board.toggleGameStartButtons(true);

    }

    
    resetGame();

    return {
        startGameAsPlayer: startGameAsPlayer,
        resetGame: resetGame
    }

})();

window.game = game;
