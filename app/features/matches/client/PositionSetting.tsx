import { Link } from "@remix-run/react";
import { RiArrowGoBackLine } from "react-icons/ri";
import { Button } from "~/components/ui/button";

export function PositionToolbar({
  backTo,
  left,
  right,
}: {
  backTo: { pathname: string; search?: string };
  left?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <section className="flex justify-between items-center relative">
      <div className="min-w-28 flex items-center gap-x-2">
        <Button variant={"outline"} asChild>
          <Link to={backTo} className="space-x-2">
            <RiArrowGoBackLine />
            <span className="max-md:hidden">돌아가기</span>
          </Link>
        </Button>
        {left}
      </div>
      <div className="min-w-28">{right}</div>
    </section>
  );
}

export function QuarterStepper({
  current,
  onPrev,
  onNext,
  disablePrev,
  disableNext,
}: {
  current: number;
  onPrev: () => void;
  onNext: () => void;
  disablePrev?: boolean;
  disableNext?: boolean;
}) {
  return (
    <section className="flex justify-between items-center relative">
      <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center">
        <Button variant="ghost" disabled={disablePrev} onClick={onPrev}>
          {/* left */}
          <span className="sr-only">이전</span>‹
        </Button>
        <div>{current} Q</div>
        <Button variant="ghost" disabled={disableNext} onClick={onNext}>
          {/* right */}
          <span className="sr-only">다음</span>›
        </Button>
      </div>
    </section>
  );
}
