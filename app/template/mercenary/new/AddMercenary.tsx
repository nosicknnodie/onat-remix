import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import Position from "~/template/Position";
import { useNewMercenaryContext } from "~/template/mercenary/new/hook";
interface IAddMercenaryProps {}

const AddMercenary = (_props: IAddMercenaryProps) => {
  const context = useNewMercenaryContext();
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>용병 추가</CardTitle>
          <CardDescription>회원이메일로 검색 혹은 임의의 용병추가</CardDescription>
        </CardHeader>
        <CardContent>
          <Input type="hidden" name="userId" value={context?.userId || undefined}></Input>
          <Input type="hidden" name="actionType" value="name"></Input>
          <div className="space-y-2">
            <Label htmlFor="name" className="after:content-['*'] after:text-red-500 after:ml-1">
              용병 이름
            </Label>
            <Input
              type="text"
              id="name"
              name="name"
              placeholder="이름"
              value={context?.name}
              onChange={(e) => context?.setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hp">전화번호</Label>
            <Input type="text" id="hp" name="hp" placeholder="전화번호" />
          </div>
          <div>
            <Input type="hidden" name="position1" value={context?.positions?.at(0)} />
            <Input type="hidden" name="position2" value={context?.positions?.at(1)} />
            <Input type="hidden" name="position3" value={context?.positions?.at(2)} />
            <Position
              value={context?.positions}
              onValueChange={(v) => context?.setPositions(v ?? [])}
            />
          </div>
          <Button type="submit" className="w-full">
            저장
          </Button>
        </CardContent>
      </Card>
    </>
  );
};

export default AddMercenary;
