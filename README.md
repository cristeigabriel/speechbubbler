# Speechbubbler

In meme culture, [speech bubbling](https://knowyourmeme.com/memes/speech-bubbling-word-bubbling) "is the term given to a wide range of exploitable reaction images that have half of a speech bubble added to them [...]".

This project aims to automate speech bubbling into a simple command, whilst also supporting conversion between formats.

# How to use
You may run the program through the command `npm run start` or `node index.js` and then provide 2 or 3 arguments, respectively:
- Input file (extension png/jpg/bmp)
- Output file (extension png/jpg/bmp)
- Bubble [height] percentage (default: 0.3)

# Examples
Inputting [static/in.jpg](./static/in.jpg), with default bubbling percentage, we can get, respectively: [static/out.png](./static/out.png), [static/out.jpg](./static/out.jpg), [static/out.bmp](staitc/../static/out.bmp).

# License
[ISC license](./LICENSE.md), as it appears to be the most common in npm packages, but if this prevents anyone from modifying or redistributing this piece of code, I will change it per request.
