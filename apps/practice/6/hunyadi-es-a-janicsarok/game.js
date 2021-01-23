const isMachineDue = () => document.querySelector('.game__step-cta-text').innerHTML === "Mi jövünk.";
const displayStyle = toShow => toShow ? 'block' : 'none';

//The game board handles all the dom interaction
//Drawing the board and listening for click events
var gameBoard = function(nim) {
    var n = nim;
    window.move = n.board();
    var container = document.querySelector('.game__board');

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
        var imgs = container.getElementsByTagName('span');
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
                emptyPile(container.querySelector('#row_' + i));
                container.querySelector('#row_' + i).appendChild(frag);
            }
        }
        appendEventsToBoard();
    };

    const toggleGameStartButtons = function(showGameStart) {
        document.getElementById("startTrue").style.display = displayStyle(showGameStart);
        document.getElementById("startFalse").style.display = displayStyle(showGameStart);
        document.getElementById("resetGame").style.display = displayStyle(!showGameStart);
    }

    return {
        drawBoard: drawBoard,
        toggleGameStartButtons: toggleGameStartButtons
    }
}


var game = (function() {
    var ai = nimAi();
    var n = nim();
    var board = gameBoard(n);

    pubSub.sub('PLAYER_MOVE', function(move) {
        board.drawBoard(n.move(move));
        checkGame();
        var time = Math.floor(Math.random() * 750 + 750);
        setTimeout(aiMove, time);
    });

    var checkGame = function() {
        document.querySelector('.game__step-cta-text').innerHTML = n.status().player;
        if (isMachineDue()) {
            document.querySelector('.game__step-description').innerHTML = '';
        } else {
            document.querySelector('.game__step-description').innerHTML = n.state() 
                ? 'Válaszd ki, hogy ma a piros vagy kék hadtestet semmisíted meg.' 
                : 'Kattints  a korongokra és válaszd két részre a seregedet.';
        }

        if (!n.status().isGameOn) {
            document.querySelector('.game__step-description').innerHTML = '';
            document.getElementById("step").style.display = displayStyle(false);
            document.getElementById("red").style.display = displayStyle(false);
            document.getElementById("blue").style.display = displayStyle(false);

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
            if (document.querySelector('.game__step-cta-text').innerHTML === "Mi jövünk." && n.state() === false) {
                console.error('Túl gyorsan léptél, még mi jövünk.');
            } else if (n.state()) {
                pubSub.pub('PLAYER_MOVE', false);
            }
    }

    var startGameAsPlayer = function(player) {
        n.startGameAsPlayer(player);
        n.isBeginningOfGame = true;

        board.toggleGameStartButtons(false);

        document.getElementById("step").style.display = displayStyle(!player);

        document.getElementById("red").style.display = displayStyle(player);
        document.getElementById("blue").style.display = displayStyle(player);

        document.querySelector('.game__game-area').style.display = 'block';
        document.querySelector('.game__step-cta-text').innerHTML = n.status().player;
        board.drawBoard(n.board());

        checkGame();
        if (player) {
            aiMove();
        }
    }

    var resetGame = function() {
        board.drawBoard(n.newBoard());
        document.querySelector('.game__step-description').innerHTML = '';
        document.querySelector('.game__step-cta-text').innerHTML = 'A gombra kattintva tudod elindítani a játékot.';
        board.toggleGameStartButtons(true);

        document.getElementById("step").style.display = displayStyle(false);
        document.getElementById("red").style.display = displayStyle(false);
        document.getElementById("blue").style.display = displayStyle(false);
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

