import {
  type UseMutationOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useMemo } from "react";
import type {
  CreateMatchClubCommentInput,
  CreateMatchClubCommentResponse,
  MatchClubCommentsResponse,
} from "./comment.types";

export const matchCommentQueryKeys = {
  root: (matchClubId: string) => ["match", "club", matchClubId, "comments"] as const,
} as const;

export type UseMatchCommentsOptions = {
  enabled?: boolean;
  initialData?: MatchClubCommentsResponse;
};

export function useMatchCommentsQuery(matchClubId?: string, options?: UseMatchCommentsOptions) {
  const enabled = options?.enabled ?? Boolean(matchClubId);
  const queryKey = useMemo(() => matchCommentQueryKeys.root(matchClubId ?? ""), [matchClubId]);

  return useQuery<MatchClubCommentsResponse>({
    queryKey,
    queryFn: async () => {
      if (!matchClubId) {
        throw new Error("matchClubId is required to fetch comments");
      }
      const res = await fetch(`/api/matchClubs/${matchClubId}/comments`);
      if (!res.ok) {
        throw new Error("Failed to fetch match comments");
      }
      return (await res.json()) as MatchClubCommentsResponse;
    },
    enabled,
    initialData: options?.initialData,
  });
}

export type MatchCommentImageUploadResponse = { success: string; url: string };

export function useCommentImageUpload() {
  const handleInsertImage = async (file: File): Promise<MatchCommentImageUploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload/comment-image", { method: "POST", body: formData });
    if (!res.ok) {
      throw new Error("이미지 업로드에 실패했습니다.");
    }
    return (await res.json()) as MatchCommentImageUploadResponse;
  };

  return { handleInsertImage };
}

export function useCreateMatchCommentMutation(
  options?: UseMutationOptions<
    CreateMatchClubCommentResponse,
    unknown,
    CreateMatchClubCommentInput
  >,
) {
  const queryClient = useQueryClient();

  return useMutation<CreateMatchClubCommentResponse, unknown, CreateMatchClubCommentInput>({
    mutationFn: async ({ matchClubId, content, parentId, replyToUserId }) => {
      if (!matchClubId) {
        throw new Error("matchClubId is required to create comment");
      }
      const res = await fetch(`/api/matchClubs/${matchClubId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          matchClubId,
          parentId: parentId ?? null,
          replyToUserId: replyToUserId ?? null,
        }),
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to create match comment");
      }
      return (await res.json()) as CreateMatchClubCommentResponse;
    },
    ...(options ?? {}),
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({
        queryKey: matchCommentQueryKeys.root(variables.matchClubId),
      });
      await options?.onSuccess?.(data, variables, context);
    },
  });
}

export type { MatchClubComment, MatchClubCommentsResponse } from "./comment.types";
