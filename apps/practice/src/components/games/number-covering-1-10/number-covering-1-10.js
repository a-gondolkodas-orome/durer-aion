import React, { useState } from 'react';
import { strategyGameFactory } from '../strategy-game';

const generateNewBoard = () => ([1,2,3,4,5,6,7,8,9,10]);

const GameBoard = ({ board, setBoard, ctx }) => {

    const clickNumber = (number) => {
        if (ctx.shouldPlayerMoveNext) {
            let newBoard = [...board];
            newBoard[number-1] = -1;
            ctx.endPlayerTurn(getGameStateAfterMove(newBoard));
        }
    };


    return(
        <section className="p-2 shrink-0 grow basis-2/3">
            <table className="m-2 border-collapse table-fixed w-full"><tbody>
                <tr>
                    {[1,2,3,4,5,6,7,8,9,10].map(i => (
                        board[i-1]!==-1 ?
                        <td className='text-center border-4 aspect-square'
                        key = {i}
                        onClick={() => clickNumber(i)}>
                        {board[i-1]}</td> :
                        <td className='text-center border-4 bg-blue-300'
                        key = {i}>X</td>
                    ))}
                </tr>
            </tbody></table>
        </section>
        );
};

const getGameStateAfterMove = (newBoard) => {
    let remaining = newBoard.filter(i => i>0);
    let isGameEnd = false;
    let winnerIndex = null;
    if (remaining.length === 2) {
        isGameEnd = true;
        winnerIndex = (remaining[0]+remaining[1])%2;
    }
    return { newBoard: newBoard, isGameEnd: isGameEnd, winnerIndex: winnerIndex };
};

const getPlayerStepDescription = () => {
    return "Kattints egy számra, hogy lefedd";
};

const getGameStateAfterAiTurn = ({ board, playerIndex }) => {
    let newBoard = [...board];
    const notCovered = newBoard.filter(i => i!==-1);
    const evens = newBoard.filter(i => i%2===0);
    const odds = newBoard.filter(i => i%2===1 && i!==-1);
    if (evens.length===odds.length || evens.length === 0 || odds.length === 0) {
        newBoard[notCovered[Math.floor(Math.random() * (notCovered.length))]-1] = -1;
    } else {
        if (playerIndex===0){
            let ch = Math.floor(Math.random() * (evens.length>odds.length ? evens.length : odds.length));
            newBoard[(evens.length>odds.length ? evens : odds)[ch]-1] = -1;
        } else {
            let ch = Math.floor(Math.random() * (evens.length<odds.length ? evens.length : odds.length));
            newBoard[(evens.length<odds.length ? evens : odds)[ch]-1] = -1;
        }
    }

    return (getGameStateAfterMove(newBoard));
};

const rule = <>
Egy táblázatban 1-től 10-ig szerepelnek a számok. Két játékos felválva takar le 1-1
számot addig, amíg csak 2 szám marad. Ha a megmaradt két szám összege páros, akkor a kezdő
nyer, ha pedig páratlan, akkor a második.
</>;

const Game = strategyGameFactory({
    rule,
    title: 'Számok lefedése',
    GameBoard,
    G: {
        getPlayerStepDescription,
        generateNewBoard,
        getGameStateAfterAiTurn
    }
});

export const NumberCovering10 = () => {
    const [board, setBoard] = useState(generateNewBoard());

    return <Game board={board} setBoard={setBoard} />;
};
