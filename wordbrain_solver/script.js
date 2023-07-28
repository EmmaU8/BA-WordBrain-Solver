import {wordlist} from './wordlist.js';

/*-------------------------------------------------------------------------------------------*/
/*---------------------Implementation eines Tries zur effizienten Wortsuche------------------*/
/*-------------------------------------------------------------------------------------------*/

// Klasse TrieNode zur Darstellung eines Knotens im Trie
class TrieNode {
    constructor() {
        this.children = {};     // speichert die Kindknoten
        this.isWord = false;    // gibt an, ob der Knoten ein vollständiges Wort repräsentiert
    }
}

// Klasse Trie zur Darstellung der Trie-Datenstruktur
class Trie {
    constructor() {
        this.root = new TrieNode(); // Wurzelknoten des Tries
    }

    // füge ein Wort in den Trie ein
    insert(word) {
        let node = this.root;
        for (let c of word) {
            if (!(c in node.children)) {
                node.children[c] = new TrieNode();
            }
            node = node.children[c];
        }
        node.isWord = true;
    }

    // suche nach einem Wort im Trie
    search(word) {
        let node = this.root;
        for (let c of word) {
            if (!(c in node.children)) {
                return false;
            }
            node = node.children[c];
        }
        return node.isWord;
    }
}


/*-------------------------------------------------------------------------------------------*/
/*---------------------Implementation des eigentlichen WordBrain-Solvers---------------------*/
/*-------------------------------------------------------------------------------------------*/

// finde alle Kombinationen von Wörtern im Wordgrid, die den gegebenen Wortlängen in wordLengthList entsprechen
function findWordCombinations(wordGrid, wordLengthList, dictionary) {
    const foundWords = [];

    // finde rekursiv Wortkombinationen
    function findCombinations(wordGrid, wordLengthList, dictionary, currentIndex, currentWord, currentPositions) {
        if (currentIndex === wordLengthList.length) {
            foundWords.push(currentWord);
            return;
        }

        const currentLength = wordLengthList[currentIndex];
        const [words, positions] = findWords(wordGrid, dictionary, currentLength);
        for (let i = 0; i < words.length; i++) {
            const [word, position] = [words[i], positions[i][1]];
            const updatedGrid = updateGrid(wordGrid.map(row => row.slice()), position);
            findCombinations(
                updatedGrid, 
                wordLengthList, 
                dictionary, 
                currentIndex + 1, 
                currentWord.concat([word]), 
                currentPositions.concat([position]));
        }
    }

    findCombinations(wordGrid, wordLengthList, dictionary, 0, [], []);

    // entferne Duplikate aus foundWords
    const uniqueWordCombinations = foundWords.filter((wordCombination, index) => {
        return foundWords.findIndex(arr => JSON.stringify(arr) === JSON.stringify(wordCombination)) === index;
    });

    return uniqueWordCombinations;
}


// finde mit Hilfe von DFS alle Wörter im Gitter, die der gegebenen Länge length entsprechen
function findWords(grid, dictionary, length) {
    const trie = dictionaryToTrie(dictionary.map(word => word.toUpperCase()));
    const rows = grid.length;
    const cols = grid[0].length;
    const visited = new Set();
    const words = [];
    const wordPositions = [];

    // rekursive Funktion für Depth-First-Search
    function dfs(row, col, word, node, visitedPositions) {
        if (node.isWord && word.length === length) {
            words.push(word);
            wordPositions.push([word, visitedPositions.concat([[row, col]])]);
        }
    
        visited.add(JSON.stringify([row, col]));
    
        // erkunde rekursiv benachbarte Positionen
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) {
                    continue;
                }
                const r = row + i;
                const c = col + j;
                if (r < 0 || r >= rows || c < 0 || c >= cols) {
                    continue;
                }
                if (visited.has(JSON.stringify([r,c]))) {
                    continue;
                }
                if (!(grid[r][c] in node.children)) {
                    continue;
                }
                dfs(r, c, word + grid[r][c], node.children[grid[r][c]], visitedPositions.concat([[row, col]]));
            }
        }

        visited.delete(JSON.stringify([row, col]));
    }

    // führe DFS für jedes Startfeld im Gitter durch, falls der Buchstabe im Trie existiert
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (grid[i][j] in trie.root.children) {
                dfs(i, j, grid[i][j], trie.root.children[grid[i][j]], []);
            }
        }
    }

    return [words, wordPositions];
}


