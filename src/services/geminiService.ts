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
    - Có trẻ em/người già/người bệnh/phụ nữ mang thai: ${scenario.hasVulnerablePeople ? "Có" : "Không"}

    Yêu cầu:
    1. Phân tích kịch bản cụ thể.
    2. Đưa ra hướng dẫn NGAY LẬP TỨC, tối đa 5 bước.
    3. Ngắn gọn, dễ hiểu, ưu tiên an toàn tính mạng và tránh ngạt khói.
    4. TUYỆT ĐỐI KHÔNG hướng dẫn người dân di chuyển cúi thấp người hay đi sát tường.
    5. Nếu vị trí của bạn là "Trong thang máy":
       - Theo TCVN 6396 – 73:2010: Khi có tín hiệu báo cháy, thang máy sẽ tự động di chuyển về tầng dừng chỉ định (thường là tầng 1) và mở cửa.
       - Giữ bình tĩnh, không hoảng loạn (không gian hẹp, nồng độ oxy giảm nhanh).
       - Trường hợp cửa thang máy mở được: Nhanh chóng di chuyển ra khỏi công trình đến nơi an toàn.
       - Trường hợp cửa thang máy bị kẹt không mở được: Sử dụng hệ thống liên lạc khẩn cấp (nút Intercom) để gọi cứu trợ.
       - TUYỆT ĐỐI KHÔNG cố gắng cạy cửa thang máy trừ khi có hướng dẫn của lực lượng cứu hộ.
    5. Nếu vị trí của bạn là "Tầng thương mại/dịch vụ" và vị trí đám cháy là "Chưa xác định":
       - Nhấn mạnh việc giữ bình tĩnh, dừng mọi việc, TUYỆT ĐỐI KHÔNG sử dụng thang máy.
       - Hướng dẫn di chuyển theo sự chỉ dẫn của nhân viên kỹ thuật hoặc lực lượng PCCC tại chỗ qua hệ thống âm thanh.
       - Di chuyển nhanh đến lối thoát nạn theo hướng dẫn và gọi 114 khi đã an toàn.
       - Cảnh báo về nguy hiểm do hoảng loạn và xô đẩy trong đám đông.
    6. Nếu vị trí đám cháy là "Chưa xác định" (và không ở tầng thương mại hay thang máy), hãy ưu tiên hướng dẫn cư dân ở lại trong căn hộ, thực hiện các biện pháp ngăn khói và chờ cứu hộ, thay vì di chuyển ra ngoài trừ khi có nguy hiểm trực tiếp.
    7. Khi hướng dẫn cư dân di chuyển ra logia hoặc ban công để chờ cứu hộ, TUYỆT ĐỐI KHÔNG hướng dẫn họ đóng cửa logia hoặc ban công đó (để đảm bảo thông thoáng và dễ dàng được phát hiện/cứu hộ).
    8. Nếu có người yếu thế (người già, trẻ em, phụ nữ mang thai, người khuyết tật):
       - Tại tầng thương mại: Hướng dẫn họ ưu tiên nghe và làm theo chỉ dẫn của lực lượng tại chỗ qua thiết bị âm thanh vì khả năng vận động kém.
       - Tích hợp các lưu ý riêng biệt cho nhóm này trong các bước thoát nạn.
    9. Nếu vị trí của bạn là "Trong căn hộ" và vị trí đám cháy là "Trong căn hộ của bạn":
       - Bước 1: Hô hoán, báo động ngay lập tức cho mọi người trong nhà và hàng xóm biết.
       - Bước 2: Đánh giá kỹ năng chữa cháy của bản thân.
       - Bước 3 (Nếu có kỹ năng): Sử dụng bình chữa cháy xách tay để dập tắt đám cháy ngay khi còn nhỏ.
       - Bước 4 (Nếu không có kỹ năng): Nhanh chóng di chuyển ra khỏi căn hộ đến nơi an toàn.
       - Bước 5: Gọi ngay số điện thoại khẩn cấp 114 để yêu cầu trợ giúp khi đã ở nơi an toàn.
    10. Nếu tầng của bạn là "Tầng 1" hoặc "Tầng 2 - tầng 4", vị trí đám cháy là "Chưa xác định" và có người yếu thế (trẻ em/người già/người bệnh/phụ nữ mang thai):
       - Ưu tiên hướng dẫn di chuyển ra ban công, logia hoặc di chuyển nhanh ra khu vực an toàn bên ngoài thay vì ở lại trong căn hộ.
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

    const part = response.candidates?.[0]?.content?.parts?.[0];
    const base64Audio = part?.inlineData?.data;
    const mimeType = part?.inlineData?.mimeType;
    
    if (base64Audio) {
      // If the model returns raw PCM (common for TTS), we need to wrap it in a WAV header
      // so the browser's <audio> tag can play it.
      if (!mimeType || mimeType.includes('pcm')) {
        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Create WAV header for 16-bit Mono 24kHz PCM
        const sampleRate = 24000;
        const numChannels = 1;
        const bitsPerSample = 16;
        const header = new ArrayBuffer(44);
        const view = new DataView(header);

        view.setUint32(0, 0x52494646, false); // "RIFF"
        view.setUint32(4, 36 + len, true);    // File size
        view.setUint32(8, 0x57415645, false); // "WAVE"
        view.setUint32(12, 0x666d7420, false); // "fmt "
        view.setUint32(16, 16, true);         // Subchunk1Size
        view.setUint16(20, 1, true);          // AudioFormat (1 = PCM)
        view.setUint16(22, numChannels, true); // NumChannels
        view.setUint32(24, sampleRate, true);  // SampleRate
        view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true); // ByteRate
        view.setUint16(32, numChannels * (bitsPerSample / 8), true); // BlockAlign
        view.setUint16(34, bitsPerSample, true); // BitsPerSample
        view.setUint32(36, 0x64617461, false); // "data"
        view.setUint32(40, len, true);         // Subchunk2Size

        const wavBlob = new Blob([header, bytes], { type: 'audio/wav' });
        return URL.createObjectURL(wavBlob);
      }

      return `data:${mimeType || 'audio/mp3'};base64,${base64Audio}`;
    }
  } catch (error) {
    console.error("TTS Error:", error);
  }
  return null;
}
