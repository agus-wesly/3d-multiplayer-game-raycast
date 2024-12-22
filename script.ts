let debug = false;
export class GameWindow {
    // Canvas
    ctx: CanvasRenderingContext2D;
    WIDTH: number = 960;
    HEIGHT: number = 656;
    HALF_WIDTH: number = this.WIDTH / 2
    HALF_HEIGHT: number = this.HEIGHT / 2

    // FPS
    frameRate: number;
    currentTimeStamp: number;
    currentFPS: number = 0;
    tickCount: number = 0;

    // Map
    map: string = "";
    mapWidth = 12;
    mapHeight = 12;
    windowOffset: number = 0;
    miniMapWidth: number = 16;

    TILE_SIZE: number = 64;

    // Angle
    ANGLE_60_DEG: number = this.WIDTH;
    ANGLE_30_DEG = Math.floor(this.ANGLE_60_DEG / 2);
    ANGLE_3_DEG = Math.floor(this.ANGLE_30_DEG / 10);
    ANGLE_5_DEG = Math.floor(this.ANGLE_30_DEG / 6);
    ANGLE_10_DEG = Math.floor(this.ANGLE_5_DEG * 2);
    ANGLE_90_DEG: number = Math.floor(this.ANGLE_30_DEG * 3);
    ANGLE_180_DEG: number = Math.floor(this.ANGLE_60_DEG * 3);
    ANGLE_270_DEG: number = Math.floor(this.ANGLE_30_DEG * 9);
    ANGLE_360_DEG: number = Math.floor(this.ANGLE_60_DEG * 6);
    ANGLE_0_DEG: number = 0;

    // Angle Array
    fSinArray: Array<number> = []
    fCosArray: Array<number> = []
    fTanArray: Array<number> = []
    fISinArray: Array<number> = []
    fICosArray: Array<number> = []
    fITanArray: Array<number> = []

    // Step array
    fXStepTable: Array<number> = []
    fYStepTable: Array<number> = []

    // Player
    fPlayerX: number = 256;
    fPlayerY: number = 256;
    fPlayerDeg: number = this.ANGLE_5_DEG;
    fPlayerSpeed: number = 6;
    fKeyUp: boolean = false;
    fKeyDown: boolean = false;
    fKeyLeft: boolean = false;
    fKeyRight: boolean = false;
    fPlayerMapX: number = 0;
    fPlayerMapY: number = 0;
    fPlayerDistToProjectionPlane: number = 0

