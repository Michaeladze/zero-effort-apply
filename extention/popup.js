const button = document.getElementById("start-monitor");
const resetButton = document.getElementById("reset-monitor");
const timeInput = document.getElementById("time-input");
const activationInput = document.getElementById("activation-code");

let intervalId = null;

function formatToTimeInput(date) {
    const pad = (n) => n.toString().padStart(2, "0");
    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function getValidatedTimeParts(timeStr) {
    let [hourStr, minuteStr, secondStr] = timeStr.split(":");
    let hour = Number(hourStr);
    let minute = Number(minuteStr);
    let second = Number(secondStr);

    if (isNaN(hour)) hour = 0;
    if (isNaN(minute)) minute = 0;
    if (isNaN(second)) second = 0;

    return {hour, minute, second};
}

function startCountdown(targetTime) {
    const now = new Date();
    let secondsLeft = Math.floor((targetTime - now.getTime()) / 1000);

    if (secondsLeft <= 0) {
        localStorage.removeItem("monitorState");
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
            localStorage.removeItem("monitorState");
            return;
        }

        const hrs = Math.floor(secondsLeft / 3600);
        const min = Math.floor((secondsLeft % 3600) / 60);
        const sec = secondsLeft % 60;

        button.textContent = `${hrs.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
        secondsLeft--;
    }, 1000);
}

async function verifyCode(code) {
    try {
        const res = await fetch("http://localhost:3000/api/verify-code", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({code}),
        });

        return res.ok;
    } catch (error) {
        console.error("Ошибка запроса к verify-code:", error);
        return false;
    }
}

async function setupAndStartTimer(hour, minute, second, code) {
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

    const isValid = await verifyCode(code);
    if (!isValid) {
        alert("Неверный код активации");
        return;
    }

    const targetTime = target.getTime();
    localStorage.setItem("monitorState", JSON.stringify({code, targetTime}));

    startCountdown(targetTime);

    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
            action: "startMonitoring",
            hour,
            minute,
            second,
            code
        });
    });
}

// ▶ Start button
button.addEventListener("click", async () => {
    const timeInputValue = timeInput.value.trim();
    const code = activationInput.value.trim();

    if (!timeInputValue || !code) {
        alert("Введите и код, и время");
        return;
    }

    const {hour, minute, second} = getValidatedTimeParts(timeInputValue);
    await setupAndStartTimer(hour, minute, second, code);
});

// ⏹ Reset button
resetButton.addEventListener("click", () => {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }

    localStorage.removeItem("monitorState");
    timeInput.value = "";
    activationInput.value = "";
    button.disabled = false;
    button.textContent = "Start";
});

// 🔄 On load
window.addEventListener("DOMContentLoaded", async () => {
    const saved = localStorage.getItem("monitorState");


    if (!saved) return;

    try {
        const {code, targetTime} = JSON.parse(saved);
        const isValid = await verifyCode(code);

        if (isValid && targetTime > Date.now()) {
            activationInput.value = code;
            timeInput.value = formatToTimeInput(new Date(targetTime));
            startCountdown(targetTime);
        } else {
            localStorage.removeItem("monitorState");
        }
    } catch (e) {
        console.error("Ошибка при восстановлении состояния:", e);
        localStorage.removeItem("monitorState");
    }
});
