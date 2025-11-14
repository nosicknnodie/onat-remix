import {
  type UseMutationOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useMemo } from "react";
import { apiFetch, getJson, postJson } from "~/libs/api-client";
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
      return getJson<MatchClubCommentsResponse>(`/api/matchClubs/${matchClubId}/comments`, {
        auth: true,
      });
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
    return apiFetch<MatchCommentImageUploadResponse>("/api/upload/comment-image", {
      method: "POST",
      body: formData,
      auth: true,
    });
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
      return postJson<CreateMatchClubCommentResponse>(
        `/api/matchClubs/${matchClubId}/comments`,
        {
          content,
          matchClubId,
          parentId: parentId ?? null,
          replyToUserId: replyToUserId ?? null,
        },
        { auth: true },
      );
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
