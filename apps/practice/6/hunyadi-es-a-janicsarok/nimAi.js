'use strict';
var nimAi = function() {
	/*
	var getXOR = function (board) {
		return board.pileOne ^ board.pileTwo;
	}

	var getRemainder = function (board) {
		return board.pileTwo % 3;
	}

	var isOptimalMovePossible = function(board) {
		return getRemainder(board) !== 0;
	};

	var makeOptimalMove = function(board) {
		
		var rem = getRemainder(board);
         
		var random_boolean = Math.random() >= 0.5;
		
		if (random_boolean && board.pileOne > 1) {
  		   var remTimesTwo = (2 * rem) % 3;
			board.pileOne = board.pileOne - remTimesTwo;
			board.pileTwo = board.pileTwo + remTimesTwo;
			return board;
		} else {
			board.pileTwo = board.pileTwo - rem;
			return board;			
		}
	}

	var removeOneFromLargestPile = function(board) {
		var random_boolean = Math.random() >= 0.5;
		if (board.pileOne > 0 && board.pileTwo > 0) {
		  if (random_boolean) {
			board.pileOne = board.pileOne - 1;
			board.pileTwo = board.pileTwo + 1;
			return board;		  	
		  } else {
			board.pileTwo = board.pileTwo - 1;
			return board;					  	
		  }
		}	else	if (board.pileOne > 0) {
			board.pileOne = board.pileOne - 1;
			board.pileTwo = board.pileTwo + 1;
			return board;
		} else if (board.pileTwo > 0) {
			board.pileTwo = board.pileTwo - 1;
			return board;			
		} else {
			return board;
		}
	}
	*/
	var optimalColouring=function(board){
		var trueSum=0.0;
		var falseSum=0.0;
		for (var i = 0; i < 5; i++) {
			for (var j = 0; j < board[i].length; j++) {
				if(trueSum<falseSum){
					board[i][j]=true;
					trueSum+=(1/2)**i;
				}else{
					board[i][j]=false;
					falseSum+=(1/2)**i;
				}
			}
		}
		return board;
	}

	var optimalColoring=function(board){
		var trueSum=0.0;
		var falseSum=0.0;
		for (var i = 0; i < 5; i++) {
			for (var j = 0; j < board[i].length; j++) {
				if(trueSum<falseSum){
					board[i][j]=true;
					trueSum+=(1/2)**i;
				}else{
					board[i][j]=false;
					falseSum+=(1/2)**i;
				}
			}
		}
		if(Math.random()>0.5){
			for (var i = 0; i < 5; i++) {
				for (var j = 0; j < board[i].length; j++) {
					board[i][j]=!board[i][j];
				}
			}	
		}
		return board;
	}

	var optimalKill=function(board){
		if(board[0].length>0){
			return board[0][0];
		}
		var trueSum=0.0;
		var falseSum=0.0;
		for (var i = 0; i < 5; i++) {
			for (var j = 0; j < board[i].length; j++) {
				if(board[i][j]){
					trueSum+=(1/2)**i;
				}else{
					falseSum+=(1/2)**i;
				}
			}
		}
		//console.log(trueSum);
		//console.log(falseSum);
		return trueSum>falseSum;
	}

	var makeMove = function(board, killState) {
		if (killState) {
			return optimalKill(board);
		} else {
			return optimalColoring(board);
		}
	};

	return {
		makeMove : makeMove
	}
}