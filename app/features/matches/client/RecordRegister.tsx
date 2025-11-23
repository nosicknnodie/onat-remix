import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Loading } from "~/components/Loading";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  getAttendanceDisplayName,
  type RecordGoalRequest,
  recordSchema,
  useAttendanceQuery,
  useRecordGoalMutation,
} from "~/features/matches/isomorphic";

interface TeamShape {
  id: string;
  name: string;
}
interface QuarterShape {
  id: string;
  matchClubId: string;
  order: number;
  isSelf?: boolean | null;
  team1?: TeamShape | null;
  team2?: TeamShape | null;
}

interface RecordRegisterProps extends React.PropsWithChildren {
  quarter: QuarterShape;
  clubId: string;
  team?: TeamShape | null;
  canEdit?: boolean;
}

type AttendanceForRecord = {
  id: string;
  isVote: boolean;
  teamId?: string | null;
  assigneds?: { id: string; quarterId: string; teamId?: string | null }[];
  records?: { id: string; quarterId: string; teamId?: string | null; isOwnGoal: boolean }[];
  player: {
    user: { name?: string | null; userImage?: { url?: string | null } | null } | null;
  } | null;
  mercenary: {
    user?: { name?: string | null; userImage?: { url?: string | null } | null } | null;
    name?: string | null;
  } | null;
};

type QuarterAssignedForRecord = {
  id: string;
  quarterId: string;
  teamId?: string | null;
  attendance: { id: string };
};

