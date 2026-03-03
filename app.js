// Titan Ascent — Gamified Workout Tracker
const STORAGE_WORKOUTS = 'ironforge_workouts';
const STORAGE_HISTORY = 'ironforge_workout_history';
const STORAGE_GAME = 'ironforge_game';

let currentDay = 'Monday';
let dayWorkouts = {};
let workoutHistory = [];
let gameState = { xp: 0, totalSets: 0, unlockedAchievements: [] };
let restTimerInterval = null;

document.addEventListener('DOMContentLoaded', () => {
    dayWorkouts = loadDayWorkouts();
    workoutHistory = loadHistory();
    gameState = loadGameState();

    showMainApp();

    document.getElementById('addExerciseBtn').addEventListener('click', openExerciseModal);
    document.getElementById('workoutDetailsClose').addEventListener('click', closeWorkoutDetails);
    document.getElementById('modalClose').addEventListener('click', closeExerciseModal);
    document.getElementById('logWorkoutBtn').addEventListener('click', logWorkout);
    document.getElementById('exerciseSearch').addEventListener('input', filterExercises);
    document.getElementById('clearHistoryBtn').addEventListener('click', () => confirmClearHistory());
    document.getElementById('confirmCancel').addEventListener('click', closeConfirmModal);
    document.getElementById('confirmDelete').addEventListener('click', handleConfirmDelete);
    document.getElementById('achievementsBtn').addEventListener('click', openAchievements);
    document.getElementById('achievementsClose').addEventListener('click', closeAchievements);

    document.querySelectorAll('.rest-btn').forEach(btn => {
        btn.addEventListener('click', () => startRestTimer(parseInt(btn.dataset.sec)));
    });

    document.getElementById('achievementsModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'achievementsModal') closeAchievements();
    });
});

function showMainApp() {
    renderDayTabs();
    renderExerciseList();
    renderHistory();
    updateStats();
    updateGameUI();
    updateWorkoutProgress();
}

function loadDayWorkouts() {
    try {
        const data = localStorage.getItem(STORAGE_WORKOUTS);
        return data ? JSON.parse(data) : {};
    } catch {
        return {};
    }
}

function saveDayWorkouts() {
    localStorage.setItem(STORAGE_WORKOUTS, JSON.stringify(dayWorkouts));
}

