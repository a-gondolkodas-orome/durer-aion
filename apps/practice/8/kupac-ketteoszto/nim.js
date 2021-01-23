'use strict';

var nim = function() {

    //The Game board
    var board = [4, 5];



    var playerOne = true;
    var isGameOverb = true;
    var isPlayerWinner = false;

    //Check the object if it's valid
    /*var parseObj = function(o) {
        for (var i in getBoard) {
            if (!o.hasOwnProperty(i) || o[i]==undefined) {
                o[i]=board[i];
            }else if(o[i]!=undefined){
                for(var field in o[i]){
                    if(!(o[field]===true || o[field]===false)){
                        throw new Error('Non-boolean field on board.');
                    }
                }
            }
        }


        
    };
    */


    var generateBoard = function() {
        board = [Math.floor(Math.random() * 4) + 3, Math.floor(Math.random() * 4) + 3];

        return board;
    };

    generateBoard();



    var move = function(obj) {
        //parseObj(obj);



        board = obj;
        playerOne = !playerOne;
        //!Move the soldiers
        if (board[0] == 1 && board[1] == 1) {
            isGameOverb = true;
            isPlayerWinner = !playerOne;
        }
        return board;

    };

    var getBoard = function() {
        return JSON.parse(JSON.stringify(board));
    };

    var getPlayer = function() {
        return playerOne;
    };

    var isGameOver = function() {
        return isGameOverb;
    };

    var getStatus = function() {
        if (isGameOver()) {
            return {
                player: !isPlayerWinner ? "Sajnos, most nem nyertél, de ne add fel." : "Nyertél. Gratulálunk! :)",
                isGameOn: false
            };
        }

        return {
            player: playerOne ? "Te jössz." : "Mi jövünk.",
            isGameOn: true
        }

    }

    var startGameAsPlayer = function(isFirstPlayer) {
        playerOne = isFirstPlayer;
        isGameOverb = false;
    }

    return {
        move: move,
        board: getBoard,
        play: getPlayer,
        status: getStatus,
        startGameAsPlayer: startGameAsPlayer,
        newBoard: generateBoard
    };
}
