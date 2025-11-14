import type { Prisma } from "@prisma/client";

export type RecordGoalRelations = Prisma.GoalGetPayload<{
  include: {
    assigned: {
      include: {
        attendance: {
          include: {
            player: { include: { user: { include: { userImage: true } } } };
            mercenary: { include: { user: { include: { userImage: true } } } };
          };
        };
      };
    };
    assistAssigned: {
      include: {
        attendance: {
          include: {
            player: { include: { user: { include: { userImage: true } } } };
            mercenary: { include: { user: { include: { userImage: true } } } };
          };
        };
      };
    };
    team: true;
  };
}>;

export type RecordQuarter = Prisma.QuarterGetPayload<{
  include: {
    team1: true;
    team2: true;
    goals: {
      include: {
        assigned: {
          include: {
            attendance: {
              include: {
                player: { include: { user: { include: { userImage: true } } } };
                mercenary: { include: { user: { include: { userImage: true } } } };
              };
            };
          };
        };
        assistAssigned: {
          include: {
            attendance: {
              include: {
                player: { include: { user: { include: { userImage: true } } } };
                mercenary: { include: { user: { include: { userImage: true } } } };
              };
            };
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
