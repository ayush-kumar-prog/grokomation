import TextInputNode from './TextInputNode';
import ImageInputNode from './ImageInputNode';
import TextCompletionNode from './TextCompletionNode';
import VisionNode from './VisionNode';
import ReasoningNode from './ReasoningNode';
import WebSearchNode from './WebSearchNode';
import XSearchNode from './XSearchNode';
import CodeExecutionNode from './CodeExecutionNode';
import OutputNode from './OutputNode';
import PostToXNode from './PostToXNode';

export const nodeTypes = {
  textInput: TextInputNode,
  imageInput: ImageInputNode,
  textCompletion: TextCompletionNode,
  vision: VisionNode,
  reasoning: ReasoningNode,
  webSearch: WebSearchNode,
  xSearch: XSearchNode,
  codeExecution: CodeExecutionNode,
  output: OutputNode,
  postToX: PostToXNode,
};
