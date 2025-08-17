import { createContext, type PropsWithChildren, useContext } from "react";

interface ICropperContextProps extends PropsWithChildren {
  blob: Blob | null;
  originalFilename: string | null;
  setOriginalFilename: React.Dispatch<React.SetStateAction<string | null>>;
  setBlob: React.Dispatch<React.SetStateAction<Blob | null>>;
  isPending: boolean;
}

const cropperContext = createContext<ICropperContextProps>({} as ICropperContextProps);

export const useCropper = () => {
  return useContext(cropperContext);
};

export const CropperProvider = ({ children, ...props }: ICropperContextProps) => {
  return <cropperContext.Provider value={props}>{children}</cropperContext.Provider>;
};
