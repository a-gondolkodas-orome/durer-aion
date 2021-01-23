const isMachineDue = () => document.querySelector('.game__step-cta-text').innerHTML === "Mi jövünk.";
const displayStyle = toShow => toShow ? 'block' : 'none';

//The game board handles all the dom interaction
//Drawing the board and listening for click events
var gameBoard = function(nim) {
    var n = nim;
    var container = document.querySelector('.game__board');

    var move = n.board();


    //create an image node
    var createGamePiece = function(num) {
        var piece = document.createElement('span');
        piece.classList.add(num, 'game__piece', 'game__piece-blue');
        return piece;
    }


    var drawPile = function(num) {
        //create a document fragment once
        var frag = document.createDocumentFragment();
        //create all num images
        for (var i = 0; i < num; i = i + 1) {
            frag.appendChild(createGamePiece(i + 1, true));
        }
        return frag;
    }

    var hoverEvent = function() {
        var parent = this.parentElement;
        parent.classList[1];
        var matches = parseInt(this.classList[0], 10) - 1;
        if (matches != 0 && n.status().isGameOn)
            for (var i = this.parentElement.children.length - 1; i >= 0; i--) {
                if (parseInt(this.parentElement.children[i].classList[0], 10) - 1 >= matches) {
                    this.parentElement.children[i].style.opacity = '0.5';
                }
            }
    }

    var hoverOutEvent = function() {
        var parent = this.parentElement;
        parent.classList[1];
        var matches = parseInt(this.classList[0], 10) - 1;
        if (matches != 0)
            for (var i = this.parentElement.children.length - 1; i >= 0; i--) {
                if (parseInt(this.parentElement.children[i].classList[0], 10) - 1 >= matches) {
                    this.parentElement.children[i].style.opacity = '1';
                }
            }
    }


    var makeMove = function() {
        if (n.status().isGameOn) {
            if (isMachineDue()) {
                console.error('Túl gyorsan léptél, még mi jövünk.');
            } else {
                var pile = parseInt(this.parentElement.id.replace(/row_/, ''));
                var num = parseInt(this.parentElement.querySelectorAll('span').length, 10);
                var rem = parseInt(this.classList[0], 10);
                var diff = num - (rem - 1);

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
    }


    var appendEventsToBoard = function() {
        var imgs = container.getElementsByTagName('span');
        for (var i = imgs.length - 1; i >= 0; i--) {
            imgs[i].onmouseover = hoverEvent;
            imgs[i].onmouseout = hoverOutEvent;
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
        move = board;
        //loop through the board
        for (var i in board) {
            if (board.hasOwnProperty(i) && typeof i !== 'undefined') {
                var frag = drawPile(board[i]);
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
            const desc = 'Kattints egy korongra, hogy azzal kettéosztd azt a kupacot. Amelyik korongra kattintasz, az és a tőle jobbra lévők kerülnek az új kupacba.';
            document.querySelector('.game__step-description').innerHTML = desc;
        }

        if (!n.status().isGameOn) {
            document.querySelector('.game__step-description').innerHTML = '';
            board.toggleGameStartButtons(false);
        }
    }

    var aiMove = function() {
        if (n.status().isGameOn) {
            board.drawBoard(n.move(ai.makeMove(n.board())));
            checkGame();
        }
    }

    var startGameAsPlayer = function(player) {
        n.startGameAsPlayer(player);

        board.toggleGameStartButtons(false);

        document.querySelector('.game__step-cta-text').innerHTML = n.status().player;
        board.drawBoard(n.board());
        checkGame();
        if (player) {
            aiMove();
        }
    }

    var resetGame = function() {
        board.drawBoard(n.newBoard());
        document.querySelector('.game__step-cta-text').innerHTML = 'A gombra kattintva tudod elindítani a játékot.';
        document.querySelector('.game__step-description').innerHTML = '';
        board.toggleGameStartButtons(true);
    }

    board.drawBoard(n.board());

    return {
        startGameAsPlayer: startGameAsPlayer,
        resetGame: resetGame
    }

})();
window.game = game;

