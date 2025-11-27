import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaChartLine } from "react-icons/fa";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { Loading } from "~/components/Loading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import type { DashboardPerformanceHistory } from "../isomorphic";

type Props = {
  data?: DashboardPerformanceHistory;
  isLoading?: boolean;
  selectedYear: string | undefined;
  onYearChange: (year: string) => void;
};

export const PerformanceSection = ({ data, isLoading, selectedYear, onYearChange }: Props) => {
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const currentYear = useMemo(() => Number(dayjs().format("YYYY")), []);

  const clubOptions = useMemo(() => {
    if (!data?.members) return [];
    const seen = new Set<string>();
    return data.members.reduce(
      (acc, member) => {
        if (seen.has(member.clubId)) return acc;
        seen.add(member.clubId);
        acc.push({
          clubId: member.clubId,
          clubName: member.clubName || "클럽",
          emblemUrl: member.clubEmblemUrl ?? undefined,
        });
        return acc;
      },
      [] as { clubId: string; clubName: string; emblemUrl?: string }[],
    );
  }, [data?.members]);

  const yearOptions = useMemo(() => {
    const recentYears = Array.from({ length: 5 }, (_, idx) => String(currentYear - idx));
    const available = data?.availableYears ?? [];
    return Array.from(new Set([...recentYears, ...available])).sort(
      (a, b) => Number(b) - Number(a),
    );
  }, [currentYear, data?.availableYears]);

  useEffect(() => {
    if (data?.defaultYear && !selectedYear) {
      onYearChange(data.defaultYear);
    }
  }, [data?.defaultYear, onYearChange, selectedYear]);

  useEffect(() => {
    if (yearOptions.length > 0 && !selectedYear) {
      onYearChange(yearOptions[0]);
    }
  }, [onYearChange, selectedYear, yearOptions]);

  useEffect(() => {
    if (clubOptions.length > 0 && !selectedClubId) {
      setSelectedClubId(clubOptions[0]?.clubId ?? null);
    }
  }, [clubOptions, selectedClubId]);

  const selectedMember = useMemo(() => {
    if (!data?.members || !selectedClubId) return null;
    return data.members.find((m) => m.clubId === selectedClubId) ?? null;
  }, [data?.members, selectedClubId]);

  const activeYear = selectedYear ?? data?.defaultYear;

  const toThreePoint = useCallback((score?: number | null) => {
    if (score === null || score === undefined) return null;
    return Number((score / 20).toFixed(2)); // 60점 만점(3점 스케일) -> 3점 환산
  }, []);

  const selectedStat = useMemo(() => {
    if (!selectedMember || !activeYear) return null;
    const yearHistories = (selectedMember.history ?? []).filter((h) =>
      h.periodKey.startsWith(activeYear),
    );
    const yearEntry = yearHistories.find((h) => h.periodType === "YEAR");
    if (yearEntry) return yearEntry;
    if (yearHistories.length > 0) {
      return yearHistories[yearHistories.length - 1];
    }
    return null;
  }, [activeYear, selectedMember]);

  const chartData = useMemo(() => {
    if (!selectedMember || !activeYear) return [];
    const monthlyHistory = (selectedMember.history ?? []).filter(
      (h) => h.periodType === "MONTH" && h.periodKey.startsWith(activeYear),
    );
    const monthMap = new Map<number, (typeof monthlyHistory)[number]>();
    monthlyHistory.forEach((item) => {
      const [, monthPart] = item.periodKey.split("-");
      const month = Number(monthPart?.replace(/\D/g, "") || "0");
      if (month >= 1 && month <= 12) {
        monthMap.set(month, item);
      }
    });

    return Array.from({ length: 12 }, (_, idx) => {
      const month = idx + 1;
      const item = monthMap.get(month);
      return {
        label: `${month}월`,
        rating: toThreePoint(item?.averageRating),
        voteRate: item?.voteRate ?? null,
        matchCount: item?.matchCount ?? 0,
      };
    });
  }, [activeYear, selectedMember, toThreePoint]);

  const statCards = useMemo(
    () => [
      {
        label: "출석률",
        value:
          selectedStat?.voteRate !== null && selectedStat?.voteRate !== undefined
            ? `${selectedStat.voteRate}%`
            : "-",
      },
      {
        label: "매치 수",
        value: selectedStat?.matchCount ?? "-",
      },
      {
        label: "평점",
        value: toThreePoint(selectedStat?.averageRating)?.toFixed(2) ?? "-",
      },
      {
        label: "총 평점",
        value: ((selectedStat?.totalRating ?? 0) / 20).toFixed(1) ?? "-",
      },
      {
        label: "받은좋아요",
        value: selectedStat?.totalLike ?? "-",
      },
      {
        label: "골",
        value: selectedStat?.totalGoal ?? "-",
      },
    ],
    [selectedStat, toThreePoint],
  );

  return (
    <div className="sm:col-span-3 w-full h-full border border-gray-200 rounded-lg  bg-white p-2 min-h-36 flex flex-col gap-4">
      <div className="font-semibold px-2 text-sm flex items-center gap-1">
        <FaChartLine className="text-primary" />
        <span>퍼포먼스 / 히스토리</span>
      </div>
      <div className="flex flex-wrap items-center gap-2 px-2 text-sm">
        {yearOptions.length ? (
          <div className="flex items-center gap-2 px-2">
            <span className="text-muted-foreground">연도</span>
            <Select
              value={activeYear}
              onValueChange={(val) => {
                onYearChange(val);
              }}
            >
              <SelectTrigger className="w-28 h-8">
                <SelectValue placeholder="연도 선택" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        {clubOptions.length === 2 ? (
          <Tabs
            value={selectedClubId ?? undefined}
            onValueChange={(val) => setSelectedClubId(val)}
            className="max-w-full"
          >
            <TabsList>
              {clubOptions.map((club) => (
                <TabsTrigger key={club.clubId} value={club.clubId}>
                  {club.clubName}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        ) : clubOptions.length >= 3 ? (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">클럽</span>
            <Select
              value={selectedClubId ?? undefined}
              onValueChange={(val) => setSelectedClubId(val)}
            >
              <SelectTrigger className="w-40 h-8">
                <SelectValue placeholder="클럽 선택" />
              </SelectTrigger>
              <SelectContent>
                {clubOptions.map((club) => (
                  <SelectItem key={club.clubId} value={club.clubId}>
                    {club.clubName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loading />
        </div>
      ) : !selectedMember ? (
        <div className="text-sm text-muted-foreground px-2 py-4">
          표시할 퍼포먼스 데이터가 없습니다.
        </div>
      ) : (
        <>
          <div className="px-4 text-sm text-muted-foreground flex items-center gap-2">
            <span className="font-semibold text-primary">{selectedMember.clubName}</span>
            {activeYear ? <span>{activeYear}년 기준</span> : null}
          </div>
          <div className="grid max-sm:grid-cols-2 sm:grid-cols-6 gap-2 px-4">
            {statCards.map((card) => (
              <div
                key={card.label}
                className="flex flex-col items-center justify-center bg-secondary-foreground rounded-lg p-4 w-full"
              >
                <span className="font-semibold text-white">{card.value}</span>
                <span className="font-semibold text-secondary">{card.label}</span>
              </div>
            ))}
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis
                  yAxisId="left"
                  domain={[0, 5]}
                  ticks={[0, 1, 2, 3, 4, 5]}
                  tickFormatter={(v) => v.toFixed(1)}
                />
                <YAxis yAxisId="right" orientation="right" />
                <RechartsTooltip
                  formatter={(value, name) => {
                    if (name === "평점(5점)") return [value, name];
                    if (name === "출석률(%)") return [`${value}%`, name];
                    return value;
                  }}
                />
                <Legend />
                <Bar
                  yAxisId="right"
                  dataKey="matchCount"
                  name="매치 수"
                  fill="#d4d4d8"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  type="monotone"
                  yAxisId="left"
                  dataKey="rating"
                  name="평점(5점)"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  yAxisId="right"
                  dataKey="voteRate"
                  name="출석률(%)"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};
