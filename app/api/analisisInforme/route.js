import { GoogleGenAI, Type } from "@google/genai";

export async function POST(request) {
  try {
    console.log('Llega al api para extraer datos del informe médico');
    const { imageBase64 } = await request.json();

    if (!imageBase64) {
      return Response.json({ error: "No se proporcionó ninguna imagen" }, { status: 400 });
    }

    // Extraer el tipo MIME y los datos base64 puros
    const mimeType = imageBase64.match(/data:(.*?);base64,/)[1];
    const base64Data = imageBase64.replace(/^data:(.*?);base64,/, "");

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
        console.log(`Intentando procesar informe médico con el modelo: ${model}`);
        const response = await ai.models.generateContent({
          model: model,
          contents: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            "Analiza la imagen. Primero determina si es un informe médico, récipe, historia clínica o reporte de salud válido. Si lo es, marca 'esInformeValido' como true y extrae la información solicitada con la mayor precisión posible. Extrae la fecha del informe, el nombre del paciente, nombre del médico (incluyendo su especialidad si aparece), fecha de la consulta, diagnóstico o patología detallada, tratamiento sugerido y cualquier observación. Las fechas deben estar en formato estricto YYYY-MM-DD. Si la imagen NO es un informe reconocible, marca 'esInformeValido' como false y deja lo demás vacío."
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                esInformeValido: { type: Type.BOOLEAN, description: "¿Es la imagen un informe médico válido?" },
                fechaInforme: { type: Type.STRING, description: "Fecha de emisión del informe en formato estricto YYYY-MM-DD" },
                fechaConsulta: { type: Type.STRING, description: "Fecha de la consulta médica en formato estricto YYYY-MM-DD, si está disponible" },
                nombrePaciente: { type: Type.STRING, description: "Nombre completo del paciente" },
                edadPaciente: { type: Type.STRING, description: "Edad o fecha de nacimiento del paciente, si está disponible" },
                nombreMedico: { type: Type.STRING, description: "Nombre completo del médico tratante y su especialidad si se menciona" },
                patologia: { type: Type.STRING, description: "Descripción detallada del diagnóstico, enfermedad o patología del paciente" },
                tratamiento: { type: Type.STRING, description: "Tratamiento, medicamentos o indicaciones sugeridas por el médico" },
                observaciones: { type: Type.STRING, description: "Notas adicionales, próximos controles u observaciones importantes" }
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
        
        // Comprobamos si el error es 503 o 429 para reintentar
        const isRetryableError = error.status === 503 || error.status === 429 || (error.message && (error.message.includes('503') || error.message.includes('429')));
        if (isRetryableError) {
          console.log(`Error de disponibilidad detectado. Reintentando con el siguiente modelo...`);
          continue; 
        } else {
          throw error;
        }
      }
    }

    if (!extractedData) {
      throw lastError || new Error("No se pudo obtener una respuesta de los modelos de Gemini.");
    }

    // Validación
    if (!extractedData.esInformeValido) {
      return Response.json({ success: false, error: "Documento inválido. El archivo subido no parece ser un informe médico." }, { status: 400 });
    }

    return Response.json({ success: true, data: extractedData });
  } catch (error) {
    console.error("Error procesando el informe médico:", error);
    return Response.json({ error: "Error al procesar la imagen del informe médico" }, { status: 500 });
  }
}