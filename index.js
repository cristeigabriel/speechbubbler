const imageToRgbaMatrix = require('image-to-rgba-matrix')
const png = require('fast-png')
const bmp = require('bmp-js')
const jpg = require('jpg-js')
const { writeFile } = require('fs')

// Supported extensions
const extensions = ['png', 'jpg', 'bmp']

// Get arguments after 'node index.js'
const arguments = process.argv.slice(2)

// Extract extension from input, throw error if not present
const getExtension = input => {
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
}

// Get file as {file, extension}
const getFile = (input) => {
    return {
        file: input,
        extension: (() => {
            let extension = getExtension(input)
            if (!extensions.some(x => x === extension)) {
                throw `Extension '${extension}' not supported! Try: ${extensions.join(', ')}`
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
async function run() {
    // Get byte array representing image RGBA data
    let inputImage = await imageToRgbaMatrix(inputFile.file)

    // Get image height
    let imgHeight = inputImage.length
    // TODO: replace with a circle resolution
    if (imgHeight < 1) {
        throw 'Image height too small!'
    }

    // Get image width
    let imgWidth = inputImage[0].length
    if (imgWidth < 1) {
        throw 'Image width too small!'
    }

    // Apply speech bubble to image
    // percentage = perc. of height to occupate
    const speechBubbler = percentage => {
        let occupyHeight = imgHeight * percentage
        if (occupyHeight < 1) {
            throw 'Image too small to apply speech bubble!'
        }

        // Makes a pixel transparent
        const nullOut = (row, column) => {
            inputImage[row][column] = [0, 0, 0, 0]
        }
        // Math utility 
        const deg2rad = x => { return x * (Math.PI / 180) }

        // Draw half a circle from top of image for the specified % on y-axis
        {
            // Iterations for half a circle
            let iter = 270 - 90
            // Remember last row value to fill in blanks need be
            let prevRow = Number.NaN

            for (let i = 0; i < Math.floor(iter / 2); i++) {
                let left = Math.max(0, Math.floor(imgWidth / 2 + Math.sin(deg2rad(270 - i)) * (imgWidth / 2)))
                // Optimize this part away
                let right = imgWidth - left
                // The y is the same across the 2 points
                let row = Math.max(0, Math.abs(Math.floor(Math.cos(deg2rad(270 - i)) * occupyHeight)) - 1)

                for (let column = left; column < right; column++) {
                    // There may be blanks so we want to fill them in
                    if (Number.isNaN(prevRow)) {
                        nullOut(row, column)
                    } else {
                        for (let nRow = prevRow; nRow < row; nRow++) {
                            nullOut(nRow, column)
                        }
                    }
                }

                prevRow = row
            }
        }

        // Now do the bubble arc
        {
            // Thickness of bubble arc
            let thickness = Math.ceil(imgWidth * 0.1)
            // X-axis start of bubble arc
            let start = 110
            // X-axis end of bubble arc
            let end = 160
            // Variable to remember if column padding should be
            // negative
            let goNegative = null
            // Remember last row value to fill in blanks need be
            let prevRow = Number.NaN

            for (let i = start; i < end; i++) {
                // Convert our degrees for y to go from 90 to 180
                // Check for 110 to not divide by 0
                let d = (i == start) ? 0 : (i - start) / (end - start)
                let v = 90 * d


                let column = Math.floor(imgWidth / 2 + Math.sin(deg2rad(i)) * imgWidth / 2)
                let row = Math.max(0, Math.floor(Math.abs(Math.cos(deg2rad(v))) * occupyHeight) - 1)

                if (goNegative === null) {
                    // Check if we're going to overflow if we go too far to the right
                    // If that's the case, then start going to the left to apply
                    // thickness
                    goNegative = (column + thickness) > imgWidth
                }

                for (let i = 0; i < thickness; i++) {
                    let padding = (i * (goNegative ? -1 : 1))

                    // There may be blanks so we want to fill them in
                    if (Number.isNaN(prevRow)) {
                        nullOut(row, column + padding)
                    } else {
                        for (let nRow = row; nRow < prevRow; nRow++) {
                            nullOut(nRow, column + padding)
                        }
                    }
                }

                prevRow = row
            }
        }
    }

    // Apply speech bubbler a given percentage of image from top
    speechBubbler(bubblePercentage)

    // Declare potential encodings for available output formats
    // Already error checked by outputFile declaration
    const saveEncodings = format => {
        if (format === 'png') {
            return png.encode({ width: imgWidth, height: imgHeight, data: inputImage.flat(2) })
        } else if (format === 'jpg') {
            return jpg.fromarray(inputImage.flat(2), imgWidth, imgHeight).encodedData()
        } else if (format === 'bmp') {
            // Requires ABGR
            return bmp.encode({ width: imgWidth, height: imgHeight, data: inputImage.flat().map(x => x.reverse()).flat() }).data
        }
    }

    // Save new image
    return writeFile(outputFile.file, saveEncodings(outputFile.extension), (err) => {
        if (err) throw err
    })
}

// Run program
run()