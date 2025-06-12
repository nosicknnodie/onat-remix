import clsx from "clsx";

interface IProps {
  id: string;
  width?: number;
  per: number;
  fill?: string;
  [prop: string]: any;
}
const StarIcon = ({ id, width, per, fill, className }: IProps) => {
  const svgWidth = width ?? 40;
  const svgHeight = svgWidth - 1;
  // const clipWidth = 10;
  // const svgWidth =
  const clipWidth = (14 * per) / 100;
  return (
    <span className={clsx("star_icon", className)}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 14 13`}
        fill="#cacaca"
      >
        <clipPath id={`star-clip-${id}`}>
          <rect width={clipWidth} height={13} />
        </clipPath>
        <path
          id={`star-${id}`}
          d="M9,2l2.163,4.279L16,6.969,12.5,10.3l.826,4.7L9,12.779,4.674,15,5.5,10.3,2,6.969l4.837-.69Z"
          transform="translate(-2 -2)"
        />
        <use
          clipPath={`url(#star-clip-${id})`}
          href={`#star-${id}`}
          fill={fill ?? "#DBA901"}
        />
      </svg>
    </span>
  );
};

export default StarIcon;
