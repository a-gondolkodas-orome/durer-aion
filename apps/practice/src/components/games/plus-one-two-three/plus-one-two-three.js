import React, { useState } from 'react';
import { strategyGameFactory } from '../strategy-game';
import { range } from 'lodash';

const GameBoard = ({board, ctx}) => {

    const clickNumber = (number) => {
        if (ctx.shouldPlayerMoveNext) {
            let newBoard = board + number;
            ctx.endPlayerTurn(getGameStateAfterMove(newBoard, ctx.playerIndex));
        }
    };

    return(
        <section className="p-2 shrink-0 grow basis-2/3">
            <p className='text-center text-[30px]'>Jelenlegi szám: {board}</p>
            <table className="m-2 border-collapse table-fixed w-full"><tbody>
                <tr>
                    {range(3).map(i => (
                        <td className={`text-center text-[20px] border-4 aspect-square ${ctx.shouldPlayerMoveNext && 'hover:bg-gray-400'}`}
                        key = {i}
                        onClick={() => clickNumber(i+1)}>
                        +{i+1}</td>
                    ))}
                </tr>
            </tbody></table>
        </section>
        );
};

const getGameStateAfterMove = (newBoard, moverIndex) => {
    let isGameEnd = false;
    let innerIndex = null;
    if (newBoard>40) {
        isGameEnd = true;
    }
    return { newBoard: newBoard, isGameEnd: isGameEnd, winnerIndex: 1-moverIndex };
};

const getGameStateAfterAiTurn = ({board, playerIndex}) => {
    let newBoard;
    if (board%4 !== 0) {
        newBoard = board + 4 - board % 4;
    } else {
        newBoard = board + Math.floor(Math.random()*3 + 1)
    }
    return (getGameStateAfterMove(newBoard, 1-playerIndex));
};

const rule = <>
A játék a nullával indul. A játékosok felváltva
mondhatnak (pozitív egész) számokat: a soron következő játékos mindig 1-gyel, 2-vel vagy 3-mal
nagyobb számot mondhat, mint amit az előző mondott. Az veszít, aki először nagyobbat mond
40-nél.
</>;

const Game = strategyGameFactory({
    rule: rule,
    title: '+1, +2, +3',
    GameBoard,
    G: {
        getPlayerStepDescription: () => 'Válaszd ki mennyivel szeretnéd növelni a számot.',
        generateNewBoard: () => 0,
        getGameStateAfterAiTurn
    }
});

export const PlusOneTwoThree = () => {
    const [board, setBoard] = useState(0);

    return <Game board={board} setBoard={setBoard}/>;
}