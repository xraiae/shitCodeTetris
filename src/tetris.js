let canvas = document.querySelector('#tetris');
let ctx = canvas.getContext('2d');

// let height = canvas.height = window.innerHeight - 10;
// let width = canvas.width = (height / 20) * 12;
let height = window.innerHeight;
let width = window.innerWidth;
// let scale = height / 20;
ctx.scale(20, 20);

// canvas.style.left = (window.innerWidth - width) / 2 + 'px';

const opening = document.querySelector('.opening');
const openingStart = opening.querySelector('a');

const pieces = [
    [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0],
    ], [
        [2, 2],
        [2, 2]
    ], [
        [3, 3, 3],
        [0, 0, 3],
        [0, 0, 0]
    ], [
        [4, 4, 4],
        [4, 0, 0],
        [0, 0, 0]
    ], [
        [5, 5, 0],
        [0, 5, 5],
        [0, 0, 0]
    ], [
        [0, 6, 6],
        [6, 6, 0],
        [0, 0, 0]
    ], [
        [0, 7, 0, 0],
        [0, 7, 0, 0],
        [0, 7, 0, 0],
        [0, 7, 0, 0],
    ]
]

function shuffle(array) {
    let randomIndex;
    for (let i = array.length - 1; i > 0; i--) {
        randomIndex = Math.round(Math.random() * (i - 1));
        [array[randomIndex], array[i]] = [array[i], array[randomIndex]];
    }
    return [...array];
}

let matrix = [];
function returnMatrix(player) {
    if (matrix[0]) {
        player.matrix =  matrix.splice(matrix.length - 1, 1)[0];
    } else {
        matrix = shuffle(pieces);
        returnMatrix(player);
    }
}

const colors = [
    null,
    '#FF0D72',
    '#0DC2FF',
    '#0DFF72',
    '#F538FF',
    '#FF8E0D',
    '#FFE138',
    '#3877FF'
];

const transparentColors = [
    null,
    'rgba(255,13,114, 0.2)',
    'rgba(13,194,255, 0.2)',
    'rgba(13,255,114, 0.2)',
    'rgba(245,56,255, 0.2)',
    'rgba(255,142,13, 0.2)',
    'rgba(255,225,56, 0.2)',
    'rgba(56,119,255, 0.2)',
];

//预测下落的方块
function prejudgment() {
    let locus = {
        matrix: player.matrix,
        pos: {
            x: player.pos.x,
            y: player.pos.y
        }
    }
    while (true) {
        locus.pos.y++;
        if (collide(arena, locus)) {
            locus.pos.y--;
            break;
        }
    }
    return locus;
}

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                // ctx.fillStyle = colors[value];
                ctx.fillStyle = '#fff';
                ctx.fillRect(
                    x + offset.x,
                    y + offset.y,
                    1,1);
            }
        });
    });
}

function createMatrix(w, h) {
    const matrix = [];
    while(h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

const arena = createMatrix(12, 20);
const player = {
    pos: {x: 1, y: 1},
    matrix: null,
}
returnMatrix(player);

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[player.pos.y + y][player.pos.x + x] = value;
            }
        });
    });
}

function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; y++) {
        for (let x = 0; x < m[y].length; x++) {
            if (m[y][x] !== 0 &&
                (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 240, 400);
    drawMatrix(arena, {x: 0, y: 0});
    drawMatrix(player.matrix, player.pos);
    drawLocus();
}

let dropCount = 0;
let dropInterval = 1000;
let lastTime = 0;
let updateId = null;
function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;
    dropCount += deltaTime;
    if (dropCount > dropInterval) {
        playerDrop();
    }
    draw();
    updateId = requestAnimationFrame(update);
}

function checkLineClear(arena) {
    let flag = true;
    let count = 0;
    for (let y = 0; y < arena.length; y++) {
        for (let x = 0; x < arena[y].length; x++) {
            if (arena[y][x] === 0) {
                flag = false;
                break;
            }
        }
        if (flag) {
            count++;
            let temp = arena.splice(y, 1)[0].fill(0);
            arena.unshift(temp);
        } else {
            flag = true;
        }
    }
    scoreUpdate(count);
}

let nextMatrixFlag= false;
function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        if (!nextMatrixFlag) {
            nextMatrixFlag = true;
            setTimeout(function () {
                player.pos.y++;
                if (collide(arena, player)) {
                    player.pos.y--;
                    merge(arena, player);
                    checkLineClear(arena);
                    returnMatrix(player);
                    player.pos.y = 0;
                    player.pos.x = Math.round((arena[0].length - player.matrix[0].length) / 2 );
                    if (collide(arena, player)) {
                        matrix = [];
                        gameOver();
                        cancelAnimationFrame(updateId);
                        // arena.forEach((row, y) => {row.fill(0)});
                    }
                }
                nextMatrixFlag = false;
            }, 500);
        }
    }
    dropCount = 0;
}

