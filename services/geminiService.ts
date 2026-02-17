import { GoogleGenAI, Type } from "@google/genai";
import { Transaction } from "../types";

// Genera un ID per non avere duplicati
const generateDeterministicId = (data: any) => {
  const str = `${data.provider}_${data.amount}_${data.date}_${data.description}`.replace(/\s+/g, '').toLowerCase();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `AI_${Math.abs(hash).toString(36)}`;
};

export const extractInvoiceData = async (base64Data: string, mimeType: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  const prompt = `
    ANALISI FISCALE FATTURE CONDOMINIO:
    Estrai i dati e identifica se c'è una Ritenuta d'Acconto (Modello 770).
    
    REGOLE:
    1. Se il fornitore è un professionista (Architetto, Avvocato): Ritenuta 20% (Codice 1040).
    2. Se è una ditta di servizi (Pulizie, Manutenzione): Ritenuta 4% (Codice 1019 o 1020).
    3. netAmount = Imponibile; taxAmount = IVA; ritenuta = Valore della ritenuta.
    4. amount = Totale Lordo Fattura.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash', // Versione stabile e veloce
      contents: [{
        parts: [
          { text: prompt },
          { inlineData: { data: base64Data, mimeType } }
        ]
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transactions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  date: { type: Type.STRING },
                  amount: { type: Type.NUMBER },
                  netAmount: { type: Type.NUMBER },
                  taxAmount: { type: Type.NUMBER },
                  ritenuta: { type: Type.NUMBER },
                  tributoCode: { type: Type.STRING },
                  provider: { type: Type.STRING },
                  providerFiscalCode: { type: Type.STRING },
                  category: { type: Type.STRING },
                  documentType: { type: Type.STRING },
                  paymentStatus: { type: Type.STRING }
                },
                required: ["description", "date", "amount", "provider"]
              }
            }
          }
        }
      }
    });

    const parsed = JSON.parse(response.text || '{"transactions":[]}');
    if (parsed.transactions) {
      parsed.transactions = parsed.transactions.map((t: any) => ({
        ...t,
        id: generateDeterministicId(t),
        is770Relevant: (t.ritenuta > 0) // Segna se è importante per il fisco
      }));
    }
    return parsed;
  } catch (error) {
    console.error("Errore AI:", error);
    throw error;
  }
};

// Funzione per l'analisi strategica (quella che avevi già)
export const analyzeFinancialStatus = async (transactions: Transaction[], condominiumName: string) => {
    // ... (qui rimane la tua funzione di analisi che abbiamo visto prima)
    return "Analisi completata."; 
};