function loadHallOfFameData() {
    try {
        // Load championship history
        const savedHistory = localStorage.getItem('fastway_championship_history');
        const history = savedHistory ? JSON.parse(savedHistory) : [];

        // Load current driver data to calculate records
        const allData = JSON.parse(localStorage.getItem('fastwayAllData') || '[]');
        const raceState = JSON.parse(localStorage.getItem('fastway_race_state_v2') || '{}');

        // Calculate records from current data
        const records = calculateRecords(allData, raceState);

        return { history, records };
    } catch (e) {
        console.warn('Error loading Hall of Fame data:', e);
        return { history: [], records: {} };
    }
}

function calculateRecords(allData, raceState) {
    const records = {
        mostWins: { value: 0, holder: 'N/A' },
        mostChampionships: { value: 0, holder: 'N/A' },
        bestTime: { value: Infinity, holder: 'N/A', time: '--' },
        highestPoints: { value: 0, holder: 'N/A' },
        mostTotalPoints: { value: 0, holder: 'N/A' }
    };

    allData.forEach(driver => {
        const wins = parseInt(driver.wins) || 0;
        const chWins = parseInt(driver.chWins) || 0;
        const points = parseInt(driver.points) || 0;
        const total = (wins * 10) + points;

        // Most wins
        if (wins > records.mostWins.value) {
            records.mostWins = { value: wins, holder: driver.name };
        }

        // Most championships
        if (chWins > records.mostChampionships.value) {
            records.mostChampionships = { value: chWins, holder: driver.name };
        }

        // Best time - always update if better (never remove)
        if (driver.bestTime && driver.bestTime !== '--' && driver.bestTime !== 'DNF') {
            const timeValue = parseFloat(driver.bestTime.replace(',', '.'));
            if (!isNaN(timeValue) && (timeValue < records.bestTime.value || records.bestTime.value === Infinity)) {
                records.bestTime = { value: timeValue, holder: driver.name, time: driver.bestTime };
            }
        }

        // Highest points in single season
        if (points > records.highestPoints.value) {
            records.highestPoints = { value: points, holder: driver.name };
        }

        // Most total points (wins*10 + points)
        if (total > records.mostTotalPoints.value) {
            records.mostTotalPoints = { value: total, holder: driver.name };
        }
    });

    // Check race state for additional stats
    if (raceState.A && raceState.A.carStats) {
        Object.entries(raceState.A.carStats).forEach(([name, stats]) => {
            const wins = stats.wins || 0;
            if (wins > records.mostWins.value) {
                records.mostWins = { value: wins, holder: name };
            }
        });
    }

    if (raceState.B && raceState.B.carStats) {
        Object.entries(raceState.B.carStats).forEach(([name, stats]) => {
            const wins = stats.wins || 0;
            if (wins > records.mostWins.value) {
                records.mostWins = { value: wins, holder: name };
            }
        });
    }

    return records;
}

