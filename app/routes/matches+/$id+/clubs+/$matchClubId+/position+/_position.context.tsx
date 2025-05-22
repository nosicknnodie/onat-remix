import React from "react";

export const PositionContext = React.createContext({ currentQuarterOrder: 1 });

export function usePositionContext() {
  return React.useContext(PositionContext);
}
