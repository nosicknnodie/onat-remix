import { CheckCircledIcon } from "@radix-ui/react-icons";

interface FormSuccessProps extends React.ComponentProps<"div"> {}

const FormSuccess = ({ children, ...props }: FormSuccessProps) => {
  if (!children) return null;

  return (
    <div
      className="bg-emerald-500/15 p-3 rounded-md flex items-center gap-x-2 text-sm text-emerald-500"
      {...props}
    >
      <CheckCircledIcon className="h-4 w-4" />
      <p>{children}</p>
    </div>
  );
};

export default FormSuccess;
