let sets = [];

let exerciseLibrary = {
    Upper: [],
    Lower: [],
    "Full Body": [],
    Cardio: [],
    Custom: []
};

let trainingHistory = [];
let progressChart = null;
let calendarDate = new Date();

let restTimerInterval = null;
let restSeconds = 90;

function getUserKey(key) {
    if (!window.currentUser) {
        return key;
    }

    return `${key}_${window.currentUser.uid}`;
}

document
    .getElementById("trainingType")
    .addEventListener("change", populateExercises);

document
    .getElementById("exercise")
    .addEventListener("change", showLastPerformance);

function saveSets() {
    localStorage.setItem(
        getUserKey("currentTrainingSets"),
        JSON.stringify(sets)
    );
}

function saveExerciseLibrary() {
    localStorage.setItem(
        getUserKey("exerciseLibrary"),
        JSON.stringify(exerciseLibrary)
    );
}

function saveHistory() {
    localStorage.setItem(
        getUserKey("trainingHistory"),
        JSON.stringify(trainingHistory)
    );
}

window.loadUserData = function () {
    sets =
        JSON.parse(localStorage.getItem(getUserKey("currentTrainingSets"))) || [];

    exerciseLibrary =
        JSON.parse(localStorage.getItem(getUserKey("exerciseLibrary"))) || {
            Upper: [],
            Lower: [],
            "Full Body": [],
            Cardio: [],
            Custom: []
        };

    trainingHistory =
        JSON.parse(localStorage.getItem(getUserKey("trainingHistory"))) || [];

    populateExercises();
    renderSets();
    renderHistory();
    renderRecords();
    populateProgressExercises();
    renderProgress();
    renderCalendar();
    showLastPerformance();

};

function populateExercises() {
    const dropdown = document.getElementById("exercise");
    const trainingType = document.getElementById("trainingType").value;

    dropdown.innerHTML = "";

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Kies een oefening";
    dropdown.appendChild(defaultOption);

    exerciseLibrary[trainingType].forEach(exercise => {
        const option = document.createElement("option");
        option.value = exercise;
        option.textContent = exercise;
        dropdown.appendChild(option);
    });

    showLastPerformance();
}

function addExercise() {
    const trainingType = document.getElementById("trainingType").value;
    const newExercise = document.getElementById("newExercise").value.trim();

    if (!newExercise) {
        showToast("Vul een oefening in.");
        return;
    }

    if (!exerciseLibrary[trainingType].includes(newExercise)) {
        exerciseLibrary[trainingType].push(newExercise);
        saveExerciseLibrary();
    }

    populateExercises();
    populateProgressExercises();

    document.getElementById("exercise").value = newExercise;
    document.getElementById("newExercise").value = "";
    document.getElementById("weight").focus();

    showLastPerformance();
}

function deleteExercise() {
    const trainingType = document.getElementById("trainingType").value;
    const exercise = document.getElementById("exercise").value;

    if (!exercise) {
        showToast("Selecteer eerst een oefening.");
        return;
    }

    if (!confirm(`Verwijder ${exercise}?`)) {
        return;
    }

    exerciseLibrary[trainingType] =
        exerciseLibrary[trainingType].filter(e => e !== exercise);

    saveExerciseLibrary();
    populateExercises();
    populateProgressExercises();
}

function addSet() {
    const exercise = document.getElementById("exercise").value;
    const weight = document.getElementById("weight").value;
    const reps = document.getElementById("reps").value;

    if (!exercise || !weight || !reps) {
        showToast("Vul oefening, kg en reps in.");
        return;
    }

    const numericWeight = Number(weight);
    const numericReps = Number(reps);

    const highestWeight = getHighestWeight(exercise);

    if (highestWeight === 0) {
        showToast(`${exercise} eerste record: ${numericWeight} kg`);
    } else if (numericWeight > highestWeight) {
        showToast(`${exercise} PR! ${highestWeight} → ${numericWeight} kg`);
    }

    sets.push({
        exercise: exercise,
        weight: numericWeight,
        reps: numericReps
    });

    saveSets();
    renderSets();

    document.getElementById("weight").value = "";
    document.getElementById("reps").value = "";
    document.getElementById("weight").focus();
}

