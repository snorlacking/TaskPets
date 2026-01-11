// Shop Items Catalog (shared with main page)
const SHOP_ITEMS = [
    // Food
    { id: 'apple', name: 'Apple', category: 'food', icon: '🍎', price: 10, description: 'A fresh apple', effects: { hunger: 20, health: 10 } },
    { id: 'meal', name: 'Meal', category: 'food', icon: '🍽️', price: 30, description: 'A hearty meal', effects: { hunger: 40, health: 20 } },
    { id: 'feast', name: 'Feast', category: 'food', icon: '🍖', price: 60, description: 'A grand feast', effects: { hunger: 60, health: 40 } },
    // Toys
    { id: 'ball', name: 'Ball', category: 'toys', icon: '⚽', price: 20, description: 'A fun ball to play with', effects: { happiness: 20, energy: 10 } },
    { id: 'puzzle', name: 'Puzzle', category: 'toys', icon: '🧩', price: 40, description: 'A challenging puzzle', effects: { happiness: 30, energy: 20 } },
    { id: 'game-console', name: 'Game Console', category: 'toys', icon: '🎮', price: 80, description: 'Hours of fun', effects: { happiness: 50, energy: 30 } },
    // Treats
    { id: 'cookie', name: 'Cookie', category: 'treats', icon: '🍪', price: 30, description: 'A sweet cookie', effects: { health: 15, happiness: 15, hunger: 15, energy: 15 } },
    { id: 'cake', name: 'Cake', category: 'treats', icon: '🎂', price: 70, description: 'A delicious cake', effects: { health: 30, happiness: 30, hunger: 30, energy: 30 } },
    { id: 'golden-treat', name: 'Golden Treat', category: 'treats', icon: '✨', price: 150, description: 'The ultimate treat', effects: { health: 50, happiness: 50, hunger: 50, energy: 50 } },
    // Decorations
    { id: 'hat', name: 'Lucky Hat', category: 'decorations', icon: '🎩', price: 40, description: 'A stylish hat that brings good fortune', effects: { happiness: 10 }, wearable: true },
    { id: 'bow-tie', name: 'Elegant Bow Tie', category: 'decorations', icon: '🎀', price: 35, description: 'A dapper accessory', effects: { happiness: 15 }, wearable: true },
    { id: 'tie', name: 'Professional Tie', category: 'decorations', icon: '👔', price: 45, description: 'Look sharp and professional', effects: { happiness: 12, energy: 5 }, wearable: true },
    { id: 'accessory', name: 'Accessory', category: 'decorations', icon: '💍', price: 60, description: 'A fancy accessory', effects: {} },
    { id: 'background', name: 'Background Theme', category: 'decorations', icon: '🖼️', price: 100, description: 'Change the background', effects: {} },
    // Upgrades
    { id: 'health-boost', name: 'Health Boost', category: 'upgrades', icon: '❤️', price: 200, description: '+10 max health permanently', effects: { permanentHealth: 10 } },
    { id: 'happiness-boost', name: 'Happiness Boost', category: 'upgrades', icon: '😊', price: 200, description: '+10 max happiness permanently', effects: { permanentHappiness: 10 } },
    { id: 'stat-decay-slower', name: 'Stat Decay Slower', category: 'upgrades', icon: '⏰', price: 300, description: 'Stats decay 50% slower', effects: { decayMultiplier: 0.5 } }
];

// Pet Data
let petData = null;
let currentCategory = 'all';

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadPetData();
    updateCoinDisplay();
    renderShopItems('all');
    renderInventory();
    setupEventListeners();
});

// Load Pet Data from API
async function loadPetData() {
    try {
        const response = await fetch(`${API_BASE_URL}/user/data`, {
            credentials: 'include'
        });
        
        if (response.status === 401) {
            window.location.href = 'login.html';
            return;
        }
        
        if (!response.ok) {
            throw new Error('Failed to fetch pet data');
        }
        
        const data = await response.json();
        
        if (data.petData && Object.keys(data.petData).length > 0) {
            petData = data.petData;
        } else {
            petData = getDefaultPetData();
            await savePetData();
        }
    } catch (error) {
        console.error('Error loading pet data:', error);
        petData = getDefaultPetData();
    }
}

