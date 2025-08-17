import { DecoratorNode, type NodeKey, type SerializedLexicalNode, type Spread } from "lexical";
import type { JSX } from "react";
import NodeImage from "../components/NodeImage";

export interface ImagePayload {
  key?: NodeKey;
  src: string;
  altText?: string;
  imageId?: string;
  sourceType?: "upload" | "external";
  uploadState?: "pending" | "error" | "success";
}

export type SerializedImageNode = Spread<
  {
    src: string;
    altText?: string;
    imageId?: string;
    sourceType?: "upload" | "external";
  },
  SerializedLexicalNode
>;

export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __altText?: string;
  __imageId?: string;
  __sourceType?: "upload" | "external";
  __uploadState?: "pending" | "error" | "success";

  static getType(): string {
    return "image";
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__imageId,
      node.__sourceType,
      node.__key,
      node.__uploadState,
    );
  }

  constructor(
    src: string,
    altText?: string,
    imageId?: string,
    sourceType?: "upload" | "external",
    key?: string,
    uploadState?: "pending" | "error" | "success",
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__imageId = imageId;
    this.__sourceType = sourceType;
    this.__uploadState = uploadState;
  }

  exportJSON(): SerializedImageNode {
    return {
      type: "image",
      version: 1,
      src: this.__src,
      altText: this.__altText,
      imageId: this.__imageId,
      sourceType: this.__sourceType,
    };
  }

  static importJSON(json: SerializedImageNode): ImageNode {
    return new ImageNode(json.src, json.altText, json.imageId, json.sourceType, undefined);
  }

  createDOM(): HTMLElement {
    // const img = document.createElement("img");
    // img.src = this.__src;
    // if (this.__altText) img.alt = this.__altText;
    return document.createElement("div");
  }

  updateDOM(): boolean {
    return false;
  }

  decorate(): JSX.Element {
    return (
      <NodeImage
        src={this.__src}
        alt={this.__altText || ""}
        className="max-w-full h-auto rounded"
        state={this.__uploadState}
      />
    );
  }
}

export function $createImageNode(args: {
  src: string;
  altText?: string;
  imageId?: string;
  sourceType?: "upload" | "external";
  uploadState?: "pending" | "error" | "success";
}): ImageNode {
  return new ImageNode(
    args.src,
    args.altText,
    args.imageId,
    args.sourceType,
    undefined,
    args.uploadState,
  );
}

export function $isImageNode(node: unknown): node is ImageNode {
  return node instanceof ImageNode;
}
