// Exercise Library — All exercises available for user to add
// User selects day, adds exercises, then sets their own sets/reps/weight
// unit: 'kg' | 'body' | 'time' | 'cardio'

const EXERCISE_LIBRARY = [
    // Chest
    { id: 'incline-db-press', name: 'Incline Dumbbell Press', category: 'Chest', unit: 'kg' },
    { id: 'flat-bench', name: 'Flat Bench Press', category: 'Chest', unit: 'kg' },
    { id: 'cable-lower-fly', name: 'Cable Lower Fly', category: 'Chest', unit: 'kg' },
    { id: 'pec-dec-fly', name: 'Pec Dec Fly', category: 'Chest', unit: 'kg' },
    // Triceps
    { id: 'rope-pushdown', name: 'Rope Pushdown', category: 'Triceps', unit: 'kg' },
    { id: 'overhead-extension', name: 'Overhead Extension', category: 'Triceps', unit: 'kg' },
    { id: 'bench-dips', name: 'Bench Dips', category: 'Triceps', unit: 'body' },
    // Back
    { id: 'bent-over-row', name: 'Bent-Over Barbell Row', category: 'Back', unit: 'kg' },
    { id: 'lat-pulldown', name: 'Lat Pulldown', category: 'Back', unit: 'kg' },
    { id: 'seated-cable-row', name: 'Seated Cable Row', category: 'Back', unit: 'kg' },
    { id: 'cable-pullover', name: 'Cable Pullover', category: 'Back', unit: 'kg' },
    // Biceps
    { id: 'barbell-curl', name: 'Barbell Curl', category: 'Biceps', unit: 'kg' },
    { id: 'incline-db-curl', name: 'Incline Dumbbell Curl', category: 'Biceps', unit: 'kg' },
    { id: 'sideways-hammer-curl', name: 'Sideways Hammer Curl', category: 'Biceps', unit: 'kg' },
    // Legs
    { id: 'walking-lunges', name: 'Walking Lunges', category: 'Legs', unit: 'kg' },
    { id: 'barbell-squats', name: 'Barbell Squats', category: 'Legs', unit: 'kg' },
    { id: 'leg-extension', name: 'Leg Extension', category: 'Legs', unit: 'kg' },
    { id: 'leg-curl', name: 'Leg Curl', category: 'Legs', unit: 'kg' },
    { id: 'leg-press', name: 'Leg Press', category: 'Legs', unit: 'kg' },
    { id: 'romanian-deadlift', name: 'Romanian Deadlift', category: 'Legs', unit: 'kg' },
    { id: 'calf-raises', name: 'Standing Calf Raises', category: 'Legs', unit: 'kg' },
    // Shoulders
    { id: 'overhead-shoulder-press', name: 'Overhead Shoulder Press', category: 'Shoulders', unit: 'kg' },
    { id: 'lateral-raises', name: 'Lateral Raises', category: 'Shoulders', unit: 'kg' },
    { id: 'plate-front-raise', name: 'Plate Front Raise', category: 'Shoulders', unit: 'kg' },
    { id: 'face-pulls', name: 'Face Pulls', category: 'Shoulders', unit: 'kg' },
    // Forearms
    { id: 'cable-wrist-curls', name: 'Cable Wrist Curls', category: 'Forearms', unit: 'kg' },
    { id: 'cable-reverse-curl', name: 'Cable Reverse Curl', category: 'Forearms', unit: 'kg' },
    // Abs
    { id: 'plank', name: 'Plank', category: 'Abs', unit: 'time' },
    { id: 'russian-twists', name: 'Russian Twists', category: 'Abs', unit: 'body' },
    { id: 'crunches', name: 'Crunches', category: 'Abs', unit: 'body' },
    { id: 'leg-raises', name: 'Leg Raises', category: 'Abs', unit: 'body' },
    // Cardio
    { id: 'incline-walking', name: 'Incline Walking', category: 'Cardio', unit: 'cardio' },
    { id: 'cycling', name: 'Cycling', category: 'Cardio', unit: 'cardio' },
    { id: 'treadmill', name: 'Treadmill', category: 'Cardio', unit: 'cardio' },
    { id: 'rowing', name: 'Rowing Machine', category: 'Cardio', unit: 'cardio' }
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Game config
const XP_PER_SET = 10;
const XP_PER_LEVEL = 100;

const ACHIEVEMENTS = [
    { id: 'first_rep', name: 'First Rep', desc: 'Complete your first set', icon: '🎯', require: { sets: 1 } },
    { id: 'getting_started', name: 'Getting Started', desc: 'Complete 10 sets', icon: '💪', require: { sets: 10 } },
    { id: 'on_fire', name: 'On Fire', desc: 'Complete 50 sets', icon: '🔥', require: { sets: 50 } },
    { id: 'century', name: 'Century', desc: 'Complete 100 sets', icon: '💯', require: { sets: 100 } },
    { id: 'five_hundred', name: 'Iron Will', desc: 'Complete 500 sets', icon: '⚙️', require: { sets: 500 } },
    { id: 'week_warrior', name: 'Week Warrior', desc: '7 day workout streak', icon: '📅', require: { streak: 7 } },
    { id: 'dedicated', name: 'Dedicated', desc: 'Log 10 workouts', icon: '⭐', require: { workouts: 10 } },
    { id: 'beast_mode', name: 'Beast Mode', desc: 'Log 25 workouts', icon: '🦁', require: { workouts: 25 } },
    { id: 'legend', name: 'Legend', desc: 'Log 50 workouts', icon: '👑', require: { workouts: 50 } }
];
