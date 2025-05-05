import { Loading } from "~/components/Loading";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { useSession } from "~/contexts/AuthUserContext";
import { cn } from "~/libs/utils";

export default function Index() {
  const user = useSession();
  if (!user)
    return (
      <>
        <main
          className={cn(
            "mx-auto w-full max-w-screen-lg p-1 md:p-2 2xl:p-3 flex justify-center items-center "
          )}
        >
          {user === undefined ? (
            <>
              <Loading />
            </>
          ) : (
            "로그인이 필요합니다."
          )}
        </main>
      </>
    );
  return (
    <>
      <main
        className={cn(
          "mx-auto w-full max-w-screen-lg p-1 md:p-2 2xl:p-3 flex justify-center items-start "
        )}
      >
        <Card className="mx-auto w-full">
          <CardHeader className="flex flex-row items-center gap-4">
            <img
              src={user.userImage?.url ?? "/images/user_empty.png"}
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover"
            />
            <div>
              <CardTitle>{user.name ?? "이름 없음"}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm text-gray-700">
            <div className="flex gap-1">
              <span className="font-medium">포지션:</span>
              <span>{user.position1 ?? "없음"}</span>
              <span>{user.position2 ?? "없음"}</span>
              <span>{user.position3 ?? "없음"}</span>
            </div>
            <div>
              <span className="font-medium">지역:</span> {user.si ?? ""}{" "}
              {user.gun ?? ""}
            </div>
            <div>
              <span className="font-medium">성별:</span>{" "}
              {
                {
                  MALE: "남자",
                  FEMALE: "여자",
                  NO: "선택 안함",
                }[user.gender ?? "NO"]
              }
            </div>
            <div>
              <span className="font-medium">키:</span>{" "}
              {user.height ? `${user.height} cm` : "미입력"}
            </div>
            <div>
              <span className="font-medium">생년월일:</span>{" "}
              {user.birth
                ? new Date(user.birth).toLocaleDateString("ko-KR")
                : "미입력"}
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
