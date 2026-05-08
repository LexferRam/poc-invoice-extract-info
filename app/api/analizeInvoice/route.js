import { GoogleGenAI, Type } from "@google/genai";


async function verModelosDisponibles() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  try {
    // Esta es la llamada real a la API "ListModels"
    const response = await ai.models.list();
    
    console.log("Modelos disponibles:");
    for await (const model of response) {
      console.log(`- ${model.name}`);
    }
  } catch (error) {
    console.error("Error obteniendo la lista de modelos:", error);
  }
}

// verModelosDisponibles();


export async function POST(request) {
  try {
    console.log('Llega al api para extraer datos de la factura');
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
      "gemini-3-flash-preview",
      "gemini-2.5-flash-lite",
      "gemini-2.5-flash",
    ];

    let extractedData = null;
    let lastError = null;

    for (const model of modelsToTry) {
      try {
        console.log(`Intentando procesar factura con el modelo: ${model}`);
        const response = await ai.models.generateContent({
          model: model,
          contents: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            "Analiza la imagen. Primero determina si es una factura o recibo de pago válido. Si lo es, marca 'esFacturaValida' como true y extrae la información solicitada con precisión. Extrae los montos en Bolívares (Bs) y Dólares (USD) de manera separada, si ambos están presentes en la factura. Incluye el símbolo de la moneda en cada string. Si la factura solo posee una moneda, deja los campos de la otra vacíos. Si está presente, extrae la tasa de cambio. Las fechas deben estar en formato estricto YYYY-MM-DD."
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                esFacturaValida: { type: Type.BOOLEAN, description: "¿Es la imagen una factura o recibo comercial válido?" },
                numeroFactura: { type: Type.STRING, description: "El número único de identificación de la factura" },
                fechaEmision: { type: Type.STRING, description: "Fecha de emisión de la factura en formato estricto YYYY-MM-DD" },
                emisorNombre: { type: Type.STRING, description: "Nombre o Razón Social de la empresa o persona que emite la factura" },
                emisorDocumento: { type: Type.STRING, description: "Documento de identidad fiscal del emisor (ej. RIF, NIT, RUT o DNI)" },
                receptorNombre: { type: Type.STRING, description: "Nombre o Razón Social del cliente al que se le emite la factura" },
                receptorDocumento: { type: Type.STRING, description: "Documento de identidad fiscal del cliente o receptor" },
                montoSubtotalBs: { type: Type.STRING, description: "Monto subtotal en Bolívares con su símbolo (ej. 'Bs. 150.00')" },
                montoSubtotalUsd: { type: Type.STRING, description: "Monto subtotal en Dólares con su símbolo (ej. '$ 20.00')" },
                impuestosTotalesBs: { type: Type.STRING, description: "Monto total de impuestos en Bolívares" },
                impuestosTotalesUsd: { type: Type.STRING, description: "Monto total de impuestos en Dólares" },
                montoTotalBs: { type: Type.STRING, description: "Monto total a pagar en Bolívares" },
                montoTotalUsd: { type: Type.STRING, description: "Monto total a pagar en Dólares" },
                tasaDeCambio: { type: Type.STRING, description: "Tasa de cambio (ej. BCV, IGTF, etc.) reflejada en la factura, si aplica." }
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

    // Validación: Si el modelo procesó la imagen pero determinó que no es una factura válida.
    if (!extractedData.esFacturaValida) {
      return Response.json({ success: false, error: "Documento inválido. El archivo subido no parece ser una factura." }, { status: 400 });
    }

    return Response.json({ success: true, data: extractedData });
  } catch (error) {
    console.error("Error procesando la factura:", error);
    return Response.json({ error: "Error al procesar la imagen de la factura" }, { status: 500 });
  }
}