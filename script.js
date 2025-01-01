var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { GRAY, LIME_GREEN, WHITESMOKE } from "./constant.js";
// let debug = false;
export class GameWindow {
    constructor(canvas) {
        this.canvas = canvas;
        this.WIDTH = 960;
        this.HEIGHT = 656;
        this.HALF_WIDTH = this.WIDTH / 2;
        this.HALF_HEIGHT = this.HEIGHT / 2;
        this.BYTES_PER_PIXEL = 4;
        this.currentFPS = 0;
        this.tickCount = 0;
        // Map
        this.map = "";
        this.mapWidth = 12;
        this.mapHeight = 12;
        this.windowOffset = 0;
        this.miniMapWidth = 16;
        this.TILE_SIZE = 64;
        // Wall
        this.fWallTextures = {};
        this.fDiagonalDistanceWall = [];
        // Angle
        this.ANGLE_60_DEG = this.WIDTH;
        this.ANGLE_30_DEG = Math.floor(this.ANGLE_60_DEG / 2);
        this.ANGLE_2_DEG = Math.floor(this.ANGLE_30_DEG / 15);
        this.ANGLE_3_DEG = Math.floor(this.ANGLE_30_DEG / 10);
        this.ANGLE_4_DEG = Math.floor(this.ANGLE_60_DEG / 15);
        this.ANGLE_5_DEG = Math.floor(this.ANGLE_30_DEG / 6);
        this.ANGLE_10_DEG = Math.floor(this.ANGLE_5_DEG * 2);
        this.ANGLE_90_DEG = Math.floor(this.ANGLE_30_DEG * 3);
        this.ANGLE_180_DEG = Math.floor(this.ANGLE_60_DEG * 3);
        this.ANGLE_270_DEG = Math.floor(this.ANGLE_30_DEG * 9);
        this.ANGLE_360_DEG = Math.floor(this.ANGLE_60_DEG * 6);
        this.ANGLE_0_DEG = 0;
        // Angle Array
        this.fSinArray = [];
        this.fCosArray = [];
        this.fTanArray = [];
        this.fISinArray = [];
        this.fICosArray = [];
        this.fITanArray = [];
        this.fFishTable = [];
        // Step array
        this.fXStepTable = [];
        this.fYStepTable = [];
        // Player
        this.fPlayerX = 156;
        this.fPlayerY = 256;
        this.fPlayerDeg = this.ANGLE_90_DEG;
        this.fPlayerSpeed = 7;
        this.fKeyUp = false;
        this.fKeyDown = false;
        this.fKeyLeft = false;
        this.fKeyRight = false;
        this.fPlayerMapX = 0;
        this.fPlayerMapY = 0;
        this.fPlayerDistToProjectionPlane = 0;
        this.fPlayerHeight = 30;
        this.ctx = this.canvas.getContext('2d');
        this.currentTimeStamp = Date.now();
        this.frameRate = 60;
        this.offscreenCanvas = document.createElement('canvas');
        const canvasBufferCtx = this.offscreenCanvas.getContext('2d');
        if (!canvasBufferCtx)
            throw new Error('No context found');
        this.offscreenCanvasContext = canvasBufferCtx;
        this.offscreenCanvasPixel = this.offscreenCanvasContext.getImageData(0, 0, canvas.width, canvas.height);
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.setup();
            this.handleKeyUpBinding();
            this.handleKeyDownBinding();
            requestAnimationFrame(this.update.bind(this));
        });
    }
    setup() {
        return __awaiter(this, void 0, void 0, function* () {
            this.resizeCanvas();
            yield this.setupWall();
            yield this.setupFloor();
            this.fSinArray = new Array(this.ANGLE_360_DEG + 1);
            this.fCosArray = new Array(this.ANGLE_360_DEG + 1);
            this.fTanArray = new Array(this.ANGLE_360_DEG + 1);
            this.fISinArray = new Array(this.ANGLE_360_DEG + 1);
            this.fCosArray = new Array(this.ANGLE_360_DEG + 1);
            this.fITanArray = new Array(this.ANGLE_360_DEG + 1);
            this.fFishTable = new Array(this.ANGLE_60_DEG + 1);
            this.fXStepTable = new Array(this.ANGLE_360_DEG + 1);
            this.fYStepTable = new Array(this.ANGLE_360_DEG + 1);
            this.fDiagonalDistanceWall = new Array(this.WIDTH);
            for (let i = 0; i <= this.ANGLE_360_DEG; ++i) {
                // TODO : 
                const rad = this.degToRad(i) + (0.0001);
                // const rad = this.degToRad(i)
                this.fSinArray[i] = Math.sin(rad);
                this.fCosArray[i] = Math.cos(rad);
                this.fTanArray[i] = Math.tan(rad);
                this.fISinArray[i] = 1.0 / this.fSinArray[i];
                this.fICosArray[i] = 1.0 / this.fCosArray[i];
                this.fITanArray[i] = 1.0 / this.fTanArray[i];
                if (i >= this.ANGLE_90_DEG && i < this.ANGLE_270_DEG) {
                    this.fXStepTable[i] = this.TILE_SIZE / this.fTanArray[i];
                    if (this.fXStepTable[i] > 0) {
                        this.fXStepTable[i] = -this.fXStepTable[i];
                    }
                }
                else {
                    this.fXStepTable[i] = this.TILE_SIZE / this.fTanArray[i];
                    if (this.fXStepTable[i] < 0) {
                        this.fXStepTable[i] = -this.fXStepTable[i];
                    }
                }
                if (i >= this.ANGLE_0_DEG && i < this.ANGLE_180_DEG) {
                    this.fYStepTable[i] = this.fTanArray[i] * this.TILE_SIZE;
                    if (this.fYStepTable[i] < 0) {
                        this.fYStepTable[i] = -this.fYStepTable[i];
                    }
                }
                else {
                    this.fYStepTable[i] = this.fTanArray[i] * this.TILE_SIZE;
                    if (this.fYStepTable[i] > 0) {
                        this.fYStepTable[i] = -this.fYStepTable[i];
                    }
                }
            }
            for (let i = -this.ANGLE_30_DEG; i <= this.ANGLE_30_DEG; ++i) {
                const rad = this.degToRad(i);
                this.fFishTable[i + this.ANGLE_30_DEG] = 1.0 / Math.cos(rad);
            }
            this.fPlayerDistToProjectionPlane = Math.floor((this.HALF_WIDTH) / this.fTanArray[this.ANGLE_30_DEG]);
            for (let i = 0; i < this.fDiagonalDistanceWall.length; ++i) {
                this.fDiagonalDistanceWall[i] = new Array(this.HALF_HEIGHT);
            }
            for (let i = 0; i < this.WIDTH; ++i) {
                for (let j = this.HALF_HEIGHT; j < this.HEIGHT; ++j) {
                    let sub = j - this.HALF_HEIGHT;
                    let ratio = (this.fPlayerHeight) / sub;
                    let diagonalDistance = (Math.floor(this.fPlayerDistToProjectionPlane * ratio)) * (this.fFishTable[i]);
                    this.fDiagonalDistanceWall[i][j] = diagonalDistance;
                }
            }
            // Recalculate Offset
            this.windowOffset = Math.floor(this.canvas.width / 2 - this.WIDTH / 2);
            const map = "111111111111" +
                "100000000001" +
                "102200000001" +
                "100000000001" +
                "100000000001" +
                "100001000001" +
                "100000000001" +
                "100000000301" +
                "100044400001" +
                "100000000201" +
                "100000000201" +
                "111111111111";
            this.map = map;
        });
    }
    update() {
        this.resetCanvasBuffer();
        this.drawBackground();
        this.drawMap();
        this.updatePlayerMapPosition();
        this.raycast();
        this.drawPlayerPositionOnMap();
        this.paintCanvasBuffer();
        this.rotatePlayerPosition();
        this.movePlayerPosition();
        this.calculateFPS();
        this.drawFPS();
        requestAnimationFrame(this.update.bind(this));
    }
    resetCanvasBuffer() {
        this.offscreenCanvasContext.clearRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
    }
    paintCanvasBuffer() {
        this.ctx.putImageData(this.offscreenCanvasPixel, 0, 0);
    }
    movePlayerPosition() {
        const maxWallDistance = 30;
        let dirX = undefined;
        let dirY = undefined;
        let sinDeg = this.fSinArray[this.fPlayerDeg];
        let cosDeg = this.fCosArray[this.fPlayerDeg];
        if (this.fKeyUp) {
            dirX = (this.fPlayerSpeed * cosDeg);
            dirY = (this.fPlayerSpeed * sinDeg);
        }
        if (this.fKeyDown) {
            dirX = -(this.fPlayerSpeed * cosDeg);
            dirY = -(this.fPlayerSpeed * sinDeg);
        }
        if (dirX === undefined || dirY === undefined)
            return;
        this.fPlayerX += dirX;
        this.fPlayerY += dirY;
        // Collission Detection
        const xIndex = Math.floor(this.fPlayerX / this.TILE_SIZE);
        const yIndex = Math.floor(this.fPlayerY / this.TILE_SIZE);
        const xDirOffset = this.fPlayerX % this.TILE_SIZE;
        const yDirOffset = this.fPlayerY % this.TILE_SIZE;
        if (dirX > 0) {
            // Right
            const idx = yIndex * this.mapWidth + (xIndex + 1);
            if ((this.map.charAt(idx) !== '0') && xDirOffset > (this.TILE_SIZE - maxWallDistance)) {
                this.fPlayerX -= xDirOffset - (this.TILE_SIZE - maxWallDistance);
            }
        }
        else {
            // Left
            const idx = yIndex * this.mapWidth + (xIndex - 1);
            if (this.map.charAt(idx) !== '0' && xDirOffset < maxWallDistance) {
                this.fPlayerX += maxWallDistance - xDirOffset;
            }
        }
        if (dirY < 0) {
            // Top
            const idx = (yIndex - 1) * this.mapWidth + xIndex;
            if (this.map.charAt(idx) !== '0' && yDirOffset < maxWallDistance) {
                this.fPlayerY += maxWallDistance - yDirOffset;
            }
        }
        else {
            // Bottom
            const idx = (yIndex + 1) * this.mapWidth + xIndex;
            if (this.map.charAt(idx) !== '0' && yDirOffset > (this.TILE_SIZE - maxWallDistance)) {
                this.fPlayerY -= yDirOffset - (this.TILE_SIZE - maxWallDistance);
            }
        }
    }
    rotatePlayerPosition() {
        if (this.fKeyLeft) {
            this.fPlayerDeg -= this.ANGLE_4_DEG;
            if (this.fPlayerDeg < 0)
                this.fPlayerDeg += this.ANGLE_360_DEG;
        }
        if (this.fKeyRight) {
            this.fPlayerDeg += this.ANGLE_4_DEG;
            if (this.fPlayerDeg > this.ANGLE_360_DEG) {
                this.fPlayerDeg -= this.ANGLE_360_DEG;
            }
        }
    }
    raycast() {
        let verticalGridPosition;
        let horizontalGridPosition;
        let xIntersection;
        let yIntersection;
        let distToNextHorizontalGrid;
        let distToNextVerticalGrid;
        let distToNextVerticalWall;
        let distToNextHorizontalWall;
        let wallTypeVertical = '';
        let wallTypeHorizontal = '';
        let curDeg = this.fPlayerDeg - this.ANGLE_30_DEG;
        if (curDeg < 0) {
            curDeg = this.ANGLE_360_DEG + curDeg;
        }
        for (let currentColumn = 0; currentColumn < this.WIDTH; currentColumn += 1) {
            // Vertical
            if (curDeg < this.ANGLE_90_DEG || curDeg > this.ANGLE_270_DEG) {
                // Right
                verticalGridPosition = this.TILE_SIZE + Math.floor(this.fPlayerX / this.TILE_SIZE) * this.TILE_SIZE;
                let yTemp = (verticalGridPosition - this.fPlayerX) * this.fTanArray[curDeg];
                yIntersection = this.fPlayerY + yTemp;
                distToNextVerticalGrid = this.TILE_SIZE;
            }
            else {
                // Left
                verticalGridPosition = Math.floor(this.fPlayerX / this.TILE_SIZE) * this.TILE_SIZE;
                let yTemp = (verticalGridPosition - this.fPlayerX) * this.fTanArray[curDeg];
                yIntersection = this.fPlayerY + yTemp;
                distToNextVerticalGrid = -this.TILE_SIZE;
                --verticalGridPosition;
            }
            if (curDeg === this.ANGLE_90_DEG || curDeg === this.ANGLE_270_DEG) {
                distToNextVerticalWall = Number.MAX_VALUE;
            }
            else {
                let distToNextYIntersection = this.fYStepTable[curDeg];
                while (true) {
                    let xGridIndex = Math.floor((verticalGridPosition) / this.TILE_SIZE);
                    let yGridIndex = Math.floor(yIntersection / this.TILE_SIZE);
                    let mapIdx = Math.floor(yGridIndex * this.mapWidth + xGridIndex);
                    if (xGridIndex >= this.mapWidth
                        || yGridIndex >= this.mapHeight
                        || xGridIndex < 0
                        || yGridIndex < 0) {
                        distToNextVerticalWall = Number.MAX_VALUE;
                        break;
                    }
                    else if (this.map.charAt(mapIdx) !== '0') {
                        distToNextVerticalWall = (yIntersection - this.fPlayerY) * (this.fISinArray[curDeg]);
                        wallTypeVertical = this.map.charAt(mapIdx);
                        break;
                    }
                    else {
                        verticalGridPosition += distToNextVerticalGrid;
                        yIntersection += distToNextYIntersection;
                    }
                }
            }
            // Horizontal
            if (curDeg > this.ANGLE_0_DEG && curDeg < this.ANGLE_180_DEG) {
                // Bottom
                horizontalGridPosition = this.TILE_SIZE + Math.floor(this.fPlayerY / this.TILE_SIZE) * this.TILE_SIZE;
                let xTemp = (horizontalGridPosition - this.fPlayerY) * this.fITanArray[curDeg];
                xIntersection = this.fPlayerX + xTemp;
                distToNextHorizontalGrid = this.TILE_SIZE;
            }
            else {
                // Top
                horizontalGridPosition = Math.floor(this.fPlayerY / this.TILE_SIZE) * this.TILE_SIZE;
                let xTemp = (horizontalGridPosition - this.fPlayerY) * this.fITanArray[curDeg];
                xIntersection = this.fPlayerX + xTemp;
                distToNextHorizontalGrid = -this.TILE_SIZE;
                --horizontalGridPosition;
            }
            if (curDeg === this.ANGLE_0_DEG || curDeg === this.ANGLE_180_DEG) {
                distToNextHorizontalWall = Number.MAX_VALUE;
            }
            else {
                let distToNextXIntersection = this.fXStepTable[curDeg];
                while (true) {
                    let xGridIndex = Math.floor(xIntersection / this.TILE_SIZE);
                    let yGridIndex = Math.floor((horizontalGridPosition) / this.TILE_SIZE);
                    let mapIdx = Math.floor(yGridIndex * this.mapWidth + xGridIndex);
                    if (xGridIndex >= this.mapWidth
                        || yGridIndex >= this.mapHeight
                        || xGridIndex < 0
                        || yGridIndex < 0) {
                        distToNextHorizontalWall = Number.MAX_VALUE;
                        break;
                    }
                    else if (this.map.charAt(mapIdx) !== '0') {
                        wallTypeHorizontal = this.map.charAt(mapIdx);
                        distToNextHorizontalWall = (xIntersection - this.fPlayerX) * this.fICosArray[curDeg];
                        break;
                    }
                    else {
                        horizontalGridPosition += distToNextHorizontalGrid;
                        xIntersection += distToNextXIntersection;
                    }
                }
            }
            let distToNextWall;
            let offsetWall;
            let wallType;
            if (distToNextVerticalWall < distToNextHorizontalWall) {
                distToNextWall = distToNextVerticalWall;
                offsetWall = yIntersection % this.TILE_SIZE;
                wallType = wallTypeVertical;
                this.drawRayCast(verticalGridPosition, yIntersection, LIME_GREEN);
            }
            else {
                distToNextWall = distToNextHorizontalWall;
                offsetWall = xIntersection % this.TILE_SIZE;
                wallType = wallTypeHorizontal;
                this.drawRayCast(xIntersection, horizontalGridPosition, LIME_GREEN);
            }
            // Compute the height based on the distance of the ray
            distToNextWall /= this.fFishTable[currentColumn];
            const wallHeight = this.fPlayerDistToProjectionPlane * this.TILE_SIZE / distToNextWall;
            let topWall = this.HALF_HEIGHT - (wallHeight / 2);
            let bottomWall = this.HALF_HEIGHT + (wallHeight / 2);
            distToNextWall = Math.floor(distToNextWall);
            this.drawWall(currentColumn + this.windowOffset, topWall, (bottomWall - topWall), wallType, offsetWall, 120 / distToNextWall);
            this.drawFloor(bottomWall, currentColumn, curDeg);
            curDeg += 1;
            if (curDeg >= this.ANGLE_360_DEG)
                curDeg = curDeg - this.ANGLE_360_DEG;
        }
    }
    drawFloor(bottomWall, currentColumn, curDeg) {
        bottomWall = Math.floor(bottomWall);
        let targetIndex = (bottomWall * this.BYTES_PER_PIXEL * this.offscreenCanvas.width)
            + ((currentColumn + this.windowOffset) * this.BYTES_PER_PIXEL);
        for (let curDist = bottomWall; curDist < this.HEIGHT; ++curDist) {
            let diagonalDistance = this.fDiagonalDistanceWall[currentColumn][curDist];
            let xEnd = diagonalDistance * this.fCosArray[curDeg];
            let yEnd = diagonalDistance * this.fSinArray[curDeg];
            xEnd += this.fPlayerX;
            yEnd += this.fPlayerY;
            let xPos = Math.floor(xEnd / this.TILE_SIZE);
            let yPos = Math.floor(yEnd / this.TILE_SIZE);
            if (xPos < 0 || yPos < 0 || xPos > this.mapWidth || yPos > this.mapHeight) {
                break;
            }
            let offsetFloorX = Math.floor(xEnd % this.TILE_SIZE);
            let offsetFloorY = Math.floor(yEnd % this.TILE_SIZE);
            let sourceIndex = (offsetFloorY * this.BYTES_PER_PIXEL * this.TILE_SIZE) + (offsetFloorX * this.BYTES_PER_PIXEL);
            if (!this.fFloorTexturePixel)
                throw new Error('not loaded yet');
            let brightness = (120 / diagonalDistance);
            const red = this.fFloorTexturePixel.data[sourceIndex] * brightness;
            const green = this.fFloorTexturePixel.data[sourceIndex + 1] * brightness;
            const blue = this.fFloorTexturePixel.data[sourceIndex + 2] * brightness;
            const alpha = this.fFloorTexturePixel.data[sourceIndex + 3];
            this.offscreenCanvasPixel.data[targetIndex] = red;
            this.offscreenCanvasPixel.data[targetIndex + 1] = green;
            this.offscreenCanvasPixel.data[targetIndex + 2] = blue;
            this.offscreenCanvasPixel.data[targetIndex + 3] = alpha;
            targetIndex += (this.BYTES_PER_PIXEL * this.offscreenCanvas.width);
        }
    }
    drawWall(x, y, h, wallType, offsetWall, brightnessLevel) {
        if (!wallType)
            throw new Error('Wall type not specified');
        const wallTexturePixel = this.fWallTextures[wallType];
        if (!wallTexturePixel)
            throw new Error('Texture not loaded yet');
        x = Math.floor(x);
        y = Math.floor(y);
        h = Math.floor(h);
        offsetWall = Math.floor(offsetWall);
        let targetIndex = (this.BYTES_PER_PIXEL * this.canvas.width * y) + (this.BYTES_PER_PIXEL * x);
        let sourceIndex = offsetWall * this.BYTES_PER_PIXEL;
        let lastSourceIndex = sourceIndex + (this.BYTES_PER_PIXEL * wallTexturePixel.width * wallTexturePixel.height) - (wallTexturePixel.height);
        let heightToDraw = h;
        let yError = 0;
        while (true) {
            yError += h;
            const red = Math.floor(wallTexturePixel.data[sourceIndex] * brightnessLevel);
            const green = Math.floor(wallTexturePixel.data[sourceIndex + 1] * brightnessLevel);
            const blue = Math.floor(wallTexturePixel.data[sourceIndex + 2] * brightnessLevel);
            const alpha = wallTexturePixel.data[sourceIndex + 3];
            while (yError >= this.TILE_SIZE) {
                yError -= this.TILE_SIZE;
                this.offscreenCanvasPixel.data[targetIndex] = red;
                this.offscreenCanvasPixel.data[targetIndex + 1] = green;
                this.offscreenCanvasPixel.data[targetIndex + 2] = blue;
                this.offscreenCanvasPixel.data[targetIndex + 3] = alpha;
                --heightToDraw;
                if (heightToDraw <= 0) {
                    return;
                }
                targetIndex += (this.BYTES_PER_PIXEL * this.canvas.width);
            }
            sourceIndex += (this.BYTES_PER_PIXEL * this.TILE_SIZE);
            if (sourceIndex > lastSourceIndex) {
                sourceIndex = lastSourceIndex;
            }
        }
    }
    drawRayCast(x, y, color) {
        this.drawLine(this.fPlayerMapX, this.fPlayerMapY, ((x * this.miniMapWidth) / this.TILE_SIZE), ((y * this.miniMapWidth) / this.TILE_SIZE), color);
    }
    handleKeyDownBinding() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'w')
                this.fKeyUp = true;
            else if (e.key === 's')
                this.fKeyDown = true;
            else if (e.key === 'a')
                this.fKeyLeft = true;
            else if (e.key === 'd')
                this.fKeyRight = true;
        });
    }
    handleKeyUpBinding() {
        window.addEventListener('keyup', (e) => {
            if (e.key === 'w')
                this.fKeyUp = false;
            else if (e.key === 's')
                this.fKeyDown = false;
            else if (e.key === 'a')
                this.fKeyLeft = false;
            else if (e.key === 'd')
                this.fKeyRight = false;
        });
    }
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.offscreenCanvas.width = this.canvas.width;
        this.offscreenCanvas.height = this.canvas.height;
        this.offscreenCanvasPixel = this.offscreenCanvasContext.getImageData(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
    }
    setupWall() {
        return Promise.all([1, 2, 3, 4].map((el) => {
            return new Promise(res => {
                const img = new Image(64, 64);
                img.src = `assets/walls/wall${el}.jpg`;
                img.crossOrigin = "Anonymous";
                img.onload = () => {
                    var _a;
                    const c = document.createElement('canvas');
                    (_a = c.getContext('2d')) === null || _a === void 0 ? void 0 : _a.drawImage(img, 0, 0);
                    this.fWallTextures[`${el}`] = c.getContext('2d').getImageData(0, 0, 64, 64);
                    return res(null);
                };
            });
        }));
        // ['1', '2', '3', '4'].forEach((el: string) => {
        //     const img = document.createElement('img')
        //     img.src = `./assets/walls/wall${el}.jpg`
        //     this.images[el] = img
        // });
    }
    setupFloor() {
        return new Promise((res, rej) => {
            const img = new Image(64, 64);
            img.src = `assets/floor/floortile.png`;
            img.crossOrigin = "Anonymous";
            img.onload = () => {
                const c = document.createElement('canvas');
                const x = c.getContext('2d');
                if (!x)
                    throw rej('Setup floor');
                x.drawImage(img, 0, 0);
                this.fFloorTexturePixel = x.getImageData(0, 0, 64, 64);
                res(null);
            };
        });
    }
    drawBackground() {
        let c = 70;
        let i = 0;
        for (i = 0; i < this.HEIGHT / 2; ++i) {
            this.drawFilledRect(0 + this.windowOffset, i, this.WIDTH, 1, { red: 247, green: c, blue: 25, alpha: 255 });
            c = Math.min(c + 0.25, 145);
        }
        c = 22;
        for (; i < this.HEIGHT; ++i) {
            this.drawFilledRect(0 + this.windowOffset, i, this.WIDTH, 1, { red: c, green: 20, blue: 20, alpha: 255 });
            c = Math.min(c + 1, 200);
        }
    }
    calculateFPS() {
        let currentTimeStamp = Date.now();
        ++this.tickCount;
        if (this.tickCount > 59) {
            this.currentFPS = Math.floor(1000 / (currentTimeStamp - this.currentTimeStamp));
            this.tickCount = 0;
        }
        this.currentTimeStamp = currentTimeStamp;
    }
    degToRad(deg) {
        return (deg * Math.PI) / this.ANGLE_180_DEG;
    }
    drawFPS() {
        this.ctx.beginPath();
        this.ctx.fillStyle = 'black';
        this.ctx.font = "20px serif";
        const windowOffsetRight = Math.floor(this.canvas.width / 2 + this.WIDTH / 2) - 100;
        this.ctx.fillText("FPS : " + this.currentFPS, windowOffsetRight, 20);
    }
    drawMap() {
        for (let row = 0; row < this.mapHeight; ++row) {
            for (let col = 0; col < this.mapWidth; ++col) {
                const target = this.map.charAt(row * this.mapHeight + col);
                let color = WHITESMOKE;
                if (target !== '0') {
                    color = GRAY;
                }
                else {
                }
                this.drawFilledRect(col * this.miniMapWidth, row * this.miniMapWidth, this.miniMapWidth, this.miniMapWidth, color);
            }
        }
    }
    updatePlayerMapPosition() {
        this.fPlayerMapX = (this.fPlayerX / this.TILE_SIZE * this.miniMapWidth);
        this.fPlayerMapY = this.fPlayerY / this.TILE_SIZE * this.miniMapWidth;
    }
    drawPlayerPositionOnMap() {
        const dist = 20;
        this.drawLine(Math.floor(this.fPlayerMapX), Math.floor(this.fPlayerMapY), Math.floor(this.fPlayerMapX + (this.fCosArray[this.fPlayerDeg] * dist)), Math.floor(this.fPlayerMapY + (this.fSinArray[this.fPlayerDeg] * dist)), { red: 0, green: 0, blue: 255, alpha: 255 });
    }
    drawFilledRect(x, y, width, height, color) {
        let targetIndex = (this.offscreenCanvas.width * this.BYTES_PER_PIXEL * y) + (this.BYTES_PER_PIXEL * x);
        for (let h = 0; h < height; ++h) {
            for (let w = 0; w < width; ++w) {
                this.offscreenCanvasPixel.data[targetIndex] = color.red;
                this.offscreenCanvasPixel.data[targetIndex + 1] = color.green;
                this.offscreenCanvasPixel.data[targetIndex + 2] = color.blue;
                this.offscreenCanvasPixel.data[targetIndex + 3] = color.alpha;
                targetIndex += this.BYTES_PER_PIXEL;
            }
            // targetIndex += this.BYTES_PER_PIXEL
            targetIndex += ((this.offscreenCanvas.width - width) * this.BYTES_PER_PIXEL);
        }
        /// this.ctx.beginPath()
        /// this.ctx.fillStyle = color
        /// this.ctx.fillRect(x, y, width, height)
        /// this.ctx.fill()
    }
    drawLine(startX, startY, endX, endY, color) {
        let targetIndex = (this.BYTES_PER_PIXEL * this.offscreenCanvas.width * startY) + (startX * this.BYTES_PER_PIXEL);
        let dirX;
        let dirY;
        let dy = endY - startY;
        if (dy < 0) {
            // going up
            dy = -dy;
            dirY = -(this.offscreenCanvas.width * this.BYTES_PER_PIXEL);
        }
        else {
            // going down
            dirY = (this.offscreenCanvas.width * this.BYTES_PER_PIXEL);
        }
        let dx = endX - startX;
        if (dx < 0) {
            // going left
            dx = -dx;
            dirX = -(this.BYTES_PER_PIXEL);
        }
        else {
            // going right
            dirX = (this.BYTES_PER_PIXEL);
        }
        let length;
        let errY = 0;
        if (dx > dy) {
            length = dx;
            for (let i = 0; i <= length; ++i) {
                this.offscreenCanvasPixel.data[targetIndex] = color.red;
                this.offscreenCanvasPixel.data[targetIndex + 1] = color.green;
                this.offscreenCanvasPixel.data[targetIndex + 2] = color.blue;
                this.offscreenCanvasPixel.data[targetIndex + 3] = color.alpha;
                targetIndex += dirX;
                errY += dy;
                if (errY >= dx) {
                    errY -= dx;
                    targetIndex += dirY;
                }
            }
        }
        else {
            length = dy;
            for (let i = 0; i <= length; ++i) {
                this.offscreenCanvasPixel.data[targetIndex] = color.red;
                this.offscreenCanvasPixel.data[targetIndex + 1] = color.green;
                this.offscreenCanvasPixel.data[targetIndex + 2] = color.blue;
                this.offscreenCanvasPixel.data[targetIndex + 3] = color.alpha;
                targetIndex += dirY;
                errY += dx;
                if (errY >= dy) {
                    errY -= dy;
                    targetIndex += dirX;
                }
            }
        }
        // this.ctx.beginPath()
        // this.ctx.lineWidth = 2
        // this.ctx.strokeStyle = color
        // this.ctx.moveTo(startX, startY)
        // this.ctx.lineTo(endX, endY)
        // this.ctx.stroke()
    }
    drawCircle(x, y, radius, color) {
        this.ctx.beginPath();
        this.ctx.fillStyle = color;
        this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
        this.ctx.fill();
    }
}
