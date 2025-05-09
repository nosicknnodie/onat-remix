import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { cn } from "~/libs/utils";

interface FormErrorProps extends React.ComponentProps<"div"> {}

const FormError = ({ children, className, ...props }: FormErrorProps) => {
  if (!children) return null;
  return (
    <div
      className={cn(
        "bg-destructive/15 p-3 rounded-md flex items-center gap-x-2 text-sm text-destructive",
        className
      )}
      {...props}
    >
      <ExclamationTriangleIcon className="h-4 w-4" />
      <p>{children}</p>
    </div>
  );
};

export default FormError;