function loadHistory() {
    try {
        const data = localStorage.getItem(STORAGE_HISTORY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

function saveHistory() {
    localStorage.setItem(STORAGE_HISTORY, JSON.stringify(workoutHistory));
}

function loadGameState() {
    try {
        const data = localStorage.getItem(STORAGE_GAME);
        const state = data ? JSON.parse(data) : { unlockedAchievements: [] };
        state.unlockedAchievements = state.unlockedAchievements || [];
        return state;
    } catch {
        return { unlockedAchievements: [] };
    }
}

function getTotalSetsFromHistory() {
    return workoutHistory.reduce((sum, w) =>
        sum + (w.exercises || []).reduce((s, e) => s + (e.sets || []).filter(st => st.reps || st.weight || st.notes).length, 0), 0);
}

function saveGameState() {
    localStorage.setItem(STORAGE_GAME, JSON.stringify(gameState));
}

function getTotalXP() {
    return getTotalSetsFromHistory() * XP_PER_SET;
}

function getLevel() {
    return Math.floor(getTotalXP() / XP_PER_LEVEL) + 1;
}

function getXpForNextLevel() {
    const currentLevel = getLevel();
    return currentLevel * XP_PER_LEVEL;
}

function getXpProgress() {
    const xp = getTotalXP();
    const xpInLevel = xp % XP_PER_LEVEL;
    return (xpInLevel / XP_PER_LEVEL) * 100;
}

function getStreak() {
    if (workoutHistory.length === 0) return 0;
    const uniqueDates = [...new Set(workoutHistory.map(w => new Date(w.date).toDateString()))].map(d => new Date(d).getTime()).sort((a, b) => b - a);
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let checkTime = today.getTime();
    for (let i = 0; i < 365; i++) {
        if (uniqueDates.includes(checkTime)) {
            streak++;
            checkTime -= 86400000;
        } else if (i === 0) {
            checkTime -= 86400000;
        } else break;
    }
    return streak;
}

function addXp(amount, element) {
    updateGameUI();
    checkAchievements();
    showXpPopup(amount, element);
    playCompleteSound();
}

function showXpPopup(amount, element) {
    const popup = document.getElementById('xpPopup');
    popup.textContent = `+${amount} XP`;
    popup.classList.remove('hidden');
    popup.style.left = '';
    popup.style.top = '';
    if (element) {
        const rect = element.getBoundingClientRect();
        popup.style.left = rect.left + rect.width / 2 + 'px';
        popup.style.top = rect.top - 10 + 'px';
    } else {
        popup.style.left = '50%';
        popup.style.top = '40%';
    }
    setTimeout(() => popup.classList.add('hidden'), 900);
}

function playCompleteSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 523;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
}

function stopRestTimer() {
    if (restTimerInterval) {
        clearInterval(restTimerInterval);
        restTimerInterval = null;
    }
    const countdownEl = document.getElementById('restCountdown');
    if (countdownEl) {
        countdownEl.textContent = '';
        countdownEl.classList.remove('active');
    }
}

function startRestTimer(seconds) {
    if (restTimerInterval) clearInterval(restTimerInterval);
    const countdownEl = document.getElementById('restCountdown');
    countdownEl.textContent = `${seconds}s`;
    countdownEl.classList.add('active');
    let left = seconds;
    restTimerInterval = setInterval(() => {
        left--;
        countdownEl.textContent = left > 0 ? `${left}s` : 'Go!';
        if (left <= 0) {
            clearInterval(restTimerInterval);
            restTimerInterval = null;
            playCompleteSound();
            setTimeout(() => countdownEl.classList.remove('active'), 1000);
        }
    }, 1000);
}

function checkAchievements() {
    const sets = getTotalSetsFromHistory();
    const workouts = workoutHistory.length;
    const streak = getStreak();
    let newUnlocks = [];
    ACHIEVEMENTS.forEach(a => {
        if (gameState.unlockedAchievements.includes(a.id)) return;
        const req = a.require || {};
        if (req.sets && sets >= req.sets) newUnlocks.push(a);
        else if (req.workouts && workouts >= req.workouts) newUnlocks.push(a);
        else if (req.streak && streak >= req.streak) newUnlocks.push(a);
    });
    newUnlocks.forEach(a => {
        gameState.unlockedAchievements.push(a.id);
    });
    if (newUnlocks.length) saveGameState();
}

function updateGameUI() {
    const levelEl = document.getElementById('levelBadge');
    const xpBarEl = document.getElementById('xpBar');
    const streakEl = document.getElementById('streakBadge');
    if (levelEl) levelEl.textContent = `Lv.${getLevel()}`;
    if (xpBarEl) xpBarEl.style.width = getXpProgress() + '%';
    if (streakEl) streakEl.textContent = `🔥 ${getStreak()}`;
}

function updateWorkoutProgress() {
    const exercises = getExercisesForDay();
    const total = exercises.reduce((sum, ex) => sum + (ex.sets || 1), 0);
    const completed = exercises.reduce((sum, ex) => {
        const data = ex.setData || [];
        return sum + data.filter(s => s.completed).length;
    }, 0);
    const fill = document.getElementById('progressBarFill');
    const text = document.getElementById('progressText');
    if (fill) fill.style.width = total ? (completed / total) * 100 + '%' : '0%';
    if (text) text.textContent = `${completed} / ${total} sets`;
}

// Day Tabs
function renderDayTabs() {
    const container = document.getElementById('dayTabs');
    container.innerHTML = DAYS.map(day => `
        <button class="day-tab ${day === currentDay ? 'active' : ''}" data-day="${day}">${day.slice(0, 3)}</button>
    `).join('');

    container.querySelectorAll('.day-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            currentDay = tab.dataset.day;
            document.querySelectorAll('.day-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById('dayTitle').textContent = currentDay;
            renderExerciseList();
            updateWorkoutProgress();
        });
    });
}

