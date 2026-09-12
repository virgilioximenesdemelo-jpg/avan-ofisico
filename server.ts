import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload size for base64 PDF/image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Lazy init for Gemini SDK
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Endpoint de Saúde / API status
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', hasGeminiKey: Boolean(process.env.GEMINI_API_KEY) });
});

// Endpoint para leitura e extração de Ficha de Campo via IA (Gemini 3.6 Flash)
app.post('/api/parse-ficha', async (req, res) => {
  try {
    const { fileBase64, mimeType, fileName } = req.body;

    if (!fileBase64) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    }

    const ai = getGenAI();
    if (!ai) {
      console.warn('GEMINI_API_KEY não configurada. Retornando fallback.');
      return res.status(200).json({
        success: false,
        message: 'GEMINI_API_KEY não configurada. Usando leitor local.',
        data: null
      });
    }

    // Prepare inline data for Gemini
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
      model: 'gemini-3.6-flash',
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

    return res.json({
      success: true,
      data: parsedData
    });
  } catch (error: any) {
    console.error('Erro na rota /api/parse-ficha:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Falha ao processar arquivo via IA'
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor SCLAF executando na porta ${PORT}`);
  });
}

startServer();
