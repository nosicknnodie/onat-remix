export type PORMATION_TYPE =
  | "4-3-3"
  | "4-4-2"
  | "4-2-3-1"
  | "4-1-4-1"
  | "3-4-3"
  | "3-5-2"
  | "5-3-2"
  | "5-4-1"
  | "4-5-1";
export type POSITION_TYPE =
  | "GK"
  | "LB"
  | "LCB"
  | "RCB"
  | "RB"
  | "LM"
  | "LCM"
  | "RCM"
  | "RM"
  | "LW"
  | "CF"
  | "RW"
  | "ST"
  | "LDM"
  | "RDM"
  | "LAM"
  | "CAM"
  | "RAM"
  | "LS"
  | "RS"
  | "LF"
  | "RF"
  | "CF"
  | "CM"
  | "LWB"
  | "DM"
  | "RWB"
  | "SW";

export const POSITION_TEMPLATE_LIST = [
  "4-3-3",
  "4-4-2",
  "4-2-3-1",
  "4-1-4-1",
  "3-4-3",
  "3-5-2",
  "5-3-2",
  "5-4-1",
];
export const PORMATION_POSITIONS: Record<PORMATION_TYPE, POSITION_TYPE[]> = {
  "4-3-3": ["GK", "LB", "LCB", "RCB", "RB", "LAM", "CM", "RAM", "LW", "CF", "RW"],
  "4-4-2": ["GK", "LB", "LCB", "RCB", "RB", "LM", "LCM", "RCM", "RM", "LS", "RS"],
  "4-2-3-1": ["GK", "LB", "LCB", "RCB", "RB", "LDM", "RDM", "LAM", "CAM", "RAM", "ST"],
  "4-1-4-1": ["GK", "LB", "LCB", "RCB", "RB", "DM", "LM", "LCM", "RCM", "RM", "ST"],
  "3-4-3": ["GK", "LCB", "SW", "RCB", "LM", "LCM", "RCM", "RM", "LW", "CF", "RW"],
  "3-5-2": ["GK", "LCB", "SW", "RCB", "LM", "LCM", "CM", "RCM", "RM", "LS", "RS"],
  "5-3-2": ["GK", "LB", "LCB", "SW", "RCB", "RB", "LCM", "CM", "RCM", "LS", "RS"],
  "4-5-1": ["GK", "LB", "LCB", "RCB", "RB", "LM", "LCM", "CM", "RCM", "RM", "ST"],
  "5-4-1": ["GK", "LB", "LCB", "SW", "RCB", "RB", "LM", "LCM", "RCM", "RM", "ST"],
};

export const PORMATION_POSITION_CLASSNAME: Record<
  POSITION_TYPE,
  { className: string; team1ClassName?: string; team2ClassName?: string }