// Exercise List for selected day
function getExercisesForDay() {
    if (!dayWorkouts[currentDay]) dayWorkouts[currentDay] = [];
    return dayWorkouts[currentDay];
}

function renderExerciseList() {
    const exercises = getExercisesForDay();
    const container = document.getElementById('exerciseList');

    if (exercises.length === 0) {
        container.innerHTML = '<p class="empty-state">No exercises yet. Click "Add Exercise" to build your workout.</p>';
    } else {
        container.innerHTML = exercises.map((ex, idx) => {
            const exerciseDef = EXERCISE_LIBRARY.find(e => e.id === ex.id) || ex;
            const unit = exerciseDef.unit || 'kg';
            const isBody = unit === 'body';
            const isCardio = unit === 'cardio';
            const isTime = unit === 'time';

            let setsHtml = '';
            for (let i = 0; i < (ex.sets || 1); i++) {
                const setNum = i + 1;
                const setData = ex.setData?.[i] || {};
                if (isCardio) {
                    setsHtml += `
                        <div class="set-row">
                            <span class="set-label">Set ${setNum}</span>
                            <input type="text" placeholder="Duration/notes" data-idx="${idx}" data-set="${setNum}" data-field="notes" value="${setData.notes || ''}">
                            <input type="hidden" data-idx="${idx}" data-set="${setNum}" data-field="weight" value="0">
                            <input type="checkbox" class="set-complete" data-idx="${idx}" data-set="${setNum}">
                        </div>
                    `;
                } else if (isTime) {
                    setsHtml += `
                        <div class="set-row">
                            <span class="set-label">Set ${setNum}</span>
                            <input type="text" placeholder="Time (e.g. 1 min)" data-idx="${idx}" data-set="${setNum}" data-field="reps" value="${setData.reps || ''}">
                            <input type="hidden" data-idx="${idx}" data-set="${setNum}" data-field="weight" value="0">
                            <input type="checkbox" class="set-complete" data-idx="${idx}" data-set="${setNum}">
                        </div>
                    `;
                } else {
                    setsHtml += `
                        <div class="set-row ${isBody ? 'bodyweight' : ''}">
                            <span class="set-label">Set ${setNum}</span>
                            <input type="number" placeholder="Reps" data-idx="${idx}" data-set="${setNum}" data-field="reps" min="1" value="${setData.reps || ''}">
                            ${isBody ? '<input type="hidden" data-idx="' + idx + '" data-set="' + setNum + '" data-field="weight" value="0">' : '<input type="number" placeholder="Weight (kg)" data-idx="' + idx + '" data-set="' + setNum + '" data-field="weight" min="0" step="0.5" value="' + (setData.weight ?? '') + '">'}
                            <input type="checkbox" class="set-complete" data-idx="${idx}" data-set="${setNum}">
                        </div>
                    `;
                }
            }

            return `
                <div class="exercise-card" data-idx="${idx}">
                    <div class="exercise-header">
                        <span class="exercise-name">${exerciseDef.name}</span>
                        <span class="exercise-meta">${ex.sets || 1} sets × ${ex.reps || '-'} reps</span>
                        <button class="remove-exercise" data-idx="${idx}" title="Remove">×</button>
                    </div>
                    <div class="exercise-config">
                        <div class="config-row">
                            <label>Sets:</label>
                            <input type="number" class="config-sets" data-idx="${idx}" min="1" max="10" value="${ex.sets || 1}">
                            <label>Reps:</label>
                            <input type="text" class="config-reps" data-idx="${idx}" placeholder="e.g. 10 or 8-12" value="${ex.reps || ''}">
                        </div>
                    </div>
                    <div class="sets-container">${setsHtml}</div>
                </div>
            `;
        }).join('');
    }

    // Event listeners
    container.querySelectorAll('.remove-exercise').forEach(btn => {
        btn.addEventListener('click', () => removeExercise(parseInt(btn.dataset.idx)));
    });
    container.querySelectorAll('.config-sets').forEach(input => {
        input.addEventListener('change', () => updateExerciseSets(parseInt(input.dataset.idx), parseInt(input.value) || 1));
    });
    container.querySelectorAll('.config-reps').forEach(input => {
        input.addEventListener('blur', () => {
            captureSetDataFromDOM();
            updateExerciseReps(parseInt(input.dataset.idx), input.value);
        });
    });
    container.querySelectorAll('input[data-idx]').forEach(input => {
        if (!input.classList.contains('config-sets') && !input.classList.contains('config-reps')) {
            input.addEventListener('change', () => {
                captureSetDataFromDOM();
                saveDayWorkouts();
            });
            input.addEventListener('blur', () => {
                captureSetDataFromDOM();
                saveDayWorkouts();
            });
        }
    });

    container.querySelectorAll('.set-complete').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            captureSetDataFromDOM();
            saveDayWorkouts();
            updateWorkoutProgress();
            if (this.checked) {
                addXp(XP_PER_SET, this);
                if (!restTimerInterval) startRestTimer(60);
            }
        });
    });
}

