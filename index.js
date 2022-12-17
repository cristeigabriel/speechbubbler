const { getEncodedData } = require('./src/speechbubbler')
const { writeFile } = require('fs')

// Get arguments after 'node index.js'
const arguments = process.argv.slice(2)

// Get file as {file, extension}
const getFile = input => {
    return {
        file: input,
        extension: (() => {
            let inputRev = input.split('').reverse().join('')
            let index = inputRev.indexOf('.')
            if (index === -1) {
                throw `No extension in '${input}'!`
            }

            let extension = input.slice(input.length - index)
            if (extension.length === 0) {
                throw `'${input}' doesn't contain any extension!`
            }

            return extension
        })()
    }
}

// First argument: input file
const inputFile = getFile(arguments[0])

// Second argument: output file 
const outputFile = getFile(arguments[1])

// Third argument, optional: percentage
const bubblePercentage = Math.min(Number(arguments[2]) || 0.3, 1)

// Async runner
const run = async () => {
    // Save new image
    return writeFile(outputFile.file, await getEncodedData(inputFile.file, outputFile.extension, bubblePercentage), err => {
        if (err) throw err
    })
}

// Run program
run()