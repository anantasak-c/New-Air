import React, { useState, useEffect } from 'react';
import { Sparkles, RotateCw, Eye, Star, X } from 'lucide-react';
import { getDailyTarotCard } from '../data/tarotData';
import confetti from 'canvas-confetti';

export default function TarotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [card, setCard] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);

  const drawNewCard = async () => {
    setLoading(true);
    setIsFlipped(false);

    setTimeout(async () => {
      const newCard = await getDailyTarotCard();
      setCard(newCard);
      setLoading(false);
      setIsFlipped(true);

      confetti({
        particleCount: 25,
        spread: 60,
        origin: { y: 0.85 },
        colors: ['#0f172a', '#e2e8f0', '#fbbf24']
      });
    }, 300);
  };

  useEffect(() => {
    if (isOpen && !card) {
      drawNewCard();
    }
  }, [isOpen]);

  const handleFlipToggle = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <>
      {/* Ultra-Minimal Bottom Luxury Trigger Button */}
      <div className="w-full pt-2">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full py-3 px-4 rounded-xl bg-white dark:bg-[#121212] hover:bg-slate-50 dark:hover:bg-[#181818] border border-slate-200 dark:border-[#222222] text-slate-800 dark:text-slate-200 text-xs font-bold transition flex items-center justify-between shadow-sm active:scale-98 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>ดูดวงไพ่ทาโรต์เสริมพลังใจประจำวัน (Daily Flight Tarot)</span>
          </div>
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
            แตะเพื่อเปิดดู
          </span>
        </button>
      </div>

      {/* Luxury Tarot Modal Sheet */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div 
            className="fixed inset-0" 
            onClick={() => setIsOpen(false)}
          ></div>

          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#292929] p-5 sm:p-6 shadow-2xl z-10 space-y-4 animate-slide-up max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#222222] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  ไพ่ทาโรต์เสริมพลังใจประจำวัน
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={drawNewCard}
                  disabled={loading}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#1f1f1f] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#282828] text-xs font-bold transition flex items-center gap-1"
                  title="สุ่มไพ่ใหม่"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">สุ่มใหม่</span>
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex flex-col sm:flex-row items-center gap-5 pt-2">
              
              {/* 3D Flip Card Container */}
              <div className="shrink-0 flex flex-col items-center">
                <div 
                  onClick={handleFlipToggle}
                  className="w-36 h-56 sm:w-40 sm:h-64 perspective-1000 cursor-pointer group select-none"
                  title="แตะเพื่อพลิกดูไพ่"
                >
                  <div 
                    className={`relative w-full h-full duration-700 transform-style-preserve-3d transition-transform ${
                      isFlipped ? 'rotate-y-180' : ''
                    }`}
                  >
                    {/* Front side (Card Back) */}
                    <div className="absolute inset-0 w-full h-full rounded-2xl bg-slate-900 dark:bg-black p-3 shadow-md backface-hidden border-2 border-slate-700 dark:border-slate-800 flex flex-col items-center justify-between text-white">
                      <span className="text-[9px] font-mono tracking-widest text-slate-400">TAROT</span>
                      <div className="w-16 h-16 rounded-full border border-dashed border-slate-500 flex items-center justify-center text-xl">
                        ✦
                      </div>
                      <span className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded-full text-slate-300">
                        แตะเพื่อพลิก
                      </span>
                    </div>

                    {/* Back side (Revealed Card) */}
                    <div className="absolute inset-0 w-full h-full rounded-2xl bg-white dark:bg-black p-1.5 shadow-md backface-hidden rotate-y-180 border-2 border-slate-900 dark:border-white overflow-hidden flex flex-col items-center">
                      {card ? (
                        <div className="w-full h-full rounded-xl overflow-hidden relative bg-slate-100 dark:bg-[#1a1a1a] flex items-center justify-center">
                          <img 
                            src={card.image} 
                            alt={card.name} 
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/80 to-transparent p-2 text-white text-center">
                            <span className="text-[11px] font-bold block leading-tight">
                              {card.nameTh || card.name}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-xs text-slate-400">
                          กำลังสุ่ม...
                        </div>
                      )}
                    </div>

                  </div>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                  <Eye className="w-3 h-3" /> แตะเพื่อพลิกไพ่
                </span>
              </div>

              {/* Card Details */}
              <div className="flex-1 space-y-2.5 text-xs">
                {card ? (
                  <>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        {card.nameTh}
                      </h4>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {card.name} ({card.arcana})
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 font-medium">
                      {card.energy}
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#1a1a1a] border border-slate-100 dark:border-[#262626] text-slate-700 dark:text-slate-300 leading-relaxed">
                      <strong className="text-slate-900 dark:text-white block mb-0.5">ความหมาย:</strong>
                      <p>{card.meaning}</p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#1f1f1f] text-slate-900 dark:text-slate-100 leading-relaxed">
                      <strong className="text-slate-900 dark:text-white block mb-0.5">คำแนะนำวันนี้:</strong>
                      <p>{card.advice}</p>
                    </div>
                  </>
                ) : (
                  <div className="py-6 text-center text-slate-400">กำลังเตรียมไพ่ทาโรต์...</div>
                )}
              </div>

            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-bold transition active:scale-95 mt-2"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}
    </>
  );
}