function openAchievements() {
    const container = document.getElementById('achievementsBody');
    container.innerHTML = ACHIEVEMENTS.map(a => {
        const unlocked = gameState.unlockedAchievements.includes(a.id);
        return `
            <div class="achievement-item ${unlocked ? 'unlocked' : 'locked'}">
                <span class="achievement-icon">${a.icon}</span>
                <div>
                    <strong>${a.name}</strong>
                    <p>${a.desc}</p>
                </div>
                <span class="achievement-status">${unlocked ? '✓' : '🔒'}</span>
            </div>
        `;
    }).join('');
    document.getElementById('achievementsModal').classList.remove('hidden');
}

function closeAchievements() {
    document.getElementById('achievementsModal').classList.add('hidden');
}

function captureSetDataFromDOM() {
    const exercises = getExercisesForDay();
    exercises.forEach((ex, idx) => {
        const setCount = ex.sets || 1;
        ex.setData = ex.setData || [];
        for (let i = 1; i <= setCount; i++) {
            const repsInput = document.querySelector(`input[data-idx="${idx}"][data-set="${i}"][data-field="reps"]`);
            const weightInput = document.querySelector(`input[data-idx="${idx}"][data-set="${i}"][data-field="weight"]`);
            const notesInput = document.querySelector(`input[data-idx="${idx}"][data-set="${i}"][data-field="notes"]`);
            const completeInput = document.querySelector(`input.set-complete[data-idx="${idx}"][data-set="${i}"]`);
            ex.setData[i - 1] = {
                reps: repsInput?.value || null,
                weight: weightInput?.value ? parseFloat(weightInput.value) : null,
                notes: notesInput?.value || null,
                completed: completeInput?.checked || false
            };
        }
    });
}

function updateExerciseSets(idx, sets) {
    captureSetDataFromDOM();
    const exercises = getExercisesForDay();
    if (!exercises[idx]) return;
    exercises[idx].sets = Math.max(1, Math.min(10, sets));
    exercises[idx].setData = exercises[idx].setData || [];
    while (exercises[idx].setData.length < sets) {
        exercises[idx].setData.push({});
    }
    exercises[idx].setData.length = sets;
    saveDayWorkouts();
    renderExerciseList();
}

function updateExerciseReps(idx, reps) {
    const exercises = getExercisesForDay();
    if (!exercises[idx]) return;
    exercises[idx].reps = reps;
    saveDayWorkouts();
}

function removeExercise(idx) {
    const exercises = getExercisesForDay();
    exercises.splice(idx, 1);
    saveDayWorkouts();
    renderExerciseList();
}

// Exercise Modal
function openExerciseModal() {
    document.getElementById('exerciseModal').classList.remove('hidden');
    renderExercisePicker();
}