// aktualisiere das Wortgitter, indem die Felder in fieldsToRemove entfernt und die 
// verbleibenden Felder nach unten verschoben werden
function updateGrid(wordGrid, fieldsToRemove) {
    const numRows = wordGrid.length;
    const numColumns = wordGrid[0].length;

    for (const field of fieldsToRemove) {
        const [row, col] = field;
        wordGrid[row][col] = '';
    }

    // verschiebe die verbleibenden Felder nach unten, um die leeren Felder zu füllen
    for (let col = 0; col < numColumns; col++) {
        let emptyRow = numRows - 1;
        for (let row = numRows - 1; row >= 0; row--) {
            if (wordGrid[row][col] !== '') {
                wordGrid[emptyRow][col] = wordGrid[row][col];
                emptyRow -= 1;
            }
        }

        // leere die restlichen Felder in der obersten Zeile
        for (let row = emptyRow; row >= 0; row--) {
            wordGrid[row][col] = '';
        }
    }

    // entferne leere Zeilen am Ende des Gitters
    while (wordGrid.length > 0 && wordGrid[wordGrid.length - 1].every(cell => cell === '')) {
        wordGrid.pop();
    }

    // Füge leere Zeilen am Anfang des Gitters hinzu
    while (wordGrid.length > 0 && wordGrid[0].length < numColumns) {
        wordGrid.unshift(Array(numColumns).fill(''));
    }

    return wordGrid;
}


// konvertiere eine Liste von Wörtern in eine Trie-Datenstruktur
function dictionaryToTrie(dictionary) {
    const trie = new Trie();
    for (let word of dictionary) {
        trie.insert(word);
    }
    return trie;
}


/*-------------------------------------------------------------------------------------------*/
/*---------------------Initialisierung des WordBrain-Solvers im Browser----------------------*/
/*-------------------------------------------------------------------------------------------*/

