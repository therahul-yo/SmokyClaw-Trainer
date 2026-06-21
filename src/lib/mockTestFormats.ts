import type { MockTestBlueprint } from "../types";

// Source: TCS NQT 2025 official pattern (iON-proctored cognitive + coding).
// Real TCS NQT (2024-2026) runs a 4-section cognitive battery plus a
// 2-problem coding round. Previous version over-counted verbal/reasoning
// and pushed reasoning to 50 min, which didn't match the live assessment.
export const TCS_NQT_BLUEPRINT: MockTestBlueprint = {
  id: "tcs-nqt",
  title: "TCS NQT",
  subtitle: "iON 2025 pattern · foundation + cognitive + programming logic + coding",
  sections: [
    {
      id: "numerical",
      title: "Numerical Ability (Foundation)",
      durationMinutes: 25,
      questionCount: 25,
      pickFrom: { track: "aptitude", topics: ["quant"] },
    },
    {
      id: "verbal",
      title: "Verbal Ability (Cognitive)",
      durationMinutes: 25,
      questionCount: 20,
      pickFrom: { track: "aptitude", topics: ["verbal"] },
    },
    {
      id: "reasoning",
      title: "Reasoning Ability (Cognitive)",
      durationMinutes: 25,
      questionCount: 20,
      pickFrom: { track: "aptitude", topics: ["reasoning"] },
    },
    {
      id: "programming-logic",
      title: "Programming Logic",
      durationMinutes: 15,
      questionCount: 10,
      pickFrom: [
        { track: "python", type: "mcq" },
        { track: "dsa", type: "mcq" },
      ],
    },
  ],
  // Cognitive total: 25+20+20+10 = 75q / 90min + 2-problem coding = 75q / 120min.
  codingSection: {
    durationMinutes: 30,
    problemCount: 2,
    pool: { track: "python" },
  },
};

export const TCS_NQT_COGNITIVE_BLUEPRINT: MockTestBlueprint = {
  id: "tcs-nqt-cognitive",
  title: "TCS NQT Cognitive",
  subtitle: "Official TCS iON cognitive shape · 65 questions · 75 minutes",
  sections: [
    {
      id: "numerical",
      title: "Numerical Ability",
      durationMinutes: 25,
      questionCount: 20,
      pickFrom: { track: "aptitude", topics: ["quant"] },
    },
    {
      id: "verbal",
      title: "Verbal Ability",
      durationMinutes: 25,
      questionCount: 25,
      pickFrom: { track: "aptitude", topics: ["verbal"] },
    },
    {
      id: "reasoning",
      title: "Reasoning Ability",
      durationMinutes: 25,
      questionCount: 20,
      pickFrom: { track: "aptitude", topics: ["reasoning"] },
    },
  ],
};

export const TCS_NQT_IT_FULL_BLUEPRINT: MockTestBlueprint = {
  id: "tcs-nqt-it-full",
  title: "TCS NQT IT Full",
  subtitle: "Foundation cognitive + programming logic + advanced coding practice",
  sections: [
    {
      id: "numerical",
      title: "Numerical Ability",
      durationMinutes: 25,
      questionCount: 20,
      pickFrom: { track: "aptitude", topics: ["quant"] },
    },
    {
      id: "verbal",
      title: "Verbal Ability",
      durationMinutes: 25,
      questionCount: 25,
      pickFrom: { track: "aptitude", topics: ["verbal"] },
    },
    {
      id: "reasoning",
      title: "Reasoning Ability",
      durationMinutes: 25,
      questionCount: 20,
      pickFrom: { track: "aptitude", topics: ["reasoning"] },
    },
    {
      id: "programming-logic",
      title: "Programming Logic",
      durationMinutes: 15,
      questionCount: 10,
      pickFrom: [
        { track: "python", type: "mcq" },
        { track: "dsa", type: "mcq" },
      ],
    },
    {
      id: "advanced-aptitude",
      title: "Advanced Aptitude",
      durationMinutes: 25,
      questionCount: 15,
      pickFrom: { track: "aptitude", topics: ["quant", "reasoning"] },
    },
  ],
  codingSection: {
    durationMinutes: 90,
    problemCount: 2,
    pool: { track: "dsa" },
  },
};

