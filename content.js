chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "startMonitoring") {
        monitorTime({
            targetHour: message.hour,
            targetMinute: message.minute,
            targetSecond: message.second
        });
    }
});

function monitorTime({targetHour, targetMinute, targetSecond}) {
    const interval = setInterval(() => {
        const now = new Date();
        if (
            now.getHours() === targetHour &&
            now.getMinutes() === targetMinute &&
            now.getSeconds() === targetSecond
        ) {
            clearInterval(interval);
            console.log("🟢 Start!");
            runAutomation();
        }
    }, 100);
}

async function runAutomation() {
    const startTime = performance.now();

    async function waitForButtonWithText(selector, expectedText) {
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                const elements = document.querySelectorAll(selector);
                for (const element of elements) {
                    if (element.offsetParent !== null && element.textContent.trim() === expectedText) {
                        clearInterval(interval);
                        resolve(element);
                        break;
                    }
                }
            }, 50);
        });
    }

    async function waitForElement(selector) {
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                const element = document.querySelector(selector);
                if (element) {
                    clearInterval(interval);
                    resolve(element);
                }
            }, 50);
        });
    }

    try {
        // Шаг 1: Ждать и нажать кнопку "View Appointment Slots"
        const viewSlotsButton = await waitForButtonWithText('button.button1', 'View Appointment Slots');
        viewSlotsButton.click();

        // Шаг 2: Ждать появления хотя бы одного appointment слота
        await waitForElement('li.appointment-btn');

        // Теперь сразу ищем все и кликаем по последнему
        const appointmentSlots = document.querySelectorAll('li.appointment-btn');
        if (appointmentSlots.length > 0) {
            const date = new Date().getDate();
            const lastAppointmentButton = date % 2 === 0 ?
                appointmentSlots[appointmentSlots.length - 1] :
                appointmentSlots[0];
            lastAppointmentButton.click();
        } else {
            throw new Error('No appointment slots found');
        }

        // Шаг 3: Ждать и нажать первую кнопку "Continue"
        const continueButton1 = await waitForButtonWithText('button.btn-primary-vfs', 'Continue');
        continueButton1.click();

        // Шаг 4: Ждать и нажать кнопку "Add"
        const addButton = await waitForButtonWithText('button.btn-outline-primary-vfs', 'Add');
        addButton.click();

        // Шаг 5: Ждать и нажать вторую кнопку "Continue"
        const continueButton2 = await waitForButtonWithText('button.btn-primary-vfs', 'Continue');
        continueButton2.click();

        // Шаг 6: Ждать появления чекбокса и поставить галочку
        const checkboxInput = await waitForElement('label[for="squaredTwo-1"] input[type="checkbox"]');
        if (checkboxInput && !checkboxInput.checked) {
            checkboxInput.checked = true;
            checkboxInput.dispatchEvent(new Event('change', {bubbles: true}));
        } else {
            throw new Error('Checkbox not found or already checked');
        }

        // Шаг 7: Ждать и нажать кнопку "Confirm"
        const confirmButton = await waitForButtonWithText('button.btn-primary-vfs.ng-star-inserted', 'Confirm');
        confirmButton.click();

        const endTime = performance.now();
        console.log(`Total time: ${(endTime - startTime).toFixed(2)} ms`);
    } catch (error) {
        console.error('Error:', error);
    }
}