let mover = null;
let xMoving = false;
function xMove(dir) {
    xMoving = true;
    mover = setInterval(function () {
        player.pos.x += dir;
        if (collide(arena, player)) {
            player.pos.x -= dir
        }
    }, 65);
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; y++) {
        for (let x = y; x < matrix[y].length; x++) {
            [
                matrix[y][x],
                matrix[x][y]
            ] = [
                matrix[x][y],
                matrix[y][x]
            ]
        }
    }

    if (dir > 0) {
        //右转
        matrix.forEach((col) => {col.reverse()});
    } else {
        //左转
        matrix.reverse();
    }
}

function playerRotate(dir) {
    rotate(player.matrix, dir);
    let pos = player.pos.x;
    let offset = 1;
    while (collide(arena, player)) {
        player.pos.x += offset;
        if (offset > player.matrix.length) {
            rotate(player.matrix, -1);
            player.pos.x = pos;
            break;
        }
        offset = -(offset + (offset > 0 ? 1 : -1));
    }
}



let stopFlag = false;
document.addEventListener('keydown', function(event) {
    if (!stopFlag) {
        if (!xMoving) {
            if (event.key === keyMap.left) {
                xMove(-1);
            } else if (event.key === keyMap.right) {
                xMove(1);
            }
        }
        if (event.key === keyMap.down) {
            playerDrop();
        }
    }
})

document.addEventListener('keyup', function (event) {
    if (!stopFlag) {
        if (event.key === keyMap.left || event.key === keyMap.right) {
            clearInterval(mover);
            xMoving = false;
        } else if (event.key === keyMap.rotateL) {
            playerRotate(-1);
        } else if (event.key === keyMap.rotateR) {
            playerRotate(1);
        } else if (event.key === keyMap.fastDown) {
            fastDown();
        } else if (event.key === 'Escape') {
            cancelAnimationFrame(updateId);
            stopFlag = !stopFlag;
            opening.style.top = 0 + 'px';
        }
    } else if (event.key === 'Escape') {
        updateId = requestAnimationFrame(update);
        stopFlag = !stopFlag;
        opening.style.top = -(height + 10) + 'px';
    }
})

function fastDown() {
    while (!collide(arena, player)) {
        player.pos.y++;
    }
    //重复代码
    player.pos.y--;
    merge(arena, player);
    shake();
    checkLineClear(arena);
    returnMatrix(player);
    player.pos.y = 0;
    player.pos.x = Math.round((arena[0].length - player.matrix[0].length) / 2 );
    if (collide(arena, player)) {
        matrix = [];
        gameOver();
        cancelAnimationFrame(updateId);
        // arena.forEach((row, y) => {row.fill(0)});
    }
    dropCount = 0;
}

function drawLocus() {
    let locus = prejudgment();
    locus.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                // ctx.fillStyle = transparentColors[value];
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.fillRect(
                    x + locus.pos.x,
                    y + locus.pos.y,
                    1,1);
            }
        });
    });
}

openingStart.addEventListener('click', function () {
    opening.style.top = '-100vh';
    updateId = requestAnimationFrame(update);
    stopFlag = false;
})

const pause = document.querySelector('.pause');
const pauseShade = document.querySelector('.pauseShade');
let pauseFlag = false;
pause.addEventListener('click', function () {
    if (!pauseFlag) {
        cancelAnimationFrame(updateId);
        pause.innerHTML = '继续';
        pause.style.zIndex = '20';
        pauseShade.style.display = 'block';
        pauseFlag = !pauseFlag;
        stopFlag = true;
    } else {
        updateId = requestAnimationFrame(update);
        pause.innerHTML = '暂停';
        pause.style.zIndex = '2';
        pauseShade.style.display = 'none';
        pauseFlag = !pauseFlag;
        stopFlag = false;
    }
});

function shake() {
    let timer;
    let count = 0;
    clearInterval(timer);
    let normal = [parseInt(canvas.style.left), parseInt(canvas.style.top)];
    timer = setInterval(function (shakeLocus) {
        if (count < 10) {
            canvas.style.left = normal[0] + Math.random() * 10 * (Math.random() > 0.5 ? 1 : 0) + 'px';
            canvas.style.top = normal[1] + Math.random() * 10 * (Math.random() > 0.5 ? 1 : 0) + 'px';
            count++;
        } else {
            clearInterval(timer);
            canvas.style.left = normal[0] +'px';
            canvas.style.to = normal[1] +'px';
            count = 0;
        }
    }, 20);
}