export const INFOSYS_SP_BLUEPRINT: MockTestBlueprint = {
  id: "infosys-sp",
  title: "Infosys SP",
  subtitle: "Specialist Programmer · mixed sections + coding round",
  sections: [
    {
      id: "math",
      title: "Mathematical Ability",
      durationMinutes: 35,
      questionCount: 10,
      pickFrom: { track: "aptitude", topics: ["quant"] },
    },
    {
      id: "logical",
      title: "Logical Reasoning",
      durationMinutes: 25,
      questionCount: 15,
      pickFrom: { track: "aptitude", topics: ["reasoning"] },
    },
    {
      id: "verbal",
      title: "Verbal Ability",
      durationMinutes: 20,
      questionCount: 20,
      pickFrom: { track: "aptitude", topics: ["verbal"] },
    },
  ],
  codingSection: {
    durationMinutes: 45,
    problemCount: 1,
    pool: { track: "python" },
  },
};

export const INFOSYS_IRT_BLUEPRINT: MockTestBlueprint = {
  id: "infosys-irt",
  title: "Infosys IRT / SE",
  subtitle: "Infosys-style systems engineer assessment · logic, technical, verbal, pseudocode, puzzle",
  sections: [
    {
      id: "logical",
      title: "Logical Ability",
      durationMinutes: 25,
      questionCount: 15,
      pickFrom: { track: "aptitude", topics: ["reasoning"] },
    },
    {
      id: "technical",
      title: "Technical Ability",
      durationMinutes: 35,
      questionCount: 10,
      pickFrom: [
        { track: "python", type: "mcq" },
        { track: "sql", type: "mcq" },
        { track: "dsa", type: "mcq" },
      ],
    },
    {
      id: "verbal",
      title: "Verbal Ability",
      durationMinutes: 20,
      questionCount: 20,
      pickFrom: { track: "aptitude", topics: ["verbal"] },
    },
    {
      id: "pseudocode",
      title: "Pseudocode",
      durationMinutes: 10,
      questionCount: 5,
      pickFrom: [
        { track: "python", type: "mcq" },
        { track: "dsa", type: "mcq" },
      ],
    },
    {
      id: "puzzle",
      title: "Puzzle Solving",
      durationMinutes: 10,
      questionCount: 4,
      pickFrom: { track: "aptitude", topics: ["reasoning"] },
    },
    {
      id: "grammar",
      title: "English Grammar",
      durationMinutes: 10,
      questionCount: 5,
      pickFrom: { track: "aptitude", topics: ["verbal"] },
    },
  ],
};

export const INFOSYS_PSEUDOCODE_SPRINT_BLUEPRINT: MockTestBlueprint = {
  id: "infosys-pseudocode-sprint",
  title: "Infosys Pseudocode Sprint",
  subtitle: "Fast output-tracing and programming-logic practice",
  sections: [
    {
      id: "pseudocode",
      title: "Pseudocode",
      durationMinutes: 10,
      questionCount: 5,
      pickFrom: [
        { track: "python", type: "mcq" },
        { track: "dsa", type: "mcq" },
      ],
    },
    {
      id: "technical-logic",
      title: "Technical Logic",
      durationMinutes: 15,
      questionCount: 10,
      pickFrom: [
        { track: "python", type: "mcq" },
        { track: "sql", type: "mcq" },
      ],
    },
  ],
};

export const ACCENTURE_COGNITIVE_TECHNICAL_BLUEPRINT: MockTestBlueprint = {
  id: "accenture-cognitive-technical",
  title: "Accenture Cognitive + Technical",
  subtitle: "Cognitive reasoning plus technical fundamentals",
  sections: [
    {
      id: "cognitive-quant",
      title: "Cognitive: Quant + DI",
      durationMinutes: 20,
      questionCount: 20,
      pickFrom: { track: "aptitude", topics: ["quant"] },
    },
    {
      id: "cognitive-reasoning",
      title: "Cognitive: Logical Reasoning",
      durationMinutes: 20,
      questionCount: 20,
      pickFrom: { track: "aptitude", topics: ["reasoning"] },
    },
    {
      id: "cognitive-verbal",
      title: "Cognitive: Verbal",
      durationMinutes: 10,
      questionCount: 10,
      pickFrom: { track: "aptitude", topics: ["verbal"] },
    },
    {
      id: "technical",
      title: "Technical Assessment",
      durationMinutes: 40,
      questionCount: 40,
      pickFrom: [
        { track: "python", type: "mcq" },
        { track: "sql", type: "mcq" },
        { track: "dsa", type: "mcq" },
      ],
    },
  ],
};

export const ACCENTURE_CODING_BLUEPRINT: MockTestBlueprint = {
  id: "accenture-coding",
  title: "Accenture Coding",
  subtitle: "Two implementation problems under a 45-minute pressure window",
  sections: [
    {
      id: "technical-warmup",
      title: "Technical Warm-up",
      durationMinutes: 10,
      questionCount: 10,
      pickFrom: [
        { track: "python", type: "mcq" },
        { track: "dsa", type: "mcq" },
      ],
    },
  ],
  codingSection: {
    durationMinutes: 45,
    problemCount: 2,
    pool: { track: "python" },
  },
};

