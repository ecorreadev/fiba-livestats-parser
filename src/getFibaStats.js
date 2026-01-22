const puppeteer = require('puppeteer');

const GAME_ID = '2741519';
const PAGE_URL = `https://fibalivestats.dcd.shared.geniussports.com/u/FUBB/${GAME_ID}/`;

module.exports = async function getFibaStats(GAME_ID) {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    );

    let gameData = null;

    page.on('response', async response => {
        const url = response.url();

        if (url.endsWith(`/data/${GAME_ID}/data.json`)) {
            try {
                gameData = await response.json();
            } catch (e) { }
        }
    });

    await page.goto(PAGE_URL, { waitUntil: 'networkidle2' });

    // esperamos explícitamente
    await page.waitForFunction(() => true, { timeout: 3000 });

    await browser.close();

    if (!gameData) {
        throw new Error('No se pudo capturar data.json');
    }

    // --------------------------------
    // MAPPING A TU ESTRUCTURA
    // --------------------------------

    const teams = Object.values(gameData.tm);

    const aguada = teams.find(t =>
        t.code === 'AGU' ||
        t.name?.toLowerCase().includes('aguada')
    );

    const adversario = teams.find(t => t !== aguada);

    if (!aguada || !adversario) {
        throw new Error('No se pudo identificar Aguada o rival');
    }

    const mapPlayer = (p) => ({
        titular: Boolean(p.starter),

        numero: Number(p.shirtNumber) || null,
        jugador: [p.firstName, p.familyName].filter(Boolean).join(' '),

        minutos: p.sMinutes,

        puntos: p.sPoints,

        camposHechos: p.sFieldGoalsMade,
        camposIntent: p.sFieldGoalsAttempted,
        camposPercent: p.sFieldGoalsPercentage,

        doblesHechos: p.sTwoPointersMade,
        doblesIntent: p.sTwoPointersAttempted,
        doblesPercent: p.sTwoPointersPercentage,

        triplesHechos: p.sThreePointersMade,
        triplesIntent: p.sThreePointersAttempted,
        triplesPercent: p.sThreePointersPercentage,

        libresHechos: p.sFreeThrowsMade,
        libresIntent: p.sFreeThrowsAttempted,
        libresPercent: p.sFreeThrowsPercentage,

        rebotesOff: p.sReboundsOffensive,
        rebotesDef: p.sReboundsDefensive,
        rebotesTot: p.sReboundsTotal,

        asistencias: p.sAssists,
        perdidas: p.sTurnovers,
        robos: p.sSteals,
        tapas: p.sBlocks,
        tapasRec: p.sBlocksReceived,

        fouls: p.sFoulsPersonal,
        foulsRec: p.sFoulsOn,

        masMenos: p.sPlusMinusPoints,
        valor: p.eff_1
    });

    const playedFilter = (p) =>
        p.minutos &&
        p.minutos !== '00:00' &&
        p.minutos !== '0:00';

    const sortPlayers = (a, b) => {
        // titulares primero
        if (a.titular !== b.titular) {
            return b.titular - a.titular;
        }

        const numA = Number.isFinite(a.numero) ? a.numero : Infinity;
        const numB = Number.isFinite(b.numero) ? b.numero : Infinity;

        return numA - numB;
    };

    const aguadaStats = Object.values(aguada.pl)
        .map(mapPlayer)
        .filter(playedFilter)
        .sort(sortPlayers)
        .map(({ titular, ...rest }) => rest);

    const adversarioStats = Object.values(adversario.pl)
        .map(mapPlayer)
        .filter(playedFilter)
        .sort(sortPlayers)
        .map(({ titular, ...rest }) => rest);

    const mapTeamTotals = (t) => ({
        totalPuntos: t.tot_sPoints,

        totalCamposHechos: t.tot_sFieldGoalsMade,
        totalCamposIntent: t.tot_sFieldGoalsAttempted,
        totalCamposPercent: t.tot_sFieldGoalsPercentage,

        totalDoblesHechos: t.tot_sTwoPointersMade,
        totalDoblesIntentados: t.tot_sTwoPointersAttempted,
        totalDoblesPercent: t.tot_sTwoPointersPercentage,

        totalTriplesHechos: t.tot_sThreePointersMade,
        totalTriplesIntentados: t.tot_sThreePointersAttempted,
        totalTriplesPercent: t.tot_sThreePointersPercentage,

        totalLibresHechos: t.tot_sFreeThrowsMade,
        totalLibresIntentados: t.tot_sFreeThrowsAttempted,
        totalLibresPercent: t.tot_sFreeThrowsPercentage,

        totalRebotesOff: t.tot_sReboundsOffensive,
        totalRebotesDef: t.tot_sReboundsDefensive,
        totalRebotesTot: t.tot_sReboundsTotal,

        totalAsistencias: t.tot_sAssists,
        totalPerdidas: t.tot_sTurnovers,
        totalRobos: t.tot_sSteals,
        totalTapas: t.tot_sBlocks,
        totalTapasRec: t.tot_sBlocksReceived,

        totalFouls: t.tot_sFoulsTotal ?? t.tot_sFoulsPersonal,
        totalFoulsRec: t.tot_sFoulsOn,

        puntosDePerdida: t.tot_sPointsFromTurnovers,
        puntosEnPintura: t.tot_sPointsInThePaint,
        puntosSegundaOport: t.tot_sPointsSecondChance,
        puntosContraataque: t.tot_sPointsFastBreak,
        puntosBanca: t.tot_sBenchPoints,

        mayorVentaja: t.tot_sBiggestLead,
        mayorRacha: t.tot_sBiggestScoringRun
    });

    const getCoachName = (team) => team.coach || null;

    const result = {
        aguadaStats,
        totalAguadaStats: mapTeamTotals(aguada),
        dtAguada: getCoachName(aguada),
        adversarioStats,
        totalAdversarioStats: mapTeamTotals(adversario),
        dtAdversario: getCoachName(adversario)
    };

    console.log(JSON.stringify(result, null, 2));

};
