/**
 * Crea un elemento `<div>` que representa una animación de "puntos de escritura"
 * (por ejemplo, para mostrar que la otra parte en un chat está respondiendo).
 *
 * Estructura resultante:
 * <div class="typing-dots">
 *   <span>.</span><span>.</span><span>.</span>
 * </div>
 *
 * El estilo y la animación de los puntos dependen de las reglas CSS asociadas
 * a la clase `.typing-dots`.
 *
 * @returns {HTMLDivElement} Elemento DIV con la animación de puntos de escritura.
 *
 * @example
 * // Añadir indicador de escritura a un contenedor de chat
 * chatContainer.appendChild(createTypingDots());
 */
export const createTypingDots = () => {
  const dots = document.createElement('div');
  dots.className = 'typing-dots';
  dots.innerHTML = '<span>.</span><span>.</span><span>.</span>';
  return dots;
};
