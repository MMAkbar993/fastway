
window.loadAwardsData = function() {
    try {
        const allData = JSON.parse(localStorage.getItem('fastwayAllData') || '[]');
        const raceState = JSON.parse(localStorage.getItem('fastway_race_state_v2') || '{}');
        const playoffData = JSON.parse(localStorage.getItem('fastway_playoff_data') || '{"A":{"qualified":[]},"B":{"qualified":[]}}');

        return { allData, raceState, playoffData };
    } catch (e) {
        console.warn('Error loading awards data:', e);
        return { allData: [], raceState: {}, playoffData: { A: { qualified: [] }, B: { qualified: [] } } };
    }
}

// Award definitions
const AWARD_DEFINITIONS = {
    // Performance Awards
    fastestLap: { 
        id: 'fastestLap', 
        title: 'Fastest Lap', 
        icon: '⚡', 
        description: 'Awarded to the driver with the best lap time recorded during qualifications or races.',
        category: 'performance'
    },
    mostWins: { 
        id: 'mostWins', 
        title: 'Most Wins', 
        icon: '👑', 
        description: 'Awarded to the driver with the highest number of race victories.',
        category: 'performance',
        gold: true
    },
    mostConsistent: { 
        id: 'mostConsistent', 
        title: 'Most Consistent', 
        icon: '📊', 
        description: 'Awarded to the driver with the best average performance across all races.',
        category: 'performance'
    },
    speedConsistency: { 
        id: 'speedConsistency', 
        title: 'Speed Consistency (Qualifying)', 
        icon: '🎯', 
        description: 'Awarded to the driver with the most consistent qualifying times.',
        category: 'performance'
    },
    overallBestRacer: { 
        id: 'overallBestRacer', 
        title: 'Overall Best Racer', 
        icon: '⭐', 
        description: 'Awarded to the driver with the best overall performance across all metrics.',
        category: 'performance',
        gold: true
    },
    chWinner: { 
        id: 'chWinner', 
        title: 'CH Winner', 
        icon: '🏁', 
        description: 'Awarded to the Championship Winner.',
        category: 'performance',
        gold: true
    },
    // Championship Awards
    serieAWinner: { 
        id: 'serieAWinner', 
        title: 'Serie A Winner', 
        icon: '🏆', 
        description: 'Awarded to the driver who finishes first in Serie A (decided after season + playoffs).',
        category: 'championship',
        gold: true
    },
    serieBWinner: { 
        id: 'serieBWinner', 
        title: 'Serie B Winner', 
        icon: '🏆', 
        description: 'Awarded to the driver who finishes first in Serie B (decided after season + playoffs).',
        category: 'championship',
        gold: true
    },
    overallWinner: { 
        id: 'overallWinner', 
        title: 'Overall Winner', 
        icon: '🌟', 
        description: 'Awarded to the driver with the highest total points across both series (decided after season + playoffs).',
        category: 'championship',
        gold: true
    },
    // Special Awards
    bestImprovement: { 
        id: 'bestImprovement', 
        title: 'Best Improvement', 
        icon: '📈', 
        description: 'Awarded to the driver who shows the greatest improvement comparing last season vs current season.',
        category: 'special'
    }
};

