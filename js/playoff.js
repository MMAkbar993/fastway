
// Playoff configuration (matching index.html)
// Use global to avoid duplicate declaration when script.js is also loaded
if (typeof PLAYOFF_STRUCTURE === 'undefined') {
    window.PLAYOFF_STRUCTURE = [
        { name: "ROUND 1", races: 3, targetCount: 10 },
        { name: "ROUND 2", races: 3, targetCount: 6 },
        { name: "ROUND 3", races: 2, targetCount: 2 },
        { name: "DIVISION FINAL", races: 5, targetCount: 1 }
    ];
}

// Load playoff state
function loadPlayoffState() {
    try {
        const saved = localStorage.getItem('fastway_playoff_state');
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.warn('Error loading playoff state:', e);
    }
    return {
        active: false,
        currentRoundIndex: 0,
        currentRaceInRound: 0,
        isFinal: false
    };
}

function loadPlayoffData() {
    try {
        const saved = localStorage.getItem('fastway_playoff_data');
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.warn('Error loading playoff data:', e);
    }
    return {
        A: { qualified: [] },
        B: { qualified: [] }
    };
}

function loadDriverData() {
    try {
        const allData = JSON.parse(localStorage.getItem('fastwayAllData') || '[]');
        const raceState = JSON.parse(localStorage.getItem('fastway_race_state_v2') || '{}');
        
        const drivers = {};
        allData.forEach(driver => {
            drivers[driver.name] = {
                points: parseInt(driver.points) || 0,
                wins: parseInt(driver.wins) || 0,
                chWins: parseInt(driver.chWins) || 0,
                bestTime: driver.bestTime || '--',
                total: (parseInt(driver.wins) || 0) * 10 + (parseInt(driver.points) || 0)
            };
        });

        // Merge with race state stats
        if (raceState.A && raceState.A.carStats) {
            Object.entries(raceState.A.carStats).forEach(([name, stats]) => {
                if (!drivers[name]) drivers[name] = {};
                drivers[name].wins = stats.wins || drivers[name].wins || 0;
            });
        }
        if (raceState.B && raceState.B.carStats) {
            Object.entries(raceState.B.carStats).forEach(([name, stats]) => {
                if (!drivers[name]) drivers[name] = {};
                drivers[name].wins = stats.wins || drivers[name].wins || 0;
            });
        }

        return drivers;
    } catch (e) {
        console.warn('Error loading driver data:', e);
        return {};
    }
}

function loadStandingData() {
    try {
        const allData = JSON.parse(localStorage.getItem('fastwayAllData') || '[]');
        const raceState = JSON.parse(localStorage.getItem('fastway_race_state_v2') || '{}');
        
        const standings = [];
        allData.forEach(driver => {
            const statsA = raceState.A?.carStats?.[driver.name] || {};
            const statsB = raceState.B?.carStats?.[driver.name] || {};
            const combinedWins = (statsA.wins || 0) + (statsB.wins || 0);
            
            standings.push({
                name: driver.name,
                points: parseInt(driver.points) || 0,
                wins: parseInt(driver.wins) || 0,
                chWins: parseInt(driver.chWins) || 0,
                bestTime: driver.bestTime || '--',
                total: (parseInt(driver.wins) || 0) * 10 + (parseInt(driver.points) || 0)
            });
        });
        
        // Sort: Cars with chWins first (most to least), then by total points
        standings.sort((a, b) => {
            if (a.chWins > 0 && b.chWins === 0) return -1;
            if (a.chWins === 0 && b.chWins > 0) return 1;
            if (a.chWins > 0 && b.chWins > 0) return b.chWins - a.chWins;
            return b.total - a.total;
        });
        
        return standings;
    } catch (e) {
        console.warn('Error loading standing data:', e);
        return [];
    }
}

