import { LessonContent } from "@/lib/types";

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  pronunciation?: string;
  category: string;
  exampleSentence?: string;
  exampleTranslation?: string;
  difficulty: "easy" | "medium" | "hard";
}

export const LANGUAGE_VOCAB_SETS: Record<string, Flashcard[]> = {
  spanish: [
    {
      id: "es-1",
      front: "el algoritmo",
      back: "the algorithm",
      pronunciation: "ehl ahl-goh-REET-moh",
      category: "Tech & Logic",
      exampleSentence: "El algoritmo procesa los datos rápidamente.",
      exampleTranslation: "The algorithm processes the data quickly.",
      difficulty: "easy",
    },
    {
      id: "es-2",
      front: "desarrollar",
      back: "to develop / build",
      pronunciation: "deh-sah-rroh-YAHR",
      category: "Verbs",
      exampleSentence: "Vamos a desarrollar una aplicación inteligente.",
      exampleTranslation: "We are going to develop a smart application.",
      difficulty: "easy",
    },
    {
      id: "es-3",
      front: "la inteligencia artificial",
      back: "artificial intelligence",
      pronunciation: "een-teh-lee-HEN-syah ahr-tee-fee-SYAHL",
      category: "Tech & Logic",
      exampleSentence: "La inteligencia artificial transforma la educación.",
      exampleTranslation: "Artificial intelligence transforms education.",
      difficulty: "medium",
    },
    {
      id: "es-4",
      front: "resolver problemas",
      back: "to solve problems",
      pronunciation: "rreh-sohl-BEHR proh-BLEH-mahs",
      category: "Verbs",
      exampleSentence: "Los modelos de lenguaje aprenden a resolver problemas.",
      exampleTranslation: "Language models learn to solve problems.",
      difficulty: "medium",
    },
    {
      id: "es-5",
      front: "la retroalimentación",
      back: "feedback / backpropagation",
      pronunciation: "rreh-troh-ah-lee-mehn-tah-SYOHN",
      category: "Advanced Logic",
      exampleSentence: "La retroalimentación constante mejora el aprendizaje.",
      exampleTranslation: "Constant feedback improves learning.",
      difficulty: "hard",
    },
  ],
  japanese: [
    {
      id: "jp-1",
      front: "プログラム (puroguramu)",
      back: "program / code",
      pronunciation: "pu-ro-gu-ra-mu",
      category: "Tech & Logic",
      exampleSentence: "新しいプログラムを書きます。(Atarashii puroguramu o kakimasu)",
      exampleTranslation: "I will write a new program.",
      difficulty: "easy",
    },
    {
      id: "jp-2",
      front: "自動化 (jidouka)",
      back: "automation",
      pronunciation: "jee-doh-oo-kah",
      category: "Tech & Logic",
      exampleSentence: "反復作業の自動化に成功した。(Hanpuku sagyou no jidouka ni seikou shita)",
      exampleTranslation: "We succeeded in automating repetitive work.",
      difficulty: "medium",
    },
    {
      id: "jp-3",
      front: "計算 (keisan)",
      back: "calculation / math",
      pronunciation: "kay-sahn",
      category: "Math & Logic",
      exampleSentence: "複雑な計算を瞬時に行う。(Fukuzatsu na keisan o shunji ni okonau)",
      exampleTranslation: "Perform complex calculations in an instant.",
      difficulty: "medium",
    },
    {
      id: "jp-4",
      front: "論理 (ronri)",
      back: "logic / reasoning",
      pronunciation: "ron-ree",
      category: "Concepts",
      exampleSentence: "コードには厳密な論理が必要です。(Koudo ni wa genmitsu na ronri ga hitsuyou desu)",
      exampleTranslation: "Code requires strict logic.",
      difficulty: "hard",
    },
  ],
  french: [
    {
      id: "fr-1",
      front: "la fonction",
      back: "the function",
      pronunciation: "lah fohnk-SYOHN",
      category: "Tech & Logic",
      exampleSentence: "Cette fonction prend deux paramètres.",
      exampleTranslation: "This function takes two parameters.",
      difficulty: "easy",
    },
    {
      id: "fr-2",
      front: "apprendre",
      back: "to learn",
      pronunciation: "ah-PRAWNDR",
      category: "Verbs",
      exampleSentence: "Les machines peuvent apprendre des données.",
      exampleTranslation: "Machines can learn from data.",
      difficulty: "easy",
    },
    {
      id: "fr-3",
      front: "le réseau neuronal",
      back: "neural network",
      pronunciation: "luh ray-zoh nuh-roh-NAHL",
      category: "Tech & Logic",
      exampleSentence: "Le réseau neuronal identifie les motifs.",
      exampleTranslation: "The neural network identifies patterns.",
      difficulty: "hard",
    },
  ],
};

