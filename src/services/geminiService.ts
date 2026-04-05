import { GoogleGenAI, Modality } from "@google/genai";
import { FireScenario, AIResponse, AI_RESPONSE_SCHEMA } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getFireEscapeGuide(scenario: FireScenario): Promise<AIResponse> {
  const prompt = `
    Bạn là chuyên gia phòng cháy chữa cháy tại Việt Nam.
    Hãy hướng dẫn thoát nạn cho cư dân sống trong nhà chung cư nhiều tầng khi xảy ra cháy, dựa trên các quy chuẩn:
    - QCVN 06:2022/BXD
    - QCVN 04:2021/BXD

    Thông tin hiện tại:
    - Tầng: ${scenario.floor}
    - Vị trí của bạn: ${scenario.location}
    - Vị trí đám cháy: ${scenario.fireLocation}
    - Có khói: ${scenario.hasSmoke ? "Có" : "Không"}
    - Cửa nóng: ${scenario.isDoorHot ? "Có" : "Không"}
    - Có trẻ em/người già/người khuyết tật: ${scenario.hasVulnerablePeople ? "Có" : "Không"}

    Yêu cầu:
    1. Phân tích kịch bản cụ thể.
    2. Đưa ra hướng dẫn NGAY LẬP TỨC, tối đa 5 bước.
    3. Ngắn gọn, dễ hiểu, ưu tiên an toàn tính mạng và tránh ngạt khói.
    4. Nếu có người yếu thế, đưa ra hướng dẫn riêng biệt tích hợp trong các bước.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: AI_RESPONSE_SCHEMA,
    },
  });

  return JSON.parse(response.text || "{}") as AIResponse;
}

export async function getVoiceGuide(text: string): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Đọc to và rõ ràng hướng dẫn sau: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return `data:audio/mp3;base64,${base64Audio}`;
    }
  } catch (error) {
    console.error("TTS Error:", error);
  }
  return null;
}
