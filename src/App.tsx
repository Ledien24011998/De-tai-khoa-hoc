/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { 
  Flame, 
  AlertTriangle, 
  Phone, 
  ChevronRight, 
  UserRound, 
  Wind, 
  Thermometer, 
  Volume2, 
  Home,
  ArrowLeft,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { FireScenario, AIResponse } from "./types";
import { getFireEscapeGuide, getVoiceGuide } from "./services/geminiService";

export default function App() {
  const [step, setStep] = useState<"home" | "input" | "guide">("home");
  const [loading, setLoading] = useState(false);
  const [scenario, setScenario] = useState<FireScenario>({
    floor: "Tầng 1",
    location: "Tầng thương mại/dịch vụ",
    fireLocation: "Chưa xác định",
    hasSmoke: false,
    isDoorHot: false,
    hasVulnerablePeople: false,
  });
  const [guide, setGuide] = useState<AIResponse | null>(null);
  const [activeAudioIndex, setActiveAudioIndex] = useState<number | null>(null);
  const [audioCache, setAudioCache] = useState<Record<number, string>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleFloorChange = (floor: string) => {
    const newLocation = floor === "Tầng 1" ? "Tầng thương mại/dịch vụ" : "Trong căn hộ";
    setScenario({ ...scenario, floor, location: newLocation });
  };

  const handleStart = () => setStep("input");

  const handleSubmit = async () => {
    setLoading(true);
    setAudioCache({});
    setActiveAudioIndex(null);
    try {
      const result = await getFireEscapeGuide(scenario);
      setGuide(result);
      setStep("guide");
    } catch (error) {
      console.error("Failed to get guide:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStepClick = async (index: number, text: string) => {
    if (activeAudioIndex === index && audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setActiveAudioIndex(null);
      return;
    }

    if (audioCache[index]) {
      setActiveAudioIndex(index);
      return;
    }

    setActiveAudioIndex(index);
    try {
      const url = await getVoiceGuide(text);
      if (url) {
        setAudioCache(prev => ({ ...prev, [index]: url }));
      } else {
        setActiveAudioIndex(null);
      }
    } catch (error) {
      console.error("TTS Error:", error);
      setActiveAudioIndex(null);
    }
  };

  useEffect(() => {
    if (activeAudioIndex !== null && audioCache[activeAudioIndex] && audioRef.current) {
      audioRef.current.src = audioCache[activeAudioIndex];
      audioRef.current.play().catch(e => console.error("Playback failed:", e));
    }
  }, [activeAudioIndex, audioCache]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <AnimatePresence mode="wait">
        {step === "home" && (
          <motion.div 
            key="home"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center min-h-screen p-6 text-center"
          >
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <Flame className="w-12 h-12 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
              FireSafe VN
            </h1>
            <p className="text-slate-600 mb-8 max-w-xs">
              Hướng dẫn thoát nạn chung cư thông minh theo quy chuẩn QCVN 06:2022/BXD.
            </p>
            
            <button 
              onClick={handleStart}
              className="w-full max-w-xs bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-2xl shadow-lg shadow-red-200 transition-all active:scale-95 flex items-center justify-center gap-2 text-lg"
            >
              <AlertTriangle className="w-6 h-6" />
              TÔI ĐANG GẶP CHÁY
            </button>
            
            <div className="mt-12 w-full max-w-xs">
              <a href="tel:114" className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col items-center transition-all active:scale-95">
                <Phone className="text-blue-600 mb-2" />
                <span className="text-xs font-medium">Gọi 114</span>
              </a>
            </div>
          </motion.div>
        )}

        {step === "input" && (
          <motion.div 
            key="input"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-6 max-w-md mx-auto"
          >
            <button onClick={() => setStep("home")} className="mb-6 flex items-center gap-1 text-slate-500 hover:text-slate-800">
              <ArrowLeft className="w-4 h-4" /> Quay lại
            </button>
            
            <h2 className="text-2xl font-bold mb-6">Xác nhận tình trạng</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Bạn đang ở tầng mấy?</label>
                <select 
                  value={scenario.floor}
                  onChange={(e) => handleFloorChange(e.target.value)}
                  className="w-full p-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none appearance-none"
                >
                  <option value="Tầng 1">Tầng 1</option>
                  <option value="Tầng 2 - tầng 4">Tầng 2 - tầng 4</option>
                  <option value="Tầng 5 - tầng 16">Tầng 5 - tầng 16</option>
                  <option value="Tầng 16+">Tầng 16+</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Vị trí hiện tại của bạn?</label>
                <select 
                  value={scenario.location}
                  onChange={(e) => setScenario({...scenario, location: e.target.value})}
                  className="w-full p-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none appearance-none"
                >
                  {scenario.floor === "Tầng 1" ? (
                    <option>Tầng thương mại/dịch vụ</option>
                  ) : (
                    <>
                      <option>Trong căn hộ</option>
                      <option>Trong thang máy</option>
                      <option>Cầu thang bộ</option>
                      <option>Tầng thương mại/dịch vụ</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Vị trí đám cháy?</label>
                <select 
                  value={scenario.fireLocation}
                  onChange={(e) => setScenario({...scenario, fireLocation: e.target.value})}
                  className="w-full p-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none appearance-none"
                >
                  <option>Chưa xác định</option>
                  <option>Tầng dưới</option>
                  <option>Tầng trên</option>
                  <option>Cùng tầng (hành lang)</option>
                  <option>Trong căn hộ của bạn</option>
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button 
                  onClick={() => setScenario({...scenario, hasSmoke: !scenario.hasSmoke})}
                  className={`p-4 rounded-xl border flex items-center justify-between transition-all ${scenario.hasSmoke ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-700 border-slate-200'}`}
                >
                  <div className="flex items-center gap-3">
                    <Wind className={scenario.hasSmoke ? 'text-slate-300' : 'text-slate-400'} />
                    <span className="font-medium">Có khói dày đặc</span>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${scenario.hasSmoke ? 'border-white bg-white' : 'border-slate-200'}`}>
                    {scenario.hasSmoke && <div className="w-3 h-3 bg-slate-800 rounded-full" />}
                  </div>
                </button>

                <button 
                  onClick={() => setScenario({...scenario, isDoorHot: !scenario.isDoorHot})}
                  className={`p-4 rounded-xl border flex items-center justify-between transition-all ${scenario.isDoorHot ? 'bg-red-50 text-red-700 border-red-200' : 'bg-white text-slate-700 border-slate-200'}`}
                >
                  <div className="flex items-center gap-3">
                    <Thermometer className={scenario.isDoorHot ? 'text-red-600' : 'text-slate-400'} />
                    <span className="font-medium">Cửa chính đang nóng</span>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${scenario.isDoorHot ? 'border-red-500 bg-white' : 'border-slate-200'}`}>
                    {scenario.isDoorHot && <div className="w-3 h-3 bg-red-600 rounded-full" />}
                  </div>
                </button>

                <button 
                  onClick={() => setScenario({...scenario, hasVulnerablePeople: !scenario.hasVulnerablePeople})}
                  className={`p-4 rounded-xl border flex items-center justify-between transition-all ${scenario.hasVulnerablePeople ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-slate-700 border-slate-200'}`}
                >
                  <div className="flex items-center gap-3">
                    <UserRound className={scenario.hasVulnerablePeople ? 'text-blue-600' : 'text-slate-400'} />
                    <span className="font-medium">Có trẻ em/người già/người bệnh/phụ nữ mang thai</span>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${scenario.hasVulnerablePeople ? 'border-blue-500 bg-white' : 'border-slate-200'}`}>
                    {scenario.hasVulnerablePeople && <div className="w-3 h-3 bg-blue-600 rounded-full" />}
                  </div>
                </button>
              </div>

              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" /> : "NHẬN HƯỚNG DẪN NGAY"}
              </button>
            </div>
          </motion.div>
        )}

        {step === "guide" && guide && (
          <motion.div 
            key="guide"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 max-w-md mx-auto pb-24"
          >
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => setStep("input")} className="flex items-center gap-1 text-slate-500">
                <ArrowLeft className="w-4 h-4" /> Sửa thông tin
              </button>
              <div className="flex items-center gap-2">
                <a href="tel:114" className="p-2 bg-red-600 rounded-full text-white hover:bg-red-700 active:scale-90 transition-all">
                  <Phone className="w-5 h-5" />
                </a>
              </div>
            </div>

            <div className="bg-red-50 border border-red-100 p-4 rounded-2xl mb-8">
              <h3 className="text-red-800 font-bold flex items-center gap-2 mb-1">
                <AlertTriangle className="w-5 h-5" /> Tình huống:
              </h3>
              <p className="text-red-700 text-sm">{guide.scenario}</p>
            </div>

            <div className="space-y-4">
              {guide.steps.map((s, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => handleStepClick(i, s.action)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex gap-4 ${activeAudioIndex === i ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-[1.02]' : 'bg-white text-slate-900 border-slate-100 shadow-sm hover:border-slate-300'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 ${activeAudioIndex === i ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}`}>
                    {activeAudioIndex === i && !audioCache[i] ? <Loader2 className="w-4 h-4 animate-spin" /> : s.step}
                  </div>
                  <div className="flex-1">
                    <p className={`font-bold leading-tight mb-1 ${activeAudioIndex === i ? 'text-white' : 'text-slate-900'}`}>{s.action}</p>
                    {s.condition && (
                      <p className={`text-xs italic ${activeAudioIndex === i ? 'text-slate-300' : 'text-slate-500'}`}>Lưu ý: {s.condition}</p>
                    )}
                  </div>
                  {activeAudioIndex === i && audioCache[i] && (
                    <Volume2 className="w-5 h-5 text-white animate-pulse" />
                  )}
                </motion.div>
              ))}
            </div>

            <div className="fixed bottom-6 left-6 right-6 flex gap-3">
              <button 
                onClick={() => setStep("home")}
                className="flex-1 bg-white border border-slate-200 text-slate-600 font-bold py-4 rounded-2xl shadow-sm flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" /> Trang chủ
              </button>
              <a 
                href="tel:114"
                className="flex-[2] bg-red-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-red-200 flex items-center justify-center gap-2"
              >
                <Phone className="w-5 h-5" /> GỌI CỨU HỘ 114
              </a>
            </div>
            
            <audio ref={audioRef} onEnded={() => setActiveAudioIndex(null)} className="hidden" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
