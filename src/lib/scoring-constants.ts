// Scoring categories and point values for Bachelor Fantasy League

export interface ScoringCategory {
  id: string;
  name: string;
  points: number;
  description: string;
  category: 'positive' | 'negative';
  emoji: string;
  color: string;
}

export const SCORING_CATEGORIES: ScoringCategory[] = [
  // Positive scoring actions
  {
    id: 'kiss_mouth',
    name: 'Kiss on Mouth',
    points: 2,
    description: 'Kiss on mouth',
    category: 'positive',
    emoji: '💋',
    color: 'bg-pink-500 hover:bg-pink-600'
  },
  {
    id: 'rose_week',
    name: 'Rose This Week',
    points: 3, // Default, varies by episode
    description: 'Receive rose this week',
    category: 'positive',
    emoji: '🌹',
    color: 'bg-red-500 hover:bg-red-600'
  },
  {
    id: 'rose_one_on_one',
    name: '1-on-1 Rose',
    points: 2,
    description: 'Receive rose on 1-on-1 date',
    category: 'positive',
    emoji: '🌹',
    color: 'bg-red-400 hover:bg-red-500'
  },
  {
    id: 'rose_group_date',
    name: 'Group Date Rose',
    points: 2,
    description: 'Receive group date rose',
    category: 'positive',
    emoji: '🌹',
    color: 'bg-red-400 hover:bg-red-500'
  },
  {
    id: 'interrupt_time',
    name: 'Interrupt Time',
    points: 1,
    description: 'Interrupt 1-on-1 time',
    category: 'positive',
    emoji: '✋',
    color: 'bg-orange-500 hover:bg-orange-600'
  },
  {
    id: 'group_challenge_win',
    name: 'Challenge Win',
    points: 2,
    description: 'Winning group date challenge',
    category: 'positive',
    emoji: '🏆',
    color: 'bg-yellow-500 hover:bg-yellow-600'
  },
  {
    id: 'wavelength_moment',
    name: 'Wavelength Moment',
    points: 1,
    description: 'Wavelength moment',
    category: 'positive',
    emoji: '⚡',
    color: 'bg-purple-500 hover:bg-purple-600'
  },
  {
    id: 'right_reasons',
    name: 'Right Reasons',
    points: 1,
    description: 'Says "right reasons"',
    category: 'positive',
    emoji: '✅',
    color: 'bg-green-500 hover:bg-green-600'
  },
  {
    id: 'journey',
    name: 'Journey',
    points: 1,
    description: 'Says "journey"',
    category: 'positive',
    emoji: '🛤️',
    color: 'bg-blue-500 hover:bg-blue-600'
  },
  {
    id: 'connection',
    name: 'Connection',
    points: 1,
    description: 'Says "connection"',
    category: 'positive',
    emoji: '🔗',
    color: 'bg-indigo-500 hover:bg-indigo-600'
  },
  {
    id: 'girls_girl',
    name: 'Girls Girl',
    points: 1,
    description: 'Says "girls girl"',
    category: 'positive',
    emoji: '👭',
    color: 'bg-pink-400 hover:bg-pink-500'
  },
  {
    id: 'nudity_black_box',
    name: 'Nudity/Black Box',
    points: 2,
    description: 'Nudity/black box per outfit',
    category: 'positive',
    emoji: '📦',
    color: 'bg-gray-600 hover:bg-gray-700'
  },
  {
    id: 'fantasy_suite',
    name: 'Fantasy Suite',
    points: 4,
    description: 'Sex in fantasy suite or before',
    category: 'positive',
    emoji: '🏩',
    color: 'bg-red-600 hover:bg-red-700'
  },
  {
    id: 'falling_for_you',
    name: 'Falling For You',
    points: 2,
    description: 'Says "falling for you"',
    category: 'positive',
    emoji: '💕',
    color: 'bg-pink-600 hover:bg-pink-700'
  },
  {
    id: 'i_love_you',
    name: 'I Love You',
    points: 4,
    description: 'Says "I Love You"',
    category: 'positive',
    emoji: '❤️',
    color: 'bg-red-700 hover:bg-red-800'
  },
  {
    id: 'sparkles',
    name: 'Sparkles',
    points: 1,
    description: 'Sparkles in any form',
    category: 'positive',
    emoji: '✨',
    color: 'bg-yellow-400 hover:bg-yellow-500'
  },
  
  // Negative scoring actions
  {
    id: 'crying',
    name: 'Crying',
    points: -1,
    description: 'Crying per scene',
    category: 'negative',
    emoji: '😭',
    color: 'bg-blue-600 hover:bg-blue-700'
  },
  {
    id: 'medical_attention',
    name: 'Medical Attention',
    points: -1,
    description: 'Requiring medical attention',
    category: 'negative',
    emoji: '🏥',
    color: 'bg-red-500 hover:bg-red-600'
  },
  {
    id: 'vomiting',
    name: 'Vomiting',
    points: -2,
    description: 'Vomiting',
    category: 'negative',
    emoji: '🤮',
    color: 'bg-green-600 hover:bg-green-700'
  },
  {
    id: 'physical_altercation',
    name: 'Physical Fight',
    points: -3,
    description: 'Initiating physical altercation',
    category: 'negative',
    emoji: '👊',
    color: 'bg-red-700 hover:bg-red-800'
  },
  {
    id: 'significant_other',
    name: 'Has Significant Other',
    points: -5,
    description: 'Having significant other while on show',
    category: 'negative',
    emoji: '💔',
    color: 'bg-gray-800 hover:bg-gray-900'
  }
];

export const POSITIVE_CATEGORIES = SCORING_CATEGORIES.filter(cat => cat.category === 'positive');
export const NEGATIVE_CATEGORIES = SCORING_CATEGORIES.filter(cat => cat.category === 'negative');

export const getScoringCategoryById = (id: string): ScoringCategory | undefined => {
  return SCORING_CATEGORIES.find(cat => cat.id === id);
};

export const getScoringCategoryByName = (name: string): ScoringCategory | undefined => {
  return SCORING_CATEGORIES.find(cat => cat.name.toLowerCase() === name.toLowerCase());
};