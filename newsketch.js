let testingData = [];
let imgsValues = [];
let usedImages = [];

let principalImage;
let tileSizeFactor;
let tileNumberRow;
let tileNumberCol;
let tileDimensionH;
let tileDimensionV;
let canvasWidth;
let canvasHeight;

let formats = [1, 1];
let comparedPixels = [];
let pixelsToCompare = [];
let forLoopCounter = 0;
let forLoopIncrementer = 40;
let mustSave = 0;

function setup() {
  createCanvas(800, 800); // Placeholder canvas
  loadRandomUserImage();
}

function loadRandomUserImage() {
  fetch('https://randomuser.me/api/')
    .then(res => res.json())
    .then(data => {
      let imgUrl = data.results[0].picture.large;
      loadImage(imgUrl, (img) => {
        principalImage = img;
        loadTestingData(); // Now load your test images
      });
    });
}

function loadTestingData() {
  let count = 0;

  for (let i = 0; i < 200; i++) {
    loadImage('./data/' + i + '.jpeg', img => {
      testingData[i] = img;
      count++;
      if (count === 200) {
        initSketch(); // All images loaded
      }
    });
  }
}

function initSketch() {
  tileSizeFactor = principalImage.width / 100;

  canvasWidth = principalImage.width * 20;
  canvasHeight = principalImage.height * 20;

  if (canvasWidth > 6000) {
    canvasWidth = 6000;
    canvasHeight = (canvasWidth * principalImage.height) / principalImage.width;
  }

  resizeCanvas(canvasWidth, canvasHeight);

  tileNumberRow = principalImage.width / tileSizeFactor;
  tileNumberCol = principalImage.height / tileSizeFactor;

  tileDimensionH = Math.abs(canvasWidth / tileNumberRow);
  tileDimensionV = tileDimensionH * formats[1] / formats[0];

  tileNumberRow = canvasWidth / tileDimensionH;
  tileNumberCol = canvasHeight / tileDimensionV;

  getTonalityFromImages();

  canvas.getContext('2d', { willReadFrequently: true });

  image(principalImage, 0, 0, canvasWidth, canvasHeight);
  colorMode(RGB);

  for (let i = 0; i < tileNumberRow; i++) {
    for (let j = 0; j < tileNumberCol; j++) {
      pixelsToCompare.push([i, j]);
    }
  }

  pixelsToCompare = shuffle(pixelsToCompare);
}

function draw() {
  if (!principalImage) return;

  if (comparedPixels.length < pixelsToCompare.length) {
    if (pixelsToCompare.length - comparedPixels.length < forLoopIncrementer) {
      forLoopIncrementer = pixelsToCompare.length - comparedPixels.length;
    }

    for (let i = 0; i < forLoopIncrementer; i++) {
      const row = pixelsToCompare[forLoopCounter + i][0];
      const col = pixelsToCompare[forLoopCounter + i][1];

      comparedPixels.push([row, col]);

      let pixel = get(row * tileDimensionH + tileDimensionH / 2, col * tileDimensionV + tileDimensionV / 2);

      const brightness = Math.floor(0.299 * pixel[0] + 0.587 * pixel[1] + 0.114 * pixel[2]);

      comparePixel(pixel, row, col, brightness);
    }

    forLoopCounter += forLoopIncrementer;
  } else {
    if (mustSave === 0) {
      save("myimage.jpg");
      mustSave = 1;
      noLoop();
    }
  }
}

function getTonalityFromImages() {
  for (let imgToCheck = 0; imgToCheck < testingData.length; imgToCheck++) {
    let currImg = testingData[imgToCheck];
    currImg.loadPixels();

    let totalBrightness = 0;
    const numPixels = currImg.width * currImg.height;

    for (let i = 0; i < numPixels; i++) {
      const index = i * 4;
      const r = currImg.pixels[index];
      const g = currImg.pixels[index + 1];
      const b = currImg.pixels[index + 2];
      totalBrightness += 0.299 * r + 0.587 * g + 0.114 * b;
    }

    imgsValues[imgToCheck] = Math.floor(totalBrightness / numPixels);
  }
}

function comparePixel(pixel, i, j, pixelTonality) {
  let okImgs = [];
  let img;
  let closestDifference = Infinity;
  let indexOfClosest = 0;

  for (let k = 0; k < imgsValues.length; k++) {
    let diff = Math.abs(imgsValues[k] - pixelTonality);

    if (diff < closestDifference) {
      closestDifference = diff;
      indexOfClosest = k;
    }

    if (pixelTonality < 40 && diff < 60 ||
        pixelTonality > 150 && diff < 60) {
      okImgs.push(k);
    }
  }

  let chosenIndex = okImgs.length > 0
    ? okImgs[Math.floor(Math.random() * okImgs.length)]
    : indexOfClosest;

  img = testingData[chosenIndex];
  if (!usedImages.includes(img)) usedImages.push(img);

  if (formats[0] / formats[1] > img.width / img.height) {
    image(img, i * tileDimensionH, j * tileDimensionV, tileDimensionH, tileDimensionV,
      0, img.height / 2 - Math.abs(img.width / formats[0] * formats[1]) / 2,
      img.width, img.width / formats[0] * formats[1]);
  } else {
    image(img, i * tileDimensionH, j * tileDimensionV, tileDimensionH, tileDimensionV,
      img.width / 2 - Math.abs(img.height / formats[1] * formats[0]) / 2, 0,
      img.height / formats[1] * formats[0], img.height);
  }
}

function pixelizePrinc(tileNumberRow, tileNumberCol) {
  for (let i = 0; i < tileNumberRow; i++) {
    for (let j = 0; j < tileNumberCol; j++) {
      let pixel = get(i * tileDimensionH + tileDimensionH / 2, j * tileDimensionV + tileDimensionV / 2);
      const brightness = Math.floor(0.299 * pixel[0] + 0.587 * pixel[1] + 0.114 * pixel[2]);
      comparePixel(pixel, i, j, brightness);
    }
  }
}

function mouseClicked() {
  pixelizePrinc(tileNumberRow, tileNumberCol);
}

function shuffle(array) {
  let currentIndex = array.length;
  while (currentIndex != 0) {
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
}
