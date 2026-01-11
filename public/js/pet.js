// Render Pet
function renderPet() {
    // Update pet name (both views)
    const nameInput = document.getElementById('pet-name');
    const nameInputCompact = document.getElementById('pet-name-compact');
    if (nameInput) nameInput.value = petData.name;
    if (nameInputCompact) nameInputCompact.value = petData.name;
    
    // Update stats (both views)
    updateStatBar('health', petData.health);
    updateStatBar('happiness', petData.happiness);
    updateStatBar('hunger', petData.hunger);
    updateStatBar('energy', petData.energy);
    
    // Update compact stats
    ['health', 'happiness', 'hunger', 'energy'].forEach(stat => {
        const bar = document.getElementById(`${stat}-bar-compact`);
        const valueSpan = document.getElementById(`${stat}-value-compact`);
        if (bar && valueSpan) {
            const clampedValue = Math.max(0, Math.min(100, petData[stat]));
            bar.style.width = `${clampedValue}%`;
            valueSpan.textContent = Math.round(clampedValue);
        }
    });
    
    // Update growth stage (both views)
    const stageName = GROWTH_STAGES[Math.min(petData.growthStage, GROWTH_STAGES.length - 1)];
    const stageText = document.getElementById('growth-stage-text');
    const stageTextCompact = document.getElementById('growth-stage-text-compact');
    if (stageText) stageText.textContent = stageName;
    if (stageTextCompact) stageTextCompact.textContent = stageName;
    
    // Update coins (both views)
    const coinAmount = document.getElementById('coin-amount');
    const coinAmountCompact = document.getElementById('coin-amount-compact');
    if (coinAmount) coinAmount.textContent = petData.coins.toLocaleString();
    if (coinAmountCompact) coinAmountCompact.textContent = petData.coins.toLocaleString();
    
    // Render pet visual (both views)
    renderPetVisual();
    renderPetVisualCompact();
}

// Render Pet Visual Compact
function renderPetVisualCompact() {
    const petVisual = document.getElementById('pet-visual-compact');
    if (!petVisual) return;
    
    const size = 200;
    const scale = 0.3 + (petData.growthStage * 0.05);
    
    const avgStats = (petData.health + petData.happiness + petData.hunger + petData.energy) / 4;
    const isHealthy = avgStats > 50;
    const isHappy = petData.happiness > 50;
    let color = isHealthy ? '#4ade80' : '#f87171';
    
    // Check active items
    const activeItems = petData.activeItems || [];
    const hasHat = activeItems.includes('hat');
    const hasBowTie = activeItems.includes('bow-tie');
    const hasTie = activeItems.includes('tie');
    
    let accessories = '';
    
    // Hat (on head)
    if (hasHat) {
        accessories += `<rect x="60" y="20" width="80" height="25" rx="5" fill="#1f2937" opacity="0.9"/>`;
        accessories += `<rect x="65" y="25" width="70" height="15" rx="3" fill="#374151"/>`;
    }
    
    // Bow tie (on body)
    if (hasBowTie) {
        accessories += `<circle cx="95" cy="105" r="8" fill="#ef4444"/>`;
        accessories += `<circle cx="105" cy="105" r="8" fill="#ef4444"/>`;
        accessories += `<polygon points="100,105 95,115 105,115" fill="#ef4444"/>`;
    }
    
    // Tie (on body)
    if (hasTie) {
        accessories += `<polygon points="100,85 95,105 100,120 105,105" fill="#1f2937"/>`;
        accessories += `<rect x="98" y="85" width="4" height="8" fill="#374151"/>`;
    }
    
    petVisual.innerHTML = `
        <svg width="${size}" height="${size}" viewBox="0 0 200 200" style="transform: scale(${scale})">
            <circle cx="100" cy="120" r="60" fill="${color}" opacity="0.9"/>
            <circle cx="100" cy="60" r="45" fill="${color}"/>
            ${accessories}
            <circle cx="85" cy="55" r="8" fill="#1f2937"/>
            <circle cx="115" cy="55" r="8" fill="#1f2937"/>
            <path d="M 80 70 Q 100 ${isHappy ? 75 : 80} 120 70" stroke="#1f2937" stroke-width="3" fill="none" stroke-linecap="round"/>
        </svg>
    `;
}

