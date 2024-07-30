import React, { useState } from 'react';
import { strategyGameFactory } from '../strategy-game';
import { range } from 'lodash';

const GameBoard = ({board, ctx}) => {

    const clickNumber = (number) => {
        if (ctx.shouldPlayerMoveNext) {
            let nextBoard = board + number;
            ctx.endPlayerTurn(getGameStateAfterMove(nextBoard, ctx.playerIndex));
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

const getGameStateAfterMove = (nextBoard, moverIndex) => {
    let isGameEnd = false;
    let innerIndex = null;
    if (nextBoard>40) {
        isGameEnd = true;
    }
    return { nextBoard: nextBoard, isGameEnd: isGameEnd, winnerIndex: 1-moverIndex };
};

const getGameStateAfterAiTurn = ({board, playerIndex}) => {
    let nextBoard;
    if (board%4 !== 0) {
        nextBoard = board + 4 - board % 4;
    } else {
        nextBoard = board + Math.floor(Math.random()*3 + 1)
    }
    return (getGameStateAfterMove(nextBoard, 1-playerIndex));
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
        generateStartBoard: () => 0,
        getGameStateAfterAiTurn
    }
});

export const PlusOneTwoThree = () => {
    const [board, setBoard] = useState(0);

    return <Game board={board} setBoard={setBoard}/>;
}
