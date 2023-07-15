import React, { useState } from 'react';
import { strategyGameFactory } from '../strategy-game';
import { range, isEqual } from 'lodash';

const generateNewBoard = () => {
    const blue = Math.floor(Math.random()*11);
    const red = Math.floor(Math.random()*(11-blue));
    return [blue, red];
};

const GameBoard  = ({ board, setBoard, ctx }) => {
    const [hovered, setHovered] = useState(null);

    const select = (a, i) => {
        if (ctx.shouldPlayerMoveNext) {
            let newBoard = [...board];
            let d = newBoard[a]-i;
            newBoard[a] = i;
            if(a===1) newBoard[0]+=d;
            ctx.endPlayerTurn(getGameStateAfterMove(newBoard));
        }
    };

    return (
        <section className="p-2 shrink-0 grow basis-2/3">
        <table className="m-2 border-collapse table-fixed w-full"><tbody>
        <tr>
            {range(Math.max(10, board[1])).map(i => (
                board[1]>i+2 ?
                    <td className='text-center aspect-square'
                        key = {i}>
                    <button
                        className="aspect-square w-full p-[5%]"
                        disabled={true}
                    >
                    <span
                        key={i}
                        className={`
                        w-[100%] aspect-square inline-block rounded-full mr-0.5 bg-red-800
                        `}>
                    </span></button></td>
                : <>{board[1]>i ?
                    <td className='text-center aspect-square'
                        key = {i}
                        onClick = {() => select(1, i)}>
                    <button
                        className="aspect-square w-full p-[5%]"
                        disabled={!ctx.shouldPlayerMoveNext}
                        onMouseOver={() => setHovered([1, i])}
                        onMouseOut={() => setHovered(null)}
                        onFocus={() => setHovered([1, i])}
                        onBlur={() => setHovered(null)}
                    >
                    <span
                        key={i}
                        className={`
                        w-[100%] aspect-square inline-block rounded-full mr-0.5 bg-red-800
                        ${(ctx.shouldPlayerMoveNext && (isEqual(hovered,[1,i]) || isEqual(hovered, [1, i-1]))) ? 'opacity-50' : ''}
                        `}>
                    </span></button></td>
                        :<td className='text-center aspect-square' key={i}><button className="aspect-square w-full p-[5%]" disabled={true}></button></td>
                    }</>
            ))}
        </tr>
        <tr>
            {range(Math.max(board[0])).map(i => (
                board[0]>i+2 ?
                    <td className='text-center aspect-square'
                        key = {i}>
                    <button
                        className="aspect-square w-full p-[5%]"
                        disabled={true}
                    >
                    <span
                        key={i}
                        className={`
                        w-[100%] aspect-square inline-block rounded-full mr-0.5 bg-blue-800
                        `}>
                    </span></button></td>
                : <>{board[0]>i ?
                    <td className='text-center aspect-square'
                        key = {i}
                        onClick = {() => select(0, i)}>
                    <button
                        className="aspect-square w-full p-[5%]"
                        disabled={!ctx.shouldPlayerMoveNext}
                        onMouseOver={() => setHovered([0, i])}
                        onMouseOut={() => setHovered(null)}
                        onFocus={() => setHovered([0, i])}
                        onBlur={() => setHovered(null)}
                    >
                    <span
                        key={i}
                        className={`
                        w-[100%] aspect-square inline-block rounded-full mr-0.5 bg-blue-800
                        ${(ctx.shouldPlayerMoveNext && (isEqual(hovered,[0,i]) || isEqual(hovered, [0, i-1]))) ? 'opacity-50' : ''}
                        `}>
                    </span></button></td>
                        :<td className='text-center aspect-square' key={i}><button className="aspect-square w-full p-[5%]" disabled={true}></button></td>
                    }</>
            ))}
            </tr>
        </tbody></table>
    </section>
    );

};

const getGameStateAfterAiTurn = ({ board, playerIndex }) => {
    let newBoard = [...board];
    let rem = newBoard[0]%3;
    if(rem===0) {
        let alt = Math.floor(Math.random()*2);
        if(newBoard[alt]===0) alt = 1-alt;
        let amount = Math.floor(Math.random()*(newBoard[alt]>1 ? 2 : 1)+1);
        if(alt===0) newBoard[0] = newBoard[0]-amount;
        else newBoard = [newBoard[0]+amount, newBoard[1]-amount];
    } else {
        if(newBoard[1]>=(3-rem) && Math.random()<0.5) newBoard = [newBoard[0]+(3-rem), newBoard[1]-(3-rem)];
        else newBoard = [newBoard[0]-rem, newBoard[1]];
    }
    return(getGameStateAfterMove(newBoard));
};

const getGameStateAfterMove = (newBoard) => {

    return { newBoard: newBoard, isGameEnd: isEqual(newBoard,[0,0]), winnerIndex: null };
};

const getPlayerStepDescription = () => {
    return "Kattints, hogy eltávolíts egy vagy két korongot egy színből";
};

const rule = <>
A játék kezdetén a szervezők néhány, de legfeljebb 10 korongot letesznek az asztalra,
mindegyiket a piros vagy a kék felével felfelé. A soron következő játékos összesen négyfélét
léphet:<br/>
• 1 vagy 2 kék korongot elvehet az asztalról.<br/>
• 1 vagy 2 piros korongot átfordíthat kékké.<br/>
Aki már nem tud lépni, az elveszíti a játékot
</>;

const Game = strategyGameFactory({
    rule,
    title: '10 korong',
    GameBoard,
    G: {
        getPlayerStepDescription,
        generateNewBoard,
        getGameStateAfterAiTurn
    }
});

export const TenDiscs = () => {
    const [board, setBoard] = useState(generateNewBoard());

    return <Game board={board} setBoard={setBoard} />;
};
