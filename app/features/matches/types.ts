import type { Prisma } from "@prisma/client";

const baseClubInclude = {
  club: {
    include: {
      image: true,
      emblem: true,
    },
  },
} satisfies Prisma.MatchClubInclude;

export const matchSummaryRelations = {
  club: {
    include: {
      image: true,
      emblem: true,
    },
  },
  teams: true,
  attendances: {
    include: {
      evaluations: true,
      assigneds: {
        include: {
          goals: true,
        },
      },
      player: {
        include: {
          user: {
            include: {
              userImage: true,
            },
          },
        },
      },
      mercenary: {
        include: {
          user: {
            include: {
              userImage: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.MatchClubInclude;

export type MatchClubWithSummaryRelations = Prisma.MatchClubGetPayload<{
  include: typeof matchSummaryRelations;
}>;

export type MatchWithSummary = Prisma.MatchGetPayload<{
  include: {
    matchClubs: {
      include: typeof matchSummaryRelations;
    };
  };
}>;

export type MatchWithClub = Prisma.MatchGetPayload<{
  include: {
    matchClubs: {
      include: typeof baseClubInclude;
    };
  };
}>;

export type MatchClubSummary = {
  matchClubId: string;
  club: {
    name: string;
    emblemUrl?: string | null;
  };
  goals: {
    scored: number;
    conceded: number;
    ownCommitted: number;
    ownReceived: number;
  };
  attendance: {
    total: number;
    voted: number;
    checkedIn: number;
  };
  mom?: {
    attendanceId: string;
    name: string;
    imageUrl?: string | null;
    memberType: "PLAYER" | "MERCENARY";
    scoreAverage: number | null;
    likeCount: number;
    goalCount: number;
  };
};

export type CreateMatchDTO = {
  clubId: string;
  title: string;
  description: string;
  stDate: Date;
  placeName?: string;
  address?: string;
  lat?: number | null;
  lng?: number | null;
  isSelf: boolean;
  createUserId: string;
};

export type UpdateMatchDTO = {
  title: string;
  description: string;
  stDate: Date;
  placeName?: string;
  address?: string;
  lat?: number | null;
  lng?: number | null;
  createUserId: string;
};
