import random
import numpy
from helper_functions import createDictionary, drawWordGrid, decode

# erstelle ein WordBrain Puzzle der Größe (puzzleSize x puzzleSize) mit numberOfWords Wörtern aus dictionary
# Bsp.: backGrid                          wordGrid
#       (0,0)|(0,1)|(0,2)|(0,3)           f|a|k|w
#       -----------------------           -------
#       (1,0)|(1,1)|(1,2)|(1,3)           p|l|t|l
#       -----------------------           -------
#       (2,0)|(2,1)|(2,2)|(2,3)           a|p|i|e
#       -----------------------           -------
#       (3,0)|(3,1)|(3,2)|(3,3)           e|r|e|r
def createPuzzle(dictionary, puzzleSize, numberOfWords):

    # initialisiere das wordGrid mit * und das backGrid mit den entsprechenden Koordinaten
    wordGrid = initialiseWordGrid(puzzleSize)
    backGrid = initialiseBackGrid(puzzleSize)

    # wähle zufällige Wörter geeigneter Länge aus
    randomWords = chooseRandomWords(dictionary, puzzleSize*puzzleSize, numberOfWords)

    # befülle Grid mit Wörtern
    backGrid, wordGrid = fillPuzzle(randomWords, backGrid, wordGrid, puzzleSize)

    # erstelle eine Kopie von wordGrid (bei der die Einträge durch Kommas getrennt sind)
    wordGridCopy = []
    for row in range(len(wordGrid)):
            entry = []
            for col in range(len(wordGrid[row])):
                entry.append(wordGrid[row][col])
            wordGridCopy.append(entry)

    return backGrid, wordGridCopy, randomWords

# befülle das Grid mit den Wörtern aus randomWords
def fillPuzzle(randomWords, backGrid, wordGrid, puzzleSize):

    previousPaths = []
    markedFields = []

    # füge Worte aus wordList in Grid ein
    def insertWords(wordList, wordGrid, backGrid, markedFields):
        newPreviousPaths = []
        newPreviousWordLengths = []
        for i in range(len(wordList)):
            word = wordList[i]
            startFieldList = getStartFields(wordGrid)
            wordLength = len(word)
            paths = getAllPaths(backGrid, wordLength, startFieldList, markedFields)
            newPreviousWordLengths.append(wordLength)

            if not paths:
                return None, None

            path = getRandomPath(paths)
            newPreviousPaths.extend(path)
            insertWord(wordGrid, word, path, markedFields)
        return newPreviousPaths, newPreviousWordLengths

    # falls es keine Pfade mehr gibt, beginne Befüllen von Neuem
    previousPaths, _ = insertWords(randomWords, wordGrid, backGrid, markedFields)
    if previousPaths is None:
        wordGrid = initialiseWordGrid(puzzleSize)
        backGrid = initialiseBackGrid(puzzleSize)
        return fillPuzzle(randomWords, backGrid, wordGrid, puzzleSize)

    return backGrid, wordGrid


# initialisiere das wordGrid mit *
def initialiseWordGrid(puzzleSize):

    wordGrid = numpy.full((puzzleSize, puzzleSize), '*')

    return wordGrid


# initialisiere das backGrid mit den entsprechenden Koordinaten
def initialiseBackGrid(puzzleSize):
    
    backGrid = [[None for c in range(puzzleSize)] for r in range(puzzleSize)] 
    for row in range(puzzleSize):
        for col in range(puzzleSize):
            backGrid[row][col] = [row, col]

    return backGrid


# wähle zufällige Wörter geeigneter Länge aus
def chooseRandomWords(dictionary, numberOfLetters, numberOfWords):

    randomWords = []
    wordLengthList = generateWordLengths(numberOfLetters, numberOfWords)

    for wordLength in wordLengthList:
        randomWord = chooseWordOfLength(dictionary, wordLength)
        dictionary.remove(randomWord)
        randomWords.append(randomWord)
    
    return randomWords


# berechne die Wortlängen der Wörter, die in das Grid eingefügt werden sollen
def generateWordLengths(numberOfLetters, numberOfWords):

    # berechne die minimale Summe, die erreicht werden muss, damit alle Wörter
    # mindestens 3 Buchstaben haben
    minSum = numberOfWords * 3
    
    # wenn numberOfLetters kleiner als minSum ist, gibt es keine Lösung
    if numberOfLetters < minSum:
        raise ValueError(f"Alle Wörter müssen mindestens drei Buchstaben haben!")
    
    # erstelle eine Liste mit numberOfWords Zufallszahlen zwischen 3 und numberOfLetters
    # (die Summe der Zahlen muss numberOfLetters ergeben)
    while True:
        numbers = [random.randint(3, numberOfLetters) for _ in range(numberOfWords)]
        if sum(numbers) == numberOfLetters:
            return numbers


