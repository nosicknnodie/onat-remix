import { describe, it, expect, vi, beforeEach } from "vitest";
import type { LoaderFunctionArgs } from "@remix-run/node";

// Mock the matches feature server barrel to control loader behavior
vi.mock("~/features/matches/index.server", () => {
  return {
    team: {
      service: {
        getTeamPageData: vi.fn(),
      },
    },
  } as const;
});

// Import after mock so the route uses the mocked module
import { loader } from "~/routes/_public+/matches+/$id+/clubs+/$matchClubId+/team+/_index";
import { team as matches } from "~/features/matches/index.server";

describe("Team route loader", () => {
  const mockedGetTeamPageData = matches.service.getTeamPageData as unknown as ReturnType<
    typeof vi.fn
  >;

  beforeEach(() => {
    mockedGetTeamPageData.mockReset();
  });

  const makeArgs = (id = "match-1", matchClubId = "mc-1"): LoaderFunctionArgs => ({
    context: {},
    params: { id, matchClubId },
    request: new Request(`http://localhost/matches/${id}/clubs/${matchClubId}/team`),
  });

  it("redirects to base club page when service signals redirectTo", async () => {
    const id = "m1";
    const mc = "c1";
    const redirectTo = `/matches/${id}/clubs/${mc}`;
    mockedGetTeamPageData.mockResolvedValueOnce({ redirectTo });

    const res = (await loader(makeArgs(id, mc))) as Response;

    expect(res instanceof Response).toBe(true);
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe(redirectTo);
  });

  it("returns teams and attendances when allowed (isSelf)", async () => {
    const payload = { teams: [{ id: "t1", name: "Team A" }], attendances: [] } as any;
    mockedGetTeamPageData.mockResolvedValueOnce(payload);

    const data = (await loader(makeArgs())) as any;
    expect(data).toEqual(payload);
  });
});

