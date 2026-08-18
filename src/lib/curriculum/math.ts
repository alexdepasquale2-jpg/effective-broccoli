import { LessonContent } from "@/lib/types";

export interface MathFormula {
  id: string;
  name: string;
  category: "Arithmetic & Proportions" | "Algebra & Linear Equations" | "Geometry & Trigonometry" | "Probability & Statistics";
  formula: string;
  latex: string;
  description: string;
  variables: { name: string; label: string; defaultValue: number; min: number; max: number; step: number }[];
  calculate: (inputs: Record<string, number>) => {
    result: number;
    steps: string[];
    visualType?: "bar" | "circle" | "triangle" | "slope";
  };
}

export const INTERACTIVE_MATH_FORMULAS: MathFormula[] = [
  {
    id: "linear-equation",
    name: "Linear Equation Solver (ax + b = c)",
    category: "Algebra & Linear Equations",
    formula: "ax + b = c  =>  x = (c - b) / a",
    latex: "ax + b = c",
    description: "Solve for the unknown variable x in fundamental single-variable algebra.",
    variables: [
      { name: "a", label: "Coefficient (a)", defaultValue: 3, min: 1, max: 20, step: 1 },
      { name: "b", label: "Constant (b)", defaultValue: 6, min: -50, max: 50, step: 1 },
      { name: "c", label: "Result (c)", defaultValue: 21, min: -100, max: 100, step: 1 },
    ],
    calculate: (inputs) => {
      const a = inputs.a || 1;
      const b = inputs.b || 0;
      const c = inputs.c || 0;
      
      const step1 = `1. Original Equation: ${a}x + ${b} = ${c}`;
      const step2 = `2. Subtract ${b} from both sides: ${a}x = ${c} - (${b}) => ${a}x = ${c - b}`;
      const xVal = (c - b) / a;
      const step3 = `3. Divide both sides by ${a}: x = (${c - b}) / ${a} => x = ${Number(xVal.toFixed(2))}`;

      return {
        result: Number(xVal.toFixed(2)),
        steps: [step1, step2, step3],
        visualType: "slope",
      };
    },
  },
  {
    id: "pythagorean",
    name: "Pythagorean Theorem (a² + b² = c²)",
    category: "Geometry & Trigonometry",
    formula: "c = √(a² + b²)",
    latex: "a^2 + b^2 = c^2",
    description: "Calculate the hypotenuse length (c) of any right-angled triangle given legs a and b.",
    variables: [
      { name: "a", label: "Leg a (width)", defaultValue: 6, min: 1, max: 50, step: 1 },
      { name: "b", label: "Leg b (height)", defaultValue: 8, min: 1, max: 50, step: 1 },
    ],
    calculate: (inputs) => {
      const a = inputs.a || 3;
      const b = inputs.b || 4;
      const aSq = a * a;
      const bSq = b * b;
      const cSq = aSq + bSq;
      const c = Math.sqrt(cSq);

      return {
        result: Number(c.toFixed(2)),
        steps: [
          `1. Identify legs: a = ${a}, b = ${b}`,
          `2. Square both legs: a² = ${a}² = ${aSq}, b² = ${b}² = ${bSq}`,
          `3. Sum the squares: a² + b² = ${aSq} + ${bSq} = ${cSq}`,
          `4. Take the square root: c = √${cSq} = ${Number(c.toFixed(2))}`,
        ],
        visualType: "triangle",
      };
    },
  },
  {
    id: "percentage-change",
    name: "Percentage Growth / Discount",
    category: "Arithmetic & Proportions",
    formula: "% Change = ((New - Old) / Old) * 100",
    latex: "\\% \\Delta = \\frac{\\text{New} - \\text{Old}}{\\text{Old}} \\times 100",
    description: "Calculate real-world inflation, discount margins, or AI training benchmark accuracy gains.",
    variables: [
      { name: "oldVal", label: "Initial Value", defaultValue: 50, min: 1, max: 500, step: 5 },
      { name: "newVal", label: "New Value", defaultValue: 75, min: 1, max: 500, step: 5 },
    ],
    calculate: (inputs) => {
      const oldVal = inputs.oldVal || 1;
      const newVal = inputs.newVal || 1;
      const diff = newVal - oldVal;
      const pct = (diff / oldVal) * 100;

      return {
        result: Number(pct.toFixed(2)),
        steps: [
          `1. Calculate absolute change: New (${newVal}) - Old (${oldVal}) = ${diff}`,
          `2. Divide by original base: ${diff} / ${oldVal} = ${(diff / oldVal).toFixed(4)}`,
          `3. Multiply by 100: ${(diff / oldVal).toFixed(4)} * 100 = ${Number(pct.toFixed(2))}%`,
        ],
        visualType: "bar",
      };
    },
  },
  {
    id: "compound-growth",
    name: "Exponential & Compound Growth (A = P(1 + r)^t)",
    category: "Arithmetic & Proportions",
    formula: "A = P * (1 + r)^t",
    latex: "A = P(1 + r)^t",
    description: "Understand compounding in financial investments, population growth, and computing power (Moore's Law).",
    variables: [
      { name: "principal", label: "Principal / Base (P)", defaultValue: 1000, min: 100, max: 10000, step: 100 },
      { name: "rate", label: "Annual Rate % (r)", defaultValue: 7, min: 1, max: 30, step: 1 },
      { name: "time", label: "Time in Years (t)", defaultValue: 5, min: 1, max: 20, step: 1 },
    ],
    calculate: (inputs) => {
      const P = inputs.principal || 1000;
      const r = (inputs.rate || 5) / 100;
      const t = inputs.time || 1;
      const factor = Math.pow(1 + r, t);
      const total = P * factor;

      return {
        result: Number(total.toFixed(2)),
        steps: [
          `1. Convert percentage rate to decimal: ${inputs.rate}% = ${r}`,
          `2. Compute growth multiplier: (1 + ${r})^${t} = ${Number(factor.toFixed(4))}`,
          `3. Multiply by principal: $${P} * ${Number(factor.toFixed(4))} = $${Number(total.toFixed(2))}`,
          `4. Total Interest/Growth Earned: $${Number((total - P).toFixed(2))}`,
        ],
        visualType: "bar",
      };
    },
  },
];

