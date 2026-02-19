/**
 * Mappers para transformar datos crudos de FIBA a estructura limpia
 */

const capitalize = (str) => {
    if (!str) return '';
    return str
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

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

const mapReferees = (officials = {}) => {
    const referees = [];

    for (let i = 1; i <= 3; i++) {
        const referee = officials?.[`referee${i}`];
        if (referee) {
            const nombre = [referee.firstName, referee.familyName]
                .filter(Boolean)
                .join(' ');
            referees.push(nombre);
        }
    }

    return referees;
};

const mapGameResult = (team1 = {}, team2 = {}) => {
    const name1 = capitalize(team1.name) || 'Equipo 1';
    const score1 = Number(team1.tot_sPoints) || 0;
    const name2 = capitalize(team2.name) || 'Equipo 2';
    const score2 = Number(team2.tot_sPoints) || 0;

    return `${name1} ${score1} - ${name2} ${score2}`;
};

module.exports = {
    mapPlayer,
    mapTeamTotals,
    mapReferees,
    mapGameResult
};
