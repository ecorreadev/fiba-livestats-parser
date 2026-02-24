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

const mapShot = (shot = {}) => ({
    r: Number(shot.r) === 1,
    x: shot.x ?? null,
    y: shot.y ?? null,
    per: shot.per ?? null,
    perType: shot.perType ?? null,
    actionType: shot.actionType ?? null,
    subType: shot.subType ?? null,
    player: shot.player ?? null
});

const mapShots = (shots) => {
    if (!Array.isArray(shots)) {
        return [];
    }

    return shots.map(mapShot);
};

const mapPbpEntry = (entry = {}, aguadaIsTeam1 = true) => {
    const s1 = entry?.s1 ?? null;
    const s2 = entry?.s2 ?? null;

    return {
        gt: entry?.gt ?? null,
        clock: entry?.clock ?? null,
        aguadaScore: aguadaIsTeam1 ? s1 : s2,
        adversarioScore: aguadaIsTeam1 ? s2 : s1,
        lead: entry?.lead ?? null,
        period: entry?.period ?? null,
        periodType: entry?.periodType ?? null,
        player: entry?.player ?? null,
        success: Number(entry?.success) === 1,
        actionType: entry?.actionType ?? null,
        qualifier: entry?.qualifier ?? null,
        subType: entry?.subType ?? null,
        scoring: Number(entry?.scoring) === 1,
        scoreboardName: entry?.scoreboardName ?? null
    };
};

const mapPbp = (pbp, aguadaIsTeam1) => {
    if (!Array.isArray(pbp)) {
        return [];
    }

    return pbp.map(entry => mapPbpEntry(entry, aguadaIsTeam1));
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
    const aguadaStats = processPlayerStats(aguada.pl, mapPlayer);
    const adversarioStats = processPlayerStats(adversario.pl, mapPlayer);
    const totalAguadaStats = mapTeamTotals(aguada);
    const totalAdversarioStats = mapTeamTotals(adversario);
    const puntosAguada = Number(totalAguadaStats.totalPuntos) || 0;
    const puntosAdversario = Number(totalAdversarioStats.totalPuntos) || 0;
    const diferencia = puntosAguada - puntosAdversario;
    const ganado = puntosAguada > puntosAdversario;
    const local = teams[0] === aguada;
    const cuartos = generateCuartos(aguada, adversario);
    const team1 = gameData?.tm?.['1'];
    const team2 = gameData?.tm?.['2'];
    const team1IsAguada =
        team1?.code === 'AGU' ||
        team1?.name?.toLowerCase().includes('aguada') ||
        team1 === aguada;
    const team2IsAguada =
        team2?.code === 'AGU' ||
        team2?.name?.toLowerCase().includes('aguada') ||
        team2 === aguada;

    const aguadaIsTeam1 = team1IsAguada || !team2IsAguada;

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
        dtAdversario: getCoachName(adversario),
        aguadaShots: mapShots(aguada?.shot),
        adversarioShots: mapShots(adversario?.shot),
        pbp: mapPbp(gameData?.pbp, aguadaIsTeam1)
    };

    console.log(JSON.stringify(result, null, 2));

    return result;
};
