/**
 * Parsers para procesar datos de jugadores y equipos
 */

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

const processPlayerStats = (players, mapPlayer) => {
    return Object.values(players)
        .map(mapPlayer)
        .filter(playedFilter)
        .sort(sortPlayers)
        .map(({ titular, ...rest }) => rest);
};

const identifyTeams = (teams, gameData) => {
    const aguada = teams.find(t =>
        t.code === 'AGU' ||
        t.name?.toLowerCase().includes('aguada')
    );

    const adversario = teams.find(t => t !== aguada);

    if (!aguada || !adversario) {
        throw new Error('No se pudo identificar Aguada o rival');
    }

    return { aguada, adversario };
};

const getCoachName = (team) => team.coach || null;

module.exports = {
    playedFilter,
    sortPlayers,
    processPlayerStats,
    identifyTeams,
    getCoachName
};
