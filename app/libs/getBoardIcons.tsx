import { BoardType } from "@prisma/client";
import {
  FaBullhorn,
  FaLink,
  FaRegFileAlt,
  FaRegImages,
  FaRegPlayCircle,
} from "react-icons/fa";

export const getBoardIcon = (type: BoardType) => {
  switch (type) {
    case "TEXT":
      return <FaRegFileAlt className="text-primary" />;
    case "GALLERY":
      return <FaRegImages className="text-primary" />;
    case "VIDEO":
      return <FaRegPlayCircle className="text-primary" />;
    case "NOTICE":
      return <FaBullhorn className="text-primary" />;
    case "LINK":
      return <FaLink className="text-primary" />;
    default:
      return null;
  }
};
