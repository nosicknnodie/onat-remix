import type { ActionFunctionArgs } from "@remix-run/node";
import { useActionData, useNavigation } from "@remix-run/react";
import { ClubCreateForm } from "~/features/clubs/client";
import { createService as service } from "~/features/clubs/server";
import { useActionToast } from "~/hooks";

export const handle = {
  breadcrumb: "클럽 생성",
};

export async function action(args: ActionFunctionArgs): Promise<Response> {
  return service.handleCreateClubAction(args);
}

export default function ClubNewPage() {
  const actionData = useActionData<typeof action>();
  useActionToast(actionData);
  const navigation = useNavigation();
  const isPending = navigation.state !== "idle";

  return <ClubCreateForm isPending={isPending} actionData={actionData} />;
}
