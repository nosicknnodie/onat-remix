import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export const EmailSearch = () => {
  return (
    <div className="space-y-2">
      <Input type="hidden" name="actionType" value="email"></Input>
      <Label htmlFor="email">이메일로 검색 (optional)</Label>
      <div className="flex justify-between gap-x-2">
        <Input type="email" name="email" placeholder="youremail@example.com" />
        <Button type="submit">검색</Button>
      </div>
    </div>
  );
};
