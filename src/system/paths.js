// src/system/paths.js
// 8 paths — each is a complete character identity

export const PATHS = {
  shadow: {
    id: 'shadow',
    name: 'Shadow Monarch',
    char: 'Sung Jin-woo',
    series: 'Solo Leveling',
    signature: 'ARISE.',
    color: '#4f6ef7',
    color2: '#8496ff',
    glow: 'rgba(79,110,247,0.12)',
    // Sidebar labels
    nav: {
      dashboard: 'Command Center',
      schedule:  'System Quests',
      analytics: 'Shadow Archive',
      exams:     'Dungeons',
      skills:    'Abilities',
      timetable: 'Raid Calendar',
      chat:      'System AI',
      notifications: 'System Alerts',
    },
    // Stat labels
    stats: {
      xp:     'Shadow Energy',
      streak: 'Consecutive Raids',
      done:   'Dungeons Cleared',
      ghosts: 'Shadow Losses',
    },
    rank_labels: ['Shadow Fledgling','Shadow Hunter','Shadow Commander','Shadow Monarch','Monarch of Shadows','The Absolute Being'],
    welcome: 'The system is online. Begin.',
  },
  vegeta: {
    id: 'vegeta',
    name: 'Ultra Ego',
    char: 'Vegeta',
    series: 'Dragon Ball Super',
    signature: 'GALICK GUN.',
    color: '#bf5af2',
    color2: '#d48cff',
    glow: 'rgba(191,90,242,0.12)',
    nav: {
      dashboard: 'Power Level',
      schedule:  'Training Regimen',
      analytics: 'Combat Records',
      exams:     'Battle Targets',
      skills:    'Techniques',
      timetable: 'Training Schedule',
      chat:      'Scouter AI',
      notifications: 'Combat Alerts',
    },
    stats: {
      xp:     'Power Level',
      streak: 'Consecutive Days',
      done:   'Battles Won',
      ghosts: 'Dishonors',
    },
    rank_labels: ['Third-Class Warrior','Elite Warrior','Super Saiyan','Super Saiyan 2','Super Saiyan God','Ultra Ego'],
    welcome: 'Power level check. Begin training.',
  },
  goku: {
    id: 'goku',
    name: 'Ultra Instinct',
    char: 'Goku',
    series: 'Dragon Ball Super',
    signature: 'MASTERED.',
    color: '#c8c8dc',
    color2: '#e0e0f0',
    glow: 'rgba(200,200,220,0.08)',
    nav: {
      dashboard: 'Ki Center',
      schedule:  'Training Sessions',
      analytics: 'Progress Log',
      exams:     'Challenges',
      skills:    'Techniques',
      timetable: 'Training Calendar',
      chat:      'Instinct AI',
      notifications: 'Alerts',
    },
    stats: {
      xp:     'Ki Mastery',
      streak: 'Training Days',
      done:   'Sessions Complete',
      ghosts: 'Distractions',
    },
    rank_labels: ['Novice','Student','Fighter','Warrior','Master','Ultra Instinct'],
    welcome: 'Empty the mind. Let the training begin.',
  },
  luffy: {
    id: 'luffy',
    name: 'Gear 5',
    char: 'Monkey D. Luffy',
    series: 'One Piece',
    signature: 'GOMU GOMU!',
    color: '#ffd60a',
    color2: '#ffe44d',
    glow: 'rgba(255,214,10,0.1)',
    nav: {
      dashboard: 'Ship Deck',
      schedule:  'Today\'s Voyage',
      analytics: 'Captain\'s Log',
      exams:     'Islands Ahead',
      skills:    'Devil Fruit',
      timetable: 'Navigation',
      chat:      'Den Den Mushi',
      notifications: 'Crew Alerts',
    },
    stats: {
      xp:     'Haki Points',
      streak: 'Adventure Days',
      done:   'Islands Cleared',
      ghosts: 'Retreats',
    },
    rank_labels: ['East Blue Rookie','Paradise Explorer','New World Sailor','Yonko\'s Rival','Pirate King Candidate','King of Pirates'],
    welcome: 'Alright! New day, new adventure!',
  },
  gohan: {
    id: 'gohan',
    name: 'Beast Mode',
    char: 'Son Gohan',
    series: 'Dragon Ball Super',
    signature: 'LIMIT BROKEN.',
    color: '#30d158',
    color2: '#52e47a',
    glow: 'rgba(48,209,88,0.1)',
    nav: {
      dashboard: 'Potential',
      schedule:  'Training Quests',
      analytics: 'Power Records',
      exams:     'Opponents',
      skills:    'Latent Skills',
      timetable: 'Study Schedule',
      chat:      'AI Advisor',
      notifications: 'Alerts',
    },
    stats: {
      xp:     'Latent Power',
      streak: 'Study Days',
      done:   'Topics Mastered',
      ghosts: 'Wasted Potential',
    },
    rank_labels: ['Sleeping Giant','Awakening','Unleashed','Beast Instinct','Full Power','BEAST'],
    welcome: 'The potential is there. Unlock it.',
  },
  saitama: {
    id: 'saitama',
    name: 'One Punch',
    char: 'Saitama',
    series: 'One Punch Man',
    signature: 'OK.',
    color: '#ffc800',
    color2: '#ffd740',
    glow: 'rgba(255,200,0,0.08)',
    nav: {
      dashboard: 'Training Log',
      schedule:  'Today\'s Routine',
      analytics: 'Stats',
      exams:     'Opponents',
      skills:    'Training',
      timetable: 'Schedule',
      chat:      'Hero AI',
      notifications: 'Alerts',
    },
    stats: {
      xp:     'Training Points',
      streak: 'Days in Routine',
      done:   'Routines Done',
      ghosts: 'Skipped',
    },
    rank_labels: ['C-Class Hero','B-Class Hero','A-Class Hero','S-Class Hero','Overpowered','One Punch'],
    welcome: 'Start.',
  },
  allmight: {
    id: 'allmight',
    name: 'Plus Ultra',
    char: 'All Might',
    series: 'My Hero Academia',
    signature: 'SMASH!!!',
    color: '#1e78ff',
    color2: '#5b9cff',
    glow: 'rgba(30,120,255,0.1)',
    nav: {
      dashboard: 'Hero HQ',
      schedule:  'Hero Missions',
      analytics: 'Hero Records',
      exams:     'Villains',
      skills:    'Quirks',
      timetable: 'Mission Calendar',
      chat:      'Hero AI',
      notifications: 'Emergency Alerts',
    },
    stats: {
      xp:     'Plus Ultra Points',
      streak: 'Hero Days',
      done:   'Missions Complete',
      ghosts: 'Retreats',
    },
    rank_labels: ['Sidekick','Pro Hero','Class 1-A','Top 10','No. 1 Hero','Symbol of Peace'],
    welcome: 'I AM HERE! Let\'s begin!',
  },
  levi: {
    id: 'levi',
    name: 'Humanity\'s Finest',
    char: 'Levi Ackerman',
    series: 'Attack on Titan',
    signature: 'DEDICATE YOUR HEART.',
    color: '#a0aabe',
    color2: '#c0cde0',
    glow: 'rgba(160,170,190,0.06)',
    nav: {
      dashboard: 'Command Post',
      schedule:  'Operations',
      analytics: 'Combat Log',
      exams:     'Titans',
      skills:    'ODM Gear',
      timetable: 'Duty Roster',
      chat:      'Comms AI',
      notifications: 'Dispatches',
    },
    stats: {
      xp:     'Combat Experience',
      streak: 'Days Active',
      done:   'Titans Cleared',
      ghosts: 'Failures',
    },
    rank_labels: ['Recruit','Trainee','Soldier','Squad Leader','Captain','Humanity\'s Strongest'],
    welcome: 'Dedicate your heart. Begin.',
  },
};

export function getPath(id) {
  return PATHS[id] || PATHS.shadow;
}

export function getCurrentPath() {
  return getPath(localStorage.getItem('studyos_path') || 'shadow');
}

export const RANK_THRESHOLDS = [0, 500, 1500, 3500, 7000, 12000, 20000];
export const RANK_LETTERS    = ['E','D','C','B','A','S','S+'];

export function calcRank(xp) {
  let r = 0;
  for (let i = 0; i < RANK_THRESHOLDS.length; i++) {
    if (xp >= RANK_THRESHOLDS[i]) r = i;
  }
  const next = RANK_THRESHOLDS[r + 1] || RANK_THRESHOLDS[r] * 1.5;
  const prev = RANK_THRESHOLDS[r];
  return {
    letter: RANK_LETTERS[r],
    index:  r,
    xp,
    xpNext: next,
    xpPrev: prev,
    pct:    Math.min(100, ((xp - prev) / (next - prev)) * 100),
  };
}