function deleteSet(index) {
    sets.splice(index, 1);
    saveSets();
    renderSets();
}

function editSet(index) {

    const set = sets[index];

    document.getElementById("exercise").value =
        set.exercise;

    document.getElementById("weight").value =
        set.weight;

    document.getElementById("reps").value =
        set.reps;

    sets.splice(index, 1);

    saveSets();
    renderSets();

    document.getElementById("weight").focus();
}

function renderSets() {
    const setList = document.getElementById("setList");

    if (sets.length === 0) {
        setList.innerHTML = "<p>Nog geen sets toegevoegd.</p>";
        return;
    }

    setList.innerHTML = "";

    sets.forEach((set, index) => {
        const div = document.createElement("div");
        div.className = "set-item";

        div.innerHTML = `
            <strong>
            ${index + 1}. ${set.exercise}
            </strong>
            <br>
            ${set.weight} kg x ${set.reps}

        <div class="set-actions">
            <button onclick="editSet(${index})">
               Bewerken
            </button>

        <button onclick="deleteSet(${index})">
            Verwijder
        </button>
    </div>
`;
        setList.appendChild(div);
    });
}

function groupSetsByExercise() {
    const grouped = {};

    sets.forEach(set => {
        if (!grouped[set.exercise]) {
            grouped[set.exercise] = [];
        }

        grouped[set.exercise].push(`${set.weight} kg x ${set.reps}`);
    });

    return grouped;
}

function generateReport() {
    const trainingType = document.getElementById("trainingType").value;
    const notes = document.getElementById("notes").value || "Geen opmerkingen";

    const grouped = groupSetsByExercise();

    let exerciseText = "";

    Object.keys(grouped).forEach(exercise => {
        exerciseText += `\n${exercise}:\n`;

        grouped[exercise].forEach(setText => {
            exerciseText += `- ${setText}\n`;
        });
    });

    const report = `
Training: ${trainingType}
Datum: ${new Date().toLocaleDateString("nl-NL")}

Oefeningen:
${exerciseText}

Opmerkingen: ${notes}
`;

    return report.trim();
}

function saveTraining() {
    if (sets.length === 0) {
        showToast("Je hebt nog geen sets toegevoegd.");
        return;
    }

    const report = generateReport();

    const training = {
        date: new Date().toLocaleDateString("nl-NL"),
        trainingType: document.getElementById("trainingType").value,
        sets: [...sets],
        notes: document.getElementById("notes").value || "",
        report: report
    };

    trainingHistory.unshift(training);
    saveHistory();

    showToast("Training opgeslagen!");

    clearTraining(false);
    renderHistory();
    renderRecords();
    populateProgressExercises();
    renderProgress();
    renderCalendar();
    showLastPerformance();
}

function renderHistory() {
    const historyList = document.getElementById("historyList");

    if (!historyList) return;

    if (trainingHistory.length === 0) {
        historyList.innerHTML = "<p>Nog geen trainingen opgeslagen.</p>";
        return;
    }

    historyList.innerHTML = "";

    trainingHistory.forEach((training, index) => {
        const div = document.createElement("div");
        div.className = "history-item";

        div.innerHTML = `
            <strong>${training.date} - ${training.trainingType}</strong><br>
            Sets: ${training.sets.length}<br>

            <button onclick="toggleHistoryDetails(${index})">
                Bekijk Rapport
            </button>

            <button onclick="deleteTraining(${index})">
                Verwijder
            </button>

            <div id="historyDetails-${index}" class="history-details" style="display:none;"></div>
        `;

        historyList.appendChild(div);
    });
}

function toggleHistoryDetails(index) {
    const training = trainingHistory[index];
    const details = document.getElementById(`historyDetails-${index}`);

    if (!details) return;

    if (details.style.display === "block") {
        details.style.display = "none";
        details.innerHTML = "";
        return;
    }

    const grouped = {};

    training.sets.forEach(set => {
        if (!grouped[set.exercise]) {
            grouped[set.exercise] = [];
        }

        grouped[set.exercise].push(set);
    });

    let html = `<div class="history-report">`;

    Object.keys(grouped).forEach(exercise => {
        html += `
            <div class="history-exercise">
                <strong>${exercise}</strong>
        `;

        grouped[exercise].forEach(set => {
            html += `
                <div>${set.weight} kg x ${set.reps}</div>
            `;
        });

        html += `</div>`;
    });

    if (training.notes) {
        html += `
            <div class="history-notes">
                <strong>Opmerking</strong><br>
                ${training.notes}
            </div>
        `;
    }

    html += `</div>`;

    details.innerHTML = html;
    details.style.display = "block";
}

