import { GoogleGenAI, Type } from "@google/genai";
import { Transaction } from "../types";

// Helper function per generare un ID univoco basato sui dati della transazione
const generateDeterministicId = (data: any) => {
  const str = `${data.provider}_${data.amount}_${data.date}_${data.description}`.replace(/\s+/g, '').toLowerCase();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `AI_${Math.abs(hash).toString(36)}`;
};

export const analyzeFinancialStatus = async (transactions: Transaction[], condominiumName: string, adminInstructions: string = "") => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const summary = transactions.reduce((acc, curr) => {
    if (curr.type === 'EXPENSE') acc.expenses += curr.amount;
    else acc.income += curr.amount;
    return acc;
  }, { expenses: 0, income: 0 });

  const sortedTransactions = [...(transactions || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const prompt = `
    Analizza i seguenti dati finanziari per il condominio "${condominiumName}".
    
    Riepilogo:
    - Spese: €${summary.expenses.toLocaleString('it-IT')}
    - Incassi: €${summary.income.toLocaleString('it-IT')}
    - Saldo Attuale: €${(summary.income - summary.expenses).toLocaleString('it-IT')}
    
    Registro Transazioni:
    ${sortedTransactions.map(t => `- ${t.date}: ${t.description} (${t.type}) €${t.amount} [Versante: ${t.payerType || 'N/D'}]`).join('\n')}
  `;

  const systemInstruction = `
    Sei un esperto amministratore di condominio e analista finanziario.
    Analizza i dati forniti e offri suggerimenti strategici.
    ${adminInstructions ? `REGOLE MANDATORIE DALL'AMMINISTRATORE: ${adminInstructions}` : ''}
    Rispondi in italiano con tono professionale e conciso.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return "Analisi non disponibile.";
  }
};

export const extractInvoiceData = async (base64Data: string, mimeType: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    ANALISI DOCUMENTALE AVANZATA: Analizza il file e genera una struttura dettagliata per ogni spesa rilevata.
    
    REGOLE PER LA DESCRIZIONE (CAMPO 'description'):
    - La descrizione deve essere COMPLETA e includere numero e data fattura.
    
    REGOLE MANDATORIE PER FISCALITÀ (MODELLO 770):
    1. Estrai analiticamente ogni RIGA della fattura nel campo 'items'.
    2. Calcola accuratamente 'netAmount' (Imponibile) e 'taxAmount' (IVA).
    3. Individua la 'ritenuta' d'acconto (solitamente 4% per servizi condominiali o 20% per professionisti).
    4. Se rilevi ritenuta d'acconto, suggerisci il 'tributoCode' (es. 1019 per ritenuta 4%, 1040 per professionisti).

    CAMPI DA ESTRARRE:
    - description: Descrizione principale.
    - date: Data documento (YYYY-MM-DD).
    - amount: Totale Lordo (include IVA e commissioni).
    - netAmount: Imponibile Netto.
    - taxAmount: Totale IVA rilevata.
    - ritenuta: Valore in Euro della ritenuta d'acconto (Tassa 770).
    - tributoCode: Codice tributo suggerito (1019, 1020, 1040).
    - provider: Ragione Sociale.
    - providerFiscalCode: P.IVA o C.F.
    - category: Categoria di bilancio suggerita.
    - documentType: "FATTURA", "BOLLETTA", o "BOLLETTINO".
    - paymentStatus: "PAGATO" o "NON_PAGATO".
    - items: Array di oggetti con { description, amount }.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { data: base64Data, mimeType } }
        ]
      },
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
                  documentType: { type: Type.STRING, enum: ["FATTURA", "BOLLETTA", "BOLLETTINO"] },
                  paymentStatus: { type: Type.STRING, enum: ["PAGATO", "NON_PAGATO"] },
                  items: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        description: { type: Type.STRING },
                        amount: { type: Type.NUMBER }
                      }
                    }
                  }
                },
                required: ["description", "date", "amount", "provider", "paymentStatus"]
              }
            }
          },
          required: ["transactions"]
        }
      }
    });
    
    const text = response.text;
    if (!text) throw new Error("Empty response");
    const parsed = JSON.parse(text.trim());
    if (parsed.transactions) {
        parsed.transactions = parsed.transactions.map((t: any) => ({
            ...t,
            id: generateDeterministicId(t)
        }));
    }
    return parsed;
  } catch (error) {
    console.error("Gemini multi-OCR failed:", error);
    throw error;
  }
};

export const extractBankMovements = async (base64Data: string, mimeType: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Estrai i movimenti dall'estratto conto. Restituisci JSON con 'movements' e 'finalBalance'.`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { data: base64Data, mimeType } }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            movements: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING },
                  description: { type: Type.STRING },
                  amount: { type: Type.NUMBER }
                },
                required: ["date", "description", "amount"]
              }
            },
            finalBalance: { type: Type.NUMBER }
          },
          required: ["movements", "finalBalance"]
        }
      }
    });
    
    const text = response.text;
    if (!text) throw new Error("Empty response");
    const parsed = JSON.parse(text.trim());
    return parsed;
  } catch (error) {
    console.error("Gemini bank extraction failed:", error);
    throw error;
  }
};