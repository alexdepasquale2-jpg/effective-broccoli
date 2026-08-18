import { LessonContent } from "@/lib/types";

export interface CodeTemplate {
  id: string;
  title: string;
  language: "javascript" | "python";
  description: string;
  initialCode: string;
  expectedOutputPrefix?: string;
  hint: string;
}

export const AI_CODING_TEMPLATES: CodeTemplate[] = [
  {
    id: "prompt-parser",
    title: "1. Build an AI Prompt Builder & Sanitizer",
    language: "javascript",
    description: "Construct a structured system + user prompt with role guardrails and variable interpolation.",
    initialCode: `// Exercise: Create a structured Prompt Builder
function buildAgentPrompt({ role, context, goal, language }) {
  const systemDirective = \`You are an expert \${role} tutor specializing in \${language}.\`;
  const contextBlock = \`Background Context: \${context}\`;
  const taskDirective = \`Your Goal: \${goal}\`;
  
  return \`### SYSTEM\\n\${systemDirective}\\n\\n### CONTEXT\\n\${contextBlock}\\n\\n### TASK\\n\${taskDirective}\\n\\n### RESPONSE GUIDELINES\\n1. Be concise\\n2. Provide code examples\`;
}

// Test our prompt constructor
const prompt = buildAgentPrompt({
  role: "AI Coding Assistant",
  context: "Student is learning JavaScript and Vector Math",
  goal: "Explain how cosine similarity works with a 3-line example",
  language: "JavaScript"
});

console.log("=== GENERATED PROMPT ===");
console.log(prompt);
`,
    hint: "Notice how separating System, Context, and Task helps LLMs avoid prompt injection and stay focused.",
  },
  {
    id: "agent-evaluator",
    title: "2. Autonomous Agent Tool-Calling Loop",
    language: "javascript",
    description: "Simulate an AI agent that decides whether to execute a Math Tool or answer directly.",
    initialCode: `// Simulate Agent Decision Engine
const tools = {
  calculateMath: (expression) => {
    // Safe evaluator for arithmetic
    return \`Calculated result: \${Function('"use strict";return (' + expression + ')')()}\`;
  },
  translateWord: (word, targetLang) => {
    const dict = { "algoritmo": "algorithm", "fonction": "function" };
    return \`Translation: '\${word}' -> '\${dict[word.toLowerCase()] || "unknown"}'\`;
  }
};

function runAgentCycle(userQuery) {
  console.log("User Input:", userQuery);
  
  // Rule-based decision parser simulating an LLM tool-calling intent
  if (userQuery.includes("calculate") || /[0-9]+\\s*[\\+\\-\\*\\/]/.test(userQuery)) {
    const mathMatch = userQuery.match(/([0-9\\.\\s\\+\\-\\*\\/\\(\\)]+)/);
    if (mathMatch) {
      console.log("🤖 Agent Decision: Call tool 'calculateMath'");
      return tools.calculateMath(mathMatch[1].trim());
    }
  }
  
  if (userQuery.includes("translate")) {
    console.log("🤖 Agent Decision: Call tool 'translateWord'");
    return tools.translateWord("algoritmo", "English");
  }
  
  return "🤖 Agent Decision: Direct Answer (No tool required).";
}

console.log(runAgentCycle("Please calculate 15 * 8 + 40"));
console.log("---");
console.log(runAgentCycle("Can you translate algoritmo into English?"));
console.log("---");
console.log(runAgentCycle("Hello! How are you today?"));
`,
    hint: "Modern AI agents use tool-calling schema definitions to invoke external APIs, databases, or calculators.",
  },
];

