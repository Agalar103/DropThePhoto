
import React, { useState, useEffect, useRef } from 'react';
import WorldMap from './components/WorldMap';
import { User, PhotoBox, Gender, Chat, ChatMessage, Profile } from './types';
import { generateFakeDatingDrops, generateAiResponse } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'map' | 'profile' | 'inbox'>('map');
  const [user, setUser] = useState<User | null>(null);
  const [boxes, setBoxes] = useState<PhotoBox[]>([]);
  const [viewingBox, setViewingBox] = useState<PhotoBox | null>(null);
  const [droppingAt, setDroppingAt] = useState<{lat: number, lng: number} | null>(null);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [loginForm, setLoginForm] = useState({ email: '', pass: '' });
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [chatSearch, setChatSearch] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatFileRef = useRef<HTMLInputElement>(null);
  const [tempPhoto, setTempPhoto] = useState<string | null>(null);

  // Ses Efektleri
  const playSfx = (type: 'click' | 'msg' | 'alert' | 'success') => {
    const sfxMap = {
      click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
      msg: 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3',
      alert: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
      success: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'
    };
    const audio = new Audio(sfxMap[type]);
    audio.volume = 0.3;
    audio.play().catch(() => {});
  };

  useEffect(() => {
    if (userPos && boxes.length < 5) {
      loadFakeData(userPos[0], userPos[1]);
    }
  }, [userPos]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.email.toLowerCase().includes('demo123') && loginForm.pass === 'demo123') {
      playSfx('success');
      setUser({
        email: loginForm.email,
        name: 'Siber_Gezgin',
        age: 24,
        gender: 'Erkek',
        bio: 'Karanlık sokaklarda iz bırakıyorum...',
        photoUrl: 'https://picsum.photos/seed/me/400/400',
        isPremium: false,
        dropsRemaining: 10,
        lastResetTime: Date.now()
      });
    } else {
      playSfx('alert');
      alert("Hatalı Giriş! (demo123@dtp.com / demo123)");
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
      }, () => { setUserPos([41.0082, 28.9784]); });
    }
  }, []);

  const loadFakeData = async (lat: number, lng: number) => {
    const fakes = await generateFakeDatingDrops(lat, lng);
    const mapped = fakes.map((f: any, i: number) => ({
      id: `fake-${i}-${Date.now()}`,
      lat: lat + (Math.random() - 0.5) * 0.04,
      lng: lng + (Math.random() - 0.5) * 0.04,
      note: f.note,
      photoUrl: `https://picsum.photos/seed/${f.name + i}/400/600`,
      creator: {
        name: f.name, age: f.age, gender: f.gender, bio: f.bio,
        photoUrl: `https://picsum.photos/seed/${f.name + i}_prof/400/400`
      },
      createdAt: Date.now(),
      expiresAt: Date.now() + 86400000,
      isFake: true
    }));
    setBoxes(prev => [...prev, ...mapped]);
  };

  const handleDropSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !droppingAt) return;
    
    const dist = userPos ? Math.sqrt(Math.pow(droppingAt.lat - userPos[0], 2) + Math.pow(droppingAt.lng - userPos[1], 2)) : 0;
    if (!user.isPremium && dist > 0.2) {
      playSfx('alert');
      return alert("⚠️ ŞEHİR DIŞI ERİŞİM REDDEDİLDİ: Premium almalısın.");
    }

    if (!user.isPremium && user.dropsRemaining <= 0) {
      playSfx('alert');
      return alert("Günlük limit doldu!");
    }
    
    playSfx('success');
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const newBox: PhotoBox = {
      id: Math.random().toString(36).substr(2, 9),
      lat: droppingAt.lat,
      lng: droppingAt.lng,
      note: formData.get('note') as string,
      photoUrl: tempPhoto || `https://picsum.photos/seed/${Date.now()}/400/600`,
      creator: { ...user },
      createdAt: Date.now(),
      expiresAt: Date.now() + 86400000
    };

    setBoxes(prev => [newBox, ...prev]);
    if (!user.isPremium) setUser(u => u ? {...u, dropsRemaining: u.dropsRemaining - 1} : null);
    setDroppingAt(null);
    setTempPhoto(null);
  };

  const startChatRequest = (box: PhotoBox) => {
    if (!user) return;
    if (box.creator.name === user.name) {
      playSfx('alert');
      alert("⚠️ Kendi bıraktığın kutuya sinyal gönderemezsin.");
      return;
    }
    playSfx('click');

    const existing = chats.find(c => c.participant.name === box.creator.name);
    if (existing) {
      setActiveChatId(existing.id);
      setActiveTab('inbox');
      setViewingBox(null);
      return;
    }

    const newChat: Chat = {
      id: Math.random().toString(36),
      participant: box.creator,
      messages: [{ id: '1', senderId: 'user', text: `Bağlantı isteği gönderildi: "${box.note}"`, timestamp: Date.now() }],
      status: 'pending'
    };
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setActiveTab('inbox');
    setViewingBox(null);

    if (Math.random() > 0.3) {
      setTimeout(() => {
        playSfx('msg');
        setChats(prev => prev.map(c => c.id === newChat.id ? {
          ...c, status: 'accepted',
          messages: [...c.messages, { id: '2', senderId: box.creator.name, text: "Sinyalin ulaştı. Bağlantı kuruldu.", timestamp: Date.now() }]
        } : c));
      }, 3000);
    }
  };

  const sendMessage = async (payload: { text?: string, photoUrl?: string, type?: 'text' | 'voice' | 'photo' }) => {
    if (!activeChatId || !user) return;
    const chat = chats.find(c => c.id === activeChatId);
    if (!chat || chat.status !== 'accepted') return;

    playSfx('msg');
    const userMsg: ChatMessage = { 
      id: Date.now().toString(), 
      senderId: 'user', 
      text: payload.text, 
      photoUrl: payload.photoUrl,
      timestamp: Date.now(), 
      type: payload.type || 'text' 
    };
    setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, messages: [...c.messages, userMsg] } : c));
    
    if (payload.type !== 'voice' && payload.type !== 'photo') {
      setIsTyping(true);
      const aiResp = await generateAiResponse(chat.participant, chat.messages, payload.text || "");
      setIsTyping(false);
      playSfx('msg');
      const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), senderId: chat.participant.name, text: aiResp, timestamp: Date.now() };
      setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, messages: [...c.messages, aiMsg] } : c));
    }
  };

  const handleChatPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        sendMessage({ photoUrl: reader.result as string, type: 'photo' });
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleBlock = (chatId: string) => {
    playSfx('alert');
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, status: c.status === 'blocked' ? 'accepted' : 'blocked' } : c));
    if (activeChatId === chatId) setActiveChatId(null);
  };

  const isBoxInReach = (box: PhotoBox) => {
    if (!userPos) return false;
    const dist = Math.sqrt(Math.pow(box.lat - userPos[0], 2) + Math.pow(box.lng - userPos[1], 2));
    return dist < 0.008; 
  };

  const getGenderColor = (gender: Gender) => {
    if (gender === 'Erkek') return 'text-blue-400';
    if (gender === 'Kadın') return 'text-purple-400';
    if (gender === 'Trans') return 'text-slate-200';
    return 'text-pink-500';
  };

  const getGenderBorder = (gender: Gender) => {
    if (gender === 'Erkek') return 'border-blue-500';
    if (gender === 'Kadın') return 'border-purple-500';
    if (gender === 'Trans') return 'border-slate-400';
    return 'border-pink-500';
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-[#020617] text-white p-4">
        <div className="dtp-card p-10 w-full max-w-md rounded-[2.5rem] border-pink-500/40 shadow-2xl animate-in fade-in duration-700">
          <div className="text-center mb-10">
            <h1 className="text-7xl font-black font-orbitron text-pink-500 punk-glow leading-none">DTP</h1>
            <p className="text-cyan-400 text-[10px] tracking-[0.4em] uppercase mt-2">Underground Dating Network</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <input type="email" placeholder="Terminal ID" className="w-full bg-slate-900/50 border border-slate-800 p-5 rounded-2xl focus:border-pink-500 outline-none transition-all" onChange={e => setLoginForm({...loginForm, email: e.target.value})} />
            <input type="password" placeholder="Passcode" className="w-full bg-slate-900/50 border border-slate-800 p-5 rounded-2xl focus:border-pink-500 outline-none transition-all" onChange={e => setLoginForm({...loginForm, pass: e.target.value})} />
            <button className="w-full bg-pink-600 hover:bg-pink-500 p-5 font-black rounded-2xl uppercase tracking-widest shadow-xl shadow-pink-900/20 active:scale-95 transition-all">Sisteme Gir</button>
          </form>
        </div>
      </div>
    );
  }

  const activeChat = chats.find(c => c.id === activeChatId);

  return (
    <div className="relative w-screen h-screen bg-[#020617] text-white overflow-hidden flex flex-col">
      <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-[1001] pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto bg-slate-950/80 p-3 rounded-2xl border border-white/5 backdrop-blur-md">
          <div className="w-10 h-10 bg-pink-600 rounded-lg flex items-center justify-center font-black text-xl font-orbitron shadow-lg shadow-pink-500/20">D</div>
          <div className="text-xs font-bold uppercase tracking-widest text-pink-500 punk-glow">DTP_CORE</div>
        </div>
        <div className="flex items-center gap-4 pointer-events-auto">
          <div className="bg-slate-950/80 px-4 py-2 border border-cyan-500/30 rounded-full text-[10px] font-bold text-cyan-400 backdrop-blur-md italic">
            {user.isPremium ? 'SİNYAL: SINIRSIZ' : `LİMİT: ${user.dropsRemaining}/10`}
          </div>
          <button onClick={() => { playSfx('click'); setShowPremiumModal(true); }} className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase transition-all backdrop-blur-md ${user.isPremium ? 'bg-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.4)]' : 'border border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black'}`}>
            {user.isPremium ? '✈ SİBER ELİT' : '✈ PREMİUM AL'}
          </button>
        </div>
      </header>

      <main className="flex-1 relative w-full h-full">
        {activeTab === 'map' && (
          <WorldMap 
            boxes={boxes} 
            userPos={userPos}
            isPremium={user.isPremium}
            onMapClick={() => {}} 
            onLongPress={(lat, lng) => { playSfx('click'); setDroppingAt({lat, lng}); }}
            onBoxClick={(box) => { playSfx('click'); setViewingBox(box); }}
          />
        )}

        {activeTab === 'profile' && (
          <div className="h-full overflow-y-auto p-6 pt-24 flex flex-col items-center bg-slate-950">
             <div className="w-full max-w-md bg-slate-900/40 border border-slate-800 p-8 rounded-[2rem] space-y-8 animate-in slide-in-from-bottom">
                <div className="relative group mx-auto w-40 h-40">
                   <img src={user.photoUrl} className={`w-full h-full object-cover rounded-3xl border-2 ${getGenderBorder(user.gender)} shadow-2xl`} />
                   <div onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-3xl cursor-pointer font-bold text-[10px] uppercase text-white backdrop-blur-sm">Kimliği Güncelle</div>
                   <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e) => {
                     const file = e.target.files?.[0];
                     if(file) {
                       const reader = new FileReader();
                       reader.onloadend = () => setUser({...user, photoUrl: reader.result as string});
                       reader.readAsDataURL(file);
                     }
                   }} />
                </div>
                <div className="space-y-4">
                   <input value={user.name} onChange={e => setUser({...user, name: e.target.value})} placeholder="Kod Adı" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl outline-none focus:border-pink-500 transition-all" />
                   <div className="grid grid-cols-2 gap-4">
                      <input type="number" value={user.age} onChange={e => setUser({...user, age: parseInt(e.target.value)})} placeholder="Yaş" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl outline-none" />
                      <select value={user.gender} onChange={e => setUser({...user, gender: e.target.value as Gender})} className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl outline-none">
                         <option>Erkek</option><option>Kadın</option><option>Trans</option>
                      </select>
                   </div>
                   <textarea value={user.bio} onChange={e => setUser({...user, bio: e.target.value})} placeholder="Biyografi..." className="w-full bg-slate-950 border border-slate-800 p-4 h-24 rounded-xl outline-none resize-none focus:border-pink-500 transition-all" />
                   <button onClick={() => { playSfx('success'); alert("Profil güncellendi."); }} className="w-full bg-cyan-600 p-5 rounded-2xl font-black uppercase tracking-widest hover:bg-cyan-500 transition-all shadow-xl shadow-cyan-900/20">AĞI GÜNCELLE</button>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'inbox' && (activeChatId && activeChat && activeChat.status === 'blocked' ? (
          <div className="h-full flex flex-col items-center justify-center p-10 bg-slate-950">
             <div className="text-6xl mb-4">🚫</div>
             <p className="text-pink-500 font-bold uppercase mb-4 tracking-widest">BU KULLANICI ENGELLENDİ</p>
             <button onClick={() => toggleBlock(activeChatId)} className="bg-cyan-600 px-8 py-3 rounded-xl font-bold uppercase text-xs">Engeli Kaldır</button>
             <button onClick={() => setActiveChatId(null)} className="mt-4 text-xs text-gray-500 underline uppercase">Geri Dön</button>
          </div>
        ) : (
          <div className="h-full flex flex-col md:flex-row max-w-6xl mx-auto overflow-hidden bg-slate-950">
            <div className={`flex-1 md:flex-[0.4] border-r border-white/5 p-6 pt-24 overflow-y-auto ${activeChatId ? 'hidden md:block' : 'block'}`}>
              <h2 className="text-2xl font-black font-orbitron text-pink-500 mb-6 uppercase tracking-widest punk-glow">AKILLI AKIŞ</h2>
              <div className="relative mb-6">
                 <input 
                   type="text" value={chatSearch} onChange={e => setChatSearch(e.target.value)}
                   placeholder="Arama..." 
                   className="w-full bg-slate-900 border border-slate-800 p-3 rounded-xl text-xs outline-none focus:border-cyan-500" 
                 />
                 <span className="absolute right-4 top-3 opacity-30">🔍</span>
              </div>
              <div className="space-y-4">
                {chats.filter(c => c.participant.name.toLowerCase().includes(chatSearch.toLowerCase())).map(c => (
                  <div key={c.id} onClick={() => { playSfx('click'); setActiveChatId(c.id); }} className={`p-4 rounded-2xl cursor-pointer border transition-all flex items-center gap-4 ${activeChatId === c.id ? 'bg-pink-500/10 border-pink-500' : 'bg-slate-900/30 border-slate-800 hover:border-pink-500/30'}`}>
                    <img src={c.participant.photoUrl} className={`w-12 h-12 rounded-xl border-2 ${getGenderBorder(c.participant.gender)} object-cover`} />
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-black uppercase truncate ${getGenderColor(c.participant.gender)}`}>{c.participant.name}</div>
                      <div className={`text-[9px] font-mono ${c.status === 'accepted' ? 'text-cyan-400' : 'text-gray-500'}`}>
                        {c.status === 'pending' ? '○ ONAY BEKLİYOR' : c.status === 'blocked' ? '🚫 ENGELLİ' : '● BAĞLI'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`flex-[1.6] flex flex-col pt-24 bg-slate-900/10 ${!activeChatId ? 'hidden md:flex' : 'flex'}`}>
              {activeChatId && activeChat ? (
                <>
                  <div className="p-4 border-b border-white/5 flex items-center justify-between backdrop-blur-md">
                    <button onClick={() => setActiveChatId(null)} className="md:hidden text-cyan-400 font-bold p-2">[ GERİ ]</button>
                    <div className="flex items-center gap-3">
                      <img src={activeChat.participant.photoUrl} className={`w-10 h-10 rounded-full border-2 ${getGenderBorder(activeChat.participant.gender)}`} />
                      <div>
                        <span className={`font-black text-sm uppercase tracking-wider block ${getGenderColor(activeChat.participant.gender)}`}>{activeChat.participant.name}</span>
                        <span className="text-[9px] text-cyan-400 font-mono">GÜVENLİ HAT</span>
                      </div>
                    </div>
                    <button onClick={() => toggleBlock(activeChatId)} className="text-[10px] font-bold text-red-500 border border-red-500/30 px-3 py-1 rounded-full hover:bg-red-500 hover:text-white transition-all uppercase">Engelle</button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {activeChat.messages.map((m, idx) => (
                      <div key={idx} className={`flex ${m.senderId === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] p-2 rounded-[1.5rem] text-sm shadow-lg overflow-hidden ${m.senderId === 'user' ? 'bg-cyan-600 text-white rounded-tr-none' : 'bg-slate-900 border border-slate-800 rounded-tl-none'}`}>
                          {m.type === 'photo' ? (
                            <img src={m.photoUrl} className="w-full max-h-64 object-cover rounded-[1rem]" alt="sent" />
                          ) : m.type === 'voice' ? (
                            <div className="flex items-center gap-3 p-2">
                               <div className="w-8 h-8 bg-black/20 rounded-full flex items-center justify-center">▶</div>
                               <div className="w-24 h-1 bg-white/20 rounded-full relative overflow-hidden"><div className="absolute left-0 top-0 h-full w-1/3 bg-white"></div></div>
                            </div>
                          ) : (
                            <div className="p-2">{m.text}</div>
                          )}
                        </div>
                      </div>
                    ))}
                    {isTyping && <div className="text-[9px] text-cyan-400 animate-pulse font-mono tracking-[0.3em]">VERİ ÇÖZÜMLENİYOR...</div>}
                  </div>

                  {activeChat.status === 'pending' ? (
                    <div className="p-10 text-center opacity-40 italic text-xs uppercase tracking-[0.3em] bg-black/20 border-t border-white/5">
                      Onay bekleniyor...
                    </div>
                  ) : (
                    <div className="p-6">
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        const input = (e.target as any).message;
                        if(input.value.trim()) { sendMessage({ text: input.value }); input.value = ''; }
                      }} className="flex items-center gap-3">
                        <input 
                          type="file" 
                          ref={chatFileRef} 
                          hidden 
                          accept="image/*" 
                          onChange={handleChatPhoto} 
                        />
                        <button 
                          type="button" 
                          onClick={() => { playSfx('click'); chatFileRef.current?.click(); }}
                          className="text-xl opacity-60 hover:opacity-100 hover:scale-110 transition-all"
                        >
                          🖼️
                        </button>
                        <input name="message" autoComplete="off" placeholder="Mesajını fırlat..." className="flex-1 bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none focus:border-cyan-500 transition-all text-sm" />
                        <button 
                          type="button"
                          onMouseDown={() => { playSfx('click'); setIsRecording(true); }}
                          onMouseUp={() => { setIsRecording(false); sendMessage({ text: "Voice Message", type: "voice" }); }}
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isRecording ? 'bg-red-600 animate-pulse' : 'bg-slate-800 hover:bg-slate-700'}`}
                        >
                          {isRecording ? '⏺' : '🎤'}
                        </button>
                        <button className="bg-pink-600 px-6 py-4 rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all">GÖNDER</button>
                      </form>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center opacity-20 italic font-mono uppercase text-[10px] tracking-[0.5em] text-center p-10">
                  <span className="text-6xl mb-6">📡</span>
                  İstihbarat akışı bekliyor...
                </div>
              )}
            </div>
          </div>
        ))}
      </main>

      <nav className="p-4 bg-slate-950/90 border-t border-white/5 flex justify-around items-center z-[1001] backdrop-blur-2xl">
        <button onClick={() => { playSfx('click'); setActiveTab('profile'); }} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'profile' ? 'text-pink-500 scale-110' : 'text-slate-500'}`}>
          <span className="text-2xl">👤</span><span className="text-[9px] font-bold uppercase tracking-widest">KİMLİK</span>
        </button>
        <button onClick={() => { playSfx('click'); setActiveTab('map'); }} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'map' ? 'text-pink-500 scale-125' : 'text-slate-500'}`}>
          <span className="text-3xl">🛰</span><span className="text-[9px] font-bold uppercase tracking-widest">RADAR</span>
        </button>
        <button onClick={() => { playSfx('click'); setActiveTab('inbox'); }} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'inbox' ? 'text-pink-500 scale-110' : 'text-slate-500'}`}>
          <span className="text-2xl">📩</span><span className="text-[9px] font-bold uppercase tracking-widest">AKIŞ</span>
        </button>
      </nav>

      {/* Drop Modal */}
      {droppingAt && (
        <div className="absolute inset-0 flex items-center justify-center z-[2000] p-4 bg-slate-950/80 backdrop-blur-md animate-in zoom-in-95">
          <div className="dtp-card p-8 w-full max-w-sm rounded-3xl border-cyan-500/30">
            <h3 className="text-cyan-400 font-black uppercase text-xs mb-6 font-orbitron italic">Sinyal Kapsülü</h3>
            <form onSubmit={handleDropSubmit} className="space-y-6">
              <div onClick={() => fileInputRef.current?.click()} className={`h-48 bg-slate-900 border-2 border-dashed ${getGenderBorder(user.gender)} rounded-2xl flex flex-col items-center justify-center text-slate-500 cursor-pointer overflow-hidden`}>
                 {tempPhoto ? <img src={tempPhoto} className="w-full h-full object-cover" /> : <span className="text-[10px] font-bold uppercase">GÖRSEL EKLE</span>}
                 <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e) => {
                   const file = e.target.files?.[0];
                   if(file) {
                     const reader = new FileReader();
                     reader.onloadend = () => setTempPhoto(reader.result as string);
                     reader.readAsDataURL(file);
                   }
                 }} />
              </div>
              <textarea name="note" required placeholder="Gizli mesajın..." className="w-full bg-slate-950 border border-slate-800 p-4 h-28 rounded-2xl outline-none focus:border-cyan-500 text-sm" />
              <div className="flex gap-2">
                <button type="button" onClick={() => { playSfx('click'); setDroppingAt(null); setTempPhoto(null); }} className="flex-1 bg-slate-800 p-4 rounded-xl font-bold uppercase text-[10px]">İptal</button>
                <button className="flex-[2] bg-pink-600 p-4 rounded-xl font-bold uppercase text-[10px] shadow-lg">MÜHRÜ BAS</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Premium Modal */}
      {showPremiumModal && (
        <div className="absolute inset-0 flex items-center justify-center z-[3000] p-4 bg-slate-950/95 backdrop-blur-2xl animate-in fade-in">
          <div className="dtp-card p-10 w-full max-w-md rounded-[3.5rem] border-yellow-500 shadow-2xl text-center relative overflow-hidden">
            <div className="text-7xl mb-8">💎</div>
            <h2 className="text-4xl font-black font-orbitron text-yellow-500 mb-6 uppercase tracking-tighter">SİBER ELİT</h2>
            <p className="text-sm text-gray-300 mb-10">600 TL ile tüm sınırlamaları kaldır.</p>
            <button onClick={() => { playSfx('success'); setUser({...user, isPremium: true}); setShowPremiumModal(false); }} className="w-full bg-yellow-500 p-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-black active:scale-95 transition-all">YETKİYİ AL</button>
            <button onClick={() => { playSfx('click'); setShowPremiumModal(false); }} className="mt-8 text-[11px] text-gray-500 uppercase font-bold hover:text-white transition-colors tracking-widest">[ İPTAL ]</button>
          </div>
        </div>
      )}

      {/* Viewer Modal */}
      {viewingBox && (
        <div className="absolute inset-0 flex items-center justify-center z-[2000] p-4 bg-slate-950/95 backdrop-blur-2xl animate-in fade-in">
          <div className={`dtp-card w-full max-w-sm rounded-[3rem] overflow-hidden shadow-2xl relative border-2 ${getGenderBorder(viewingBox.creator.gender)}`}>
             <div className="relative h-[600px]">
                <img src={viewingBox.photoUrl} className="w-full h-full object-cover transition-all grayscale hover:grayscale-0 duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-8">
                   {isBoxInReach(viewingBox) ? (
                     <div className="space-y-6">
                        <div className="flex items-center gap-4 bg-slate-900/60 p-4 rounded-[1.5rem] border border-white/5">
                           <img src={viewingBox.creator.photoUrl} className={`w-16 h-16 rounded-2xl border-2 ${getGenderBorder(viewingBox.creator.gender)} object-cover`} />
                           <div className="overflow-hidden">
                              <div className={`text-[10px] ${getGenderColor(viewingBox.creator.gender)} font-bold uppercase`}>Veri Erişimi</div>
                              <h2 className="text-2xl font-black font-orbitron truncate">{viewingBox.creator.name}, {viewingBox.creator.age}</h2>
                           </div>
                        </div>
                        <div className="bg-cyan-500/10 p-4 rounded-2xl border border-cyan-500/30 italic text-cyan-400 text-sm">"{viewingBox.note}"</div>
                        {user.name !== viewingBox.creator.name && (
                          <button onClick={() => startChatRequest(viewingBox)} className="w-full bg-pink-600 p-5 rounded-2xl font-black uppercase tracking-[0.2em] active:scale-95 transition-all">İSTEK GÖNDER</button>
                        )}
                     </div>
                   ) : (
                     <div className="space-y-6 text-center bg-slate-950/80 p-6 rounded-[2rem] backdrop-blur-md border border-white/5">
                        <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-[0.3em] mb-4">Sinyal Kilitli</div>
                        <div className="p-4 bg-slate-900/50 rounded-2xl italic text-gray-400 text-sm">"{viewingBox.note}"</div>
                        {user.name !== viewingBox.creator.name && (
                          <button onClick={() => startChatRequest(viewingBox)} className="w-full bg-cyan-600 p-5 rounded-2xl font-black uppercase text-xs">BAĞLANTI İSTEĞİ AT</button>
                        )}
                     </div>
                   )}
                </div>
                <button onClick={() => { playSfx('click'); setViewingBox(null); }} className="absolute top-6 right-6 bg-black/40 p-2 rounded-full w-12 h-12 flex items-center justify-center font-bold">X</button>
             </div>
          </div>
        </div>
      )}

      <div className="absolute inset-0 pointer-events-none z-[500] scanline opacity-10"></div>
    </div>
  );
};

export default App;