window.calculateAwards = function(allData, raceState, playoffData) {
    const awards = {
        // Performance Awards
        fastestLap: { winner: null, value: Infinity, time: '--' },
        mostWins: { winner: null, value: 0 },
        mostConsistent: { winner: null, value: 0 },
        speedConsistency: { winner: null, value: 0 },
        overallBestRacer: { winner: null, value: 0 },
        chWinner: { winner: null, value: 0 },

        // Championship Awards
        serieAWinner: { winner: null, points: 0 },
        serieBWinner: { winner: null, points: 0 },
        overallWinner: { winner: null, points: 0 },

        // Special Awards
        bestImprovement: { winner: null, value: 0 }
    };

    // Process all drivers
    allData.forEach(driver => {
        const name = driver.name;
        const wins = parseInt(driver.wins) || 0;
        const points = parseInt(driver.points) || 0;
        const total = (wins * 10) + points;
        const bestTime = driver.bestTime;

        // Most Wins
        if (wins > awards.mostWins.value) {
            awards.mostWins = { winner: name, value: wins };
        }

        // Fastest Lap
        if (bestTime && bestTime !== '--' && bestTime !== 'DNF') {
            const timeValue = parseFloat(bestTime.replace(',', '.'));
            if (!isNaN(timeValue) && timeValue < awards.fastestLap.value) {
                awards.fastestLap = { winner: name, value: timeValue, time: bestTime };
            }
        }

        // Overall Winner (highest total points)
        if (total > awards.overallWinner.points) {
            awards.overallWinner = { winner: name, points: total };
        }
    });

    // Determine Series Champions (top of each series)
    const serieADrivers = [];
    const serieBDrivers = [];

    allData.forEach((driver, index) => {
        const isSerieA = index < allData.length / 2;
        const total = (parseInt(driver.wins) || 0) * 10 + (parseInt(driver.points) || 0);

        if (isSerieA) {
            serieADrivers.push({ name: driver.name, total });
        } else {
            serieBDrivers.push({ name: driver.name, total });
        }
    });

    serieADrivers.sort((a, b) => b.total - a.total);
    serieBDrivers.sort((a, b) => b.total - a.total);

    if (serieADrivers.length > 0) {
        awards.serieAWinner = {
            winner: serieADrivers[0].name,
            points: serieADrivers[0].total
        };
    }

    if (serieBDrivers.length > 0) {
        awards.serieBWinner = {
            winner: serieBDrivers[0].name,
            points: serieBDrivers[0].total
        };
    }
    
    // Overall Winner (highest across both series)
    const allDrivers = [...serieADrivers, ...serieBDrivers];
    allDrivers.sort((a, b) => b.total - a.total);
    if (allDrivers.length > 0) {
        awards.overallWinner = {
            winner: allDrivers[0].name,
            points: allDrivers[0].total
        };
    }

    // Check race state for additional stats
    if (raceState.A && raceState.A.carStats) {
        Object.entries(raceState.A.carStats).forEach(([name, stats]) => {
            const wins = stats.wins || 0;
            if (wins > awards.mostWins.value) {
                awards.mostWins = { winner: name, value: wins };
            }
        });
    }

    if (raceState.B && raceState.B.carStats) {
        Object.entries(raceState.B.carStats).forEach(([name, stats]) => {
            const wins = stats.wins || 0;
            if (wins > awards.mostWins.value) {
                awards.mostWins = { winner: name, value: wins };
            }
        });
    }

    return awards;
}

function getAwardWinnersHistory(awardId) {
    try {
        const history = JSON.parse(localStorage.getItem(`fastway_award_history_${awardId}`) || '[]');
        return history;
    } catch (e) {
        return [];
    }
}

