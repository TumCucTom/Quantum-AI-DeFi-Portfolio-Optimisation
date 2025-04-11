"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@daydreamsai/core");
var core_2 = require("@daydreamsai/core");
var groq_1 = require("@ai-sdk/groq");
// Flexible provider selection with AI SDK
var agent = (0, core_1.createDreams)({
    // Choose your provider with a single line change
    model: (0, groq_1.groq)("llama3-70b-8192"),
    // Configure provider settings
    modelOptions: {
        temperature: 0.7,
        maxTokens: 4096
    },
    extensions: [core_2.cli],
}).start();