export const ACCENTURE_FULL_FLOW_BLUEPRINT: MockTestBlueprint = {
  id: "accenture-full-flow",
  title: "Accenture Full Flow",
  subtitle: "Cognitive + technical + coding + communication-prep simulation",
  sections: [
    ...ACCENTURE_COGNITIVE_TECHNICAL_BLUEPRINT.sections,
    {
      id: "communication",
      title: "Communication Readiness",
      durationMinutes: 20,
      questionCount: 10,
      pickFrom: { track: "aptitude", topics: ["verbal"] },
    },
  ],
  codingSection: {
    durationMinutes: 45,
    problemCount: 2,
    pool: { track: "python" },
  },
};

export const WIPRO_ELITE_BLUEPRINT: MockTestBlueprint = {
  id: "wipro-elite",
  title: "Wipro Elite NLTH",
  subtitle: "Elite National Level Talent Hunt · cognitive sections + coding",
  sections: [
    {
      id: "quant",
      title: "Quantitative Ability",
      durationMinutes: 16,
      questionCount: 16,
      pickFrom: { track: "aptitude", topics: ["quant"] },
    },
    {
      id: "reasoning",
      title: "Logical Reasoning",
      durationMinutes: 16,
      questionCount: 14,
      pickFrom: { track: "aptitude", topics: ["reasoning"] },
    },
    {
      id: "verbal",
      title: "Verbal Ability",
      durationMinutes: 18,
      questionCount: 18,
      pickFrom: { track: "aptitude", topics: ["verbal"] },
    },
  ],
  codingSection: {
    durationMinutes: 45,
    problemCount: 2,
    pool: { track: "python" },
  },
};

export const CAPGEMINI_BLUEPRINT: MockTestBlueprint = {
  id: "capgemini",
  title: "Capgemini Mock",
  subtitle: "Capgemini cognitive assessment & technical mock round",
  sections: [
    {
      id: "quant",
      title: "Quantitative Aptitude",
      durationMinutes: 25,
      questionCount: 16,
      pickFrom: { track: "aptitude", topics: ["quant"] },
    },
    {
      id: "reasoning",
      title: "Logical Reasoning",
      durationMinutes: 25,
      questionCount: 20,
      pickFrom: { track: "aptitude", topics: ["reasoning"] },
    },
    {
      id: "english-tech",
      title: "English + Technical",
      durationMinutes: 20,
      questionCount: 20,
      pickFrom: [
        { track: "aptitude", topics: ["verbal", "reasoning"] },
        { track: "python", type: "mcq" },
      ],
    },
  ],
};

export const GENERIC_DSA_BLUEPRINT: MockTestBlueprint = {
  id: "generic-dsa",
  title: "Generic DSA Interview",
  subtitle: "DSA Screening and Coding Round",
  sections: [
    {
      id: "dsa-mcq",
      title: "Data Structures & Algorithms MCQs",
      durationMinutes: 20,
      questionCount: 15,
      pickFrom: { track: "dsa", type: "mcq" },
    },
  ],
  codingSection: {
    durationMinutes: 45,
    problemCount: 2,
    pool: { track: "dsa" },
  },
};

export const SQL_ONLY_BLUEPRINT: MockTestBlueprint = {
  id: "sql-only",
  title: "SQL Interview Round",
  subtitle: "Relational DB & SQL Interview Screening",
  sections: [
    {
      id: "sql-mcq",
      title: "SQL & DB Theory MCQs",
      durationMinutes: 20,
      questionCount: 15,
      pickFrom: { track: "sql", type: "mcq" },
    },
  ],
};

export const BLUEPRINTS: MockTestBlueprint[] = [
  TCS_NQT_BLUEPRINT,
  TCS_NQT_COGNITIVE_BLUEPRINT,
  TCS_NQT_IT_FULL_BLUEPRINT,
  INFOSYS_SP_BLUEPRINT,
  INFOSYS_IRT_BLUEPRINT,
  INFOSYS_PSEUDOCODE_SPRINT_BLUEPRINT,
  ACCENTURE_COGNITIVE_TECHNICAL_BLUEPRINT,
  ACCENTURE_CODING_BLUEPRINT,
  ACCENTURE_FULL_FLOW_BLUEPRINT,
  WIPRO_ELITE_BLUEPRINT,
  CAPGEMINI_BLUEPRINT,
  GENERIC_DSA_BLUEPRINT,
  SQL_ONLY_BLUEPRINT,
];

export function getBlueprint(id: MockTestBlueprint["id"]): MockTestBlueprint | undefined {
  return BLUEPRINTS.find((b) => b.id === id);
}
