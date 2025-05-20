// backend/server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();

app.use(cors()); // Considera especificar dominios en producción: cors({ origin: ["https://tudominio.com"] })
app.use(express.json());

// ----------------------------------------------------
// Rutas para servir archivos estáticos del WIDGET (ahora desde 'dist')
// ----------------------------------------------------

// Sirve el HTML del widget cuando se accede a /widget
// Ahora, `widget.html` será el copiado por Webpack en `dist/`
app.get("/widget", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/widget.html"));
});

// Sirve el CSS del widget (copiado por Webpack a 'dist')
// La ruta en el HTML será /widget/widget.css
app.use("/widget/", express.static(path.join(__dirname, "../dist"))); // Sirve todo el contenido de 'dist' bajo /widget/

// NOTA: Si tienes otros assets específicos en 'dist' (como imágenes),
// esta línea `app.use("/widget/", express.static(path.join(__dirname, "../dist")));`
// debería cubrirlos también si las rutas en `widget.html` son relativas a `/widget/`.
// Por ejemplo, `<img src="/widget/mi-imagen.png">` si mi-imagen.png está en dist.

// ----------------------------------------------------
// Rutas de API para el widget (sin cambios)
// ----------------------------------------------------
app.get("/api/signed-url", async (req, res) => {
  const agent_id = process.env.AGENT_ID;
  const xi_api_key = process.env.XI_API_KEY;

  if (!agent_id || !xi_api_key) {
    console.error("AGENT_ID o XI_API_KEY no definidos en .env");
    return res.status(500).json({ error: "Server configuration error." });
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agent_id}`,
      {
        method: "GET",
        headers: {
          "xi-api-key": xi_api_key,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Eleven Labs API error: ${response.status} - ${errorText}`);
      throw new Error("Failed to get signed URL from Eleven Labs API");
    }

    const data = await response.json();
    res.json({ signedUrl: data.signed_url });
  } catch (error) {
    console.error("Error obtaining signed URL:", error);
    res.status(500).json({ error: "Failed to get signed URL" });
  }
});


// ----------------------------------------------------
// Opcional: Rutas para una página de prueba o landing page
// ----------------------------------------------------

// Sirve la página principal (index.html) desde 'dist'
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

// Manejador de rutas comodín para otras rutas de la aplicación principal
// Asegura que no intercepte /widget o /api
app.get("*", (req, res) => {
    if (!req.path.startsWith('/api/') && !req.path.startsWith('/widget')) {
        res.sendFile(path.join(__dirname, "../dist/index.html"));
    } else {
        res.status(404).send("Not Found");
    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}: http://localhost:${PORT}`);
});