function deleteTraining(index) {
    if (!confirm("Deze opgeslagen training verwijderen?")) {
        return;
    }

    trainingHistory.splice(index, 1);
    saveHistory();

    renderHistory();
    renderRecords();
    populateProgressExercises();
    renderProgress();
    renderCalendar();
    showLastPerformance();
}

function clearTraining(askConfirm = true) {
    if (askConfirm) {
        if (!confirm("Weet je zeker dat je deze training wilt wissen?")) {
            return;
        }
    }

    sets = [];

    localStorage.removeItem(getUserKey("currentTrainingSets"));

    document.getElementById("notes").value = "";

    renderSets();
}

function showLastPerformance() {
    const exercise = document.getElementById("exercise").value;
    const box = document.getElementById("lastPerformance");

    if (!box) return;

    if (!exercise) {
        box.style.display = "none";
        box.innerHTML = "";
        return;
}


    const lastTraining =
        trainingHistory.find(training =>
            training.sets.some(set => set.exercise === exercise)
        );

    if (!lastTraining) {
        box.innerHTML = "⚔️ Nog geen eerdere prestaties.";
        return;
    }

    const exerciseSets =
        lastTraining.sets.filter(set => set.exercise === exercise);

    let html = `<strong>⚔️ Laatste keer:</strong><br>`;

    exerciseSets.forEach(set => {
        html += `${set.weight} kg x ${set.reps}<br>`;
    });

    html += `<small>${lastTraining.date}</small>`;

    box.innerHTML = html;
    box.style.display = "block";
}


function getHighestWeight(exercise) {
    let highestWeight = 0;

    trainingHistory.forEach(training => {
        training.sets.forEach(set => {
            if (set.exercise === exercise && set.weight > highestWeight) {
                highestWeight = set.weight;
            }
        });
    });

    sets.forEach(set => {
        if (set.exercise === exercise && set.weight > highestWeight) {
            highestWeight = set.weight;
        }
    });

    return highestWeight;
}

function showTab(tabId) {
    document.getElementById("trainingTab").style.display = "none";
    document.getElementById("historyTab").style.display = "none";
    document.getElementById("recordsTab").style.display = "none";
    document.getElementById("progressTab").style.display = "none";
    document.getElementById("calendarTab").style.display = "none";

    document.getElementById(tabId).style.display = "block";
}

function renderRecords() {
    const recordsList = document.getElementById("recordsList");

    if (!recordsList) return;

    const records = {};

    trainingHistory.forEach(training => {
        training.sets.forEach(set => {
            if (
                !records[set.exercise] ||
                set.weight > records[set.exercise]
            ) {
                records[set.exercise] = set.weight;
            }
        });
    });

    let html = "";

    Object.keys(records)
        .sort()
        .forEach(exercise => {
            html += `
                <div class="record-item">
                    🏆 ${exercise} - ${records[exercise]} kg
                </div>
            `;
        });

    if (html === "") {
        html = "<p>Nog geen records beschikbaar.</p>";
    }

    recordsList.innerHTML = html;
}

function populateProgressExercises() {
    const dropdown = document.getElementById("progressExercise");

    if (!dropdown) return;

    const currentValue = dropdown.value;
    const exercises = new Set();

    trainingHistory.forEach(training => {
        training.sets.forEach(set => {
            exercises.add(set.exercise);
        });
    });

    Object.keys(exerciseLibrary).forEach(trainingType => {
        exerciseLibrary[trainingType].forEach(exercise => {
            exercises.add(exercise);
        });
    });

    dropdown.innerHTML = "";

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Kies een oefening";
    dropdown.appendChild(defaultOption);

    Array.from(exercises)
        .sort()
        .forEach(exercise => {
            const option = document.createElement("option");
            option.value = exercise;
            option.textContent = exercise;
            dropdown.appendChild(option);
        });

    dropdown.value = currentValue;
}

