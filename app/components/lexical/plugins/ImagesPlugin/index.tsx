/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $wrapNodeInElement, mergeRegister } from "@lexical/utils";
import {
  $createParagraphNode,
  $createRangeSelection,
  $getSelection,
  $insertNodes,
  $isNodeSelection,
  $isRootOrShadowRoot,
  $setSelection,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  createCommand,
  DRAGOVER_COMMAND,
  DRAGSTART_COMMAND,
  DROP_COMMAND,
  getDOMSelectionFromTarget,
  isHTMLElement,
  type LexicalCommand,
  type LexicalEditor,
  type LexicalNode,
} from "lexical";
import type { JSX } from "react";
import { useEffect, useRef, useState } from "react";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { cn } from "~/libs/utils";
import {
  $createImageNode,
  $isImageNode,
  ImageNode,
  type ImagePayload,
} from "../../nodes/ImageNode";
import { useActiveEditor, useToolbarState } from "../ToolbarPlugin/Context";

export type InsertImagePayload = Readonly<
  ImagePayload & { onInserted?: (node: LexicalNode) => void }
>;

export const INSERT_IMAGE_COMMAND: LexicalCommand<InsertImagePayload> =
  createCommand("INSERT_IMAGE_COMMAND");

interface IInsertImageDialogProps extends React.PropsWithChildren {}

const InserImageUrl = ({ onSubmit }: { onSubmit: () => void }) => {
  const { activeEditor } = useActiveEditor();
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const handleSubmit = (payload: InsertImagePayload) => {
    activeEditor.dispatchCommand(INSERT_IMAGE_COMMAND, {
      ...payload,
    });
    onSubmit();
  };
  return (
    <>
      <Input
        type="text"
        placeholder="Image URL"
        onChange={(e) => setUrl(e.target.value)}
        value={url}
      ></Input>
      <Input
        type="text"
        placeholder="Alt Text"
        onChange={(e) => setAlt(e.target.value)}
        value={alt}
      ></Input>
      <Button onClick={() => handleSubmit({ src: url, altText: alt })}>이미지 추가</Button>
    </>
  );
};

const InserImageFile = ({ onSubmit }: { onSubmit: () => void }) => {
  const { activeEditor } = useActiveEditor();
  const { toolbarState } = useToolbarState();
  const inputFileRef = useRef<HTMLInputElement>(null);
  // We'll use a ref to store the selected files between change and submit
  const filesRef = useRef<FileList | null>(null);

  // 1. Extract selected image file(s)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    filesRef.current = e.target.files;
  };

  // 2. Create a local blob URL for each file to use as a preview
  // 3. Insert a pending image node into the editor
  // 4. Upload the file to the backend and update the node with the final image URL
  const handleSubmit = () => {
    const files = filesRef.current;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const previewUrl = URL.createObjectURL(file);

      activeEditor.dispatchCommand(INSERT_IMAGE_COMMAND, {
        src: previewUrl,
        altText: file.name,
        sourceType: "upload",
        uploadState: "pending",
        onInserted: (node) => {
          if (!$isImageNode(node)) return;

          try {
            toolbarState.onUploadImage?.(file)?.then((params) => {
              activeEditor.update(() => {
                if (params?.success) {
                  const writable = node.getWritable();
                  if ($isImageNode(writable)) {
                    writable.__imageId = params.id;
                    writable.__src = params.url;
                    writable.__uploadState = "success";
                  }
                } else {
                  const writable = node.getWritable();
                  if ($isImageNode(writable)) {
                    writable.__uploadState = "error";
                  }
                }
              });
            });
          } catch {
            activeEditor.update(() => {
              const writable = node.getWritable();
              if ($isImageNode(writable)) {
                writable.__uploadState = "error";
              }
            });
          }
        },
      });
    });

    onSubmit();
  };

  return (
    <>
      <Input
        ref={inputFileRef}
        type="file"
        placeholder="Select Image file"
        accept="image/png, image/jpeg, image/jpg, image/gif, image/webp, image/bmp, image/svg+xml, image/avif, image/heic"
        onChange={handleFileChange}
        multiple
      />
      <Button onClick={handleSubmit}>이미지 추가</Button>
    </>
  );
};

