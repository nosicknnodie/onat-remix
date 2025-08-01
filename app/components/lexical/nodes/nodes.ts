import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode"; // 또는 @lexical/hr 사용
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ImageNode } from "./ImageNode";
import { YouTubeNode } from "./YouTubeNode";
export const nodes = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  CodeNode,
  CodeHighlightNode,
  HorizontalRuleNode,
  AutoLinkNode,
  LinkNode,
  ImageNode,
  YouTubeNode,
];
