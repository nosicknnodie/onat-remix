/* eslint-disable jsx-a11y/no-static-element-interactions */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: off */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import type React from "react";
import StarIcon from "./StarIcon";

interface IProps {
  id: string;
  score?: number;
  width?: number;
  onClick?: (e: React.MouseEvent<HTMLSpanElement, MouseEvent>, score: number) => void;
  isHighLight?: boolean;
  [key: string]: unknown;
}
const StarRating = ({ id, score, onClick, width, isHighLight, ...props }: IProps) => {
  const getPer = (score: number, sort: number) => {
    const r = score - sort * 20;
    const result = r >= 20 ? 100 : r <= 0 ? 0 : r * 5;
    return result;
  };
  return (
    <>
      <div className="flex">
        {[0, 1, 2, 3, 4].map((v) => (
          <span key={v} className="relative">
            {onClick && (
              <>
                {v === 0 && (
                  <span
                    className="absolute -left-1/2 top-0 h-full w-1/2 bg-transparent cursor-pointer"
                    onClick={(e) => onClick?.(e, 0)}
                  ></span>
                )}
                <span
                  className="absolute left-0 top-0 h-full w-1/2 bg-transparent cursor-pointer"
                  onClick={(e) => onClick?.(e, v * 20 + 10)}
                ></span>
                <span
                  className="absolute left-1/2 top-0 h-full w-1/2 bg-transparent cursor-pointer"
                  onClick={(e) => onClick?.(e, v * 20 + 20)}
                ></span>
              </>
            )}
            <StarIcon
              id={`${id}-${v}`}
              per={getPer(score ?? 0, v)}
              width={width ?? 16}
              fill={isHighLight ? "oklch(94.5% 0.129 101.54)" : "#DBA901"}
              {...props}
            />
          </span>
        ))}
      </div>
    </>
  );
};

export default StarRating;
