class Timer {
  constructor() {
    this.startTime = 0;
    this.elapsedTime = 0;
    this.timerInterval = null;
    this.isRunning = false;

    this.display = document.getElementById("display");
    this.startBtn = document.getElementById("startBtn");
    this.pauseBtn = document.getElementById("pauseBtn");
    this.resetBtn = document.getElementById("resetBtn");
    this.stopBtn = document.getElementById("stopBtn");
    this.sectionType = document.getElementById("sectionType");
    this.presetTime = document.getElementById("presetTime");
    this.customTimeInput = document.getElementById("customTimeInput");
    this.minutesInput = document.getElementById("minutes");
    this.activeSection = document.getElementById("activeSection");
    this.historyBody = document.getElementById("historyBody");
    this.container = document.querySelector(".container");

    // History and current section
    this.history = JSON.parse(localStorage.getItem("timerHistory")) || [];
    this.currentSection = "";

    // Countdown-related
    this.presetDuration = 0; // milliseconds for preset
    this.isCountdown = false;
    this.remainingTime = 0; // when paused or before start
    this.referenceRemaining = 0; // remaining at the moment of starting (to compute current)

    this.initEventListeners();
    this.updateHistoryDisplay();
    this.updateStats();
    this.updateControls();
  }

  initEventListeners() {
    this.startBtn.addEventListener("click", () => this.start());
    this.pauseBtn.addEventListener("click", () => this.pause());
    this.resetBtn.addEventListener("click", () => this.reset());
    this.stopBtn.addEventListener("click", () => this.stop());
    this.customTimeInput.style.display = "block";

    this.sectionType.addEventListener("change", (e) => {
      this.currentSection = e.target.value;
      this.activeSection.textContent = this.currentSection
        ? `当前题型: ${this.currentSection}`
        : "当前题型: 未选择";
      this.updateControls();
    });

    this.presetTime.addEventListener("change", (e) => {
      if (e.target.value === "0") {
        this.customTimeInput.style.display = "block";
        // switch off countdown mode when custom chosen
        // this.isCountdown = false;
        this.presetDuration = 0;
        this.remainingTime = 0;
        this.updateDisplay();
        this.updateControls();
      } else {
        this.customTimeInput.style.display = "none";
        this.setPresetTime(parseInt(e.target.value));
        this.updateControls();
      }
    });

    // allow changing custom minutes to set a non-preset elapsed session
    this.minutesInput.addEventListener("input", () => {
      // enable the user to set a custom countdown time
      this.isCountdown = true;
      // set countdown time based on user input
      const customMins = parseInt(this.minutesInput.value) || 0;
      this.setPresetTime(customMins);
    });
  }

  start() {
    if (!this.currentSection) {
      alert("请先选择题型！");
      return;
    }

    if (!this.isRunning) {
      if (this.isCountdown) {
        // Begin countdown from remainingTime (may be presetDuration if not started yet)
        this.startTime = Date.now();
        this.referenceRemaining = this.remainingTime;
        this.timerInterval = setInterval(() => this.update(), 200);
      } else {
        // Elapsed (count up) mode
        // If user set a custom minutes value before starting, treat it as initial elapsed time
        const customMins = parseInt(this.minutesInput.value) || 0;
        if (
          this.presetTime.value === "0" &&
          customMins > 0 &&
          this.elapsedTime === 0
        ) {
          // if user provided a custom start value, set as initial elapsed
          this.elapsedTime = customMins * 60 * 1000;
        }
        this.startTime = Date.now() - this.elapsedTime;
        this.timerInterval = setInterval(() => this.update(), 200);
      }

      this.isRunning = true;
      this.updateControls();
    }
  }

  pause() {
    if (this.isRunning) {
      clearInterval(this.timerInterval);

      if (this.isCountdown) {
        const elapsed = Date.now() - this.startTime;
        this.remainingTime = this.referenceRemaining - elapsed;
      } else {
        this.elapsedTime = Date.now() - this.startTime;
      }

      this.isRunning = false;
      this.updateControls();
    }
  }

  reset() {
    clearInterval(this.timerInterval);
    this.isRunning = false;

    if (this.isCountdown) {
      this.remainingTime = this.presetDuration;
      this.referenceRemaining = this.presetDuration;
      // remove visual alert
      this.container.classList.remove("time-up");
    } else {
      this.elapsedTime = 0;
    }
    // remove any temporarily stored currentRemaining
    delete this._currentRemaining;

    this.updateDisplay();
    this.updateControls();
  }

  stop() {
    if (this.isRunning) {
      this.pause();
    }

    // compute the used time to record
    let usedTime = 0;

    if (this.isCountdown) {
      // determine current remaining (if paused or stopped)
      let currentRemaining = this.remainingTime;
      if (this.isRunning) {
        const elapsed = Date.now() - this.startTime;
        currentRemaining = this.referenceRemaining - elapsed;
      }
      // used time = presetDuration - currentRemaining
      usedTime = this.presetDuration - currentRemaining;
    } else {
      usedTime = this.elapsedTime;
    }

    if (this.currentSection && usedTime > 0) {
      const record = {
        section: this.currentSection,
        time: Math.max(0, Math.round(usedTime)),
        date: new Date().toLocaleString("zh-CN"),
      };

      this.history.push(record);
      localStorage.setItem("timerHistory", JSON.stringify(this.history));

      this.updateHistoryDisplay();
      this.updateStats();

      // 重置当前练习
      this.currentSection = "";
      this.activeSection.textContent = "当前题型: 未选择";
      this.sectionType.value = "";
      this.reset();
      this.updateControls();
    } else {
      alert("没有有效的练习记录可保存！");
    }
  }

