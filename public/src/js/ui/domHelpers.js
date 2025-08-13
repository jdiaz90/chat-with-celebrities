/**
 * Selecciona el primer elemento que coincide con el selector CSS dado.
 *
 * @param {string} sel - Selector CSS que identifica el elemento a obtener.
 * @param {ParentNode} [root=document] - Nodo raíz en el que buscar; por defecto es `document`.
 * @returns {Element|null} El primer elemento que coincide o `null` si no se encuentra.
 *
 * @example
 * const form = $('#chat-form'); // Busca el formulario con id "chat-form"
 */
export const $ = (sel, root = document) => root.querySelector(sel);

/**
 * Desplaza un contenedor de forma que su scroll vertical quede al final,
 * mostrando siempre el último contenido añadido (por ejemplo, en un chat).
 *
 * @param {HTMLElement} el - Contenedor que se desea desplazar.
 *
 * @example
 * autoScroll(document.getElementById('chat-container'));
 */
export const autoScroll = (el) => (el.scrollTop = el.scrollHeight);