export function InsertImageDialog({ children }: IInsertImageDialogProps): JSX.Element {
  const { activeEditor } = useActiveEditor();
  const hasModifier = useRef(false);
  const [open, setOpen] = useState(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: off
  useEffect(() => {
    hasModifier.current = false;
    const handler = (e: KeyboardEvent) => {
      hasModifier.current = e.altKey;
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
    };
  }, [activeEditor]);
  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent>
          <DialogHeader className="font-semibold">
            <DialogTitle>이미지 추가</DialogTitle>
            <DialogDescription>file 혹은 url 로 이미지를 업로드합니다.</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="file" className="w-full">
            <TabsList className="bg-transparent  space-x-2 mb-2">
              <TabsTrigger
                value="file"
                className={cn(
                  "text-foreground pb-1 relative incline-block font-semibold hover:text-primary",
                  "bg-[linear-gradient(hsl(var(--primary)),_hsl(var(--primary)))] bg-no-repeat bg-bottom bg-[length:0_3px] py-1 hover:bg-[length:100%_3px] transition-all",
                  "data-[state=active]:text-primary data-[state=active]:font-bold data-[state=active]:after:absolute data-[state=active]:after:-right-0 data-[state=active]:after:-top-0.5 data-[state=active]:after:content-[''] data-[state=active]:after:w-2 data-[state=active]:after:h-2 data-[state=active]:after:bg-primary data-[state=active]:after:rounded-full",
                )}
              >
                파일업로드
              </TabsTrigger>
              <TabsTrigger
                value="url"
                className={cn(
                  "text-foreground pb-1 relative incline-block font-semibold hover:text-primary",
                  "bg-[linear-gradient(hsl(var(--primary)),_hsl(var(--primary)))] bg-no-repeat bg-bottom bg-[length:0_3px] py-1 hover:bg-[length:100%_3px] transition-all",
                  "data-[state=active]:text-primary data-[state=active]:font-bold data-[state=active]:after:absolute data-[state=active]:after:-right-0 data-[state=active]:after:-top-0.5 data-[state=active]:after:content-[''] data-[state=active]:after:w-2 data-[state=active]:after:h-2 data-[state=active]:after:bg-primary data-[state=active]:after:rounded-full",
                )}
              >
                URL 입력
              </TabsTrigger>
            </TabsList>
            <Separator />
            <TabsContent value="file">
              <div className="flex flex-col gap-2 p-2">
                <InserImageFile onSubmit={handleClose} />
              </div>
            </TabsContent>
            <TabsContent value="url">
              <div className="flex flex-col gap-2 p-2">
                <InserImageUrl onSubmit={handleClose} />
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function ImagesPlugin({
  captionsEnabled,
}: {
  captionsEnabled?: boolean;
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  // biome-ignore lint/correctness/useExhaustiveDependencies: off
  useEffect(() => {
    if (!editor.hasNodes([ImageNode])) {
      throw new Error("ImagesPlugin: ImageNode not registered on editor");
    }

    return mergeRegister(
      editor.registerCommand<InsertImagePayload>(
        INSERT_IMAGE_COMMAND,
        (payload) => {
          const imageNode = $createImageNode(payload);
          $insertNodes([imageNode]);
          if ($isRootOrShadowRoot(imageNode.getParentOrThrow())) {
            $wrapNodeInElement(imageNode, $createParagraphNode).selectEnd();
          }
          payload.onInserted?.(imageNode);

          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand<DragEvent>(
        DRAGSTART_COMMAND,
        (event) => {
          return $onDragStart(event);
        },
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand<DragEvent>(
        DRAGOVER_COMMAND,
        (event) => {
          return $onDragover(event);
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand<DragEvent>(
        DROP_COMMAND,
        (event) => {
          return $onDrop(event, editor);
        },
        COMMAND_PRIORITY_HIGH,
      ),
    );
  }, [captionsEnabled, editor]);

  return null;
}

function $onDragStart(event: DragEvent): boolean {
  const node = $getImageNodeInSelection();
  if (!node) {
    return false;
  }
  const dataTransfer = event.dataTransfer;
  if (!dataTransfer) {
    return false;
  }
  dataTransfer.setData("text/plain", "_");
  const TRANSPARENT_IMAGE =
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
  const img = document.createElement("img");
  img.src = TRANSPARENT_IMAGE;
  dataTransfer.setDragImage(img, 0, 0);
  dataTransfer.setData(
    "application/x-lexical-drag",
    JSON.stringify({
      data: {
        altText: node.__altText,
        key: node.getKey(),
        src: node.__src,
      },
      type: "image",
    }),
  );

  return true;
}

function $onDragover(event: DragEvent): boolean {
  const node = $getImageNodeInSelection();
  if (!node) {
    return false;
  }
  if (!canDropImage(event)) {
    event.preventDefault();
  }
  return true;
}

function $onDrop(event: DragEvent, editor: LexicalEditor): boolean {
  const node = $getImageNodeInSelection();
  if (!node) {
    return false;
  }
  const data = getDragImageData(event);
  if (!data) {
    return false;
  }
  event.preventDefault();
  if (canDropImage(event)) {
    const range = getDragSelection(event);
    node.remove();
    const rangeSelection = $createRangeSelection();
    if (range !== null && range !== undefined) {
      rangeSelection.applyDOMRange(range);
    }
    $setSelection(rangeSelection);
    editor.dispatchCommand(INSERT_IMAGE_COMMAND, data);
  }
  return true;
}

function $getImageNodeInSelection(): ImageNode | null {
  const selection = $getSelection();
  if (!$isNodeSelection(selection)) {
    return null;
  }
  const nodes = selection.getNodes();
  const node = nodes[0];
  return $isImageNode(node) ? node : null;
}

function getDragImageData(event: DragEvent): null | InsertImagePayload {
  const dragData = event.dataTransfer?.getData("application/x-lexical-drag");
  if (!dragData) {
    return null;
  }
  const { type, data } = JSON.parse(dragData);
  if (type !== "image") {
    return null;
  }

  return data;
}

declare global {
  interface DragEvent {
    rangeOffset?: number;
    rangeParent?: Node;
  }
}

function canDropImage(event: DragEvent): boolean {
  const target = event.target;
  return !!(
    isHTMLElement(target) &&
    !target.closest("code, span.editor-image") &&
    isHTMLElement(target.parentElement) &&
    target.parentElement.closest("div.ContentEditable__root")
  );
}

function getDragSelection(event: DragEvent): Range | null | undefined {
  let range: Range | null | undefined = null;
  const domSelection = getDOMSelectionFromTarget(event.target);
  if (document.caretRangeFromPoint) {
    range = document.caretRangeFromPoint(event.clientX, event.clientY);
  } else if (event.rangeParent && domSelection !== null) {
    domSelection.collapse(event.rangeParent, event.rangeOffset || 0);
    range = domSelection.getRangeAt(0);
  } else {
    throw Error(`Cannot get the selection when dragging`);
  }

  return range;
}
