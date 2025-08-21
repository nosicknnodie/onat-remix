import { type ActionFunctionArgs, redirect } from "@remix-run/node";
import { useActionData, useNavigation } from "@remix-run/react";
import { service, validators } from "~/features/clubs/create/index";
import { ClubCreateForm } from "~/features/clubs/create/ui/ClubCreateForm";
import { getUser } from "~/libs/db/lucia.server";

export const handle = {
  breadcrumb: "클럽 생성",
};

export async function action({ request }: ActionFunctionArgs): Promise<Response> {
  const user = await getUser(request);
  if (!user) {
    return redirect("/auth/login");
  }
  if (!user.name) {
    return redirect("/settings/edit");
  }

  const formData = await request.formData();
  const result = validators.CreateClubSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return Response.json(
      { ok: false, fieldErrors: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const club = await service.createClub({ input: result.data, ownerUser: user });
    return redirect(`/clubs/${club.id}`);
  } catch (err) {
    console.error(err);
    return Response.json(
      { ok: false, message: "클럽 생성 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

export default function ClubNewPage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isPending = navigation.state !== "idle";

  return <ClubCreateForm isPending={isPending} actionData={actionData} />;
}
