import TextInputNode from './TextInputNode';
import ImageInputNode from './ImageInputNode';
import TextCompletionNode from './TextCompletionNode';
import PhoneNode from './PhoneNode';
import IconNode from './IconNode';
import XFetchNode from './XFetchNode';
import XDMNode from './XDMNode';

export const nodeTypes = {
  textInput: TextInputNode,
  imageInput: IconNode,
  textCompletion: TextCompletionNode,
  phone: PhoneNode,
  reasoning: IconNode,
  webSearch: IconNode,
  xFetch: XFetchNode,
  xDM: XDMNode,
  vision: IconNode,
  codeExecution: IconNode,
};
