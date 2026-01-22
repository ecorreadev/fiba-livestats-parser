const express = require('express');
const path = require('path');
const getFibaStats = require('./src/getFibaStats');

const app = express();

app.use(express.json());
app.use(express.static('public'));

app.post('/api/parse', async (req, res) => {
    const { url } = req.body;

    if (!url || !url.includes('fibalivestats')) {
        return res.status(400).json({ error: 'URL inválida' });
    }

    try {
        const gameId = url.split('/').filter(Boolean).pop();
        const data = await getFibaStats(gameId);
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
    console.log(`Servidor corriendo en puerto ${PORT}`)
);
