import type { MockTestBlueprint } from "../types";

export const TCS_NQT_BLUEPRINT: MockTestBlueprint = {
  id: "tcs-nqt",
  title: "TCS NQT",
  subtitle: "National Qualifier Test · cognitive sections + coding round",
  sections: [
    {
      id: "numerical",
      title: "Numerical Ability",
      durationMinutes: 25,
      questionCount: 25,
      pickFrom: { track: "aptitude", topics: ["quant"] },
    },
    {
      id: "verbal",
      title: "Verbal Ability",
      durationMinutes: 25,
      questionCount: 24,
      pickFrom: { track: "aptitude", topics: ["verbal"] },
    },
    {
      id: "reasoning",
      title: "Reasoning Ability",
      durationMinutes: 50,
      questionCount: 30,
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
  codingSection: {
    durationMinutes: 30,
    problemCount: 2,
    pool: { track: "python" },
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
  ],
  codingSection: {
    durationMinutes: 45,
    problemCount: 1,
    pool: { track: "python" },
  },
};

export const BLUEPRINTS: MockTestBlueprint[] = [TCS_NQT_BLUEPRINT, INFOSYS_SP_BLUEPRINT];

export function getBlueprint(id: MockTestBlueprint["id"]): MockTestBlueprint | undefined {
  return BLUEPRINTS.find((b) => b.id === id);
}
