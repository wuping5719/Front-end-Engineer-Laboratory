var SIZE = 15;
var BLACK = 1;
var WHITE = 2;
var WIN = 5;

function approximate(number) {
    if(number - Math.floor(number) > 0.5) {
        return Math.ceil(number);
    }
    return Math.floor(number);
}

//棋盘
function Board(el) {
    this.el = typeof el === 'string' ? document.querySelector(el) : el;
}

//初始化棋盘
Board.prototype.init = function() {
    this.el.innerHTML = '';
    var frag = document.createDocumentFragment();
    for (var i = SIZE - 1; i >= 0; i--) {
        var row = document.createElement('div');
        row.classList.add('row');
        for (var j = SIZE - 1; j >= 0; j--) {
            var cell = document.createElement('div');
            cell.classList.add('cell');
            row.appendChild(cell);
        }
        frag.appendChild(row);
    }
    this.el.appendChild(frag);
    var aCell = this.el.querySelector('.cell');
    var rect = aCell.getBoundingClientRect();
    var maxWidth = Math.min(document.body.clientWidth * 0.8, SIZE * 40);
    var w = ~~(maxWidth / (SIZE - 1));
    this.el.style.height = w * (SIZE - 1) + 'px';
    this.el.style.width = w * (SIZE - 1) + 'px';
    rect = aCell.getBoundingClientRect();
    this.unit = rect.width;
}

//画棋子
Board.prototype.drawPiece = function(piece) {
    var dom = document.createElement('div');
    dom.classList.add('piece');
    dom.style.width = this.unit + 'px';
    dom.style.height = this.unit + 'px';
    dom.style.left = ~~((piece.x - .5) * this.unit) + 'px';
    dom.style.top = ~~((piece.y - .5) * this.unit) + 'px';
    dom.classList.add(piece.player === 1 ? 'black' : 'white');
    this.el.appendChild(dom);
    return dom;
}

//棋子
function Piece(x, y, player) {
    this.x = x;
    this.y = y;
    this.player = player;
}

function Game(engine) {
    this.engine = engine || 'DOM';
    this.init();
}

Game.prototype.init = function() {
    this.ended = false;
    var chessData = new Array(SIZE);
    for (var x = 0; x < SIZE; x++) {
        chessData[x] = new Array(SIZE);
        for (var y = 0; y < SIZE; y++) {
            chessData[x][y] = 0;
        }
    }
    this.data = chessData;
    this.currentPlayer = WHITE;
    this.updateIndicator();
}

Game.prototype.start = function() {
    var board = new Board('.board');
    board.init();
    this.board = board;

    var rect = this.board.el.getBoundingClientRect();
    this.board.el.addEventListener('click', function(event) {
        var ptX = event.clientX - rect.left;
        var ptY = event.clientY - rect.top;
        var x = approximate(ptX / this.board.unit);
        var y = approximate(ptY / this.board.unit);
        console.log(x, y);
        this.play(x, y);
    }.bind(this));

    var btnUndo = document.querySelector('.undo');
    var btnRedo = document.querySelector('.redo');
    var btnRestart = document.querySelector('.restart');
    btnUndo.addEventListener('click', function() {
        this.undo();
    }.bind(this));

    btnRedo.addEventListener('click', function() {
        this.redo();
    }.bind(this));

    btnRestart.addEventListener('click', function() {
        this.init();
        this.board.init();
    }.bind(this));
}

Game.prototype.play = function(x, y) {
    if (this.ended) {
        return;
    }
    if (this.data[x][y] > 0) {
        return;
    }
    if(!this.lockPlayer) {
        this.currentPlayer = this.currentPlayer === BLACK ? WHITE : BLACK;
    }
    this.lockPlayer = false;
    var piece = new Piece(x, y, this.currentPlayer);
    var pieceEl = this.board.drawPiece(piece);
    this.data[x][y] = this.currentPlayer;
    this.updateIndicator();
    var winner = this.judge(x, y, this.currentPlayer);
    this.ended = winner > 0;
    if(this.ended) {
        setTimeout(function() {
            this.gameOver();
        }.bind(this), 0);
    }
    this.move = {
        piece: piece,
        el: pieceEl
    };
}

Game.prototype.updateIndicator = function() {
    var el = document.querySelector('.turn');
    if(this.currentPlayer === WHITE) {
        el.classList.add('black');
        el.classList.remove('white');
    } else {
        el.classList.add('white');
        el.classList.remove('black');
    }
}

Game.prototype.gameOver = function() {
    alert((this.currentPlayer === BLACK ? '黑方' : '白方') + '胜！');
}

Game.prototype.undo = function() {
    if(this.ended) {
        return;
    }
    this.lockPlayer = true;
    this.move.el.remove();
    var piece = this.move.piece;
    this.data[piece.x][piece.y] = 0;
}

Game.prototype.redo = function() {
    if(this.ended) {
        return;
    }
    this.lockPlayer = false;
    this.board.el.appendChild(this.move.el);
    var piece = this.move.piece;
    this.data[piece.x][piece.y] = piece.player;
}

//判断胜负
Game.prototype.judge = function(x, y, player) {
    var horizontal = 0;
    var vertical = 0;
    var cross1 = 0;
    var cross2 = 0;

    var gameData = this.data;
    //左右判断 
    for (var i = x; i >= 0; i--) {
        if (gameData[i][y] != player) {
            break;
        }
        horizontal++;
    }
    for (var i = x + 1; i < SIZE; i++) {
        if (gameData[i][y] != player) {
            break;
        }
        horizontal++;
    }
    //上下判断 
    for (var i = y; i >= 0; i--) {
        if (gameData[x][i] != player) {
            break;
        }
        vertical++;
    }
    for (var i = y + 1; i < SIZE; i++) {
        if (gameData[x][i] != player) {
            break;
        }
        vertical++;
    }
    //左上右下判断 
    for (var i = x, j = y; i >= 0, j >= 0; i--, j--) {
        if (gameData[i][j] != player) {
            break;
        }
        cross1++;
    }
    for (var i = x + 1, j = y + 1; i < SIZE, j < SIZE; i++, j++) {
        if (gameData[i][j] != player) {
            break;
        }
        cross1++;
    }
    //右上左下判断 
    for (var i = x, j = y; i >= 0, j < SIZE; i--, j++) {
        if (gameData[i][j] != player) {
            break;
        }
        cross2++;
    }
    for (var i = x + 1, j = y - 1; i < SIZE, j >= 0; i++, j--) {
        if (gameData[i][j] != player) {
            break;
        }
        cross2++;
    }
    if (horizontal >= WIN || vertical >= WIN || cross1 >= WIN || cross2 >= WIN) {
        return player;
    }
    return 0;
}

document.addEventListener('DOMContentLoaded', function() {
    var game = new Game();
    game.start();
    console.log('DOMContentLoaded')
})