// initialisiere den WordBrain-Solver im Browser
function initializeSolver() {
    
    /*-------------------------------------------------------------------------------------------*/
    /*---------------------Initialisierung des Bild-Uploads und -Croppers------------------------*/
    /*-------------------------------------------------------------------------------------------*/

    var cropper; // speichert die Cropper-Instanz
    var isCropped = false; // Zustand für den Initialisierungsstatus des Croppers

    // initialisiere die Bild-Upload-Funktion mit Drag-and-Drop-Unterstützung
    function initializeImageUpload() {
        const dropContainer = document.getElementById("dropcontainer");
        const fileInput = document.getElementById("imageInput");
    
        dropContainer.addEventListener("dragover", (e) => {
        e.preventDefault();
        }, false);
    
        dropContainer.addEventListener("dragenter", () => {
        dropContainer.classList.add("drag-active");
        });
    
        dropContainer.addEventListener("dragleave", () => {
        dropContainer.classList.remove("drag-active");
        });
    
        dropContainer.addEventListener("drop", (e) => {
        e.preventDefault();
        dropContainer.classList.remove("drag-active");
        fileInput.files = e.dataTransfer.files;
        });
    
        fileInput.addEventListener('change', loadImage);
        dropContainer.addEventListener('drop', loadImage);
    }


    // lade das hochgeladene Bild und zeige es an
    function loadImage() {

        const input = document.getElementById('imageInput');
        const file = input.files[0];

        // Fehlerbehandlung, wenn keine Datei ausgewählt wurde
        if (!file) {
            showErrorMessage("Lade eine Bilddatei hoch!");
        }

        //  verwende FileReader, um das Bild zu lesen und auf ein canvas zu zeichnen
        const reader = new FileReader();

        reader.onload = function (event) {
            const img = new Image();
            img.onload = function () {
                const canvas = document.getElementById('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const context = canvas.getContext('2d');
                context.drawImage(img, 0, 0);
                cropImage();
            };
            img.src = event.target.result;
        };

        reader.onerror = function () {
            throw new Error("Fehler beim Lesen der Bilddatei.");
        };

        reader.readAsDataURL(file);
    };


    // öffne den Cropper zum Zuschneiden eines Bildes
    function cropImage() {
        const canvas = document.getElementById('canvas');

        // falls bereits eine Cropper-Instanz existiert, vernichte diese bevor eine neue erstellt wird
        if (cropper) {
            cropper.destroy();
        }

        try {
            // initialisiere den Cropper
            cropper = new Cropper(canvas, {
                aspectRatio: NaN,       // erlaube beliebige Seitenverhältnisse
                autoCropArea: 1,        // zeige das gesamte Bild im Cropper an
                viewMode: 1,            // Cropbox maximal so groß wie Canvas
                background: false,      // deaktiviere die Hintergrundanzeige
                zoomable: false,        // deaktiviere Zoom vollständig
                restore: false,         // Cropper wird nach Zurücksetzen des Bildes nicht in den ursprünglichen Zustand versetzt
                maxContainerWidth: 600  // maximale Breite des Containers beträgt 600 Pixel
            });
            isCropped = true;
        } 
        catch (error) {
            isCropped = false;
            throw new Error("Fehler beim Erstellen des Croppers: " + error.message);
        }
        
    }


    /*-------------------------------------------------------------------------------------------*/
    /*---------------------Verarbeite das hochgeladene Bild--------------------------------------*/
    /*-------------------------------------------------------------------------------------------*/

    // initialisiere die Ausführung des WordBrain-Solvers
    function initializeSolveWordBrain() {
        // überprüfe ob es sich um ein Touch-Device handelt
        const isTouchDevice = 'ontouchstart' in document.documentElement; 

        // passe Event-Listener daran an, ob es sich um ein Touch-Device handelt
        if (isTouchDevice) {
            document.getElementById('processImage').addEventListener('touchstart', solveWordBrain);
        } else {
            document.getElementById('processImage').addEventListener('click', solveWordBrain);
        }
    }


    // verarbeite das hochgeladene Bild und löse das WordBrain-Rätsel
    async function solveWordBrain() {

        let imageData;  // Bilddaten des aktuell geladenen Bildes
        let context;    // 2D-Kontext des Canvas-Elements, auf dem das aktuelle Bild angezeigt wird
        let image;      // <img>-Element, das das geladene Bild darstellt
        let canvas;     // Canvas-Element, auf dem das geladene Bild angezeigt wird

        let binarizedImageData; // binarisierte Bilddaten nach der Verarbeitung
        let binarizedContext;   // 2D-Kontext des Canvas-Elements, auf dem das binarisierte Bild angezeigt wird

        let timeoutId;  //Timeout-Variable, um den WordBrain-Solver nach einer gewissen Zeit abzubrechen
        const timeoutDuration = 5 * 60 * 1000; // stelle die timeout-Dauer auf 5 Minuten (5 * 60 * 1000 Millisekunden)#

        // lösche Error Message, falls vorhanden
        document.getElementById('errorMessage').innerHTML = "";

        // zeige dem Nutzer an, dass Lösungen gesucht werden
        document.getElementById("processImage").innerHTML = "Lösungen werden gesucht"
        document.getElementById("processImage").disabled = true;

        // gib eine Fehlermeldung aus, falls kein Bild hochgeladen wurde
        const imageInput = document.getElementById("imageInput");
        if (!imageInput.files || imageInput.files.length === 0) {
            clearSolverTimeout(timeoutId);
            showErrorMessage("Bitte lade ein Bild hoch!");
            return;
        }

        // gib eine Fehlermeldung aus, falls keine Wortlängen eingegeben wurden
        const lengthInput = document.getElementById("lengthInput").value.trim();
        if (!lengthInput) {
            clearSolverTimeout(timeoutId);
            showErrorMessage("Bitte gib die Längen der Wörter ein!");
            return;
        }

        // gib eine Fehlermeldung aus, falls die Wortlängen falsch angegeben wurden
        if(!/^\d+([,\s]+\d+)*$/.test(lengthInput)) {
            clearSolverTimeout(timeoutId);
            showErrorMessage("Bitte gib nur Zahlen ein!");
            return;
        }

        // lösche das Timeout, falls die Funktion erneut aufgerufen wird, bevor das Timeout auslöst
        clearSolverTimeout(timeoutId);

        // setze ein Timeout, damit der WordBrain-Solver die Wortsuche nach timeoutDuration Minuten abbricht
        timeoutId = setTimeout(() => {
            showErrorMessage("Es tut mir leid, es können keine Wörter gefunden werden.");
        }, timeoutDuration);

        // verwende das entsprechende Canvas-Element, je nachdem ob das Bild zugeschnitten ist oder nicht
        if (isCropped) { 
            canvas= cropper.getCroppedCanvas();
        }
        else {
            canvas= document.getElementById('canvas');
        }

        // erzeuge die Daten-URL des Canvas-Elements und erhalte den 2D-Kontext
        const imageDataURL = canvas.toDataURL();
        context = canvas.getContext('2d');
        imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        // erzeuge ein <img>-Element und weise die Daten-URL als Quelle zu
        image = document.createElement('img');
        image.src = imageDataURL;

        // füge das <img>-Element zum Container hinzu und zeige es an
        const imageContainer = document.getElementById('imageContainer');
        imageContainer.innerHTML = '';
        imageContainer.appendChild(image);

        // füge das binarisierte Bild zum Container hinzu und zeige es an
        const binarizedImageContainer = document.getElementById('binarizedImageContainer');
        const binarizedImageCanvas = document.createElement('canvas');
        binarizedImageCanvas.width = imageData.width;
        binarizedImageCanvas.height = imageData.height;
        binarizedImageContainer.innerHTML = '';
        binarizedImageContainer.appendChild(binarizedImageCanvas);
        binarizedContext = binarizedImageCanvas.getContext('2d');


        // Bildvorverarbeitung: binarisiere das Bild anhand eines Schwellwertes
        function binarizeImage() {
            const imgData = imageData;
            const data = imgData.data;
            const threshold = 100; // Schwellwert für die Helligkeit

            // iteriere über die Pixel des Bildes
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const brightness = (r + g + b) / 3; // berechne die Helligkeit des Pixels

                // vergleiche die Helligkeit mit dem Schwellenwert und setze die 
                // Farbwerte des Pixels entsprechend auf Schwarz oder Weiß
                if (brightness < threshold) {
                    data[i] = 0;
                    data[i + 1] = 0;
                    data[i + 2] = 0;
                } else {
                    data[i] = 255;
                    data[i + 1] = 255;
                    data[i + 2] = 255;
                }
            }
            // zeichne die binarisierten Bilddaten auf das Canvas
            binarizedContext.putImageData(imgData, 0, 0);
            binarizedImageData = binarizedContext.getImageData(0, 0, binarizedImageCanvas.width, binarizedImageCanvas.height);
        }
        binarizeImage();


        // extrahiere alle WordBrain-Zellen aus dem hochgeladenen Bild
        function extractGridCells() {
            return new Promise((resolve, reject) => {
                const img = new Image();

                img.onload = function () {
                    const gridCells = [];

                    // wandle Daten-Array in Matrix um (lediglich zur Vereinfachung der folgenden Schritte)
                    const data = arrayToMatrix(
                        convertToGrayscale(binarizedImageData.data),
                        binarizedImageCanvas.width,
                        binarizedImageCanvas.height
                    );
               
                    
                    // finde die Indexe, an denen sich die Werte der Spalten stark von ihren Vorgängerwerten unterscheiden
                    const columnValues = computeColumnAverages(data, binarizedImageCanvas.width, binarizedImageCanvas.height);
                    const distinctColumnIndexes = [0, ...findDistinctIndexes(columnValues), columnValues.length - 1];

                    // finde die Indexe, an denen sich die Werte der Zeilen stark von ihren Vorgängerwerten unterscheiden
                    const rowValues = computeRowAverages(data, binarizedImageCanvas.width, binarizedImageCanvas.height);
                    const distinctRowIndexes = [0, ...findDistinctIndexes(rowValues), rowValues.length - 1];
                    
                    // bestimme die Anfangs- und Endkoordinaten (ja nachdem wie das Bild ausgeschnitten wurde)
                    let rowBegin = 0;
                    let columnBegin = 0;
                    let rowEnd = 0;
                    let columnEnd = 0;

                    // links überwiegend schwarze Pixel (d.h. Rand)
                    if(columnValues[0] < 50){
                        columnBegin = 1;
                    }
                    // links überwiegend weiße Pixel (d.h. kein Rand)
                    if(columnValues[0] >= 50){
                        columnBegin = 0;
                    }
                    // oben überwiegend schwarze Pixel (d.h. Rand)
                    if(rowValues[0] < 50){
                        rowBegin = 1;
                    }
                    // oben überwiegend weiße Pixel (d.h. kein Rand)
                    if(rowValues[0] >= 50){
                        rowBegin = 0;
                    }
                    // rechts überwiegend schwarze Pixel (d.h. Rand)
                    if(columnValues[columnValues.length-1] < 50){
                        columnEnd = 2;
                    }
                    // rechts überwiegend weiße Pixel (d.h. kein Rand)
                    if(columnValues[columnValues.length-1] >= 50){
                        columnEnd = 1;
                    }
                    // unten überwiegend schwarze Pixel (d.h. Rand)
                    if(rowValues[rowValues.length-1] < 50){
                        rowEnd = 2;
                    }
                    // unten überwiegend weiße Pixel (d.h. kein Rand)
                    if(rowValues[rowValues.length-1] >= 50){
                        rowEnd = 1;
                    }
                    
                    // extrahiere die WordGrid-Zellen basierend auf den Zeilen- und Spalten-Indizes
                    for (let i = columnBegin; i < distinctColumnIndexes.length - columnEnd; i+=2) {
                        for (let j = rowBegin; j < distinctRowIndexes.length - rowEnd; j+=2) {
                            const ratio = ((distinctColumnIndexes[i + 1] - distinctColumnIndexes[i])+ 
                                distinctRowIndexes[j + 1] - distinctRowIndexes[j])/(2*10);
                            let cell = binarizedContext.getImageData(
                                distinctColumnIndexes[i]+ratio, 
                                distinctRowIndexes[j]+ratio, 
                                distinctColumnIndexes[i + 1] - distinctColumnIndexes[i]-2*ratio, 
                                distinctRowIndexes[j + 1] - distinctRowIndexes[j]-2*ratio);
                            gridCells.push(cell);
                        }
                    }

                    resolve(gridCells);
                };

                img.onerror = function () {
                    showErrorMessage("Beim Laden des Bildes ist ein Fehler aufgetreten. Probiere es erneut!");
                    clearSolverTimeout(timeoutId);
                    reject(new Error("Fehler beim Laden des Bildes."));
                };

                img.src = image.src;
            });
        }


        // Funktion zur Buchstabenerkennung mit OCR (Optical Character Recognition)
        function recognizeLetter(imageData) {
            return new Promise((resolve, reject) => {
                var canvas = document.createElement('canvas');
                var context = canvas.getContext('2d');
                canvas.width = imageData.width;
                canvas.height = imageData.height;
                context.putImageData(imageData, 0, 0);
                var dataUrl = canvas.toDataURL();
                var img = new Image();
                img.src = dataUrl;
                
                // füge einen Event-Listener hinzu, der den OCR-Vorgang ausführt, sobald das Bild geladen ist
                img.onload = function() {
                    // erkenne den Buchstaben im Bild
                    Tesseract.recognize(img, 'deu', { 
                        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZÜÄß',
                        tessedit_pageseg_mode: 'single'})
                    .then(function(result) {
                        // extrahiere den erkannten Buchstaben aus dem Ergebnis
                        var erkannterBuchstabe = result.data.text.replace(/\s/g, '');
                        if(erkannterBuchstabe === ''){
                            erkannterBuchstabe = 'I';
                        }
                        if(erkannterBuchstabe === '»' || erkannterBuchstabe === 'p'){
                            erkannterBuchstabe = 'P';
                        }
                        if(erkannterBuchstabe === '@' || erkannterBuchstabe === '@}'){
                            erkannterBuchstabe = 'O';
                        }
                        resolve(erkannterBuchstabe);
                    })
                    .catch(function() {
                        showErrorMessage("Bei der Buchstabenerkennung ist ein Fehler aufgetreten. Probiere es erneut!");
                        clearSolverTimeout(timeoutId);
                        reject(new Error("Fehler bei der Buchstabenerkennung."));
                    });
                };
            });      
        }

        // extrahiere die Zellen aus dem binarisierten Bild
        extractGridCells().then(gridCells => {
            // gib die extrahierten Zellen aus
            const gridCellsContainer = document.getElementById('gridCellsContainer');
            gridCellsContainer.innerHTML = '';

            // erstelle eine leere quadratische Matrix der Größe der Anzahl der Zellen
            const size = Math.sqrt(gridCells.length);
            
            // gib eine Fehlermeldung aus, falls die Größe keine ganze Zahl ist
            if(size % 1 != 0){
                showErrorMessage("Achte darauf, dass nur das vollständige WordBrain-Gitter auf dem Bild ist!")
            }

            const matrix = Array(size)
                .fill(null)
                .map(() => Array(size).fill(null));


            for (let i = 0; i < gridCells.length; i++) {
                const cell = gridCells[i];
                const cellCanvas = document.createElement('canvas');
                cellCanvas.width = cell.width;
                cellCanvas.height = cell.height;
                const cellContext = cellCanvas.getContext('2d');
                cellContext.putImageData(cell, 0, 0);
                gridCellsContainer.appendChild(cellCanvas);

                // erkenne den Buchstaben in der Zelle
                recognizeLetter(cell).then(buchstabe => {
                    // bestimme die Position der Zelle in der Matrix
                    const row = Math.floor(i / size);
                    const col = i % size;

                    // speichere den Buchstaben in der entsprechenden Position der Matrix
                    matrix[col][row] = buchstabe;  

                    // überprüfe, ob alle Buchstaben erkannt wurden
                    const allLettersRecognized = matrix.every(row => row.every(cell => cell !== null));
                    if (allLettersRecognized) {
                        // lese die eingegebenen Zahlen aus dem Eingabefeld
                        const lengthInput = document.getElementById('lengthInput').value;
                        
                        // konvertiere die eingegebenen Zahlen in ein Array von Zahlen
                        const lengthArray = lengthInput.split(/[,\s]+/).map(Number);
                        const numberOfLetters = addNumbers(lengthArray);

                        // gib eine Fehlermeldung aus, falls die Summe der Wortlängen nicht gleich der Größe des Wortgitters ist
                        if(numberOfLetters != gridCells.length) {
                            clearSolverTimeout(timeoutId);
                            showErrorMessage("Die Summe aller Wortlängen muss der Größe des Wortgitters entsprechen!")
                            return;
                        }

                        // finde alle möglichen Lösungen des WordBrain-Rätsels
                        const foundWords = findWordCombinations(matrix, lengthArray, wordlist);
                        if(foundWords.length == 0){
                            clearSolverTimeout(timeoutId);
                            showErrorMessage("Es konnten leider keine Lösungen gefunden werden!");
                            return;
                        }
                        else {
                            // zeige die gefundenen Wörter auf der Webste an
                            displayFoundWords(foundWords.map(innerArray => innerArray.join('   ')));

                            // ändere den Button zurück, damit der Nutzer erneut nach Lösungen suchen kann
                            document.getElementById("processImage").innerHTML = "Lösungen suchen"
                            document.getElementById("processImage").disabled = false;
                        }

                        // cleare das timeout, da eine Lösung gefunden wurde
                        clearSolverTimeout(timeoutId);
                    }
                });
            }  
        }).catch(error => {
            console.error(error);
        });

    }


    /*-------------------------------------------------------------------------------------------*/
    /*-----------------------------Hilfsfunktionen-----------------------------------------------*/
    /*-------------------------------------------------------------------------------------------*/

    // berechne die Durchschnittswerte für jede Spalte
    function computeColumnAverages(data, width, height) {
        const columnValues = [];
        for (let x = 0; x < width; x++) {
            let columnSum = 0;
            for (let y = 0; y < height; y++) {
                columnSum += data[y][x];
            }
            const columnAverage = columnSum / height;
            columnValues.push(columnAverage);
        }
        return columnValues;
    }


    // berechne die Durchschnittswerte für jede Zeile
    function computeRowAverages(data, width, height) {
        const rowValues = [];
        for (let y = 0; y < height; y++) {
            let rowSum = 0;
            for (let x = 0; x < width; x++) {
                rowSum += data[y][x];
            }
            const rowAverage = rowSum / width;
            rowValues.push(rowAverage);
        }
        return rowValues;
    }


    // addiere die Zahlen eines Arrays
    function addNumbers(array) {
        let sum = 0;
        for (let element of array) {
            if (typeof element !== 'number') {
                throw new Error('Das Array enthält nicht nur Zahlen.');
            }
            sum += element;
        }

        return sum;
    }


    // lösche das Timeout, das mit der angegebenen ID verknüpft ist, falls es existiert
    function clearSolverTimeout(timeoutId){
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
    }


    // zeige dem Nutzer eine Fehlermeldung im Browser
    function showErrorMessage(errorMessage) {
        document.getElementById('foundWords').innerHTML = "";
        document.getElementById('errorMessage').innerHTML = errorMessage;
        document.getElementById("processImage").innerHTML = "Lösungen suchen"
        document.getElementById("processImage").disabled = false;
    }


    // konvertiere Farbbild-Array in Graustufenbild
    function convertToGrayscale(array) {
        const length = array.length;

        // überprüfe, ob die Länge des Arrays durch 4 teilbar ist
        if (length % 4 !== 0) {
            throw new Error('Das Eingabearray ist nicht korrekt. Die Arraygröße muss durch 4 teilbar sein.');
        }

        const grayscaleArray = [];

        // iteriere über das ursprüngliche Array und füge jedes vierte Element zum komprimierten Array hinzu
        for (let i = 0; i < length; i+=4) {
            const value = Math.floor((array[i]+array[i+1]+array[i+2])/3);
            grayscaleArray.push(value);
        }

        return grayscaleArray; 
    }


    // wandle Array in eine Matrix mit angegebenen Spalten und Zeilen um
    function arrayToMatrix(arr, columns, rows) {
        if (arr.length !== rows * columns) {
            throw new Error('Die Arraylänge stimmt nicht mit den angegebenen Zeilen und Spalten überein.');
        }
        
        var matrix = [];
        var index = 0;
        
        for (var i = 0; i < rows; i++) {
            var row = [];
            
            for (var j = 0; j < columns; j++) {
                row.push(arr[index]);
                index++;
            }
            
            matrix.push(row);
        }
        
        return matrix;
    }


    // finde die Indizes, an denen sich die Werte der Spalten stark von ihren 
    // Vorgängerwerten unterscheiden (Unterschied > Schwellwert)
    function findDistinctIndexes(values) {
        const threshold = 100;
        const distinctIndexes = [];

        for (let i = 1; i < values.length; i++) {
            const currentValue = values[i];
            const previousValue = values[i - 1];
            const difference = Math.abs(currentValue - previousValue);

            if (difference > threshold) {
                distinctIndexes.push(i);
            }
        }

        return distinctIndexes;
    }


    // zeige die gefundenen Wörter auf der Website an
    function displayFoundWords(foundWords) {

        const foundWordsContainer = document.getElementById('foundWords');
        foundWordsContainer.innerHTML = '';
    
        foundWords.forEach((solution) => {
            const foundWordElement = document.createElement('div');
            foundWordElement.classList.add('found-word');
            foundWordElement.textContent = solution;
            foundWordsContainer.appendChild(foundWordElement);
        });
    
        const resultContainer = document.getElementById('resultContainer');
        resultContainer.style.display = 'block';
    }

    
    // initialisiere den Image-Upload und das Lösen des WordBrain-Rätsels
    initializeImageUpload();
    initializeSolveWordBrain();
}

// löse das WordBrain-Rätsel auf dem hochgeladenen Bild
initializeSolver();