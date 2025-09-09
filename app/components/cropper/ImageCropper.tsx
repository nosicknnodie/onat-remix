import { useRef, useState } from "react";
import { Cropper, type ReactCropperElement } from "react-cropper";
import { Button } from "~/components/ui/button";
import "~/styles/cropper.css";
import { useCropper } from "./cropper.hook";

interface PropsType {
  aspectRatio?: number;
  children: React.ReactNode;
}

const ImageCropper = ({ children, aspectRatio }: PropsType) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const cropperRef = useRef<ReactCropperElement>(null);
  const [image, setImage] = useState<null | string>(null);
  const { setBlob, setOriginalFilename } = useCropper();
  const handleChildrenClick = () => inputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const files = e.target.files;
    if (!files) return;
    setOriginalFilename(files[0].name);
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(files[0]);
    e.target.value = "";
  };

  const getCropData = () => {
    if (typeof cropperRef.current?.cropper !== "undefined") {
      cropperRef.current?.cropper.getCroppedCanvas().toBlob((blob) => {
        setBlob(blob);
        setImage(null);
      });
    }
  };

  return (
    <>
      <input
        type="file"
        ref={inputRef}
        style={{ display: "none" }}
        accept="image/*"
        onChange={handleFileChange}
      />
      {!image && (
        <Button type="button" variant="outline" onClick={handleChildrenClick}>
          {children}
        </Button>
      )}
      {image && (
        <div className="container">
          <div className="backdrop" />
          <div className="modal">
            <div className="content-wrapper">
              <div className="content">
                <Cropper
                  ref={cropperRef}
                  aspectRatio={aspectRatio}
                  src={image}
                  viewMode={1}
                  width={800}
                  height={500}
                  background={false}
                  responsive
                  autoCropArea={1}
                  checkOrientation={false}
                  guides
                />
              </div>
            </div>
            <div className="footer space-x-2 w-full flex justify-center py-2">
              <Button onClick={() => setImage(null)}>취소</Button>
              <Button onClick={getCropData}>적용하기</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageCropper;
