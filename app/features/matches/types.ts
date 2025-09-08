import type { Prisma } from "@prisma/client";

export type MatchWithClub = Prisma.MatchGetPayload<{
  include: {
    matchClubs: {
      include: {
        club: {
          include: {
            image: true;
            emblem: true;
          };
        };
      };
    };
  };
}>;

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
