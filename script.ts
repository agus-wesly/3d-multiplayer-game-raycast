import { GRAY, LIME_GREEN, RGB, WHITESMOKE } from "./constant.js"
// let debug = false;
export class GameWindow {
    // Canvas
    ctx: CanvasRenderingContext2D;
    WIDTH: number = 960;
    HEIGHT: number = 656;
    HALF_WIDTH: number = this.WIDTH / 2
    HALF_HEIGHT: number = this.HEIGHT / 2

    offscreenCanvas: HTMLCanvasElement;
    offscreenCanvasContext: CanvasRenderingContext2D;
    offscreenCanvasPixel: ImageData;
    readonly BYTES_PER_PIXEL = 4;

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
    ANGLE_2_DEG = Math.floor(this.ANGLE_30_DEG / 15);
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
    fFishTable: Array<number> = []

    // Step array
    fXStepTable: Array<number> = []
    fYStepTable: Array<number> = []

    // Player
    fPlayerX: number = 156;
    fPlayerY: number = 256;
    fPlayerDeg: number = this.ANGLE_90_DEG;
    fPlayerSpeed: number = 5;
    fKeyUp: boolean = false;
    fKeyDown: boolean = false;
    fKeyLeft: boolean = false;
    fKeyRight: boolean = false;
    fPlayerMapX: number = 0;
    fPlayerMapY: number = 0;
    fPlayerDistToProjectionPlane: number = 0


    // wall
    images: Record<string, HTMLImageElement> = {}
    tempWallTexture: HTMLImageElement | null = null
    tempWallTextureBuffer: HTMLCanvasElement | null = null
    tempWallTexturePixel: ImageData | undefined = undefined

    constructor(readonly canvas: HTMLCanvasElement) {
        this.ctx = this.canvas.getContext('2d')!
        this.currentTimeStamp = Date.now()
        this.frameRate = 60


        this.offscreenCanvas = document.createElement('canvas')
        const canvasBufferCtx = this.offscreenCanvas.getContext('2d')
        if (!canvasBufferCtx) throw new Error('No context found')
        this.offscreenCanvasContext = canvasBufferCtx
        this.offscreenCanvasPixel = this.offscreenCanvasContext.getImageData(0, 0, canvas.width, canvas.height)
    }
    start() {
        this.setup()
        this.handleKeyUpBinding()
        this.handleKeyDownBinding()
        requestAnimationFrame(this.update.bind(this))
    }
    setup() {
        this.resizeCanvas()
        this.setupWall()

        this.fSinArray = new Array(this.ANGLE_360_DEG + 1)
        this.fCosArray = new Array(this.ANGLE_360_DEG + 1)
        this.fTanArray = new Array(this.ANGLE_360_DEG + 1)
        this.fISinArray = new Array(this.ANGLE_360_DEG + 1)
        this.fCosArray = new Array(this.ANGLE_360_DEG + 1)
        this.fITanArray = new Array(this.ANGLE_360_DEG + 1)
        this.fFishTable = new Array(this.ANGLE_60_DEG + 1)
        this.fXStepTable = new Array(this.ANGLE_360_DEG + 1)
        this.fYStepTable = new Array(this.ANGLE_360_DEG + 1)

        for (let i = 0; i <= this.ANGLE_360_DEG; ++i) {
            // TODO : 
            const rad = this.degToRad(i) + (0.0001)
            // const rad = this.degToRad(i)
            this.fSinArray[i] = Math.sin(rad)
            this.fCosArray[i] = Math.cos(rad)
            this.fTanArray[i] = Math.tan(rad)
            this.fISinArray[i] = 1.0 / this.fSinArray[i]
            this.fICosArray[i] = 1.0 / this.fCosArray[i]
            this.fITanArray[i] = 1.0 / this.fTanArray[i]

            if (i >= this.ANGLE_90_DEG && i < this.ANGLE_270_DEG) {
                this.fXStepTable[i] = this.TILE_SIZE / this.fTanArray[i]
                if (this.fXStepTable[i] > 0) {
                    this.fXStepTable[i] = -this.fXStepTable[i]
                }
            } else {
                this.fXStepTable[i] = this.TILE_SIZE / this.fTanArray[i]
                if (this.fXStepTable[i] < 0) {
                    this.fXStepTable[i] = -this.fXStepTable[i]
                }
            }

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

        }

        for (let i = -this.ANGLE_30_DEG; i <= this.ANGLE_30_DEG; ++i) {
            const rad = this.degToRad(i)
            this.fFishTable[i + this.ANGLE_30_DEG] = 1.0 / Math.cos(rad)
        }

        this.fPlayerDistToProjectionPlane = Math.floor((this.HALF_WIDTH) / this.fTanArray[this.ANGLE_30_DEG])

        // Recalculate Offset
        this.windowOffset = Math.floor(this.canvas.width / 2 - this.WIDTH / 2)
        const map =
            "111111111111" +
            "100000000001" +
            "102200000001" +
            "100000000001" +
            "100000000001" +
            "100000000001" +
            "100000000001" +
            "100000000301" +
            "100044400001" +
            "100000000201" +
            "100000000201" +
            "111111111111"
        this.map = map;
    }
    update() {
        this.resetCanvasBuffer()

        this.drawBackground()
        this.drawMap()
        this.updatePlayerMapPosition()
        // this.raycast()
        this.drawPlayerPositionOnMap()
        this.paintCanvasBuffer()

        this.rotatePlayerPosition()
        this.movePlayerPosition()
        this.calculateFPS()
        this.drawFPS()

        setTimeout(() => {
            requestAnimationFrame(this.update.bind(this))
        }, 1000 / this.frameRate)
    }
    resetCanvasBuffer() {
        this.offscreenCanvasContext.clearRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
    }
    paintCanvasBuffer() {
        this.ctx.putImageData(this.offscreenCanvasPixel, 0, 0);
    }

