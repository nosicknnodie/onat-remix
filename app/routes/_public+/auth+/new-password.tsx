import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { NewPasswordForm } from "~/features/auth/client";
import { newPasswordService as service } from "~/features/auth/server";
import { useActionToast } from "~/hooks";

export const loader = async (args: LoaderFunctionArgs) => {
  return service.handleNewPasswordLoader(args);
};

export const action = async (args: ActionFunctionArgs): Promise<Response> => {
  return service.handleNewPasswordAction(args);
};

export default function NewPasswordPage() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  useActionToast(actionData);
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <Form method="post">
      <NewPasswordForm
        loaderData={loaderData}
        actionData={actionData}
        isSubmitting={isSubmitting}
      />
    </Form>
  );
}
