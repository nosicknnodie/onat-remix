import type { Prisma } from "@prisma/client";
import type { RecordSchema } from "./record.schema";

export type RecordGoalRelations = Prisma.RecordGetPayload<{
  include: {
    attendance: {
      include: {
        player: { include: { user: { include: { userImage: true } } } };
        mercenary: { include: { user: { include: { userImage: true } } } };
      };
    };
    assistAttendance: {
      include: {
        player: { include: { user: { include: { userImage: true } } } };
        mercenary: { include: { user: { include: { userImage: true } } } };
      };
    };
    team: true;
  };
}>;

export type RecordQuarter = Prisma.QuarterGetPayload<{
  include: {
    team1: true;
    team2: true;
    records: {
      include: {
        attendance: {
          include: {
            player: { include: { user: { include: { userImage: true } } } };
            mercenary: { include: { user: { include: { userImage: true } } } };
          };
        };
        assistAttendance: {
          include: {
            player: { include: { user: { include: { userImage: true } } } };
            mercenary: { include: { user: { include: { userImage: true } } } };
          };
        };
        team: true;
      };
    };
  };
}>;

export type RecordPageResponse = {
  quarters: RecordQuarter[];
};

export type RecordGoalRequest = RecordSchema;
