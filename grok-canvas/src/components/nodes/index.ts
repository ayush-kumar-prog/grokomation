import TextInputNode from './TextInputNode';
import ImageInputNode from './ImageInputNode';
import TextCompletionNode from './TextCompletionNode';
import PhoneNode from './PhoneNode';
import IconNode from './IconNode';

export const nodeTypes = {
  textInput: TextInputNode,
  imageInput: IconNode,
  textCompletion: TextCompletionNode,
  phone: PhoneNode,
  reasoning: IconNode,
  webSearch: IconNode,
  xFetch: IconNode,
  vision: IconNode,
  codeExecution: IconNode,
};