# wähle ein zufälliges Wort geeigneter Länge aus dem Dictionary aus
def chooseWordOfLength(dictionary, wordSize):
    
    matchingWords = [word for word in dictionary if len(word) == wordSize]
    if not matchingWords:
        raise ValueError(f"Keine Wörter der Länge {wordSize} gefunden")
    
    return random.choice(matchingWords)


# update das backGrid, so dass alle oberen Felder nach unten "fallen", wenn ein Feld schon benutzt wurde
def updateGrid(backGrid, wordGrid):

    height = len(wordGrid)
    width = len(wordGrid[0])

    for col in reversed(range(width)):
        for row in reversed(range(height)):
            if backGrid[row][col][1] < 0:
                continue
            if wordGrid[row][col].isalpha():
                for r in reversed(range(0, row+1)):
                    backGrid[r][col] = [row-1, col]


# bestimme alle möglichen Pfade einer bestimmten Länge und von einem bestimmten Feld aus
# im backGrid (Pfad darf nicht durch Felder mit negativem backGrid-Eintrag gehen)
def getPathOfLength(backGrid, pathLength, field, markedFields):
    
    n = len(backGrid)
    x, y = field
    paths = []

    # erkunde rekursiv alle möglichen Pfade einer bestimmten Länge von einem 
    # bestimmten Feld aus
    def explorePath(currentPath, currentX, currentY):
        if len(currentPath) == pathLength:
            paths.append(currentPath)
            return

        for dx, dy in [(0, 1), (0, -1), (1, 0), (-1, 0), (1, 1), (-1, -1), (1, -1), (-1, 1)]:
            nextX, nextY = currentX + dx, currentY + dy

            if 0 <= nextX < n and 0 <= nextY < n and backGrid[nextX][nextY][1] >= 0 and (nextX, nextY) not in currentPath and (
                    nextX, nextY) not in markedFields:
                explorePath(currentPath + [(nextX, nextY)], nextX, nextY)

    explorePath([(x, y)], x, y)
    return paths


# bestimme alle möglichen Pfade von allen möglichen Startfeldern aus
def getAllPaths(backGrid, pathLength, startFields, markedFields):

    paths = []
    if not startFields:
        raise ValueError(f"Keine Startfelder gefunden")
    for field in startFields:
        currentPaths = getPathOfLength(backGrid, pathLength, field, markedFields)
        paths.extend(currentPaths)

    backGridPaths = []
    for path in paths:
        entry = []
        for field in path:
            entry.append(backGrid[field[0]][field[1]])
        backGridPaths.append(entry)

    wordGridPaths = []
    for path in backGridPaths:
        gridPath = []
        for entry in path:
            for i in range(len(backGrid)):
                if entry in backGrid[i]:
                    gridPath.append((i, backGrid[i].index(entry)))
                    break
        wordGridPaths.append(gridPath)

    return wordGridPaths


# wähle aus allen möglichen Pfaden zufällig einen aus
def getRandomPath(paths):

    if paths:
        return random.choice(paths)
    else:
        return None


# bestimme alle möglichen Startfelder (d.h. alle Felder, die noch frei sind)
def getStartFields(wordGrid):

    freeFields = []
    for row in range(len(wordGrid)):
        for col in range(len(wordGrid[row])):
            if decode(wordGrid[row][col]) == '*':
                freeFields.append([row, col])
    if freeFields:
        return freeFields
    else:
        return None


# füge ein Wort in das wordGrid ein und update das Grid entsprechend
def insertWord(wordGrid, randomWord, path, markedFields):

    originalBackGrid = [[None for c in range(len(wordGrid))] for r in range(len(wordGrid[0]))] 
    for row in range(0, len(wordGrid)):
        for col in range (0, len(wordGrid[0])):
            originalBackGrid[row][col] = [row, col]

    wordLength = len(randomWord)

    for field, i in zip(path, range(wordLength)):
        wordGrid[field[0]][field[1]] = randomWord[i]
        markedFields.append(field)
    
    updateGrid(originalBackGrid, wordGrid)

# Generierung von WordBrain Rätseln über die Kommandozeile
def generateWordBrainPuzzle():
    print("Gib ein, welche Größe das WordBrain Rätsel haben soll (z.B. 4 für ein Rätsel der Größe 4x4): ")
    puzzleSize = int(input())
    print("Gib die Anzahl an Wörtern ein, die das WordBrain Rätsel enthalten soll: ")
    y = input()

    if y.isnumeric():
        y = int(y)
        file = "dict.txt"
        dictionary = createDictionary(file)
        backGrid, wordGrid, randomWords = createPuzzle(dictionary, puzzleSize, y)
        drawWordGrid(wordGrid)
        print("Lösung:", randomWords)
    else:
        print("Keine valide Eingabe! Gib eine Zahl ein!")

#generateWordBrainPuzzle()


# Tests
# file = "dict.txt"
# dictionary = createDictionary(file)
# backGrid, wordGrid, randomWords = createPuzzle(dictionary, 4, 3)
# drawWordGrid(backGrid)
# drawWordGrid(wordGrid)
# print(randomWords)
# print(wordGrid)


