import numpy
from wordbrain_creator import createPuzzle
from helper_functions import createDictionary, drawWordGrid

# Klasse TrieNode zur Darstellung eines Knotens im Trie
class TrieNode:
    def __init__(self):
        self.children = {}      # speichert die Kindknoten
        self.isWord = False     # gibt an, ob der Knoten ein vollständiges Wort repräsentiert

# Klasse Trie zur Darstellung der Trie-Datenstruktur
class Trie:
    def __init__(self):
        self.root = TrieNode()  # Wurzelknoten des Tries
        
    # füge ein Wort in den Trie ein
    def insert(self, word):
        node = self.root
        for c in word:
            if c not in node.children:
                node.children[c] = TrieNode()
            node = node.children[c]
        node.isWord = True
        
    # suche nach einem Wort im Trie
    def search(self, word):
        node = self.root
        for c in word:
            if c not in node.children:
                return False
            node = node.children[c]
        return node.isWord


# finde mit Hilfe von DFS alle Wörter im Gitter, die der gegebenen Länge entsprechen
def findWords(grid, trie, length):

    rows, cols = len(grid), len(grid[0])
    visited = set()
    words = []
    wordPositions = []
    
    # rekursive Funktion für Depth-First-Search 
    def dfs(row, col, word, node, visited_positions):

        if node.isWord and len(word) == length:
            words.append(word)
            wordPositions.append((word, visited_positions + [(row, col)]))
        
        visited.add((row, col))
        
        # erkunde rekursiv benachbarte Positionen
        for i in range(-1, 2):
            for j in range(-1, 2):
                if i == 0 and j == 0:
                    continue
                r, c = row + i, col + j
                if r < 0 or r >= rows or c < 0 or c >= cols:
                    continue
                if (r, c) in visited:
                    continue
                if grid[r][c] not in node.children:
                    continue
                dfs(r, c, word + grid[r][c], node.children[grid[r][c]], visited_positions + [(row, col)])
        
        visited.remove((row, col))
        
    # führe DFS für jedes Startfeld im Gitter durch, falls der Buchstabe
    # im Trie existiert
    for i in range(rows):
        for j in range(cols):
            if grid[i][j] in trie.root.children:
                dfs(i, j, grid[i][j], trie.root.children[grid[i][j]], [])
    
    return words, wordPositions

# aktualisiere das Wortgitter, indem die Felder in fieldsToRemove entfernt und die
# verbleibenden Felder nach unten verschoben werden
def updateGrid(wordGrid, fieldsToRemove):
    numRows = len(wordGrid)
    numColumns = len(wordGrid[0])

    for field in fieldsToRemove:
        row, col = field
        wordGrid[row][col] = ''

    # verschiebe die verbleibenden Felder nach unten, um die leeren Felder zu füllen
    for col in range(numColumns):
        emptyRow = numRows - 1
        for row in range(numRows - 1, -1, -1):
            if wordGrid[row][col] != '':
                wordGrid[emptyRow][col] = wordGrid[row][col]
                emptyRow -= 1

        # leere die restlichen Felder in der obersten Zeile
        for row in range(emptyRow, -1, -1):
            wordGrid[row][col] = ''

    # entferne leere Zeilen am Ende des Gitters
    while len(wordGrid) > 0 and all(cell == '' for cell in wordGrid[-1]):
        wordGrid.pop()

    # füge leere Zeilen am Anfang des Gitters hinzu
    while len(wordGrid) > 0 and len(wordGrid[0]) < numColumns:
        wordGrid.insert(0, [''] * numColumns)

    return wordGrid

# finde alle Kombinationen von Wörtern im Wordgrid, die den gegebenen Wortlängen entsprechen
def findWordCombinations(wordGrid, wordLengthList, trie):
    
    words_and_positions = []

    # finde rekursiv Wortkombinationen
    def find_combinations(wordGrid, wordLengthList, trie, current_index, current_word, current_positions):

        if current_index == len(wordLengthList):
            words_and_positions.append((current_word))
            return
        current_length = wordLengthList[current_index]
        words, positions = findWords(wordGrid, trie, current_length)
        words = list(words)

        for i in range(len(words)):
            word, position = words[i], positions[i][1]
            updated_grid = updateGrid([row[:] for row in wordGrid], position)
            find_combinations(updated_grid, wordLengthList, trie, current_index+1, current_word+[word], current_positions+[position])
    
    find_combinations(wordGrid, wordLengthList, trie, 0, [], [])
    return words_and_positions

# konvertiere eine Liste von Wörtern in eine Trie-Datenstruktur
def dictionaryToTrie(dictionary):

    trie = Trie()
    for word in dictionary:
        trie.insert(word)
    
    return trie

# gib die Längen der Wörter in einer Liste zurück
def getWordLengths(randomWords):

    wordLengthList = []
    for word in randomWords:
        wordLengthList.append(len(word))

    return wordLengthList

# Funktion zum Testen von WordBrain-Puzzles und Berechnen der Erfolgswahrscheinlichkeit
def testWordBrainPuzzles(numberOfPuzzles):

    file = "dict.txt"
    dictionary = createDictionary(file)
    trie = dictionaryToTrie(dictionary)
    puzzleSize = 3
    numberOfWords = 2

    successfulPuzzles = 0
    totalPuzzles = numberOfPuzzles

    for _ in range(numberOfPuzzles):
        backGrid, wordGrid, randomWords = createPuzzle(dictionary, puzzleSize, numberOfWords)
        wordLengthList = getWordLengths(randomWords)
        result = findWordCombinations(wordGrid, wordLengthList, trie)

        # überprüfe, ob die gefundenen Wörter mit den zufälligen Wörtern übereinstimmen
        if all(foundWords == randomWords for foundWords in result):
            successfulPuzzles += 1

    successRate = successfulPuzzles / totalPuzzles
    return successRate


# Beispielaufruf zur Berechnung der Erfolgswahrscheinlichkeit
# numberOfPuzzlesToTest = 500
# successRate = testWordBrainPuzzles(numberOfPuzzlesToTest)
# print(f"Erfolgswahrscheinlichkeit: {successRate:.2f}")

# Beispielaufruf zur Ausführung des Solvers
# file = "dict.txt"
# dictionary = createDictionary(file)
# trie = dictionaryToTrie(dictionary)
# backGrid, wordGrid, randomWords = createPuzzle(dictionary, 4, 3)
# wordLengthList = getWordLengths(randomWords)
# result = findWordCombinations(wordGrid, wordLengthList, trie)
# print(result)
# print(randomWords)
# drawWordGrid(wordGrid)
