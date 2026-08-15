import React, { useState, useEffect } from 'react';
import { Sparkles, RotateCw, Eye, Star, X, Sun, Moon, Compass } from 'lucide-react';
import { getDailyTarotCard } from '../data/tarotData';
import confetti from 'canvas-confetti';

export default function TarotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [card, setCard] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const drawNewCard = async () => {
    setLoading(true);
    setIsFlipped(false);
    setImageError(false);

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
      <div className="w-full pt-1">
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
                  className="w-40 h-64 sm:w-44 sm:h-68 perspective-1000 cursor-pointer group select-none"
                  title="แตะเพื่อพลิกดูไพ่"
                >
                  <div 
                    className={`relative w-full h-full duration-700 transform-style-preserve-3d transition-transform ${
                      isFlipped ? 'rotate-y-180' : ''
                    }`}
                  >
                    {/* Front side (Card Back Design) */}
                    <div className="absolute inset-0 w-full h-full rounded-2xl bg-slate-950 dark:bg-black p-3 shadow-md backface-hidden border-2 border-slate-700 dark:border-slate-800 flex flex-col items-center justify-between text-white">
                      <div className="w-full flex justify-between text-[9px] font-mono tracking-widest text-slate-400">
                        <span>✦</span>
                        <span>DAILY TAROT</span>
                        <span>✦</span>
                      </div>
                      
                      <div className="w-20 h-20 rounded-full border border-dashed border-slate-600 flex items-center justify-center text-3xl group-hover:scale-105 transition-transform bg-slate-900">
                        ✨
                      </div>

                      <span className="text-[10px] font-bold bg-white/10 px-3 py-0.5 rounded-full text-slate-300">
                        แตะเพื่อพลิกดูไพ่
                      </span>
                    </div>

                    {/* Back side (Revealed Tarot Card with Ornate Artwork) */}
                    <div className="absolute inset-0 w-full h-full rounded-2xl bg-[#0f172a] dark:bg-black p-2 shadow-md backface-hidden rotate-y-180 border-2 border-amber-400/80 dark:border-amber-400/80 overflow-hidden flex flex-col items-center justify-between text-white">
                      {card ? (
                        <>
                          {/* Top Roman Numeral */}
                          <div className="w-full text-center text-xs font-serif font-black tracking-widest text-amber-400 border-b border-amber-400/30 pb-1">
                            {card.number}
                          </div>

                          {/* Image or Ornate Vector Artwork */}
                          <div className="w-full flex-1 my-1.5 rounded-xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 flex flex-col items-center justify-center p-2 relative overflow-hidden">
                            {!imageError && card.image ? (
                              <img 
                                src={card.image} 
                                alt={card.name} 
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover rounded-lg"
                                onError={() => setImageError(true)}
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center text-center space-y-2">
                                <div className="text-4xl animate-pulse">
                                  {card.symbol || '✦'}
                                </div>
                                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                                  {card.arcana}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Bottom Card Title */}
                          <div className="w-full text-center text-[11px] font-bold text-amber-200 uppercase tracking-tight leading-tight border-t border-amber-400/30 pt-1">
                            {card.name}
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-center h-full text-xs text-slate-400">
                          กำลังสุ่ม...
                        </div>
                      )}
                    </div>

                  </div>
                </div>

                <span className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                  <Eye className="w-3 h-3" /> แตะที่การ์ดเพื่อพลิกไพ่
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

                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 font-medium flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{card.energy}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#1a1a1a] border border-slate-100 dark:border-[#262626] text-slate-700 dark:text-slate-300 leading-relaxed">
                      <strong className="text-slate-900 dark:text-white block mb-0.5">ความหมายของไพ่:</strong>
                      <p>{card.meaning}</p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#1f1f1f] text-slate-900 dark:text-slate-100 leading-relaxed">
                      <strong className="text-slate-900 dark:text-white block mb-0.5">คำแนะนำประจำวัน:</strong>
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