function closeExerciseModal() {
    document.getElementById('exerciseModal').classList.add('hidden');
}

function filterExercises() {
    renderExercisePicker(document.getElementById('exerciseSearch').value.trim().toLowerCase());
}

function renderExercisePicker(search = '') {
    const container = document.getElementById('exerciseCategories');
    const categories = [...new Set(EXERCISE_LIBRARY.map(e => e.category))];

    container.innerHTML = categories.map(cat => {
        const exercises = EXERCISE_LIBRARY.filter(e => {
            if (e.category !== cat) return false;
            if (search && !e.name.toLowerCase().includes(search)) return false;
            return true;
        });
        if (exercises.length === 0) return '';

        return `
            <div class="category-group">
                <h4>${cat}</h4>
                <div class="exercise-options">
                    ${exercises.map(ex => `
                        <button type="button" class="exercise-option" data-id="${ex.id}" data-name="${ex.name}" data-unit="${ex.unit}">
                            ${ex.name}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');

    container.querySelectorAll('.exercise-option').forEach(btn => {
        btn.addEventListener('click', () => addExercise(btn.dataset.id, btn.dataset.name, btn.dataset.unit));
    });
}

function addExercise(id, name, unit) {
    const exercises = getExercisesForDay();
    if (exercises.some(e => e.id === id)) {
        closeExerciseModal();
        return;
    }
    exercises.push({
        id,
        name,
        unit,
        sets: 1,
        reps: '',
        setData: [{}]
    });
    saveDayWorkouts();
    renderExerciseList();
    closeExerciseModal();
    document.getElementById('exerciseSearch').value = '';
}

// Log Workout
function getWorkoutDataFromDOM() {
    const exercises = getExercisesForDay();
    const result = [];

    exercises.forEach((ex, idx) => {
        const sets = [];
        const setCount = ex.sets || 1;
        for (let i = 1; i <= setCount; i++) {
            const repsInput = document.querySelector(`input[data-idx="${idx}"][data-set="${i}"][data-field="reps"]`);
            const weightInput = document.querySelector(`input[data-idx="${idx}"][data-set="${i}"][data-field="weight"]`);
            const notesInput = document.querySelector(`input[data-idx="${idx}"][data-set="${i}"][data-field="notes"]`);
            const completeInput = document.querySelector(`input.set-complete[data-idx="${idx}"][data-set="${i}"]`);

            sets.push({
                set: i,
                reps: repsInput?.value || null,
                weight: weightInput?.value ? parseFloat(weightInput.value) : null,
                notes: notesInput?.value || null,
                completed: completeInput?.checked || false
            });
        }
        result.push({ id: ex.id, name: ex.name, unit: ex.unit, sets });
    });

    return result;
}

function logWorkout() {
    const exercises = getExercisesForDay();
    if (exercises.length === 0) return;

    const workoutData = getWorkoutDataFromDOM();
    workoutHistory.unshift({
        id: Date.now(),
        date: new Date().toISOString(),
        day: currentDay,
        planName: `${currentDay} Workout`,
        exercises: workoutData
    });
    saveHistory();
    renderHistory();
    updateGameUI();
    updateWorkoutProgress();
    checkAchievements();
}

function renderHistory() {
    const container = document.getElementById('historyList');

    if (workoutHistory.length === 0) {
        container.innerHTML = '<p class="history-empty">No workouts logged yet.</p>';
        updateStats();
        return;
    }

    container.innerHTML = workoutHistory.slice(0, 20).map((entry, idx) => {
        const date = new Date(entry.date);
        const dateStr = date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        const summary = entry.exercises
            .filter(e => e.sets.some(s => s.reps || s.weight || s.notes))
            .map(e => e.name)
            .join(', ') || 'Logged';

        return `
            <div class="history-item clickable" data-id="${entry.id}">
                <div class="history-info">
                    <h3>${entry.planName || entry.day}</h3>
                    <p>${dateStr} — ${summary}</p>
                </div>
                <button class="delete-history-item" data-id="${entry.id}" title="Delete">×</button>
            </div>
        `;
    }).join('');

    container.querySelectorAll('.delete-history-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteHistoryItem(parseInt(btn.dataset.id));
        });
    });

    container.querySelectorAll('.history-item.clickable').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-history-item')) return;
            showWorkoutDetails(parseInt(item.dataset.id));
        });
    });

    updateStats();
}

