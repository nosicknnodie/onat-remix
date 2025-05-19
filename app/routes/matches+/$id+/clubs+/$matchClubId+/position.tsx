import { Link } from "@remix-run/react";
import { Button } from "~/components/ui/button";

interface IPositionPageProps {}

const PositionPage = (_props: IPositionPageProps) => {
  // TODO: 실제 데이터를 props나 loader로 받아올 수 있게 연결할 것
  const teams = [
    { id: "team-a", name: "A 팀" },
    { id: "team-b", name: "B 팀" },
  ];

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-lg font-semibold">1쿼터 스쿼드</h2>
        <div className="mt-2 text-muted-foreground">
          {/* TODO: 1쿼터의 스쿼드 정보를 여기에 표시 */}
          스쿼드 데이터가 여기에 표시됩니다.
        </div>
      </section>

      <section>
        <h3 className="text-base font-medium">팀별 포지션 스쿼드</h3>
        <ul className="space-y-2 mt-2">
          {teams.map((team) => (
            <li key={team.id} className="flex items-center justify-between border p-4 rounded-md">
              <span>{team.name}</span>
              <Link to={`position/${team.id}`}>
                <Button>포지션 배치</Button>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default PositionPage;