  setPresetTime(minutes) {
    this.presetDuration = minutes * 60 * 1000; // 转换为毫秒
    this.isCountdown = true;
    this.remainingTime = this.presetDuration;
    this.referenceRemaining = this.presetDuration;
    this.updateDisplay();
    this.updateControls();
  }

  // Enable/disable/hide controls based on current state
  updateControls() {
    const hasSection = !!this.currentSection;

    // compute usedTime to decide if reset/stop should be enabled
    let usedTime = 0;
    if (this.isCountdown) {
      const currRemaining =
        typeof this._currentRemaining === "number"
          ? this._currentRemaining
          : this.remainingTime;
      usedTime = this.presetDuration - currRemaining;
    } else {
      usedTime = this.elapsedTime;
    }

    const hasElapsed = usedTime > 0;

    if (this.isRunning) {
      this.startBtn.disabled = true;
      this.pauseBtn.disabled = false;
      this.resetBtn.disabled = true;
      this.stopBtn.disabled = false;
      this.presetTime.disabled = true;
      this.minutesInput.disabled = true;
    } else {
      this.startBtn.disabled = !hasSection;
      this.pauseBtn.disabled = true;
      this.resetBtn.disabled = !hasElapsed;
      this.stopBtn.disabled = !hasElapsed;
      this.presetTime.disabled = false;
      this.minutesInput.disabled = this.presetTime.value !== "0";
    }
  }

  update() {
    if (this.isCountdown) {
      const elapsed = Date.now() - this.startTime;
      const currentRemaining = this.referenceRemaining - elapsed;

      // visual alert when time <= 0
      if (currentRemaining <= 0) {
        this.container.classList.add("time-up");
      } else {
        this.container.classList.remove("time-up");
      }

      // store currentRemaining temporarily for display
      this._currentRemaining = currentRemaining;
      this.updateDisplay();
      this.updateControls();
    } else {
      this.elapsedTime = Date.now() - this.startTime;
      this.updateDisplay();
      this.updateControls();
    }
  }

  updateDisplay() {
    if (this.isCountdown) {
      const ms =
        typeof this._currentRemaining === "number"
          ? this._currentRemaining
          : this.remainingTime;

      // If remaining is negative, show overtime with a minus sign
      if (ms >= 0) {
        this.display.textContent = this.formatTime(ms);
      } else {
        const overtime = Math.abs(ms);
        // prefix with - to indicate overtime
        const formatted = this.formatTime(overtime);
        this.display.textContent = `-${formatted}`;
      }
    } else {
      const totalSeconds = Math.floor(this.elapsedTime / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      this.display.textContent = `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
  }

  updateHistoryDisplay() {
    this.historyBody.innerHTML = "";

    // 按时间倒序排列
    const sortedHistory = [...this.history].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    sortedHistory.forEach((record, index) => {
      const row = document.createElement("tr");

      const timeString = this.formatTime(record.time);

      row.innerHTML = `
                <td>${record.section}</td>
                <td>${timeString}</td>
                <td>${record.date}</td>
                <td><button onclick="timer.deleteRecord(${index})" style="padding:5px 10px;font-size:12px;">删除</button></td>
            `;

      this.historyBody.appendChild(row);
    });
  }

  formatTime(milliseconds) {
    const ms = Math.round(milliseconds);
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    } else {
      return `${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }
  }

  updateStats() {
    document.getElementById("totalSessions").textContent = this.history.length;

    if (this.history.length > 0) {
      // 计算平均用时
      const totalTime = this.history.reduce(
        (sum, record) => sum + record.time,
        0
      );
      const avgTime = totalTime / this.history.length;
      document.getElementById("avgTime").textContent = this.formatTime(avgTime);

      // 计算总用时
      document.getElementById("totalTime").textContent =
        this.formatTime(totalTime);

      // 找到最佳用时（最短时间）
      const bestTime = Math.min(...this.history.map((record) => record.time));
      document.getElementById("bestTime").textContent =
        this.formatTime(bestTime);
    } else {
      document.getElementById("avgTime").textContent = "00:00";
      document.getElementById("bestTime").textContent = "--:--";
      document.getElementById("totalTime").textContent = "00:00";
    }
  }

  deleteRecord(index) {
    if (confirm("确定要删除这条记录吗？")) {
      this.history.splice(index, 1);
      localStorage.setItem("timerHistory", JSON.stringify(this.history));
      this.updateHistoryDisplay();
      this.updateStats();
    }
  }
}

// 初始化计时器
const timer = new Timer();
