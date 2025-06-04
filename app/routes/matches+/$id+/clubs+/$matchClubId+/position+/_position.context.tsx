import { Prisma } from "@prisma/client";
import { useParams } from "@remix-run/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useRef } from "react";
export const PositionContext = React.createContext({ currentQuarterOrder: 1 } as {
  query: Awaited<ReturnType<typeof usePositionQuery>>;
  currentQuarterOrder: number;
});

export function usePositionContext() {
  return React.useContext(PositionContext);
}
type AttendanceWithAssigned = Prisma.AttendanceGetPayload<{
  include: {
    assigneds: true;
    team: true;
    player: {
      include: {
        user: {
          include: {
            userImage: true;
          };
        };
      };
    };
    mercenary: {
      include: {
        user: {
          include: {
            userImage: true;
          };
        };
      };
    };
  };
}>;

export const usePositionQuery = () => {
  const params = useParams();
  const matchClubId = params.matchClubId!;
  return useQuery<{ attendances: AttendanceWithAssigned[] }>({
    queryKey: ["ATTENDANCES", matchClubId],
    queryFn: async () => {
      const res = await fetch("/api/attendances?matchClubId=" + matchClubId);
      return await res.json();
    },
  });
};



type MessageHandler = (data: any) => void;

export function usePositionUpdate({
  url,
  maxRetries = 3,
  retryDelay = 2000,
}: {
  url: string;
  maxRetries?: number;
  retryDelay?: number;
}) {
  const retries = useRef(0);
  const socketRef = useRef<WebSocket | null>(null);
  const retryTimeout = useRef<NodeJS.Timeout | null>(null);
  const isConnecting = useRef(false);

  const queryClient = useQueryClient();
  const { matchClubId } = useParams();

  useEffect(() => {
    let socket: WebSocket;

    const connect = () => {
      if (isConnecting.current) return; // ✅ 중복 방지
      isConnecting.current = true;

      socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log("✅ WebSocket 연결됨");
        retries.current = 0;
        isConnecting.current = false;
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "POSITION_UPDATED") {
            queryClient.setQueryData(["ATTENDANCES", matchClubId], (old: any) => {
              if (!old) return old;
              const updated = old.attendances.map((attendance: any) => {
                const updatedAssigneds = attendance.assigneds.map((assigned: any) => {
                  const found = data.assigneds.find((a: any) => a.id === assigned.id);
                  return found ? { ...assigned, position: found.position } : assigned;
                });
                return { ...attendance, assigneds: updatedAssigneds };
              });
              return { attendances: updated };
            });
          }
        } catch (err) {
          console.warn("⚠️ 메시지 파싱 실패", event.data);
        }
      };

      socket.onerror = (error) => {
        console.error("❌ WebSocket 오류", error);
      };

      socket.onclose = () => {
        console.log("🔌 연결 종료");
        if (retries.current < maxRetries) {
          retryTimeout.current = setTimeout(() => {
            retries.current += 1;
            console.log(`🔁 재시도 (${retries.current}/${maxRetries})...`);
            isConnecting.current = false; // 재시도 전에 플래그 초기화
            connect();
          }, retryDelay);
        }
      };
    };

    connect();

    return () => {
      socketRef.current?.close();
      if (retryTimeout.current) clearTimeout(retryTimeout.current);
    };
  }, [url, queryClient, matchClubId, maxRetries, retryDelay]);
}