    constructor(readonly canvas: HTMLCanvasElement) {
        this.ctx = this.canvas.getContext('2d')!
        this.currentTimeStamp = Date.now()
        this.frameRate = 60
    }
    start() {
        this.setup()
        this.handleKeyUpBinding()
        this.handleKeyDownBinding()
        requestAnimationFrame(this.update.bind(this))
    }
    setup() {
        this.resizeCanvas()

        this.fSinArray = new Array(this.ANGLE_360_DEG + 1)
        this.fCosArray = new Array(this.ANGLE_360_DEG + 1)
        this.fTanArray = new Array(this.ANGLE_360_DEG + 1)
        this.fISinArray = new Array(this.ANGLE_360_DEG + 1)
        this.fCosArray = new Array(this.ANGLE_360_DEG + 1)
        this.fITanArray = new Array(this.ANGLE_360_DEG + 1)
        this.fXStepTable = new Array(this.ANGLE_360_DEG + 1)
        this.fYStepTable = new Array(this.ANGLE_360_DEG + 1)

        for (let i = 0; i <= this.ANGLE_360_DEG; ++i) {
            // TODO : 
            const rad = this.degToRad(i) + 0.001
            // const rad = this.degToRad(i)
            this.fSinArray[i] = Math.sin(rad)
            this.fCosArray[i] = Math.cos(rad)
            this.fTanArray[i] = Math.tan(rad)
            this.fISinArray[i] = 1 / this.fSinArray[i]
            this.fICosArray[i] = 1 / this.fCosArray[i]
            this.fITanArray[i] = 1 / this.fTanArray[i]

            if (i >= this.ANGLE_0_DEG && i < this.ANGLE_180_DEG) {
                this.fYStepTable[i] = this.fTanArray[i] * this.TILE_SIZE
                if (this.fYStepTable[i] < 0) {
                    this.fYStepTable[i] = -this.fYStepTable[i]
                }
            } else {
                this.fYStepTable[i] = this.fTanArray[i] * this.TILE_SIZE
                if (this.fYStepTable[i] > 0) {
                    this.fYStepTable[i] = -this.fYStepTable[i]
                }
            }

            if (i <= this.ANGLE_90_DEG || i > this.ANGLE_270_DEG) {
                this.fXStepTable[i] = this.TILE_SIZE / this.fTanArray[i]
                if (this.fXStepTable[i] < 0) {
                    this.fXStepTable[i] = -this.fXStepTable[i]
                }
            } else {
                this.fXStepTable[i] = this.TILE_SIZE / this.fTanArray[i]
                if (this.fXStepTable[i] > 0) {
                    this.fXStepTable[i] = -this.fXStepTable[i]
                }
            }
        }

        this.fPlayerDistToProjectionPlane = (this.HALF_WIDTH) * this.fTanArray[this.ANGLE_30_DEG]

        // Recalculate Offset
        this.windowOffset = Math.floor(this.canvas.width / 2 - this.WIDTH / 2)
        const map =
            "111111111111" +
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
            "111111111111"
        this.map = map;
    }
    update() {
        this.drawBackground()
        this.drawFPS()
        this.drawMap()
        this.updatePlayerMapPosition()
        this.raycast()
        this.calculateFPS()
        this.movePlayerPosition()
        this.rotatePlayerPosition()

        // this.drawPlayerPositionOnMap()
        setTimeout(() => {
            requestAnimationFrame(this.update.bind(this))
        }, 1000 / this.frameRate)
    }
    movePlayerPosition() {
        let newfPlayerX: number
        let newfPlayerY: number
        if (this.fKeyUp) {
            newfPlayerX = (this.fPlayerSpeed * this.fCosArray[this.fPlayerDeg]) + this.fPlayerX
            newfPlayerY = (this.fPlayerSpeed * this.fSinArray[this.fPlayerDeg]) + this.fPlayerY
            const idx = Math.floor(newfPlayerY / this.TILE_SIZE) * this.mapWidth + Math.floor(newfPlayerX / this.TILE_SIZE)
            if (this.map.charAt(idx) === '0') {
                this.fPlayerX = newfPlayerX
                this.fPlayerY = newfPlayerY
            }
        }
        if (this.fKeyDown) {
            newfPlayerX = this.fPlayerX - (this.fPlayerSpeed * this.fCosArray[this.fPlayerDeg])
            newfPlayerY = this.fPlayerY - (this.fPlayerSpeed * this.fSinArray[this.fPlayerDeg])
            const idx = Math.floor(newfPlayerY / this.TILE_SIZE) * this.mapWidth + Math.floor(newfPlayerX / this.TILE_SIZE)
            if (this.map.charAt(idx) === '0') {
                this.fPlayerX = newfPlayerX
                this.fPlayerY = newfPlayerY
            }
        }
    }
    rotatePlayerPosition() {
        if (this.fKeyLeft) {
            this.fPlayerDeg -= this.ANGLE_3_DEG
            if (this.fPlayerDeg < 0) this.fPlayerDeg += this.ANGLE_360_DEG
        }
        if (this.fKeyRight) {
            this.fPlayerDeg += this.ANGLE_3_DEG
            if (this.fPlayerDeg > this.ANGLE_360_DEG) {
                this.fPlayerDeg -= this.ANGLE_360_DEG
            }
        }
    }
    raycast() {
        let verticalGridPosition
        let horizontalGridPosition
        let xIntersection
        let yIntersection
        let distToNextHorizontalGrid
        let distToNextVerticalGrid
        let distToNextVerticalWall
        let distToNextHorizontalWall

        const inc = this.ANGLE_60_DEG / this.WIDTH
        let curDeg = this.fPlayerDeg - this.ANGLE_30_DEG
        if (curDeg < 0) {
            curDeg = this.ANGLE_360_DEG + curDeg
        }
        for (let i = 0; i < this.WIDTH; i += 1) {
            // Vertical
            if (curDeg < this.ANGLE_90_DEG || curDeg > this.ANGLE_270_DEG) {
                // Right
                verticalGridPosition = this.TILE_SIZE + Math.floor(this.fPlayerX / this.TILE_SIZE) * this.TILE_SIZE
                let yTemp = (verticalGridPosition - this.fPlayerX) * this.fTanArray[curDeg]
                yIntersection = this.fPlayerY + yTemp
                distToNextVerticalGrid = this.TILE_SIZE
            } else {
                // Left
                verticalGridPosition = Math.floor(this.fPlayerX / this.TILE_SIZE) * this.TILE_SIZE
                --verticalGridPosition
                let yTemp = (verticalGridPosition - this.fPlayerX) * this.fTanArray[curDeg]
                yIntersection = this.fPlayerY + yTemp
                distToNextVerticalGrid = -this.TILE_SIZE
            }
            let distToNextYIntersection = this.fYStepTable[curDeg]
            while (true) {
                let xGridIndex = Math.floor((verticalGridPosition) / this.TILE_SIZE)
                let yGridIndex = Math.floor(yIntersection / this.TILE_SIZE)
                let mapIdx = Math.floor(yGridIndex * this.mapWidth + xGridIndex)

                if (xGridIndex >= this.mapWidth
                    || yGridIndex >= this.mapHeight
                    || xGridIndex < 0
                    || yGridIndex < 0) {
                    distToNextVerticalWall = Number.MAX_VALUE
                    break
                }

                if (this.map.charAt(mapIdx) !== '0') {
                    distToNextVerticalWall = (yIntersection - this.fPlayerY) * this.fISinArray[curDeg]
                    break
                }

                verticalGridPosition += distToNextVerticalGrid;
                yIntersection += distToNextYIntersection;
            }

            // Horizontal
            if (curDeg >= this.ANGLE_0_DEG && curDeg < this.ANGLE_180_DEG) {
                // Bottom
                horizontalGridPosition = this.TILE_SIZE + Math.floor(this.fPlayerY / this.TILE_SIZE) * this.TILE_SIZE
                let xTemp = (horizontalGridPosition - this.fPlayerY) * this.fITanArray[curDeg]
                xIntersection = this.fPlayerX + xTemp
                distToNextHorizontalGrid = this.TILE_SIZE
            } else {
                // Top
                horizontalGridPosition = Math.floor(this.fPlayerY / this.TILE_SIZE) * this.TILE_SIZE
                --horizontalGridPosition
                let xTemp = (horizontalGridPosition - this.fPlayerY) * this.fITanArray[curDeg]
                xIntersection = this.fPlayerX + xTemp
                distToNextHorizontalGrid = -this.TILE_SIZE
            }

            let distToNextXIntersection = this.fXStepTable[curDeg]
            while (true) {
                let xGridIndex = Math.floor(xIntersection / this.TILE_SIZE)
                let yGridIndex = Math.floor((horizontalGridPosition) / this.TILE_SIZE)
                let mapIdx = Math.floor(yGridIndex * this.mapWidth + xGridIndex)

                if (xGridIndex >= this.mapWidth
                    || yGridIndex >= this.mapHeight
                    || xGridIndex < 0
                    || yGridIndex < 0) {
                    distToNextHorizontalWall = Number.MAX_VALUE
                    break
                }

                if (this.map.charAt(mapIdx) !== '0') {
                    distToNextHorizontalWall = (horizontalGridPosition - this.fPlayerY) * this.fISinArray[curDeg]
                    break
                }

                horizontalGridPosition += distToNextHorizontalGrid;
                xIntersection += distToNextXIntersection;
            }
            let xEndRay
            let yEndRay
            let distToNextWall;
            if (distToNextVerticalWall < distToNextHorizontalWall) {
                xEndRay = verticalGridPosition
                yEndRay = yIntersection
                distToNextWall = distToNextVerticalWall
            } else {
                xEndRay = xIntersection
                yEndRay = horizontalGridPosition
                distToNextWall = distToNextHorizontalWall
            }
            // Compute the height based on the distance of the ray
            const wallHeight = (this.fPlayerDistToProjectionPlane * (this.TILE_SIZE/distToNextWall))
            this.drawWall(wallHeight, i)

            this.drawRayCast(xEndRay, yEndRay, 'cyan')
            curDeg += inc;
            if (curDeg > this.ANGLE_360_DEG) curDeg = curDeg - this.ANGLE_360_DEG
        }
    }
    drawWall(wallHeight: number, idx: number) {
        const xStart = idx + this.windowOffset
        const yStart = this.HALF_HEIGHT - (wallHeight / 2)
        const xEnd = xStart
        const yEnd = yStart + wallHeight
        this.drawLine(xStart, yStart, xEnd, yEnd, '#fb7eff')
    }
    drawRayCast(x: number, y: number, color: string) {
        this.drawLine(this.fPlayerMapX, this.fPlayerMapY, ((x * this.miniMapWidth) / this.TILE_SIZE), ((y * this.miniMapWidth) / this.TILE_SIZE), color)
    }
    handleKeyDownBinding() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'w') this.fKeyUp = true
            else if (e.key === 's') this.fKeyDown = true
            else if (e.key === 'a') this.fKeyLeft = true
            else if (e.key === 'd') this.fKeyRight = true
        })
    }
    handleKeyUpBinding() {
        window.addEventListener('keyup', (e) => {
            if (e.key === 'w') this.fKeyUp = false
            else if (e.key === 's') this.fKeyDown = false
            else if (e.key === 'a') this.fKeyLeft = false
            else if (e.key === 'd') this.fKeyRight = false
        })
    }
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    drawBackground() {
        let c = 70;
        let i = 0;
        for (i = 0; i < this.HEIGHT / 2; ++i) {
            this.drawLine(0 + this.windowOffset, i, this.WIDTH + this.windowOffset, i, `rgb(247,${c},25)`)
            // this.drawLine(0 + this.windowOffset, i, this.WIDTH + this.windowOffset, i, `black`)
            c = Math.min(c + 0.25, 145);
        }
        c = 22;
        for (; i < this.HEIGHT; ++i) {
            this.drawLine(0 + this.windowOffset, i, this.WIDTH + this.windowOffset, i, `rgb(${c},20,20)`)
            c = Math.min(c + 1, 200);
        }
    }
    calculateFPS() {
        let currentTimeStamp = Date.now()
        ++this.tickCount;
        if (this.tickCount > 59) {
            this.currentFPS = Math.floor(1000 / (currentTimeStamp - this.currentTimeStamp));
            this.tickCount = 0;
        }
        this.currentTimeStamp = currentTimeStamp;
    }
    degToRad(deg: number) {
        return deg * (Math.PI / this.ANGLE_180_DEG)
    }
    drawFPS() {
        this.ctx.beginPath()
        this.ctx.fillStyle = 'black'
        this.ctx.font = "20px serif";
        const windowOffsetRight = Math.floor(this.canvas.width / 2 + this.WIDTH / 2) - 100
        this.ctx.fillText("FPS : " + this.currentFPS, windowOffsetRight, 20)
    }
    drawMap() {
        for (let row = 0; row < this.mapHeight; ++row) {
            for (let col = 0; col < this.mapWidth; ++col) {
                const target = this.map.charAt(row * this.mapHeight + col)
                let color = 'green'
                if (target !== '0') {
                    color = 'maroon'
                } else {
                }
                this.ctx.beginPath()
                this.ctx.strokeStyle = color
                this.drawRect(col * this.miniMapWidth, row * this.miniMapWidth, this.miniMapWidth, this.miniMapWidth, color)
                // this.ctx.strokeRect(col * this.miniMapWidth + this.windowOffset, row * this.miniMapWidth, this.miniMapWidth, this.miniMapWidth)
                // this.ctx.stroke()
            }
        }
    }
    updatePlayerMapPosition() {
        this.fPlayerMapX = (this.fPlayerX / this.TILE_SIZE * this.miniMapWidth)
        this.fPlayerMapY = this.fPlayerY / this.TILE_SIZE * this.miniMapWidth
    }
    drawPlayerPositionOnMap() {
        const dist = 20;
        this.drawLine(this.fPlayerMapX,
            this.fPlayerMapY,
            this.fPlayerMapX + (this.fCosArray[this.fPlayerDeg] * dist),
            this.fPlayerMapY + (this.fSinArray[this.fPlayerDeg] * dist),
            'blue')
    }
    drawRect(x: number, y: number, width: number, height: number, color: string) {
        this.ctx.beginPath()
        this.ctx.fillStyle = color
        this.ctx.fillRect(x, y, width, height)
        this.ctx.fill()
    }
    drawLine(startX: number, startY: number, endX: number, endY: number, color: string) {
        this.ctx.beginPath()
        this.ctx.lineWidth = 2
        this.ctx.strokeStyle = color
        this.ctx.moveTo(startX, startY)
        this.ctx.lineTo(endX, endY)
        this.ctx.stroke()
    }
    drawCircle(x: number, y: number, radius: number, color: string) {
        this.ctx.beginPath()
        this.ctx.fillStyle = color
        this.ctx.arc(x, y, radius, 0, 2 * Math.PI)
        this.ctx.fill()
    }
}
