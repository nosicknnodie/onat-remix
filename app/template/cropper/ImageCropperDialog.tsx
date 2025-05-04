import { useMutation } from "@tanstack/react-query";
import mime from "mime-types";
import { ComponentProps, useState } from "react";
import { v4 as uuidv4 } from "uuid";
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
  const { mutateAsync, isPending } = useMutation({
    mutationFn: async () => {
      if (!blob) return;
      const ext = mime.extension(blob.type || "") || "webp";
      const filename = `${uuidv4()}.${ext}`;
      const formData = new FormData();
      formData.append("file", blob, filename);
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
      <CropperProvider blob={blob} setBlob={setBlob} isPending={isPending}>
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