function renderPlayoffPage() {
    try {
        console.log('renderPlayoffPage called');
        const playoffState = loadPlayoffState();
        const playoffData = loadPlayoffData();
        const driverData = loadDriverData();
        const standings = loadStandingData();
        const contentA = document.getElementById('playoffContentA');
        const contentB = document.getElementById('playoffContentB');
        
        console.log('Data loaded:', { 
            playoffState, 
            playoffData, 
            driverDataCount: Object.keys(driverData).length,
            standingsCount: standings.length,
            contentA: !!contentA,
            contentB: !!contentB
        });
        
        // Render for both Serie A and Serie B
        if (contentA) {
            renderPlayoffContentForSerie('A', contentA, playoffState, playoffData, driverData, standings);
        } else {
            console.error('playoffContentA element not found!');
        }
        if (contentB) {
            renderPlayoffContentForSerie('B', contentB, playoffState, playoffData, driverData, standings);
        } else {
            console.error('playoffContentB element not found!');
        }
    } catch (error) {
        console.error('Error in renderPlayoffPage:', error);
    }
}

function renderPlayoffContentForSerie(serie, content, playoffState, playoffData, driverData, standings) {
    try {
        if (!content) {
            console.error(`Content element is null for serie ${serie}`);
            return;
        }

        // Filter standings by serie - use original position in allData, not sorted index
        const allData = JSON.parse(localStorage.getItem('fastwayAllData') || '[]');
        
        if (allData.length === 0) {
            content.innerHTML = `
                <div style="padding: 40px; text-align: center;">
                    <h2 style="color: #1a1a1a; margin-bottom: 20px;">No Driver Data Available</h2>
                    <p style="color: #666;">Please add driver data first.</p>
                </div>
            `;
            return;
        }
        
        // Create a map of original positions
        const originalPositions = {};
        allData.forEach((driver, index) => {
            originalPositions[driver.name] = index < allData.length / 2 ? 'A' : 'B';
        });
        
        // Filter standings based on original serie assignment
        const serieStandings = standings.filter((car) => {
            return originalPositions[car.name] === serie;
        });
    
    if (!playoffState.active) {
        // Check for tie between 14th and 15th position in this serie
        const hasTie = serieStandings.length > 14 && 
                       serieStandings[13] && serieStandings[14] &&
                       serieStandings[13].chWins === serieStandings[14].chWins && 
                       serieStandings[13].total === serieStandings[14].total;
        
        // Show standing table even when playoffs not started
        let html = '<div class="standings-preview">';
        html += `<h2 style="color: #1a1a1a; text-align: center; margin-bottom: 30px; font-size: 32px; font-weight: 900;">Serie ${serie} Standings</h2>`;
        html += '<div style="max-width: 1000px; margin: 0 auto;">';
        html += '<div style="background: #F5F5F5; border: 1px solid rgba(0, 0, 0, 0.08); border-radius: 12px; padding: 20px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);">';
        html += '<table style="width: 100%; border-collapse: collapse; font-size: 16px;">';
        html += '<thead><tr style="background: #F5F5F5; border-bottom: 2px solid rgba(0, 0, 0, 0.1);">';
        html += '<th style="padding: 15px 12px; text-align: left; font-weight: 800; color: #1a1a1a; width: 80px;">Pos</th>';
        html += '<th style="padding: 15px 12px; text-align: left; font-weight: 800; color: #1a1a1a;">Car</th>';
        html += '<th style="padding: 15px 12px; text-align: center; font-weight: 800; color: #1a1a1a; width: 120px;">CH Wins</th>';
        html += '<th style="padding: 15px 12px; text-align: center; font-weight: 800; color: #1a1a1a; width: 120px;">Total</th>';
        html += '</tr></thead><tbody>';
        
        serieStandings.forEach((car, index) => {
            const isQualified = index < 14;
            const hasChWin = car.chWins > 0;
            // Red line between 14th and 15th (border-top on index 14, which is position 15)
            const rowStyle = index === 14 ? 'border-top: 4px solid #ff003c;' : '';
            const bgColor = hasChWin ? 'rgba(255, 215, 0, 0.15)' : (isQualified ? '#F5F5F5' : '#F0F0F0');
            
            html += `<tr style="${rowStyle} background: ${bgColor}; transition: all 0.2s ease;">`;
            html += `<td style="padding: 12px; font-weight: 700; color: #1a1a1a;">${index + 1}</td>`;
            html += `<td style="padding: 12px; font-weight: 600; color: #1a1a1a;"><a href="driverdetail.html?driver=${encodeURIComponent(car.name)}" style="color: #1a1a1a; text-decoration: none;">${car.name}</a></td>`;
            html += `<td style="padding: 12px; text-align: center; color: #FFD700; font-weight: 700;">${car.chWins}</td>`;
            html += `<td style="padding: 12px; text-align: center; color: #1a1a1a; font-weight: 600;">${car.total}</td>`;
            html += `</tr>`;
            
            // Show tie message between 14th and 15th if there's a tie
            if (index === 13 && hasTie) {
                html += '<tr style="border-top: 4px solid #ff003c; background: rgba(255, 0, 60, 0.1);">';
                html += '<td colspan="4" style="padding: 15px; text-align: center;">';
                html += '<div style="color: #ff003c; font-weight: 800; font-size: 18px; margin-bottom: 8px;">TIED</div>';
                html += '<div style="color: #1a1a1a; font-size: 14px;">A race is required to decide who enters the playoffs</div>';
                html += '</td></tr>';
            }
        });
        
        html += '</tbody></table></div></div></div>';
        html += `
            <div class="no-playoff" style="margin-top: 40px;">
                <h2>Playoffs Not Started</h2>
                <p>The playoffs will begin automatically after the regular season is complete.</p>
                <p>Complete all regular season races to unlock the playoff bracket.</p>
            </div>
        `;
        content.innerHTML = html;
        return;
    }

    let html = '';

    // Check for tie between 14th and 15th position in this serie
    const hasTie = serieStandings.length > 14 && 
                   serieStandings[13] && serieStandings[14] &&
                   serieStandings[13].chWins === serieStandings[14].chWins && 
                   serieStandings[13].total === serieStandings[14].total;

    // Standing table preview
    html += '<div class="standings-preview" style="margin-bottom: 40px;">';
    html += `<h2 style="color: #1a1a1a; text-align: center; margin-bottom: 30px; font-size: 32px; font-weight: 900;">Serie ${serie} Standings</h2>`;
    html += '<div style="max-width: 1000px; margin: 0 auto;">';
    html += '<div style="background: #F5F5F5; border: 1px solid rgba(0, 0, 0, 0.08); border-radius: 12px; padding: 20px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);">';
    html += '<table style="width: 100%; border-collapse: collapse; font-size: 16px;">';
    html += '<thead><tr style="background: #F5F5F5; border-bottom: 2px solid rgba(0, 0, 0, 0.1);">';
    html += '<th style="padding: 15px 12px; text-align: left; font-weight: 800; color: #1a1a1a; width: 80px;">Pos</th>';
    html += '<th style="padding: 15px 12px; text-align: left; font-weight: 800; color: #1a1a1a;">Car</th>';
    html += '<th style="padding: 15px 12px; text-align: center; font-weight: 800; color: #1a1a1a; width: 120px;">CH Wins</th>';
    html += '<th style="padding: 15px 12px; text-align: center; font-weight: 800; color: #1a1a1a; width: 120px;">Total</th>';
    html += '</tr></thead><tbody>';
    
    serieStandings.forEach((car, index) => {
        const isQualified = index < 14;
        const hasChWin = car.chWins > 0;
        // Red line between 14th and 15th (border-top on index 14, which is position 15)
        const rowStyle = index === 14 ? 'border-top: 4px solid #ff003c;' : '';
        const bgColor = hasChWin ? 'rgba(255, 215, 0, 0.15)' : (isQualified ? '#F5F5F5' : '#F0F0F0');
        
        html += `<tr style="${rowStyle} background: ${bgColor}; transition: all 0.2s ease;">`;
        html += `<td style="padding: 12px; font-weight: 700; color: #1a1a1a;">${index + 1}</td>`;
        html += `<td style="padding: 12px; font-weight: 600; color: #1a1a1a;"><a href="driverdetail.html?driver=${encodeURIComponent(car.name)}" style="color: #1a1a1a; text-decoration: none;">${car.name}</a></td>`;
        html += `<td style="padding: 12px; text-align: center; color: #FFD700; font-weight: 700;">${car.chWins}</td>`;
        html += `<td style="padding: 12px; text-align: center; color: #1a1a1a; font-weight: 600;">${car.total}</td>`;
        html += `</tr>`;
        
        // Show tie message between 14th and 15th if there's a tie
        if (index === 13 && hasTie) {
            html += '<tr style="border-top: 4px solid #ff003c; background: rgba(255, 0, 60, 0.1);">';
            html += '<td colspan="4" style="padding: 15px; text-align: center;">';
            html += '<div style="color: #ff003c; font-weight: 800; font-size: 18px; margin-bottom: 8px;">TIED</div>';
            html += '<div style="color: #1a1a1a; font-size: 14px;">A race is required to decide who enters the playoffs</div>';
            html += '</td></tr>';
        }
    });
    
    html += '</tbody></table></div></div></div>';

    // Status section
    const currentRound = PLAYOFF_STRUCTURE[playoffState.currentRoundIndex];
    html += `
        <div class="playoff-status" style="background: #F5F5F5; border: 1px solid rgba(0, 0, 0, 0.08); border-radius: 12px; padding: 30px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06); margin: 40px 0;">
            <h2 style="color: #1a1a1a; font-size: 28px; font-weight: 900; margin-bottom: 20px; text-align: center;">Current Status</h2>
            <div style="text-align: center;">
                <p style="font-size: 18px; color: #1a1a1a; margin: 10px 0;"><span style="color: #1a1a1a; font-weight: 700;">Active Round:</span> ${currentRound ? currentRound.name : 'N/A'}</p>
                <p style="font-size: 18px; color: #1a1a1a; margin: 10px 0;">Race ${playoffState.currentRaceInRound + 1} / ${currentRound ? currentRound.races : 0}</p>
                ${playoffState.isFinal ? '<p style="color: #1a1a1a; font-weight: 700; font-size: 20px; margin-top: 15px;">🏁 FASTWAY FINAL - Best of 7 🏁</p>' : ''}
            </div>
        </div>
    `;

    // Final battle section
    if (playoffState.isFinal) {
        const winnerA = playoffData.A.qualified[0] || 'TBD';
        const winnerB = playoffData.B.qualified[0] || 'TBD';
        html += `
            <div class="final-battle">
                <h2>🏁 FASTWAY FINAL 🏁</h2>
                <div class="final-contenders">
                    <div class="contender">
                        <h3>Série A Champion</h3>
                        <div class="name">${winnerA}</div>
                    </div>
                    <div class="contender">
                        <h3>Série B Champion</h3>
                        <div class="name">${winnerB}</div>
                    </div>
                </div>
            </div>
        `;
    }

    // Bracket sections - show only for current serie
    html += '<div class="playoff-bracket" style="margin-top: 40px;">';

    html += `
        <div class="bracket-section" style="background: #F5F5F5; border: 1px solid rgba(0, 0, 0, 0.08); border-radius: 12px; padding: 30px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);">
            <h3 style="color: #1a1a1a; font-size: 28px; font-weight: 900; margin-bottom: 20px; text-align: center;">Série ${serie} Qualified Drivers</h3>
            <div class="bracket-series">
                <h4 style="color: #1a1a1a; font-size: 20px; font-weight: 700; margin-bottom: 20px; text-align: center;">${playoffData[serie].qualified.length} / 14 Qualified</h4>
                <div style="max-height: 600px; overflow-y: auto;">
                    ${renderQualifiedDrivers(playoffData[serie].qualified, driverData, serie)}
                </div>
            </div>
        </div>
    `;

    html += '</div>';

    // Round progress
    html += '<div class="playoff-rounds" style="margin-top: 40px;">';
    html += '<h2 style="color: #1a1a1a; font-size: 28px; font-weight: 900; margin-bottom: 30px; text-align: center;">Playoff Rounds</h2>';
    html += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">';
    PLAYOFF_STRUCTURE.forEach((round, index) => {
        const isActive = index === playoffState.currentRoundIndex;
        const isCompleted = index < playoffState.currentRoundIndex;
        const progress = isActive ? ((playoffState.currentRaceInRound / round.races) * 100) : (isCompleted ? 100 : 0);
        const cardBg = isActive ? '#F5F5F5' : (isCompleted ? '#F0F0F0' : '#F5F5F5');
        const borderColor = isActive ? '#1a1a1a' : (isCompleted ? '#1a1a1a' : 'rgba(0, 0, 0, 0.1)');
        
        html += `
            <div class="round-card" style="background: ${cardBg}; border: 2px solid ${borderColor}; border-radius: 12px; padding: 25px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);">
                <h3 style="color: #1a1a1a; font-size: 22px; font-weight: 900; margin-bottom: 15px; text-align: center;">${round.name}</h3>
                <p style="color: #1a1a1a; font-size: 16px; margin-bottom: 20px; text-align: center;">Races: ${round.races} | Target: ${round.targetCount} drivers per series</p>
                <div class="round-progress" style="margin-top: 20px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span style="color: #1a1a1a; font-weight: 700;">Progress</span>
                        <span style="color: #1a1a1a; font-weight: 700;">${Math.round(progress)}%</span>
                    </div>
                    <div class="progress-bar" style="width: 100%; height: 20px; background: rgba(0, 0, 0, 0.1); border-radius: 10px; overflow: hidden;">
                        <div class="progress-fill" style="width: ${progress}%; height: 100%; background: #1a1a1a; transition: width 0.3s ease;"></div>
                    </div>
                </div>
            </div>
        `;
    });
    html += '</div></div>';

    content.innerHTML = html;
    } catch (error) {
        console.error(`Error rendering playoff content for serie ${serie}:`, error);
        if (content) {
            content.innerHTML = `
                <div style="padding: 40px; text-align: center;">
                    <h2 style="color: #ff003c; margin-bottom: 20px;">Error Loading Playoff Data</h2>
                    <p style="color: #666;">${error.message}</p>
                </div>
            `;
        }
    }
}