function renderProgress() {
    const selectedExercise =
        document.getElementById("progressExercise")?.value;

    const progressList =
        document.getElementById("progressList");

    if (!progressList) return;

    if (!selectedExercise) {
        progressList.innerHTML =
            "<p>Kies een oefening om progressie te bekijken.</p>";

        clearProgressChart();
        return;
    }

    const weeklyProgress = {};

    trainingHistory.forEach(training => {
        const setsForExercise =
            training.sets.filter(set =>
                set.exercise === selectedExercise
            );

        if (setsForExercise.length === 0) return;

        const bestWeight =
            Math.max(...setsForExercise.map(set => set.weight));

        const trainingDate =
            parseDutchDate(training.date);

        const weekKey =
            getWeekKey(trainingDate);

        if (
            !weeklyProgress[weekKey] ||
            bestWeight > weeklyProgress[weekKey].weight
        ) {
            weeklyProgress[weekKey] = {
                date: weekKey,
                weight: bestWeight
            };
        }
    });

    const progressData =
        Object.values(weeklyProgress);

    progressData.sort((a, b) =>
        a.date.localeCompare(b.date)
    );

    if (progressData.length === 0) {
        progressList.innerHTML =
            "<p>Geen progressie gevonden.</p>";

        clearProgressChart();
        return;
    }

    let html = `
        <h3>${selectedExercise}</h3>
        <div class="progress-list">
    `;

    progressData.forEach(entry => {
        html += `
            <div class="progress-item">
                📅 ${entry.date} - 🏆 ${entry.weight} kg
            </div>
        `;
    });

    html += "</div>";

    progressList.innerHTML = html;

    renderProgressChart(selectedExercise, progressData);
}

