'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';

interface AnalysisResult {
  overview: string;
  fiveOfficials: {
    ear: string;
    eyebrow: string;
    eye: string;
    nose: string;
    mouth: string;
  };
  threeZones: {
    upper: string;
    middle: string;
    lower: string;
  };
  twelvePalaces: {
    life: string;
    wealth: string;
    siblings: string;
    marriage: string;
    children: string;
    health: string;
    travel: string;
    friends: string;
    career: string;
    property: string;
    fortune: string;
    parents: string;
  };
  fortune: {
    career: string;
    wealth: string;
    love: string;
    health: string;
  };
  advice: string;
  luckyElements: {
    color: string;
    number: string;
    direction: string;
  };
}

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('图片大小不能超过10MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleAnalyze = async () => {
    if (!image || !imageFile) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '分析失败');
      }
      
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析过程中出现错误，请重试');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setImage(null);
    setImageFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8 md:mb-12">
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">
            🔮 AI 面相大师
          </h1>
          <p className="text-gray-400 text-lg">
            上传您的正面照片，AI将为您解读面相命理
          </p>
        </header>

        {!result ? (
          /* Upload Section */
          <div className="glass-card p-6 md:p-8">
            {!image ? (
              <div
                className="upload-zone rounded-xl p-12 text-center cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <div className="text-6xl mb-4">📷</div>
                <p className="text-xl text-gray-300 mb-2">点击或拖拽上传面部照片</p>
                <p className="text-sm text-gray-500">支持 JPG、PNG 格式，建议正面清晰照片</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="relative w-64 h-64 mx-auto rounded-xl overflow-hidden border-2 border-purple-500/50">
                  <Image
                    src={image}
                    alt="上传的照片"
                    fill
                    className="object-cover"
                  />
                </div>
                
                <div className="flex justify-center gap-4">
                  <button
                    onClick={resetAnalysis}
                    className="px-6 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 transition"
                  >
                    重新上传
                  </button>
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className={`px-8 py-3 rounded-xl text-white font-semibold ${
                      isAnalyzing ? 'analyzing bg-purple-600' : 'glow-button'
                    }`}
                  >
                    {isAnalyzing ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        AI分析中...
                      </span>
                    ) : '开始面相分析'}
                  </button>
                </div>
              </div>
            )}
            
            {error && (
              <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-center">
                {error}
              </div>
            )}
          </div>
        ) : (
          /* Results Section */
          <div className="space-y-6">
            {/* Overview */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-purple-500">
                  <Image src={image!} alt="照片" fill className="object-cover" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold gradient-text">面相总评</h2>
                  <p className="text-gray-400">AI智能解读</p>
                </div>
              </div>
              <p className="text-gray-200 leading-relaxed">{result.overview}</p>
            </div>

            {/* Five Officials */}
            <div className="glass-card p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span>👁️</span> 五官分析
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'ear', name: '耳 · 采听官', icon: '👂' },
                  { key: 'eyebrow', name: '眉 · 保寿官', icon: '🤨' },
                  { key: 'eye', name: '眼 · 监察官', icon: '👁️' },
                  { key: 'nose', name: '鼻 · 审辨官', icon: '👃' },
                  { key: 'mouth', name: '口 · 出纳官', icon: '👄' },
                ].map((item) => (
                  <div key={item.key} className="result-card p-4 rounded-xl">
                    <h4 className="font-semibold text-purple-300 mb-2">
                      {item.icon} {item.name}
                    </h4>
                    <p className="text-sm text-gray-300">
                      {result.fiveOfficials[item.key as keyof typeof result.fiveOfficials]}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Three Zones */}
            <div className="glass-card p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span>📐</span> 三停分析
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { key: 'upper', name: '上停', desc: '少年运 (15-30岁)', icon: '🌅' },
                  { key: 'middle', name: '中停', desc: '中年运 (31-50岁)', icon: '☀️' },
                  { key: 'lower', name: '下停', desc: '晚年运 (51岁后)', icon: '🌙' },
                ].map((item) => (
                  <div key={item.key} className="result-card p-4 rounded-xl">
                    <h4 className="font-semibold text-cyan-300 mb-1">
                      {item.icon} {item.name}
                    </h4>
                    <p className="text-xs text-gray-500 mb-2">{item.desc}</p>
                    <p className="text-sm text-gray-300">
                      {result.threeZones[item.key as keyof typeof result.threeZones]}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Fortune */}
            <div className="glass-card p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span>🎯</span> 运势预测
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'career', name: '事业运', icon: '💼' },
                  { key: 'wealth', name: '财运', icon: '💰' },
                  { key: 'love', name: '感情运', icon: '💕' },
                  { key: 'health', name: '健康运', icon: '💪' },
                ].map((item) => (
                  <div key={item.key} className="fortune-section p-4 rounded-xl">
                    <h4 className="font-semibold text-amber-300 mb-2">
                      {item.icon} {item.name}
                    </h4>
                    <p className="text-sm text-gray-300">
                      {result.fortune[item.key as keyof typeof result.fortune]}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Lucky Elements & Advice */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-card p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span>🍀</span> 开运指南
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🎨</span>
                    <div>
                      <p className="text-sm text-gray-500">幸运颜色</p>
                      <p className="text-purple-300 font-semibold">{result.luckyElements.color}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🔢</span>
                    <div>
                      <p className="text-sm text-gray-500">幸运数字</p>
                      <p className="text-cyan-300 font-semibold">{result.luckyElements.number}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🧭</span>
                    <div>
                      <p className="text-sm text-gray-500">吉利方位</p>
                      <p className="text-amber-300 font-semibold">{result.luckyElements.direction}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span>💡</span> 大师寄语
                </h3>
                <p className="text-gray-200 leading-relaxed">{result.advice}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 pt-4">
              <button
                onClick={resetAnalysis}
                className="px-8 py-3 rounded-xl glow-button text-white font-semibold"
              >
                重新测算
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center mt-12 text-gray-500 text-sm">
          <p>🔮 AI面相大师 · 仅供娱乐参考</p>
          <p className="mt-1">面相学为传统文化，结果不代表科学依据</p>
        </footer>
      </div>
    </main>
  );
}
