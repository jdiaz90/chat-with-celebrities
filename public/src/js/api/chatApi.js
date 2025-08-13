/**
 * Envía un mensaje al servidor para iniciar una conversación con una celebridad
 * y procesa la respuesta en streaming.
 *
 * @param {string} selectedId - ID de la celebridad con la que se quiere hablar.
 * @param {string} message - Texto del mensaje que el usuario envía.
 * @param {AbortSignal} signal - Permite cancelar la petición si el usuario pulsa “Detener respuesta”.
 * @param {(chunk: string, clear: boolean) => void} onChunk - Callback que recibe cada fragmento de texto generado.
 *        - `chunk`: texto recibido.
 *        - `clear`: si es `true`, indica que debe limpiarse el contenido previo.
 * @param {(errorMessage: string) => void} onError - Callback que se ejecuta si hay error de red o respuesta inválida.
 *
 * @returns {Promise<void>} - No devuelve nada, pero ejecuta los callbacks según el flujo de datos.
 */
export async function sendMessage(selectedId, message, signal, onChunk, onError) {
  try {
    const res = await fetch(`/stream/${selectedId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ message }),
      signal
    });

    if (!res.ok || !res.body) {
      onError(`Error ${res.status}: ${res.statusText}`);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let firstChunk = true;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });

      if (firstChunk) {
        onChunk('', true); // limpiar contenido previo
        firstChunk = false;
      }

      onChunk(chunk, false); // añadir nuevo fragmento
    }
  } catch {
    onError('🛑 Respuesta cancelada o fallo de conexión.');
  }
}
