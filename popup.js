const button = document.getElementById("start-monitor");
const resetButton = document.getElementById("reset-monitor");
const timeInput = document.getElementById("time-input");

let intervalId = null;

function formatToTimeInput(date) {
    const pad = (n) => n.toString().padStart(2, "0");
    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function startCountdown(targetTime) {
    const now = new Date();
    let secondsLeft = Math.floor((targetTime - now.getTime()) / 1000);

    if (secondsLeft <= 0) {
        localStorage.removeItem("monitorTargetTime");
        return;
    }

    const originalText = button.textContent;
    button.disabled = true;

    intervalId = setInterval(() => {
        if (secondsLeft <= 0) {
            clearInterval(intervalId);
            intervalId = null;
            button.disabled = false;
            button.textContent = originalText;
            localStorage.removeItem("monitorTargetTime");
            return;
        }

        const hrs = Math.floor(secondsLeft / 3600);
        const min = Math.floor((secondsLeft % 3600) / 60);
        const sec = secondsLeft % 60;

        button.textContent = `${hrs.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
        secondsLeft--;
    }, 1000);
}

function getValidatedTimeParts(timeStr) {
    let [hourStr, minuteStr, secondStr] = timeStr.split(":");

    let hour = Number(hourStr);
    let minute = Number(minuteStr);
    let second = Number(secondStr);

    if (isNaN(hour)) hour = 0;
    if (isNaN(minute)) minute = 0;
    if (isNaN(second)) second = 0;

    return { hour, minute, second };
}

function setupAndStartTimer(hour, minute, second) {
    const now = new Date();
    const target = new Date();
    target.setHours(hour);
    target.setMinutes(minute);
    target.setSeconds(second);
    target.setMilliseconds(0);

    if (target.getTime() <= now.getTime()) {
        alert("Время должно быть позже текущего!");
        return;
    }

    localStorage.setItem("monitorTargetTime", target.getTime().toString());
    timeInput.value = formatToTimeInput(target);
    startCountdown(target.getTime());

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
            action: "startMonitoring",
            hour,
            minute,
            second
        });
    });
}

// ▶ Start button
button.addEventListener("click", () => {
    const timeInputValue = timeInput.value.trim();

    if (!timeInputValue) {
        alert("Введите время в формате HH:MM или HH:MM:SS");
        return;
    }

    const { hour, minute, second } = getValidatedTimeParts(timeInputValue);
    setupAndStartTimer(hour, minute, second);
});

// ⏹ Reset button
resetButton.addEventListener("click", () => {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }

    localStorage.removeItem("monitorTargetTime");
    timeInput.value = "";
    button.disabled = false;
    button.textContent = "Start";
});

// 🔄 On page load
window.addEventListener("DOMContentLoaded", () => {
    const storedTime = localStorage.getItem("monitorTargetTime");
    if (storedTime) {
        const targetTime = Number(storedTime);
        const targetDate = new Date(targetTime);
        const now = Date.now();

        timeInput.value = formatToTimeInput(targetDate);

        if (targetTime > now) {
            startCountdown(targetTime);
        } else {
            localStorage.removeItem("monitorTargetTime");
        }
    }
});