const scoreLabel = document.querySelector('.scorePanel').querySelector('span');
function scoreUpdate(count) {
    let score = parseInt(scoreLabel.innerText);
    switch (count) {
        case 1: score += 10;break;
        case 2: score += 30;break;
        case 3: score += 60;break;
        case 4: score += 100;
    }
    if (score === 0) {
        scoreLabel.innerText = '00000';
    } else if (score / 10 < 10) {
        scoreLabel.innerText = '000'  + score;
    } else if (score / 100 < 10) {
        scoreLabel.innerText = '00'  + score;
    } else if (score / 1000 < 10) {
        scoreLabel.innerText = '0'  + score;
    } else {
        scoreLabel.innerText = '' + score;
    }
}

const gameOverPanel = document.querySelector('.gameOver');
const mainPanel = document.querySelector('.main');
const gameOverP = gameOverPanel.querySelector('p');
const gameOverSpan = gameOverPanel.querySelector('span');
function gameOver() {
    mainPanel.style.filter = 'blur(5px)';
    gameOverPanel.style.display = 'block';
    setTimeout(function () {
        gameOverP.style.top = '-130px';
    }, 2000);
    updateId = requestAnimationFrame(update);
    stopFlag = false;
}

gameOverSpan.addEventListener('click', function () {
    mainPanel.style.filter = '';
    gameOverPanel.style.display = 'none';
    gameOverP.style.top = '0';
    scoreLabel.innerText = '00000';
    arena.forEach((row, y) => {
        row.fill(0);
        console.log(row);
    })
})

const setting = document.querySelector('.option .setting');
const settingCover = setting.querySelector('.cover');
const settingBack = setting.querySelector('.back');
const settingPanel = document.querySelector('.option .settingPanel');
settingCover.addEventListener('click', function () {
    cancelAnimationFrame(updateId);
    stopFlag = true;
    setting.style.right = '85%';
    settingCover.style.transform = 'rotateY(-180deg)';
    settingBack.style.transform = 'rotateY(0deg)';
    settingPanel.style.right = 0 + 'px';
})
settingBack.addEventListener('click', function () {
    updateId = requestAnimationFrame(update);
    stopFlag = false;
    setting.style.right = '-5%';
    settingCover.style.transform = 'rotateY(0deg)';
    settingBack.style.transform = 'rotateY(180deg)';
    settingPanel.style.right = '-100vw';
})

let keyMap = {
    left: 'ArrowLeft',
    right: 'ArrowRight',
    down: 'ArrowDown',
    rotateL: 'z',
    rotateR: 'x',
    fastDown: 'c'
}
let keyMapKeys = Object.keys(keyMap);
const keySettings = settingPanel.querySelectorAll('input');
(function () {
    for (let i = 0; i < keySettings.length; i++) {
        keySettings[i].style.backgroundColor = '#000';
    }
}())
keySettings.forEach((input, index) => {
    input.addEventListener('focus', function () {
        this.value = '';
        this.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
        this.addEventListener('keyup', changeKey);
    })
    input.addEventListener('blur', function () {
        this.removeEventListener('keyup', changeKey);
        this.style.backgroundColor = '#000';
    })
})

function changeKey(e) {
    let temp = 0;
    for (let i = 0; i < keySettings.length; i++) {
        if (keySettings[i].style.backgroundColor !== 'rgb(0, 0, 0)') {
            temp = i;
            break;
        }
        console.log(keySettings[i].style.backgroundColor);
    }
    keySettings[temp].value = e.key;
    keyMap[keyMapKeys[temp]] = keySettings[temp].value;
    console.log(keyMap);
    keySettings[temp].blur();
}

let startPosX = 0;
let startPosY = 0;
const boxWidth = height / 20;
// const xMoveDistance = boxWidth / 2;
const dHeight = boxWidth / 2;
const fdHeight = boxWidth * 5;
let fdFlag = false;
document.addEventListener('touchstart', function (e) {
    let touch = e.touches[0];
    startPosX = touch.pageX;
    startPosY = touch.pageY;
    console.log(startPosX + ' ' + startPosY);
    if (e.touches.length === 2) {
        playerRotate(1);
    } else if (e.touches.length === 3) {
        playerRotate(-1);
    }
})

document.addEventListener('touchmove', function (e) {
    // e.preventDefault();
    let touch = e.touches[0];
    if (touch.pageX - startPosX > boxWidth) {
        player.pos.x++;
        if (collide(arena, player))
            player.pos.x--;
        startPosX = touch.pageX;
    } else if (touch.pageX - startPosX < -boxWidth) {
        player.pos.x--;
        if (collide(arena, player))
            player.pos.x++;
        startPosX = touch.pageX;
    }
    if (touch.pageY - startPosY > dHeight) {
        playerDrop();
        startPosY = touch.pageY;
    } else if (!fdFlag && touch.pageY - startPosY < -fdHeight) {
        fdFlag = true;
        fastDown();
        startPosY = touch.pageY;
        setTimeout(() => {
            fdFlag = false;
        }, 200);
    }
})