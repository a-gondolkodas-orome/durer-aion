const isMachineDue = () => {
    const whoisDueDescription = document
        .getElementById('hunyadi-es-a-janicsarok')
        .querySelector('.game__step-cta-text')
        .innerHTML;
    return whoisDueDescription === "Mi jövünk.";
}

//The game board handles all the dom interaction
//Drawing the board and listening for click events
var gameBoard = function(nim) {
    var n = nim;
    window.move = n.board();
    var gameContainer = document.getElementById('hunyadi-es-a-janicsarok');
    var boardContainer = gameContainer.querySelector('.game__board');

    var createGamePiece = function(num, source) {
        var piece = document.createElement('span');
        piece.classList.add(num, 'game__piece', `game__piece-${source ? 'red' : 'blue'}`);
        return piece;
    }


    var drawPile = function(num, array) {
        //create a document fragment once
        var frag = document.createDocumentFragment();
        //create all num images
        for (var i = 0; i < num; i = i + 1) {
            //var lastTwo = false; 
            //if (i + 2 < num) lastTwo = true;
            var img = createGamePiece(i + 1, true);
            if (array[i]) {
                img = createGamePiece(i + 1, false);
            }

            frag.appendChild(img);
        }
        //return the fragment
        return frag;
    }

    var makeMove = function() {
        if (n.status().isGameOn) {
            if (isMachineDue() && n.state() === true) {
                console.error('Túl gyorsan léptél, még mi jövünk.');
            } else if (n.state() === false) {
                var pile = parseInt(this.parentElement.id.replace(/row\_/, ''));
                var matches = this.classList[0] - 1;
                window.move[pile][matches] = !window.move[pile][matches];
                drawBoard(window.move);
            }
        }

    }

    var appendEventsToBoard = function() {
        var imgs = boardContainer.getElementsByTagName('span');
        for (var i = imgs.length - 1; i >= 0; i--) {
            imgs[i].onclick = makeMove;
        };
    };

    var emptyPile = function(el) {
        if (el && el.firstChild) {
            while (el.firstChild) {
                el.removeChild(el.firstChild);
            }
        }
    }

    var drawBoard = function(board) {
        window.move = board;
        //loop through the board
        for (var i in board) {
            if (board.hasOwnProperty(i) && typeof i !== 'undefined') {
                //get images
                var frag = drawPile(board[i].length, board[i]);
                //append images to the pile
                emptyPile(boardContainer.querySelector('#row_' + i));
                boardContainer.querySelector('#row_' + i).appendChild(frag);
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
        toggleVisibilityForElements: toggleVisibilityForElements
    }
}


var game = (function() {
    var ai = nimAi();
    var n = nim();
    var board = gameBoard(n);
    var gameContainer = document.getElementById('hunyadi-es-a-janicsarok');

    pubSub.sub('PLAYER_MOVE', function(move) {
        board.drawBoard(n.move(move));
        checkGame();
        var time = Math.floor(Math.random() * 750 + 750);
        setTimeout(aiMove, time);
    });

    var checkGame = function() {
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
        }
        n.isBeginningOfGame = false;
    }

    var aiMove = function() {
        if (n.status().isGameOn) {
            board.drawBoard(n.move(ai.makeMove(n.board(), n.state())));
            checkGame();
        }
    }

    var step = function() {
        if (n.status().isGameOn)
            if (isMachineDue() && n.state() === true) {
                console.error('Túl gyorsan léptél, még mi jövünk.');
            } else if (!n.state()) pubSub.pub('PLAYER_MOVE', window.move);
    }

    var killBlue = function() {
        if (n.status().isGameOn)
            if (isMachineDue() && n.state() === false) {
                console.error('Túl gyorsan léptél, még mi jövünk.');
            } else if (n.state()) {
                pubSub.pub('PLAYER_MOVE', true);
            }
    }

    var killRed = function() {
        if (n.status().isGameOn)
            if (gameContainer.querySelector('.game__step-cta-text').innerHTML === "Mi jövünk." && n.state() === false) {
                console.error('Túl gyorsan léptél, még mi jövünk.');
            } else if (n.state()) {
                pubSub.pub('PLAYER_MOVE', false);
            }
    }

    var startGameAsPlayer = function(isFirstPlayer) {
        n.startGameAsPlayer(isFirstPlayer);
        n.isBeginningOfGame = true;

        board.toggleGameStartButtons(false);

        board.toggleVisibilityForElements('game__step-for-first', isFirstPlayer);
        board.toggleVisibilityForElements('game__step-for-second', !isFirstPlayer);

        gameContainer.querySelector('.game__step-cta-text').innerHTML = n.status().player;
        board.drawBoard(n.board());

        checkGame();
        if (!isFirstPlayer) {
            aiMove();
        }
    }

    var resetGame = function() {
        board.drawBoard(n.newBoard());
        gameContainer.querySelector('.game__step-description').innerHTML = '';
        gameContainer.querySelector('.game__step-cta-text').innerHTML = 'A gombra kattintva tudod elindítani a játékot.';
        board.toggleGameStartButtons(true);
        board.toggleVisibilityForElements('game__step-for-', false);
    }

    board.drawBoard(n.board());

    return {
        startGameAsPlayer: startGameAsPlayer,
        resetGame: resetGame,
        step: step,
        killRed: killRed,
        killBlue: killBlue
    }

})();
window.game = game;

