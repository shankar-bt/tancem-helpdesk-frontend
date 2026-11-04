import type { SxProps, Theme } from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';

export type PinDirection = 'left' | 'right' | 'none';

export interface ColumnPinConfig {
  id: string;
  label: string;
  defaultPin?: PinDirection;
  width?: number; // approximate px width used for sticky offsets
}

export function useColumnPinning(
  tableKey: string,
  columnConfigs: ColumnPinConfig[]
) {
  const storageKey = `tancem_pinned_cols_${tableKey}`;

  // Initialize from localStorage or defaults
  const [pins, setPins] = useState<Record<string, PinDirection>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    const initial: Record<string, PinDirection> = {};
    for (const col of columnConfigs) {
      initial[col.id] = col.defaultPin || 'none';
    }
    return initial;
  });

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(pins));
    } catch {
      // ignore
    }
  }, [pins, storageKey]);

  const setPin = useCallback((columnId: string, direction: PinDirection) => {
    setPins((prev) => ({
      ...prev,
      [columnId]: direction,
    }));
  }, []);

  const resetPins = useCallback(() => {
    const initial: Record<string, PinDirection> = {};
    for (const col of columnConfigs) {
      initial[col.id] = col.defaultPin || 'none';
    }
    setPins(initial);
  }, [columnConfigs]);

  // Compute sticky offsets and borders
  const { leftOffsets, rightOffsets, lastLeftColId, firstRightColId } = useMemo(() => {
    const leftOffsetsMap: Record<string, number> = {};
    const rightOffsetsMap: Record<string, number> = {};

    let currentLeft = 0;
    let lastLeft = '';
    for (const col of columnConfigs) {
      if (pins[col.id] === 'left') {
        leftOffsetsMap[col.id] = currentLeft;
        currentLeft += col.width || 120;
        lastLeft = col.id;
      }
    }

    let currentRight = 0;
    let firstRight = '';
    // Reverse loop for right pinned columns
    for (let i = columnConfigs.length - 1; i >= 0; i--) {
      const col = columnConfigs[i];
      if (pins[col.id] === 'right') {
        rightOffsetsMap[col.id] = currentRight;
        currentRight += col.width || 120;
        firstRight = col.id;
      }
    }

    return {
      leftOffsets: leftOffsetsMap,
      rightOffsets: rightOffsetsMap,
      lastLeftColId: lastLeft,
      firstRightColId: firstRight,
    };
  }, [columnConfigs, pins]);

  const getStickyStyles = useCallback(
    (columnId: string, isHeader = false): SxProps<Theme> => {
      const dir = pins[columnId] || 'none';
      if (dir === 'none') {
        return {};
      }

      const isLeft = dir === 'left';
      const isRight = dir === 'right';

      return {
        position: 'sticky',
        ...(isLeft ? { left: leftOffsets[columnId] ?? 0 } : {}),
        ...(isRight ? { right: rightOffsets[columnId] ?? 0 } : {}),
        zIndex: isHeader ? (isLeft || isRight ? 4 : 3) : 2,
        bgcolor: isHeader ? '#f8fafc' : 'background.paper',
        ...(isLeft && columnId === lastLeftColId
          ? {
              boxShadow: '3px 0 6px -2px rgba(0,0,0,0.06)',
              borderRight: '1px solid #e2e8f0',
            }
          : {}),
        ...(isRight && columnId === firstRightColId
          ? {
              boxShadow: '-3px 0 6px -2px rgba(0,0,0,0.06)',
              borderLeft: '1px solid #e2e8f0',
            }
          : {}),
        transition: 'background-color 150ms ease',
      };
    },
    [pins, leftOffsets, rightOffsets, lastLeftColId, firstRightColId]
  );

  const isPinned = useCallback(
    (columnId: string) => (pins[columnId] || 'none') !== 'none',
    [pins]
  );

  const getPinDirection = useCallback(
    (columnId: string): PinDirection => pins[columnId] || 'none',
    [pins]
  );

  return {
    pins,
    setPin,
    resetPins,
    getStickyStyles,
    isPinned,
    getPinDirection,
  };
}
