function getDriverFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('driver');
}

function loadDriverData(driverName) {
    try {
        const allData = JSON.parse(localStorage.getItem('fastwayAllData') || '[]');
        const raceState = JSON.parse(localStorage.getItem('fastway_race_state_v2') || '{}');
        const playoffData = JSON.parse(localStorage.getItem('fastway_playoff_data') || '{"A":{"qualified":[]},"B":{"qualified":[]}}');
        
        const driver = allData.find(d => d.name === driverName);
        if (!driver) return null;

        const statsA = raceState.A?.carStats?.[driverName] || {};
        const statsB = raceState.B?.carStats?.[driverName] || {};
        const combinedWins = (statsA.wins || 0) + (statsB.wins || 0);
        const combinedLosses = (statsA.losses || 0) + (statsB.losses || 0);
        
        const totalRaces = combinedWins + combinedLosses;
        const winPercentage = totalRaces > 0 ? ((combinedWins / totalRaces) * 100).toFixed(1) : 0;

        const isPlayoffQualified = 
            playoffData.A.qualified.includes(driverName) || 
            playoffData.B.qualified.includes(driverName);

        return {
            name: driver.name,
            number: driver.number || '',
            points: parseInt(driver.points) || 0,
            wins: parseInt(driver.wins) || 0,
            chWins: parseInt(driver.chWins) || 0,
            bestTime: driver.bestTime || '--',
            total: (parseInt(driver.wins) || 0) * 10 + (parseInt(driver.points) || 0),
            winPercentage: winPercentage,
            totalRaces: totalRaces,
            playoffQualified: isPlayoffQualified
        };
    } catch (e) {
        console.warn('Error loading driver data:', e);
        return null;
    }
}

function renderDriverDetail(driver) {
    if (!driver) {
        document.getElementById('driverContent').innerHTML = '<p>Driver not found.</p>';
        return;
    }

    document.getElementById('driverName').textContent = driver.name;
    
    const html = `
        <div class="driver-stats-grid">
            <div class="stat-card">
                <div class="stat-label">Total Points</div>
                <div class="stat-value highlight">${driver.total}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Wins</div>
                <div class="stat-value">${driver.wins}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Championship Wins</div>
                <div class="stat-value gold">${driver.chWins}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Win Percentage</div>
                <div class="stat-value">${driver.winPercentage}%</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Best Time</div>
                <div class="stat-value">${driver.bestTime}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Total Races</div>
                <div class="stat-value">${driver.totalRaces}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Points</div>
                <div class="stat-value">${driver.points}</div>
            </div>
            ${driver.number ? `
            <div class="stat-card">
                <div class="stat-label">Number</div>
                <div class="stat-value">#${driver.number}</div>
            </div>
            ` : ''}
        </div>
    `;

    document.getElementById('driverContent').innerHTML = html;
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    const driverName = getDriverFromURL();
    if (driverName) {
        const driver = loadDriverData(driverName);
        renderDriverDetail(driver);
    } else {
        document.getElementById('driverContent').innerHTML = '<p>No driver specified.</p>';
    }
});
