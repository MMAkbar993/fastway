
function loadAllDrivers() {
    try {
        const allData = JSON.parse(localStorage.getItem('fastwayAllData') || '[]');
        const raceState = JSON.parse(localStorage.getItem('fastway_race_state_v2') || '{}');
        const playoffData = JSON.parse(localStorage.getItem('fastway_playoff_data') || '{"A":{"qualified":[]},"B":{"qualified":[]}}');
        
        const drivers = [];
        
        // Determine which series each driver belongs to
        const serieADrivers = new Set();
        const serieBDrivers = new Set();
        
        // Try to determine from DOM structure if available
        // For now, we'll use a simple heuristic or allow manual assignment
        // In a real scenario, this would be stored in localStorage
        
        allData.forEach((driver, index) => {
            // Simple heuristic: first half = Serie A, second half = Serie B
            // In production, this should come from saved state
            const isSerieA = index < allData.length / 2;
            if (isSerieA) {
                serieADrivers.add(driver.name);
            } else {
                serieBDrivers.add(driver.name);
            }

            const statsA = raceState.A?.carStats?.[driver.name] || {};
            const statsB = raceState.B?.carStats?.[driver.name] || {};
            const combinedWins = (statsA.wins || 0) + (statsB.wins || 0);
            const combinedLosses = (statsA.losses || 0) + (statsB.losses || 0);
            
            const totalRaces = combinedWins + combinedLosses;
            const winPercentage = totalRaces > 0 ? ((combinedWins / totalRaces) * 100).toFixed(1) : 0;

            const isPlayoffQualified = 
                playoffData.A.qualified.includes(driver.name) || 
                playoffData.B.qualified.includes(driver.name);

            drivers.push({
                name: driver.name,
                number: driver.number || '',
                points: parseInt(driver.points) || 0,
                wins: parseInt(driver.wins) || 0,
                chWins: parseInt(driver.chWins) || 0,
                bestTime: driver.bestTime || '--',
                total: (parseInt(driver.wins) || 0) * 10 + (parseInt(driver.points) || 0),
                winPercentage: winPercentage,
                totalRaces: totalRaces,
                serie: isSerieA ? 'A' : 'B',
                playoffQualified: isPlayoffQualified
            });
        });

        return drivers;
    } catch (e) {
        console.warn('Error loading drivers:', e);
        return [];
    }
}

function renderDrivers(drivers, filter = 'all', searchTerm = '') {
    const container = document.getElementById('driversContainer');
    
    if (drivers.length === 0) {
        container.innerHTML = '<div class="no-drivers">No driver data available. Complete some races first!</div>';
        return;
    }

    let filtered = drivers;

    // Apply filter
    if (filter === 'serie-a') {
        filtered = filtered.filter(d => d.serie === 'A');
    } else if (filter === 'serie-b') {
        filtered = filtered.filter(d => d.serie === 'B');
    } else if (filter === 'playoff') {
        filtered = filtered.filter(d => d.playoffQualified);
    }

    // Apply search
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(d => d.name.toLowerCase().includes(term));
    }

    // Sort by total points (descending)
    filtered.sort((a, b) => b.total - a.total);

    if (filtered.length === 0) {
        container.innerHTML = '<div class="no-drivers">No drivers match your search criteria.</div>';
        return;
    }

    container.innerHTML = filtered.map((driver, index) => `
        <div class="driver-card serie-${driver.serie.toLowerCase()} ${driver.playoffQualified ? 'playoff' : ''}" 
             style="cursor: pointer;" 
             data-driver-name="${driver.name.replace(/"/g, '&quot;')}"
             data-driver-index="${index}">
            <div class="driver-name">${driver.name}</div>
            <span class="serie-badge ${driver.serie.toLowerCase()}">${driver.serie} serie</span>
        </div>
    `).join('');
}

