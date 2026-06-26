export const FUN_FACTS = [
  { fact: "The word 'salary' comes from 'salarium' — salt money paid to Roman soldiers. You're literally worth your weight in salt!", emoji: "🧂" },
  { fact: "Taking a 5-minute walk every hour can boost your productivity by up to 30%. Go stretch those legs!", emoji: "🚶" },
  { fact: "The 40-hour work week was established in 1940. Before that, factory workers put in up to 100 hours!", emoji: "⏰" },
  { fact: "The concept of 'weekends' only became standard in the 1930s. Saturdays were workdays too!", emoji: "📅" },
  { fact: "Standing desks were used by Leonardo da Vinci, Winston Churchill, and Ernest Hemingway. You're in good company!", emoji: "🧑‍🎨" },
  { fact: "The word 'deadline' originated from Civil War prison camps — a line prisoners couldn't cross without being shot!", emoji: "💀" },
  { fact: "Studies show workers who take regular breaks are MORE productive than those who don't. Permission to rest granted!", emoji: "☕" },
  { fact: "The 'Pomodoro Technique' — 25 minutes of work, 5-minute break — was invented using a tomato-shaped timer!", emoji: "🍅" },
  { fact: "The average office worker spends 50 minutes per day looking for lost files. Organise your workspace!", emoji: "📁" },
  { fact: "Laughing at work for 15 minutes burns up to 40 calories. That joke your colleague told? Cardio!", emoji: "😂" },
  { fact: "The word 'office' comes from Latin 'officium' meaning 'service' — you're here to serve!", emoji: "🏛️" },
  { fact: "Blue and green colours in the workplace boost creativity. Look out the window for a quick brain boost!", emoji: "🪟" },
  { fact: "The average human attention span is about 20 minutes. If you've been staring longer... break time!", emoji: "👁️" },
  { fact: "Working with plants nearby can increase productivity by 15%. Get yourself a desk plant!", emoji: "🪴" },
  { fact: "The concept of 'coffee breaks' was introduced in the early 1900s by coffee companies. Smart marketing!", emoji: "☕" },
  { fact: "Typing on a keyboard burns about 2.5 calories per minute. That email is practically a workout!", emoji: "⌨️" },
  { fact: "The term 'freelancer' referred to medieval mercenaries with a 'free lance' — not sworn to any lord!", emoji: "🗡️" },
  { fact: "Music without lyrics while working can improve focus by up to 20%. Time for some lo-fi beats!", emoji: "🎵" },
  { fact: "The word 'business' originally meant 'anxiety' or 'being busy' in Old English. Some things never change!", emoji: "😅" },
  { fact: "Drinking water every 2 hours can improve cognitive performance by up to 15%. Hydrate to dominate!", emoji: "💧" },
  { fact: "The shortest war in history lasted 38 minutes. Your stand-up meeting isn't that bad!", emoji: "⚔️" },
  { fact: "Looking at cute animal pictures can improve focus and attention to detail. Science says so!", emoji: "🐱" },
  { fact: "Taking a 10-20 minute nap can boost alertness and mood. Even NASA says so!", emoji: "😴" },
  { fact: "South Africa has 11 official languages — the most of any country in the world!", emoji: "🇿🇦" },
  { fact: "The first successful heart transplant was performed in Cape Town in 1967 by Dr Chris Barnard!", emoji: "❤️" },
  { fact: "South Africa is the only country to have hosted the Cricket, Rugby, and Soccer World Cups!", emoji: "🏆" },
  { fact: "Table Mountain in Cape Town is one of the New7Wonders of Nature!", emoji: "⛰️" },
  { fact: "South Africa has the longest wine route in the world — Route 62 stretches 850km!", emoji: "🍷" },
  { fact: "The word 'robot' comes from the Czech 'robota' meaning forced labour. Your computer is basically a slave!", emoji: "🤖" },
  { fact: "The QWERTY keyboard was designed to slow typists down — to prevent typewriter jams. We're still stuck with it!", emoji: "⌨️" },
];

export function getDailyFunFact(date = new Date()) {
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
  return FUN_FACTS[dayOfYear % FUN_FACTS.length];
}