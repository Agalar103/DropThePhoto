
import { GoogleGenAI, Type } from "@google/genai";
import { LoreData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateFakeDatingDrops(lat: number, lng: number) {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Konum (${lat}, ${lng}) civarında 4 adet gizemli cyberpunk dating kutusu üret.`,
    config: {
      systemInstruction: `Sen bir yeraltı dating ağı yapay zekasısın. 
      Kullanıcılar için etkileyici, kısa, punk tarzı notlar ve profiller üret. 
      Notlar flörtöz, gizemli veya asi olabilir. PEGI 18 atmosferine uygun olsun.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            age: { type: Type.NUMBER },
            gender: { type: Type.STRING, enum: ["Erkek", "Kadın", "Trans"] },
            bio: { type: Type.STRING },
            note: { type: Type.STRING }
          },
          required: ["name", "age", "gender", "bio", "note"]
        }
      }
    }
  });

  try {
    const text = response.text;
    return text ? JSON.parse(text.trim()) : [];
  } catch (e) {
    return [];
  }
}

export async function generateAiResponse(profile: any, chatHistory: any[], userMessage: string) {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Kullanıcı: ${userMessage}`,
    config: {
      systemInstruction: `Sen ${profile.name} isimli, ${profile.age} yaşında, ${profile.gender} bir siberpunk karakterisin. 
      Karakter özelliğin: ${profile.bio}. 
      Kullanıcı ile bir dating uygulamasında konuşuyorsun. 
      Kısa, etkileyici, biraz gizemli ve punk ruhuna uygun cevaplar ver. 
      Sohbet geçmişi: ${JSON.stringify(chatHistory)}.`,
    }
  });
  return response.text || "Sinyal kesildi... Tekrar dene.";
}

export async function generatePunkLore(locationName: string): Promise<LoreData | null> {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Konum: ${locationName}. Bu konum için cyberpunk/punk evreninde geçen kısa bir lore (hikaye) üret.`,
    config: {
      systemInstruction: `Sen bir yeraltı istihbarat ağı yapay zekasısın. 
      Verilen konum için cyberpunk atmosferinde, kısa ve etkileyici bilgiler üret. 
      Tehlike seviyesi, vibe ve otorite durumu gibi detaylar ekle.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          vibe: { type: Type.STRING },
          status: { type: Type.STRING },
          dangerLevel: { type: Type.STRING, enum: ["EXTREME", "HIGH", "MEDIUM", "LOW"] }
        },
        required: ["summary", "vibe", "status", "dangerLevel"]
      }
    }
  });

  try {
    const text = response.text;
    return text ? JSON.parse(text.trim()) : null;
  } catch (e) {
    console.error("Lore generation failed:", e);
    return null;
  }
}