> = {
  LS: {
    className: "md:left-[75%] md:top-[33.4%] max-md:left-[33.4%] max-md:top-[25%]",
    team1ClassName: "md:left-[47%] md:top-[33.4%] max-md:left-[33.4%] max-md:top-[53%]",
    team2ClassName: "md:left-[53%] md:top-[66.6%] max-md:left-[66.6%] max-md:top-[47%]",
  },
  ST: {
    className: "md:left-[75%] md:top-[50%] max-md:left-[50%] max-md:top-[25%]",
    team1ClassName: "md:left-[47%] md:top-[50%] max-md:left-[50%] max-md:top-[53%]",
    team2ClassName: "md:left-[53%] md:top-[50%] max-md:left-[50%] max-md:top-[47%]",
  },
  RS: {
    className: "md:left-[75%] md:top-[66.6%] max-md:left-[66.6%] max-md:top-[25%]",
    team1ClassName: "md:left-[47%] md:top-[66.6%] max-md:left-[66.6%] max-md:top-[53%]",
    team2ClassName: "md:left-[53%] md:top-[33.4%] max-md:left-[33.4%] max-md:top-[47%]",
  },
  LW: {
    className: "md:left-[65%] md:top-[16.6%] max-md:left-[16.6%] max-md:top-[35%]",
    team1ClassName: "md:left-[42%] md:top-[16.6%] max-md:left-[16.6%] max-md:top-[58%]",
    team2ClassName: "md:left-[58%] md:top-[83.3%] max-md:left-[83.3%] max-md:top-[42%]",
  },
  LF: {
    className: "md:left-[65%] md:top-[33.4%] max-md:left-[33.4%] max-md:top-[35%]",
    team1ClassName: "md:left-[42%] md:top-[33.4%] max-md:left-[33.4%] max-md:top-[58%]",
    team2ClassName: "md:left-[58%] md:top-[66.6%] max-md:left-[66.6%] max-md:top-[42%]",
  },
  CF: {
    className: "md:left-[65%] md:top-[50%] max-md:left-[50%] max-md:top-[35%]",
    team1ClassName: "md:left-[42%] md:top-[50%] max-md:left-[50%] max-md:top-[58%]",
    team2ClassName: "md:left-[58%] md:top-[50%] max-md:left-[50%] max-md:top-[42%]",
  },
  RF: {
    className: "md:left-[65%] md:top-[66.6%] max-md:left-[66.6%] max-md:top-[35%]",
    team1ClassName: "md:left-[42%] md:top-[66.6%] max-md:left-[66.6%] max-md:top-[58%]",
    team2ClassName: "md:left-[58%] md:top-[33.4%] max-md:left-[33.4%] max-md:top-[42%]",
  },
  RW: {
    className: "md:left-[65%] md:top-[83.4%] max-md:left-[83.4%] max-md:top-[35%]",
    team1ClassName: "md:left-[42%] md:top-[83.4%] max-md:left-[83.4%] max-md:top-[58%]",
    team2ClassName: "md:left-[58%] md:top-[16.6%] max-md:left-[16.6%] max-md:top-[42%]",
  },
  LAM: {
    className: "md:left-[55%] md:top-[33.4%] max-md:left-[33.4%] max-md:top-[45%]",
    team1ClassName: "md:left-[37%] md:top-[33.4%] max-md:left-[33.4%] max-md:top-[63%]",
    team2ClassName: "md:left-[63%] md:top-[66.6%] max-md:left-[66.6%] max-md:top-[37%]",
  },
  CAM: {
    className: "md:left-[50%] md:top-[50%] max-md:left-[50%] max-md:top-[50%]",
    team1ClassName: "md:left-[35%] md:top-[50%] max-md:left-[50%] max-md:top-[65%]",
    team2ClassName: "md:left-[65%] md:top-[50%] max-md:left-[50%] max-md:top-[35%]",
  },
  RAM: {
    className: "md:left-[55%] md:top-[66.6%] max-md:left-[66.6%] max-md:top-[45%]",
    team1ClassName: "md:left-[37%] md:top-[66.6%] max-md:left-[66.6%] max-md:top-[63%]",
    team2ClassName: "md:left-[63%] md:top-[33.4%] max-md:left-[33.4%] max-md:top-[37%]",
  },
  LM: {
    className: "md:left-[45%] md:top-[20%] max-md:left-[20%] max-md:top-[55%]",
    team1ClassName: "md:left-[32%] md:top-[20%] max-md:left-[20%] max-md:top-[68%]",
    team2ClassName: "md:left-[68%] md:top-[80%] max-md:left-[80%] max-md:top-[32%]",
  },
  LCM: {
    className: "md:left-[45%] md:top-[38%] max-md:left-[38%] max-md:top-[55%]",
    team1ClassName: "md:left-[32%] md:top-[38%] max-md:left-[38%] max-md:top-[68%]",
    team2ClassName: "md:left-[68%] md:top-[62%] max-md:left-[62%] max-md:top-[32%]",
  },
  RCM: {
    className: "md:left-[45%] md:top-[62%] max-md:left-[62%] max-md:top-[55%]",
    team1ClassName: "md:left-[32%] md:top-[62%] max-md:left-[62%] max-md:top-[68%]",
    team2ClassName: "md:left-[68%] md:top-[38%] max-md:left-[38%] max-md:top-[32%]",
  },
  CM: {
    className: "md:left-[40%] md:top-[50%] max-md:left-[50%] max-md:top-[60%]",
    team1ClassName: "md:left-[30%] md:top-[50%] max-md:left-[50%] max-md:top-[70%]",
    team2ClassName: "md:left-[70%] md:top-[50%] max-md:left-[50%] max-md:top-[30%]",
  },
  RM: {
    className: "md:left-[45%] md:top-[80%] max-md:left-[80%] max-md:top-[55%]",
    team1ClassName: "md:left-[32%] md:top-[80%] max-md:left-[80%] max-md:top-[68%]",
    team2ClassName: "md:left-[68%] md:top-[20%] max-md:left-[20%] max-md:top-[32%]",
  },
  LWB: {
    className: "md:left-[35%] md:top-[20%] max-md:left-[16.6%] max-md:top-[65%]",
    team1ClassName: "md:left-[27%] md:top-[20%] max-md:left-[20%] max-md:top-[73%]",
    team2ClassName: "md:left-[73%] md:top-[80%] max-md:left-[80%] max-md:top-[27%]",
  },
  LDM: {
    className: "md:left-[35%] md:top-[38%] max-md:left-[33.4%] max-md:top-[65%]",
    team1ClassName: "md:left-[27%] md:top-[38%] max-md:left-[38%] max-md:top-[73%]",
    team2ClassName: "md:left-[73%] md:top-[62%] max-md:left-[62%] max-md:top-[27%]",
  },
  DM: {
    className: "md:left-[30%] md:top-[50%] max-md:left-[50%] max-md:top-[70%]",
    team1ClassName: "md:left-[25%] md:top-[50%] max-md:left-[50%] max-md:top-[75%]",
    team2ClassName: "md:left-[75%] md:top-[50%] max-md:left-[50%] max-md:top-[25%]",
  },
  RDM: {
    className: "md:left-[35%] md:top-[62%] max-md:left-[66.6%] max-md:top-[65%]",
    team1ClassName: "md:left-[27%] md:top-[62%] max-md:left-[62%] max-md:top-[73%]",
    team2ClassName: "md:left-[73%] md:top-[38%] max-md:left-[38%] max-md:top-[27%]",
  },
  RWB: {
    className: "md:left-[35%] md:top-[80%] max-md:left-[83.4%] max-md:top-[65%]",
    team1ClassName: "md:left-[27%] md:top-[80%] max-md:left-[80%] max-md:top-[73%]",
    team2ClassName: "md:left-[73%] md:top-[20%] max-md:left-[20%] max-md:top-[27%]",
  },
  LB: {
    className: "md:left-[25%] md:top-[20%] max-md:left-[20%] max-md:top-[75%]",
    team1ClassName: "md:left-[22%] md:top-[20%] max-md:left-[20%] max-md:top-[78%]",
    team2ClassName: "md:left-[78%] md:top-[80%] max-md:left-[80%] max-md:top-[22%]",
  },
  LCB: {
    className: "md:left-[25%] md:top-[38%] max-md:left-[35%] max-md:top-[75%]",
    team1ClassName: "md:left-[22%] md:top-[38%] max-md:left-[38%] max-md:top-[78%]",
    team2ClassName: "md:left-[78%] md:top-[62%] max-md:left-[62%] max-md:top-[22%]",
  },
  SW: {
    className: "md:left-[20%] md:top-[50%] max-md:left-[50%] max-md:top-[80%]",
    team1ClassName: "md:left-[20%] md:top-[50%] max-md:left-[50%] max-md:top-[80%]",
    team2ClassName: "md:left-[80%] md:top-[50%] max-md:left-[50%] max-md:top-[20%]",
  },
  RCB: {
    className: "md:left-[25%] md:top-[62%] max-md:left-[65%] max-md:top-[75%]",
    team1ClassName: "md:left-[22%] md:top-[62%] max-md:left-[62%] max-md:top-[78%]",
    team2ClassName: "md:left-[78%] md:top-[38%] max-md:left-[38%] max-md:top-[22%]",
  },
  RB: {
    className: "md:left-[25%] md:top-[80%] max-md:left-[80%] max-md:top-[75%]",
    team1ClassName: "md:left-[22%] md:top-[80%] max-md:left-[80%] max-md:top-[78%]",
    team2ClassName: "md:left-[78%] md:top-[20%] max-md:left-[20%] max-md:top-[22%]",
  },
  GK: {
    className: "md:left-[10%] md:top-[50%] max-md:left-[50%] max-md:top-[90%]",
    team1ClassName: "md:left-[5%] md:top-[50%] max-md:left-[50%] max-md:top-[95%]",
    team2ClassName: "md:left-[95%] md:top-[50%] max-md:left-[50%] max-md:top-[5%]",
  },
};

