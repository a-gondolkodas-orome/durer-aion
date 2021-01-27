const isMachineDue = () => {
    const whoisDueDescription = document
        .querySelector('#kupac-ketteoszto')
        .querySelector('.game__step-cta-text')
        .innerHTML;
    return whoisDueDescription === 'Mi jövünk.';
}

//The game board handles all the dom interaction
//Drawing the board and listening for click events
const gameBoard = function(nim) {
    const n = nim;
    const gameContainer = document.querySelector('#kupac-ketteoszto');
    const boardContainer = gameContainer.querySelector('.game__board');

    let move = n.board();


    //create an image node
    const createGamePiece = function(num) {
        const piece = document.createElement('span');
        piece.classList.add(num, 'game__piece', 'game__piece-blue');
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
        if (matches != 0 && n.status().isGameOn)
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
        if (n.status().isGameOn) {
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
        gameContainer.querySelector('.game__ai-loader').style.display = displayStyle(true);
    };

    const enablePlayerMoves = function() {
        gameContainer.querySelector('.game__ai-loader').style.display = displayStyle(false);
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
        ].map(el => el.style.display = displayStyle(toShow));
    }

    return {
        drawBoard: drawBoard,
        toggleGameStartButtons: toggleGameStartButtons,
        disablePlayerMoves: disablePlayerMoves,
        enablePlayerMoves: enablePlayerMoves
    }
}


const game = (function() {
    const ai = nimAi();
    const n = nim();
    const board = gameBoard(n);
    const gameContainer = document.querySelector('#kupac-ketteoszto');

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
            const desc = 'Kattints egy korongra, hogy azzal kettéosztd azt a kupacot. Amelyik korongra kattintasz, az és a tőle jobbra lévők kerülnek az új kupacba.';
            gameContainer.querySelector('.game__step-description').innerHTML = desc;
        }

        if (!n.status().isGameOn) {
            gameContainer.querySelector('.game__step-description').innerHTML = '';
            board.toggleGameStartButtons(false);
            gameContainer.querySelector('.game__ai-loader').style.display = displayStyle(false);
        }
    }

    const aiMove = function() {
        if (n.status().isGameOn) {
            board.drawBoard(n.move(ai.makeMove(n.board())));
            checkGame();
            board.enablePlayerMoves();
        } else {
            gameContainer.querySelector('.game__ai-loader').style.display = displayStyle(false);
        }
    }

    const startGameAsPlayer = function(isFirstPlayer) {
        n.startGameAsPlayer(isFirstPlayer);

        board.toggleGameStartButtons(false);

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
        gameContainer.querySelector('.game__step-cta-text').innerHTML = 'A gombra kattintva tudod elindítani a játékot.';
        gameContainer.querySelector('.game__step-description').innerHTML = '';
        board.toggleGameStartButtons(true);
        gameContainer.querySelector('.game__ai-loader').style.display = displayStyle(false);
    }

    board.drawBoard(n.board());

    return {
        startGameAsPlayer: startGameAsPlayer,
        resetGame: resetGame
    }

})();
window.game = game;

