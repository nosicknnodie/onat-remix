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
  "4-3-3": ["GK", "LB", "LCB", "RCB", "RB", "LCM", "CM", "RCM", "LW", "CF", "RW"],
  "4-4-2": ["GK", "LB", "LCB", "RCB", "RB", "LM", "LCM", "RCM", "RM", "LS", "RS"],
  "4-2-3-1": ["GK", "LB", "LCB", "RCB", "RB", "LDM", "RDM", "LAM", "CAM", "RAM", "ST"],
  "4-1-4-1": ["GK", "LB", "LCB", "RCB", "RB", "DM", "LM", "LCM", "RCM", "RM", "ST"],
  "3-4-3": ["GK", "LCB", "SW", "RCB", "LM", "LCM", "RCM", "RM", "LW", "CF", "RW"],
  "3-5-2": ["GK", "LCB", "SW", "RCB", "LM", "LCM", "CM", "RCM", "RM", "LS", "RS"],
  "5-3-2": ["GK", "LB", "LCB", "SW", "RCB", "RB", "LCM", "CM", "RCM", "LS", "RS"],
  "4-5-1": ["GK", "LB", "LCB", "RCB", "RB", "LM", "LCM", "CM", "RCM", "RM", "ST"],
  "5-4-1": ["GK", "LB", "LCB", "SW", "RCB", "RB", "LM", "LCM", "RCM", "RM", "ST"],
};

export const PORMATION_POSITION_CLASSNAME: { [key in POSITION_TYPE]: { className: string } } = {
  LS: {
    className: "md:left-[75%] md:top-[33.4%] max-md:left-[33.4%] max-md:top-[25%]",
  },
  ST: {
    className: "md:left-[75%] md:top-[50%] max-md:left-[50%] max-md:top-[25%]",
  },
  RS: {
    className: "md:left-[75%] md:top-[66.6%] max-md:left-[66.6%] max-md:top-[25%]",
  },
  LW: {
    className: "md:left-[65%] md:top-[16.6%] max-md:left-[16.6%] max-md:top-[35%]",
  },
  LF: {
    className: "md:left-[65%] md:top-[33.4%] max-md:left-[33.4%] max-md:top-[35%]",
  },
  CF: {
    className: "md:left-[65%] md:top-[50%] max-md:left-[50%] max-md:top-[35%]",
  },
  RF: {
    className: "md:left-[65%] md:top-[66.6%] max-md:left-[66.6%] max-md:top-[35%]",
  },
  RW: {
    className: "md:left-[65%] md:top-[83.4%] max-md:left-[83.4%] max-md:top-[35%]",
  },
  LAM: {
    className: "md:left-[55%] md:top-[33.4%] max-md:left-[33.4%] max-md:top-[45%]",
  },
  CAM: {
    className: "md:left-[55%] md:top-[50%] max-md:left-[50%] max-md:top-[45%]",
  },
  RAM: {
    className: "md:left-[55%] md:top-[66.6%] max-md:left-[66.6%] max-md:top-[45%]",
  },
  LM: {
    className: "md:left-[45%] md:top-[16.6%] max-md:left-[16.6%] max-md:top-[55%]",
  },
  LCM: {
    className: "md:left-[45%] md:top-[33.4%] max-md:left-[33.4%] max-md:top-[55%]",
  },
  CM: {
    className: "md:left-[45%] md:top-[50%] max-md:left-[50%] max-md:top-[55%]",
  },
  RCM: {
    className: "md:left-[45%] md:top-[66.6%] max-md:left-[66.6%] max-md:top-[55%]",
  },
  RM: {
    className: "md:left-[45%] md:top-[83.4%] max-md:left-[83.4%] max-md:top-[55%]",
  },
  LWB: {
    className: "md:left-[35%] md:top-[16.6%] max-md:left-[16.6%] max-md:top-[65%]",
  },
  LDM: {
    className: "md:left-[35%] md:top-[33.4%] max-md:left-[33.4%] max-md:top-[65%]",
  },
  DM: {
    className: "md:left-[35%] md:top-[50%] max-md:left-[50%] max-md:top-[65%]",
  },
  RDM: {
    className: "md:left-[35%] md:top-[66.6%] max-md:left-[66.6%] max-md:top-[65%]",
  },
  RWB: {
    className: "md:left-[35%] md:top-[83.4%] max-md:left-[83.4%] max-md:top-[65%]",
  },
  LB: {
    className: "md:left-[25%] md:top-[20%] max-md:left-[20%] max-md:top-[75%]",
  },
  LCB: {
    className: "md:left-[25%] md:top-[35%] max-md:left-[35%] max-md:top-[75%]",
  },
  SW: {
    className: "md:left-[20%] md:top-[50%] max-md:left-[50%] max-md:top-[80%]",
  },
  RCB: {
    className: "md:left-[25%] md:top-[65%] max-md:left-[65%] max-md:top-[75%]",
  },
  RB: {
    className: "md:left-[25%] md:top-[80%] max-md:left-[80%] max-md:top-[75%]",
  },
  GK: {
    className: "md:left-[10%] md:top-[50%] max-md:left-[50%] max-md:top-[90%]",
  },
};
