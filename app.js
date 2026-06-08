let sets = JSON.parse(localStorage.getItem("currentTrainingSets")) || [];

renderSets();

function saveSets() {
    localStorage.setItem("currentTrainingSets", JSON.stringify(sets));
}

function addSet() {
    const exercise = document.getElementById("exercise").value.trim();
    const weight = document.getElementById("weight").value;
    const reps = document.getElementById("reps").value;

    if (!exercise || !weight || !reps) {
        alert("Vul oefening, kg en reps in.");
        return;
    }

    sets.push({
        exercise: exercise,
        weight: Number(weight),
        reps: Number(reps)
    });

    saveSets();
    renderSets();

    document.getElementById("weight").value = "";
    document.getElementById("reps").value = "";
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
            ${index + 1}. ${set.exercise} - ${set.weight} kg x ${set.reps}
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
    const energy = document.getElementById("energy").value || "Niet ingevuld";
    const sleep = document.getElementById("sleep").value || "Niet ingevuld";
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

Energie: ${energy}/10
Slaap: ${sleep}
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

function clearTraining() {
    if (!confirm("Weet je zeker dat je deze training wilt wissen?")) {
        return;
    }

    sets = [];
    localStorage.removeItem("currentTrainingSets");

    document.getElementById("report").value = "";
    document.getElementById("notes").value = "";
    document.getElementById("energy").value = "";
    document.getElementById("sleep").value = "";

    renderSets();
}