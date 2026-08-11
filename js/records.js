function bestTimeKey(table, order) {
  return 'mult-best-' + table + '-' + order;
}

function getBestTime(table, order) {
  try {
    var raw = localStorage.getItem(bestTimeKey(table, order));
    return raw === null ? null : Number(raw);
  } catch (e) {
    return null;
  }
}

function setBestTimeIfBetter(table, order, ms) {
  try {
    localStorage.setItem(bestTimeKey(table, order), String(ms));
  } catch (e) {
    // 저장소 사용 불가 시 조용히 무시
  }
}

function isTablePassed(table) {
  var seq = getBestTime(table, 'sequential');
  var random = getBestTime(table, 'random');
  return seq !== null && seq <= PASS_MS_SEQUENTIAL && random !== null && random <= PASS_MS_RANDOM;
}

function getVerifyMode() {
  try {
    return localStorage.getItem('mult-verify-mode') === '1';
  } catch (e) {
    return false;
  }
}

function setVerifyMode(enabled) {
  try {
    localStorage.setItem('mult-verify-mode', enabled ? '1' : '0');
  } catch (e) {
    // 저장소 사용 불가 시 조용히 무시
  }
}

function saveLastWrongList(table, order, wrongList) {
  try {
    localStorage.setItem('mult-last-wrong-' + table + '-' + order, JSON.stringify(wrongList));
  } catch (e) {
    // 저장소 사용 불가 시 조용히 무시
  }
}

function resetAllRecords() {
  try {
    TABLES.concat(['master']).forEach(function (table) {
      ORDERS.forEach(function (order) {
        localStorage.removeItem(bestTimeKey(String(table), order));
        localStorage.removeItem('mult-last-wrong-' + table + '-' + order);
      });
    });
  } catch (e) {
    // 저장소 사용 불가 시 조용히 무시
  }
}

function formatMs(ms) {
  return (ms / 1000).toFixed(1) + '초';
}
