import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

interface IImageManagerProps {}

const ImageManager = (_props: IImageManagerProps) => {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>이미지 관리</CardTitle>
        </CardHeader>
        <CardContent>
          <div>이미지 뷰</div>
          <div>이미지리스트</div>
        </CardContent>
      </Card>
    </>
  );
};

export default ImageManager;
