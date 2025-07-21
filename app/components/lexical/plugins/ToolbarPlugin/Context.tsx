import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import type { LexicalEditor, NodeKey } from "lexical";
import { ElementFormatType } from "lexical";
import {
  createContext,
  JSX,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export const MIN_ALLOWED_FONT_SIZE = 8;
export const MAX_ALLOWED_FONT_SIZE = 72;
export const DEFAULT_FONT_SIZE = 15;

const rootTypeToRootName = {
  root: "Root",
  table: "Table",
};

export const blockTypeToBlockName = {
  bullet: "Bulleted List",
  check: "Check List",
  code: "Code Block",
  h1: "Heading 1",
  h2: "Heading 2",
  h3: "Heading 3",
  h4: "Heading 4",
  h5: "Heading 5",
  h6: "Heading 6",
  number: "Numbered List",
  paragraph: "Normal",
  quote: "Quote",
};

//disable eslint sorting rule for quick reference to toolbar state
/* eslint-disable sort-keys-fix/sort-keys-fix */
const INITIAL_TOOLBAR_STATE = {
  bgColor: "#fff",
  blockType: "paragraph" as keyof typeof blockTypeToBlockName,
  canRedo: false,
  canUndo: false,
  codeLanguage: "",
  elementFormat: "left" as ElementFormatType,
  fontColor: "#000",
  fontFamily: "Arial",
  selectedElementKey: null as NodeKey | null,
  // Current font size in px
  fontSize: `${DEFAULT_FONT_SIZE}px`,
  // Font size input value - for controlled input
  fontSizeInputValue: `${DEFAULT_FONT_SIZE}`,
  isBold: false,
  isCode: false,
  isHighlight: false,
  isImageCaption: false,
  isItalic: false,
  isLink: false,
  isRTL: false,
  isStrikethrough: false,
  isSubscript: false,
  isSuperscript: false,
  isUnderline: false,
  isLowercase: false,
  isUppercase: false,
  isCapitalize: false,
  isToolbarVisible: true,
  rootType: "root" as keyof typeof rootTypeToRootName,
};

type ToolbarState = typeof INITIAL_TOOLBAR_STATE;

type ContextShape = {
  toolbarState: ToolbarState;
  updateToolbarState<Key extends ToolbarStateKey>(
    key: Key,
    value: ToolbarStateValue<Key>
  ): void;
};
// Utility type to get keys and infer value types
type ToolbarStateKey = keyof ToolbarState;
type ToolbarStateValue<Key extends ToolbarStateKey> = ToolbarState[Key];
const Context = createContext<ContextShape | undefined>(undefined);

/**
 * Toolbar Context
 * @param props
 * @returns
 */
export const ToolbarContext = ({
  config,
  children,
}: PropsWithChildren & { config?: Record<string, unknown> }) => {
  const [toolbarState, setToolbarState] = useState(
    Object.assign(INITIAL_TOOLBAR_STATE, config)
  );
  const selectionFontSize = toolbarState.fontSize;
  const updateToolbarState = useCallback(
    <Key extends ToolbarStateKey>(key: Key, value: ToolbarStateValue<Key>) => {
      setToolbarState((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    []
  );
  useEffect(() => {
    updateToolbarState("fontSizeInputValue", selectionFontSize.slice(0, -2));
  }, [selectionFontSize, updateToolbarState]);
  const contextValue = useMemo(() => {
    return {
      toolbarState,
      updateToolbarState,
    };
  }, [toolbarState, updateToolbarState]);
  return <Context.Provider value={contextValue}>{children}</Context.Provider>;
};

export const useToolbarState = () => {
  const context = useContext(Context);

  if (context === undefined) {
    throw new Error("useToolbarState must be used within a ToolbarProvider");
  }

  return context;
};

type ActiveEditorContextType = {
  activeEditor: LexicalEditor;
  setActiveEditor: (editor: LexicalEditor) => void;
};

const ActiveEditorContext = createContext<ActiveEditorContextType | undefined>(
  undefined
);

export function ActiveEditorProvider({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState<LexicalEditor>(editor);

  return (
    <ActiveEditorContext.Provider value={{ activeEditor, setActiveEditor }}>
      {children}
    </ActiveEditorContext.Provider>
  );
}

export function useActiveEditor() {
  const ctx = useContext(ActiveEditorContext);
  if (!ctx) {
    throw new Error("useActiveEditor must be used within ActiveEditorProvider");
  }
  return ctx;
}
