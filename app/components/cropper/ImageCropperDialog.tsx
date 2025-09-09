import type { File, FilePurposeType } from "@prisma/client";
import { useMutation } from "@tanstack/react-query";
import { type ComponentProps, useState } from "react";
import { Loading } from "~/components/Loading";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { CropperProvider, useCropper } from "./cropper.hook";
import ImageCropper from "./ImageCropper";

interface IImageCropperDialogProps extends ComponentProps<typeof ImageCropper> {
  title: string;
  descirption: string;
  purpose?: FilePurposeType;
  onChangeValue?: (file: File) => void;
}

const ImageCropperDialog = ({
  children,
  title,
  descirption,
  onChangeValue,
  aspectRatio,
  purpose,
  ..._props
}: IImageCropperDialogProps) => {
  const [open, setOpen] = useState(false);
  const [blob, setBlob] = useState<null | Blob>(null);
  const [originalFilename, setOriginalFilename] = useState<null | string>(null);
  const { mutateAsync, isPending } = useMutation({
    mutationFn: async () => {
      if (!blob) return;
      const formData = new FormData();
      formData.append("file", blob, originalFilename || "image.webp");
      formData.append("purpose", purpose || "PROFILE");
      const res = await fetch("/api/upload-url", { method: "POST", body: formData });
      return await res.json();
    },
  });
  const handleSave = async () => {
    const fileMetaData = await mutateAsync();
    onChangeValue?.(fileMetaData);
    setBlob(null);
    setOpen(false);
  };
  return (
    <CropperProvider
      blob={blob}
      setBlob={setBlob}
      isPending={isPending}
      originalFilename={originalFilename}
      setOriginalFilename={setOriginalFilename}
    >
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger>{children}</DialogTrigger>
        <DialogContent>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{descirption}</DialogDescription>
          <div className="relative">
            {isPending && <Loading className="absolute top-1/2 left-1/2" />}
            <PreviewImage />
          </div>
          <div className="w-full flex gap-2 justify-center items-center">
            <ImageCropper aspectRatio={aspectRatio}>업로드</ImageCropper>
            <SaveButton onClick={handleSave} />
          </div>
        </DialogContent>
      </Dialog>
    </CropperProvider>
  );
};

const SaveButton = (props: ComponentProps<"button">) => {
  const { blob } = useCropper();
  if (!blob) return null;
  return (
    <Button type="submit" {...props}>
      적용
    </Button>
  );
};

const PreviewImage = () => {
  const { blob } = useCropper();
  if (!blob) return null;
  const dataUrl = URL.createObjectURL(blob);
  return <img src={dataUrl} alt="preview" />;
};

export default ImageCropperDialog;
