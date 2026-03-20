const express = require('express');
const path = require('path');
const getFibaStats = require('./src/getFibaStats');

const app = express();

app.use(express.json());
app.use(express.static('public'));

// Credenciales de ejemplo (en producción, esto estaría en env o base de datos)
const VALID_CREDENTIALS = {
  username: 'admin',
  password: 'password123'
};

// Middleware para validar token
const validateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  const token = authHeader.substring(7);
  
  // Validar que el token sea válido (en producción, usar JWT)
  if (token !== 'valid_auth_token') {
    return res.status(401).json({ error: 'Token inválido' });
  }

  next();
};

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

// Endpoint de autenticación
app.post('/auth/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    // Validar credenciales
    if (username === VALID_CREDENTIALS.username && password === VALID_CREDENTIALS.password) {
        // En producción, usar JWT o similar
        return res.json({ token: 'valid_auth_token' });
    }

    res.status(401).json({ error: 'Credenciales inválidas' });
});

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

app.post('/api/parse-minimal', async (req, res) => {
    const { url, userData } = req.body;

    if (!url || !url.includes('fibalivestats')) {
        return res.status(400).json({ error: 'URL inválida' });
    }

    try {
        const gameId = url.split('/').filter(Boolean).pop();
        const data = await getFibaStats(gameId);

        const result = {
            hora: userData?.hora || null,
            aguadaShots: data.aguadaShots || [],
            adversarioShots: data.adversarioShots || [],
            pbp: data.pbp || []
        };

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/patch/:matchId', validateToken, async (req, res) => {
    const { matchId } = req.params;
    const patchData = req.body;

    if (!matchId) {
        return res.status(400).json({ error: 'ID del partido requerido' });
    }

    try {
        // Aquí iría la lógica para actualizar el partido en tu base de datos
        // Por ahora, devolvemos un mensaje de éxito
        res.json({
            success: true,
            message: `Partido ${matchId} actualizado exitosamente`,
            data: patchData
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
    console.log(`Servidor corriendo en puerto ${PORT}`)
);
