import { FaImage } from "react-icons/fa";
import { Button } from "~/components/ui/button";
import { cn } from "~/libs/utils";
import { InsertImageDialog } from "../../ImagesPlugin";

interface IInsertImageButtonProps {}

const InsertImageButton = (_props: IInsertImageButtonProps) => {
  return (
    <>
      <InsertImageDialog>
        <Button type="button" variant={"ghost"} size="icon">
          <FaImage className={cn("size-4", {})} />
        </Button>
      </InsertImageDialog>
    </>
  );
};

export default InsertImageButton;
