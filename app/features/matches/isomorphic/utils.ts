type Nullable<T> = T | null | undefined;

export type UserNameSource = {
  nick?: string | null;
  name?: string | null;
};

export type PlayerNameSource = {
  nick?: string | null;
  name?: string | null;
  user?: Nullable<UserNameSource>;
};

export type MercenaryNameSource = {
  nick?: string | null;
  name?: string | null;
  user?: Nullable<UserNameSource>;
};

export type AttendanceNameSource = {
  player?: Nullable<PlayerNameSource>;
  mercenary?: Nullable<MercenaryNameSource>;
};

const coalesceName = (...values: (string | null | undefined)[]) => {
  for (const value of values) {
    if (value) return value;
  }
  return "";
};

export const getPlayerDisplayName = (player?: Nullable<PlayerNameSource>) => {
  return coalesceName(player?.nick, player?.user?.nick, player?.user?.name, player?.name);
};

export const getMercenaryDisplayName = (mercenary?: Nullable<MercenaryNameSource>) => {
  return coalesceName(
    mercenary?.nick,
    mercenary?.user?.nick,
    mercenary?.user?.name,
    mercenary?.name,
  );
};

export const getAttendanceDisplayName = (attendance?: Nullable<AttendanceNameSource>) => {
  return coalesceName(
    getPlayerDisplayName(attendance?.player),
    getMercenaryDisplayName(attendance?.mercenary),
  );
};
