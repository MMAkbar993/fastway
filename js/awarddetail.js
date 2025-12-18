// Award definitions (same as award.js)
const AWARD_DEFINITIONS = {
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
    bestImprovement: { 
        id: 'bestImprovement', 
        title: 'Best Improvement', 
        icon: '📈', 
        description: 'Awarded to the driver who shows the greatest improvement comparing last season vs current season.',
        category: 'special'
    }
};

function getAwardWinnersHistory(awardId) {
    try {
        const history = JSON.parse(localStorage.getItem(`fastway_award_history_${awardId}`) || '[]');
        return history.sort((a, b) => (b.season || 0) - (a.season || 0)); // Newest first
    } catch (e) {
        return [];
    }
}

function getCurrentAwardWinner(awardId) {
    try {
        const { allData, raceState, playoffData } = loadAwardsData();
        const awards = calculateAwards(allData, raceState, playoffData);
        return awards[awardId] || null;
    } catch (e) {
        return null;
    }
}

function renderAwardDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const awardId = urlParams.get('award');
    
    if (!awardId || !AWARD_DEFINITIONS[awardId]) {
        document.getElementById('awardDetailContent').innerHTML = `
            <div class="empty-state">
                <h2>Award Not Found</h2>
                <p>The requested award could not be found.</p>
                <a href="award.html" style="color: #00e7ff; text-decoration: none;">← Back to Awards</a>
            </div>
        `;
        return;
    }
    
    const awardDef = AWARD_DEFINITIONS[awardId];
    const history = getAwardWinnersHistory(awardId);
    const currentWinner = getCurrentAwardWinner(awardId);
    
    // Update title
    document.getElementById('awardDetailTitle').textContent = `${awardDef.icon} ${awardDef.title}`;
    
    let html = '';
    
    // Award Info Card
    html += '<div class="award-info-card" style="background: #F5F5F5; border: 2px solid #00e7ff; border-radius: 16px; padding: 30px; margin-bottom: 40px; text-align: center;">';
    html += `<div style="font-size: 60px; margin-bottom: 15px;">${awardDef.icon}</div>`;
    html += `<h2 style="font-size: 32px; font-weight: 900; color: #1a1a1a; margin-bottom: 15px; text-transform: uppercase;">${awardDef.title}</h2>`;
    html += `<p style="font-size: 16px; color: #1a1a1a; line-height: 1.6; max-width: 600px; margin: 0 auto;">${awardDef.description}</p>`;
    html += '</div>';
    
    // Current Winner
    if (currentWinner && currentWinner.winner) {
        html += '<div class="current-winner-section" style="margin-bottom: 40px;">';
        html += '<h3 style="font-size: 24px; font-weight: 800; color: #1a1a1a; margin-bottom: 20px; text-transform: uppercase;">Current Winner</h3>';
        html += '<div class="winner-card" style="background: #F5F5F5; border: 2px solid #FFD700; border-radius: 12px; padding: 25px; text-align: center;">';
        html += `<div style="font-size: 36px; font-weight: 900; color: #1a1a1a; margin-bottom: 10px; text-transform: uppercase;">${currentWinner.winner}</div>`;
        if (currentWinner.time) {
            html += `<div style="font-size: 20px; color: #1a1a1a; font-weight: 600;">Time: ${currentWinner.time}</div>`;
        } else if (currentWinner.value !== undefined) {
            html += `<div style="font-size: 20px; color: #1a1a1a; font-weight: 600;">${currentWinner.value} ${awardId === 'mostWins' ? 'Wins' : ''}</div>`;
        } else if (currentWinner.points !== undefined) {
            html += `<div style="font-size: 20px; color: #1a1a1a; font-weight: 600;">${currentWinner.points} Points</div>`;
        }
        html += '</div>';
        html += '</div>';
    }
    
    // Historical Winners
    html += '<div class="history-section">';
    html += '<h3 style="font-size: 24px; font-weight: 800; color: #1a1a1a; margin-bottom: 20px; text-transform: uppercase;">Winners Across Seasons</h3>';
    
    if (history.length === 0) {
        html += '<div class="empty-state" style="text-align: center; padding: 40px; color: #666;">';
        html += '<p style="font-size: 18px;">No historical winners recorded yet.</p>';
        html += '<p style="font-size: 14px; margin-top: 10px;">Winners will be automatically added after each season.</p>';
        html += '</div>';
    } else {
        html += '<div class="winners-list" style="display: grid; gap: 15px;">';
        history.forEach((entry, index) => {
            html += `
                <div class="history-winner-card" style="background: #F5F5F5; border: 1px solid rgba(0, 0, 0, 0.1); border-radius: 12px; padding: 20px; display: flex; justify-content: space-between; align-items: center; transition: all 0.3s ease;">
                    <div>
                        <div style="font-size: 20px; font-weight: 800; color: #1a1a1a; margin-bottom: 5px; text-transform: uppercase;">${entry.winner || 'Unknown'}</div>
                        <div style="font-size: 14px; color: #666;">Season ${entry.season || 'N/A'}</div>
                    </div>
                    <div style="text-align: right;">
                        ${entry.value !== undefined ? `<div style="font-size: 18px; font-weight: 700; color: #1a1a1a;">${entry.value}</div>` : ''}
                        ${entry.time ? `<div style="font-size: 18px; font-weight: 700; color: #1a1a1a;">${entry.time}</div>` : ''}
                        ${entry.points !== undefined ? `<div style="font-size: 18px; font-weight: 700; color: #1a1a1a;">${entry.points} pts</div>` : ''}
                    </div>
                </div>
            `;
        });
        html += '</div>';
    }
    
    html += '</div>';
    
    document.getElementById('awardDetailContent').innerHTML = html;
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    renderAwardDetail();
});
