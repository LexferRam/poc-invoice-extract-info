import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT } from "../../informeCondicionado/constants";

export async function POST(request) {
  try {
    const { userInput, history, attachedImage } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "API Key not found" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const modelName = 'gemini-3.5-flash';

    const parts = [{ text: userInput }];
    
    if (attachedImage) {
      const mimeType = attachedImage.split(';')[0].split(':')[1] || 'image/jpeg';
      const base64Data = attachedImage.split(',')[1] || attachedImage;
      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      });
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        ...(history || []),
        { role: 'user', parts: parts }
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.4, // Lower temperature for better extraction accuracy
        topP: 0.9,
        topK: 40,
      }
    });

    return Response.json({ text: response.text || "Lo siento, tuve un problema procesando tu solicitud. ¿Podrías intentarlo de nuevo?" });
  } catch (error) {
    console.error("Gemini API Error:", error);
    return Response.json({ text: "Lo siento, hubo un error al procesar la información. Si enviaste una imagen, asegúrate de que sea clara." }, { status: 500 });
  }
}