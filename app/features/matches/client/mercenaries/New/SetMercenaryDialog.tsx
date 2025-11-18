import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import type { MercenaryFormValues } from "~/features/matches/isomorphic";
import { SetMercenary } from "./SetMercenary";

type SetMercenaryDialogProps = {
  children: React.ReactNode;
  defaultValues?: Partial<MercenaryFormValues>;
  onSubmit: (values: MercenaryFormValues) => Promise<boolean | undefined> | boolean | undefined;
  title?: string;
  description?: string;
  submitLabel?: string;
};

const SetMercenaryDialog = ({
  children,
  defaultValues,
  onSubmit,
  title = "용병 추가",
  description = "회원 이메일로 검색하거나 임의로 추가할 수 있어요.",
  submitLabel,
}: SetMercenaryDialogProps) => {
  const [open, setOpen] = useState(false);

  const handleSubmit = async (values: MercenaryFormValues) => {
    const res = await onSubmit(values);
    if (res !== false) {
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <SetMercenary
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          submitLabel={submitLabel}
        />
        <Button variant="outline" className="w-full" onClick={() => setOpen(false)}>
          닫기
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default SetMercenaryDialog;
