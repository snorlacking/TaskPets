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
    { id: 'hat', name: 'Hat', category: 'decorations', icon: '🎩', price: 40, description: 'A stylish hat', effects: {} },
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
document.addEventListener('DOMContentLoaded', () => {
    loadPetData();
    updateCoinDisplay();
    renderShopItems('all');
    renderInventory();
    setupEventListeners();
});

// Load Pet Data
function loadPetData() {
    const saved = localStorage.getItem('petData');
    if (saved) {
        petData = JSON.parse(saved);
    } else {
        petData = {
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
            maxHappiness: 100
        };
        savePetData();
    }
}

// Save Pet Data
function savePetData() {
    localStorage.setItem('petData', JSON.stringify(petData));
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
function buyItem(itemId) {
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
    
    savePetData();
    updateCoinDisplay();
    renderShopItems(currentCategory);
    renderInventory();
    showPurchaseFeedback(`Purchased ${item.name}!`, 'success');
    animateCoinGain();
}

// Use Item from Inventory
function useItem(itemId) {
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
        savePetData();
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
    
    const inventoryItems = petData.inventory.map(itemId => {
        const item = SHOP_ITEMS.find(i => i.id === itemId);
        if (!item) return '';
        
        const isConsumable = ['food', 'toys', 'treats'].includes(item.category);
        const effects = item.effects ? Object.entries(item.effects)
            .filter(([key]) => !key.startsWith('permanent') && key !== 'decayMultiplier')
            .map(([key, value]) => `${key}: +${value}`)
            .join(', ') : '';
        
        return `
            <div class="inventory-item-card">
                <div class="item-icon">${item.icon}</div>
                <div class="item-name">${item.name}</div>
                <div class="item-description">${item.description}</div>
                ${effects ? `<div class="item-effects">${effects}</div>` : ''}
                ${isConsumable ? `<button class="use-btn" onclick="useItem('${itemId}')">Use</button>` : '<span class="owned-badge">Owned</span>'}
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

// Make functions globally accessible
window.buyItem = buyItem;
window.useItem = useItem;
