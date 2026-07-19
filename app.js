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
let exerciseMeta = {};
let editingSetIndex = null;

function getUserKey(key) {
    if (!window.currentUser) return key;
    return `${key}_${window.currentUser.uid}`;
}

function saveSets() {
    localStorage.setItem(getUserKey("currentTrainingSets"), JSON.stringify(sets));
    syncAllDataToCloud();
}

function saveExerciseLibrary() {
    localStorage.setItem(getUserKey("exerciseLibrary"), JSON.stringify(exerciseLibrary));
    syncAllDataToCloud();
}

function saveHistory() {
    localStorage.setItem(getUserKey("trainingHistory"), JSON.stringify(trainingHistory));
    syncAllDataToCloud();
}

function saveExerciseMeta() {
    localStorage.setItem(getUserKey("exerciseMeta"), JSON.stringify(exerciseMeta));
    syncAllDataToCloud();
}

function getExerciseMeta(exercise) {
    if (!exerciseMeta[exercise]) {
        exerciseMeta[exercise] = { perSide: false };
    }

    return exerciseMeta[exercise];
}

function formatWeight(exercise, weight) {
    const meta = getExerciseMeta(exercise);

    if (meta.perSide) {
        return `${weight} kg per kant`;
    }

    return `${weight} kg`;
}

function updateExerciseWeightCheckbox() {
    const exercise = document.getElementById("exercise")?.value;
    const checkbox = document.getElementById("exercisePerSide");

    if (!checkbox) return;

    if (!exercise) {
        checkbox.checked = false;
        return;
    }

    checkbox.checked = !!getExerciseMeta(exercise).perSide;
}

function saveExerciseWeightType() {
    const exercise = document.getElementById("exercise").value;
    const perSide = document.getElementById("exercisePerSide").checked;

    if (!exercise) {
        showToast("Selecteer eerst een oefening.");
        return;
    }

    exerciseMeta[exercise] = {
        perSide: perSide
    };

    saveExerciseMeta();

    renderSets();
    renderHistory();
    renderRecords();
    renderProgress();
    renderCalendar();
    showLastPerformance();
}

window.loadUserData = async function () {
    const localSets =
        JSON.parse(localStorage.getItem(getUserKey("currentTrainingSets"))) || [];

    const localExerciseLibrary =
        JSON.parse(localStorage.getItem(getUserKey("exerciseLibrary"))) || {
            Upper: [],
            Lower: [],
            "Full Body": [],
            Cardio: [],
            Custom: []
        };

    const localTrainingHistory =
        JSON.parse(localStorage.getItem(getUserKey("trainingHistory"))) || [];

    const localExerciseMeta =
        JSON.parse(localStorage.getItem(getUserKey("exerciseMeta"))) || {};

    let cloudData = null;

    if (typeof window.loadCloudData === "function") {
        try {
            cloudData = await window.loadCloudData();
        } catch (error) {
            console.error("Cloud data laden mislukt:", error);
            showToast("Cloud laden mislukt. Lokale data gebruikt.");
        }
    }

    if (cloudData) {
        sets = cloudData.currentTrainingSets || localSets;
        exerciseLibrary = cloudData.exerciseLibrary || localExerciseLibrary;
        trainingHistory = cloudData.trainingHistory || localTrainingHistory;
        exerciseMeta = cloudData.exerciseMeta || localExerciseMeta;
    } else {
        sets = localSets;
        exerciseLibrary = localExerciseLibrary;
        trainingHistory = localTrainingHistory;
        exerciseMeta = localExerciseMeta;

        await syncAllDataToCloud();
    }

    saveAllLocalData();

    populateExercises();
    renderSets();
    renderHistory();
    renderRecords();
    populateProgressExercises();
    renderProgress();
    renderCalendar();
    showLastPerformance();
};

function saveAllLocalData() {
    localStorage.setItem(getUserKey("currentTrainingSets"), JSON.stringify(sets));
    localStorage.setItem(getUserKey("exerciseLibrary"), JSON.stringify(exerciseLibrary));
    localStorage.setItem(getUserKey("trainingHistory"), JSON.stringify(trainingHistory));
    localStorage.setItem(getUserKey("exerciseMeta"), JSON.stringify(exerciseMeta));
}

