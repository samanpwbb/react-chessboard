import React, { useState, useRef } from 'react';

import { Piece } from './Piece';
import { Square } from './Square';
import { Squares } from './Squares';
import { useChessboard } from '../context/chessboard-context';
import { WhiteKing } from './ErrorBoundary';

export function Board() {
  const boardRef = useRef();
  const [squares, setSquares] = useState({});

  const { boardWidth, currentPosition } = useChessboard();

  return boardWidth ? (
    <div ref={boardRef} style={{ position: 'relative' }}>
      <Squares>
        {({ square, squareColor, col, row }) => {
          return (
            <Square key={`${col}${row}`} square={square} squareColor={squareColor} setSquares={setSquares}>
              {currentPosition[square] && <Piece piece={currentPosition[square]} square={square} squares={squares} />}
            </Square>
          );
        }}
      </Squares>
    </div>
  ) : (
    <WhiteKing />
  );
}