function showWorkoutDetails(entryId) {
    const entry = workoutHistory.find(e => e.id === entryId);
    if (!entry) return;

    const date = new Date(entry.date);
    const dateStr = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    let exercisesHtml = entry.exercises.map(ex => {
        const unit = ex.unit || 'kg';
        const isBody = unit === 'body';
        const isCardio = unit === 'cardio';
        const isTime = unit === 'time';

        const setsHtml = (ex.sets || []).map(s => {
            let setInfo = '';
            if (isCardio) {
                setInfo = s.notes || s.reps || '-';
            } else if (isTime) {
                setInfo = s.reps || '-';
            } else if (isBody) {
                setInfo = s.reps ? `${s.reps} reps` : '-';
            } else {
                const reps = s.reps || '-';
                const weight = s.weight != null ? `${s.weight} kg` : '-';
                setInfo = `${reps} reps × ${weight}`;
            }
            if (s.notes && !isCardio) setInfo += ` <span class="detail-notes">(${s.notes})</span>`;
            return `<tr><td>Set ${s.set}</td><td>${setInfo}</td></tr>`;
        }).join('');

        return `
            <div class="detail-exercise">
                <h4 class="detail-exercise-name">${ex.name}</h4>
                <table class="detail-sets-table">
                    <thead><tr><th>Set</th><th>Reps / Weight</th></tr></thead>
                    <tbody>${setsHtml || '<tr><td colspan="2">No data</td></tr>'}</tbody>
                </table>
            </div>
        `;
    }).join('');

    document.getElementById('workoutDetailsTitle').textContent = `${entry.planName || entry.day} — ${dateStr}`;
    document.getElementById('workoutDetailsBody').innerHTML = exercisesHtml;
    document.getElementById('workoutDetailsModal').classList.remove('hidden');
}

function closeWorkoutDetails() {
    document.getElementById('workoutDetailsModal').classList.add('hidden');
}

function updateStats() {
    const el = document.getElementById('statWorkouts');
    if (el) el.textContent = `${workoutHistory.length} workout${workoutHistory.length !== 1 ? 's' : ''}`;
}

// Delete history - single item or clear all
let pendingDeleteAll = false;

function confirmClearHistory() {
    if (workoutHistory.length === 0) return;
    pendingDeleteAll = true;
    document.getElementById('confirmTitle').textContent = 'Clear all workout history?';
    document.getElementById('confirmMessage').textContent = `This will permanently delete ${workoutHistory.length} workout${workoutHistory.length !== 1 ? 's' : ''}. This cannot be undone.`;
    document.getElementById('confirmDelete').textContent = 'Clear All';
    document.getElementById('confirmModal').classList.remove('hidden');
}

function deleteHistoryItem(id) {
    stopRestTimer();
    workoutHistory = workoutHistory.filter(e => e.id !== id);
    saveHistory();
    renderHistory();
}

function handleConfirmDelete() {
    if (pendingDeleteAll) {
        stopRestTimer();
        workoutHistory = [];
        saveHistory();
        renderHistory();
    }
    closeConfirmModal();
    pendingDeleteAll = false;
}

function closeConfirmModal() {
    document.getElementById('confirmModal').classList.add('hidden');
    pendingDeleteAll = false;
}

// Close modals on outside click
document.getElementById('exerciseModal').addEventListener('click', (e) => {
    if (e.target.id === 'exerciseModal') closeExerciseModal();
});
document.getElementById('workoutDetailsModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'workoutDetailsModal') closeWorkoutDetails();
});
document.getElementById('confirmModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'confirmModal') closeConfirmModal();
});