export const LANGUAGE_LESSONS: LessonContent[] = [
  {
    id: "lang-patterns",
    title: "1. Language as a Symbolic Engine: Syntax, Semantics & Grammar",
    summary:
      "Understand how natural human languages and programming languages share universal principles of grammar, compositionality, and tokens.",
    readTime: "4 min",
    level: "Beginner",
    category: "language",
    markdown: `
### Why Natural Language and Programming Connect

Every language—whether Spanish, English, Python, or Mathematical notation—consists of three fundamental pillars:

1. **Syntax**: The structural rules determining valid sentences or expressions (e.g. subject-verb agreement or matching curly brackets).
2. **Semantics**: The underlying meaning conveyed by a valid sequence of symbols.
3. **Pragmatics & Context**: How meaning changes depending on surrounding environment and context.

\`\`\`
Natural Language:   [Subject: Developer] + [Verb: builds] + [Object: an agent]
Code Equivalent:     const agent = developer.build('agent');
Math Representation: f: Developer → Agent
\`\`\`

#### Compositionality Principle
In linguistic philosophy and computer science, **Frege's Principle of Compositionality** states that the meaning of a complex expression is determined by the meanings of its parts and the rules used to combine them.

When you master language structure, you simultaneously develop the precision required for prompt engineering and robust code construction!
`,
    interactiveType: "flashcards",
    interactiveData: {
      defaultLanguage: "spanish",
    },
    quiz: [
      {
        id: "lq-1",
        question: "What is the difference between Syntax and Semantics?",
        options: [
          "Syntax is the rules of structure; Semantics is the underlying meaning.",
          "Syntax is for math; Semantics is only for spoken languages.",
          "Syntax is execution speed; Semantics is storage size.",
          "They are identical terms with different spellings.",
        ],
        correctAnswer: 0,
        explanation:
          "Syntax describes the structural validity of statements (like grammar rules in English or compiler checks in code), while Semantics is what those statements actually mean.",
      },
      {
        id: "lq-2",
        question: "What does the Principle of Compositionality state?",
        options: [
          "Code must always be written in a single line.",
          "The meaning of a complex expression depends on the meanings of its parts and how they are combined.",
          "Language cannot be understood by computers.",
          "Mathematics cannot express language constructs.",
        ],
        correctAnswer: 1,
        explanation:
          "Compositionality is why we can understand an infinite number of novel sentences or build complex software programs out of smaller reusable functions.",
      },
    ],
  },
  {
    id: "lang-tokenization",
    title: "2. How LLMs 'Read' Languages: Tokens, Embeddings & Vectors",
    summary:
      "Discover how modern AI transforms natural language words into numbers (tokens) and multi-dimensional geometric spaces (vector embeddings).",
    readTime: "5 min",
    level: "Intermediate",
    category: "language",
    markdown: `
### How Words Become Numbers

Large Language Models (LLMs) do not directly process letters or sounds. Instead, they operate on **tokens**—chunks of characters representing common subwords.

#### 1. Tokenization Pipeline
\`\`\`
Raw String: "Learning AI coding is empowering"
Tokens:     ["Learn", "ing", " AI", " cod", "ing", " is", " emp", "owering"]
Token IDs:  [4512, 290, 8912, 1204, 290, 318, 9821, 14592]
\`\`\`

#### 2. Vector Embeddings (Geometry of Meaning)
Each token is mapped to a high-dimensional vector (e.g. 1536 floating point numbers). In this coordinate space:
- Words with similar meanings are close to each other: \`distance("algorithm", "program") < distance("algorithm", "banana")\`
- Semantic arithmetic works: \`Vector("King") - Vector("Man") + Vector("Woman") ≈ Vector("Queen")\`

#### Polyglot Transfer
Because concepts have similar geometric arrangements across different languages, an AI trained on multilingual texts can transfer reasoning abilities learned in English directly to Spanish, Japanese, or French!
`,
    interactiveType: "flashcards",
    interactiveData: {
      defaultLanguage: "japanese",
    },
    quiz: [
      {
        id: "lt-1",
        question: "Why do AI models use subword tokens rather than whole words?",
        options: [
          "To handle unknown words, misspellings, and multi-lingual word parts efficiently with a fixed vocabulary size.",
          "Because computers can only understand exactly 4 letters at a time.",
          "To make the model run 100x slower.",
          "Because whole words are illegal in computer memory.",
        ],
        correctAnswer: 0,
        explanation:
          "Subword tokenization (like BPE) allows the model to represent virtually any word—even made-up words or compound technical terms—by composing smaller common fragments.",
      },
      {
        id: "lt-2",
        question: "What allows vector embeddings to capture semantic relationships?",
        options: [
          "Words with similar meanings and contexts are situated close together in high-dimensional vector space.",
          "Alphabetical sorting order.",
          "Random number generators.",
          "The number of vowels in a word.",
        ],
        correctAnswer: 0,
        explanation:
          "Embeddings map meaning to geometric coordinates. Closeness in vector space equals semantic similarity.",
      },
    ],
  },
];
