# erstelle aus einer txt-Datei mit Wörtern ein Array dieser Wörter
def wordlistToArray(filename):
    words = []
    with open(filename, 'r') as file:
        for line in file:
            word = line.strip()
            words.append(f"{word}")
    return words

filename = 'dict.txt'
wordArray = wordlistToArray(filename)
print(wordArray)