async function syncAllDataToCloud() {
    if (typeof window.saveCloudData !== "function") return;

    try {
        await window.saveCloudData({
            currentTrainingSets: sets,
            exerciseLibrary: exerciseLibrary,
            trainingHistory: trainingHistory,
            exerciseMeta: exerciseMeta
        });
    } catch (error) {
        console.error("Cloud sync mislukt:", error);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document
        .getElementById("trainingType")
        ?.addEventListener("change", populateExercises);

    document
        .getElementById("exercise")
        ?.addEventListener("change", () => {
            updateExerciseWeightCheckbox();
            showLastPerformance();
        });

    document
        .getElementById("exercisePerSide")
        ?.addEventListener("change", saveExerciseWeightType);
});

function populateExercises() {
    const dropdown = document.getElementById("exercise");
    const trainingType = document.getElementById("trainingType").value;

    if (!dropdown) return;

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

    updateExerciseWeightCheckbox();
    showLastPerformance();
}

function addExercise() {
    const trainingType = document.getElementById("trainingType").value;
    const newExercise = document.getElementById("newExercise").value.trim();
    const perSide = document.getElementById("exercisePerSide")?.checked || false;

    if (!newExercise) {
        showToast("Vul een oefening in.");
        return;
    }

    if (!exerciseLibrary[trainingType].includes(newExercise)) {
        exerciseLibrary[trainingType].push(newExercise);
        saveExerciseLibrary();
    }

    exerciseMeta[newExercise] = {
        perSide: perSide
    };

    saveExerciseMeta();

    populateExercises();
    populateProgressExercises();

    document.getElementById("exercise").value = newExercise;
    document.getElementById("newExercise").value = "";
    document.getElementById("weight").focus();

    updateExerciseWeightCheckbox();
    showLastPerformance();

    showToast("Oefening toegevoegd.");
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

    delete exerciseMeta[exercise];

    saveExerciseLibrary();
    saveExerciseMeta();

    populateExercises();
    populateProgressExercises();
    renderSets();
    renderHistory();
    renderRecords();
    renderProgress();
    renderCalendar();
    showLastPerformance();

    showToast("Oefening verwijderd.");
}

