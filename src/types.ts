import { Type } from "@google/genai";

export interface FireScenario {
  floor: string;
  location: string;
  fireLocation: string;
  hasSmoke: boolean;
  isDoorHot: boolean;
  hasVulnerablePeople: boolean;
}

export interface EscapeStep {
  step: number;
  action: string;
  condition: string;
}

export interface AIResponse {
  scenario: string;
  steps: EscapeStep[];
}

export const AI_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    scenario: {
      type: Type.STRING,
      description: "Mô tả ngắn gọn kịch bản cháy hiện tại",
    },
    steps: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          step: { type: Type.INTEGER },
          action: { type: Type.STRING, description: "Hành động cụ thể cần thực hiện" },
          condition: { type: Type.STRING, description: "Điều kiện áp dụng (nếu có)" },
        },
        required: ["step", "action"],
      },
    },
  },
  required: ["scenario", "steps"],
};
