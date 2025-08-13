/**
 * Inicializa los manejadores del formulario de chat.
 *
 * @param {Object} params - Parámetros de inicialización.
 * @param {function(string): HTMLElement} params.$ - Selector tipo jQuery.
 * @param {function(HTMLElement): void} params.autoScroll - Función para hacer scroll automático en el contenedor de chat.
 * @param {function(Object): { bubble: HTMLElement, body: HTMLElement }} params.createBubble - Crea un nodo de burbuja de chat.
 * @param {function(string, string, AbortSignal, function(string, boolean), function(string)): Promise<void>} params.sendMessage - Envía el mensaje y gestiona la respuesta.
 * @param {string} params.fallbackAvatar - URL del avatar por defecto.
 * @param {string} params.userAvatar - URL del avatar del usuario.
 */
export function initFormHandlers({ $, autoScroll, createBubble, sendMessage, fallbackAvatar, userAvatar }) {
  const form = $('#chat-form');
  const chatContainer = $('#chat-container');
  const submitBtn = form?.querySelector('button[type="submit"]');
  const cancelBtn = $('#cancel-button');
  const select = $('#celebrity-select');
  const preview = $('#selected-avatar');
  let currentController = null;

  // Actualiza el avatar de la celebridad seleccionada
  if (select && preview) {
    select.addEventListener('change', () => {
      const opt = select.options[select.selectedIndex];
      preview.src = opt.dataset.avatar || fallbackAvatar;
    });
  }

  // Maneja el envío del formulario de chat
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const selectedId = form.selected?.value;
    const message = form.message?.value?.trim();
    if (!selectedId || !message) return;

    if (currentController) currentController.abort();
    currentController = new AbortController();

    submitBtn.disabled = true;
    cancelBtn.disabled = false;
    submitBtn.textContent = 'Esperando respuesta...';

    const userNode = createBubble({ role: 'user', name: 'Tú', avatarUrl: userAvatar, text: message, fallbackAvatar });
    chatContainer.appendChild(userNode.bubble);

    const celebName = select.options[select.selectedIndex].text;
    const celebAvatar = `/images/${selectedId}.jpg`;
    const celebNode = createBubble({ role: 'celeb', name: celebName, avatarUrl: celebAvatar, fallbackAvatar });
    chatContainer.appendChild(celebNode.bubble);

    autoScroll(chatContainer);

    const responseDiv = celebNode.body;
    responseDiv.textContent = '';

    await sendMessage(
      selectedId,
      message,
      currentController.signal,
      /**
       * Callback para manejar los fragmentos de respuesta.
       * @param {string} chunk - Fragmento de texto recibido.
       * @param {boolean} clear - Si se debe limpiar el contenido previo.
       */
      (chunk, clear) => {
        if (clear) responseDiv.textContent = '';
        responseDiv.textContent += chunk;
        requestAnimationFrame(() => autoScroll(chatContainer));
      },
      /**
       * Callback para manejar errores.
       * @param {string} errMsg - Mensaje de error.
       */
      (errMsg) => {
        responseDiv.innerHTML = `<span class="error">${errMsg}</span>`;
      }
    );

    submitBtn.disabled = false;
    cancelBtn.disabled = true;
    submitBtn.textContent = 'Enviar';
    form.message.value = '';
    form.message.focus();
    currentController = null;
  });

  // Maneja la cancelación de la respuesta
  cancelBtn?.addEventListener('click', () => {
    if (currentController) currentController.abort();
  });
}