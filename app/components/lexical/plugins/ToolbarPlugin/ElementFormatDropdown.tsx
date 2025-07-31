import { JSX } from "react";
import {
  BsTypeH1,
  BsTypeH2,
  BsTypeH3,
  BsTypeH4,
  BsTypeH5,
  BsTypeH6,
} from "react-icons/bs";
import { FaAngleDown } from "react-icons/fa";
import { HiOutlineCheckCircle, HiOutlineListBullet } from "react-icons/hi2";
import { PiTextAlignLeft } from "react-icons/pi";
import { VscCode, VscListOrdered, VscQuote } from "react-icons/vsc";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

import {
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from "@lexical/list";
import { $createQuoteNode } from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import { $getSelection, LexicalEditor } from "lexical";
import {
  blockTypeToBlockName,
  useActiveEditor,
  useToolbarState,
} from "./Context";
import { formatCode, formatHeading, formatParagraph } from "./formatUtils";
interface IElementFormatDropdownProps {}

const options: Record<
  keyof typeof blockTypeToBlockName,
  {
    value: keyof typeof blockTypeToBlockName;
    label: string;
    icon: JSX.Element;
    onClick?: (
      editor: LexicalEditor,
      blockType: keyof typeof blockTypeToBlockName
    ) => void;
  }
> = {
  bullet: {
    value: "bullet",
    label: "Bulleted List",
    icon: <HiOutlineListBullet className="size-4" />,
    onClick: (editor, blockType) => {
      if (blockType !== "bullet") {
        editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
      } else {
        formatParagraph(editor);
      }
    },
  },
  check: {
    value: "check",
    label: "Check List",
    icon: <HiOutlineCheckCircle className="size-4" />,
    onClick: (editor, blockType) => {
      if (blockType !== "check") {
        editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
      } else {
        formatParagraph(editor);
      }
    },
  },
  code: {
    value: "code",
    label: "Code Block",
    icon: <VscCode className="size-4" />,
    onClick: formatCode,
  },
  number: {
    value: "number",
    label: "Numbered List",
    icon: <VscListOrdered className="size-4" />,
    onClick: (editor, blockType) => {
      if (blockType !== "number") {
        editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
      } else {
        formatParagraph(editor);
      }
    },
  },
  quote: {
    value: "quote",
    label: "Quote",
    icon: <VscQuote className="size-4" />,
    onClick: (editor, blockType) => {
      if (blockType !== "quote") {
        editor.update(() => {
          const selection = $getSelection();
          $setBlocksType(selection, () => $createQuoteNode());
        });
      }
    },
  },
  paragraph: {
    value: "paragraph",
    label: "Normal",
    icon: <PiTextAlignLeft className="size-4" />,
    onClick: formatParagraph,
  },
  h1: {
    value: "h1",
    label: "Heading 1",
    icon: <BsTypeH1 className="size-4" />,
    onClick: (editor, blockType) => formatHeading(editor, blockType, "h1"),
  },
  h2: {
    value: "h2",
    label: "Heading 2",
    icon: <BsTypeH2 className="size-4" />,
    onClick: (editor, blockType) => formatHeading(editor, blockType, "h2"),
  },
  h3: {
    value: "h3",
    label: "Heading 3",
    icon: <BsTypeH3 className="size-4" />,
    onClick: (editor, blockType) => formatHeading(editor, blockType, "h3"),
  },
  h4: {
    value: "h4",
    label: "Heading 4",
    icon: <BsTypeH4 className="size-4" />,
    onClick: (editor, blockType) => formatHeading(editor, blockType, "h4"),
  },
  h5: {
    value: "h5",
    label: "Heading 5",
    icon: <BsTypeH5 className="size-4" />,
    onClick: (editor, blockType) => formatHeading(editor, blockType, "h5"),
  },
  h6: {
    value: "h6",
    label: "Heading 6",
    icon: <BsTypeH6 className="size-4" />,
    onClick: (editor, blockType) => formatHeading(editor, blockType, "h6"),
  },
};
const ElementFormatDropdown = (_props: IElementFormatDropdownProps) => {
  const { activeEditor } = useActiveEditor();
  const { toolbarState } = useToolbarState();
  const blockType = toolbarState.blockType || "paragraph";
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={"ghost"}
            className="flex gap-2 text-xs text-gray-500"
          >
            {options[blockType].icon}
            <span>{options[blockType].label}</span>
            <FaAngleDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {Object.values(options).map((option) => (
            <DropdownMenuItem
              key={option.value}
              className="flex gap-2"
              onClick={() => option.onClick?.(activeEditor, blockType)}
            >
              {option.icon}
              <span>{option.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export default ElementFormatDropdown;
