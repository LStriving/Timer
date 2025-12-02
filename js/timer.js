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

    this.history = JSON.parse(localStorage.getItem("timerHistory")) || [];
    this.currentSection = "";

    this.initEventListeners();
    this.updateHistoryDisplay();
    this.updateStats();
  }

  initEventListeners() {
    this.startBtn.addEventListener("click", () => this.start());
    this.pauseBtn.addEventListener("click", () => this.pause());
    this.resetBtn.addEventListener("click", () => this.reset());
    this.stopBtn.addEventListener("click", () => this.stop());

    this.sectionType.addEventListener("change", (e) => {
      this.currentSection = e.target.value;
      this.activeSection.textContent = this.currentSection
        ? `当前题型: ${this.currentSection}`
        : "当前题型: 未选择";
    });

    this.presetTime.addEventListener("change", (e) => {
      if (e.target.value === "0") {
        this.customTimeInput.style.display = "block";
      } else {
        this.customTimeInput.style.display = "none";
        this.setPresetTime(parseInt(e.target.value));
      }
    });
  }

  start() {
    if (!this.currentSection) {
      alert("请先选择题型！");
      return;
    }

    if (!this.isRunning) {
      this.startTime = Date.now() - this.elapsedTime;
      this.timerInterval = setInterval(() => this.update(), 10);
      this.isRunning = true;
    }
  }

  pause() {
    if (this.isRunning) {
      clearInterval(this.timerInterval);
      this.isRunning = false;
    }
  }

  reset() {
    clearInterval(this.timerInterval);
    this.isRunning = false;
    this.elapsedTime = 0;
    this.updateDisplay();
  }

  stop() {
    if (this.isRunning) {
      this.pause();
    }

    if (this.currentSection && this.elapsedTime > 0) {
      const record = {
        section: this.currentSection,
        time: this.elapsedTime,
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
    } else {
      alert("没有有效的练习记录可保存！");
    }
  }

  setPresetTime(minutes) {
    this.elapsedTime = minutes * 60 * 1000; // 转换为毫秒
    this.updateDisplay();
  }

  update() {
    this.elapsedTime = Date.now() - this.startTime;
    this.updateDisplay();
  }

  updateDisplay() {
    const totalSeconds = Math.floor(this.elapsedTime / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    this.display.textContent = `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
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
    const totalSeconds = Math.floor(milliseconds / 1000);
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
