import type { CSSProperties } from 'react';

export const tourStyles = {
  popover: (base: CSSProperties) => ({
    ...base,
    backgroundColor: 'darkGreen', // Green background
    color: 'white',
    boxShadow: '0 0 1rem rgba(34, 197, 94, 0.3)',
  }),
  // maskWrapper: (base: CSSProperties) => ({
  //   ...base,
  //   color: '#22c55e',
  // }),
  badge: () => ({
    display: 'none',
  }),
  // controls: (base: CSSProperties) => ({
  //   ...base,
  //   color: 'white',
  // }),
  // close: (base: CSSProperties) => ({
  //   ...base,
  //   color: 'red',
  // }),
};