// Initialize dummy data if needed
function initializeDummyDriverData() {
    const allData = JSON.parse(localStorage.getItem('fastwayAllData') || '[]');
    if (allData.length > 0) {
        // Ensure race state exists even if driver data exists
        const raceState = JSON.parse(localStorage.getItem('fastway_race_state_v2') || '{}');
        if (!raceState.A || !raceState.A.carStats) {
            const defaultRaceState = {
                A: { carStats: {} },
                B: { carStats: {} }
            };
            allData.forEach((driver, index) => {
                const isSerieA = index < allData.length / 2;
                const serie = isSerieA ? 'A' : 'B';
                if (!defaultRaceState[serie].carStats[driver.name]) {
                    defaultRaceState[serie].carStats[driver.name] = {
                        wins: parseInt(driver.wins) || 0,
                        losses: Math.max(0, 18 - (parseInt(driver.wins) || 0))
                    };
                }
            });
            localStorage.setItem('fastway_race_state_v2', JSON.stringify(defaultRaceState));
        }
        return; // Data already exists
    }
    
    const dummyDrivers = [
        { name: 'Time Track', number: '914', points: 85, wins: 15, chWins: 2, bestTime: '1:23.45' },
        { name: 'Delorean', number: '88', points: 72, wins: 12, chWins: 1, bestTime: '1:24.12' },
        { name: 'Stinger GT', number: '42', points: 68, wins: 10, chWins: 0, bestTime: '1:24.56' },
        { name: 'DRIFTSTA', number: '3', points: 55, wins: 11, chWins: 1, bestTime: '1:25.23' },
        { name: "Erik's Rod", number: '52', points: 48, wins: 8, chWins: 0, bestTime: '1:25.89' },
        { name: 'Hight Voltage', number: '2', points: 68, wins: 13, chWins: 1, bestTime: '1:24.34' },
        { name: 'WHAT-4-2', number: '', points: 42, wins: 6, chWins: 0, bestTime: '1:26.78' },
        { name: 'COUNT MUSCULA', number: '', points: 40, wins: 5, chWins: 0, bestTime: '1:27.12' },
        { name: 'Glory Chaser', number: '32', points: 38, wins: 4, chWins: 0, bestTime: '1:27.45' },
        { name: '620', number: '', points: 35, wins: 3, chWins: 0, bestTime: '1:28.12' },
        { name: "'69 Mustang Boss 302", number: '', points: 32, wins: 2, chWins: 0, bestTime: '1:28.56' },
        { name: "'09 Focus RS", number: '4', points: 30, wins: 1, chWins: 0, bestTime: '1:29.23' },
        { name: '240Z', number: '', points: 28, wins: 1, chWins: 0, bestTime: '1:29.78' },
        { name: "'69 COPO Camaro", number: '', points: 25, wins: 0, chWins: 0, bestTime: '1:30.12' },
        { name: "'69 Camaro", number: '', points: 22, wins: 0, chWins: 0, bestTime: '1:30.56' },
        { name: 'LB Super Silvia S15', number: '23', points: 20, wins: 0, chWins: 0, bestTime: '1:31.23' },
        { name: 'Corvette C8.R', number: '8', points: 18, wins: 0, chWins: 0, bestTime: '1:31.78' },
        { name: 'Toyota 2000GT', number: '', points: 15, wins: 0, chWins: 0, bestTime: '1:32.45' },
        { name: "'16 Cadillac ATS-VR", number: '02', points: 12, wins: 0, chWins: 0, bestTime: '1:33.12' },
        { name: "'69 CamaroB", number: '', points: 10, wins: 0, chWins: 0, bestTime: '1:33.78' },
        { name: 'Roder Dodger', number: '29', points: 8, wins: 0, chWins: 0, bestTime: '1:34.45' },
        { name: 'Blade Raider', number: '5', points: 5, wins: 0, chWins: 0, bestTime: '1:35.12' },
        { name: 'El Segundo Coupe', number: '', points: 3, wins: 0, chWins: 0, bestTime: '1:35.78' },
        { name: 'Chevy Chevelle SS', number: '70', points: 2, wins: 0, chWins: 0, bestTime: '1:36.45' },
        { name: 'Skylines GTR', number: '54', points: 1, wins: 0, chWins: 0, bestTime: '1:37.12' },
        { name: 'Leaf Nismo', number: '', points: 0, wins: 0, chWins: 0, bestTime: '1:37.78' },
        { name: 'Challenger Drift', number: '426', points: 0, wins: 0, chWins: 0, bestTime: '1:38.45' },
        { name: "'69 Charger 500", number: '', points: 0, wins: 0, chWins: 0, bestTime: '1:39.12' },
        { name: 'Thunder Bolt', number: '7', points: 62, wins: 9, chWins: 0, bestTime: '1:25.12' },
        { name: 'Speed Demon', number: '99', points: 45, wins: 7, chWins: 0, bestTime: '1:26.45' },
        { name: 'Motor Max Truck', number: '', points: 40, wins: 5, chWins: 0, bestTime: '1:27.23' },
        { name: "'72 Stingray con", number: '', points: 38, wins: 4, chWins: 0, bestTime: '1:27.78' },
        { name: 'Formula8r', number: '8', points: 35, wins: 3, chWins: 0, bestTime: '1:28.45' },
        { name: 'COPO Camaro Drag', number: '', points: 32, wins: 2, chWins: 0, bestTime: '1:29.12' },
        { name: "'07 Mustang", number: '', points: 30, wins: 1, chWins: 0, bestTime: '1:29.78' },
        { name: "'73 BMW CSL", number: '73', points: 28, wins: 1, chWins: 0, bestTime: '1:30.45' },
        { name: 'Pontiac FirebirdB', number: '70', points: 25, wins: 0, chWins: 0, bestTime: '1:31.12' },
        { name: 'RIP ROD', number: '', points: 22, wins: 0, chWins: 0, bestTime: '1:31.78' },
        { name: "'62 Corvette", number: '', points: 20, wins: 0, chWins: 0, bestTime: '1:32.45' },
        { name: "'10 Chevy Impala", number: '4', points: 18, wins: 0, chWins: 0, bestTime: '1:33.12' },
        { name: 'Fairlandy 2000', number: '54', points: 15, wins: 0, chWins: 0, bestTime: '1:33.78' },
        { name: 'Ferrari Scuderia', number: '', points: 12, wins: 0, chWins: 0, bestTime: '1:34.45' },
        { name: 'Limited Grip', number: '12', points: 10, wins: 0, chWins: 0, bestTime: '1:35.12' },
        { name: 'Ford GT40 Mk.IV', number: '9', points: 8, wins: 0, chWins: 0, bestTime: '1:35.78' },
        { name: 'Ford GT-40', number: '04', points: 5, wins: 0, chWins: 0, bestTime: '1:36.45' },
        { name: "THE GOV'NER", number: '5', points: 3, wins: 0, chWins: 0, bestTime: '1:37.12' },
        { name: 'Dune it Up', number: '', points: 2, wins: 0, chWins: 0, bestTime: '1:37.78' },
        { name: 'Bone Shaker', number: '3', points: 1, wins: 0, chWins: 0, bestTime: '1:38.45' },
        { name: 'DAVancenator', number: '52', points: 0, wins: 0, chWins: 0, bestTime: '1:39.12' },
        { name: 'M16', number: '06', points: 0, wins: 0, chWins: 0, bestTime: '1:39.78' },
        { name: 'Plymouth Barracuda', number: '', points: 0, wins: 0, chWins: 0, bestTime: '1:40.45' },
        { name: 'Lotus Emira', number: '', points: 0, wins: 0, chWins: 0, bestTime: '1:41.12' },
        { name: 'Bentley Continental', number: '100', points: 0, wins: 0, chWins: 0, bestTime: '1:41.78' },
        { name: '70 Camaro', number: '', points: 0, wins: 0, chWins: 0, bestTime: '1:42.45' },
        { name: 'CRUISE BRUISER', number: '20', points: 0, wins: 0, chWins: 0, bestTime: '1:43.12' },
        { name: 'McLaren Senna', number: '', points: 0, wins: 0, chWins: 0, bestTime: '1:43.78' },
        { name: 'ND', number: '', points: 0, wins: 0, chWins: 0, bestTime: '1:44.45' },
        { name: 'ND2', number: '', points: 0, wins: 0, chWins: 0, bestTime: '1:45.12' }
    ];
    
    localStorage.setItem('fastwayAllData', JSON.stringify(dummyDrivers));
    
    // Also initialize race state for standing page
    const raceState = {
        A: {
            carStats: {}
        },
        B: {
            carStats: {}
        }
    };
    
    dummyDrivers.forEach((driver, index) => {
        const isSerieA = index < dummyDrivers.length / 2;
        const serie = isSerieA ? 'A' : 'B';
        raceState[serie].carStats[driver.name] = {
            wins: parseInt(driver.wins) || 0,
            losses: Math.max(0, 18 - (parseInt(driver.wins) || 0))
        };
    });
    
    localStorage.setItem('fastway_race_state_v2', JSON.stringify(raceState));
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    initializeDummyDriverData();
    // Small delay to ensure data is initialized
    setTimeout(() => {
        const drivers = loadAllDrivers();
        let currentFilter = 'all';
        let currentSearch = '';
        const container = document.getElementById('driversContainer');

        // Use event delegation on the container for better reliability
        // This works even when cards are re-rendered
        container.addEventListener('click', function(e) {
            // Find the closest driver-card parent
            const card = e.target.closest('.driver-card');
            if (card) {
                e.preventDefault();
                e.stopPropagation();
                const driverName = card.getAttribute('data-driver-name');
                if (driverName) {
                    window.location.href = `driverdetail.html?driver=${encodeURIComponent(driverName)}`;
                }
            }
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilter = btn.dataset.filter;
                renderDrivers(drivers, currentFilter, currentSearch);
            });
        });

        // Search input
        document.getElementById('searchInput').addEventListener('input', (e) => {
            currentSearch = e.target.value;
            renderDrivers(drivers, currentFilter, currentSearch);
        });

        // Initial render
        renderDrivers(drivers, currentFilter, currentSearch);

        // Refresh every 10 seconds
        setInterval(() => {
            const updatedDrivers = loadAllDrivers();
            renderDrivers(updatedDrivers, currentFilter, currentSearch);
        }, 10000);
    }, 100);
});
