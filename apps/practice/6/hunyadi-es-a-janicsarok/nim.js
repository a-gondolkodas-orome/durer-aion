'use strict';

var nim = function() {
    
    //The Game board
    var board = 
    [[true],
     [true],
     [true,true,true],
     [true,true,true],
     [true,true,true]];
    


    var playerOne = true;
    var isBeginningOfGame = true;
    var isGameOverb=false;
    var killState=false;
    var isPlayerWinner=false;
    
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

    //is the move legal
    var isMoveLegal = function(obj) {
        for (var i in board) {
            if(obj[i].length!=board[i].length){
                return false;
            }
        }
        return true;
    }

    var generateBoard= function(){
        var sum=2.0+Math.ceil(Math.random()*8)/8-0.5;
        board=[];
        for (var i = 0; i < 5; i++) {
            var row=[];
            for(sum; sum >= ((1.0/2.0)**i); sum-=((1.0/2.0)**i)){
                row.push(true);
            }
            board.push(row);
        };
        for (var i = 0; i < 4; i++) {
            for (var j = board[i].length - 1; j >= 0; j--) {
                if(Math.random()>0.5){
                    board[i].splice(j,1);
                    board[i+1].push(true); board[i+1].push(true);
                }
            };
        };

        return board;
    };

    generateBoard();



    var move = function(obj) {
        if(!killState){
    		isBeginningOfGame = false;
            killState=true;
            //parseObj(obj);
                

            if (!isMoveLegal(obj)) {
                throw new Error('Nem megengedett lépés!!!');
            }

            board = obj;
            playerOne = !playerOne;
            //!Move the soldiers
            return board;
        }else{
            killState=false;
            isBeginningOfGame = false;
            if(!(obj===true || obj===false)){
                throw new Error('Nem megengedett szín!!!');   
            }


            var sum=0;
            for(var j in board[0]){
                if(board[0][j]!=obj){
                    isGameOverb=true;    
                    isPlayerWinner=!playerOne;
                }
            }
            
            for(var i in board){
                if(i!=0){
                    for(var j in board[i]){
                        if(board[i][j]!=obj){
                            sum++;
                            board[i-1].push(board[i][j]);
                        }
                    }
                }

                board[i]=[];
            }
            
            playerOne = !playerOne;
            if(sum==0 && !isGameOverb){
                isGameOverb=true;
                isPlayerWinner=!playerOne;
            }

        }
        return board;
    };

    var getBoard = function() {
        return JSON.parse(JSON.stringify(board));
    };

    var getPlayer = function() {
        return playerOne;
    };
    var getState = function() {
        return killState;
    };

    var isGameOver = function() {
        return isGameOverb;
    };

    var getStatus = function() {
        if (isGameOver()) {
            return {
                player: !isPlayerWinner ?  "Sajnos, most nem nyertél, de ne add fel.": "Nyertél. Gratulálunk! :)",
                isGameOn: false
            };
        }

        return {
            player: playerOne ? "Te jössz." : "Mi jövünk.",
            isGameOn: true
        }

    }

    var resetGame = function(player) {
        playerOne = !player;
        isBeginningOfGame = true;
        isGameOverb=false;
        killState = false;
    }

    return {
        move: move,
        board: getBoard,
        play: getPlayer,
        status: getStatus,
        state: getState,
        reset: resetGame,
        newBoard:generateBoard
    };
}
