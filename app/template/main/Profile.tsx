import { useContext } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { PROFILES_URL } from "~/libs/const";
import { ProfileContext } from "./Profile.context";

interface IProfileProps {}

const Profile = (_props: IProfileProps) => {
  const profile = useContext(ProfileContext);
  return (
    <>
      <Card className="w-full min-w-[768px]">
        <CardContent className="p-6 flex justify-between">
          <div className="flex flex-col gap-4 w-full mr-4">
            <div className="flex justify-start gap-x-2">
              <span className="rounded-md bg-secondary-foreground text-secondary px-2 py-0.5">
                {
                  {
                    NO: "비선출",
                    COLLEAGE: "대학선출",
                    PRO: "프로선출",
                    HIGH: "고등선출",
                    MIDDLE: "중등선출",
                  }[profile?.playerNative ?? "NO"]
                }
              </span>
              <span className="rounded-md bg-secondary-foreground text-secondary px-2 py-0.5">
                {[profile?.si, profile?.gun].join(" ")}
              </span>
            </div>
            <div>
              <div className="rounded-md flex space-x-2 h-5 items-center">
                <div className="font-semibold text-2xl text-primary">
                  {profile?.nick}
                </div>
                <Separator orientation="vertical" />
                <div className="">{profile?.name}</div>
              </div>
            </div>
            <Separator />
            <div className="space-x-2 flex justify-start">
              <span className="rounded-md bg-blue-50 px-2 py-0.5 text-blue-700">
                {profile?.position1}
              </span>
              <span className="rounded-md bg-red-50 px-2 py-0.5 text-red-700">
                {profile?.position2}
              </span>
              <span className="rounded-md bg-blue-50 px-2 py-0.5 text-blue-700">
                {profile?.position3}
              </span>
            </div>
          </div>
          <div className="w-32 h-28 rounded-full border overflow-hidden relative shadow">
            <img
              alt="프로필 사진"
              src={
                profile?.imageUrl
                  ? [PROFILES_URL, profile.imageUrl].join("/")
                  : "/images/user_84308.png"
              }
              sizes={"(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
              // priority={false}
              // fill
              className="w-full h-full"
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default Profile;