// Render Pet Visual (SVG) - Expanded view
function renderPetVisual() {
    const petVisual = document.getElementById('pet-visual');
    if (!petVisual) return;
    
    const size = 300;
    const scale = 0.8 + (petData.growthStage * 0.1);
    
    const avgStats = (petData.health + petData.happiness + petData.hunger + petData.energy) / 4;
    const isHealthy = avgStats > 50;
    const isHappy = petData.happiness > 50;
    let color = isHealthy ? '#4ade80' : '#f87171';
    
    // Check active items
    const activeItems = petData.activeItems || [];
    const hasHat = activeItems.includes('hat');
    const hasBowTie = activeItems.includes('bow-tie');
    const hasTie = activeItems.includes('tie');
    
    let accessories = '';
    
    // Hat (on head)
    if (hasHat) {
        accessories += `<rect x="60" y="20" width="80" height="25" rx="5" fill="#1f2937" opacity="0.9"/>`;
        accessories += `<rect x="65" y="25" width="70" height="15" rx="3" fill="#374151"/>`;
    }
    
    // Bow tie (on body)
    if (hasBowTie) {
        accessories += `<circle cx="95" cy="105" r="8" fill="#ef4444"/>`;
        accessories += `<circle cx="105" cy="105" r="8" fill="#ef4444"/>`;
        accessories += `<polygon points="100,105 95,115 105,115" fill="#ef4444"/>`;
    }
    
    // Tie (on body)
    if (hasTie) {
        accessories += `<polygon points="100,85 95,105 100,120 105,105" fill="#1f2937"/>`;
        accessories += `<rect x="98" y="85" width="4" height="8" fill="#374151"/>`;
    }
    
    petVisual.innerHTML = `
        <svg width="${size}" height="${size}" viewBox="0 0 200 200" style="transform: scale(${scale})">
            <circle cx="100" cy="120" r="60" fill="${color}" opacity="0.9"/>
            <circle cx="100" cy="60" r="45" fill="${color}"/>
            ${accessories}
            <circle cx="85" cy="55" r="8" fill="#1f2937"/>
            <circle cx="115" cy="55" r="8" fill="#1f2937"/>
            <path d="M 80 70 Q 100 ${isHappy ? 75 : 80} 120 70" stroke="#1f2937" stroke-width="3" fill="none" stroke-linecap="round"/>
        </svg>
    `;
}

// Update Stat Bar
function updateStatBar(statName, value) {
    const bar = document.getElementById(`${statName}-bar`);
    const valueSpan = document.getElementById(`${statName}-value`);
    
    if (!bar || !valueSpan) return;
    
    const clampedValue = Math.max(0, Math.min(100, value));
    bar.style.width = `${clampedValue}%`;
    valueSpan.textContent = Math.round(clampedValue);
    
    // Update color based on value
    if (clampedValue < 30) {
        bar.style.opacity = '0.7';
    } else if (clampedValue < 60) {
        bar.style.opacity = '0.85';
    } else {
        bar.style.opacity = '1';
    }
}

// Calculate Growth
function calculateGrowth() {
    const avgStats = (petData.health + petData.happiness + petData.hunger + petData.energy) / 4;
    const growthPoints = petData.totalTasksCompleted + petData.itemsUsed + (avgStats / 10);
    petData.growthStage = Math.min(3, Math.floor(growthPoints / 20));
    
    // Update pet visual if growth changed
    renderPetVisual();
}

// Update Stat Decay
function updateStatDecay() {
    const now = Date.now();
    const lastUpdate = petData.lastStatUpdate || now;
    const hoursPassed = (now - lastUpdate) / (1000 * 60 * 60);
    
    if (hoursPassed > 0) {
        const decayRate = (petData.decayMultiplier || 1) * 1; // 1 point per hour
        petData.hunger = Math.max(0, petData.hunger - (decayRate * hoursPassed));
        petData.energy = Math.max(0, petData.energy - (decayRate * hoursPassed * 0.5));
        petData.lastStatUpdate = now;
        savePetData();
        renderPet();
    }
}

// Animate Coin Gain
function animateCoinGain(amount) {
    const coinCounter = document.getElementById('coin-amount');
    coinCounter.classList.add('coin-gain');
    setTimeout(() => {
        coinCounter.classList.remove('coin-gain');
    }, 500);
}