function renderAwardCard(awardDef, currentWinner, isClickable = true) {
    const history = getAwardWinnersHistory(awardDef.id);
    const hasHistory = history.length > 0;
    const clickClass = isClickable ? 'clickable-award' : '';
    const goldClass = awardDef.gold ? 'gold' : '';
    
    let winnerHtml = '<div class="no-winner">No winner yet</div>';
    if (currentWinner && currentWinner.winner) {
        if (currentWinner.time) {
            winnerHtml = `
                <div class="winner-name">${currentWinner.winner}</div>
                <div class="winner-stats">Time: ${currentWinner.time}</div>
            `;
        } else if (currentWinner.value !== undefined) {
            winnerHtml = `
                <div class="winner-name">${currentWinner.winner}</div>
                <div class="winner-stats">${currentWinner.value} ${awardDef.id === 'mostWins' ? 'Wins' : ''}</div>
            `;
        } else if (currentWinner.points !== undefined) {
            winnerHtml = `
                <div class="winner-name">${currentWinner.winner}</div>
                <div class="winner-stats">${currentWinner.points} Points</div>
            `;
        } else {
            winnerHtml = `
                <div class="winner-name">${currentWinner.winner}</div>
            `;
        }
    } else if (awardDef.category === 'championship') {
        winnerHtml = '<div class="no-winner">Decided after season + playoffs</div>';
    } else if (awardDef.id === 'mostConsistent' || awardDef.id === 'speedConsistency' || awardDef.id === 'overallBestRacer') {
        winnerHtml = '<div class="no-winner">Calculated at season end</div>';
    } else if (awardDef.id === 'bestImprovement') {
        winnerHtml = '<div class="no-winner">Compare last season vs current</div>';
    }
    
    return `
        <div class="award-card ${goldClass} ${clickClass}" data-award-id="${awardDef.id}" style="cursor: ${isClickable ? 'pointer' : 'default'};">
            <div class="award-icon">${awardDef.icon}</div>
            <div class="award-title">${awardDef.title}</div>
            <div class="award-description">${awardDef.description}</div>
            <div class="award-winner">
                ${winnerHtml}
                ${hasHistory ? '<div class="history-indicator" style="margin-top: 10px; font-size: 12px; color: #888;">View history →</div>' : ''}
            </div>
        </div>
    `;
}

function renderAwards() {
    const { allData, raceState, playoffData } = window.loadAwardsData();
    const awards = window.calculateAwards(allData, raceState, playoffData);
    const content = document.getElementById('awardsContent');
    
    if (!content) {
        console.error('awardsContent element not found');
        return;
    }

    if (allData.length === 0) {
        content.innerHTML = `
            <div class="empty-state">
                <h2>No Awards Available Yet</h2>
                <p>Complete races and seasons to unlock awards and achievements.</p>
            </div>
        `;
        return;
    }

    let html = '';

    // Performance Awards
    html += '<div class="award-category">';
    html += '<h2 class="category-title">Performance Awards</h2>';
    html += '<div class="awards-grid">';
    
    html += renderAwardCard(AWARD_DEFINITIONS.fastestLap, awards.fastestLap);
    html += renderAwardCard(AWARD_DEFINITIONS.mostWins, awards.mostWins);
    html += renderAwardCard(AWARD_DEFINITIONS.mostConsistent, awards.mostConsistent);
    html += renderAwardCard(AWARD_DEFINITIONS.speedConsistency, awards.speedConsistency);
    html += renderAwardCard(AWARD_DEFINITIONS.overallBestRacer, awards.overallBestRacer);
    html += renderAwardCard(AWARD_DEFINITIONS.chWinner, awards.chWinner);

    html += '</div>';
    html += '</div>';

    // Championship Awards
    html += '<div class="award-category">';
    html += '<h2 class="category-title">Championship Awards</h2>';
    html += '<div class="awards-grid">';

    html += renderAwardCard(AWARD_DEFINITIONS.serieAWinner, awards.serieAWinner);
    html += renderAwardCard(AWARD_DEFINITIONS.serieBWinner, awards.serieBWinner);
    html += renderAwardCard(AWARD_DEFINITIONS.overallWinner, awards.overallWinner);

    html += '</div>';
    html += '</div>';

    // Special Awards
    html += '<div class="award-category">';
    html += '<h2 class="category-title">Special Awards</h2>';
    html += '<div class="awards-grid">';

    html += renderAwardCard(AWARD_DEFINITIONS.bestImprovement, awards.bestImprovement);

    html += '</div>';
    html += '</div>';

    content.innerHTML = html;
    
    // Add click handlers
    document.querySelectorAll('.clickable-award').forEach(card => {
        card.addEventListener('click', () => {
            const awardId = card.getAttribute('data-award-id');
            window.location.href = `awarddetail.html?award=${encodeURIComponent(awardId)}`;
        });
    });
}