function renderQualifiedDrivers(qualified, driverData, series) {
    if (qualified.length === 0) {
        return '<p style="color: #888; padding: 20px; text-align: center;">No drivers qualified yet</p>';
    }

    return qualified.map((name, index) => {
        const driver = driverData[name] || {};
        const total = driver.total || 0;
        const wins = driver.wins || 0;
        const chWins = driver.chWins || 0;
        
        return `
            <div class="qualified-driver" style="padding: 12px; margin: 8px 0; background: #F5F5F5; border: 1px solid rgba(0, 0, 0, 0.06); border-left: 4px solid #1a1a1a; border-radius: 8px;">
                <div style="font-size: 16px; margin-bottom: 6px;">
                    <strong style="color: #1a1a1a;">#${index + 1}</strong> <a href="driverdetail.html?driver=${encodeURIComponent(name)}" style="color: #1a1a1a; text-decoration: none; font-weight: 600;">${name}</a>
                </div>
                <div class="driver-stats" style="font-size: 14px; color: #1a1a1a; font-weight: 600;">
                    Total: ${total} | Wins: ${wins} | CH: ${chWins}
                </div>
            </div>
        `;
    }).join('');
}

// Initialize dummy playoff data if needed
function initializeDummyPlayoffData() {
    // First ensure driver data exists
    const allData = JSON.parse(localStorage.getItem('fastwayAllData') || '[]');
    if (allData.length === 0) {
        const dummyDrivers = [
            { name: 'Time Track', number: '914', points: 85, wins: 15, chWins: 2, bestTime: '1:23.45' },
            { name: 'Delorean', number: '88', points: 72, wins: 12, chWins: 1, bestTime: '1:24.12' },
            { name: 'Stinger GT', number: '42', points: 68, wins: 10, chWins: 0, bestTime: '1:24.56' },
            { name: 'DRIFTSTA', number: '3', points: 55, wins: 11, chWins: 1, bestTime: '1:25.23' },
            { name: "Erik's Rod", number: '52', points: 48, wins: 8, chWins: 0, bestTime: '1:25.89' },
            { name: 'Hight Voltage', number: '2', points: 68, wins: 13, chWins: 1, bestTime: '1:24.34' },
            { name: 'Thunder Bolt', number: '7', points: 62, wins: 9, chWins: 0, bestTime: '1:25.12' },
            { name: 'Speed Demon', number: '99', points: 45, wins: 7, chWins: 0, bestTime: '1:26.45' },
            { name: 'WHAT-4-2', number: '', points: 42, wins: 6, chWins: 0, bestTime: '1:26.78' },
            { name: 'COUNT MUSCULA', number: '', points: 40, wins: 5, chWins: 0, bestTime: '1:27.12' },
            { name: 'Glory Chaser', number: '32', points: 38, wins: 4, chWins: 0, bestTime: '1:27.45' },
            { name: '620', number: '', points: 35, wins: 3, chWins: 0, bestTime: '1:28.12' },
            { name: "'69 Mustang Boss 302", number: '', points: 32, wins: 2, chWins: 0, bestTime: '1:28.56' },
            { name: "'09 Focus RS", number: '4', points: 30, wins: 1, chWins: 0, bestTime: '1:29.23' }
        ];
        localStorage.setItem('fastwayAllData', JSON.stringify(dummyDrivers));
    }
    
    const playoffData = loadPlayoffData();
    if (playoffData.A.qualified.length > 0 || playoffData.B.qualified.length > 0) return; // Data already exists
    
    // Add some qualified drivers for display
    const dummyQualified = {
        A: { qualified: ['Time Track', 'Delorean', 'Stinger GT', 'DRIFTSTA', 'Erik\'s Rod', 'WHAT-4-2', 'COUNT MUSCULA', 'Glory Chaser', '620', "'69 Mustang Boss 302", "'09 Focus RS", '240Z', "'69 COPO Camaro", "'69 Camaro"] },
        B: { qualified: ['Hight Voltage', 'Thunder Bolt', 'Speed Demon', 'Motor Max Truck', "'72 Stingray con", 'Formula8r', 'COPO Camaro Drag', "'07 Mustang", "'73 BMW CSL", 'Pontiac FirebirdB', 'RIP ROD', "'62 Corvette", "'10 Chevy Impala", 'Fairlandy 2000'] }
    };
    
    localStorage.setItem('fastway_playoff_data', JSON.stringify(dummyQualified));
}

