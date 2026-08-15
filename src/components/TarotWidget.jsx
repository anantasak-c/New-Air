import React, { useState, useEffect } from 'react';
import { Sparkles, RotateCw, Eye, Star, Heart } from 'lucide-react';
import { getDailyTarotCard } from '../data/tarotData';
import confetti from 'canvas-confetti';

export default function TarotWidget() {
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
        particleCount: 30,
        spread: 70,
        origin: { y: 0.85 },
        colors: ['#ffffff', '#276ef1', '#ffc043']
      });
    }, 400);
  };

  useEffect(() => {
    drawNewCard();
  }, []);

  const handleFlipToggle = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="w-full rounded-2xl bg-[#141414] dark:bg-[#141414] border border-[#292929] p-4 sm:p-6 shadow-uber-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#222222] pb-3 mb-5">
        <div>
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <span>🔮 ไพ่ทาโรต์ประจำวัน (Daily Flight Tarot)</span>
          </h2>
          <p className="text-xs text-[#a6a6a6]">
            เช็คพลังงานบวกและคำแนะนำเสริมความมั่นใจในการปฏิบัติภารกิจ
          </p>
        </div>

        <button
          onClick={drawNewCard}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1f1f1f] hover:bg-[#262626] border border-[#333333] text-white rounded-xl text-xs font-semibold transition active:scale-95 disabled:opacity-50"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>สุ่มไพ่ใหม่</span>
        </button>
      </div>

      {/* Interactive Tarot Display */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        
        {/* Card 3D Flip Container */}
        <div className="md:col-span-4 flex flex-col items-center justify-center">
          <div 
            onClick={handleFlipToggle}
            className="w-44 h-72 sm:w-48 sm:h-80 perspective-1000 cursor-pointer group select-none"
            title="คลิกเพื่อพลิกดูไพ่"
          >
            <div 
              className={`relative w-full h-full duration-700 transform-style-preserve-3d transition-transform ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* Front side (Uber Ink Black Geometric Card Back) */}
              <div className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-br from-[#111111] via-[#000000] to-[#1a1a1a] p-3.5 shadow-uber-elevated backface-hidden border-2 border-[#333333] flex flex-col items-center justify-between text-white">
                <div className="w-full flex justify-between text-[10px] font-mono tracking-widest text-[#757575]">
                  <span>✦ 00</span>
                  <span>FLIGHT TAROT</span>
                  <span>00 ✦</span>
                </div>

                <div className="w-24 h-24 rounded-full border border-dashed border-[#444444] flex items-center justify-center text-3xl group-hover:scale-110 transition-transform bg-[#141414]">
                  ✈️
                </div>

                <div className="text-center">
                  <span className="text-[11px] font-bold bg-[#1f1f1f] border border-[#333333] px-3 py-1 rounded-full text-[#a6a6a6]">
                    แตะเพื่อเปิดไพ่
                  </span>
                </div>
              </div>

              {/* Back side (Revealed Tarot Card) */}
              <div className="absolute inset-0 w-full h-full rounded-2xl bg-[#000000] p-2 shadow-uber-elevated backface-hidden rotate-y-180 border-2 border-white overflow-hidden flex flex-col items-center">
                {card ? (
                  <div className="w-full h-full rounded-xl overflow-hidden relative bg-[#141414] flex items-center justify-center">
                    <img 
                      src={card.image} 
                      alt={card.name} 
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/80 to-transparent p-2.5 text-white text-center">
                      <span className="text-xs font-black block leading-tight">
                        {card.nameTh || card.name}
                      </span>
                      <span className="text-[9px] text-[#a6a6a6] uppercase tracking-wider block">
                        {card.arcana}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-[#6b6b6b]">
                    กำลังโหลด...
                  </div>
                )}
              </div>

            </div>
          </div>

          <span className="text-[11px] text-[#6b6b6b] mt-2.5 flex items-center gap-1">
            <Eye className="w-3 h-3" /> แตะที่การ์ดเพื่อพลิกดู
          </span>
        </div>

        {/* Card Details & Reading */}
        <div className="md:col-span-8 space-y-3.5">
          {card ? (
            <>
              {/* Card Title & Keywords */}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg sm:text-xl font-black text-white">
                    {card.nameTh}
                  </h3>
                  <span className="text-xs text-white font-mono bg-[#262626] px-2.5 py-0.5 rounded-full border border-[#383838]">
                    {card.name}
                  </span>
                </div>

                {card.keywords && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {card.keywords.map((kw, idx) => (
                      <span 
                        key={idx} 
                        className="text-[11px] font-medium px-2 py-0.5 bg-[#1a1a1a] text-[#a6a6a6] rounded-md border border-[#292929]"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Energy Badge */}
              <div className="p-3 bg-amber-400/10 border border-amber-400/20 rounded-xl text-xs font-bold text-amber-300 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{card.energy}</span>
              </div>

              {/* Meaning */}
              <div className="p-3.5 bg-[#1a1a1a] rounded-xl border border-[#292929] text-xs leading-relaxed text-slate-200">
                <strong className="text-[#a6a6a6] block mb-1 uppercase tracking-wider text-[10px]">
                  ความหมายของไพ่:
                </strong>
                <p>{card.meaning}</p>
              </div>

              {/* Work & Duty Advice */}
              <div className="p-3.5 bg-[#1f1f1f] rounded-xl border border-[#383838] text-xs leading-relaxed text-white">
                <strong className="text-uber-blue flex items-center gap-1.5 mb-1 uppercase tracking-wider text-[10px]">
                  <Sparkles className="w-3 h-3" />
                  คำแนะนำสำหรับการเดินทาง & การทำงาน:
                </strong>
                <p>{card.advice}</p>
              </div>
            </>
          ) : (
            <div className="p-6 text-center text-[#6b6b6b] text-xs">
              กำลังเตรียมไพ่ทาโรต์ประจำวัน...
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
