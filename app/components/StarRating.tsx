import React from "react";
import StarIcon from "./StarIcon";

interface IProps {
  id: string;
  score?: number;
  width?: number;
  onClick?: (
    e: React.MouseEvent<HTMLSpanElement, MouseEvent>,
    score: number
  ) => void;
  isHighLight?: boolean;
  [key: string]: any;
}
const StarRating = ({
  id,
  score,
  onClick,
  width,
  isHighLight,
  ...props
}: IProps) => {
  const getPer = (score: number, sort: number) => {
    const r = score - sort * 20;
    const result = r >= 20 ? 100 : r <= 0 ? 0 : r * 5;
    return result;
  };
  return (
    <>
      <div className="flex">
        {[0, 1, 2].map((v) => (
          <span key={v} className="relative">
            {v === 0 && (
              <span
                className="absolute -left-1/2 top-0 h-full w-1/2 bg-transparent cursor-pointer"
                onClick={(e) => onClick && onClick(e, 0)}
              ></span>
            )}
            <span
              className="absolute left-0 top-0 h-full w-1/2 bg-transparent cursor-pointer"
              onClick={(e) => onClick && onClick(e, v * 20 + 10)}
            ></span>
            <span
              className="absolute left-1/2 top-0 h-full w-1/2 bg-transparent cursor-pointer"
              onClick={(e) => onClick && onClick(e, v * 20 + 20)}
            ></span>
            <StarIcon
              id={`${id}-${v}`}
              per={getPer(score ?? 0, v)}
              width={width ?? 16}
              fill={isHighLight ? "#ECBA12" : "#DBA901"}
              {...props}
            />
          </span>
        ))}
      </div>
    </>
  );
};

export default StarRating;
