#### Guides

# Responses API

The Responses API is the preferred way of interacting with our models via API. It allows optional **stateful interactions** with our models,
where **previous input prompts, reasoning content and model responses are saved by us**. You can continue the interaction by appending new
prompt messages instead of resending the full conversation. This behavior is on by default. If you would like to store your request/response locally, please see [Disable storing previous request/response on server](#disable-storing-previous-requestresponse-on-server).

Although you don't need to enter the conversation history in the request body, you will still be
billed for the entire conversation history when using Responses API. The cost might be reduced as
part of the conversation history is .

**The responses will be stored for 30 days, after which they will be removed. This means you can use the response ID to retrieve or continue a conversation within 30 days of sending the request.**
If you want to continue a conversation after 30 days, please store your responses history and the encrypted thinking content locally, and pass them in a new request body.

## Prerequisites

* xAI Account: You need an xAI account to access the API.
* API Key: Ensure that your API key has access to the Responses API endpoint and the model you want to use is enabled.

If you don't have these and are unsure of how to create one, follow [the Hitchhiker's Guide to Grok](../tutorial).

You can create an API key on the [xAI Console API Keys Page](https://console.x.ai/team/default/api-keys).

Set your API key in your environment:

```bash
export XAI_API_KEY="your_api_key"
```

## Creating a new model response

The first step in using Responses API is analogous to using the legacy Chat Completions API. You will create a new response with prompts. By default, your request/response history is stored on our server.

`instructions` parameter is currently not supported. The API will return an error if it is specified.

The `developer` role is supported as an alias for `system`. Only a **single** system/developer message should be used, and it should always be the **first message** in your conversation.

### Disable storing previous request/response on server

If you do not want to store your previous request/response on the server, you can set `store: false` on the request.

### Returning encrypted thinking content

If you want to return the encrypted thinking traces, you need to specify `use_encrypted_content=True` in xAI SDK or gRPC request message, or `include: ["reasoning.encrypted_content"]` in the request body.

Modify the steps to create a chat client (xAI SDK) or change the request body as following:

See [Adding encrypted thinking content](#adding-encrypted-thinking-content) on how to use the returned encrypted thinking content when making a new request.

## Image understanding

When sending images, it is advised to not store request/response history on the server. Otherwise the request may fail.
See .

Some models allow image in the input. The model will consider the image context, when generating the response.

## Constructing the message body - difference from text-only prompt

The request message to image understanding is similar to text-only prompt. The main difference is that instead of text input:

```json
[
  {
    "role": "user",
    "content": "What is in this image?"
  }
]
```

We send in `content` as a list of objects:

```json
[
  {
    "role": "user",
    "content": [
      {
        "type": "input_image",
        "image_url": "data:image/jpeg;base64,<base64_image_string>",
        "detail": "high"
      },
      {
        "type": "input_text",
        "text": "What is in this image?"
      }
    ]
  }
]
```

The `image_url.url` can also be the image's url on the Internet.

### Image understanding example

### Image input general limits

* Maximum image size: `20MiB`
* Maximum number of images: No limit
* Supported image file types: `jpg/jpeg` or `png`.
* Any image/text input order is accepted (e.g. text prompt can precede image prompt)

### Image detail levels

The `"detail"` field controls the level of pre-processing applied to the image that will be provided to the model. It is optional and determines the resolution at which the image is processed. The possible values for `"detail"` are:

* **`"auto"`**: The system will automatically determine the image resolution to use. This is the default setting, balancing speed and detail based on the model's assessment.
* **`"low"`**: The system will process a low-resolution version of the image. This option is faster and consumes fewer tokens, making it more cost-effective, though it may miss finer details.
* **`"high"`**: The system will process a high-resolution version of the image. This option is slower and more expensive in terms of token usage, but it allows the model to attend to more nuanced details in the image.

## Chaining the conversation

We now have the `id` of the first response. With Chat Completions API, we typically send a stateless new request with all the previous messages.

With Responses API, we can send the `id` of the previous response, and the new messages to append to it.

### Adding encrypted thinking content

After returning the encrypted thinking content, you can also add it to a new response's input:

## Retrieving a previous model response

If you have a previous response's ID, you can retrieve the content of the response.

## Delete a model response

If you no longer want to store the previous model response, you can delete it.


#### Guides

# Reasoning

`presencePenalty`, `frequencyPenalty` and `stop` parameters are not supported by reasoning models.
Adding them in the request would result in an error.

## Key Features

* **Think Before Responding**: Thinks through problems step-by-step before delivering an answer.
* **Math & Quantitative Strength**: Excels at numerical challenges and logic puzzles.
* **Reasoning Trace**: Usage metrics expose `reasoning_tokens`. Some models can also return encrypted reasoning via `include: ["reasoning.encrypted_content"]` (see below).

In Chat Completions, only `grok-3-mini` returns `message.reasoning_content`.

`grok-3`, `grok-4` and `grok-4-fast-reasoning` do not return `reasoning_content`. If supported, you can request [encrypted reasoning content](#encrypted-reasoning-content) via `include: ["reasoning.encrypted_content"]` in the Responses API instead.

### Encrypted Reasoning Content

For `grok-4`, the reasoning content is encrypted by us and can be returned if you pass `include: ["reasoning.encrypted_content"]` to the Responses API. You can send the encrypted content back to provide more context to a previous conversation. See [Adding encrypted thinking content](chat#adding-encrypted-thinking-content) for more details on how to use the content.

## Control how hard the model thinks

`reasoning_effort` is not supported by `grok-3`, `grok-4` and `grok-4-fast-reasoning`. Specifying `reasoning_effort` parameter will get
an error response. Only `grok-3-mini` supports `reasoning_effort`.

The `reasoning_effort` parameter controls how much time the model spends thinking before responding. It must be set to one of these values:

* **`low`**: Minimal thinking time, using fewer tokens for quick responses.
* **`high`**: Maximum thinking time, leveraging more tokens for complex problems.

Choosing the right level depends on your task: use `low` for simple queries that should complete quickly, and `high` for harder problems where response latency is less important.

## Usage Example

Here’s a simple example using `grok-3-mini` to multiply 101 by 3.

```pythonXAI
import os

from xai_sdk import Client
from xai_sdk.chat import system, user

client = Client(
    api_key=os.getenv("XAI_API_KEY"),
    timeout=3600, # Override default timeout with longer timeout for reasoning models
)

chat = client.chat.create(
    model="grok-3-mini",
    reasoning_effort="high",
    messages=[system("You are a highly intelligent AI assistant.")],
)
chat.append(user("What is 101\*3?"))

response = chat.sample()

print("Final Response:")
print(response.content)

print("Number of completion tokens:")
print(response.usage.completion_tokens)

print("Number of reasoning tokens:")
print(response.usage.reasoning_tokens)
```

```pythonOpenAISDK
import os
import httpx
from openai import OpenAI

client = OpenAI(
    base_url="https://api.x.ai/v1",
    api_key=os.getenv("XAI_API_KEY"),
    timeout=httpx.Timeout(3600.0), # Override default timeout with longer timeout for reasoning models
)

response = client.responses.create(
    model="grok-3-mini",
    reasoning={"effort": "high"},
    input=[
        {"role": "system", "content": "You are a highly intelligent AI assistant."},
        {"role": "user", "content": "What is 101*3?"},
    ],
)

message = next(item for item in response.output if item.type == "message")
text = next(c.text for c in message.content if c.type == "output_text")

print("Final Response:")
print(text)

print("Number of output tokens:")
print(response.usage.output_tokens)

print("Number of reasoning tokens:")
print(response.usage.output_tokens_details.reasoning_tokens)
```

```javascriptOpenAISDK
import OpenAI from "openai";

const client = new OpenAI({
    apiKey: "<api key>",
    baseURL: "https://api.x.ai/v1",
    timeout: 360000, // Override default timeout with longer timeout for reasoning models
});

const response = await client.responses.create({
    model: "grok-3-mini",
    reasoning: { effort: "high" },
    input: [
        {
            "role": "system",
            "content": "You are a highly intelligent AI assistant.",
        },
        {
            "role": "user",
            "content": "What is 101*3?",
        },
    ],
});

// Find the message in the output array
const message = response.output.find((item) => item.type === "message");
const textContent = message?.content?.find((c) => c.type === "output_text");

console.log("\\nFinal Response:", textContent?.text);

console.log("\\nNumber of output tokens:", response.usage.output_tokens);

console.log("\\nNumber of reasoning tokens:", response.usage.output_tokens_details.reasoning_tokens);
```

```javascriptAISDK
import { xai } from '@ai-sdk/xai';
import { generateText } from 'ai';

const result = await generateText({
  model: xai.responses('grok-3-mini'),
  system: 'You are a highly intelligent AI assistant.',
  prompt: 'What is 101*3?',
});

console.log('Final Response:', result.text);
console.log('Number of completion tokens:', result.totalUsage.completionTokens);
console.log('Number of reasoning tokens:', result.totalUsage.reasoningTokens);
```

```bash
curl https://api.x.ai/v1/responses \\
-H "Content-Type: application/json" \\
-H "Authorization: Bearer $XAI_API_KEY" \\
-m 3600 \\
-d '{
    "input": [
        {
            "role": "system",
            "content": "You are a highly intelligent AI assistant."
        },
        {
            "role": "user",
            "content": "What is 101*3?"
        }
    ],
    "model": "grok-3-mini",
    "reasoning": { "effort": "high" },
    "stream": false
}'
```

### Sample Output

```output

Final Response:
The result of 101 multiplied by 3 is 303.

Number of completion tokens:
14

Number of reasoning tokens:
310
```

## Notes on Consumption

When you use a reasoning model, the reasoning tokens are also added to your final consumption amount. The reasoning token consumption will likely increase when you use a higher `reasoning_effort` setting.

#### Guides

# Search Tools

Agentic search represents one of the most compelling applications of agentic tool calling, with `grok-4-1-fast` specifically trained to excel in this domain. Leveraging its speed and reasoning capabilities, the model iteratively calls search tools—analyzing responses and making follow-up queries as needed—to seamlessly navigate web pages and X posts, uncovering difficult-to-find information or insights that would otherwise require extensive human analysis.

**xAI Python SDK Users**: Version 1.3.1 of the xai-sdk package is required to use the agentic tool calling API.

## Available Search Tools

You can use the following server-side search tools in your request:

* **Web Search** - allows the agent to search the web and browse pages
* **X Search** - allows the agent to perform keyword search, semantic search, user search, and thread fetch on X

You can customize which tools are enabled in a given request by listing the needed tools in the `tools` parameter in the request.

| Tool | xAI SDK | OpenAI Responses API |
|------|---------|----------------------|
| Web Search | `web_search` | `web_search` |
| X Search | `x_search` | `x_search` |

## Retrieving Citations

The search tools provide two types of citation information:

* **All Citations** (`response.citations`): A list of all source URLs encountered during the search process. Always returned by default.
* **Inline Citations** (`response.inline_citations`): Markdown-style links (e.g., `[[1]](https://x.ai/news)`) embedded directly into the response text at the points where the model references sources, with structured metadata available. Must be explicitly enabled.

### All Citations

Access the complete list of encountered sources via `response.citations`. This is always returned by default.

Note that not every URL will necessarily be referenced in the final answer—the agent may examine sources and determine they aren't relevant.

```pythonXAI
import os

from xai_sdk import Client
from xai_sdk.chat import user
from xai_sdk.tools import web_search

client = Client(api_key=os.getenv("XAI_API_KEY"))
chat = client.chat.create(
    model="grok-4-1-fast",  # reasoning model
    tools=[web_search()],
    include=["verbose_streaming"],
)

chat.append(user("What is xAI?"))

is_thinking = True
for response, chunk in chat.stream():
    # View the server-side tool calls as they are being made in real-time
    for tool_call in chunk.tool_calls:
        print(f"\\nCalling tool: {tool_call.function.name} with arguments: {tool_call.function.arguments}")
    if response.usage.reasoning_tokens and is_thinking:
        print(f"\\rThinking... ({response.usage.reasoning_tokens} tokens)", end="", flush=True)
    if chunk.content and is_thinking:
        print("\\n\\nFinal Response:")
        is_thinking = False
    if chunk.content and not is_thinking:
        print(chunk.content, end="", flush=True)

print("\\n\\nCitations:")
print(response.citations)
print("\\n\\nUsage:")
print(response.usage)
print(response.server_side_tool_usage)
print("\\n\\nServer Side Tool Calls:")
print(response.tool_calls)
```

```pythonOpenAISDK
import os
from openai import OpenAI

api_key = os.getenv("XAI_API_KEY")
client = OpenAI(
    api_key=api_key,
    base_url="https://api.x.ai/v1",
)

response = client.responses.create(
    model="grok-4-1-fast",
    input=[
        {
            "role": "user",
            "content": "What is xAI?",
        },
    ],
    tools=[
        {
            "type": "web_search",
        },
    ],
)

# Access the response
print(response)
```

```pythonRequests
import os
import requests

url = "https://api.x.ai/v1/responses"
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {os.getenv('XAI_API_KEY')}"
}
payload = {
    "model": "grok-4-1-fast",
    "input": [
        {
            "role": "user",
            "content": "What is xAI?"
        }
    ],
    "tools": [
        {
            "type": "web_search",
        }
    ]
}
response = requests.post(url, headers=headers, json=payload)

# Access the citations of the final response
print(response.json())
```

```javascriptAISDK
import { xai } from '@ai-sdk/xai';
import { generateText } from 'ai';

const { text, sources } = await generateText({
  model: xai.responses('grok-4-fast'),
  prompt: 'What is xAI?',
  tools: {
    web_search: xai.tools.webSearch(),
  },
});

console.log(text);

// Access citations from sources
console.log('Citations:', sources);
```

```bash
curl https://api.x.ai/v1/responses \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $XAI_API_KEY" \\
  -d '{
  "model": "grok-4-1-fast",
  "input": [
    {
      "role": "user",
      "content": "What is xAI?"
    }
  ],
  "tools": [
    {
      "type": "web_search"
    }
  ]
}'
```

### Inline Citations

To get citations embedded directly in the response text with position tracking, enable inline citations:

```pythonXAI
import os

from xai_sdk import Client
from xai_sdk.chat import user
from xai_sdk.tools import web_search

client = Client(api_key=os.getenv("XAI_API_KEY"))
chat = client.chat.create(
    model="grok-4-1-fast",
    include=["inline_citations"],  # Enable inline citations
    tools=[web_search()],
)

chat.append(user("What are the latest updates from xAI?"))
response = chat.sample()

# Response text contains markdown citations like [[1]](url)
print(response.content)

# Access structured citation data
for citation in response.inline_citations:
    if citation.HasField("web_citation"):
        print(f"[{citation.id}] {citation.web_citation.url}")
```

When enabled, the response text will contain citations like:

> The latest announcements from xAI date back to November 19, 2025.[\[1\]](https://x.ai/news/)[\[2\]](https://x.ai/)

Enabling inline citations does not guarantee the model will cite sources on every answer—the model decides when citations are appropriate based on the query.

For complete details on citations, including the `InlineCitation` object structure, position indices, and streaming behavior, see the [Citations section](/docs/guides/tools/overview#citations) in the overview.

## Applying Search Filters to Control Agentic Search

Each search tool supports a set of optional search parameters to help you narrow down the search space and limit the sources/information the agent is exposed to during its search process.

| Tool | Supported Filter Parameters |
|------|-----------------------------|
| Web Search | `allowed_domains`, `excluded_domains`, `enable_image_understanding` |
| X Search | `allowed_x_handles`, `excluded_x_handles`, `from_date`, `to_date`, `enable_image_understanding`, `enable_video_understanding`|

### Web Search Parameters

##### Only Search in Specific Domains

Use `allowed_domains` to make the web search **only** perform the search and web browsing on web pages that fall within the specified domains.

`allowed_domains` can include a maximum of five domains.

`allowed_domains` cannot be set together with `excluded_domains` in the same request.

```pythonXAI
import os

from xai_sdk import Client
from xai_sdk.chat import user
from xai_sdk.tools import web_search

client = Client(api_key=os.getenv("XAI_API_KEY"))
chat = client.chat.create(
    model="grok-4-1-fast",  # reasoning model
    tools=[
        web_search(allowed_domains=["wikipedia.org"]),
    ],
)

chat.append(user("What is xAI?"))

# stream or sample the response...
```

```pythonOpenAISDK
import os
from openai import OpenAI

api_key = os.getenv("XAI_API_KEY")
client = OpenAI(
    api_key=api_key,
    base_url="https://api.x.ai/v1",
)

response = client.responses.create(
    model="grok-4-1-fast",
    input=[
        {
            "role": "user",
            "content": "What is xAI?",
        },
    ],
    tools=[
        {
            "type": "web_search",
            "filters": {"allowed_domains": ["wikipedia.org"]},
        },
    ],
)

print(response)
```

```pythonRequests
import os
import requests

url = "https://api.x.ai/v1/responses"
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {os.getenv('XAI_API_KEY')}"
}
payload = {
    "model": "grok-4-1-fast",
    "input": [
        {
            "role": "user",
            "content": "What is xAI?"
        }
    ],
    "tools": [
        {
            "type": "web_search",
            "filters": {"allowed_domains": ["wikipedia.org"]},
        }
    ]
}
response = requests.post(url, headers=headers, json=payload)
print(response.json())
```

```bash
curl https://api.x.ai/v1/responses \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $XAI_API_KEY" \\
  -d '{
  "model": "grok-4-1-fast",
  "input": [
    {
      "role": "user",
      "content": "What is xAI?"
    }
  ],
  "tools": [
    {
      "type": "web_search",
      "filters": {"allowed_domains": ["wikipedia.org"]}
    }
  ]
}'
```

```javascriptAISDK
import { xai } from '@ai-sdk/xai';
import { generateText } from 'ai';

const { text, sources } = await generateText({
  model: xai.responses('grok-4-fast'),
  prompt: 'What is xAI?',
  tools: {
    web_search: xai.tools.webSearch({
      allowedDomains: ['wikipedia.org'],
    }),
  },
});

console.log(text);
```

##### Exclude Specific Domains

Use `excluded_domains` to prevent the model from including the specified domains in any web search tool invocations and from browsing any pages on those domains.

`excluded_domains` can include a maximum of five domains.

`excluded_domains` cannot be set together with `allowed_domains` in the same request.

```pythonXAI
import os

from xai_sdk import Client
from xai_sdk.chat import user
from xai_sdk.tools import web_search

client = Client(api_key=os.getenv("XAI_API_KEY"))
chat = client.chat.create(
    model="grok-4-1-fast",  # reasoning model
    tools=[
        web_search(excluded_domains=["wikipedia.org"]),
    ],
)

chat.append(user("What is xAI?"))

# stream or sample the response...
```

```pythonOpenAISDK
import os
from openai import OpenAI

api_key = os.getenv("XAI_API_KEY")
client = OpenAI(
    api_key=api_key,
    base_url="https://api.x.ai/v1",
)

response = client.responses.create(
    model="grok-4-1-fast",
    input=[
        {
            "role": "user",
            "content": "What is xAI?",
        },
    ],
    tools=[
        {
            "type": "web_search",
            "filters": {"excluded_domains": ["wikipedia.org"]},
        },
    ],
)

print(response)
```

```pythonRequests
import os
import requests

url = "https://api.x.ai/v1/responses"
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {os.getenv('XAI_API_KEY')}"
}
payload = {
    "model": "grok-4-1-fast",
    "input": [
        {
            "role": "user",
            "content": "What is xAI?"
        }
    ],
    "tools": [
        {
            "type": "web_search",
            "filters": {"excluded_domains": ["wikipedia.org"]},
        }
    ]
}
response = requests.post(url, headers=headers, json=payload)
print(response.json())
```

```bash
curl https://api.x.ai/v1/responses \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $XAI_API_KEY" \\
  -d '{
  "model": "grok-4-1-fast",
  "input": [
    {
      "role": "user",
      "content": "What is xAI?"
    }
  ],
  "tools": [
    {
      "type": "web_search",
      "filters": {"excluded_domains": ["wikipedia.org"]}
    }
  ]
}'
```

```javascriptAISDK
import { xai } from '@ai-sdk/xai';
import { generateText } from 'ai';

const { text, sources } = await generateText({
  model: xai.responses('grok-4-fast'),
  prompt: 'What is xAI?',
  tools: {
    web_search: xai.tools.webSearch({
      excludedDomains: ['wikipedia.org'],
    }),
  },
});

console.log(text);
```

##### Enable Image Understanding

Setting `enable_image_understanding` to true equips the agent with access to the `view_image` tool, allowing it to invoke this tool on any image URLs encountered during the search process. The model can then interpret and analyze image contents, incorporating this visual information into its context to potentially influence the trajectory of follow-up tool calls.

When the model invokes this tool, you will see it as an entry in `chunk.tool_calls` and `response.tool_calls` with the `image_url` as a parameter. Additionally, `SERVER_SIDE_TOOL_VIEW_IMAGE` will appear in `response.server_side_tool_usage` along with the number of times it was called when using the xAI Python SDK.

Note that enabling this feature increases token usage, as images are processed and represented as image tokens in the model's context.

Enabling this parameter for Web Search will also enable the image understanding for X Search tool if it's also included in the request.

```pythonXAI
import os

from xai_sdk import Client
from xai_sdk.chat import user
from xai_sdk.tools import web_search

client = Client(api_key=os.getenv("XAI_API_KEY"))
chat = client.chat.create(
    model="grok-4-1-fast",  # reasoning model
    tools=[
        web_search(enable_image_understanding=True),
    ],
)

chat.append(user("What is included in the image in xAI's official website?"))

# stream or sample the response...
```

```pythonOpenAISDK
import os
from openai import OpenAI

api_key = os.getenv("XAI_API_KEY")
client = OpenAI(
    api_key=api_key,
    base_url="https://api.x.ai/v1",
)

response = client.responses.create(
    model="grok-4-1-fast",
    input=[
        {
            "role": "user",
            "content": "What is included in the image in xAI's official website?",
        },
    ],
    tools=[
        {
            "type": "web_search",
            "enable_image_understanding": True,
        },
    ],
)

print(response)
```

```pythonRequests
import os
import requests

url = "https://api.x.ai/v1/responses"
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {os.getenv('XAI_API_KEY')}"
}
payload = {
    "model": "grok-4-1-fast",
    "input": [
        {
            "role": "user",
            "content": "What is included in the image in xAI's official website?"
        }
    ],
    "tools": [
        {
            "type": "web_search",
            "enable_image_understanding": True,
        }
    ]
}
response = requests.post(url, headers=headers, json=payload)
print(response.json())
```

```bash
curl https://api.x.ai/v1/responses \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $XAI_API_KEY" \\
  -d '{
  "model": "grok-4-1-fast",
  "input": [
    {
      "role": "user",
      "content": "What is included in the image in xAI's official website?"
    }
  ],
  "tools": [
    {
      "type": "web_search",
      "enable_image_understanding": true
    }
  ]
}'
```

```javascriptAISDK
import { xai } from '@ai-sdk/xai';
import { generateText } from 'ai';

const { text, sources } = await generateText({
  model: xai.responses('grok-4-fast'),
  prompt: "What is included in the image in xAI's official website?",
  tools: {
    web_search: xai.tools.webSearch({
      enableImageUnderstanding: true,
    }),
  },
});

console.log(text);
```

### X Search Parameters

##### Only Consider X Posts from Specific Handles

Use `allowed_x_handles` to consider X posts only from a given list of X handles. The maximum number of handles you can include is 10.

`allowed_x_handles` cannot be set together with `excluded_x_handles` in the same request.

```pythonXAI
import os

from xai_sdk import Client
from xai_sdk.chat import user
from xai_sdk.tools import x_search

client = Client(api_key=os.getenv("XAI_API_KEY"))
chat = client.chat.create(
    model="grok-4-1-fast",  # reasoning model
    tools=[
        x_search(allowed_x_handles=["elonmusk"]),
    ],
)

chat.append(user("What is the current status of xAI?"))

# stream or sample the response...
```

```pythonOpenAISDK
import os
from openai import OpenAI

api_key = os.getenv("XAI_API_KEY")
client = OpenAI(
    api_key=api_key,
    base_url="https://api.x.ai/v1",
)

response = client.responses.create(
    model="grok-4-1-fast",
    input=[
        {
            "role": "user",
            "content": "What is the current status of xAI?",
        },
    ],
    tools=[
        {
            "type": "x_search",
            "allowed_x_handles": ["elonmusk"],
        },
    ],
)

print(response)
```

```pythonRequests
import os
import requests

url = "https://api.x.ai/v1/responses"
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {os.getenv('XAI_API_KEY')}"
}
payload = {
    "model": "grok-4-1-fast",
    "input": [
        {
            "role": "user",
            "content": "What is the current status of xAI?"
        }
    ],
    "tools": [
        {
            "type": "x_search",
            "allowed_x_handles": ["elonmusk"],
        }
    ]
}
response = requests.post(url, headers=headers, json=payload)
print(response.json())
```

```bash
curl https://api.x.ai/v1/responses \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $XAI_API_KEY" \\
  -d '{
  "model": "grok-4-1-fast",
  "input": [
    {
      "role": "user",
      "content": "What is the current status of xAI?"
    }
  ],
  "tools": [
    {
      "type": "x_search",
      "allowed_x_handles": ["elonmusk"]
    }
  ]
}'
```

```javascriptAISDK
import { xai } from '@ai-sdk/xai';
import { generateText } from 'ai';

const { text, sources } = await generateText({
  model: xai.responses('grok-4-fast'),
  prompt: 'What is the current status of xAI?',
  tools: {
    x_search: xai.tools.xSearch({
      allowedXHandles: ['elonmusk'],
    }),
  },
});

console.log(text);
```

##### Exclude X Posts from Specific Handles

Use `excluded_x_handles` to prevent the model from including X posts from the specified handles in any X search tool invocations. The maximum number of handles you can exclude is 10.

`excluded_x_handles` cannot be set together with `allowed_x_handles` in the same request.

```pythonXAI
import os

from xai_sdk import Client
from xai_sdk.chat import user
from xai_sdk.tools import x_search

client = Client(api_key=os.getenv("XAI_API_KEY"))
chat = client.chat.create(
    model="grok-4-1-fast",  # reasoning model
    tools=[
        x_search(excluded_x_handles=["elonmusk"]),
    ],
)

chat.append(user("What is the current status of xAI?"))

# stream or sample the response...
```

```pythonOpenAISDK
import os
from openai import OpenAI

api_key = os.getenv("XAI_API_KEY")
client = OpenAI(
    api_key=api_key,
    base_url="https://api.x.ai/v1",
)

response = client.responses.create(
    model="grok-4-1-fast",
    input=[
        {
            "role": "user",
            "content": "What is the current status of xAI?",
        },
    ],
    tools=[
        {
            "type": "x_search",
            "excluded_x_handles": ["elonmusk"],
        },
    ],
)

print(response)
```

```pythonRequests
import os
import requests

url = "https://api.x.ai/v1/responses"
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {os.getenv('XAI_API_KEY')}"
}
payload = {
    "model": "grok-4-1-fast",
    "input": [
        {
            "role": "user",
            "content": "What is the current status of xAI?"
        }
    ],
    "tools": [
        {
            "type": "x_search",
            "excluded_x_handles": ["elonmusk"],
        }
    ]
}
response = requests.post(url, headers=headers, json=payload)
print(response.json())
```

```bash
curl https://api.x.ai/v1/responses \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $XAI_API_KEY" \\
  -d '{
  "model": "grok-4-1-fast",
  "input": [
    {
      "role": "user",
      "content": "What is the current status of xAI?"
    }
  ],
  "tools": [
    {
      "type": "x_search",
      "excluded_x_handles": ["elonmusk"]
    }
  ]
}'
```

```javascriptAISDK
import { xai } from '@ai-sdk/xai';
import { generateText } from 'ai';

const { text, sources } = await generateText({
  model: xai.responses('grok-4-fast'),
  prompt: 'What is the current status of xAI?',
  tools: {
    x_search: xai.tools.xSearch({
      excludedXHandles: ['elonmusk'],
    }),
  },
});

console.log(text);
```

##### Date Range

You can restrict the date range of search data used by specifying `from_date` and `to_date`. This limits the data to the period from
`from_date` to `to_date`, including both dates.

Both fields need to be in ISO8601 format, e.g., "YYYY-MM-DD". If you're using the xAI Python SDK, the
`from_date` and `to_date` fields can be passed as `datetime.datetime` objects.

The fields can also be used independently. With only `from_date` specified, the data used will be from the
`from_date` to today, and with only `to_date` specified, the data used will be all data until the `to_date`.

```pythonXAI
import os
from datetime import datetime

from xai_sdk import Client
from xai_sdk.chat import user
from xai_sdk.tools import x_search

client = Client(api_key=os.getenv("XAI_API_KEY"))
chat = client.chat.create(
    model="grok-4-1-fast",  # reasoning model
    tools=[
        x_search(
            from_date=datetime(2025, 10, 1),
            to_date=datetime(2025, 10, 10),
        ),
    ],
)

chat.append(user("What is the current status of xAI?"))

# stream or sample the response...
```

```pythonOpenAISDK
import os
from openai import OpenAI

api_key = os.getenv("XAI_API_KEY")
client = OpenAI(
    api_key=api_key,
    base_url="https://api.x.ai/v1",
)

response = client.responses.create(
    model="grok-4-1-fast",
    input=[
        {
            "role": "user",
            "content": "What is the current status of xAI?",
        },
    ],
    tools=[
        {
            "type": "x_search",
            "from_date": "2025-10-01",
            "to_date": "2025-10-10",
        },
    ],
)

print(response)
```

```pythonRequests
import os
import requests

url = "https://api.x.ai/v1/responses"
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {os.getenv('XAI_API_KEY')}"
}
payload = {
    "model": "grok-4-1-fast",
    "input": [
        {
            "role": "user",
            "content": "What is the current status of xAI?"
        }
    ],
    "tools": [
        {
            "type": "x_search",
            "from_date": "2025-10-01",
            "to_date": "2025-10-10",
        }
    ]
}
response = requests.post(url, headers=headers, json=payload)
print(response.json())
```

```bash
curl https://api.x.ai/v1/responses \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $XAI_API_KEY" \\
  -d '{
  "model": "grok-4-1-fast",
  "input": [
    {
      "role": "user",
      "content": "What is the current status of xAI?"
    }
  ],
  "tools": [
    {
      "type": "x_search",
      "from_date": "2025-10-01",
      "to_date": "2025-10-10"
    }
  ]
}'
```

```javascriptAISDK
import { xai } from '@ai-sdk/xai';
import { generateText } from 'ai';

const { text, sources } = await generateText({
  model: xai.responses('grok-4-fast'),
  prompt: 'What is the current status of xAI?',
  tools: {
    x_search: xai.tools.xSearch({
      fromDate: '2025-10-01',
      toDate: '2025-10-10',
    }),
  },
});

console.log(text);
```

##### Enable Image Understanding

Setting `enable_image_understanding` to true equips the agent with access to the `view_image` tool, allowing it to invoke this tool on any image URLs encountered during the search process. The model can then interpret and analyze image contents, incorporating this visual information into its context to potentially influence the trajectory of follow-up tool calls.

When the model invokes this tool, you will see it as an entry in `chunk.tool_calls` and `response.tool_calls` with the `image_url` as a parameter. Additionally, `SERVER_SIDE_TOOL_VIEW_IMAGE` will appear in `response.server_side_tool_usage` along with the number of times it was called when using the xAI Python SDK.

Note that enabling this feature increases token usage, as images are processed and represented as image tokens in the model's context.

Enabling this parameter for X Search will also enable the image understanding for Web Search tool if it's also included in the request.

```pythonXAI
import os

from xai_sdk import Client
from xai_sdk.chat import user
from xai_sdk.tools import x_search

client = Client(api_key=os.getenv("XAI_API_KEY"))
chat = client.chat.create(
    model="grok-4-1-fast",  # reasoning model
    tools=[
        x_search(enable_image_understanding=True),
    ],
)

chat.append(user("What images are being shared in recent xAI posts?"))

# stream or sample the response...
```

```pythonOpenAISDK
import os
from openai import OpenAI

api_key = os.getenv("XAI_API_KEY")
client = OpenAI(
    api_key=api_key,
    base_url="https://api.x.ai/v1",
)

response = client.responses.create(
    model="grok-4-1-fast",
    input=[
        {
            "role": "user",
            "content": "What images are being shared in recent xAI posts?",
        },
    ],
    tools=[
        {
            "type": "x_search",
            "enable_image_understanding": True,
        },
    ],
)

print(response)
```

```pythonRequests
import os
import requests

url = "https://api.x.ai/v1/responses"
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {os.getenv('XAI_API_KEY')}"
}
payload = {
    "model": "grok-4-1-fast",
    "input": [
        {
            "role": "user",
            "content": "What images are being shared in recent xAI posts?"
        }
    ],
    "tools": [
        {
            "type": "x_search",
            "enable_image_understanding": True,
        }
    ]
}
response = requests.post(url, headers=headers, json=payload)
print(response.json())
```

```bash
curl https://api.x.ai/v1/responses \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $XAI_API_KEY" \\
  -d '{
  "model": "grok-4-1-fast",
  "input": [
    {
      "role": "user",
      "content": "What images are being shared in recent xAI posts?"
    }
  ],
  "tools": [
    {
      "type": "x_search",
      "enable_image_understanding": true
    }
  ]
}'
```

```javascriptAISDK
import { xai } from '@ai-sdk/xai';
import { generateText } from 'ai';

const { text, sources } = await generateText({
  model: xai.responses('grok-4-fast'),
  prompt: 'What images are being shared in recent xAI posts?',
  tools: {
    x_search: xai.tools.xSearch({
      enableImageUnderstanding: true,
    }),
  },
});

console.log(text);
```

##### Enable Video Understanding

Setting `enable_video_understanding` to true equips the agent with access to the `view_x_video` tool, allowing it to invoke this tool on any video URLs encountered in X posts during the search process. The model can then analyze video content, incorporating this information into its context to potentially influence the trajectory of follow-up tool calls.

When the model invokes this tool, you will see it as an entry in `chunk.tool_calls` and `response.tool_calls` with the `video_url` as a parameter. Additionally, `SERVER_SIDE_TOOL_VIEW_X_VIDEO` will appear in `response.server_side_tool_usage` along with the number of times it was called when using the xAI Python SDK.

Note that enabling this feature increases token usage, as video content is processed and represented as tokens in the model's context.

```pythonXAI
import os

from xai_sdk import Client
from xai_sdk.chat import user
from xai_sdk.tools import x_search

client = Client(api_key=os.getenv("XAI_API_KEY"))
chat = client.chat.create(
    model="grok-4-1-fast",  # reasoning model
    tools=[
        x_search(enable_video_understanding=True),
    ],
)

chat.append(user("What is the latest video talking about from the xAI official X account?"))

# stream or sample the response...
```

```pythonOpenAISDK
import os
from openai import OpenAI

api_key = os.getenv("XAI_API_KEY")
client = OpenAI(
    api_key=api_key,
    base_url="https://api.x.ai/v1",
)

response = client.responses.create(
    model="grok-4-1-fast",
    input=[
        {
            "role": "user",
            "content": "What is the latest video talking about from the xAI official X account?",
        },
    ],
    tools=[
        {
            "type": "x_search",
            "enable_video_understanding": True,
        },
    ],
)

print(response)
```

```pythonRequests
import os
import requests

url = "https://api.x.ai/v1/responses"
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {os.getenv('XAI_API_KEY')}"
}
payload = {
    "model": "grok-4-1-fast",
    "input": [
        {
            "role": "user",
            "content": "What is the latest video talking about from the xAI official X account?"
        }
    ],
    "tools": [
        {
            "type": "x_search",
            "enable_video_understanding": True,
        }
    ]
}
response = requests.post(url, headers=headers, json=payload)
print(response.json())
```

```bash
curl https://api.x.ai/v1/responses \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $XAI_API_KEY" \\
  -d '{
  "model": "grok-4-1-fast",
  "input": [
    {
      "role": "user",
      "content": "What is the latest video talking about from the xAI official X account?"
    }
  ],
  "tools": [
    {
      "type": "x_search",
      "enable_video_understanding": true
    }
  ]
}'
```

```javascriptAISDK
import { xai } from '@ai-sdk/xai';
import { generateText } from 'ai';

const { text, sources } = await generateText({
  model: xai.responses('grok-4-fast'),
  prompt: 'What is the latest video talking about from the xAI official X account?',
  tools: {
    x_search: xai.tools.xSearch({
      enableVideoUnderstanding: true,
    }),
  },
});

console.log(text);
```

#### Guides

# Code Execution Tool

The code execution tool enables Grok to write and execute Python code in real-time, dramatically expanding its capabilities beyond text generation. This powerful feature allows Grok to perform precise calculations, complex data analysis, statistical computations, and solve mathematical problems that would be impossible through text alone.

**xAI Python SDK Users**: Version 1.3.1 of the xai-sdk package is required to use the agentic tool calling API.

## Key Capabilities

* **Mathematical Computations**: Solve complex equations, perform statistical analysis, and handle numerical calculations with precision
* **Data Analysis**: Process datasets, and extract insights from the prompt
* **Financial Modeling**: Build financial models, calculate risk metrics, and perform quantitative analysis
* **Scientific Computing**: Handle scientific calculations, simulations, and data transformations
* **Code Generation & Testing**: Write, test, and debug Python code snippets in real-time

## When to Use Code Execution

The code execution tool is particularly valuable for:

* **Numerical Problems**: When you need exact calculations rather than approximations
* **Data Processing**: Analyzing complex data from the prompt
* **Complex Logic**: Multi-step calculations that require intermediate results
* **Verification**: Double-checking mathematical results or validating assumptions

## SDK Support

The code execution tool is available across multiple SDKs and APIs with different naming conventions:

| SDK/API | Tool Name | Description |
|---------|-----------|-------------|
| xAI SDK | `code_execution` | Native xAI SDK implementation |
| OpenAI Responses API | `code_interpreter` | Compatible with OpenAI's API format |
| Vercel AI SDK | `xai.tools.codeExecution()` | Vercel AI SDK integration |

## Implementation Example

Below are comprehensive examples showing how to integrate the code execution tool across different platforms and use cases.

### Basic Calculations

```pythonXAI
import os

from xai_sdk import Client
from xai_sdk.chat import user
from xai_sdk.tools import code_execution

client = Client(api_key=os.getenv("XAI_API_KEY"))
chat = client.chat.create(
    model="grok-4-1-fast",  # reasoning model
    tools=[code_execution()],
    include=["verbose_streaming"],
)

# Ask for a mathematical calculation
chat.append(user("Calculate the compound interest for $10,000 at 5% annually for 10 years"))

is_thinking = True
for response, chunk in chat.stream():
    # View the server-side tool calls as they are being made in real-time
    for tool_call in chunk.tool_calls:
        print(f"\\nCalling tool: {tool_call.function.name} with arguments: {tool_call.function.arguments}")
    if response.usage.reasoning_tokens and is_thinking:
        print(f"\\rThinking... ({response.usage.reasoning_tokens} tokens)", end="", flush=True)
    if chunk.content and is_thinking:
        print("\\n\\nFinal Response:")
        is_thinking = False
    if chunk.content and not is_thinking:
        print(chunk.content, end="", flush=True)

print("\\n\\nCitations:")
print(response.citations)
print("\\n\\nUsage:")
print(response.usage)
print(response.server_side_tool_usage)
print("\\n\\nServer Side Tool Calls:")
print(response.tool_calls)
```

```pythonOpenAISDK
import os
from openai import OpenAI

api_key = os.getenv("XAI_API_KEY")
client = OpenAI(
    api_key=api_key,
    base_url="https://api.x.ai/v1",
)

response = client.responses.create(
    model="grok-4-1-fast",
    input=[
        {
            "role": "user",
            "content": "Calculate the compound interest for $10,000 at 5% annually for 10 years",
        },
    ],
    tools=[
        {
            "type": "code_interpreter",
        },
    ],
)

print(response)
```

```pythonRequests
import os
import requests

url = "https://api.x.ai/v1/responses"
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {os.getenv('XAI_API_KEY')}"
}
payload = {
    "model": "grok-4-1-fast",
    "input": [
        {
            "role": "user",
            "content": "Calculate the compound interest for $10,000 at 5% annually for 10 years"
        }
    ],
    "tools": [
        {
            "type": "code_interpreter",
        }
    ]
}
response = requests.post(url, headers=headers, json=payload)
print(response.json())
```

```bash
curl https://api.x.ai/v1/responses \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $XAI_API_KEY" \\
  -d '{
  "model": "grok-4-1-fast",
  "input": [
    {
      "role": "user",
      "content": "Calculate the compound interest for $10,000 at 5% annually for 10 years"
    }
  ],
  "tools": [
    {
      "type": "code_interpreter"
    }
  ]
}'
```

```javascriptAISDK
import { xai } from '@ai-sdk/xai';
import { generateText } from 'ai';

const { text } = await generateText({
  model: xai.responses('grok-4-fast'),
  prompt: 'Calculate the compound interest for $10,000 at 5% annually for 10 years',
  tools: {
    code_execution: xai.tools.codeExecution(),
  },
});

console.log(text);
```

### Data Analysis

```pythonXAI
import os
from xai_sdk import Client
from xai_sdk.chat import user
from xai_sdk.tools import code_execution

client = Client(api_key=os.getenv("XAI_API_KEY"))

# Multi-turn conversation with data analysis
chat = client.chat.create(
    model="grok-4-1-fast",  # reasoning model
    tools=[code_execution()],
    include=["verbose_streaming"],
)

# Step 1: Load and analyze data
chat.append(user("""
I have sales data for Q1-Q4: [120000, 135000, 98000, 156000].
Please analyze this data and create a visualization showing:
1. Quarterly trends
2. Growth rates
3. Statistical summary
"""))

print("##### Step 1: Data Analysis #####\\n")

is_thinking = True
for response, chunk in chat.stream():
    # View the server-side tool calls as they are being made in real-time
    for tool_call in chunk.tool_calls:
        print(f"\\nCalling tool: {tool_call.function.name} with arguments: {tool_call.function.arguments}")
    if response.usage.reasoning_tokens and is_thinking:
        print(f"\\rThinking... ({response.usage.reasoning_tokens} tokens)", end="", flush=True)
    if chunk.content and is_thinking:
        print("\\n\\nAnalysis Results:")
        is_thinking = False
    if chunk.content and not is_thinking:
        print(chunk.content, end="", flush=True)

print("\\n\\nCitations:")
print(response.citations)
print("\\n\\nUsage:")
print(response.usage)
print(response.server_side_tool_usage)

chat.append(response)

# Step 2: Follow-up analysis
chat.append(user("Now predict Q1 next year using linear regression"))

print("\\n\\n##### Step 2: Prediction Analysis #####\\n")

is_thinking = True
for response, chunk in chat.stream():
    # View the server-side tool calls as they are being made in real-time
    for tool_call in chunk.tool_calls:
        print(f"\\nCalling tool: {tool_call.function.name} with arguments: {tool_call.function.arguments}")
    if response.usage.reasoning_tokens and is_thinking:
        print(f"\\rThinking... ({response.usage.reasoning_tokens} tokens)", end="", flush=True)
    if chunk.content and is_thinking:
        print("\\n\\nPrediction Results:")
        is_thinking = False
    if chunk.content and not is_thinking:
        print(chunk.content, end="", flush=True)

print("\\n\\nCitations:")
print(response.citations)
print("\\n\\nUsage:")
print(response.usage)
print(response.server_side_tool_usage)
print("\\n\\nServer Side Tool Calls:")
print(response.tool_calls)
```

```javascriptAISDK
import { xai } from '@ai-sdk/xai';
import { generateText } from 'ai';

// Step 1: Load and analyze data
const step1 = await generateText({
  model: xai.responses('grok-4-fast'),
  prompt: \`I have sales data for Q1-Q4: [120000, 135000, 98000, 156000].
Please analyze this data and create a visualization showing:
1. Quarterly trends
2. Growth rates
3. Statistical summary\`,
  tools: {
    code_execution: xai.tools.codeExecution(),
  },
});

console.log('##### Step 1: Data Analysis #####');
console.log(step1.text);

// Step 2: Follow-up analysis using previousResponseId
const step2 = await generateText({
  model: xai.responses('grok-4-fast'),
  prompt: 'Now predict Q1 next year using linear regression',
  tools: {
    code_execution: xai.tools.codeExecution(),
  },
  providerOptions: {
    xai: {
      previousResponseId: step1.response.id,
    },
  },
});

console.log('##### Step 2: Prediction Analysis #####');
console.log(step2.text);
```

## Best Practices

### 1. **Be Specific in Requests**

Provide clear, detailed instructions about what you want the code to accomplish:

```pythonWithoutSDK
# Good: Specific and clear
"Calculate the correlation matrix for these variables and highlight correlations above 0.7"

# Avoid: Vague requests  
"Analyze this data"
```

### 2. **Provide Context and Data Format**

Always specify the data format and any constraints on the data, and provide as much context as possible:

```pythonWithoutSDK
# Good: Includes data format and requirements
"""
Here's my CSV data with columns: date, revenue, costs
Please calculate monthly profit margins and identify the best-performing month.
Data: [['2024-01', 50000, 35000], ['2024-02', 55000, 38000], ...]
"""
```

### 3. **Use Appropriate Model Settings**

* **Temperature**: Use lower values (0.0-0.3) for mathematical calculations
* **Model**: Use reasoning models like `grok-4-1-fast` for better code generation

## Common Use Cases

### Financial Analysis

```pythonWithoutSDK
# Portfolio optimization, risk calculations, option pricing
"Calculate the Sharpe ratio for a portfolio with returns [0.12, 0.08, -0.03, 0.15] and risk-free rate 0.02"
```

### Statistical Analysis

```pythonWithoutSDK
# Hypothesis testing, regression analysis, probability distributions
"Perform a t-test to compare these two groups and interpret the p-value: Group A: [23, 25, 28, 30], Group B: [20, 22, 24, 26]"
```

### Scientific Computing

```pythonWithoutSDK
# Simulations, numerical methods, equation solving
"Solve this differential equation using numerical methods: dy/dx = x^2 + y, with initial condition y(0) = 1"
```

## Limitations and Considerations

* **Execution Environment**: Code runs in a sandboxed Python environment with common libraries pre-installed
* **Time Limits**: Complex computations may have execution time constraints
* **Memory Usage**: Large datasets might hit memory limitations
* **Package Availability**: Most popular Python packages (NumPy, Pandas, Matplotlib, SciPy) are available
* **File I/O**: Limited file system access for security reasons

## Security Notes

* Code execution happens in a secure, isolated environment
* No access to external networks or file systems
* Temporary execution context that doesn't persist between requests
* All computations are stateless and secure

#### Guides

# Image Generations

Some of the models can provide image generation capabilities. You can provide some descriptions of the image you would like to generate, and let the model generate one or multiple pictures in the output.

If you're used to interacting with the chat/image-understanding models, the image generation is a bit different from them.
You only need to send a prompt text in the request, instead of a list of messages with system/user/assistant roles.
When you sent the prompt for image generation, your prompt will be revised by a chat model, and then sent to the image generation model.

## Parameters

* `n`: Number of image(s) to generate (1-10, default to 1)
* `response_format`: `"url"` or `"b64_json"`. If `"url"` is specified, the response will return a url to the image(s) in `data[index].url`; if "b64\_json" is specified, the response will return the image(s) in base64 encoded format in `data[index].b64_json`.

> Note: `quality`, `size` or `style` are not supported by xAI API at the moment.

## Generate an image

The image generation is offered at a different endpoint `https://api.x.ai/v1/images/generations` from the chat and image-understanding models that share `https://api.x.ai/v1/chat/completions`.
The endpoint is **compatible with OpenAI SDK** (but **not with Anthropic SDK**), so you can keep using the same `base_url` of `https://api.x.ai/v1`.

You can set `"model": "grok-2-image"` in the request body to use the model. The generated image will be in `jpg` format.

```pythonXAI
import os

from xai_sdk import Client

client = Client(api_key=os.getenv('XAI_API_KEY'))

response = client.image.sample(
    model="grok-2-image",
    prompt="A cat in a tree",
    image_format="url"
)

print(response.url)
```

```pythonOpenAISDK
import os
from openai import OpenAI

XAI_API_KEY = os.getenv("XAI_API_KEY")
client = OpenAI(base_url="https://api.x.ai/v1", api_key=XAI_API_KEY)

response = client.images.generate(
    model="grok-2-image",
    prompt="A cat in a tree"
)

print(response.data[0].url)
```

```javascriptOpenAISDK
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: "<api key>",
    baseURL: "https://api.x.ai/v1",
});

const response = await openai.images.generate({
    model: "grok-2-image",
    prompt: "A cat in a tree",
});
console.log(response.data[0].url);
```

```bash
curl -X 'POST' https://api.x.ai/v1/images/generations \\
-H 'accept: application/json' \\
-H 'Authorization: Bearer <API_KEY>' \\
-H 'Content-Type: application/json' \\
-d '{
    "model": "grok-2-image",
    "prompt": "A cat in a tree"
}'
```

The Python and JavaScript examples will print out url of the image on xAI managed storage.

This is an example image generated from the above prompt:

### Base 64 JSON Output

Instead of getting an image url by default, you can choose to get a base64 encoded image instead.
To do so, you need to specify the `response_format` parameter to `"b64_json"`.

```pythonXAI
import os

from xai_sdk import Client

client = Client(api_key=os.getenv('XAI_API_KEY'))

response = client.image.sample(
    model="grok-2-image",
    prompt="A cat in a tree",
    image_format="base64"
)

print(response.image) # returns the raw image bytes
```

```pythonOpenAISDK
import os

from openai import OpenAI

XAI_API_KEY = os.getenv("XAI_API_KEY")
client = OpenAI(base_url="https://api.x.ai/v1", api_key=XAI_API_KEY)

response = client.images.generate(
    model="grok-2-image",
    prompt="A cat in a tree",
    response_format="b64_json"
)

print(response.data[0].b64_json)
```

```javascriptOpenAISDK
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: "<api key>",
    baseURL: "https://api.x.ai/v1",
});

const response = await openai.images.generate({
    model: "grok-2-image",
    prompt: "A cat in a tree",
    response_format: "b64_json"
});
console.log(response.data[0].b64_json);
```

```javascriptAISDK
import { xai } from '@ai-sdk/xai';
import { experimental_generateImage as generateImage } from 'ai';

const result = await generateImage({
  model: xai.image('grok-2-image'),
  prompt: 'A cat in a tree',
});

console.log(result.image.base64Data);
```

```bash
curl -X 'POST' https://api.x.ai/v1/images/generations \\
-H 'accept: application/json' \\
-H 'Authorization: Bearer <API_KEY>' \\
-H 'Content-Type: application/json' \\
-d '{
    "model": "grok-2-image",
    "prompt": "A cat in a tree",
    "response_format": "b64_json"
}'
```

You will get a `b64_json` field instead of `url` in the response image object.

### Generating multiple images

You can generate up to 10 images in one request by adding a parameter `n` in your request body. For example, to generate four images:

```pythonXAI
import os

from xai_sdk import Client

client = Client(api_key=os.getenv('XAI_API_KEY'))

response = client.image.sample_batch(
    model="grok-2-image",
    prompt="A cat in a tree",
    n=4
    image_format="url",
)

for image in response:
    print(response.url)
```

```pythonOpenAISDK
import os

from openai import OpenAI

XAI_API_KEY = os.getenv("XAI_API_KEY")
client = OpenAI(base_url="https://api.x.ai/v1", api_key=XAI_API_KEY)

responses = client.images.generate(
    model="grok-2-image",
    prompt="A cat in a tree"
    n=4
)
for response in responses:
    print(response.url)
```

```javascriptOpenAISDK
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: "<api key>",
    baseURL: "https://api.x.ai/v1",
});

const response = await openai.images.generate({
    model: "grok-2-image",
    prompt: "A cat in a tree",
    n: 4
});
response.data.forEach((image) => {
    console.log(image.url);
});
```

```javascriptAISDK
import { xai } from '@ai-sdk/xai';
import { experimental_generateImage as generateImage } from 'ai';

const result = await generateImage({
  model: xai.image('grok-2-image'),
  prompt: 'A cat in a tree',
  n: 4,
});

console.log(result.images);
```

```bash
curl -X 'POST' https://api.x.ai/v1/images/generations \\
-H 'accept: application/json' \\
-H 'Authorization: Bearer <API_KEY>' \\
-H 'Content-Type: application/json' \\
-d '{
    "model": "grok-2-image",
    "prompt": "A cat in a tree",
    "n": 4
}'
```

## Revised prompt

If you inspect the response object, you can see something similar to this:

```json
{
  "data": [
    {
      "b64_json": "data:image/png;base64,...",
      "revised_prompt": "..."
    }
  ]
}
```

Before sending the prompt to the image generation model, the prompt will be revised by a chat model. The revised prompt from chat model will be used by image generation model to create the image, and returned in `revised_prompt` to the user.

To see the revised prompt with SDK:

```pythonXAI
# ... Steps to make image generation request

print(response.prompt)
```

```pythonOpenAISDK
# ... Steps to make image generation request

print(response.data[0].revised_prompt)
```

```javascriptOpenAISDK
// ... Steps to make image generation request

console.log(response.data[0].revised_prompt);
```

For example:
| Input/Output | Example |
|------------------------------------ | -------- |
| prompt (in request body) | A cat in a tree |
| revised\_prompt (in response body) | 3D render of a gray cat with green eyes perched on a thick branch of a leafy tree, set in a suburban backyard during the day. The cat's fur is slightly ruffled by a gentle breeze, and it is looking directly at the viewer. The background features a sunny sky with a few clouds and other trees, creating a natural and serene environment. The scene is focused on the cat, with no distracting foreground elements, ensuring the cat remains the central subject of the image. |
