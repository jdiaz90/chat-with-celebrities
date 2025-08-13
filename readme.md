# Chat with Celebrities

¡Habla con personajes históricos famosos usando modelos de IA locales!

## Descripción
Esta aplicación web permite chatear con celebridades como Einstein, Frida Kahlo, Leonardo da Vinci y Marie Curie. Utiliza modelos de lenguaje ejecutados localmente a través de Ollama.

## Características
- Selección de celebridad y avatar.
- Interfaz de chat en tiempo real.
- Respuestas generadas por modelos de IA locales (Ollama).
- Cancelación de respuesta en curso.
- UI moderna y responsiva.

## Requisitos
- Node.js >= 18
- Ollama instalado y corriendo en tu máquina o red

## Instalación
1. Clona el repositorio:
   ```bash
   git clone https://github.com/jdiaz90/chat-with-celebrities.git
   cd chat-with-celebrities
   ```
2. Instala dependencias:
   ```bash
   npm install
   ```
3. Crea un archivo `.env` con la URL de tu servidor Ollama:
   ```env
   OLLAMA_API=http://localhost:11434
   DEFAULT_MODEL=gpt-oss:20b
   ```
4. Inicia la app:
   ```bash
   npm start
   ```
5. Abre en tu navegador: [http://localhost:3000](http://localhost:3000)

## Estructura del proyecto
- `app.js` — Entrada principal de la app Express
- `controllers/` — Lógica de rutas y controladores
- `public/` — Archivos estáticos (CSS, JS, imágenes)
- `services/` — Integración con Ollama
- `utils/` — Utilidades y helpers
- `views/` — Vistas EJS

## Personalización
- Puedes agregar más celebridades editando `utils/modelSelector.js` y agregando imágenes en `public/images/`.
- Cambia los modelos preferidos en el mismo archivo.

## Créditos
- Avatares: Imágenes generadas por IA.
- Basado en Node.js, Express y Ollama.

## Licencia
MIT
