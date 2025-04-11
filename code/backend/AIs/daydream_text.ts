import {createDreams} from "@daydreamsai/core";
import {cli} from "@daydreamsai/core/extensions";
import { groq } from "@ai-sdk/groq";


// Flexible provider selection with AI SDK
const agent = createDreams({
// Choose your provider with a single line change
    model: groq("llama3-70b-8192"),

// Configure provider settings
    modelOptions: {
        temperature: 0.7,
        maxTokens: 4096
    },

    extensions: [cli],
}).start();