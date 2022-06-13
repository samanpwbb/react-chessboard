import React, { useMemo, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { useSpring, config, animated } from 'react-spring';

import { useChessboard } from '../context/chessboard-context';

function getSquareCoordinates(squares, sourceSquare, targetSquare) {
  return {
    sourceSq: squares[sourceSquare],
    targetSq: squares[targetSquare]
  };
}

export function Piece({ piece, square, squares, isPremovedPiece = false }) {
  const {
    arePiecesDraggable,
    arePremovesAllowed,
    boardWidth,
    id,
    isDraggablePiece,
    onPieceClick,
    onPieceDragBegin,
    onPieceDragEnd,
    premoves,
    chessPieces,
    dropTarget,
    positionDifferences,
    endTransition,
    currentPosition
  } = useChessboard();

  const [{ canDrag, isDragging }, drag, dragPreview] = useDrag(
    () => ({
      type: 'piece',
      item: () => {
        onPieceDragBegin(piece, square);
        return { piece, square, id };
      },
      end: () => onPieceDragEnd(piece, square),
      collect: (monitor) => ({
        canDrag: isDraggablePiece({ piece, sourceSquare: square }),
        isDragging: !!monitor.isDragging()
      })
    }),
    [piece, square, currentPosition, id]
  );

  // hide the default preview
  useEffect(() => {
    dragPreview(getEmptyImage(), { captureDraggingState: true });
  }, []);

  // hide piece on matching premoves
  const isPremoved = useMemo(() => {
    // if premoves aren't allowed, don't waste time on calculations
    if (!arePremovesAllowed) return false;

    // side effect: if piece moves into pre-moved square, its hidden
    // if there are any premove targets on this square, hide the piece underneath
    if (!isPremovedPiece && premoves.find((p) => p.targetSq === square)) return true;

    // if sourceSq === sq and piece matches then this piece has been pre-moved elsewhere?
    if (premoves.find((p) => p.sourceSq === square && p.piece === piece)) return true;

    // TODO: If a premoved piece returns to a premoved square, it will hide (e1, e2, e1)
    return false;
  }, [arePremovesAllowed, isPremovedPiece, premoves]);

  // new move has come in
  // if waiting for animation, then animation has started and we can perform animation
  // we need to head towards where we need to go, we are the source, we are heading towards the target
  const { transform, zIndex } = useMemo(() => {
    const defaults = {
      zIndex: 5,
      transform: 'translate(0px, 0px)'
    };

    const removedPiece = positionDifferences.removed?.[square];
    // return as null and not loaded yet
    if (!positionDifferences.added) return defaults;

    // check if piece matches or if removed piece was a pawn and new square is on 1st or 8th rank (promotion)
    const newSquare = Object.entries(positionDifferences.added).find(
      ([s, p]) => p === removedPiece || (removedPiece?.[1] === 'P' && (s[1] === '1' || s[1] === '8'))
    );
    // we can perform animation if our square was in removed, AND the matching piece is in added AND this isn't a premoved piece
    if (removedPiece && newSquare && !isPremovedPiece) {
      const { sourceSq, targetSq } = getSquareCoordinates(squares, square, newSquare[0]);
      if (sourceSq && targetSq) {
        return {
          transform: `translate(${targetSq.x - sourceSq.x}px, ${targetSq.y - sourceSq.y}px)`,
          zIndex: 6
        };
      }
    }

    return defaults;
  }, [positionDifferences]);

  const style = {
    zIndex,
    touchAction: 'none',
    opacity: isDragging ? 0 : 1,
    display: isPremoved ? 'none' : 'unset',
    cursor: arePiecesDraggable && isDraggablePiece({ piece, sourceSquare: square }) ? '-webkit-grab' : 'default'
  };

  const props = useSpring({
    transform,
    config: config.wobbly,
    onRest: () => {
      console.log('end');
      endTransition();
    }
  });

  return (
    <animated.div
      ref={arePiecesDraggable ? (canDrag ? drag : null) : null}
      onClick={() => onPieceClick(piece)}
      style={{ transform: props.transform }}
    >
      {typeof chessPieces[piece] === 'function' ? (
        chessPieces[piece]({
          squareWidth: boardWidth / 8,
          isDragging,
          droppedPiece: dropTarget?.piece,
          targetSquare: dropTarget?.target,
          sourceSquare: dropTarget?.source
        })
      ) : (
        <svg viewBox={'1 1 43 43'} width={boardWidth / 8} height={boardWidth / 8}>
          <g>{chessPieces[piece]}</g>
        </svg>
      )}
    </animated.div>
  );
}