// Function to save award winner to history (called when season ends)
window.saveAwardWinner = function(awardId, winner, season, value, time, points) {
    try {
        const history = JSON.parse(localStorage.getItem(`fastway_award_history_${awardId}`) || '[]');
        history.push({
            winner,
            season: season || new Date().getFullYear(),
            value,
            time,
            points,
            date: new Date().toISOString()
        });
        // Sort by season (newest first)
        history.sort((a, b) => (b.season || 0) - (a.season || 0));
        localStorage.setItem(`fastway_award_history_${awardId}`, JSON.stringify(history));
    } catch (e) {
        console.error('Error saving award winner:', e);
    }
};

// Initialize dummy data if needed
function initializeDummyAwardData() {
    // First, ensure driver data exists (needed for calculating current winners)
    const allData = JSON.parse(localStorage.getItem('fastwayAllData') || '[]');
    if (allData.length === 0) {
        // Use the same comprehensive dummy data as driverlist.js
        const dummyDrivers = [
            { name: 'Time Track', number: '914', points: 85, wins: 15, chWins: 2, bestTime: '1:23.45' },
            { name: 'Delorean', number: '88', points: 72, wins: 12, chWins: 1, bestTime: '1:24.12' },
            { name: 'Stinger GT', number: '42', points: 68, wins: 10, chWins: 0, bestTime: '1:24.56' },
            { name: 'DRIFTSTA', number: '3', points: 55, wins: 11, chWins: 1, bestTime: '1:25.23' },
            { name: "Erik's Rod", number: '52', points: 48, wins: 8, chWins: 0, bestTime: '1:25.89' },
            { name: 'Hight Voltage', number: '2', points: 68, wins: 13, chWins: 1, bestTime: '1:24.34' },
            { name: 'Thunder Bolt', number: '7', points: 62, wins: 9, chWins: 0, bestTime: '1:25.12' },
            { name: 'Speed Demon', number: '99', points: 45, wins: 7, chWins: 0, bestTime: '1:26.45' }
        ];
        localStorage.setItem('fastwayAllData', JSON.stringify(dummyDrivers));
    }
    
    // Check if any award history exists
    let hasHistory = false;
    Object.keys(AWARD_DEFINITIONS).forEach(awardId => {
        const history = JSON.parse(localStorage.getItem(`fastway_award_history_${awardId}`) || '[]');
        if (history.length > 0) hasHistory = true;
    });
    
    if (hasHistory) return; // History already exists
    
    // Add dummy award history
    const currentYear = new Date().getFullYear();
    
    // Fastest Lap
    window.saveAwardWinner('fastestLap', 'Time Track', currentYear - 1, null, '1:23.45', null);
    window.saveAwardWinner('fastestLap', 'Stinger GT', currentYear - 2, null, '1:24.12', null);
    
    // Most Wins
    window.saveAwardWinner('mostWins', 'Delorean', currentYear - 1, 15, null, null);
    window.saveAwardWinner('mostWins', 'Time Track', currentYear - 2, 12, null, null);
    
    // Serie A Winner
    window.saveAwardWinner('serieAWinner', 'Time Track', currentYear - 1, null, null, 185);
    window.saveAwardWinner('serieAWinner', 'Delorean', currentYear - 2, null, null, 172);
    
    // Serie B Winner
    window.saveAwardWinner('serieBWinner', 'Hight Voltage', currentYear - 1, null, null, 168);
    window.saveAwardWinner('serieBWinner', 'DRIFTSTA', currentYear - 2, null, null, 155);
    
    // Overall Winner
    window.saveAwardWinner('overallWinner', 'Time Track', currentYear - 1, null, null, 185);
    window.saveAwardWinner('overallWinner', 'Delorean', currentYear - 2, null, null, 172);
    
    // CH Winner
    window.saveAwardWinner('chWinner', 'Time Track', currentYear - 1, null, null, null);
    window.saveAwardWinner('chWinner', 'Delorean', currentYear - 2, null, null, null);
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    initializeDummyAwardData();
    renderAwards();
    // Refresh every 10 seconds to show updates
    setInterval(renderAwards, 10000);
});
