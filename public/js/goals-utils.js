// Goal utility functions

// Calculate streak from history array
// Returns the current streak count based on consecutive daily completions
function calculateStreakFromHistory(history) {
    if (!history || history.length === 0) {
        return 0;
    }
    
    // Sort history by date (newest first)
    const sortedHistory = [...history].sort((a, b) => b.date - a.date);
    
    // Get today's date at midnight in local timezone
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get the most recent completion date
    const mostRecent = new Date(sortedHistory[0].date);
    mostRecent.setHours(0, 0, 0, 0);
    
    // Calculate days difference between today and most recent completion
    const daysDiff = Math.floor((today.getTime() - mostRecent.getTime()) / 86400000);
    
    // If the most recent completion is more than 1 day ago, streak is broken (0)
    if (daysDiff > 1) {
        return 0;
    }
    
    // Count consecutive days
    let streak = 0;
    let expectedDate = daysDiff === 0 ? today : new Date(today.getTime() - 86400000);
    
    for (const entry of sortedHistory) {
        const entryDate = new Date(entry.date);
        entryDate.setHours(0, 0, 0, 0);
        
        const entryDaysDiff = Math.floor((expectedDate.getTime() - entryDate.getTime()) / 86400000);
        
        if (entryDaysDiff === 0) {
            // This entry matches the expected date, increment streak
            streak++;
            expectedDate = new Date(expectedDate.getTime() - 86400000); // Move to previous day
        } else if (entryDaysDiff > 0) {
            // There's a gap, streak is broken
            break;
        }
        // If entryDaysDiff < 0, this entry is in the future (shouldn't happen), skip it
    }
    
    return streak;
}

// Make function globally accessible
window.calculateStreakFromHistory = calculateStreakFromHistory;
