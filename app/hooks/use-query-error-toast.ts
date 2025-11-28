import { useEffect } from "react";
import { getToastForError } from "~/libs/isomorphic";
import { useToast } from "./use-toast";

export function useQueryErrorToast(error: unknown) {
  const { toast } = useToast();

  useEffect(() => {
    if (!error) return;
    toast(getToastForError(error));
  }, [error, toast]);
}
