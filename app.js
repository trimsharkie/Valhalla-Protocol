let sets =
    JSON.parse(localStorage.getItem("currentTrainingSets")) || [];

let exerciseLibrary =
    JSON.parse(localStorage.getItem("exerciseLibrary")) || {
        Upper: [],
        Lower: [],
        "Full Body": [],
        Cardio: [],
        Custom: []
    };

let trainingHistory =
    JSON.parse(localStorage.getItem("trainingHistory")) || [];

populateExercises();
renderSets();
renderHistory();

document
    .getElementById("trainingType")
    .addEventListener("change", populateExercises);

document
    .getElementById("exercise")
    .addEventListener("change", showLastPerformance);

function saveSets() {
    localStorage.setItem("currentTrainingSets", JSON.stringify(sets));
}

function saveExerciseLibrary() {
    localStorage.setItem("exerciseLibrary", JSON.stringify(exerciseLibrary));
}

function saveHistory() {
    localStorage.setItem("trainingHistory", JSON.stringify(trainingHistory));
}

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
        alert("Vul een oefening in.");
        return;
    }

    if (!exerciseLibrary[trainingType].includes(newExercise)) {
        exerciseLibrary[trainingType].push(newExercise);
        saveExerciseLibrary();
    }

    populateExercises();

    document.getElementById("exercise").value = newExercise;
    document.getElementById("newExercise").value = "";
    document.getElementById("weight").focus();

    showLastPerformance();
}

function deleteExercise() {
    const trainingType = document.getElementById("trainingType").value;
    const exercise = document.getElementById("exercise").value;

    if (!exercise) {
        alert("Selecteer eerst een oefening.");
        return;
    }

    if (!confirm(`Verwijder ${exercise}?`)) {
        return;
    }

    exerciseLibrary[trainingType] =
        exerciseLibrary[trainingType].filter(e => e !== exercise);

    saveExerciseLibrary();
    populateExercises();
}

function addSet() {
    const exercise = document.getElementById("exercise").value;
    const weight = document.getElementById("weight").value;
    const reps = document.getElementById("reps").value;

    if (!exercise || !weight || !reps) {
        alert("Vul oefening, kg en reps in.");
        return;
    }

    const numericWeight = Number(weight);
    const numericReps = Number(reps);

    const highestWeight = getHighestWeight(exercise);

    if (highestWeight === 0) {
    alert(
    `⚔️ Eerste geregistreerde gewicht

    ${exercise}

    Record gezet:
    ${numericWeight} kg`
    );
    }
    else if (numericWeight > highestWeight) {
        alert(
    `🔥 NEW WEIGHT PR ⚔️

    ${exercise}

    Oud record:
    ${highestWeight} kg

    Nieuw record:
    ${numericWeight} kg`
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
    sets.splice(index, 1);
    saveSets();
    renderSets();
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
            ${index + 1}. ${set.exercise} - ${set.weight} kg x ${set.reps}
            <button onclick="deleteSet(${index})">Verwijder</button>
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

Vraag aan ChatGPT:
Geef een eerlijk cijfer, analyse, progressie en advies voor de volgende training.
`;

    document.getElementById("report").value = report.trim();
}

function copyReport() {
    const report = document.getElementById("report").value;

    if (!report) {
        alert("Maak eerst een rapport.");
        return;
    }

    navigator.clipboard.writeText(report)
        .then(() => alert("Rapport gekopieerd!"))
        .catch(() => alert("Kopiëren mislukt."));
}

function saveTraining() {
    if (sets.length === 0) {
        alert("Je hebt nog geen sets toegevoegd.");
        return;
    }

    generateReport();

    const training = {
        date: new Date().toLocaleDateString("nl-NL"),
        trainingType: document.getElementById("trainingType").value,
        sets: [...sets],
        notes: document.getElementById("notes").value || "",
        report: document.getElementById("report").value || ""
    };

    trainingHistory.unshift(training);
    saveHistory();

    alert("Training opgeslagen!");

    clearTraining(false);
    renderHistory();
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
            <button onclick="loadTraining(${index})">Bekijk</button>
            <button onclick="deleteTraining(${index})">Verwijder</button>
        `;

        historyList.appendChild(div);
    });
}

function loadTraining(index) {
    const training = trainingHistory[index];

    sets = [...training.sets];

    document.getElementById("trainingType").value = training.trainingType;
    document.getElementById("notes").value = training.notes;
    document.getElementById("report").value = training.report || "";

    saveSets();
    populateExercises();
    renderSets();

    alert("Training geladen.");
}

function deleteTraining(index) {
    if (!confirm("Deze opgeslagen training verwijderen?")) {
        return;
    }

    trainingHistory.splice(index, 1);
    saveHistory();
    renderHistory();
    showLastPerformance();
}

function clearTraining(askConfirm = true) {
    if (askConfirm) {
        if (!confirm("Weet je zeker dat je deze training wilt wissen?")) {
            return;
        }
    }

    sets = [];

    localStorage.removeItem("currentTrainingSets");

    document.getElementById("report").value = "";
    document.getElementById("notes").value = "";
    renderSets();
}

function showLastPerformance() {
    const exercise = document.getElementById("exercise").value;
    const box = document.getElementById("lastPerformance");

    if (!box) return;

    if (!exercise) {
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