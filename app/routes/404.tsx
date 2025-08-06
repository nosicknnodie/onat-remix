import { Link } from "@remix-run/react";
import { Button } from "~/components/ui/button";

interface INotFoundPageProps {}

const NotFoundPage = (_props: INotFoundPageProps) => {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-white text-center text-gray-800 px-4 py-12">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-xl mb-6">페이지를 찾을 수 없습니다.</p>
      <div className="mt-4">
        <Button asChild>
          <Link to={"/"}>홈으로 돌아가기</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFoundPage;
