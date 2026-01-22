/**
 * Captura de datos JSON desde la respuesta de red
 */

const setupDataCapture = (page, GAME_ID) => {
    let gameData = null;

    page.on('response', async response => {
        const url = response.url();

        if (url.endsWith(`/data/${GAME_ID}/data.json`)) {
            try {
                gameData = await response.json();
            } catch (e) {
                // Error silencioso al parsear JSON
            }
        }
    });

    return () => gameData;
};

module.exports = {
    setupDataCapture
};