// Default Pet Data
function getDefaultPetData() {
    return {
        name: 'My Pet',
        health: 100,
        happiness: 100,
        hunger: 100,
        energy: 100,
        growthStage: 0,
        coins: 0,
        inventory: [],
        totalTasksCompleted: 0,
        itemsUsed: 0,
        lastStatUpdate: Date.now(),
        maxHealth: 100,
        maxHappiness: 100,
        activeItems: [] // Track which wearable items are currently active
    };
}

// Save Pet Data to API
async function savePetData() {
    try {
        const response = await fetch(`${API_BASE_URL}/user/data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ petData })
        });
        
        if (response.status === 401) {
            window.location.href = 'login.html';
            return;
        }
        
        if (!response.ok) {
            throw new Error('Failed to save pet data');
        }
    } catch (error) {
        console.error('Error saving pet data:', error);
    }
}

// Update Coin Display
function updateCoinDisplay() {
    document.getElementById('coin-amount').textContent = petData.coins.toLocaleString();
}

// Setup Event Listeners
function setupEventListeners() {
    // Back button
    document.getElementById('back-button').addEventListener('click', () => {
        window.location.href = 'game.html';
    });

    // Category buttons
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            renderShopItems(currentCategory);
        });
    });
}

// Render Shop Items
function renderShopItems(category = 'all') {
    const shopItemsContainer = document.getElementById('shop-items');
    const filteredItems = category === 'all' 
        ? SHOP_ITEMS 
        : SHOP_ITEMS.filter(item => item.category === category);
    
    if (filteredItems.length === 0) {
        shopItemsContainer.innerHTML = '<p class="empty-message">No items in this category.</p>';
        return;
    }
    
    shopItemsContainer.innerHTML = filteredItems.map(item => {
        const canAfford = petData.coins >= item.price;
        const effects = item.effects ? Object.entries(item.effects)
            .filter(([key]) => !key.startsWith('permanent') && key !== 'decayMultiplier')
            .map(([key, value]) => `${key}: +${value}`)
            .join(', ') : 'Cosmetic';
        
        return `
            <div class="shop-item-card">
                <div class="item-icon">${item.icon}</div>
                <div class="item-name">${item.name}</div>
                <div class="item-description">${item.description}</div>
                ${effects !== 'Cosmetic' ? `<div class="item-effects">${effects}</div>` : ''}
                <div class="item-price">
                    <span class="coin-icon">🪙</span>
                    ${item.price}
                </div>
                <button class="buy-btn" ${!canAfford ? 'disabled' : ''} onclick="buyItem('${item.id}')">
                    ${canAfford ? 'Buy' : 'Not enough coins'}
                </button>
            </div>
        `;
    }).join('');
}

// Buy Item
async function buyItem(itemId) {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item || petData.coins < item.price) {
        showPurchaseFeedback('Not enough coins!', 'error');
        return;
    }
    
    petData.coins -= item.price;
    
    // Apply item effects
    if (item.effects) {
        Object.entries(item.effects).forEach(([stat, value]) => {
            if (stat === 'permanentHealth') {
                petData.maxHealth += value;
                petData.health = Math.min(petData.maxHealth, petData.health + value);
            } else if (stat === 'permanentHappiness') {
                petData.maxHappiness += value;
                petData.happiness = Math.min(petData.maxHappiness, petData.happiness + value);
            } else if (stat === 'decayMultiplier') {
                petData.decayMultiplier = (petData.decayMultiplier || 1) * value;
            } else if (['health', 'happiness', 'hunger', 'energy'].includes(stat)) {
                const maxValue = stat === 'health' ? petData.maxHealth : (stat === 'happiness' ? petData.maxHappiness : 100);
                petData[stat] = Math.min(maxValue, petData[stat] + value);
            }
        });
    }
    
    // Add to inventory if it's not consumed
    if (item.category === 'decorations' || item.category === 'upgrades') {
        // Check if already owned (for upgrades)
        if (!petData.inventory.includes(itemId)) {
            petData.inventory.push(itemId);
        }
    } else {
        // Consumable items are used immediately, but we track usage
        petData.itemsUsed++;
    }
    
    await savePetData();
    updateCoinDisplay();
    renderShopItems(currentCategory);
    renderInventory();
    showPurchaseFeedback(`Purchased ${item.name}!`, 'success');
    animateCoinGain();
}

// Use Item from Inventory
async function useItem(itemId) {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return;
    
    // Only consumable items can be used from inventory
    if (item.category === 'food' || item.category === 'toys' || item.category === 'treats') {
        // Apply effects
        if (item.effects) {
            Object.entries(item.effects).forEach(([stat, value]) => {
                if (['health', 'happiness', 'hunger', 'energy'].includes(stat)) {
                    const maxValue = stat === 'health' ? petData.maxHealth : (stat === 'happiness' ? petData.maxHappiness : 100);
                    petData[stat] = Math.min(maxValue, petData[stat] + value);
                }
            });
        }
        
        // Remove from inventory if consumable
        petData.inventory = petData.inventory.filter(id => id !== itemId);
        petData.itemsUsed++;
        await savePetData();
        renderInventory();
        showPurchaseFeedback(`Used ${item.name}!`, 'success');
    }
}

// Render Inventory
function renderInventory() {
    const inventoryContainer = document.getElementById('inventory-items');
    const emptyMessage = document.getElementById('empty-inventory');
    
    if (!petData.inventory || petData.inventory.length === 0) {
        inventoryContainer.innerHTML = '';
        emptyMessage.style.display = 'block';
        return;
    }
    
    emptyMessage.style.display = 'none';
    
    // Ensure activeItems exists
    if (!petData.activeItems) {
        petData.activeItems = [];
    }
    
    const inventoryItems = petData.inventory.map(itemId => {
        const item = SHOP_ITEMS.find(i => i.id === itemId);
        if (!item) return '';
        
        const isConsumable = ['food', 'toys', 'treats'].includes(item.category);
        const isWearable = item.wearable === true;
        const isActive = petData.activeItems && petData.activeItems.includes(itemId);
        const effects = item.effects ? Object.entries(item.effects)
            .filter(([key]) => !key.startsWith('permanent') && key !== 'decayMultiplier')
            .map(([key, value]) => `${key}: +${value}`)
            .join(', ') : '';
        
        let actionButton = '';
        if (isConsumable) {
            actionButton = `<button class="use-btn" onclick="useItem('${itemId}')">Use</button>`;
        } else if (isWearable) {
            actionButton = `<button class="toggle-btn ${isActive ? 'active' : ''}" onclick="toggleWearableItem('${itemId}')">${isActive ? 'Equipped' : 'Equip'}</button>`;
        } else {
            actionButton = '<span class="owned-badge">Owned</span>';
        }
        
        return `
            <div class="inventory-item-card ${isActive ? 'active' : ''}">
                <div class="item-icon">${item.icon}</div>
                <div class="item-name">${item.name}</div>
                <div class="item-description">${item.description}</div>
                ${effects ? `<div class="item-effects">${effects}</div>` : ''}
                ${actionButton}
            </div>
        `;
    }).filter(html => html !== '').join('');
    
    inventoryContainer.innerHTML = inventoryItems;
}

// Show Purchase Feedback
function showPurchaseFeedback(message, type = 'success') {
    const feedback = document.getElementById('purchase-feedback');
    feedback.textContent = message;
    feedback.className = `purchase-feedback ${type}`;
    feedback.style.display = 'block';
    
    setTimeout(() => {
        feedback.style.display = 'none';
    }, 3000);
}

// Animate Coin Gain
function animateCoinGain() {
    const coinCounter = document.getElementById('coin-amount');
    coinCounter.classList.add('coin-gain');
    setTimeout(() => {
        coinCounter.classList.remove('coin-gain');
    }, 500);
}

// Toggle Wearable Item
async function toggleWearableItem(itemId) {
    if (!petData.activeItems) {
        petData.activeItems = [];
    }
    
    const index = petData.activeItems.indexOf(itemId);
    if (index > -1) {
        // Remove item (unequip)
        petData.activeItems.splice(index, 1);
    } else {
        // Add item (equip)
        petData.activeItems.push(itemId);
    }
    
    await savePetData();
    renderInventory();
    showPurchaseFeedback(petData.activeItems.includes(itemId) ? 'Item equipped!' : 'Item unequipped!', 'success');
}

// Make functions globally accessible
window.buyItem = buyItem;
window.useItem = useItem;
window.toggleWearableItem = toggleWearableItem;