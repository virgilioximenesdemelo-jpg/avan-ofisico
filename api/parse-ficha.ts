import { GoogleGenAI, Type } from '@google/genai';

let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }
  return aiClient;
}

export default async function handler(req: any, res: any) {
  // Configura CORS caso chamado de outra origem
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    const { fileBase64, mimeType, fileName } = req.body || {};

    if (!fileBase64) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    }

    const ai = getGenAI();
    if (!ai) {
      return res.status(200).json({
        success: false,
        message: 'GEMINI_API_KEY não configurada no Vercel. Configure nas variáveis de ambiente do projeto.',
        data: null
      });
    }

    const cleanBase64 = fileBase64.replace(/^data:[^;]+;base64,/, '');
    const actualMimeType = mimeType || (fileName?.endsWith('.pdf') ? 'application/pdf' : 'image/png');

    const promptText = `
Você é um especialista em auditoria e controle de obras rodoviárias do DNIT (Departamento Nacional de Infraestrutura de Transportes) e Consórcio Matupiri.
Examine a Ficha de Campo / Diário de Obras (RDO) anexada nesta requisição e extraia rigorosamente todas as informações operacionais, com foco especial nas ATIVIDADES EM EXECUÇÃO.

Extraia as seguintes informações no formato JSON estruturado conforme o esquema:
1. "activities": Lista de todas as atividades/serviços de engenharia realizados. Para cada atividade extraia:
   - "activity": Nome do serviço/atividade executada (ex: "Revestimento Primário Com Adição de 3,5% de Cimento", "CBUQ Faixa de Rolamento", "Limpeza de Pista", "Sub-base de Solo Cimento", "Drenagem Pluvial").
   - "kmInitial": Quilômetro inicial numérico (ex: 386.96 ou 100.0).
   - "kmFinal": Quilômetro final numérico (ex: 386.20 ou 101.5).
   - "extensionKm": Extensão calculada em km (abs(kmFinal - kmInitial)).
2. "equipments": Lista de equipamentos presentes (tipo e quantidade).
3. "date": Data do RDO/Ficha no formato YYYY-MM-DD ou DD/MM/AAAA.
4. "weatherCondition": Condição do tempo (ex: "Bom", "Chuvoso", "Instável", "Nublado").
5. "responsibleTech": Responsáveis técnicos citados.
6. "occurrences": Ocorrências registradas.
7. "observations": Observações e resumo descritivo das atividades.
8. "contractNumber": Número do contrato de obra ou supervisão.

Se não conseguir ler algum campo específico, forneça estimativas razoáveis ou valores identificados no documento.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: [
        {
          inlineData: {
            mimeType: actualMimeType,
            data: cleanBase64
          }
        },
        {
          text: promptText
        }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            contractNumber: { type: Type.STRING },
            date: { type: Type.STRING },
            weatherCondition: { type: Type.STRING },
            responsibleTech: { type: Type.STRING },
            occurrences: { type: Type.STRING },
            observations: { type: Type.STRING },
            activities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  activity: { type: Type.STRING },
                  kmInitial: { type: Type.NUMBER },
                  kmFinal: { type: Type.NUMBER },
                  extensionKm: { type: Type.NUMBER }
                },
                required: ['activity', 'kmInitial', 'kmFinal', 'extensionKm']
              }
            },
            equipments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  quantity: { type: Type.NUMBER }
                },
                required: ['type', 'quantity']
              }
            }
          },
          required: ['activities']
        }
      }
    });

    const resultText = response.text || '{}';
    const parsedData = JSON.parse(resultText);

    return res.status(200).json({
      success: true,
      data: parsedData
    });
  } catch (error: any) {
    console.error('Erro no processamento da ficha:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Falha ao processar arquivo via IA'
    });
  }
}