    movePlayerPosition() {
        const maxWallDistance = 30
        let dirX: number | undefined = undefined 
        let dirY: number | undefined = undefined
        if (this.fKeyUp) {
            dirX = (this.fPlayerSpeed * this.fCosArray[this.fPlayerDeg])
            dirY = (this.fPlayerSpeed * this.fSinArray[this.fPlayerDeg])
        }
        if (this.fKeyDown) {
            dirX = -(this.fPlayerSpeed * this.fCosArray[this.fPlayerDeg])
            dirY = -(this.fPlayerSpeed * this.fSinArray[this.fPlayerDeg])
        }

        if (dirX === undefined || dirY === undefined) return
        this.fPlayerX += dirX
        this.fPlayerY += dirY

        // Collission Detection
        const xIndex = Math.floor(this.fPlayerX / this.TILE_SIZE)
        const yIndex = Math.floor(this.fPlayerY / this.TILE_SIZE)
        const xDirOffset = this.fPlayerX % this.TILE_SIZE
        const yDirOffset = this.fPlayerY % this.TILE_SIZE
        if (dirX > 0) {
            // Right
            const idx = yIndex * this.mapWidth + (xIndex + 1)
            if (this.map.charAt(idx) !== '0' && xDirOffset > (this.TILE_SIZE - maxWallDistance)) {
                this.fPlayerX -= xDirOffset - (this.TILE_SIZE - maxWallDistance)
            }
        } else {
            // Left
            const idx = yIndex * this.mapWidth + (xIndex - 1)
            if (this.map.charAt(idx) !== '0' && xDirOffset < maxWallDistance) {
                this.fPlayerX += maxWallDistance - xDirOffset
            }
        }
        if (dirY < 0) {
            // Top
            const idx = (yIndex - 1) * this.mapWidth + xIndex
            if (this.map.charAt(idx) !== '0' && yDirOffset < maxWallDistance) {
                this.fPlayerY += maxWallDistance - yDirOffset
            }
        } else {
            // Bottom
            const idx = (yIndex + 1) * this.mapWidth + xIndex
            if (this.map.charAt(idx) !== '0' && yDirOffset > (this.TILE_SIZE - maxWallDistance)) {
                this.fPlayerY -= yDirOffset - (this.TILE_SIZE - maxWallDistance)
            }
        }
    }
    rotatePlayerPosition() {
        if (this.fKeyLeft) {
            this.fPlayerDeg -= this.ANGLE_2_DEG
            if (this.fPlayerDeg < 0) this.fPlayerDeg += this.ANGLE_360_DEG
        }
        if (this.fKeyRight) {
            this.fPlayerDeg += this.ANGLE_2_DEG
            if (this.fPlayerDeg > this.ANGLE_360_DEG) {
                this.fPlayerDeg -= this.ANGLE_360_DEG
            }
        }
    }
    raycast() {
        let verticalGridPosition: number;
        let horizontalGridPosition: number;
        let xIntersection: number;
        let yIntersection: number;
        let distToNextHorizontalGrid: number;
        let distToNextVerticalGrid: number;
        let distToNextVerticalWall: number;
        let distToNextHorizontalWall: number;
        let wallTypeVertical: string = '';
        let wallTypeHorizontal: string = '';

        let curDeg = this.fPlayerDeg - this.ANGLE_30_DEG
        if (curDeg < 0) {
            curDeg = this.ANGLE_360_DEG + curDeg
        }
        for (let currentColumn = 0; currentColumn < this.WIDTH; currentColumn += 1) {
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
                let yTemp = (verticalGridPosition - this.fPlayerX) * this.fTanArray[curDeg]
                yIntersection = this.fPlayerY + yTemp
                distToNextVerticalGrid = -this.TILE_SIZE

                --verticalGridPosition
            }

            if (curDeg === this.ANGLE_90_DEG || curDeg === this.ANGLE_270_DEG) {
                distToNextVerticalWall = Number.MAX_VALUE
            } else {
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

                    else if (this.map.charAt(mapIdx) !== '0') {
                        distToNextVerticalWall = (yIntersection - this.fPlayerY) * (this.fISinArray[curDeg])
                        wallTypeVertical = this.map.charAt(mapIdx)
                        break
                    } else {
                        verticalGridPosition += distToNextVerticalGrid;
                        yIntersection += distToNextYIntersection;
                    }

                }
            }

