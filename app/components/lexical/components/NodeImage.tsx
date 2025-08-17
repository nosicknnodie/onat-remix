/* eslint-disable jsx-a11y/alt-text */
import { type ComponentProps, useState } from "react";
import { Loading } from "~/components/Loading";

interface INodeImageProps extends ComponentProps<"img"> {
  state?: "pending" | "error" | "success";
}

const NodeImage = (_props: INodeImageProps) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="w-full bg-gray-100 py-6 flex justify-center">
      <div className="w-full max-w-[640px] min-h-[50px] px-4 relative">
        {
          {
            pending: (
              <>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-2">
                  <span>업로드 중</span>
                  <Loading />
                </div>
              </>
            ),
            error: (
              <>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-2">
                  <div className="inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <span className="text-red-500 bg-white/70 px-2 py-1 rounded">업로드 실패</span>
                  </div>
                </div>
              </>
            ),
            success: (
              <>
                {!loaded && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-2">
                    <span>로딩 중</span>
                    <Loading />
                  </div>
                )}
                {/** biome-ignore lint/a11y/useAltText: off */}
                <img
                  {..._props}
                  loading="lazy"
                  onLoad={() => setLoaded(true)}
                  onError={() => setLoaded(true)}
                  className={`mx-auto h-auto object-contain rounded transition-opacity duration-300 ${
                    loaded ? "opacity-100" : "opacity-0"
                  }`}
                />
              </>
            ),
          }[_props.state ?? "success"]
        }
      </div>
    </div>
  );
};

export default NodeImage;
