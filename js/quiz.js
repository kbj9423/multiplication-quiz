function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function shuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

function generateQuestions(table, order) {
  var questions = [];
  if (table === 'master') {
    for (var i = 0; i < QUESTIONS_PER_ROUND; i++) {
      questions.push({
        a: randomInt(TABLE_MIN, TABLE_MAX),
        b: randomInt(MULTIPLIER_MIN, MULTIPLIER_MAX)
      });
    }
    return questions;
  }

  var multipliers = [];
  for (var m = MULTIPLIER_MIN; m <= MULTIPLIER_MAX; m++) {
    multipliers.push(m);
  }
  if (order === 'reverse') {
    multipliers.reverse();
  } else if (order === 'random') {
    multipliers = shuffle(multipliers);
  }

  var tableNum = Number(table);
  multipliers.forEach(function (b) {
    questions.push({ a: tableNum, b: b });
  });
  return questions;
}