export const MATH_LESSONS: LessonContent[] = [
  {
    id: "math-linear-algebra-basics",
    title: "1. The Mathematics of Algorithms: Variables, Slopes & Functions",
    summary:
      "Connect mathematical functions f(x) directly to programming functions, variables, and neural network weights.",
    readTime: "4 min",
    level: "Beginner",
    category: "math",
    markdown: `
### Math is the Universal Syntax of Computation

In school, we learn algebraic expressions like:
\`\`\`
y = m * x + b
\`\`\`

In Computer Science and Machine Learning, this exact formula powers:
1. **Programming**: A reusable function that maps input \`x\` to output \`y\`.
2. **AI Neurons**: \`Output = Weight * Input + Bias\` (\`y = w*x + b\`).
3. **Computer Graphics**: Rendering vectors, angles, and camera perspectives on your screen.

#### Why 'Simple' Math Unlocks Advanced AI:
- **Addition & Multiplication**: Dot products that evaluate vector similarity in LLMs.
- **Percentages & Fractions**: Probabilities assigned to candidate next tokens during text generation.
- **Triangles & Angles (Trigonometry)**: Cosine similarity for semantic search and Retrieval-Augmented Generation (RAG).
`,
    interactiveType: "math-visualizer",
    interactiveData: {
      defaultFormulaId: "linear-equation",
    },
    quiz: [
      {
        id: "mq-1",
        question: "In the neural network equation y = w*x + b, what do 'w' and 'b' correspond to in standard line algebra y = m*x + b?",
        options: [
          "'w' is the slope (weight) and 'b' is the y-intercept (bias).",
          "'w' is the alphabet and 'b' is the screen size.",
          "'w' is random noise and 'b' is the server speed.",
          "They have no relationship.",
        ],
        correctAnswer: 0,
        explanation:
          "Linear regression and single-layer artificial neurons use the exact same mathematical structure as high school slope-intercept form (y = mx + b).",
      },
    ],
  },
];
