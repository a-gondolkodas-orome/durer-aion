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
        startGameAsPlayer,
        resetGame
    }

})();

window.game = game;
