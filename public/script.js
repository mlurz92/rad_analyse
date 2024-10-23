// Aktualisierte API-Endpunkt-URLs mit dem Pfad /rad_analyse
const FILTER_API_URL = '/rad_analyse/api/filter';
const FILTER_OPTIONS_URL = '/rad_analyse/api/filters';
const UPLOAD_API_URL = '/rad_analyse/upload';

// DOM-Elemente
const toggleUpload = document.getElementById('toggle-upload');
const uploadSection = document.getElementById('upload');
const uploadForm = document.getElementById('upload-form');
const uploadResult = document.getElementById('upload-result');
const filterForm = document.getElementById('filter-form');
const filterBtn = document.getElementById('filter-btn');
const resetFilterBtn = document.getElementById('reset-filter-btn');
const statistikContainer = document.getElementById('statistik-container');
const loadingSpinner = document.getElementById('loading-spinner');

// Event Listener zum Ausklappen/Einblenden des Upload-Formulars
toggleUpload.addEventListener('click', (e) => {
    e.preventDefault();
    uploadSection.classList.toggle('hidden');
});

// Funktion zum Abrufen der Filteroptionen von der API
async function fetchFilterOptions() {
    try {
        const response = await fetch(FILTER_OPTIONS_URL);
        if (!response.ok) {
            throw new Error('Fehler beim Laden der Filteroptionen');
        }
        const filterOptions = await response.json();
        populateFilterDropdowns(filterOptions);
    } catch (error) {
        console.error(error);
        alert('Fehler beim Laden der Filteroptionen.');
    }
}

// Funktion zum Befüllen der Filter-Dropdowns
function populateFilterDropdowns(filterOptions) {
    for (const [field, values] of Object.entries(filterOptions)) {
        const select = document.getElementById(`${field}-select`);
        if (select) {
            select.innerHTML = ''; // Vorherige Optionen löschen
            values.forEach(value => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = value;
                select.appendChild(option);
            });
        }
    }
}

// Event Listener für den Upload-Formular-Submit
uploadForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const fileInput = document.getElementById('jsonFile');
    const file = fileInput.files[0];

    if (file) {
        const formData = new FormData();
        formData.append('jsonFile', file);

        // Anzeigen des Lade-Spinners
        displayLoading(true);

        fetch(UPLOAD_API_URL, {
            method: 'POST',
            body: formData
        })
            .then(async response => {
                const text = await response.text();
                if (!response.ok) {
                    throw new Error(text || 'Fehler beim Hochladen der Datei.');
                }
                return text;
            })
            .then(data => {
                uploadResult.style.color = '#03dac6'; // Erfolgsfarbe
                uploadResult.innerText = data;
                uploadForm.reset();
                applyFilters(); // Nach dem Upload automatisch filtern
            })
            .catch(error => {
                console.error('Fehler beim Hochladen der Datei:', error);
                uploadResult.style.color = '#cf6679'; // Fehlerfarbe
                uploadResult.innerText = `Fehler: ${error.message}`;
            })
            .finally(() => {
                displayLoading(false);
            });
    } else {
        alert('Bitte wählen Sie eine Datei aus.');
    }
});

// Event Listener für den Filter-Formular-Submit
filterForm.addEventListener('submit', function (e) {
    e.preventDefault();
    applyFilters();
});

// Event Listener für das Zurücksetzen der Filter
resetFilterBtn.addEventListener('click', function () {
    filterForm.reset();
    applyFilters();
});