export const RecordRegister = ({
  children,
  quarter,
  clubId,
  team,
  canEdit,
}: RecordRegisterProps) => {
  const allowOwnGoal = Boolean(quarter.isSelf);
  const initialStep: "goalType" | "scorer" = allowOwnGoal ? "goalType" : "scorer";
  const [open, setOpen] = useState(false);
  const [currentTeam, setCurrentTeam] = useState<TeamShape | null>(team ?? quarter.team1 ?? null);
  const [goalType, setGoalType] = useState<"goal" | "own" | null>(allowOwnGoal ? null : "goal");
  const [step, setStep] = useState<"goalType" | "scorer" | "assist">(initialStep);
  const [scorer, setScorer] = useState<AttendanceForRecord | null>(null);
  const [assist, setAssist] = useState<AttendanceForRecord | null>(null);
  const steps = !allowOwnGoal
    ? ([
        { key: "scorer", label: "득점자 선택" },
        { key: "assist", label: "어시스트 선택" },
      ] as const)
    : goalType === "own"
      ? ([
          { key: "goalType", label: "골 타입" },
          { key: "scorer", label: "득점자 선택" },
        ] as const)
      : ([
          { key: "goalType", label: "골 타입" },
          { key: "scorer", label: "득점자 선택" },
          { key: "assist", label: "어시스트 선택" },
        ] as const);
  const currentStepIndex = steps.findIndex((s) => s.key === step);
  const form = useForm<RecordGoalRequest>({
    resolver: zodResolver(recordSchema),
    defaultValues: {
      attendanceId: "",
      assistAttendanceId: undefined,
      teamId: team?.id ?? quarter.team1?.id ?? null,
      quarterId: quarter.id,
      isOwnGoal: false,
      goalType: undefined,
    },
  });
  const { mutateAsync: registerGoal, isPending } = useRecordGoalMutation(quarter.matchClubId);
  const { data: attendanceQueryData } = useAttendanceQuery(quarter.matchClubId, {
    enabled: open,
    clubId,
  });
  const { data: quarterDetail } = useQuery({
    queryKey: ["RECORD_QUARTER_ASSIGNED_QUERY", quarter.id],
    enabled: open,
    queryFn: async () => await fetch(`/api/quarters/${quarter.id}`).then((res) => res.json()),
  });

  const attendances =
    attendanceQueryData && "matchClub" in attendanceQueryData
      ? attendanceQueryData.matchClub.attendances
      : [];

  const assignedByAttendanceId = useMemo(() => {
    const quarterAssigneds =
      (quarterDetail?.quarter?.assigneds as QuarterAssignedForRecord[]) ?? [];
    const items = quarterAssigneds.map((item) => [item.attendance.id, item] as const);
    return new Map(items);
  }, [quarterDetail?.quarter?.assigneds]);

  const attendees = (attendances as AttendanceForRecord[])
    .filter((attendance) => attendance.isVote)
    .map((attendance) => {
      const assigned =
        attendance.assigneds?.find((item) => item.quarterId === quarter.id) ??
        assignedByAttendanceId.get(attendance.id);
      const assignedTeamId = assigned?.teamId ?? attendance.teamId ?? undefined;
      const name = getAttendanceDisplayName(attendance);
      const imageUrl =
        attendance.player?.user?.userImage?.url ||
        attendance.mercenary?.user?.userImage?.url ||
        "/images/user_empty.png";
      return { attendance, assigned, assignedTeamId, name, imageUrl };
    })
    .sort((a, b) => {
      if (a.assignedTeamId === b.assignedTeamId) return 0;
      return a.assignedTeamId === currentTeam?.id ? -1 : 1;
    });

  useEffect(() => {
    if (!open) return;
    if (team) {
      setCurrentTeam(team);
      form.setValue("teamId", team.id);
      return;
    }
    setCurrentTeam(quarter.team1 ?? null);
    form.setValue("teamId", quarter.team1?.id ?? null);
  }, [form, open, quarter.team1, team]);

  useEffect(() => {
    if (!open) {
      setGoalType(allowOwnGoal ? null : "goal");
      setStep(allowOwnGoal ? "goalType" : "scorer");
      setScorer(null);
      setAssist(null);
      setCurrentTeam(team ?? quarter.team1 ?? null);
      form.reset({
        attendanceId: "",
        assistAttendanceId: undefined,
        teamId: team?.id ?? quarter.team1?.id ?? null,
        quarterId: quarter.id,
        isOwnGoal: false,
        goalType: undefined,
      });
    }
  }, [allowOwnGoal, form, open, quarter.id, quarter.team1, team]);

  useEffect(() => {
    if (step === "goalType") {
      setScorer(null);
      setAssist(null);
      form.setValue("attendanceId", "");
      form.setValue("assistAttendanceId", undefined);
    }
    if (step === "scorer") {
      setAssist(null);
      form.setValue("assistAttendanceId", undefined);
    }
  }, [form, step]);

  useEffect(() => {
    if (!allowOwnGoal) {
      setGoalType("goal");
      setStep("scorer");
      form.setValue("isOwnGoal", false);
    }
  }, [allowOwnGoal, form]);

  useEffect(() => {
    if (goalType === null) {
      form.setValue("isOwnGoal", false);
    } else {
      form.setValue("isOwnGoal", goalType === "own");
    }
  }, [form, goalType]);

  const handleAddGoal = async (goal: {
    attendanceId: string;
    assistAttendanceId?: string;
    teamId?: string | null;
    quarterId: string;
    isOwnGoal?: boolean;
  }) => {
    await registerGoal(goal);
    setOpen(false);
    setGoalType(null);
    setStep("goalType");
    setScorer(null);
    setAssist(null);
  };

  const onSubmit = async (values: RecordGoalRequest) => {
    await handleAddGoal(values);
  };

  const submitWithAssist = (assistAttendanceId?: string) => {
    form.setValue("assistAttendanceId", assistAttendanceId ?? undefined);
    form.handleSubmit(onSubmit)();
  };

  if (!canEdit) {
    return <>{children}</>;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="min-h-[60vh] max-h-[75vh] overflow-hidden p-0 sm:max-w-[640px]">
        <DialogHeader>
          <div className="text-lg font-bold px-4 pt-4 pb-2 border-b flex justify-between items-center gap-2">
            <DialogTitle className="flex-1 flex justify-start items-center gap-2">
              <span className="text-sm text-muted-foreground">쿼터</span>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                {quarter.order}
              </span>
              <span>{steps[currentStepIndex]?.label}</span>
            </DialogTitle>
          </div>
          <div className="px-4 py-2 space-y-2 border-b bg-muted/30">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>기록 단계</span>
              <span>
                {currentStepIndex + 1} / {steps.length}
              </span>
            </div>
            <div className="flex gap-2">
              {steps.map((s, idx) => {
                const cls =
                  idx < currentStepIndex
                    ? "bg-primary/60"
                    : idx === currentStepIndex
                      ? "bg-primary"
                      : "bg-muted";
                return <div key={s.key} className={`h-1 flex-1 rounded-full ${cls}`} />;
              })}
            </div>
          </div>
        </DialogHeader>
        <div className="flex flex-col h-full max-h-[calc(75vh-130px)]">
          <div className="flex-1 overflow-y-auto px-4 py-3 pb-24 space-y-3">
            {allowOwnGoal && step === "goalType" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">기록 유형을 선택하세요.</p>
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    variant={goalType === "goal" ? "default" : "outline"}
                    onClick={() => {
                      setGoalType("goal");
                      form.setValue("isOwnGoal", false);
                      setStep("scorer");
                    }}
                  >
                    팀 득점
                  </Button>
                  <Button
                    className="flex-1"
                    variant={goalType === "own" ? "default" : "outline"}
                    onClick={() => {
                      setGoalType("own");
                      form.setValue("isOwnGoal", true);
                      setStep("scorer");
                    }}
                  >
                    자책골
                  </Button>
                </div>
              </div>
            )}
            {step === "scorer" && (
              <div className="space-y-2">
                <p className="text-sm font-semibold">
                  득점자를 선택하세요 {goalType === "own" ? "(자책)" : ""}
                </p>
                <ul className="space-y-2">
                  {attendees.map(({ attendance, assignedTeamId, name, imageUrl }) => {
                    const attendanceId = attendance?.id;
                    const isSelected = scorer?.id === attendanceId;
                    return (
                      <li
                        key={attendanceId ?? name}
                        className="flex justify-between items-center border px-2 py-2 rounded"
                      >
                        <div className="flex items-center gap-2 ">
                          <Avatar>
                            <AvatarImage src={imageUrl}></AvatarImage>
                            <AvatarFallback>
                              <Loading />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium">{name}</span>
                            <span className="text-xs text-muted-foreground">
                              팀:{" "}
                              {assignedTeamId
                                ? assignedTeamId === currentTeam?.id
                                  ? "우리팀"
                                  : "상대팀"
                                : "미정"}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant={isSelected ? "default" : "outline"}
                          disabled={isPending || !attendanceId}
                          onClick={() => {
                            if (!attendanceId) return;
                            setScorer(attendance);
                            setAssist(null);
                            form.setValue("attendanceId", attendanceId);
                            form.setValue("assistAttendanceId", undefined);
                            if (goalType === "own") {
                              submitWithAssist();
                            } else {
                              setStep("assist");
                            }
                          }}
                        >
                          {isSelected ? "선택됨" : "선택"}
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {step === "assist" && (
              <div className="space-y-3">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold">어시스트를 선택하거나 생략하세요.</p>
                  {scorer && (
                    <p className="text-xs text-muted-foreground">
                      득점자:{" "}
                      {scorer.player?.user?.name ||
                        scorer.mercenary?.user?.name ||
                        scorer.mercenary?.name ||
                        ""}
                    </p>
                  )}
                  {assist && (
                    <p className="text-xs text-muted-foreground">
                      어시스트:{" "}
                      {assist.player?.user?.name ||
                        assist.mercenary?.user?.name ||
                        assist.mercenary?.name ||
                        ""}
                    </p>
                  )}
                </div>
                <ul className="space-y-2">
                  {attendees.map(({ attendance, name, imageUrl }) => {
                    const attendanceId = attendance?.id;
                    if (scorer?.id === attendanceId) {
                      return null;
                    }
                    const isSelected = assist?.id === attendanceId;
                    return (
                      <li
                        key={attendanceId ?? name}
                        className="flex justify-between items-center border px-2 py-2 rounded"
                      >
                        <div className="flex items-center gap-2 ">
                          <Avatar>
                            <AvatarImage src={imageUrl}></AvatarImage>
                            <AvatarFallback>
                              <Loading />
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{name}</span>
                        </div>
                        <Button
                          variant={isSelected ? "default" : "outline"}
                          disabled={isPending || !attendanceId}
                          onClick={() => {
                            if (!attendanceId) return;
                            setAssist(attendance);
                          }}
                        >
                          {isSelected ? "선택됨" : "선택"}
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
          <div className="sticky bottom-0 left-0 w-full border-t bg-background px-4 py-3 flex justify-between gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                if (step === "goalType") {
                  setOpen(false);
                  return;
                }
                if (step === "scorer") {
                  setStep("goalType");
                  return;
                }
                if (step === "assist") {
                  setAssist(null);
                  setStep("scorer");
                }
              }}
            >
              뒤로
            </Button>
            {step === "assist" ? (
              <Button
                className="flex-1"
                disabled={isPending || !scorer}
                onClick={() => submitWithAssist(assist?.id ?? undefined)}
              >
                등록
              </Button>
            ) : (
              <Button
                className="flex-1"
                disabled={
                  isPending ||
                  (step === "goalType" && goalType === null) ||
                  (step === "scorer" && !scorer)
                }
                onClick={() => {
                  if (step === "goalType") {
                    setStep("scorer");
                    return;
                  }
                  if (step === "scorer" && scorer) {
                    if (goalType === "own") {
                      submitWithAssist();
                    } else {
                      setStep("assist");
                    }
                  }
                }}
              >
                다음
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
