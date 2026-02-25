const express = require('express');
const path = require('path');
const getFibaStats = require('./src/getFibaStats');

const app = express();

app.use(express.json());
app.use(express.static('public'));

const formatHorario = (value) => {
    if (typeof value !== 'string') {
        return '';
    }

    const match = value.trim().match(/^(\d{1,2}):(\d{2})/);
    if (!match) {
        return '';
    }

    const hours = String(Math.max(0, Math.min(23, Number(match[1])))).padStart(2, '0');
    const minutes = String(Math.max(0, Math.min(59, Number(match[2])))).padStart(2, '0');

    return `${hours}:${minutes}`;
};

app.post('/api/parse', async (req, res) => {
    const { url, userData } = req.body;

    if (!url || !url.includes('fibalivestats')) {
        return res.status(400).json({ error: 'URL inválida' });
    }

    try {
        const gameId = url.split('/').filter(Boolean).pop();
        const data = await getFibaStats(gameId);

        if (userData) {
            const normalizedUserData = {
                ...userData,
                horario: formatHorario(userData.horario)
            };

            const result = {
                ...normalizedUserData,
                ...data
            };
            return res.json(result);
        }

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
