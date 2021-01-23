//The game board handles all the dom interaction
//Drawing the board and listening for click events
var gameBoard = function(nim) {
    var n=nim;
    //store a reference to the container
    var container = document.querySelector('.game').querySelector('.board');

    var move = n.board();

    

    //create an image node
    var returnImg = function(num, source) {
        //create a new image
        var img = document.createElement("SPAN");
        /*//set the image source
        img.src = source;
        //add the class so we know wich one the user is hovering over
        //get a reference to the style object
        //if (lastTwo) s.opacity = '0.5';*/
        img.classList.add(num);
        img.classList.add('dot');
        img.classList.add(source?'redDot':'blueDot');
        var s = img.style
        return img;
    }


    var drawPile = function(num, source1, source2, array) {
        //create a document fragment once
        var frag = document.createDocumentFragment();
        //create all num images
        for (var i = 0; i < num; i = i + 1) {
			//var lastTwo = false; 
			//if (i + 2 < num) lastTwo = true;
            var img = returnImg(i + 1, true);
            if(array[i]){
                img = returnImg(i + 1, false);
            }

            frag.appendChild(img);
        }
        //return the fragment
        return frag;
    }

    /**/
    var hoverEvent = function() {
        var parent = this.parentElement;
        parent.classList[1];
        var num = parseInt(this.parentElement.querySelectorAll('img').length, 10);
        var rem = parseInt(this.classList[0], 10);
		/*if (num - (rem - 1) > 2) {
     	    info.innerHTML = 'Legfeljebb 2 ábrát választhatsz. ';						
		} else {
     	  if (parent.classList[1] === "pileOne") {
     	    info.innerHTML = 'Ha ezt választod, akkor ' + (num - (rem - 1)) +
               ' bábut változtatunk át házikóvá.';			
 		  } else {			
     	    info.innerHTML = 'Ha ezt választod, akkor ' + (num - (rem - 1)) +
               ' házikót veszünk el.';			
 		  }			
		}
        */  
    }
    

    var makeMove = function() {
    	if (n.status().isGameOn){
			if (document.querySelector('.whos').innerHTML === "Mi jövünk." && n.state()===true) {			
			  console.error('Túl gyorsan léptél, még mi jövünk.');
			} else if (n.state()===false) {
	            var pile =parseInt(this.parentElement.id[1]);
	            var matches = this.classList[0]-1;
	            //var num = parseInt(this.parentElement.querySelectorAll('img').length, 10);
	            //var rem = parseInt(this.classList[0], 10);
			    //var diff = num - (rem - 1);
			    //var numOfPileOne = document.getElementById("pileOne").querySelectorAll('img').length;
			    //var numOfPileTwo = document.getElementById("pileTwo").querySelectorAll('img').length;
	  		    move[pile][matches]=!move[pile][matches];
			    drawBoard(move);

	        }
    	}	

    }


    var step = function() {
    	if (n.status().isGameOn)
        if (document.querySelector('.whos').innerHTML === "Mi jövünk." && n.state()===true) {			
		  console.error('Túl gyorsan léptél, még mi jövünk.');
		} else if(!n.state()) pubSub.pub('PLAYER_MOVE', move);
    }
    document.getElementById("step").addEventListener("click", step);


    var killBlue = function() {
    	if (n.status().isGameOn)
    	if (document.querySelector('.whos').innerHTML === "Mi jövünk."  && n.state()===false) {			
		  console.error('Túl gyorsan léptél, még mi jövünk.');
		} else if(n.state()){
    		pubSub.pub('PLAYER_MOVE', true);
    	}
    }
    document.getElementById("blue").addEventListener("click", killBlue);
	


    var killRed = function() {
    	if (n.status().isGameOn)
    	if (document.querySelector('.whos').innerHTML === "Mi jövünk."  && n.state()===false) {			
		  console.error('Túl gyorsan léptél, még mi jövünk.');
		} else if(n.state()){
    		pubSub.pub('PLAYER_MOVE', false);
    	}
    }
	document.getElementById("red").addEventListener("click", killRed);
	

	var resetButton = function() {
        drawBoard(n.newBoard());
        document.querySelector('.move').innerHTML = '';
        document.querySelector('.whos').innerHTML = 'A gombra kattintva tudod elindítani a játékot.';
    	document.getElementById("startTrue").style.display = 'block';
		document.getElementById("startFalse").style.display = 'block';
		document.getElementById("reset").style.display = 'none';
	
        document.getElementById("step").style.display = 'none';
		document.getElementById("red").style.display = 'none';
		document.getElementById("blue").style.display = 'none';
    }
	document.getElementById("reset").addEventListener("click", resetButton);
	


    var appendEventsToBoard = function() {
        var imgs = container.getElementsByTagName('span');
        for (var i = imgs.length - 1; i >= 0; i--) {
            imgs[i].onmouseover = hoverEvent;
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
        move=board;
        //loop through the board
        for (var i in board) {
            if (board.hasOwnProperty(i) && typeof i !== 'undefined') {
                //get images
				var frag;
				var serverPrefix = '/wp-includes/js/janicsar/';
			    //var serverPrefix = '';
                
                frag = drawPile(board[i].length, serverPrefix + 'red_circle.png', serverPrefix + 'blue_circle.png', board[i]);
                //append images to the pile
                emptyPile(container.querySelector('#r' + i));
			    container.querySelector('#r' + i).appendChild(frag);
            }
        }
        appendEventsToBoard();
    };

    return {
        drawBoard: drawBoard,
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
        document.querySelector('.whos').innerHTML = n.status().player;
        if(document.querySelector('.whos').innerHTML === "Mi jövünk.")document.querySelector('.move').innerHTML = '';
        else document.querySelector('.move').innerHTML = n.state()? 'Válaszd ki, hogy ma a piros vagy kék hadtestet semmisíted meg.' : 'Kattints  a korongokra és válaszd két részre a seregedet.';
        
        if(!n.status().isGameOn) {
            document.querySelector('.move').innerHTML = '';
            document.getElementById("step").style.display = 'none';
			document.getElementById("red").style.display = 'none';
			document.getElementById("blue").style.display = 'none';

			document.getElementById("startTrue").style.display = 'none';
			document.getElementById("startFalse").style.display = 'none';

			document.getElementById("reset").style.display = 'block';
			//var time = Math.floor(Math.random() * 1500 + 1500);
        	//setTimeout(reset, time);
            //document.querySelector('.gameActionButton').style.display = '';

        }
		n.isBeginningOfGame = false;
    }

    var aiMove = function() {
        //var aiMove =  n.board();//ai.makeMove(n.board(), n.isBeginningOfGame);
        if(n.status().isGameOn){
        	board.drawBoard(n.move(ai.makeMove(n.board(),n.state())));
	        checkGame();
    	}
    }

    var start = function() {
       document.querySelector('.game').style.display = 'block';
       document.querySelector('.whos').innerHTML = n.status().player;
    	   board.drawBoard(n.board());
    }

    var reset = function(player) {
        n.reset(player);
        n.isBeginningOfGame = true;
        //document.querySelector('.whos').innerHTML = 'Te jössz.';

        //document.querySelector('.gameActionButton').style.display = 'none';


		document.getElementById("startTrue").style.display = 'none';
		document.getElementById("startFalse").style.display = 'none';

		document.getElementById("reset").style.display = 'block';
         

		document.getElementById("step").style.display = player?'none':'block';

		document.getElementById("red").style.display = (!player)?'none':'block';
		document.getElementById("blue").style.display = (!player)?'none':'block';

        start();
        checkGame();
        if(player){
        	aiMove();
        }
    }

    board.drawBoard(n.board());

    return {
    	reset : reset,
    	start : start
    }

})();
window.game = game;