// Funktion zur Anwendung von Filtern
function applyFilters() {
    const filterCriteria = {};

    // Durchgehen aller Filtergruppen
    const filterGroups = filterForm.querySelectorAll('.filter-group');
    filterGroups.forEach(group => {
        const input = group.querySelector('input[type="text"]');
        const select = group.querySelector('select[multiple]');

        const fieldName = select.name;

        // Text-Filter
        if (input.value.trim() !== '') {
            filterCriteria[fieldName] = input.value.trim();
        }

        // Dropdown-Filter
        const selectedOptions = Array.from(select.selectedOptions).map(option => option.value);
        if (selectedOptions.length > 0) {
            // Mehrere Auswahlmöglichkeiten werden als Array gesendet
            filterCriteria[fieldName] = selectedOptions;
        }
    });

    const queryString = new URLSearchParams(filterCriteria).toString();

    // Anzeigen des Lade-Spinners
    displayLoading(true);

    fetch(`${FILTER_API_URL}?${queryString}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Fehler beim Abrufen der Daten');
            }
            return response.json();
        })
        .then(data => {
            displayStatistics(data);
        })
        .catch(error => {
            console.error('Fehler beim Abrufen der Daten:', error);
            alert('Fehler beim Abrufen der Daten. Bitte versuchen Sie es erneut.');
        })
        .finally(() => {
            displayLoading(false);
        });
}

// Funktion zur Anzeige der Statistiken
function displayStatistics(data) {
    statistikContainer.innerHTML = '';

    if (data.length === 0) {
        const noData = document.createElement('div');
        noData.classList.add('statistik-item');
        noData.innerHTML = `<h3>Keine Untersuchungen gefunden.</h3>`;
        statistikContainer.appendChild(noData);
        return;
    }

    // Anzahl der Untersuchungen
    const totalInvestigations = data.length;
    const totalElement = document.createElement('div');
    totalElement.classList.add('statistik-item');
    totalElement.innerHTML = `<h3>Anzahl der Untersuchungen:</h3><p>${totalInvestigations}</p>`;
    statistikContainer.appendChild(totalElement);

    // Funktion zur Gruppierung nach Feld
    function groupBy(array, key) {
        return array.reduce((result, item) => {
            (result[item[key]] = result[item[key]] || []).push(item);
            return result;
        }, {});
    }

    // Gruppieren nach Modalität
    const modalitaetGroups = groupBy(data, 'Modalitaet');
    const modalitaetElement = document.createElement('div');
    modalitaetElement.classList.add('statistik-item');
    modalitaetElement.innerHTML = `<h3>Untersuchungen nach Modalität:</h3>`;
    const modalitaetList = document.createElement('ul');
    for (const [modalitaet, items] of Object.entries(modalitaetGroups)) {
        const li = document.createElement('li');
        li.textContent = `${modalitaet}: ${items.length}`;
        modalitaetList.appendChild(li);
    }
    modalitaetElement.appendChild(modalitaetList);
    statistikContainer.appendChild(modalitaetElement);

    // Gruppieren nach Anfragendem Arzt
    const arztGroups = groupBy(data, 'AnfragenderArzt');
    const arztElement = document.createElement('div');
    arztElement.classList.add('statistik-item');
    arztElement.innerHTML = `<h3>Untersuchungen nach Anfragendem Arzt:</h3>`;
    const arztList = document.createElement('ul');
    for (const [arzt, items] of Object.entries(arztGroups)) {
        const displayName = arzt || 'Unbekannt';
        const li = document.createElement('li');
        li.textContent = `${displayName}: ${items.length}`;
        arztList.appendChild(li);
    }
    arztElement.appendChild(arztList);
    statistikContainer.appendChild(arztElement);

    // Gruppieren nach Diagnose
    const diagnoseGroups = groupBy(data, 'Diagnose');
    const diagnoseElement = document.createElement('div');
    diagnoseElement.classList.add('statistik-item');
    diagnoseElement.innerHTML = `<h3>Untersuchungen nach Diagnose:</h3>`;
    const diagnoseList = document.createElement('ul');
    for (const [diagnose, items] of Object.entries(diagnoseGroups)) {
        const displayName = diagnose || 'Unbekannt';
        const li = document.createElement('li');
        li.textContent = `${displayName}: ${items.length}`;
        diagnoseList.appendChild(li);
    }
    diagnoseElement.appendChild(diagnoseList);
    statistikContainer.appendChild(diagnoseElement);

    // Gruppieren nach Untersuchungsstatus
    const statusGroups = groupBy(data, 'Untersuchungsstatus');
    const statusElement = document.createElement('div');
    statusElement.classList.add('statistik-item');
    statusElement.innerHTML = `<h3>Untersuchungen nach Untersuchungsstatus:</h3>`;
    const statusList = document.createElement('ul');
    for (const [status, items] of Object.entries(statusGroups)) {
        const displayName = status || 'Unbekannt';
        const li = document.createElement('li');
        li.textContent = `${displayName}: ${items.length}`;
        statusList.appendChild(li);
    }
    statusElement.appendChild(statusList);
    statistikContainer.appendChild(statusElement);

    // Weitere Gruppierungen können hinzugefügt werden, z.B. nach Institution, Anfragename, etc.
}

// Funktion zur Anzeige oder Verbergen des Lade-Spinners
function displayLoading(isLoading) {
    if (isLoading) {
        loadingSpinner.style.display = 'flex';
        statistikContainer.style.display = 'none';
    } else {
        loadingSpinner.style.display = 'none';
        statistikContainer.style.display = 'flex';
    }
}

// Initiales Laden der Filteroptionen und Daten beim Laden der Seite
window.addEventListener('DOMContentLoaded', (event) => {
    fetchFilterOptions();
    applyFilters(); // Initiales Laden aller Daten ohne Filter
});
