const { launchBrowser, setupUserAgent } = require('./browser');
const { setupDataCapture } = require('./dataCapture');
const { mapPlayer, mapTeamTotals, mapReferees, mapGameResult } = require('./mappers');
const {
    processPlayerStats,
    identifyTeams,
    getCoachName
} = require('./parsers');

const generateCuartos = (aguada, adversario) => {
    const aguadaScores = [
        parseInt(aguada.p1_score) || 0,
        parseInt(aguada.p2_score) || 0,
        parseInt(aguada.p3_score) || 0,
        parseInt(aguada.p4_score) || 0
    ];

    const adversarioScores = [
        parseInt(adversario.p1_score) || 0,
        parseInt(adversario.p2_score) || 0,
        parseInt(adversario.p3_score) || 0,
        parseInt(adversario.p4_score) || 0
    ];

    const cuartos = [];
    let aguadaAccumulated = 0;
    let adversarioAccumulated = 0;

    for (let i = 0; i < 4; i++) {
        const aguadaParcial = aguadaScores[i];
        const adversarioParcial = adversarioScores[i];

        aguadaAccumulated += aguadaParcial;
        adversarioAccumulated += adversarioParcial;

        cuartos.push({
            aguadaTotal: aguadaAccumulated,
            adversarioTotal: adversarioAccumulated,
            diferenciaTotal: aguadaAccumulated - adversarioAccumulated,
            aguadaParcial,
            adversarioParcial,
            diferenciaParcial: aguadaParcial - adversarioParcial
        });
    }

    return cuartos;
};

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
    const teams = Object.values(gameData.tm || {});
    const { aguada, adversario } = identifyTeams(teams);

    // Procesar estadísticas de jugadores
    const aguadaStats = processPlayerStats(aguada.pl, mapPlayer);
    const adversarioStats = processPlayerStats(adversario.pl, mapPlayer);

    // Armar resultado
    const totalAguadaStats = mapTeamTotals(aguada);
    const totalAdversarioStats = mapTeamTotals(adversario);
    const puntosAguada = Number(totalAguadaStats.totalPuntos) || 0;
    const puntosAdversario = Number(totalAdversarioStats.totalPuntos) || 0;
    const diferencia = puntosAguada - puntosAdversario;
    const ganado = puntosAguada > puntosAdversario;
    const local = teams[0] === aguada;
    const cuartos = generateCuartos(aguada, adversario);

    const result = {
        adversario: adversario.name || null,
        local,
        cuartos,
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