// Initialize page - handle both cases: DOM already loaded or not
function initPlayoffPage() {
    try {
        console.log('Initializing playoff page...');
        initializeDummyPlayoffData();
        
        // Check if elements exist
        const contentA = document.getElementById('playoffContentA');
        const contentB = document.getElementById('playoffContentB');
        
        if (!contentA || !contentB) {
            console.error('Playoff content elements not found!', { contentA, contentB });
            // Try again after a short delay
            setTimeout(() => {
                initPlayoffPage();
            }, 200);
            return;
        }
        
        // Render immediately
        console.log('Rendering playoff page...');
        renderPlayoffPage();
        
        // Refresh every 5 seconds to show updates
        if (!window.playoffRefreshInterval) {
            window.playoffRefreshInterval = setInterval(() => {
                renderPlayoffPage();
            }, 5000);
        }
    } catch (error) {
        console.error('Error initializing playoff page:', error);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded - initializing playoff page');
    setTimeout(() => {
        initPlayoffPage();
    }, 100);
});

// Also try on window load as a fallback
window.addEventListener('load', () => {
    console.log('Window load - checking playoff page');
    const contentA = document.getElementById('playoffContentA');
    if (contentA && (!contentA.innerHTML || contentA.innerHTML.trim() === '' || contentA.innerHTML.includes('<!--'))) {
        console.log('Content empty on window load, re-rendering...');
        setTimeout(() => {
            initPlayoffPage();
        }, 200);
    }
});

// Immediate initialization if DOM is already loaded
if (document.readyState !== 'loading') {
    setTimeout(() => {
        initPlayoffPage();
    }, 100);
}
