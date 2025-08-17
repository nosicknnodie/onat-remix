import { $isCodeNode, CODE_LANGUAGE_FRIENDLY_NAME_MAP } from "@lexical/code";
import { $getNodeByKey } from "lexical";
import { useCallback } from "react";
import { FaAngleDown } from "react-icons/fa";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useActiveEditor, useToolbarState } from "./Context";

interface ICodeLanguageDropDownProps {}

const CodeLanguageDropDown = (_props: ICodeLanguageDropDownProps) => {
  const { toolbarState } = useToolbarState();
  const { activeEditor } = useActiveEditor();
  const onCodeLanguageSelect = useCallback(
    (value: string) => {
      activeEditor.update(() => {
        if (toolbarState.selectedElementKey !== null) {
          const node = $getNodeByKey(toolbarState.selectedElementKey);
          if ($isCodeNode(node)) {
            node.setLanguage(value);
          }
        }
      });
    },
    [activeEditor, toolbarState.selectedElementKey],
  );
  if (toolbarState.blockType !== "code") return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={"ghost"} className="flex gap-2 text-xs text-gray-500">
            {CODE_LANGUAGE_FRIENDLY_NAME_MAP[toolbarState.codeLanguage]}
            <FaAngleDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {Object.entries(CODE_LANGUAGE_FRIENDLY_NAME_MAP).map(([key, name]) => {
            return (
              <DropdownMenuItem
                // className={`item ${dropDownActiveClass(
                //   value === toolbarState.codeLanguage,
                // )}`}
                onClick={() => onCodeLanguageSelect(key)}
                key={key}
              >
                <span className="text">{name}</span>
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuItem>Markdown</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export default CodeLanguageDropDown;
