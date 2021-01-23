'use strict';
var nimAi = function() {
	/*
	var getXOR = function(board) {
		return board.pileOne ^ board.pileTwo;
	}

	var getRemainder = function(board) {
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






	var findOptimalDivision = function(sum, start) {
		if (sum <= 1) { console.error("sum<=1"); }
		if (sum == 2) {
			var move = [];
			move[start] = 1;
			move[(start + 1) % 2] = 1;
			return move;
		}
		var startPile = 1 + 2 * Math.ceil(Math.random() * Math.floor((sum - 2) / 2));

		var move = [];
		move[start] = startPile;
		move[(start + 1) % 2] = sum - startPile;
		return move;
	}




	var makeMove = function(board) {
		var start = Math.floor(Math.random() * 2);

		if (board[start] == 1) return findOptimalDivision(board[(start + 1) % 2], (start + 1) % 2);
		else if (board[(start + 1) % 2] == 1) return findOptimalDivision(board[start], start);
		else if (board[start] % 2 == 0) return findOptimalDivision(board[start], start);
		else return findOptimalDivision(board[(start + 1) % 2], (start + 1) % 2);

	};

	return {
		makeMove: makeMove
	}
}