(() => {
  "use strict";

  const isLocal =
  location.protocol === "file:" ||
  location.port === "8000" ||
  ["localhost", "127.0.0.1"].includes(location.hostname);

  const LOCAL_API = location.protocol === "file:" ? "http://127.0.0.1:8000" : location.origin;
  const RENDER_API = "https://mansik-santulan-score.onrender.com";

  // Try the local server first, then fall back to Render
  const API_CANDIDATES = isLocal
    ? [LOCAL_API, RENDER_API]
    : [RENDER_API];

  const form = document.getElementById("predict-form");
  const submitBtn = document.getElementById("submit-btn");
  const resetBtn = document.getElementById("reset-btn");
  const errorRetryBtn = document.getElementById("error-retry-btn");

  const stateIdle = document.getElementById("state-idle");
  const stateLoading = document.getElementById("state-loading");
  const stateResult = document.getElementById("state-result");
  const stateError = document.getElementById("state-error");

  const scoreNumberEl = document.getElementById("score-number");
  const scoreBandEl = document.getElementById("score-band");
  const scoreContextEl = document.getElementById("score-context");

  const gaugeFill = document.getElementById("gauge-fill");

  const errorLabelEl = document.getElementById("error-label");
  const errorCopyEl = document.getElementById("error-copy");

  const GAUGE_ARC_LENGTH = 314;

  const gaugeSvg = gaugeFill
    ? gaugeFill.closest("svg")
    : null;

  let waitingHiddenElements = [];

  function drawTicks() {
    document.querySelectorAll(".gauge-ticks").forEach((g) => {
      g.innerHTML = "";

      const cx = 120;
      const cy = 140;
      const rOuter = 100;
      const rInner = 90;

      for (let i = 0; i <= 10; i += 2) {
        const angle = Math.PI - (i / 10) * Math.PI;

        const x1 = cx + rOuter * Math.cos(angle);
        const y1 = cy - rOuter * Math.sin(angle);
        const x2 = cx + rInner * Math.cos(angle);
        const y2 = cy - rInner * Math.sin(angle);

        const line = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line"
        );

        line.setAttribute("x1", x1.toFixed(1));
        line.setAttribute("y1", y1.toFixed(1));
        line.setAttribute("x2", x2.toFixed(1));
        line.setAttribute("y2", y2.toFixed(1));

        g.appendChild(line);
      }
    });
  }

  drawTicks();

  const stressInput =
    document.getElementById("stress_level");

  function fieldWrapper(input) {
    return input
      ? input.closest(".field")
      : null;
  }

  function setFieldError(input, message) {
    const wrap = fieldWrapper(input);

    if (!wrap) return;

    wrap.classList.add("field-error");

    let msg =
      wrap.querySelector(".error-msg");

    if (!msg) {
      msg = document.createElement("small");
      msg.className = "error-msg";
      wrap.appendChild(msg);
    }

    msg.textContent = message;
  }

  function clearFieldError(input) {
    const wrap = fieldWrapper(input);

    if (!wrap) return;

    wrap.classList.remove("field-error");

    const msg =
      wrap.querySelector(".error-msg");

    if (msg) {
      msg.textContent = "";
    }
  }

  function clearAllErrors() {
    if (!form) return;

    form.querySelectorAll(".field").forEach(
      (field) => {
        field.classList.remove("field-error");
      }
    );

    form.querySelectorAll(".error-msg").forEach(
      (msg) => {
        msg.textContent = "";
      }
    );
  }

  function collectPayload() {
    const fd = new FormData(form);

    return {
      age: Number(fd.get("age")),

      gender:
        String(fd.get("gender") || ""),

      country: "India",

      academic_level:
        String(
          fd.get("academic_level") || ""
        ),

      most_used_platform:
        String(
          fd.get("most_used_platform") || ""
        ),

      purpose_of_use: "Education",

      avg_daily_usage_hours:
        Number(
          fd.get(
            "avg_daily_usage_hours"
          )
        ),

      daily_unlocks: 50,

      study_hours:
        Number(
          fd.get("study_hours")
        ),

      physical_activity_hours:
        Number(
          fd.get(
            "physical_activity_hours"
          )
        ),

      sleep_hours_per_night:
        Number(
          fd.get(
            "sleep_hours_per_night"
          )
        ),

      stress_level:
        String(
          fd.get("stress_level") || ""
        )
    };
  }

  function validate(payload) {
    const errors = [];

    if (
      !Number.isFinite(payload.age) ||
      payload.age < 10 ||
      payload.age > 100
    ) {
      errors.push([
        document.getElementById("age"),
        "Enter age between 10 and 100."
      ]);
    }

    if (!payload.gender) {
      errors.push([
        document.getElementById("gender"),
        "Please select gender."
      ]);
    }

    if (!payload.academic_level) {
      errors.push([
        document.getElementById(
          "academic_level"
        ),
        "Please select education level."
      ]);
    }

    if (!payload.most_used_platform) {
      errors.push([
        document.getElementById(
          "most_used_platform"
        ),
        "Please select a platform."
      ]);
    }

    if (
      !Number.isFinite(
        payload.avg_daily_usage_hours
      ) ||
      payload.avg_daily_usage_hours < 0 ||
      payload.avg_daily_usage_hours > 24
    ) {
      errors.push([
        document.getElementById(
          "avg_daily_usage_hours"
        ),
        "Enter screen time between 0 and 24."
      ]);
    }

    if (
      !Number.isFinite(
        payload.study_hours
      ) ||
      payload.study_hours < 0 ||
      payload.study_hours > 24
    ) {
      errors.push([
        document.getElementById(
          "study_hours"
        ),
        "Enter study hours between 0 and 24."
      ]);
    }

    if (
      !Number.isFinite(
        payload.physical_activity_hours
      ) ||
      payload.physical_activity_hours < 0 ||
      payload.physical_activity_hours > 24
    ) {
      errors.push([
        document.getElementById(
          "physical_activity_hours"
        ),
        "Enter valid physical activity."
      ]);
    }

    if (
      !Number.isFinite(
        payload.sleep_hours_per_night
      ) ||
      payload.sleep_hours_per_night < 0 ||
      payload.sleep_hours_per_night > 24
    ) {
      errors.push([
        document.getElementById(
          "sleep_hours_per_night"
        ),
        "Enter sleep hours between 0 and 24."
      ]);
    }

    if (!payload.stress_level) {
      errors.push([
        stressInput,
        "Please select stress level."
      ]);
    }

    return errors;
  }

  function showState(name) {
    [
      stateIdle,
      stateLoading,
      stateResult,
      stateError
    ].forEach((el) => {
      if (el) {
        el.hidden = true;
      }
    });

    const states = {
      idle: stateIdle,
      loading: stateLoading,
      result: stateResult,
      error: stateError
    };

    if (states[name]) {
      states[name].hidden = false;
    }
  }

  function setSubmitting(value) {
    if (!submitBtn) return;

    submitBtn.disabled = value;
    submitBtn.classList.toggle(
      "loading",
      value
    );
  }

  function hideElementForWaiting(el) {
    if (!el) return;

    if (
      !waitingHiddenElements.includes(el)
    ) {
      waitingHiddenElements.push(el);

      el.dataset.waitingOriginalDisplay =
        el.style.display || "";
    }

    el.style.display = "none";
  }

  function restoreWaitingElements() {
    waitingHiddenElements.forEach((el) => {
      if (!el) return;

      el.style.display =
        el.dataset.waitingOriginalDisplay || "";

      delete el.dataset
        .waitingOriginalDisplay;
    });

    waitingHiddenElements = [];
  }

  function findQuickTip() {
    const elements =
      document.querySelectorAll(
        "h1,h2,h3,h4,h5,h6,p,span,div"
      );

    for (const el of elements) {
      const text =
        el.textContent.trim();

      if (
        text === "Quick Tip" ||
        text.startsWith("Quick Tip")
      ) {
        return el;
      }
    }

    return null;
  }

  function hideWaitingExtras() {
    restoreWaitingElements();

    if (resetBtn) {
      hideElementForWaiting(resetBtn);
    }

    const quickTip =
      findQuickTip();

    if (quickTip) {
      const card =
        quickTip.closest(
          ".tip-card, .quick-tip, .quick-tip-card, .tip, .card"
        );

      if (card) {
        hideElementForWaiting(card);
      } else {
        hideElementForWaiting(quickTip);
      }
    }

    const result =
      stateResult ||
      document.querySelector(
        ".score-card, .result-card"
      );

    if (!result) return;

    const bandRect =
      scoreBandEl
        ? scoreBandEl.getBoundingClientRect()
        : null;

    const tipRect =
      quickTip
        ? quickTip.getBoundingClientRect()
        : null;

    result
      .querySelectorAll(
        "div,span"
      )
      .forEach((el) => {
        if (
          el === scoreNumberEl ||
          el === scoreBandEl ||
          el === scoreContextEl ||
          el === gaugeSvg ||
          el.contains(scoreNumberEl) ||
          el.contains(scoreBandEl) ||
          el.contains(scoreContextEl)
        ) {
          return;
        }

        const rect =
          el.getBoundingClientRect();

        const width = rect.width;
        const height = rect.height;

        const isSmallCircle =
          width >= 25 &&
          width <= 100 &&
          height >= 25 &&
          height <= 100 &&
          Math.abs(width - height) <= 20;

        const isBetween =
          bandRect &&
          tipRect &&
          rect.top >
            bandRect.bottom &&
          rect.bottom <
            tipRect.top + 30;

        const hasNoText =
          el.textContent.trim() === "";

        if (
          isSmallCircle &&
          isBetween &&
          hasNoText
        ) {
          hideElementForWaiting(el);
        }
      });
  }

  function showNormalExtras() {
    restoreWaitingElements();

    if (resetBtn) {
      resetBtn.style.display = "";
    }
  }

  const scoreCircleEl = document.querySelector(".score-circle");

  function setRing(score100) {
    if (scoreCircleEl) {
      scoreCircleEl.style.setProperty(
        "--fill",
        String((score100 / 100) * 260)
      );
    }
  }

  function setStatus(text, isError = false) {
    if (scoreBandEl) {
      scoreBandEl.textContent = text;
      scoreBandEl.classList.toggle("is-error", isError);
    }
  }

  function showWaitingState() {
    setRing(0);
    if (scoreBandEl) scoreBandEl.classList.remove("is-error");
    if (scoreNumberEl) {
      scoreNumberEl.textContent = "0";
    }

    if (scoreBandEl) {
      scoreBandEl.textContent =
        "Waiting for the score count...";
    }

    if (scoreContextEl) {
      scoreContextEl.textContent = "";
      scoreContextEl.style.display = "none";
    }

    if (gaugeSvg) {
      gaugeSvg.style.display = "none";
    }

    if (gaugeFill) {
      gaugeFill.style.transition = "none";

      gaugeFill.style.strokeDashoffset =
        String(
          GAUGE_ARC_LENGTH
        );
    }

    hideWaitingExtras();
  }

  function renderResult(rawScore) {
    let score100 =
      Number(rawScore);

    if (!Number.isFinite(score100)) {
      renderError(
        "Invalid Score",
        "The server returned an invalid score."
      );

      return;
    }

    if (
      score100 > 0 &&
      score100 <= 10
    ) {
      score100 =
        score100 * 10;
    }

    score100 =
      Math.max(
        0,
        Math.min(
          100,
          score100
        )
      );

    if (score100 === 0) {
      showWaitingState();
      showState("result");
      return;
    }

    showNormalExtras();

    if (gaugeSvg) {
      gaugeSvg.style.display = "";
    }

    let label = "";
    let message = "";

    if (score100 <= 30) {
      label =
        "Poor Mental Health";

      message =
        "Your mental health looks poor! You have to calm your mental health and take better care of yourself.";
    } else if (score100 <= 60) {
      label =
        "Good Mental Health";

      message =
        "Your mental health looks good! Keep up with your healthy habits.";
    } else {
      label =
        "Excellent Mental Health";

      message =
        "Your mental health looks excellent! Keep up with your healthy habits.";
    }

    if (scoreBandEl) scoreBandEl.classList.remove("is-error");
    setRing(score100);

    if (scoreNumberEl) {
      scoreNumberEl.textContent =
        score100.toFixed(0);
    }

    if (scoreBandEl) {
      scoreBandEl.textContent =
        label;
    }

    if (scoreContextEl) {
      scoreContextEl.style.display = "";
      scoreContextEl.textContent =
        message;
    }

    if (gaugeFill) {
      gaugeFill.style.transition =
        "none";

      gaugeFill.style.strokeDashoffset =
        String(
          GAUGE_ARC_LENGTH
        );

      requestAnimationFrame(() => {
        gaugeFill.style.transition = "";

        const offset =
          GAUGE_ARC_LENGTH *
          (1 - score100 / 100);

        gaugeFill.style.strokeDashoffset =
          String(offset);
      });
    }

    showState("result");
    updateProgress(true);
  }

  function renderError(
    label,
    message
  ) {
    if (errorLabelEl) {
      errorLabelEl.textContent =
        label;
    }

    if (errorCopyEl) {
      errorCopyEl.textContent =
        message;
    }

    hideWaitingExtras();
    showState("error");

    setStatus(label, true);

    if (scoreContextEl) {
      scoreContextEl.style.display = "";
      scoreContextEl.textContent = message;
    }
  }


  // ---------- STEP PROGRESS ----------
  const TOTAL_STEPS = 4;
  const stepCounterEl = document.getElementById("step-counter");
  const progressFillEl = document.getElementById("progress-fill");

  const sectionFields = [
    ["age", "gender", "academic_level"],
    ["study_hours", "avg_daily_usage_hours", "most_used_platform"],
    ["sleep_hours_per_night", "physical_activity_hours", "stress_level"]
  ];

  function isFilled(id) {
    const el = document.getElementById(id);
    if (!el) return false;
    const v = String(el.value).trim();
    if (v === "") return false;
    if (el.type === "number") return Number.isFinite(Number(v));
    return true;
  }

  function completedSections() {
    let n = 0;
    for (const ids of sectionFields) {
      if (ids.every(isFilled)) n++;
      else break;
    }
    return n;
  }

  function updateProgress(resultDone = false) {
    const done = resultDone ? TOTAL_STEPS : completedSections();
    const current = done;

    if (stepCounterEl) {
      stepCounterEl.textContent = resultDone
        ? `Step ${TOTAL_STEPS} of ${TOTAL_STEPS} \u2713 Done`
        : `Step ${current} of ${TOTAL_STEPS}`;
      stepCounterEl.classList.toggle("step-done", resultDone);
    }

    if (progressFillEl) {
      progressFillEl.style.width = `${(done / TOTAL_STEPS) * 100}%`;
    }
  }

  if (form) {
    form.querySelectorAll("input, select").forEach((el) => {
      el.addEventListener("input", () => updateProgress(false));
      el.addEventListener("change", () => updateProgress(false));
    });
  }

  updateProgress(false);

  showWaitingState();

  if (form) {
    form.addEventListener(
      "submit",
      async (event) => {
        event.preventDefault();

        clearAllErrors();

        const payload =
          collectPayload();

        console.log(
          "SENDING DATA:",
          payload
        );

        const errors =
          validate(payload);

        if (errors.length > 0) {
          errors.forEach(
            ([input, message]) => {
              if (input) {
                setFieldError(
                  input,
                  message
                );
              }
            }
          );

          return;
        }

        setSubmitting(true);
        showState("loading");
        setStatus("Calculating your score...");
        hideWaitingExtras();
        if (scoreContextEl) scoreContextEl.textContent = "";

        try {
          let response = null;
          let lastError = null;

          for (const base of API_CANDIDATES) {
            // Render free tier sleeps and can take ~1 minute to wake up, so retry up to 6 times
            const attempts = base === RENDER_API ? 6 : 1;
            for (let i = 0; i < attempts && !response; i++) {
              if (i > 0) {
                setStatus("Server is waking up, please wait 10-20 seconds...");
                await new Promise((r) => setTimeout(r, 10000));
              }
            try {
              response = await fetch(
                `${base}/predict`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type":
                      "application/json"
                  },
                  body:
                    JSON.stringify(
                      payload
                    )
                }
              );
              break;
            } catch (err) {
              lastError = err;
            }
            }
            if (response) break;
          }

          if (!response) {
            throw lastError ||
              new Error("No server reachable");
          }

          const data =
            await response.json();

          console.log(
            "API RESPONSE:",
            data
          );

          if (!response.ok) {
            if (
              response.status ===
                422 &&
              Array.isArray(
                data.detail
              )
            ) {
              data.detail.forEach(
                (err) => {
                  if (
                    !Array.isArray(
                      err.loc
                    )
                  ) {
                    return;
                  }

                  const field =
                    err.loc[
                      err.loc.length - 1
                    ];

                  const input =
                    document.getElementById(
                      field
                    );

                  if (input) {
                    setFieldError(
                      input,
                      err.msg ||
                        "Invalid value."
                    );
                  }
                }
              );

              renderError(
                "Check Your Inputs",
                "The server rejected one or more values."
              );

              return;
            }

            renderError(
              "Prediction Failed",
              data.detail ||
                `Server returned ${response.status}.`
            );

            return;
          }

          const score =
            data.predicted_mental_health_score;

          console.log(
            "MODEL SCORE:",
            score
          );

          renderResult(score);
        } catch (error) {
          console.error(
            "ERROR:",
            error
          );

          renderError(
            "Server Error",
            "Unable to reach the prediction server. Please start the server (run start_server.bat) and try again."
          );
        } finally {
          setSubmitting(false);
        }
      }
    );
  }

  if (form) {
    form
      .querySelectorAll(
        "input, select"
      )
      .forEach((element) => {
        element.addEventListener(
          "input",
          () => {
            clearFieldError(
              element
            );
          }
        );

        element.addEventListener(
          "change",
          () => {
            clearFieldError(
              element
            );
          }
        );
      });
  }

  if (resetBtn) {
    resetBtn.addEventListener(
      "click",
      () => {
        form.reset();

        clearAllErrors();

        updateProgress(false);

        showWaitingState();

        showState("result");
      }
    );
  }

  if (errorRetryBtn) {
    errorRetryBtn.addEventListener(
      "click",
      () => {
        showState("idle");
        showWaitingState();
      }
    );
  }
})();