function editExercise() {
    const trainingType = document.getElementById("trainingType").value;
    const oldExercise = document.getElementById("exercise").value;

    if (!oldExercise) {
        showToast("Selecteer eerst een oefening.");
        return;
    }

    const newExercise = prompt("Nieuwe naam:", oldExercise);

    if (!newExercise || !newExercise.trim()) return;

    const cleanNewExercise = newExercise.trim();

    if (exerciseLibrary[trainingType].includes(cleanNewExercise)) {
        showToast("Deze oefening bestaat al.");
        return;
    }

    const index = exerciseLibrary[trainingType].indexOf(oldExercise);

    if (index === -1) {
        showToast("Oefening niet gevonden.");
        return;
    }

    exerciseLibrary[trainingType][index] = cleanNewExercise;

    sets.forEach(set => {
        if (set.exercise === oldExercise) {
            set.exercise = cleanNewExercise;
        }
    });

    trainingHistory.forEach(training => {
        training.sets.forEach(set => {
            if (set.exercise === oldExercise) {
                set.exercise = cleanNewExercise;
            }
        });
    });

    exerciseMeta[cleanNewExercise] = getExerciseMeta(oldExercise);
    delete exerciseMeta[oldExercise];

    saveExerciseLibrary();
    saveExerciseMeta();
    saveSets();
    saveHistory();

    populateExercises();
    populateProgressExercises();

    document.getElementById("exercise").value = cleanNewExercise;

    renderSets();
    renderHistory();
    renderRecords();
    renderProgress();
    renderCalendar();
    showLastPerformance();

    showToast("Oefening aangepast.");
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

    if (numericWeight <= 0 || numericReps <= 0) {
        showToast("Gewicht en reps moeten hoger zijn dan 0.");
        return;
    }

    if (editingSetIndex !== null) {
        sets[editingSetIndex] = {
            exercise: exercise,
            weight: numericWeight,
            reps: numericReps
        };

        saveSets();
        renderSets();
        resetSetForm();

        showToast("Set aangepast.");
        return;
    }

    const highestWeight = getHighestWeight(exercise);

    if (highestWeight === 0) {
        showToast(
            `${exercise} eerste record: ${formatWeight(exercise, numericWeight)}`
        );
    } else if (numericWeight > highestWeight) {
        showToast(
            `${exercise} PR! ${formatWeight(exercise, highestWeight)} → ${formatWeight(exercise, numericWeight)}`
        );
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
    if (!confirm("Deze set verwijderen?")) {
        return;
    }

    sets.splice(index, 1);

    if (editingSetIndex === index) {
        resetSetForm();
    } else if (
        editingSetIndex !== null &&
        index < editingSetIndex
    ) {
        editingSetIndex--;
    }

    saveSets();
    renderSets();

    showToast("Set verwijderd.");
}

function editSet(index) {
    const set = sets[index];

    if (!set) {
        showToast("Set niet gevonden.");
        return;
    }

    editingSetIndex = index;

    const trainingType = findTrainingTypeForExercise(set.exercise);

    if (trainingType) {
        document.getElementById("trainingType").value = trainingType;
        populateExercises();
    }

    document.getElementById("exercise").value = set.exercise;
    document.getElementById("weight").value = set.weight;
    document.getElementById("reps").value = set.reps;

    updateExerciseWeightCheckbox();
    showLastPerformance();

    const addSetBtn = document.getElementById("addSetBtn");
    const cancelEditSetBtn = document.getElementById("cancelEditSetBtn");

    if (addSetBtn) {
        addSetBtn.textContent = "Set bijwerken";
    }

    if (cancelEditSetBtn) {
        cancelEditSetBtn.style.display = "block";
    }

    document.getElementById("weight").focus();
    document.getElementById("weight").scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

function renderSets() {
    const setList = document.getElementById("setList");

    if (!setList) return;

    if (sets.length === 0) {
        setList.innerHTML = "<p>Nog geen sets toegevoegd.</p>";
        return;
    }

    setList.innerHTML = "";

    sets.forEach((set, index) => {
        const div = document.createElement("div");
        div.className = "set-item";

        div.innerHTML = `
            <strong>${index + 1}. ${set.exercise}</strong>
            <br>
            ${formatWeight(set.exercise, set.weight)} x ${set.reps}

            <div class="set-actions">
                <button onclick="editSet(${index})">Bewerken</button>
                <button onclick="deleteSet(${index})">Verwijder</button>
            </div>
        `;

        setList.appendChild(div);
    });
}

function cancelEditSet() {
    resetSetForm();
    showToast("Bewerken geannuleerd.");
}

function resetSetForm() {
    editingSetIndex = null;

    document.getElementById("weight").value = "";
    document.getElementById("reps").value = "";

    const addSetBtn = document.getElementById("addSetBtn");
    const cancelEditSetBtn = document.getElementById("cancelEditSetBtn");

    if (addSetBtn) {
        addSetBtn.textContent = "Set toevoegen";
    }

    if (cancelEditSetBtn) {
        cancelEditSetBtn.style.display = "none";
    }

    document.getElementById("weight").focus();
}

function findTrainingTypeForExercise(exercise) {
    for (const trainingType of Object.keys(exerciseLibrary)) {
        if (exerciseLibrary[trainingType].includes(exercise)) {
            return trainingType;
        }
    }

    return null;
}

function groupSetsByExercise() {
    const grouped = {};

    sets.forEach(set => {
        if (!grouped[set.exercise]) {
            grouped[set.exercise] = [];
        }

        grouped[set.exercise].push(
            `${formatWeight(set.exercise, set.weight)} x ${set.reps}`
        );
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
                <div>${formatWeight(set.exercise, set.weight)} x ${set.reps}</div>
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
    editingSetIndex = null;

    localStorage.removeItem(getUserKey("currentTrainingSets"));

    document.getElementById("notes").value = "";

    resetSetForm();
    renderSets();

    syncAllDataToCloud();
}

function showLastPerformance() {
    const exercise = document.getElementById("exercise")?.value;
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
        box.style.display = "block";
        return;
    }

    const exerciseSets =
        lastTraining.sets.filter(set => set.exercise === exercise);

    let html = `<strong>⚔️ Laatste keer:</strong><br>`;

    exerciseSets.forEach(set => {
        html += `${formatWeight(set.exercise, set.weight)} x ${set.reps}<br>`;
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
    document.getElementById("settingsTab").style.display = "none";

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
                    🏆 ${exercise} - ${formatWeight(exercise, records[exercise])}
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
                📅 ${entry.date} - 🏆 ${formatWeight(selectedExercise, entry.weight)}
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
    const separator = dateString.includes("-") ? "-" : "/";
    const parts = dateString.split(separator);

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

        trainingByDate[normalizedDate].push(training.trainingType);
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
    const separator = dateString.includes("-") ? "-" : "/";
    const parts = dateString.split(separator);

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
                    ${formatWeight(set.exercise, set.weight)} x ${set.reps}
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