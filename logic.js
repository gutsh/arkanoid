const config = {
    ball: {
        radius: 5,
        speed: {
            x: 2,
            y: 2
        }
    },
    field: {
        width: 640,
        height: 480
    },
    bar: {
        width: 80,
        height: 3,
        velocity: 10
    },
    blocks: {
        quantity: 10,
        width: 20,
        height: 40
    }
}

const cnv = document.createElement('canvas')
cnv.id = 'game-field'
cnv.width = config.field.width
cnv.height = config.field.height
const ctx = cnv.getContext('2d')

class Block {
    constructor(x, y, w, h) {
        this.x = x
        this.y = y
        this.width = w
        this.height = h
        this.destroyed = false
    }

    draw() {
        ctx.fillRect(this.x, this.y, this.width, this.height)
    }
}

class HitBar {
    constructor() {
        this.width = config.bar.width
        this.height = config.bar.height
        this.x = 0
        this.y = config.field.height - this.height
        this.velocity = config.bar.velocity
    }

    move(sign) {
        let vx = sign*this.velocity
        if (this.x + vx < 0 || this.x + this.width + vx > config.field.width) return
        this.x += vx
    }

    checkBallCollision(ball) {
        if (ball.center.y+ball.radius > this.y &&
            ball.center.x > this.x &&
            ball.center.x < this.x+this.width) {
                return true
            }
        return false
    }

    draw() {
        ctx.fillRect(this.x, this.y, this.width, this.height)
    }
}

class Ball {
    constructor() {
        this.center = {x: config.bar.width/2, y: config.field.height - config.bar.height - config.ball.radius}
        this.radius = config.ball.radius
        this.speed = {x: config.ball.speed.x, y: -config.ball.speed.x}
        this.isMoving = false
    }

    moveWithHitBar(bar, sign) {
        let vx = sign*bar.velocity
        if (this.center.x+vx < config.bar.width/2 || this.center.x+vx+config.bar.width/2 > config.field.width) return
        this.center.x += vx
    }

    move(bar, blocks) {
        if (this.isMoving === false) return
        this.center.x += this.speed.x
        this.center.y += this.speed.y
        this.checkCollisons(bar, blocks)
    }

    hasBlockCollision(block) {
        if (block.destroyed) return
        if (this.center.x >= block.x &&
            this.center.x <= block.x+block.width &&
            this.center.y >= block.y-this.radius &&
            this.center.y <= block.y+block.height+this.radius) {
                this.speed.y = -this.speed.y
                block.destroyed = true
            }
        else if (this.center.y >= block.y &&
                 this.center.y <= block.y+block.height &&
                 this.center.x >= block.x-this.radius &&
                 this.center.x <= block.x+block.width+this.radius) {
                    this.speed.x = -this.speed.x
                    block.destroyed = true
        }
    }

    checkCollisons(bar, blocks) {
        for (let block of blocks) this.hasBlockCollision(block)
        if (this.center.x-this.radius <= 0) {
            this.center.x = this.radius
            this.speed.x = -this.speed.x
        }
        if (this.center.x+this.radius >= config.field.width) {
            this.center.x = config.field.width-this.radius
            this.speed.x = -this.speed.x
        }
        if (this.center.y-this.radius <= 0) {
            this.center.y = this.radius
            this.speed.y = -this.speed.y
        }
        if (this.center.y+this.radius > bar.y &&
                 this.center.x > bar.x &&
                 this.center.x < bar.x+bar.width) {
                    this.center.y = bar.y-this.radius
                    this.center.x -= (this.radius+this.center.y-bar.y)*this.speed.x/this.speed.y
                    this.speed.y = -this.speed.y
        }
    }

    draw() {
        ctx.beginPath()
        ctx.arc(this.center.x, this.center.y, this.radius, 0, Math.PI * 2)
        ctx.stroke()
    }
}

class Field {
    constructor() {
        this.launched = false
        this.isOver = false
        this.hitBarDir = 0
        this.bar = new HitBar()
        this.ball = new Ball()
        this.blocks = []
        for (let i = 0; i<config.blocks.quantity; i++) {
            this.blocks[i] = new Block(
                0+config.blocks.width*i,
                0+config.blocks.height*i,
                config.blocks.width,
                config.blocks.height)
        }
    }

    moveHitBar(sign) {
        this.bar.move(sign)
        if (!this.launched) this.ball.moveWithHitBar(this.bar, sign)
    }

    launch() {
        this.launched = true
    }

    toggle() {
        this.ball.isMoving = !this.ball.isMoving
    }

    checkGameOver() {
        if (this.ball.center.y+this.ball.radius >= config.field.height ||
            this.blocks.every(v => v.destroyed === true)) {
            this.isOver = true
            this.ball.isMoving = false
        }
    }

    draw() {
        if (this.isOver) return
        ctx.clearRect(0, 0, cnv.width, cnv.height)
        if (this.hitBarDir) this.moveHitBar(this.hitBarDir)
        if (this.launched) this.ball.move(this.bar, this.blocks)
        this.checkGameOver()
        this.bar.draw(ctx)
        this.ball.draw(ctx)
        for (let block of this.blocks) if (!block.destroyed) block.draw()
    }
}

var animRef

(function init() {
    const cnt = document.querySelector('#canvas-container')
    let field = new Field()
    const restart = () => {
        window.cancelAnimationFrame(animRef)
        field = new Field()
        draw()
    }
    cnt.appendChild(cnv)
    document.addEventListener('keydown', (e) => {
        switch (e.code) {
            case "ArrowLeft":
                field.hitBarDir = -1
                break
            case "ArrowRight":
                field.hitBarDir = 1
                break
            case "Space":
                if (!field.launched) field.launch()
                field.toggle()
                break
            case "KeyR":
                restart()
                break
            case "KeyS":
                window.cancelAnimationFrame(animRef)
                break
            default:
                break
        }
    })
    document.addEventListener('keyup', (e) => {
        switch (e.key) {
            case "ArrowLeft":
            case "ArrowRight":
                field.hitBarDir = 0
                break
            default:
                break
        }
    })
    const draw = () => {
        field.draw()
        animRef = window.requestAnimationFrame(draw)
    }
    draw()
})()