const attackPositions: POSITION_TYPE[] = ["LS", "ST", "RS", "LW", "LF", "CF", "RF", "RW"];
const middlePositions: POSITION_TYPE[] = [
  "LAM",
  "RAM",
  "CAM",
  "LM",
  "LCM",
  "RCM",
  "RM",
  "CM",
  "LDM",
  "RDM",
  "DM",
];
const defensePositions: POSITION_TYPE[] = ["LB", "LCB", "SW", "RCB", "RB", "LWB", "RWB"];

const leftPositions: POSITION_TYPE[] = [
  "LB",
  "LCB",
  "LDM",
  "LWB",
  "LM",
  "LCM",
  "LAM",
  "LW",
  "LF",
  "LS",
];

const centerPostions: POSITION_TYPE[] = ["CF", "ST", "CM", "CAM", "DM", "SW"];
const rightPositions: POSITION_TYPE[] = [
  "RB",
  "RCB",
  "RDM",
  "RWB",
  "RM",
  "RCM",
  "RAM",
  "RW",
  "RF",
  "RS",
];

export const isAttackPosition = (position: POSITION_TYPE) => {
  return attackPositions.includes(position);
};
export const isMiddlePosition = (position: POSITION_TYPE) => {
  return middlePositions.includes(position);
};
export const isDefensePosition = (position: POSITION_TYPE) => {
  return defensePositions.includes(position);
};

export const isLeftPosition = (position: POSITION_TYPE) => {
  return leftPositions.includes(position);
};
export const isCenterPosition = (position: POSITION_TYPE) => {
  return centerPostions.includes(position);
};
export const isRightPosition = (position: POSITION_TYPE) => {
  return rightPositions.includes(position);
};

export const isDiffPosition = (beferPosition: POSITION_TYPE, afterPosition: POSITION_TYPE) => {
  return (
    (isAttackPosition(beferPosition) && isAttackPosition(afterPosition)) ||
    (isMiddlePosition(afterPosition) && isMiddlePosition(beferPosition)) ||
    (isDefensePosition(afterPosition) && isDefensePosition(beferPosition))
  );
};

export const isRLDiffPostion = (beferPosition: POSITION_TYPE, afterPosition: POSITION_TYPE) => {
  return (
    (isLeftPosition(beferPosition) && isLeftPosition(afterPosition)) ||
    (isRightPosition(beferPosition) && isRightPosition(afterPosition)) ||
    (isCenterPosition(beferPosition) && isCenterPosition(afterPosition))
  );
};
