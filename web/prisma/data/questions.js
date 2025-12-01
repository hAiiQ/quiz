const CATEGORIES = [
  "KENNZEICHEN",
  "STIMMEN",
  "YT TITEL",
  "WER ODER WAS",
  "ABKÜRZUNGEN",
  "ESSEN & TRINKEN",
];

const ROUND_VALUES = [
  [100, 200, 300, 500],
  [200, 400, 600, 1000],
];

const questionSeed = [];

CATEGORIES.forEach((category, categoryIndex) => {
  ROUND_VALUES.forEach((values, roundIndex) => {
    values.forEach((value, rowIndex) => {
      questionSeed.push({
        category,
        categoryIndex,
        roundIndex,
        baseValue: value,
        prompt: `${category}: Frage für ${value} Punkte (Reihe ${rowIndex + 1}, Runde ${roundIndex + 1}).`,
        answer: `${category} Antwort ${rowIndex + 1}`,
      });
    });
  });
});

module.exports = {
  questionSeed,
};
