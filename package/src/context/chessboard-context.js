import React, { useMemo, useCallback, forwardRef, useContext, useEffect, useState } from 'react';

import { defaultPieces } from '../media/pieces';
import { convertPositionToObject, getPositionDifferences } from '../functions';

// add other things from chessground
// change board orientation to 'w' or 'b'? like used in chess.js?

// keep onSquareClick, but add onPieceClick to send both square and piece
// this is because in the current ClickToMove example, if blacks turn to move, you can click on a White piece and then on a black piece thats out of reach, and it will try to make the move and then reset firstClick

// try DisplayBoard again

export const ChessboardContext = React.createContext();

export const useChessboard = () => useContext(ChessboardContext);

export const ChessboardProvider = forwardRef(
  (
    {
      arePiecesDraggable,
      boardOrientation,
      boardWidth,
      customBoardStyle,
      customDarkSquareStyle,
      customDropSquareStyle,
      customLightSquareStyle,
      customPieces,
      customSquareStyles,
      dropOffBoardAction,
      id,
      isDraggablePiece,
      getPositionObject,
      onDragOverSquare,
      onMouseOutSquare,
      onMouseOverSquare,
      onPieceClick,
      onPieceDragBegin,
      onPieceDragEnd,
      onPieceDrop,
      onMoveComplete,
      onSquareClick,
      position,
      showSparePieces,
      snapToCursor,
      children
    },
    ref
  ) => {
    // position stored and displayed on board
    const [currentPosition, setCurrentPosition] = useState(convertPositionToObject(position));

    // calculated differences between current and incoming positions
    const [positionDifferences, setPositionDifferences] = useState({});

    // chess pieces/styling
    const chessPieces = useMemo(() => ({ ...defaultPieces, ...customPieces }), [defaultPieces, customPieces]);

    // whether the last move was a manual drop or not
    const [manualDrop, setManualDrop] = useState(false);

    // if currently waiting for an animation to finish
    const [transitioning, setTransitioning] = useState(false);

    const completeMove = useCallback(
      (position) => {
        // End the transition if there was one.
        setTransitioning(false);

        // Get new position
        let newPosition = position;
        if (typeof position === 'string') {
          newPosition = convertPositionToObject(position);
        }

        // Callback function to let consumer react to the end of a move.
        onMoveComplete();

        // Apply new position.
        setCurrentPosition(newPosition);
      },
      [position, currentPosition]
    );

    // handle external position change
    useEffect(() => {
      const newPosition = convertPositionToObject(position);
      const differences = getPositionDifferences(currentPosition, newPosition);

      // external move has come in before animation is over
      // or move was made using drag and drop
      if (transitioning || manualDrop) {
        completeMove(position);
      } else {
        // move was made by external position change

        // prepare to animate external move by saving differences to state, but not
        // yet updating position.
        setTransitioning(true);
        setPositionDifferences(differences);
      }

      // reset manual drop, ready for next move to be made by user or external
      setManualDrop(false);

      // inform latest position information
      getPositionObject(newPosition);
    }, [position]);

    // handle drop position change
    function handleSetPosition(sourceSq, targetSq, piece) {
      // if dropped back down, don't do anything
      if (sourceSq === targetSq) {
        return;
      }

      // if transitioning, don't allow new drop
      if (transitioning) return;

      const newOnDropPosition = { ...currentPosition };

      setManualDrop(true);

      // if onPieceDrop function provided, execute it, position must be updated externally and captured by useEffect above for this move to show on board
      if (onPieceDrop.length) {
        const success = onPieceDrop(sourceSq, targetSq, piece);
        if (success) {
          onMoveComplete();
        }
      } else {
        // add piece in new position
        newOnDropPosition[targetSq] = piece;

        // Update board state
        completeMove(newOnDropPosition);
      }

      // inform latest position information
      getPositionObject(newOnDropPosition);
    }

    return (
      <ChessboardContext.Provider
        value={{
          arePiecesDraggable,
          boardOrientation,
          boardWidth,
          customBoardStyle,
          customDarkSquareStyle,
          customDropSquareStyle,
          customLightSquareStyle,
          customSquareStyles,
          dropOffBoardAction,
          id,
          isDraggablePiece,
          getPositionObject,
          onDragOverSquare,
          onMouseOutSquare,
          onMouseOverSquare,
          onPieceClick,
          onPieceDragBegin,
          onPieceDragEnd,
          onPieceDrop,
          onSquareClick,
          showSparePieces,
          snapToCursor,

          chessPieces,
          currentPosition,
          handleSetPosition,
          manualDrop,
          positionDifferences,
          setCurrentPosition,
          setManualDrop,

          completeMove
        }}
      >
        {children}
      </ChessboardContext.Provider>
    );
  }
);
