import React from 'react';
import { Plane, Sparkles, Calendar, Clock, MapPin } from 'lucide-react';

export default function NotionHeader() {
  return (
    <header className="w-full mb-6">
      {/* Notion Page Cover Banner */}
      <div className="h-32 sm:h-44 w-full rounded-2xl bg-gradient-to-r from-[#5645d4] via-[#7563ea] to-[#9d8bf7] relative overflow-hidden shadow-notion">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-black/10"></div>
        {/* Subtle geometric lines */}
        <div className="absolute -right-8 -bottom-8 w-48 h-48 rounded-full border border-white/20"></div>
        <div className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full border border-white/10"></div>
        
        {/* Badge in cover */}
        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5 border border-white/30">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Flight & Rest Workspace</span>
        </div>
      </div>

      {/* Notion Page Header with Icon */}
      <div className="px-4 sm:px-8 -mt-10 sm:-mt-12 relative">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-2xl shadow-notion-card flex items-center justify-center text-3xl sm:text-4xl border border-notion-border select-none">
            ✈️
          </div>
        </div>

        {/* Title and description */}
        <div className="mt-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-notion-text-primary tracking-tight flex items-center gap-2">
            Flight & Rest Schedule Planner
          </h1>
          <p className="text-notion-text-secondary text-sm sm:text-base mt-1.5 leading-relaxed">
            ระบบคำนวณเวลาตื่นนอนและแผนการพักผ่อนสำหรับลูกเรือและนักเดินทาง สไตล์ Notion Workspace
          </p>
        </div>

        {/* Notion Property Pills / Metadata */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4 pt-3 border-t border-notion-border text-xs text-notion-text-secondary">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-md border border-notion-border shadow-sm">
            <MapPin className="w-3.5 h-3.5 text-notion-purple" />
            <span className="font-medium text-notion-text-primary">Base:</span>
            <span>Bangkok (BKK)</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-md border border-notion-border shadow-sm">
            <Clock className="w-3.5 h-3.5 text-notion-purple" />
            <span className="font-medium text-notion-text-primary">Timezone:</span>
            <span>Asia/Bangkok (UTC+7)</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#f2f0fc] text-notion-purple rounded-md border border-notion-purple-border font-medium">
            <span>✨ Notion Design System</span>
          </div>
        </div>
      </div>
    </header>
  );
}
