
export class GeminiService {
  async sendMessage(userInput: string, history: any[], attachedImage?: string) {
    try {
      const response = await fetch('/api/analisisCondicionado', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userInput,
          history,
          attachedImage
        }),
      });

      if (!response.ok) {
        throw new Error("Error en la respuesta del servidor");
      }

      const data = await response.json();
      return data.text;
    } catch (error) {
      console.error("API Error:", error);
      return "Lo siento, hubo un error de conexión al comunicarse con el servidor.";
    }
  }
}
