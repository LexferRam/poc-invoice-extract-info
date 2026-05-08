import { GoogleGenAI, Type } from "@google/genai";

export async function POST(request) {
  try {


    console.log('Llega al api para extraer datos');
    const { imageBase64 } = await request.json();

    if (!imageBase64) {
      return Response.json({ error: "No se proporcionó ninguna imagen" }, { status: 400 });
    }

    // Extraer el tipo MIME y los datos base64 puros
    const mimeType = imageBase64.match(/data:(.*?);base64,/)[1];
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    // Inicializar Gemini

    console.log('El api Key es:------------>',process.env.GEMINI_API_KEY);
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Lista de modelos a intentar en orden de prioridad
    const modelsToTry = [
      "gemini-2.5-flash-lite",
      "gemini-3.1-flash-lite-preview",
      "gemini-2.5-flash",
      "gemini-1.5-flash"
    ];

    let extractedData = null;
    let lastError = null;

    for (const model of modelsToTry) {
      try {
        console.log(`Intentando procesar imagen con el modelo: ${model}`);
        const response = await ai.models.generateContent({
          model: model,
          contents: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            "Analiza la imagen. Primero determina si es una Cédula de Identidad o un Pasaporte válido. Si lo es, extrae la información solicitada y marca 'esValido' como true. Si la imagen NO es un documento de identidad reconocible, marca 'esValido' como false y deja lo demás en blanco. Tanto para la 'fechaNacimiento' como para la 'fechaVencimiento', debes retornarlas estrictamente en el formato DD/MM/YYYY usando solo números. Para el día (DD) de la 'fechaVencimiento', debes calcular y colocar obligatoriamente el último día del mes correspondiente."
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                esValido: { type: Type.BOOLEAN, description: "¿Es la imagen una Cédula o Pasaporte válido?" },
                cedula: { type: Type.STRING, description: "Número de cédula o pasaporte (ej. V-12.345.678 o un código alfanumérico)" },
                apellidos: { type: Type.STRING, description: "Apellidos de la persona" },
                nombres: { type: Type.STRING, description: "Nombres de la persona" },
                fechaNacimiento: { type: Type.STRING, description: "Fecha de nacimiento en formato estricto DD/MM/YYYY (solo números)" },
                fechaVencimiento: { type: Type.STRING, description: "Fecha de vencimiento o expiración en formato estricto DD/MM/YYYY usando solo números (calculando que el día sea el último del mes)" },
                estadoCivil: { type: Type.STRING, description: "Estado civil (S, C, D, V)" }
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
        
        // Comprobamos si el error es 503 (Service Unavailable) o 429 (Too Many Requests) para reintentar
        const isRetryableError = error.status === 503 || error.status === 429 || (error.message && (error.message.includes('503') || error.message.includes('429')));
        
        if (isRetryableError) {
          console.log(`Error de disponibilidad detectado. Reintentando con el siguiente modelo...`);
          continue; // Pasamos al siguiente modelo de la lista
        } else {
          // Si es un error diferente (por ejemplo 400 Bad Request), no reintentamos
          throw error;
        }
      }
    }

    if (!extractedData) {
      throw lastError || new Error("No se pudo obtener una respuesta de los modelos de Gemini.");
    }

    return Response.json({ success: true, data: extractedData });

  } catch (error) {
    console.error("Error procesando la imagen:", error);
    return Response.json({ error: "Error al procesar la imagen de la cédula" }, { status: 500 });
  }
}