export const AI_CODING_LESSONS: LessonContent[] = [
  {
    id: "ai-prompt-engineering",
    title: "1. The Anatomy of Modern AI Prompting & In-Context Learning",
    summary:
      "Master the essential framework of prompt design: Role, Context, Constraints, Few-Shot Demonstrations, and Output Schemas.",
    readTime: "5 min",
    level: "Beginner",
    category: "ai-coding",
    markdown: `
### The 5 Building Blocks of High-Performance Prompts

Modern LLMs don't just 'guess words'—they behave as conditioned probabilistic reasoning engines. To get deterministic, high-quality code from an AI:

1. **Role Definition**: Specify domain mastery (e.g. *"Senior TypeScript Architect"*).
2. **Context / In-Context Data**: Supply the relevant schema, environment versions, and data.
3. **Task & Constraints**: Explicit boundary conditions (e.g. *"Never use external libraries; use strict types"*).
4. **Few-Shot Examples**: Give 1–2 input/output pairs to calibrate tone and formatting.
5. **Output Schema (JSON / Markdown)**: Force structured data so downstream programs can parse the output reliably.

\`\`\`json
{
  "role": "math_educator",
  "task": "explain_pythagorean_theorem",
  "target_audience": "high_school",
  "format": {
    "formula": "a^2 + b^2 = c^2",
    "real_world_application": "string",
    "sample_calculation": "string"
  }
}
\`\`\`

#### Chain of Thought (CoT) Prompting
Adding *"Think step by step before providing the final answer"* triggers hidden intermediate tokens that dramatically improve mathematical and algorithmic correctness!
`,
    interactiveType: "code-runner",
    interactiveData: {
      templateId: "prompt-parser",
    },
    quiz: [
      {
        id: "ac-1",
        question: "Why does Chain of Thought (CoT) prompting increase accuracy on math and coding tasks?",
        options: [
          "It forces the LLM to spend extra inference compute generating intermediate reasoning steps before arriving at the conclusion.",
          "It doubles the font size of the output.",
          "It restarts the server automatically.",
          "It deletes syntax errors from the prompt.",
        ],
        correctAnswer: 0,
        explanation:
          "Autoregressive models predict one token at a time based on all previous tokens. By generating step-by-step logic first, the final answer token is conditioned on the correct mathematical work.",
      },
      {
        id: "ac-2",
        question: "What is 'Few-Shot' prompting?",
        options: [
          "Providing a few input/output demonstration examples directly inside the prompt to guide formatting and reasoning.",
          "Restarting the computer 3 times.",
          "Using only 3 words in your prompt.",
          "Training a brand new foundation model from scratch.",
        ],
        correctAnswer: 0,
        explanation:
          "Few-shot prompting leverages in-context learning without requiring fine-tuning weights.",
      },
    ],
  },
  {
    id: "ai-agent-architecture",
    title: "2. Autonomous AI Agents: Loops, Memory & Tool-Use",
    summary:
      "Learn how to transform a single LLM call into an autonomous agent that reasons, plans, executes tools, and checks its own work.",
    readTime: "6 min",
    level: "Intermediate",
    category: "ai-coding",
    markdown: `
### The ReAct Pattern (Reason + Act)

An AI Agent is more than just a chatbot. It is a loop consisting of:

\`\`\`
       ┌───────────────────────────────┐
       │   1. Observation (Environment)│
       └──────────────┬────────────────┘
                      ▼
       ┌───────────────────────────────┐
       │   2. Thought / Reasoning Step │
       └──────────────┬────────────────┘
                      ▼
       ┌───────────────────────────────┐
       │   3. Action (Call a Tool / API)│
       └──────────────┬────────────────┘
                      ▼
       ┌───────────────────────────────┐
       │   4. Result Verification Loop │
       └───────────────────────────────┘
\`\`\`

#### Essential Agent Components:
- **Core LLM Brain**: Decides next action based on current state.
- **Tools / Capabilities**: Weather APIs, Shell execution, Database queries, Calculators.
- **Short-Term Memory**: Conversation and scratchpad history within context window.
- **Long-Term Memory**: Vector database (RAG) storing domain docs and past successes.
`,
    interactiveType: "code-runner",
    interactiveData: {
      templateId: "agent-evaluator",
    },
    quiz: [
      {
        id: "ac-3",
        question: "What distinguishes an autonomous AI agent from a standard LLM completion?",
        options: [
          "An agent runs in a loop with tools, environment feedback, and multi-step decision making.",
          "An agent is written exclusively in C++.",
          "An agent does not use any AI models.",
          "An agent can only reply with single-word answers.",
        ],
        correctAnswer: 0,
        explanation:
          "Agents combine reasoning models with an execution loop that can call tools, inspect results, and adjust course autonomously.",
      },
    ],
  },
];
