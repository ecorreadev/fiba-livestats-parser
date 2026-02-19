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

const processPlayerStats = (players = {}, mapPlayer) => {
    return Object.values(players)
        .map(mapPlayer)
        .filter(playedFilter)
        .sort(sortPlayers)
        .map(({ titular, ...rest }) => rest);
};

const identifyTeams = (teams = []) => {
    const validTeams = Array.isArray(teams)
        ? teams.filter(Boolean)
        : [];

    const aguada = validTeams.find(t =>
        t.code === 'AGU' ||
        t.name?.toLowerCase().includes('aguada')
    );

    const adversario = validTeams.find(t => t !== aguada);

    if (aguada && adversario) {
        return { aguada, adversario };
    }

    if (validTeams.length >= 2) {
        return {
            aguada: validTeams[0],
            adversario: validTeams[1]
        };
    }

    if (validTeams.length === 1) {
        return {
            aguada: validTeams[0],
            adversario: {}
        };
    }

    return { aguada: {}, adversario: {} };
};

const getCoachName = (team) => team.coach || null;

module.exports = {
    playedFilter,
    sortPlayers,
    processPlayerStats,
    identifyTeams,
    getCoachName
};
