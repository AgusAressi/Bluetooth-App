const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 4000;

app.use(cors());

app.get('/status', (req, res) => {
  res.json({ message: 'Servidor de Bluetooth en ejecución' });
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});