function renderProgressChart(selectedExercise, progressData) {
    const ctx =
        document.getElementById("progressChart");

    if (!ctx) return;

    if (typeof Chart === "undefined") {
        console.warn("Chart.js is niet geladen.");
        return;
    }

    if (progressChart) {
        progressChart.destroy();
    }

    progressChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: progressData.map(x => x.date),
            datasets: [{
                label: selectedExercise,
                data: progressData.map(x => x.weight),
                borderWidth: 3,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function clearProgressChart() {
    if (progressChart) {
        progressChart.destroy();
        progressChart = null;
    }
}

function parseDutchDate(dateString) {
    const parts = dateString.split("-");

    return new Date(
        Number(parts[2]),
        Number(parts[1]) - 1,
        Number(parts[0])
    );
}

function getWeekKey(date) {
    const tempDate =
        new Date(Date.UTC(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
        ));

    const dayNumber =
        tempDate.getUTCDay() || 7;

    tempDate.setUTCDate(
        tempDate.getUTCDate() + 4 - dayNumber
    );

    const yearStart =
        new Date(Date.UTC(
            tempDate.getUTCFullYear(),
            0,
            1
        ));

    const weekNumber =
        Math.ceil(
            (((tempDate - yearStart) / 86400000) + 1) / 7
        );

    return `${tempDate.getUTCFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
}

function changeCalendarMonth(direction) {
    calendarDate.setMonth(calendarDate.getMonth() + direction);
    renderCalendar();
}

function renderCalendar() {
    const calendar =
        document.getElementById("calendar");

    const calendarTitle =
        document.getElementById("calendarTitle");

    if (!calendar || !calendarTitle) return;

    const year =
        calendarDate.getFullYear();

    const month =
        calendarDate.getMonth();

    const monthName =
        calendarDate.toLocaleDateString("nl-NL", {
            month: "long",
            year: "numeric"
        });

    calendarTitle.textContent =
        monthName.charAt(0).toUpperCase() +
        monthName.slice(1);

    const firstDay =
        new Date(year, month, 1);

    const lastDay =
        new Date(year, month + 1, 0);

    const daysInMonth =
        lastDay.getDate();

    let startDay =
        firstDay.getDay();

    if (startDay === 0) {
        startDay = 7;
    }

const trainingByDate = {};

trainingHistory.forEach(training => {

    const normalizedDate =
        normalizeDateString(training.date);

    if (!trainingByDate[normalizedDate]) {
        trainingByDate[normalizedDate] = [];
    }

    trainingByDate[normalizedDate]
        .push(training.trainingType);

});

    let html = `
        <div class="calendar-grid calendar-header">
            <div>Ma</div>
            <div>Di</div>
            <div>Wo</div>
            <div>Do</div>
            <div>Vr</div>
            <div>Za</div>
            <div>Zo</div>
        </div>

        <div class="calendar-grid">
    `;

    for (let i = 1; i < startDay; i++) {
        html += `
            <div class="calendar-day empty"></div>
        `;
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateString =
            `${String(day).padStart(2, "0")}-${String(month + 1).padStart(2, "0")}-${year}`;

        const trainingsForDay =
            trainingByDate[dateString] || [];

        const hasTraining =
            trainingsForDay.length > 0;

        const labels =
            [...new Set(trainingsForDay)]
                .map(type => {

                    if (type === "Upper") return "U";
                    if (type === "Lower") return "L";
                    if (type === "Full Body") return "F";
                    if (type === "Cardio") return "C";
                    if (type === "Custom") return "X";

            return "?";

        }).join(" ");

        html += `
            <div
                class="calendar-day ${hasTraining ? "trained" : ""}"
                onclick="showCalendarDetails('${dateString}')"
            >
                <span>${day}</span>
                ${hasTraining ? `<strong>${labels}</strong>` : ""}
            </div>
        `;
    }

    html += `
        </div>
    `;

    calendar.innerHTML = html;
}

function normalizeDateString(dateString) {
    const parts = dateString.split("-");

    const day =
        String(Number(parts[0])).padStart(2, "0");

    const month =
        String(Number(parts[1])).padStart(2, "0");

    const year =
        parts[2];

    return `${day}-${month}-${year}`;
}

function showCalendarDetails(dateString) {

    const details =
        document.getElementById("calendarDetails");

    if (!details) return;

    const trainings =
        trainingHistory.filter(training =>
            normalizeDateString(training.date) === dateString
        );

    if (trainings.length === 0) {

        details.innerHTML = `
            <h3>📅 ${dateString}</h3>
            <p>Geen training opgeslagen.</p>
        `;

        return;
    }

    let html = `
        <h3>📅 ${dateString}</h3>
    `;

    trainings.forEach(training => {

        html += `
            <div class="calendar-training">
                <h4>⚔️ ${training.trainingType}</h4>
        `;

    let lastExercise = "";

    training.sets.forEach(set => {

        if (lastExercise && lastExercise !== set.exercise) {
            html += `<br>`;
        }

    html += `
        <div>
            ${set.exercise} -
            ${set.weight} kg x ${set.reps}
        </div>
    `;

    lastExercise = set.exercise;
});

        if (training.notes) {

            html += `
                <p>
                    <strong>📝 Opmerking:</strong><br>
                    ${training.notes}
                </p>
            `;
        }

        html += `
            </div>
        `;

    });

    details.innerHTML = html;
}

function showToast(message) {
    const toast = document.getElementById("toast");

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}
function startRestTimer(seconds = 90) {
    const timerBox = document.getElementById("restTimer");
    const timerText = document.getElementById("restTime");

    if (!timerBox || !timerText) return;

    clearInterval(restTimerInterval);

    restSeconds = seconds;
    timerText.textContent = restSeconds;
    timerBox.style.display = "block";

    restTimerInterval = setInterval(() => {
        restSeconds--;
        timerText.textContent = restSeconds;

        if (restSeconds <= 0) {
            clearInterval(restTimerInterval);
            restTimerInterval = null;
            timerBox.style.display = "none";
            showToast("Rust klaar");
        }
    }, 1000);
}

function editExercise() {

    const oldExercise =
        document.getElementById("exercise").value;

    if (!oldExercise) {
        showToast("Selecteer eerst een oefening.");
        return;
    }

    const newExercise = prompt(
        "Nieuwe naam:",
        oldExercise
    );

    if (!newExercise) return;

    const exercises =
        JSON.parse(localStorage.getItem(getUserKey("exercises"))) || [];

    const index =
        exercises.indexOf(oldExercise);

    if (index === -1) return;

    exercises[index] = newExercise;

    localStorage.setItem(
        getUserKey("exercises"),
        JSON.stringify(exercises)
    );

    populateExercises();

    showToast("Oefening aangepast.");
}