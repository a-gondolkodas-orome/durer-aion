import React, { useState } from 'react';
import { strategyGameFactory } from '../strategy-game';
import { range, sum } from 'lodash';

const GameBoard = ({ board, ctx }) => {

    const clickNumber = (number) => {
        if (ctx.shouldPlayerMoveNext) {
            let nextBoard = [...board];
            nextBoard[number-1] = -1;
            ctx.endPlayerTurn(getGameStateAfterMove(nextBoard));
        }
    };


    return(
    <section className="p-2 shrink-0 grow basis-2/3">
        <table className="m-2 border-collapse table-fixed w-full"><tbody>
            <tr>
                {range(board.length).map(i => (
                    board[i]!==-1 ?
                    <td className={`text-center border-4 aspect-square ${ctx.shouldPlayerMoveNext && 'hover:bg-gray-400 focus:bg-gray-400'}`}
                    key = {i}
                    onClick={() => clickNumber(i+1)}>
                    {board[i]}</td> :
                    <td className='text-center border-4 bg-gray-600'
                    key = {i}>X</td>
                ))}
            </tr>
        </tbody></table>
        Megmaradt számok összege: {sum(board.filter(i => i > 0))}
    </section>
    );
};

const getGameStateAfterMove = (nextBoard) => {
    let remaining = nextBoard.filter(i => i>0);
    let isGameEnd = false;
    let winnerIndex = null;
    if (remaining.length === 2) {
        isGameEnd = true;
        winnerIndex = (remaining[0]+remaining[1])%2;
    }
    return { nextBoard: nextBoard, isGameEnd: isGameEnd, winnerIndex: winnerIndex };
};

const getGameStateAfterAiTurn = ({ board, playerIndex }) => {
    let nextBoard = [...board];
    const notCovered = nextBoard.filter(i => i!==-1);
    const evens = nextBoard.filter(i => i%2===0);
    const odds = nextBoard.filter(i => i%2===1 && i!==-1);
    if (evens.length===odds.length || evens.length === 0 || odds.length === 0) {
        nextBoard[notCovered[Math.floor(Math.random() * (notCovered.length))]-1] = -1;
    } else {
        if (playerIndex===0){
            let ch = Math.floor(Math.random() * (evens.length>odds.length ? evens.length : odds.length));
            nextBoard[(evens.length>odds.length ? evens : odds)[ch]-1] = -1;
        } else {
            let ch = Math.floor(Math.random() * (evens.length<odds.length ? evens.length : odds.length));
            nextBoard[(evens.length<odds.length ? evens : odds)[ch]-1] = -1;
        }
    }

    return (getGameStateAfterMove(nextBoard));
};

const rule8 = <>
Egy táblázatban 1-től 8-ig szerepelnek a számok. Két játékos felváltva takar le egy-egy
számot addig, amíg csak két szám marad. Ha a megmaradt két szám összege páros, akkor a kezdő
nyer, ha pedig páratlan, akkor a második.
</>;

const rule10 = <>
Egy táblázatban 1-től 10-ig szerepelnek a számok. Két játékos felválva takar le egy-egy
számot addig, amíg csak két szám marad. Ha a megmaradt két szám összege páros, akkor a kezdő
nyer, ha pedig páratlan, akkor a második.
</>;

const Game8 = strategyGameFactory({
    rule: rule8,
    title: 'Számok lefedés 1-től 8-ig',
    GameBoard,
    G: {
        getPlayerStepDescription: () => 'Kattints egy számra, hogy lefedd',
        generateStartBoard: () => [1,2,3,4,5,6,7,8],
        getGameStateAfterAiTurn
    }
});

const Game10 = strategyGameFactory({
    rule: rule10,
    title: 'Számok lefedés 1-től 10-ig',
    GameBoard,
    G: {
        getPlayerStepDescription: () => 'Kattints egy számra, hogy lefedd',
        generateStartBoard: () => [1,2,3,4,5,6,7,8,9,10],
        getGameStateAfterAiTurn
    }
});

export const NumberCovering8 = () => {
    const [board, setBoard] = useState([1,2,3,4,5,6,7,8]);

    return <Game8 board={board} setBoard={setBoard} />;
};

export const NumberCovering10 = () => {
    const [board, setBoard] = useState([1,2,3,4,5,6,7,8,9,10]);

    return <Game10 board={board} setBoard={setBoard} />;
};
