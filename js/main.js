(function () {
  var startScreen = document.getElementById('start-screen');
  var quizScreen = document.getElementById('quiz-screen');
  var resultsScreen = document.getElementById('results-screen');
  var commentsScreen = document.getElementById('comments-screen');

  var tableGrid = document.getElementById('table-grid');
  var orderGrid = document.getElementById('order-grid');
  var orderNote = document.getElementById('order-note');
  var modeGrid = document.getElementById('mode-grid');
  var startBtn = document.getElementById('start-btn');
  var recordsTbody = document.getElementById('records-tbody');
  var verifyCheckbox = document.getElementById('verify-mode-checkbox');

  var quizQuestionEl = document.getElementById('quiz-question');
  var answerInput = document.getElementById('answer-input');
  var answerDisplay = document.getElementById('answer-display');
  var answerKeypad = document.getElementById('answer-keypad');
  var voiceWaveEl = document.getElementById('voice-wave');

  var resultTimeEl = document.getElementById('result-time');
  var resultScoreEl = document.getElementById('result-score');
  var resultPassEl = document.getElementById('result-pass');
  var parentNoteEl = document.getElementById('parent-note');
  var resultsDetailTbody = document.getElementById('results-detail-tbody');
  var homeBtn = document.getElementById('home-btn');

  var verifyOverlay = document.getElementById('verify-overlay');
  var codeDisplay = document.getElementById('code-display');
  var keypad = document.getElementById('keypad');

  var appTitle = document.getElementById('app-title');
  var resetConfirmOverlay = document.getElementById('reset-confirm-overlay');
  var resetConfirmMessage = document.getElementById('reset-confirm-message');
  var resetCancelBtn = document.getElementById('reset-cancel-btn');
  var resetConfirmBtn = document.getElementById('reset-confirm-btn');

  var commentsBtn = document.getElementById('comments-btn');
  var commentsBadge = document.getElementById('comments-badge');
  var commentsListEl = document.getElementById('comments-list');
  var commentStatusEl = document.getElementById('comment-status');
  var commentInputEl = document.getElementById('comment-input');
  var commentSendBtn = document.getElementById('comment-send-btn');
  var commentsBackBtn = document.getElementById('comments-back-btn');
  var nicknameOverlay = document.getElementById('nickname-overlay');
  var nicknameInput = document.getElementById('nickname-input');
  var nicknameCancelBtn = document.getElementById('nickname-cancel-btn');
  var nicknameConfirmBtn = document.getElementById('nickname-confirm-btn');
  var nicknameStatus = document.getElementById('nickname-status');

  var pinnedCommentsEl = document.getElementById('pinned-comments');
  var adminLoginLink = document.getElementById('admin-login-link');
  var adminStatusEl = document.getElementById('admin-status');
  var adminLogoutBtn = document.getElementById('admin-logout-btn');
  var adminLoginOverlay = document.getElementById('admin-login-overlay');
  var adminEmailInput = document.getElementById('admin-email-input');
  var adminPasswordInput = document.getElementById('admin-password-input');
  var adminLoginStatus = document.getElementById('admin-login-status');
  var adminLoginCancelBtn = document.getElementById('admin-login-cancel-btn');
  var adminLoginConfirmBtn = document.getElementById('admin-login-confirm-btn');

  var selectedTable = null;
  var selectedOrder = null;
  var orderForcedByMaster = false;
  var orderTouchedByUser = false;
  var userChosenOrder = null;

  var session = null;
  var enteredCode = '';
  var enteredAnswer = '';
  var answerMode = 'text';
  var speechTimeoutId = null;

  var titleClickCount = 0;
  var resetConfirmStep = 0;

  function showScreen(screen) {
    [startScreen, quizScreen, resultsScreen, commentsScreen].forEach(function (s) {
      s.classList.toggle('hidden', s !== screen);
    });
    commentsBtn.classList.toggle('hidden', screen !== startScreen);
  }

  function updateAppHeight() {
    document.documentElement.style.setProperty('--app-height', window.innerHeight + 'px');
  }
  updateAppHeight();
  window.addEventListener('resize', updateAppHeight);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', updateAppHeight);
  }

  function renderRecordsTable() {
    recordsTbody.innerHTML = '';

    TABLES.forEach(function (table) {
      var tr = document.createElement('tr');
      var thTable = document.createElement('th');
      thTable.textContent = table + '단';
      tr.appendChild(thTable);

      ORDERS.forEach(function (order) {
        var td = document.createElement('td');
        var best = getBestTime(String(table), order);
        if (best === null) {
          td.textContent = '-';
          td.className = 'record-na';
        } else {
          td.textContent = formatMs(best);
          if (order === 'sequential' && best <= PASS_MS_SEQUENTIAL) {
            td.className = 'record-passed';
          } else if (order === 'random' && best <= PASS_MS_RANDOM) {
            td.className = 'record-passed';
          }
        }
        tr.appendChild(td);
      });
      recordsTbody.appendChild(tr);
    });

    var masterTr = document.createElement('tr');
    var thMaster = document.createElement('th');
    thMaster.textContent = '랜덤';
    masterTr.appendChild(thMaster);
    ORDERS.forEach(function (order) {
      var td = document.createElement('td');
      if (order === 'random') {
        var best = getBestTime('master', 'random');
        if (best === null) {
          td.textContent = '-';
          td.className = 'record-na';
        } else {
          td.textContent = formatMs(best);
        }
      } else {
        td.textContent = '-';
        td.className = 'record-na';
      }
      masterTr.appendChild(td);
    });
    recordsTbody.appendChild(masterTr);
  }

  function renderTablePassState() {
    var buttons = tableGrid.querySelectorAll('.option-btn');
    buttons.forEach(function (btn) {
      var table = btn.getAttribute('data-table');
      if (table !== 'master' && isTablePassed(table)) {
        btn.classList.add('passed');
      } else {
        btn.classList.remove('passed');
      }
    });
  }

  function updateStartButtonState() {
    startBtn.disabled = !(selectedTable && selectedOrder);
  }

  function selectTable(table) {
    selectedTable = table;
    tableGrid.querySelectorAll('.option-btn').forEach(function (btn) {
      btn.classList.toggle('selected', btn.getAttribute('data-table') === table);
    });

    var orderButtons = orderGrid.querySelectorAll('.option-btn');
    if (table === 'master') {
      selectedOrder = 'random';
      orderForcedByMaster = true;
      orderButtons.forEach(function (btn) {
        var isRandom = btn.getAttribute('data-order') === 'random';
        btn.classList.toggle('selected', isRandom);
        btn.classList.toggle('disabled', !isRandom);
      });
      orderNote.classList.remove('hidden');
    } else {
      if (orderForcedByMaster) {
        orderForcedByMaster = false;
      }
      selectedOrder = orderTouchedByUser ? userChosenOrder : 'sequential';
      orderButtons.forEach(function (btn) {
        btn.classList.toggle('selected', btn.getAttribute('data-order') === selectedOrder);
        btn.classList.remove('disabled');
      });
      orderNote.classList.add('hidden');
    }
    updateStartButtonState();
  }

  function selectOrder(order) {
    if (selectedTable === 'master') return;
    selectedOrder = order;
    orderTouchedByUser = true;
    userChosenOrder = order;
    orderGrid.querySelectorAll('.option-btn').forEach(function (btn) {
      btn.classList.toggle('selected', btn.getAttribute('data-order') === order);
    });
    updateStartButtonState();
  }

  function selectMode(mode) {
    answerMode = mode;
    modeGrid.querySelectorAll('.option-btn').forEach(function (btn) {
      btn.classList.toggle('selected', btn.getAttribute('data-mode') === mode);
    });
  }

  tableGrid.addEventListener('click', function (e) {
    var btn = e.target.closest('.option-btn');
    if (!btn) return;
    selectTable(btn.getAttribute('data-table'));
  });

  orderGrid.addEventListener('click', function (e) {
    var btn = e.target.closest('.option-btn');
    if (!btn || btn.classList.contains('disabled')) return;
    selectOrder(btn.getAttribute('data-order'));
  });

  modeGrid.addEventListener('click', function (e) {
    var btn = e.target.closest('.option-btn');
    if (!btn) return;
    selectMode(btn.getAttribute('data-mode'));
  });

  verifyCheckbox.checked = getVerifyMode();
  verifyCheckbox.addEventListener('change', function () {
    setVerifyMode(verifyCheckbox.checked);
  });

  startBtn.addEventListener('click', function () {
    if (!selectedTable || !selectedOrder) return;
    startRound(selectedTable, selectedOrder);
  });

  function startRound(table, order) {
    session = {
      table: table,
      order: order,
      questions: generateQuestions(table, order),
      index: 0,
      totalMs: 0,
      correct: 0,
      wrong: 0,
      wrongList: [],
      log: [],
      questionStartTime: 0
    };
    showScreen(quizScreen);
    showQuestion();
  }

  function showQuestion() {
    var q = session.questions[session.index];
    quizQuestionEl.textContent = q.a + ' × ' + q.b + ' =';
    quizQuestionEl.classList.remove('replay-ready');
    answerDisplay.classList.remove('correct', 'wrong');
    answerDisplay.textContent = '';
    enteredAnswer = '';
    voiceWaveEl.classList.add('hidden');
    clearTimeout(speechTimeoutId);
    stopDigitAudio();
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    answerInput.classList.remove('hidden');
    session.questionStartTime = performance.now();

    if (answerMode === 'voice-auto' || answerMode === 'voice-button') {
      quizQuestionEl.textContent = '🔊';
      quizQuestionEl.classList.add('replay-ready');
      if (answerMode === 'voice-auto') {
        speakQuestion(q);
      }
    }
  }

  var selectedVoice = null;

  function pickKoreanFemaleVoice() {
    if (!window.speechSynthesis) return null;
    var voices = window.speechSynthesis.getVoices();
    var koreanVoices = voices.filter(function (v) {
      return v.lang && v.lang.toLowerCase().indexOf('ko') === 0;
    });
    if (koreanVoices.length === 0) return null;

    var femalePattern = /female|여성|여자|woman|yuna|heami/i;
    var femaleVoice = koreanVoices.filter(function (v) {
      return femalePattern.test(v.name);
    })[0];

    return femaleVoice || koreanVoices[0];
  }

  if (window.speechSynthesis) {
    selectedVoice = pickKoreanFemaleVoice();
    window.speechSynthesis.onvoiceschanged = function () {
      selectedVoice = pickKoreanFemaleVoice();
    };
  }

  var currentDigitAudio = null;
  var digitGapTimeoutId = null;

  var digitAudioCache = {};
  Object.keys(VOICE_DIGIT_SOUNDS).forEach(function (digit) {
    var audio = new Audio(VOICE_DIGIT_SOUNDS[digit]);
    audio.preload = 'auto';
    audio.load();
    digitAudioCache[digit] = audio;
  });

  function stopDigitAudio() {
    clearTimeout(digitGapTimeoutId);
    if (currentDigitAudio) {
      currentDigitAudio.pause();
      currentDigitAudio = null;
    }
  }

  function playRecordedDigit(digit, onEnd) {
    var audio = digitAudioCache[digit];
    audio.currentTime = 0;
    currentDigitAudio = audio;
    audio.onended = onEnd;
    audio.onerror = onEnd;
    var playPromise = audio.play();
    if (playPromise && playPromise.catch) {
      playPromise.catch(function () {});
    }
  }

  function speakDigit(digit, onEnd) {
    if (!window.speechSynthesis) {
      onEnd();
      return;
    }
    var utterance = new SpeechSynthesisUtterance(SINO_KOREAN_DIGITS[digit] + ',');
    utterance.lang = 'ko-KR';
    utterance.rate = SPEECH_RATE;
    utterance.volume = 1;
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
    window.speechSynthesis.speak(utterance);
  }

  function playDigit(digit, onEnd) {
    if (VOICE_DIGIT_SOUNDS[digit]) {
      playRecordedDigit(digit, onEnd);
    } else {
      speakDigit(digit, onEnd);
    }
  }

  function speakQuestion(q) {
    voiceWaveEl.classList.remove('hidden');
    clearTimeout(speechTimeoutId);
    stopDigitAudio();

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    playDigit(q.a, function () {
      digitGapTimeoutId = setTimeout(function () {
        playDigit(q.b, function () {});
      }, SPEECH_GAP_MS);
    });

    speechTimeoutId = setTimeout(function () {
      voiceWaveEl.classList.add('hidden');
    }, SPEECH_WAVE_DURATION_MS);
  }

  quizQuestionEl.addEventListener('click', function () {
    if (!quizQuestionEl.classList.contains('replay-ready')) return;
    if (!session) return;
    speakQuestion(session.questions[session.index]);
  });

  answerKeypad.addEventListener('click', function (e) {
    var digitBtn = e.target.closest('[data-digit]');
    if (digitBtn) {
      if (enteredAnswer.length < ANSWER_MAX_DIGITS) {
        enteredAnswer += digitBtn.getAttribute('data-digit');
        answerDisplay.textContent = enteredAnswer;
        var q = session.questions[session.index];
        if (Number(enteredAnswer) === q.a * q.b) {
          submitAnswer();
        }
      }
      return;
    }
    if (e.target.closest('#answer-clear')) {
      enteredAnswer = '';
      answerDisplay.textContent = '';
      return;
    }
    if (e.target.closest('#answer-confirm')) {
      submitAnswer();
    }
  });

  function submitAnswer() {
    if (enteredAnswer === '') return;

    var elapsed = performance.now() - session.questionStartTime;
    session.totalMs += elapsed;

    var q = session.questions[session.index];
    var isCorrect = Number(enteredAnswer) === q.a * q.b;
    session.log[session.index] = { a: q.a, b: q.b, elapsedMs: elapsed, correct: isCorrect };

    voiceWaveEl.classList.add('hidden');
    quizQuestionEl.textContent = q.a + ' × ' + q.b + ' =';
    quizQuestionEl.classList.remove('replay-ready');
    answerDisplay.classList.add(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      session.correct++;
    } else {
      session.wrong++;
      session.wrongList.push({ a: q.a, b: q.b });
    }

    setTimeout(function () {
      session.index++;
      if (session.index < session.questions.length) {
        showQuestion();
      } else {
        finishRound();
      }
    }, isCorrect ? FEEDBACK_MS_CORRECT : FEEDBACK_MS_WRONG);
  }

  function finishRound() {
    var table = session.table;
    var order = session.order;
    var totalMs = session.totalMs;

    setBestTimeIfBetter(table, order, totalMs);
    saveLastWrongList(table, order, session.wrongList);

    var passed = order === 'sequential' && totalMs <= PASS_MS_SEQUENTIAL;

    resultTimeEl.textContent = formatMs(totalMs);
    resultScoreEl.textContent = '정답 ' + session.correct + ' / 오답 ' + session.wrong;
    resultPassEl.classList.toggle('hidden', !passed);
    parentNoteEl.textContent = passed
      ? table + '단을 통과했습니다.\n참 잘했어요.'
      : '부모님께 보여주세요';

    renderResultsDetailTable(session.log);
    renderRecordsTable();
    renderTablePassState();

    showScreen(resultsScreen);
  }

  function renderResultsDetailTable(log) {
    resultsDetailTbody.innerHTML = '';
    log.forEach(function (entry) {
      var tr = document.createElement('tr');
      tr.classList.add(entry.correct ? 'result-row-correct' : 'result-row-wrong');

      var tdQuestion = document.createElement('td');
      tdQuestion.textContent = entry.a + ' × ' + entry.b;
      tr.appendChild(tdQuestion);

      var tdMark = document.createElement('td');
      tdMark.textContent = entry.correct ? 'O' : 'X';
      tr.appendChild(tdMark);

      var tdTime = document.createElement('td');
      tdTime.textContent = formatMs(entry.elapsedMs);
      tr.appendChild(tdTime);

      resultsDetailTbody.appendChild(tr);
    });
  }

  function goHome() {
    session = null;
    selectedOrder = null;
    orderForcedByMaster = false;
    orderTouchedByUser = false;
    userChosenOrder = null;
    selectedTable = null;

    tableGrid.querySelectorAll('.option-btn').forEach(function (btn) {
      btn.classList.remove('selected');
    });
    orderGrid.querySelectorAll('.option-btn').forEach(function (btn) {
      btn.classList.remove('selected', 'disabled');
    });
    orderNote.classList.add('hidden');

    updateStartButtonState();
    renderRecordsTable();
    renderTablePassState();
    showScreen(startScreen);
  }

  homeBtn.addEventListener('click', function () {
    if (getVerifyMode()) {
      openVerifyOverlay();
    } else {
      goHome();
    }
  });

  function openVerifyOverlay() {
    enteredCode = '';
    codeDisplay.textContent = '';
    codeDisplay.classList.remove('shake');
    verifyOverlay.classList.remove('hidden');
  }

  function closeVerifyOverlay() {
    verifyOverlay.classList.add('hidden');
  }

  keypad.addEventListener('click', function (e) {
    var digitBtn = e.target.closest('[data-digit]');
    if (digitBtn) {
      if (enteredCode.length < SECRET_CODE.length) {
        enteredCode += digitBtn.getAttribute('data-digit');
        codeDisplay.textContent = enteredCode.split('').map(function () { return '●'; }).join(' ');
      }
      return;
    }
    if (e.target.closest('#code-clear')) {
      enteredCode = '';
      codeDisplay.textContent = '';
      return;
    }
    if (e.target.closest('#code-confirm')) {
      checkCode();
    }
  });

  function checkCode() {
    if (enteredCode === SECRET_CODE) {
      closeVerifyOverlay();
      goHome();
    } else {
      codeDisplay.classList.add('shake');
      setTimeout(function () {
        enteredCode = '';
        codeDisplay.textContent = '';
        codeDisplay.classList.remove('shake');
      }, 400);
    }
  }

  appTitle.addEventListener('click', function () {
    titleClickCount++;
    if (titleClickCount >= TITLE_RESET_CLICK_TARGET) {
      titleClickCount = 0;
      openResetConfirmOverlay();
    }
  });

  function openResetConfirmOverlay() {
    resetConfirmStep = 1;
    resetConfirmMessage.textContent = '정말 모든 기록을 초기화하시겠습니까?';
    resetConfirmOverlay.classList.remove('hidden');
  }

  function closeResetConfirmOverlay() {
    resetConfirmOverlay.classList.add('hidden');
    resetConfirmStep = 0;
  }

  resetCancelBtn.addEventListener('click', function () {
    closeResetConfirmOverlay();
  });

  resetConfirmBtn.addEventListener('click', function () {
    if (resetConfirmStep === 1) {
      resetConfirmStep = 2;
      resetConfirmMessage.textContent = '되돌릴 수 없습니다. 정말 초기화할까요?';
    } else if (resetConfirmStep === 2) {
      resetAllRecords();
      closeResetConfirmOverlay();
      renderRecordsTable();
      renderTablePassState();
    }
  });

  function whenCommentServiceReady(callback) {
    if (window.CommentService) {
      callback();
      return;
    }
    window.addEventListener('mult-comment-service-ready', callback, { once: true });
  }

  function getNickname() {
    try {
      return localStorage.getItem('mult-nickname') || '';
    } catch (e) {
      return '';
    }
  }

  function setNickname(name) {
    try {
      localStorage.setItem('mult-nickname', name);
    } catch (e) {
      // 저장소 사용 불가 시 조용히 무시
    }
  }

  function showCommentStatus(message) {
    commentStatusEl.textContent = message;
    commentStatusEl.classList.remove('hidden');
    setTimeout(function () {
      commentStatusEl.classList.add('hidden');
    }, 2500);
  }

  function refreshCommentsBadge() {
    whenCommentServiceReady(function () {
      window.CommentService.getUnreadCount().then(function (count) {
        commentsBadge.textContent = count > 99 ? '99+' : String(count);
        commentsBadge.classList.toggle('hidden', count <= 0);
      }).catch(function () {});
    });
  }

  var cachedComments = [];

  function buildCommentItem(comment, currentUid, adminMode) {
    var item = document.createElement('div');
    item.className = 'comment-item' + (comment.pinned ? ' pinned' : '');
    item.dataset.id = comment.id;

    var meta = document.createElement('div');
    meta.className = 'comment-meta';
    var nicknameEl = document.createElement('b');
    nicknameEl.textContent = comment.nickname;
    var dateEl = document.createElement('span');
    dateEl.textContent = new Date(comment.createdAtMs).toLocaleString();
    meta.appendChild(nicknameEl);
    meta.appendChild(dateEl);

    var textEl = document.createElement('div');
    textEl.className = 'comment-text';
    textEl.textContent = comment.text;

    item.appendChild(meta);
    item.appendChild(textEl);

    var isMine = currentUid && comment.uid === currentUid;

    if (isMine || adminMode) {
      var actions = document.createElement('div');
      actions.className = 'comment-actions';

      if (isMine) {
        var editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'comment-edit-btn';
        editBtn.textContent = '수정';
        actions.appendChild(editBtn);
      }

      if (adminMode) {
        var pinBtn = document.createElement('button');
        pinBtn.type = 'button';
        pinBtn.className = 'comment-pin-btn';
        pinBtn.textContent = comment.pinned ? '고정 해제' : '고정';
        actions.appendChild(pinBtn);
      }

      var deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'comment-delete-btn';
      deleteBtn.textContent = '삭제';
      actions.appendChild(deleteBtn);

      item.appendChild(actions);
    }

    return item;
  }

  function renderComments(list) {
    var adminMode = window.CommentService.isAdmin();
    var currentUid = window.CommentService.getCurrentUid();

    var pinned = list.filter(function (c) { return c.pinned; });
    var rest = list.filter(function (c) { return !c.pinned; });

    pinnedCommentsEl.innerHTML = '';
    pinnedCommentsEl.classList.toggle('hidden', pinned.length === 0);
    pinned.forEach(function (comment) {
      pinnedCommentsEl.appendChild(buildCommentItem(comment, currentUid, adminMode));
    });

    commentsListEl.innerHTML = '';
    if (rest.length === 0 && pinned.length === 0) {
      var emptyEl = document.createElement('p');
      emptyEl.className = 'comments-empty';
      emptyEl.textContent = '아직 댓글이 없습니다';
      commentsListEl.appendChild(emptyEl);
      return;
    }

    rest.forEach(function (comment) {
      commentsListEl.appendChild(buildCommentItem(comment, currentUid, adminMode));
    });
  }

  function refreshAdminUi() {
    whenCommentServiceReady(function () {
      var adminMode = window.CommentService.isAdmin();
      adminLoginLink.classList.toggle('hidden', adminMode);
      adminStatusEl.classList.toggle('hidden', !adminMode);
      adminLogoutBtn.classList.toggle('hidden', !adminMode);
    });
  }

  function loadComments() {
    refreshAdminUi();
    commentsListEl.innerHTML = '';
    var loadingEl = document.createElement('p');
    loadingEl.className = 'comments-empty';
    loadingEl.textContent = '불러오는 중...';
    commentsListEl.appendChild(loadingEl);

    whenCommentServiceReady(function () {
      window.CommentService.fetchComments().then(function (list) {
        cachedComments = list;
        renderComments(list);
        window.CommentService.markAllSeen();
        commentsBadge.classList.add('hidden');
      }).catch(function () {
        commentsListEl.innerHTML = '';
        var errorEl = document.createElement('p');
        errorEl.className = 'comments-empty';
        errorEl.textContent = '댓글을 불러오지 못했습니다.';
        commentsListEl.appendChild(errorEl);
      });
    });
  }

  function handleCommentListClick(e) {
    var item = e.target.closest('.comment-item');
    if (!item) return;
    var id = item.dataset.id;

    if (e.target.classList.contains('comment-delete-btn')) {
      whenCommentServiceReady(function () {
        window.CommentService.deleteComment(id).then(function () {
          loadComments();
        }).catch(function () {
          showCommentStatus('삭제에 실패했습니다.');
        });
      });
      return;
    }

    if (e.target.classList.contains('comment-pin-btn')) {
      var target = cachedComments.filter(function (c) { return c.id === id; })[0];
      var nextPinned = !(target && target.pinned);
      whenCommentServiceReady(function () {
        window.CommentService.togglePinned(id, nextPinned).then(function () {
          loadComments();
        }).catch(function () {
          showCommentStatus('고정 상태 변경에 실패했습니다.');
        });
      });
      return;
    }

    if (e.target.classList.contains('comment-edit-btn')) {
      var textEl = item.querySelector('.comment-text');
      var original = textEl.textContent;
      textEl.innerHTML = '';

      var editInput = document.createElement('input');
      editInput.type = 'text';
      editInput.className = 'text-input';
      editInput.maxLength = 100;
      editInput.value = original;

      var editRow = document.createElement('div');
      editRow.className = 'comment-edit-row';

      var saveBtn = document.createElement('button');
      saveBtn.type = 'button';
      saveBtn.className = 'comment-save-btn';
      saveBtn.textContent = '저장';

      var cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'comment-cancel-btn';
      cancelBtn.textContent = '취소';

      editRow.appendChild(saveBtn);
      editRow.appendChild(cancelBtn);

      textEl.appendChild(editInput);
      textEl.appendChild(editRow);
      return;
    }

    if (e.target.classList.contains('comment-save-btn')) {
      var input = item.querySelector('.text-input');
      var newText = input.value.trim();
      if (!newText) return;
      whenCommentServiceReady(function () {
        window.CommentService.containsProfanity(newText).then(function (isProfane) {
          if (isProfane) {
            showCommentStatus('부적절한 단어가 포함되어 있습니다.');
            return;
          }
          window.CommentService.updateComment(id, newText).then(function () {
            loadComments();
          }).catch(function () {
            showCommentStatus('수정에 실패했습니다.');
          });
        });
      });
      return;
    }

    if (e.target.classList.contains('comment-cancel-btn')) {
      renderComments(cachedComments);
    }
  }

  commentsListEl.addEventListener('click', handleCommentListClick);
  pinnedCommentsEl.addEventListener('click', handleCommentListClick);

  commentSendBtn.addEventListener('click', function () {
    var text = commentInputEl.value.trim();
    if (!text) return;
    var nickname = getNickname();
    if (!nickname) return;

    commentSendBtn.disabled = true;
    whenCommentServiceReady(function () {
      window.CommentService.containsProfanity(text).then(function (isProfane) {
        if (isProfane) {
          showCommentStatus('부적절한 단어가 포함되어 있습니다.');
          commentSendBtn.disabled = false;
          return;
        }
        window.CommentService.postComment(nickname, text).then(function () {
          commentInputEl.value = '';
          loadComments();
        }).catch(function () {
          showCommentStatus('댓글 등록에 실패했습니다.');
        }).finally(function () {
          commentSendBtn.disabled = false;
        });
      }).catch(function () {
        commentSendBtn.disabled = false;
      });
    });
  });

  function openComments() {
    var nickname = getNickname();
    if (!nickname) {
      nicknameInput.value = '';
      nicknameOverlay.classList.remove('hidden');
      return;
    }
    showScreen(commentsScreen);
    loadComments();
  }

  commentsBtn.addEventListener('click', function () {
    openComments();
  });

  commentsBackBtn.addEventListener('click', function () {
    showScreen(startScreen);
  });

  nicknameCancelBtn.addEventListener('click', function () {
    nicknameOverlay.classList.add('hidden');
  });

  nicknameConfirmBtn.addEventListener('click', function () {
    var name = nicknameInput.value.trim();
    if (!name) return;
    nicknameStatus.classList.add('hidden');

    nicknameConfirmBtn.disabled = true;
    whenCommentServiceReady(function () {
      window.CommentService.containsProfanity(name).then(function (isProfane) {
        if (isProfane) {
          nicknameStatus.textContent = '부적절한 단어가 포함되어 있습니다.';
          nicknameStatus.classList.remove('hidden');
          return;
        }
        setNickname(name);
        nicknameOverlay.classList.add('hidden');
        showScreen(commentsScreen);
        loadComments();
      }).finally(function () {
        nicknameConfirmBtn.disabled = false;
      });
    });
  });

  adminLoginLink.addEventListener('click', function () {
    adminEmailInput.value = '';
    adminPasswordInput.value = '';
    adminLoginStatus.classList.add('hidden');
    adminLoginOverlay.classList.remove('hidden');
  });

  adminLoginCancelBtn.addEventListener('click', function () {
    adminLoginOverlay.classList.add('hidden');
  });

  adminLoginConfirmBtn.addEventListener('click', function () {
    var email = adminEmailInput.value.trim();
    var password = adminPasswordInput.value;
    if (!email || !password) return;

    adminLoginConfirmBtn.disabled = true;
    whenCommentServiceReady(function () {
      window.CommentService.signInAdmin(email, password).then(function () {
        adminLoginOverlay.classList.add('hidden');
        loadComments();
      }).catch(function () {
        adminLoginStatus.textContent = '로그인에 실패했습니다.';
        adminLoginStatus.classList.remove('hidden');
      }).finally(function () {
        adminLoginConfirmBtn.disabled = false;
      });
    });
  });

  adminLogoutBtn.addEventListener('click', function () {
    whenCommentServiceReady(function () {
      window.CommentService.signOutAdmin().then(function () {
        loadComments();
      });
    });
  });

  renderRecordsTable();
  renderTablePassState();
  showScreen(startScreen);
  refreshCommentsBadge();
})();
