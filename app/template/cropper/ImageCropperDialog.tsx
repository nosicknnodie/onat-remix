import { useMutation } from "@tanstack/react-query";
import { ComponentProps, useState } from "react";
import { Loading } from "~/components/Loading";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import ImageCropper from "./ImageCropper";
import { CropperProvider, useCropper } from "./cropper.hook";
interface IImageCropperDialogProps extends React.PropsWithChildren {
  title: string;
  descirption: string;
}

const ImageCropperDialog = ({
  children,
  title,
  descirption,
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
      const res = await fetch("/api/upload-url", {
        method: "POST",
        body: formData,
      });

      const { publicUrl } = await res.json();
      // const uploadRes = await fetch(uploadUrl, {
      //   method: "PUT",
      //   body: blob,
      // });
      // if (!uploadRes.ok) throw new Error("업로드 실패");
      return publicUrl;
    },
  });
  const handleSave = async () => {
    const url = await mutateAsync();
    console.log(url);
    setBlob(null);
    setOpen(false);
  };
  return (
    <>
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
            <ImageCropper>이미지업로드</ImageCropper>
            <SaveButton onClick={handleSave} />
          </DialogContent>
        </Dialog>
      </CropperProvider>
    </>
  );
};

const SaveButton = (props: ComponentProps<"button">) => {
  const { blob } = useCropper();
  if (!blob) return null;
  return (
    <button type="submit" {...props}>
      적용
    </button>
  );
};

const PreviewImage = () => {
  const { blob } = useCropper();
  if (!blob) return null;
  const dataUrl = URL.createObjectURL(blob);
  return (
    <>
      <img src={dataUrl} alt="preview" />
    </>
  );
};

export default ImageCropperDialog;
