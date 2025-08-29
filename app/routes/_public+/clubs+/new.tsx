import type { ActionFunctionArgs } from "@remix-run/node";
import { useActionData, useNavigation } from "@remix-run/react";
import { service } from "~/features/clubs/create/index";
import { ClubCreateForm } from "~/features/clubs/create/ui/ClubCreateForm";

export const handle = {
  breadcrumb: "클럽 생성",
};

export async function action(args: ActionFunctionArgs): Promise<Response> {
  return service.handleCreateClubAction(args);
}

export default function ClubNewPage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isPending = navigation.state !== "idle";

  return <ClubCreateForm isPending={isPending} actionData={actionData} />;
}
