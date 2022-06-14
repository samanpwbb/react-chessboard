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

export function Piece({ piece, square, squares }) {
  const {
    arePiecesDraggable,
    boardWidth,
    id,
    isDraggablePiece,
    onPieceClick,
    completeMove,
    onPieceDragBegin,
    onPieceDragEnd,
    chessPieces,
    dropTarget,
    positionDifferences,
    setTransitioning,
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
    const newSquare = Object.entries(positionDifferences.added).find(([s, p]) => {
      const isPromotion = removedPiece?.[1] === 'P' && (s[1] === '1' || s[1] === '8');
      return p === removedPiece || isPromotion;
    });

    // perform animation if the piece moved.
    if (newSquare) {
      const { sourceSq, targetSq } = getSquareCoordinates(squares, square, newSquare[0]);
      return {
        transform: `translate(${targetSq.x - sourceSq.x}px, ${targetSq.y - sourceSq.y}px)`,
        zIndex: 6
      };
    }

    return defaults;
  }, [positionDifferences, setTransitioning]);

  const style = {
    zIndex,
    touchAction: 'none',
    opacity: isDragging ? 0 : 1,
    cursor: arePiecesDraggable && isDraggablePiece({ piece, sourceSquare: square }) ? '-webkit-grab' : 'default'
  };

  const props = useSpring({
    transform,
    immediate: false,
    config: config.molasses,
    onRest: () => {
      completeMove(currentPosition);
    }
  });

  return (
    <animated.div
      ref={arePiecesDraggable ? (canDrag ? drag : null) : null}
      onClick={() => onPieceClick(piece)}
      style={{ ...style, transform: props.transform }}
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
