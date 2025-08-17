/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
/** biome-ignore-all lint/complexity/noFlatMapIdentity: off */

import { DRAG_DROP_PASTE } from "@lexical/rich-text";
import { isMimeType, mediaFileReader } from "@lexical/utils";
import { COMMAND_PRIORITY_LOW } from "lexical";
import { useEffect } from "react";

import { $isImageNode } from "../../nodes/ImageNode";
import { INSERT_IMAGE_COMMAND } from "../ImagesPlugin";
import { useActiveEditor, useToolbarState } from "../ToolbarPlugin/Context";

const ACCEPTABLE_IMAGE_TYPES = ["image/", "image/heic", "image/heif", "image/gif", "image/webp"];

export default function DragDropPaste(): null {
  const { activeEditor } = useActiveEditor();
  const { toolbarState } = useToolbarState();
  useEffect(() => {
    return activeEditor.registerCommand(
      DRAG_DROP_PASTE,
      (files) => {
        (async () => {
          const filesResult = await mediaFileReader(
            files,
            [ACCEPTABLE_IMAGE_TYPES].flatMap((x) => x),
          );
          for (const { file, result } of filesResult) {
            if (isMimeType(file, ACCEPTABLE_IMAGE_TYPES)) {
              // editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
              //   altText: file.name,
              //   src: result,
              // });
              activeEditor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                src: result,
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
            }
          }
        })();
        return true;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [activeEditor, toolbarState.onUploadImage]);
  return null;
}
