import type { ComponentProps } from "react";
import { Map as Kmap } from "react-kakao-maps-sdk";
import { cn } from "~/libs";

interface IKakaoMapProps extends ComponentProps<typeof Kmap> {}
const KakaoMap = ({ className, id: _id, ...props }: IKakaoMapProps) => {
  return (
    <>
      <Kmap id={"kakaoMap"} className={cn("w-full h-full", className)} {...props}></Kmap>
    </>
  );
};

export default KakaoMap;
