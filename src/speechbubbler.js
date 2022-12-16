const imageToRgbaMatrix = require('image-to-rgba-matrix')
const png = require('fast-png')
const jpg = require('jpg-js')
const bmp = require('bmp-js')

// Supported extensions
const extensions = ['png', 'jpg', 'bmp']

/**
 * @param  {object} inputImage Array of rows of columns of 4 channels (RGBA) each
 * @param  {string} to Encoding format (must be in `extensions`)
 * @param  {Number} bubblePercentage How much of the image will be occupied, from top, by speech bubble
 * @returns {Uint8Array} Flattened data encoded as format specified in `to` field
 */
const getEncodedDataFromArray = (inputImage, to, bubblePercentage) => {
    // Verify validity of extension
    if (!extensions.some(x => x === to)) {
        throw `Extension '${extension}' not supported! Try: ${extensions.join(', ')}`
    }

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
        const clearPixel = (row, column) => {
            inputImage[row][column] = [0, 0, 0, 0]
        }
        // Math utility 
        const deg2Rad = x => { return x * (Math.PI / 180) }

        // Draw half a circle from top of image for the specified % on y-axis
        {
            // Iterations for half a circle
            let iter = 270 - 90
            // Remember last row value to fill in blanks need be
            let prevRow = Number.NaN

            for (let i = 0; i < Math.floor(iter / 2); i++) {
                let left = Math.max(0, Math.floor(imgWidth / 2 + Math.sin(deg2Rad(270 - i)) * (imgWidth / 2)))
                // Optimize this part away
                let right = imgWidth - left
                // The y is the same across the 2 points
                let row = Math.max(0, Math.abs(Math.floor(Math.cos(deg2Rad(270 - i)) * occupyHeight)) - 1)

                for (let column = left; column < right; column++) {
                    // There may be blanks so we want to fill them in
                    if (Number.isNaN(prevRow)) {
                        clearPixel(row, column)
                    } else {
                        for (let nRow = prevRow; nRow < row; nRow++) {
                            clearPixel(nRow, column)
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


                let column = Math.floor(imgWidth / 2 + Math.sin(deg2Rad(i)) * imgWidth / 2)
                let row = Math.max(0, Math.floor(Math.abs(Math.cos(deg2Rad(v))) * occupyHeight) - 1)

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
                        clearPixel(row, column + padding)
                    } else {
                        for (let nRow = row; nRow < prevRow; nRow++) {
                            clearPixel(nRow, column + padding)
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
    const encodedData = format => {
        if (format === 'png') {
            return png.encode({ width: imgWidth, height: imgHeight, data: inputImage.flat(2) })
        } else if (format === 'jpg') {
            return jpg.fromarray(inputImage.flat(2), imgWidth, imgHeight).encodedData()
        } else if (format === 'bmp') {
            // Requires ABGR
            return bmp.encode({ width: imgWidth, height: imgHeight, data: inputImage.flat().map(x => x.reverse()).flat() }).data
        }
    }

    return encodedData(to)
}
/**
 * @param  {object} input URL or file to open (format must be in `extensions`)
 * @param  {string} to Encoding format (must be in `extensions`)
 * @param  {Number} bubblePercentage How much of the image will be occupied, from top, by speech bubble
 * @returns {Promise<Uint8Array>} Flattened data encoded as format specified in `to` field
 */
const getEncodedData = async (input, to, bubblePercentage) => {
    return getEncodedDataFromArray(await imageToRgbaMatrix(input)
        , to, bubblePercentage)
}

module.exports = { extensions, getEncodedDataFromArray, getEncodedData }