import numpy

# erstelle ein Dictionary (Liste von Wörtern) aus einem Textfile 
# (z.B. einem Textfile mit allen Wörtern im Duden)
def createDictionary(file):
    wordFile = open(file, "r")
    data = wordFile.read()
    dictionary = data.split("\n")
    wordFile.close()

    return dictionary

# Hilfsfunktion zum Umwandeln von Bytes in Strings, falls erforderlich
def decode(object):
    if type(object) is str or type(object) is numpy.str_ or type(object) is list:
        return object
    else: 
        return object.decode()

# gib das Wordgrid auf ansprechende Weise aus
def drawWordGrid(wordGrid):
    height = len(wordGrid)
    width = len(wordGrid)
    for row in range(height):
        print('--'*width)
        for col in range(width):
            print('|', end='')
            if(decode(wordGrid[row][col]) == ''):
                print(' ', end='')
            else:
                print(decode(wordGrid[row][col]), end='')
        print('\n')