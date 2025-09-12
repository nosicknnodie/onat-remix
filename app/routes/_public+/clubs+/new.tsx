import type { ActionFunctionArgs } from "@remix-run/node";
import { useActionData, useNavigation } from "@remix-run/react";
import { service } from "~/features/clubs/create/index.server";
import { ClubCreateForm } from "~/features/clubs/create/ui/ClubCreateForm";
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
