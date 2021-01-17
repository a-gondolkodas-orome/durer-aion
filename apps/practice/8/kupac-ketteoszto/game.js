//The game board handles all the dom interaction
//Drawing the board and listening for click events
var gameBoard = function(nim) {
    var n=nim;
    //store a reference to the container
    var container = document.querySelector('.game').querySelector('.board');

    var info = document.querySelector('.move');

    var move = n.board();

    

    //create an image node
    var returnImg = function(num) {
        //create a new image
        var img = document.createElement("SPAN");
        /*//set the image source
        img.src = source;
        //add the class so we know wich one the user is hovering over
        //get a reference to the style object
        //if (lastTwo) s.opacity = '0.5';*/
        img.classList.add(num);
        img.classList.add('blueDot');
        var s = img.style
        //s.width = '10%';
        s.padding = '5px';
        return img;
    }


    var drawPile = function(num) {
        //create a document fragment once
        var frag = document.createDocumentFragment();
        //create all num images
        for (var i = 0; i < num; i = i + 1) {
			//var lastTwo = false; 
			//if (i + 2 < num) lastTwo = true;
            var img = returnImg(i + 1, true);

            frag.appendChild(img);
        }
        //return the fragment
        return frag;
    }

    /**/
    var hoverEvent = function() {
        var parent = this.parentElement;
        parent.classList[1];
        var num = parseInt(this.parentElement.querySelectorAll('span').length, 10);
        var matches = parseInt(this.classList[0], 10)-1;
        if(matches!=0 && n.status().isGameOn)    
            for (var i = this.parentElement.children.length - 1; i >= 0; i--) {
                if(parseInt(this.parentElement.children[i].classList[0],10)-1>=matches){
                    this.parentElement.children[i].style.opacity='0.5';
                }
            }
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
    /**/
    
    var hoverOutEvent = function() {
        var parent = this.parentElement;
        parent.classList[1];
        var num = parseInt(this.parentElement.querySelectorAll('span').length, 10);
        var matches = parseInt(this.classList[0], 10)-1;
        if(matches!=0)    
            for (var i = this.parentElement.children.length - 1; i >= 0; i--) {
                if(parseInt(this.parentElement.children[i].classList[0],10)-1>=matches){
                    this.parentElement.children[i].style.opacity='1';
                }
            }
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
			if (document.querySelector('.whos').innerHTML === "Mi jövünk.") {			
			  console.error('Túl gyorsan léptél, még mi jövünk.');
			} else {
	            var pile =parseInt(this.parentElement.id[1]);
                var matches = parseInt(this.classList[0], 10)-1;
	            var num = parseInt(this.parentElement.querySelectorAll('span').length, 10);
	            var rem = parseInt(this.classList[0], 10);
			    var diff = num - (rem - 1);
			    var numOfPileOne = document.getElementById("r0").querySelectorAll('span').length;
			    var numOfPileTwo = document.getElementById("r1").querySelectorAll('span').length;
	            
                if(move[pile]<=1 || rem-1<1 || diff<1){
                    console.error('Nincs elég/nem marad elég korong a sorban, hogy kettéoszd.');
                } else{
    	  		    move[pile]=rem-1;
                    move[(pile+1)%2]=diff;

    			    drawBoard(move);
                    pubSub.pub('PLAYER_MOVE', move);
                }
	        }
    	}	

    }

	

	var resetButton = function() {
    	drawBoard(n.newBoard());
    	document.getElementById("startTrue").style.display = 'block';
		document.getElementById("startFalse").style.display = 'block';
		document.getElementById("reset").style.display = 'none';
	
    }
	document.getElementById("reset").addEventListener("click", resetButton);
	


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
        move=board;
        //loop through the board
        for (var i in board) {
            if (board.hasOwnProperty(i) && typeof i !== 'undefined') {
                //get images
				var frag;
			    //var serverPrefix = '';
                
                frag = drawPile(board[i]);
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
        else document.querySelector('.move').innerHTML = 'Kattints egy korongra, hogy azzal kettéosztd azt a kupacot. Amelyik korongra kattintasz, az és a tőle jobbra lévők kerülnek az új kupacba.';
        
        if(!n.status().isGameOn) {
            document.querySelector('.move').innerHTML = '';
            
			document.getElementById("startTrue").style.display = 'none';
			document.getElementById("startFalse").style.display = 'none';

			document.getElementById("reset").style.display = 'block';
			//var time = Math.floor(Math.random() * 1500 + 1500);
        	//setTimeout(reset, time);
            //document.querySelector('.repeat').style.display = '';

        }
    }

    var aiMove = function() {
        //var aiMove =  n.board();//ai.makeMove(n.board(), n.isBeginningOfGame);
        if(n.status().isGameOn){
        	board.drawBoard(n.move(ai.makeMove(n.board())));
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
        //document.querySelector('.whos').innerHTML = 'Te jössz.';
    
        //document.querySelector('.repeat').style.display = 'none';


		document.getElementById("startTrue").style.display = 'none';
		document.getElementById("startFalse").style.display = 'none';

		document.getElementById("reset").style.display = 'block';
         
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