function renderHallOfFame() {
    const { history, records } = loadHallOfFameData();
    const content = document.getElementById('hallOfFameContent');

    let html = '';

    // Championship History Section
    html += '<div class="championship-section">';
    html += '<h2 class="section-title">Championship History</h2>';

    if (history.length === 0) {
        html += `
            <div class="empty-state">
                <h2>No Championships Yet</h2>
                <p>Complete seasons to see championship winners here.</p>
                <p>Champions will be automatically added after each completed season.</p>
            </div>
        `;
    } else {
        html += '<div class="champions-grid">';
        history.forEach((champion, index) => {
            html += `
                <div class="champion-card">
                    <div class="trophy-icon">🏆</div>
                    <div class="champion-name">${champion.name || 'Unknown'}</div>
                    <div class="champion-year">Season ${champion.year || 'N/A'}</div>
                    <div class="champion-stats">
                        <div class="stat">
                            <div class="stat-value">${champion.wins || 0}</div>
                            <div class="stat-label">Wins</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value">${champion.points || 0}</div>
                            <div class="stat-label">Points</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value">${champion.serie || 'N/A'}</div>
                            <div class="stat-label">Serie</div>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
    }
    html += '</div>';

    // Manual Add Button - Small Gear Icon
    html += '<div style="text-align: right; margin: 20px 0;">';
    html += '<button id="addChampionBtn" class="gear-icon-btn" style="width: 40px; height: 40px; background: #F5F5F5; border: 2px solid #000000; border-radius: 8px; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; font-size: 20px; color: #000000; padding: 0;">';
    html += '⚙️';
    html += '</button>';
    html += '</div>';

    // Records Section
    html += '<div class="records-section">';
    html += '<h2 class="section-title">All-Time Records</h2>';
    html += '<div class="records-list">';

    html += `
        <div class="record-card">
            <div class="record-title">Most Wins</div>
            <div class="record-value">${records.mostWins.value}</div>
            <div class="record-holder">${records.mostWins.holder}</div>
        </div>
    `;

    html += `
        <div class="record-card">
            <div class="record-title">Most Championships</div>
            <div class="record-value">${records.mostChampionships.value}</div>
            <div class="record-holder">${records.mostChampionships.holder}</div>
        </div>
    `;

    html += `
        <div class="record-card">
            <div class="record-title">Best Time</div>
            <div class="record-value">${records.bestTime.time}</div>
            <div class="record-holder">${records.bestTime.holder}</div>
        </div>
    `;

    html += `
        <div class="record-card">
            <div class="record-title">Highest Points</div>
            <div class="record-value">${records.highestPoints.value}</div>
            <div class="record-holder">${records.highestPoints.holder}</div>
        </div>
    `;

    html += `
        <div class="record-card">
            <div class="record-title">Most Total Points</div>
            <div class="record-value">${records.mostTotalPoints.value}</div>
            <div class="record-holder">${records.mostTotalPoints.holder}</div>
        </div>
    `;

    html += '</div>';
    html += '</div>';

    // Legend
    html += `
        <div class="legend-section">
            <h3>About the Hall of Fame</h3>
            <p>
                The Hall of Fame celebrates the greatest achievements in FASTWAY racing history.
                Champions are automatically inducted after winning a championship, and records
                are updated in real-time as drivers compete throughout the season.
            </p>
        </div>
    `;

    content.innerHTML = html;
}

// Function to add a champion (called from other pages when a season ends)
window.addChampionToHallOfFame = function(name, year, wins, points, serie) {
    try {
        const savedHistory = localStorage.getItem('fastway_championship_history');
        const history = savedHistory ? JSON.parse(savedHistory) : [];
        
        history.push({
            name,
            year,
            wins,
            points,
            serie,
            date: new Date().toISOString()
        });

        // Sort by year (newest first)
        history.sort((a, b) => (b.year || 0) - (a.year || 0));

        localStorage.setItem('fastway_championship_history', JSON.stringify(history));
        renderHallOfFame(); // Refresh display
    } catch (e) {
        console.error('Error adding champion:', e);
    }
};

// Manual Add Champion Functionality
function showAddChampionModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 9999;';
    
    const content = document.createElement('div');
    content.style.cssText = 'background: #000000; padding: 30px; border-radius: 16px; max-width: 500px; width: 90%; border: 2px solid #00e7ff;';
    
    content.innerHTML = `
        <h2 style="color: #00e7ff; margin-bottom: 20px;">Add Champion to Hall of Fame</h2>
        <input type="text" id="champName" placeholder="Champion Name" style="width: 100%; padding: 12px; margin-bottom: 15px; background: rgba(255,255,255,0.1); border: 2px solid #00e7ff; border-radius: 8px; color: #fff; font-size: 16px;">
        <input type="number" id="champYear" placeholder="Year/Season" style="width: 100%; padding: 12px; margin-bottom: 15px; background: rgba(255,255,255,0.1); border: 2px solid #00e7ff; border-radius: 8px; color: #fff; font-size: 16px;">
        <input type="number" id="champWins" placeholder="Wins" style="width: 100%; padding: 12px; margin-bottom: 15px; background: rgba(255,255,255,0.1); border: 2px solid #00e7ff; border-radius: 8px; color: #fff; font-size: 16px;">
        <input type="number" id="champPoints" placeholder="Points" style="width: 100%; padding: 12px; margin-bottom: 15px; background: rgba(255,255,255,0.1); border: 2px solid #00e7ff; border-radius: 8px; color: #fff; font-size: 16px;">
        <select id="champSerie" style="width: 100%; padding: 12px; margin-bottom: 20px; background: rgba(255,255,255,0.1); border: 2px solid #00e7ff; border-radius: 8px; color: #fff; font-size: 16px;">
            <option value="A">Série A</option>
            <option value="B">Série B</option>
        </select>
        <div style="display: flex; gap: 10px;">
            <button id="saveChampBtn" style="flex: 1; padding: 12px; background: #00e7ff; color: #000; border: none; border-radius: 8px; font-weight: 700; cursor: pointer;">Save</button>
            <button id="cancelChampBtn" style="flex: 1; padding: 12px; background: #666; color: #fff; border: none; border-radius: 8px; font-weight: 700; cursor: pointer;">Cancel</button>
        </div>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    document.getElementById('saveChampBtn').addEventListener('click', () => {
        const name = document.getElementById('champName').value.trim();
        const year = parseInt(document.getElementById('champYear').value) || new Date().getFullYear();
        const wins = parseInt(document.getElementById('champWins').value) || 0;
        const points = parseInt(document.getElementById('champPoints').value) || 0;
        const serie = document.getElementById('champSerie').value;
        
        if (name) {
            if (typeof window.addChampionToHallOfFame === 'function') {
                window.addChampionToHallOfFame(name, year, wins, points, serie);
            }
            modal.remove();
            renderHallOfFame();
        }
    });
    
    document.getElementById('cancelChampBtn').addEventListener('click', () => {
        modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// Initialize dummy data if needed
function initializeDummyHallOfFameData() {
    const savedHistory = localStorage.getItem('fastway_championship_history');
    if (savedHistory && JSON.parse(savedHistory).length > 0) return; // Data already exists
    
    const currentYear = new Date().getFullYear();
    const dummyHistory = [
        { name: 'Time Track', year: currentYear - 1, wins: 15, points: 185, serie: 'A', date: new Date(currentYear - 1, 11, 31).toISOString() },
        { name: 'Delorean', year: currentYear - 2, wins: 12, points: 172, serie: 'A', date: new Date(currentYear - 2, 11, 31).toISOString() },
        { name: 'Hight Voltage', year: currentYear - 1, wins: 13, points: 168, serie: 'B', date: new Date(currentYear - 1, 11, 31).toISOString() },
        { name: 'DRIFTSTA', year: currentYear - 2, wins: 11, points: 155, serie: 'B', date: new Date(currentYear - 2, 11, 31).toISOString() }
    ];
    
    localStorage.setItem('fastway_championship_history', JSON.stringify(dummyHistory));
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    initializeDummyHallOfFameData();
    renderHallOfFame();
    
    // Add button handler using event delegation to handle re-renders
    document.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'addChampionBtn') {
            e.preventDefault();
            e.stopPropagation();
            showAddChampionModal();
        }
    });
    
    // Refresh every 10 seconds to show updates
    setInterval(() => {
        renderHallOfFame();
        // Re-attach button handler after re-render
        const addBtn = document.getElementById('addChampionBtn');
        if (addBtn && !addBtn.hasAttribute('data-handler-attached')) {
            addBtn.setAttribute('data-handler-attached', 'true');
        }
    }, 10000);
});