            // Horizontal
            if (curDeg > this.ANGLE_0_DEG && curDeg < this.ANGLE_180_DEG) {
                // Bottom
                horizontalGridPosition = this.TILE_SIZE + Math.floor(this.fPlayerY / this.TILE_SIZE) * this.TILE_SIZE
                let xTemp = (horizontalGridPosition - this.fPlayerY) * this.fITanArray[curDeg]
                xIntersection = this.fPlayerX + xTemp
                distToNextHorizontalGrid = this.TILE_SIZE
            } else {
                // Top
                horizontalGridPosition = Math.floor(this.fPlayerY / this.TILE_SIZE) * this.TILE_SIZE
                let xTemp = (horizontalGridPosition - this.fPlayerY) * this.fITanArray[curDeg]
                xIntersection = this.fPlayerX + xTemp
                distToNextHorizontalGrid = -this.TILE_SIZE
                --horizontalGridPosition
            }


            if (curDeg === this.ANGLE_0_DEG || curDeg === this.ANGLE_180_DEG) {
                distToNextHorizontalWall = Number.MAX_VALUE
            } else {
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

                    else if (this.map.charAt(mapIdx) !== '0') {
                        wallTypeHorizontal = this.map.charAt(mapIdx)
                        distToNextHorizontalWall = (xIntersection - this.fPlayerX) * this.fICosArray[curDeg]
                        break
                    } else {
                        horizontalGridPosition += distToNextHorizontalGrid;
                        xIntersection += distToNextXIntersection;
                    }

                }
            }

            let distToNextWall: number
            let offsetWall: number
            let wallType: string;

            if (distToNextVerticalWall < distToNextHorizontalWall) {
                distToNextWall = distToNextVerticalWall
                offsetWall = yIntersection % this.TILE_SIZE
                wallType = wallTypeVertical
                this.drawRayCast(verticalGridPosition, yIntersection, LIME_GREEN)
            } else {
                distToNextWall = distToNextHorizontalWall
                offsetWall = xIntersection % this.TILE_SIZE
                wallType = wallTypeHorizontal
                this.drawRayCast(xIntersection, horizontalGridPosition, LIME_GREEN)
            }

            // Compute the height based on the distance of the ray
            distToNextWall /= this.fFishTable[currentColumn]
            const wallHeight = this.fPlayerDistToProjectionPlane * this.TILE_SIZE / distToNextWall
            let topWall = this.HALF_HEIGHT - (wallHeight / 2)
            let bottomWall = this.HALF_HEIGHT + (wallHeight / 2)
            this.drawWall(
                currentColumn + this.windowOffset,
                topWall,
                1,
                (bottomWall - topWall),
                wallType,
                offsetWall,
                Math.floor(160 / distToNextWall)
            )

            curDeg += 1;
            if (curDeg >= this.ANGLE_360_DEG) curDeg = curDeg - this.ANGLE_360_DEG
        }
    }
    drawWall(x: number, y: number, w: number, h: number, wallType: string | undefined, offsetWall: number, brightnessLevel: number) {
        if (!wallType || !this.tempWallTexture || !this.tempWallTextureBuffer || !this.tempWallTexturePixel) return

        brightnessLevel = brightnessLevel * 10
        const bytesPerPixel = 4
        // Modify the pixel based on brightness
        const sourceIdx = offsetWall * bytesPerPixel
        const red = this.tempWallTexturePixel.data[sourceIdx];
        const green = this.tempWallTexturePixel.data[sourceIdx + 1]
        const blue = this.tempWallTexturePixel.data[sourceIdx + 2]
        const opac = this.tempWallTexturePixel.data[sourceIdx + 3]

        this.tempWallTexturePixel.data[sourceIdx] = red * brightnessLevel
        this.tempWallTexturePixel.data[sourceIdx + 1] = green * brightnessLevel
        this.tempWallTexturePixel.data[sourceIdx + 2] = blue * brightnessLevel
        this.tempWallTexturePixel.data[sourceIdx + 3] = opac

        this.tempWallTextureBuffer.getContext('2d')?.putImageData(this.tempWallTexturePixel, 0, 0)
        this.ctx.drawImage(
            this.tempWallTextureBuffer,
            Math.floor(offsetWall),
            0,
            1,
            this.TILE_SIZE,
            x,
            y,
            w,
            h)

        this.tempWallTexturePixel.data[sourceIdx] = red
        this.tempWallTexturePixel.data[sourceIdx + 1] = green
        this.tempWallTexturePixel.data[sourceIdx + 2] = blue
        this.tempWallTexturePixel.data[sourceIdx + 3] = opac
        // this.drawRect(idx + this.windowOffset, topWall, 1, (bottomWall - topWall), color)
    }
    drawRayCast(x: number, y: number, color: RGB) {
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
        this.offscreenCanvas.width = this.canvas.width
        this.offscreenCanvas.height = this.canvas.height
        this.offscreenCanvasPixel = this.offscreenCanvasContext.getImageData(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height)
    }
    setupWall() {
        ['1', '2', '3', '4'].forEach((el: string) => {
            const img = document.createElement('img')
            img.src = `./assets/walls/wall${el}.jpg`
            this.images[el] = img
        });

        const img = new Image(64, 64)
        this.tempWallTexture = img
        img.src = 'assets/walls/wall1.jpg'
        img.crossOrigin = "Anonymous"
        img.onload = this.onWallLoaded.bind(this)
    }
    onWallLoaded() {
        if (!this.tempWallTexture) return
        this.tempWallTextureBuffer = document.createElement('canvas')
        this.tempWallTextureBuffer.width = this.tempWallTexture.width
        this.tempWallTextureBuffer.height = this.tempWallTexture.height
        this.tempWallTextureBuffer.getContext('2d')?.drawImage(this.tempWallTexture, 0, 0, 64, 64)
        this.tempWallTexturePixel = this.tempWallTextureBuffer.getContext('2d')?.getImageData(0, 0, this.tempWallTexture.width, this.tempWallTexture.height)
    }
    drawBackground() {
        let c = 70;
        let i = 0;
        for (i = 0; i < this.HEIGHT / 2; ++i) {
            this.drawFilledRect(0 + this.windowOffset, i, this.WIDTH, 1, { red: 247, green: c, blue: 25, alpha: 255 })
            c = Math.min(c + 0.25, 145);
        }
        c = 22;
        for (; i < this.HEIGHT; ++i) {
            this.drawFilledRect(0 + this.windowOffset, i, this.WIDTH , 1, { red: c, green: 20, blue: 20, alpha: 255 })
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
        return (deg * Math.PI) / this.ANGLE_180_DEG
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
                let color: RGB = WHITESMOKE
                if (target !== '0') {
                    color = GRAY
                } else {
                }
                this.drawFilledRect(col * this.miniMapWidth, row * this.miniMapWidth, this.miniMapWidth, this.miniMapWidth, color)
            }
        }
    }
    updatePlayerMapPosition() {
        this.fPlayerMapX = (this.fPlayerX / this.TILE_SIZE * this.miniMapWidth)
        this.fPlayerMapY = this.fPlayerY / this.TILE_SIZE * this.miniMapWidth
    }
    drawPlayerPositionOnMap() {
        const dist = 20;
        this.drawLine(
            Math.floor(this.fPlayerMapX),
            Math.floor(this.fPlayerMapY),
            Math.floor(this.fPlayerMapX + (this.fCosArray[this.fPlayerDeg] * dist)),
            Math.floor(this.fPlayerMapY + (this.fSinArray[this.fPlayerDeg] * dist)),
            { red: 0, green: 0, blue: 255, alpha: 255 }
        )
    }
    drawFilledRect(x: number, y: number, width: number, height: number, color: RGB) {
        let targetIndex = (this.offscreenCanvas.width * this.BYTES_PER_PIXEL * y) + (this.BYTES_PER_PIXEL * x)
        for (let h = 0; h < height; ++h) {
            for (let w = 0; w < width; ++w) {
                this.offscreenCanvasPixel.data[targetIndex] = color.red
                this.offscreenCanvasPixel.data[targetIndex + 1] = color.green
                this.offscreenCanvasPixel.data[targetIndex + 2] = color.blue
                this.offscreenCanvasPixel.data[targetIndex + 3] = color.alpha

                targetIndex += this.BYTES_PER_PIXEL
            }
            // targetIndex += this.BYTES_PER_PIXEL
            targetIndex += ((this.offscreenCanvas.width - width) * this.BYTES_PER_PIXEL)
        }
        /// this.ctx.beginPath()
        /// this.ctx.fillStyle = color
        /// this.ctx.fillRect(x, y, width, height)
        /// this.ctx.fill()
    }
    drawLine(startX: number, startY: number, endX: number, endY: number, color: RGB) {
        let targetIndex = (this.BYTES_PER_PIXEL * this.offscreenCanvas.width * startY) + (startX * this.BYTES_PER_PIXEL)

        let dirX: number
        let dirY: number
        let dy = endY - startY
        if (dy < 0) {
            // going up
            dy = -dy
            dirY = -(this.offscreenCanvas.width * this.BYTES_PER_PIXEL)
        } else {
            // going down
            dirY = (this.offscreenCanvas.width * this.BYTES_PER_PIXEL)
        }

        let dx = endX - startX
        if (dx < 0) {
            // going left
            dx = -dx
            dirX = -(this.BYTES_PER_PIXEL);
        } else {
            // going right
            dirX = (this.BYTES_PER_PIXEL);
        }


        let length: number;
        let errY = 0;
        if (dx > dy) {
            length = dx;
            for (let i = 0; i < length; ++i) {
                this.offscreenCanvasPixel.data[targetIndex] = color.red
                this.offscreenCanvasPixel.data[targetIndex + 1] = color.green
                this.offscreenCanvasPixel.data[targetIndex + 2] = color.blue
                this.offscreenCanvasPixel.data[targetIndex + 3] = color.alpha

                targetIndex += dirX

                errY += dy;
                if (errY >= dx) {
                    errY -= dx;
                    targetIndex += dirY
                }
            }
        } else {
            length = dy;
            for (let i = 0; i < length; ++i) {
                this.offscreenCanvasPixel.data[targetIndex] = color.red
                this.offscreenCanvasPixel.data[targetIndex + 1] = color.green
                this.offscreenCanvasPixel.data[targetIndex + 2] = color.blue
                this.offscreenCanvasPixel.data[targetIndex + 3] = color.alpha

                targetIndex += dirY

                errY += dx;
                if (errY >= dy) {
                    errY -= dy;
                    targetIndex += dirX
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

    drawCircle(x: number, y: number, radius: number, color: string) {
        this.ctx.beginPath()
        this.ctx.fillStyle = color
        this.ctx.arc(x, y, radius, 0, 2 * Math.PI)
        this.ctx.fill()
    }
}



