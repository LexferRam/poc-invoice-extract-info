import { GoogleGenAI, Type } from "@google/genai";

export async function POST(request) {
  try {
    console.log('Llega al api para extraer datos del boleto');
    const { imageBase64 } = await request.json();

    if (!imageBase64) {
      return Response.json({ error: "No se proporcionó ninguna imagen" }, { status: 400 });
    }

    // Extraer el tipo MIME y los datos base64 puros
    const mimeType = imageBase64.match(/data:(.*?);base64,/)[1];
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    // Inicializar Gemini
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Lista de modelos a intentar en orden de prioridad
    const modelsToTry = [
      "gemini-2.5-flash-lite",
      "gemini-2.5-flash",
      "gemini-3.1-flash-lite-preview",
      "gemini-1.5-flash"
    ];

    let extractedData = null;
    let lastError = null;

    for (const model of modelsToTry) {
      try {
        console.log(`Intentando procesar boleto con el modelo: ${model}`);
        const response = await ai.models.generateContent({
          model: model,
          contents: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            "Analiza la imagen. Primero determina si es un boleto de avión. Si lo es, marca 'esBoletoValido' como true y extrae el país de origen, país de destino, fecha de ida, fecha de vuelta y cantidad de pasajeros. Si la imagen NO es un boleto reconocible, marca 'esBoletoValido' como false y deja lo demás vacío. Las fechas deben estar en formato estricto YYYY-MM-DD para que sean compatibles con inputs HTML."
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                esBoletoValido: { type: Type.BOOLEAN, description: "¿Es la imagen un boleto o reserva de viaje válido?" },
                paisOrigen: { type: Type.STRING, description: "País de origen del viaje" },
                paisDestino: { type: Type.STRING, description: "País de destino del viaje" },
                fechaIda: { type: Type.STRING, description: "Fecha de ida en formato estricto YYYY-MM-DD" },
                fechaVuelta: { type: Type.STRING, description: "Fecha de vuelta en formato estricto YYYY-MM-DD, si aplica" },
                cantidadPasajeros: { type: Type.INTEGER, description: "Cantidad total de pasajeros en la reserva" }
              }
            }
          }
        });

        extractedData = JSON.parse(response.text);
        console.log(`¡Éxito con el modelo ${model}!`);
        break; // Rompemos el bucle si la extracción fue exitosa
      } catch (error) {
        lastError = error;
        console.warn(`Fallo con el modelo ${model}: ${error.message}`);
        
        const isRetryableError = error.status === 503 || error.status === 429 || (error.message && (error.message.includes('503') || error.message.includes('429')));
        if (!isRetryableError) throw error;
      }
    }

    if (!extractedData) throw lastError || new Error("No se pudo obtener una respuesta de los modelos de Gemini.");

    return Response.json({ success: true, data: extractedData });
  } catch (error) {
    console.error("Error procesando el boleto:", error);
    return Response.json({ error: "Error al procesar la imagen del boleto" }, { status: 500 });
  }
}