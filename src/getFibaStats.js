const { launchBrowser, setupUserAgent } = require('./browser');
const { setupDataCapture } = require('./dataCapture');
const { mapPlayer, mapTeamTotals, mapReferees, mapGameResult } = require('./mappers');
const {
    processPlayerStats,
    identifyTeams,
    getCoachName
} = require('./parsers');

module.exports = async function getFibaStats(GAME_ID) {
    const PAGE_URL = `https://fibalivestats.dcd.shared.geniussports.com/u/FUBB/${GAME_ID}/`;

    // Lanzar browser
    const browser = await launchBrowser();
    const page = await browser.newPage();

    // Configurar user agent
    await setupUserAgent(page);

    // Configurar captura de datos
    const getGameData = setupDataCapture(page, GAME_ID);

    // Navegar y esperar
    await page.goto(PAGE_URL, { waitUntil: 'networkidle2' });
    await page.waitForFunction(() => true, { timeout: 3000 });

    await browser.close();

    // Obtener datos capturados
    const gameData = getGameData();

    if (!gameData) {
        throw new Error('No se pudo capturar data.json');
    }

    // Procesar datos
    const teams = Object.values(gameData.tm);
    const { aguada, adversario } = identifyTeams(teams, gameData);

    // Procesar estadísticas de jugadores
    const aguadaStats = processPlayerStats(aguada.pl, mapPlayer);
    const adversarioStats = processPlayerStats(adversario.pl, mapPlayer);

    // Armar resultado
    const totalAguadaStats = mapTeamTotals(aguada);
    const totalAdversarioStats = mapTeamTotals(adversario);
    const diferencia = totalAguadaStats.totalPuntos - totalAdversarioStats.totalPuntos;
    const ganado = totalAguadaStats.totalPuntos > totalAdversarioStats.totalPuntos;
    const local = teams[0] === aguada;

    const result = {
        adversario: adversario.name,
        local,
        jueces: mapReferees(gameData.officials),
        resultado: mapGameResult(aguada, adversario),
        diferencia,
        ganado,
        aguadaStats,
        totalAguadaStats,
        dtAguada: getCoachName(aguada),
        adversarioStats,
        totalAdversarioStats,
        dtAdversario: getCoachName(adversario)
    };

    console.log(JSON.stringify(result, null, 2));

    return result;
};
