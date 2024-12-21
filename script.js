let debug = false;
export class GameWindow {
    constructor(canvas) {
        this.canvas = canvas;
        this.WIDTH = 900;
        this.HEIGHT = 660;
        this.HALF_WIDTH = this.WIDTH / 2;
        this.currentFPS = 0;
        this.tickCount = 0;
        // Map
        this.map = "";
        this.mapWidth = 12;
        this.mapHeight = 12;
        this.windowOffset = 0;
        this.miniMapWidth = 16;
        this.TILE_SIZE = 64;
        // Angle
        this.ANGLE_60_DEG = this.WIDTH;
        this.ANGLE_30_DEG = Math.floor(this.ANGLE_60_DEG / 2);
        this.ANGLE_3_DEG = Math.floor(this.ANGLE_30_DEG / 10);
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
        // Step array
        this.fXStepTable = [];
        this.fYStepTable = [];
        // Player
        this.fPlayerX = 256;
        this.fPlayerY = 256;
        this.fPlayerDeg = this.ANGLE_5_DEG;
        this.fPlayerSpeed = 7;
        this.fKeyUp = false;
        this.fKeyDown = false;
        this.fKeyLeft = false;
        this.fKeyRight = false;
        this.fPlayerMapX = 0;
        this.fPlayerMapY = 0;
        this.ctx = this.canvas.getContext('2d');
        this.currentTimeStamp = Date.now();
        this.frameRate = 60;
    }
    start() {
        this.setup();
        this.handleKeyUpBinding();
        this.handleKeyDownBinding();
        requestAnimationFrame(this.update.bind(this));
    }
    setup() {
        this.resizeCanvas();
        this.fSinArray = new Array(this.ANGLE_360_DEG + 1);
        this.fCosArray = new Array(this.ANGLE_360_DEG + 1);
        this.fTanArray = new Array(this.ANGLE_360_DEG + 1);
        this.fISinArray = new Array(this.ANGLE_360_DEG + 1);
        this.fCosArray = new Array(this.ANGLE_360_DEG + 1);
        this.fITanArray = new Array(this.ANGLE_360_DEG + 1);
        this.fXStepTable = new Array(this.ANGLE_360_DEG + 1);
        this.fYStepTable = new Array(this.ANGLE_360_DEG + 1);
        for (let i = 0; i <= this.ANGLE_360_DEG; ++i) {
            // TODO : 
            // const rad = this.degToRad(i) + 0.001
            const rad = this.degToRad(i);
            this.fSinArray[i] = Math.sin(rad);
            this.fCosArray[i] = Math.cos(rad);
            this.fTanArray[i] = Math.tan(rad);
            this.fISinArray[i] = 1 / this.fSinArray[i];
            this.fICosArray[i] = 1 / this.fCosArray[i];
            this.fITanArray[i] = 1 / this.fTanArray[i];
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
            if (i <= this.ANGLE_90_DEG || i > this.ANGLE_270_DEG) {
                this.fXStepTable[i] = this.TILE_SIZE / this.fTanArray[i];
                if (this.fXStepTable[i] < 0) {
                    this.fXStepTable[i] = -this.fXStepTable[i];
                }
            }
            else {
                this.fXStepTable[i] = this.TILE_SIZE / this.fTanArray[i];
                if (this.fXStepTable[i] > 0) {
                    this.fXStepTable[i] = -this.fXStepTable[i];
                }
            }
        }
        // Recalculate Offset
        this.windowOffset = Math.floor(this.canvas.width / 2 - this.WIDTH / 2);
        const map = "111111111111" +
            "100000000001" +
            "100000000001" +
            "100001100001" +
            "100001100001" +
            "100000000001" +
            "100000000001" +
            "100000000001" +
            "100001000001" +
            "100001110001" +
            "100000000001" +
            "111111111111";
        this.map = map;
    }
    update() {
        this.drawBackground();
        this.drawFPS();
        this.drawMap();
        this.calculateFPS();
        this.movePlayerPosition();
        this.rotatePlayerPosition();
        this.raycast();
        // this.drawPlayerPositionOnMap()
        setTimeout(() => {
            requestAnimationFrame(this.update.bind(this));
        }, 1000 / this.frameRate);
    }
    movePlayerPosition() {
        let newfPlayerX;
        let newfPlayerY;
        if (this.fKeyUp) {
            newfPlayerX = (this.fPlayerSpeed * this.fCosArray[this.fPlayerDeg]) + this.fPlayerX;
            newfPlayerY = (this.fPlayerSpeed * this.fSinArray[this.fPlayerDeg]) + this.fPlayerY;
            const idx = Math.floor(newfPlayerY / this.TILE_SIZE) * this.mapWidth + Math.floor(newfPlayerX / this.TILE_SIZE);
            if (this.map.charAt(idx) === '0') {
                this.fPlayerX = newfPlayerX;
                this.fPlayerY = newfPlayerY;
            }
        }
        if (this.fKeyDown) {
            newfPlayerX = this.fPlayerX - (this.fPlayerSpeed * this.fCosArray[this.fPlayerDeg]);
            newfPlayerY = this.fPlayerY - (this.fPlayerSpeed * this.fSinArray[this.fPlayerDeg]);
            const idx = Math.floor(newfPlayerY / this.TILE_SIZE) * this.mapWidth + Math.floor(newfPlayerX / this.TILE_SIZE);
            if (this.map.charAt(idx) === '0') {
                this.fPlayerX = newfPlayerX;
                this.fPlayerY = newfPlayerY;
            }
        }
    }
    rotatePlayerPosition() {
        if (this.fKeyLeft) {
            this.fPlayerDeg -= this.ANGLE_5_DEG;
            if (this.fPlayerDeg < 0)
                this.fPlayerDeg += this.ANGLE_360_DEG;
        }
        if (this.fKeyRight) {
            this.fPlayerDeg += this.ANGLE_5_DEG;
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
        const inc = this.ANGLE_60_DEG / this.WIDTH;
        let curDeg = this.fPlayerDeg - this.ANGLE_30_DEG;
        if (curDeg < 0) {
            curDeg = this.ANGLE_360_DEG + curDeg;
        }
        for (let i = 0; i < this.WIDTH; i += 1) {
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
                --verticalGridPosition;
                let yTemp = (verticalGridPosition - this.fPlayerX) * this.fTanArray[curDeg];
                yIntersection = this.fPlayerY + yTemp;
                distToNextVerticalGrid = -this.TILE_SIZE;
            }
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
                if (this.map.charAt(mapIdx) !== '0') {
                    distToNextVerticalWall = (yIntersection - this.fPlayerY) * this.fISinArray[curDeg];
                    break;
                }
                verticalGridPosition += distToNextVerticalGrid;
                yIntersection += distToNextYIntersection;
            }
            // Horizontal
            if (curDeg >= this.ANGLE_0_DEG && curDeg < this.ANGLE_180_DEG) {
                // Bottom
                horizontalGridPosition = this.TILE_SIZE + Math.floor(this.fPlayerY / this.TILE_SIZE) * this.TILE_SIZE;
                let xTemp = (horizontalGridPosition - this.fPlayerY) * this.fITanArray[curDeg];
                xIntersection = this.fPlayerX + xTemp;
                distToNextHorizontalGrid = this.TILE_SIZE;
            }
            else {
                // Top
                horizontalGridPosition = Math.floor(this.fPlayerY / this.TILE_SIZE) * this.TILE_SIZE;
                --horizontalGridPosition;
                let xTemp = (horizontalGridPosition - this.fPlayerY) * this.fITanArray[curDeg];
                xIntersection = this.fPlayerX + xTemp;
                distToNextHorizontalGrid = -this.TILE_SIZE;
            }
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
                if (this.map.charAt(mapIdx) !== '0') {
                    distToNextHorizontalWall = (horizontalGridPosition - this.fPlayerY) * this.fISinArray[curDeg];
                    break;
                }
                horizontalGridPosition += distToNextHorizontalGrid;
                xIntersection += distToNextXIntersection;
            }
            let xEndRay;
            let yEndRay;
            if (distToNextVerticalWall < distToNextHorizontalWall) {
                xEndRay = verticalGridPosition;
                yEndRay = yIntersection;
            }
            else {
                xEndRay = xIntersection;
                yEndRay = horizontalGridPosition;
            }
            this.drawRayCast(xEndRay, yEndRay, 'cyan');
            curDeg += inc;
            if (curDeg > this.ANGLE_360_DEG)
                curDeg = curDeg - this.ANGLE_360_DEG;
        }
    }
    drawRayCast(x, y, color) {
        this.drawLine(this.fPlayerMapX, this.fPlayerMapY, ((x * this.miniMapWidth) / this.TILE_SIZE) + this.windowOffset, ((y * this.miniMapWidth) / this.TILE_SIZE), color);
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
    }
    drawBackground() {
        let c = 70;
        let i = 0;
        for (i = 0; i < this.HEIGHT / 2; ++i) {
            this.drawLine(0 + this.windowOffset, i, this.WIDTH + this.windowOffset, i, `rgb(247,${c},25)`);
            // this.drawLine(0 + this.windowOffset, i, this.WIDTH + this.windowOffset, i, `black`)
            c = Math.min(c + 0.25, 145);
        }
        c = 22;
        for (; i < this.HEIGHT; ++i) {
            this.drawLine(0 + this.windowOffset, i, this.WIDTH + this.windowOffset, i, `rgb(${c},20,20)`);
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
        return deg * (Math.PI / this.ANGLE_180_DEG);
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
                let color = 'green';
                if (target !== '0') {
                    color = 'maroon';
                }
                else {
                }
                this.ctx.beginPath();
                this.ctx.strokeStyle = color;
                this.drawRect(col * this.miniMapWidth + this.windowOffset, row * this.miniMapWidth, this.miniMapWidth, this.miniMapWidth, color);
                // this.ctx.strokeRect(col * this.miniMapWidth + this.windowOffset, row * this.miniMapWidth, this.miniMapWidth, this.miniMapWidth)
                // this.ctx.stroke()
            }
        }
        this.fPlayerMapX = (this.fPlayerX / this.TILE_SIZE * this.miniMapWidth) + this.windowOffset;
        this.fPlayerMapY = this.fPlayerY / this.TILE_SIZE * this.miniMapWidth;
    }
    drawPlayerPositionOnMap() {
        const dist = 20;
        this.drawLine(this.fPlayerMapX, this.fPlayerMapY, this.fPlayerMapX + (this.fCosArray[this.fPlayerDeg] * dist), this.fPlayerMapY + (this.fSinArray[this.fPlayerDeg] * dist), 'blue');
    }
    drawRect(x, y, width, height, color) {
        this.ctx.beginPath();
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, width, height);
        this.ctx.fill();
    }
    drawLine(startX, startY, endX, endY, color) {
        this.ctx.beginPath();
        this.ctx.strokeStyle = color;
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
    }
    drawCircle(x, y, radius, color) {
        this.ctx.beginPath();
        this.ctx.fillStyle = color;
        this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
        this.ctx.fill();
    }
}
