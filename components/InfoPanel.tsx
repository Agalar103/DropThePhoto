
import React, { useEffect, useState } from 'react';
import { generatePunkLore } from '../services/geminiService';
import { LoreData } from '../types';

interface InfoPanelProps {
  locationName: string | null;
  onClose: () => void;
}

const InfoPanel: React.FC<InfoPanelProps> = ({ locationName, onClose }) => {
  const [lore, setLore] = useState<LoreData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (locationName) {
      setLoading(true);
      generatePunkLore(locationName).then(data => {
        setLore(data);
        setLoading(false);
      });
    } else {
      setLore(null);
    }
  }, [locationName]);

  if (!locationName) return null;

  return (
    <div className="absolute right-0 top-0 h-full w-full md:w-96 bg-slate-950/95 border-l border-pink-500/50 backdrop-blur-xl z-[2000] flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
      <div className="p-6 flex-1 overflow-y-auto">
        <div className="flex justify-between items-start mb-8">
          <div className="flex-1 mr-4">
            <h2 className="text-2xl font-black text-pink-500 font-orbitron tracking-tight uppercase punk-glow break-words">
              {locationName.split(',')[0]}
            </h2>
            <p className="text-[10px] text-cyan-400 opacity-60 mt-1 uppercase truncate">{locationName}</p>
            <div className="h-1 w-24 bg-gradient-to-r from-pink-500 to-transparent mt-2"></div>
          </div>
          <button 
            onClick={onClose}
            className="text-cyan-400 hover:text-pink-500 transition-colors p-2 font-bold"
          >
            [KAPAT]
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4 text-center">
            <div className="w-12 h-12 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin"></div>
            <p className="text-cyan-400 animate-pulse font-bold tracking-widest">VERİ TABANLARI ÇÖZÜLÜYOR...</p>
          </div>
        ) : lore ? (
          <div className="space-y-6">
            <section className="bg-slate-900/80 p-4 border border-cyan-500/30">
              <h3 className="text-cyan-400 text-xs font-bold uppercase mb-2 tracking-widest">Küresel İstihbarat</h3>
              <p className="text-gray-300 leading-relaxed text-sm italic">
                "{lore.summary}"
              </p>
            </section>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/80 p-3 border border-pink-500/20">
                <h4 className="text-pink-500 text-[10px] uppercase font-bold">ATMOSFER</h4>
                <p className="text-white text-xs">{lore.vibe}</p>
              </div>
              <div className="bg-slate-900/80 p-3 border border-pink-500/20">
                <h4 className="text-pink-500 text-[10px] uppercase font-bold">OTORİTE</h4>
                <p className="text-white text-xs">{lore.status}</p>
              </div>
            </div>

            <div className="bg-slate-900/80 p-4 border border-red-500/50">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-red-500 text-xs font-bold uppercase">TEHLİKE SEVİYESİ</h4>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                  lore.dangerLevel === 'EXTREME' ? 'bg-red-600 text-white animate-pulse' :
                  lore.dangerLevel === 'HIGH' ? 'bg-orange-600 text-white' :
                  lore.dangerLevel === 'MEDIUM' ? 'bg-yellow-600 text-black' :
                  'bg-green-600 text-white'
                }`}>
                  {lore.dangerLevel === 'EXTREME' ? 'KRİTİK' : 
                   lore.dangerLevel === 'HIGH' ? 'YÜKSEK' : 
                   lore.dangerLevel === 'MEDIUM' ? 'ORTA' : 'DÜŞÜK'}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${
                    lore.dangerLevel === 'EXTREME' ? 'bg-red-600' :
                    lore.dangerLevel === 'HIGH' ? 'bg-orange-500' :
                    lore.dangerLevel === 'MEDIUM' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: lore.dangerLevel === 'EXTREME' ? '100%' : lore.dangerLevel === 'HIGH' ? '75%' : lore.dangerLevel === 'MEDIUM' ? '50%' : '25%' }}
                ></div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800">
               <div className="text-[10px] text-cyan-400/50 font-mono space-y-1">
                 <p>// BAĞLANTI: AKTİF</p>
                 <p>// DİL: TR_LOCAL</p>
                 <p>// ŞİFRELEME: AES-256</p>
               </div>
            </div>
          </div>
        ) : (
          <p className="text-red-400">Veri alımında hata oluştu.</p>
        )}
      </div>

      <div className="p-4 bg-slate-900 border-t border-pink-500/30 flex justify-between items-center text-[10px] text-cyan-400 font-mono">
        <span>KOD_ANAHTARI: {Math.random().toString(16).slice(2, 10).toUpperCase()}</span>
        <span className="animate-pulse flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> CANLI_AKIS
        </span>
      </div>
    </div>
  );
};

export default InfoPanel;
