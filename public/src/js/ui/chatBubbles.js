import { createTypingDots } from './typingDots.js';

/**
 * Crea un elemento <img> configurado como avatar, con carga diferida y fallback en caso de error.
 *
 * @param {string} src - URL de la imagen a mostrar.
 * @param {string} alt - Texto alternativo para accesibilidad.
 * @param {string} fallback - Ruta de la imagen de reemplazo si `src` falla.
 * @returns {HTMLImageElement} Elemento de imagen configurado como avatar.
 */
export const createAvatarImg = (src, alt, fallback) => {
  const img = document.createElement('img');
  img.className = 'avatar';
  img.loading = 'lazy';
  img.decoding = 'async';
  img.alt = alt;
  img.src = src || fallback;
  img.onerror = () => {
    if (img.src !== fallback) img.src = fallback;
  };
  return img;
};

/**
 * Genera la estructura DOM para una burbuja de chat con avatar, nombre y contenido.
 *
 * - Si el `role` es "user", la burbuja contiene directamente el texto proporcionado.
 * - Si el `role` es otro (por ejemplo "celeb"), se inserta un indicador de "escribiendo" mediante {@link createTypingDots}.
 *
 * @param {Object} options - Configuración de la burbuja.
 * @param {'user'|'celeb'} options.role - Rol de quien envía el mensaje.
 * @param {string} options.name - Nombre a mostrar en la burbuja.
 * @param {string} options.avatarUrl - URL del avatar a mostrar.
 * @param {string} [options.text] - Texto del mensaje (solo se usa si role es "user").
 * @param {string} options.fallbackAvatar - Imagen de respaldo si el avatar falla.
 * @returns {{bubble: HTMLDivElement, body: HTMLDivElement}} Objeto con el contenedor de la burbuja y el nodo donde escribir el texto.
 */
export const createBubble = ({ role, name, avatarUrl, text, fallbackAvatar }) => {
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${role} mb-3 shadow-sm d-flex align-items-start`;

  const img = createAvatarImg(avatarUrl, name, fallbackAvatar);

  const content = document.createElement('div');
  content.className = 'content';

  const strong = document.createElement('strong');
  strong.textContent = `${name}:`;

  const body = document.createElement('div');
  body.className = role === 'user' ? 'text' : 'response';

  if (role === 'user') {
    body.textContent = text ?? '';
  } else {
    body.appendChild(createTypingDots());
  }

  content.appendChild(strong);
  content.appendChild(body);
  bubble.appendChild(img);
  bubble.appendChild(content);

  return { bubble, body };
};
