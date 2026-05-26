function GameManager(){
    var gridCanvas = document.getElementById('grid-canvas');
    var nextCanvas = document.getElementById('next-canvas');
    var scoreContainer = document.getElementById("score-container");
    var resetButton = document.getElementById('reset-button');
    var aiButton = document.getElementById('ai-button');

    var upButton = document.getElementById('up-button');
    var downButton = document.getElementById('down-button');
    var leftButton = document.getElementById('left-button');
    var rightButton = document.getElementById('right-button');
    var spaceButton = document.getElementById('space-button');

    var gridContext = gridCanvas.getContext('2d');
    var nextContext = nextCanvas.getContext('2d');
    document.addEventListener('keydown', onKeyDown);

    var grid = new Grid(22, 10);
    var rpg = new RandomPieceGenerator();
    var ai = new AI({
        heightWeight: 0.510066,
        linesWeight: 0.760666,
        holesWeight: 0.35663,
        bumpinessWeight: 0.184483
    });
    var workingPieces = [null, rpg.nextPiece()];
    var workingPiece = null;
    var isAiActive = true;
    var isKeyEnabled = false;
    var gravityTimer = new Timer(onGravityTimerTick, 500);
    var score = 0;

    // Graphics
    function intToRGBHexString(v){
        return 'rgb(' + ((v >> 16) & 0xFF) + ',' + ((v >> 8) & 0xFF) + ',' + (v & 0xFF) + ')';
    }

    function redrawGridCanvas(workingPieceVerticalOffset = 0){
        gridContext.save();

        // Clear
        gridContext.clearRect(0, 0, gridCanvas.width, gridCanvas.height);

        // Draw grid
        for(var r = 2; r < grid.rows; r++){
            for(var c = 0; c < grid.columns; c++){
                if (grid.cells[r][c] != 0){
                    gridContext.fillStyle= intToRGBHexString(grid.cells[r][c]);
                    gridContext.fillRect(20 * c, 20 * (r - 2), 20, 20);
                    gridContext.strokeStyle="#FFFFFF";
                    gridContext.strokeRect(20 * c, 20 * (r - 2), 20, 20);
                }
            }
        }

        // Draw working piece
        for(var r = 0; r < workingPiece.dimension; r++){
            for(var c = 0; c < workingPiece.dimension; c++){
                if (workingPiece.cells[r][c] != 0){
                    gridContext.fillStyle = intToRGBHexString(workingPiece.cells[r][c]);
                    gridContext.fillRect(20 * (c + workingPiece.column), 20 * ((r + workingPiece.row) - 2) + workingPieceVerticalOffset, 20, 20);
                    gridContext.strokeStyle="#FFFFFF";
                    gridContext.strokeRect(20 * (c + workingPiece.column), 20 * ((r + workingPiece.row) - 2) + workingPieceVerticalOffset, 20, 20);
                }
            }
        }

        gridContext.restore();
    }

    function redrawNextCanvas(){
        nextContext.save();

        nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
        var next = workingPieces[1];
        var xOffset = next.dimension == 2 ? 20 : next.dimension == 3 ? 10 : next.dimension == 4 ? 0 : null;
        var yOffset = next.dimension == 2 ? 20 : next.dimension == 3 ? 20 : next.dimension == 4 ? 10 : null;
        for(var r = 0; r < next.dimension; r++){
            for(var c = 0; c < next.dimension; c++){
                if (next.cells[r][c] != 0){
                    nextContext.fillStyle = intToRGBHexString(next.cells[r][c]);
                    nextContext.fillRect(xOffset + 20 * c, yOffset + 20 * r, 20, 20);
                    nextContext.strokeStyle = "#FFFFFF";
                    nextContext.strokeRect(xOffset + 20 * c, yOffset + 20 * r, 20, 20);
                }
            }
        }

        nextContext.restore();
    }

    function updateScoreContainer(){
        scoreContainer.innerHTML = score.toString();
    }

    // Drop animation
    var workingPieceDropAnimationStopwatch = null;

    function startWorkingPieceDropAnimation(callback = function(){}){
        // Calculate animation height
        animationHeight = 0;
        _workingPiece = workingPiece.clone();
        while(_workingPiece.moveDown(grid)){
            animationHeight++;
        }

        var stopwatch = new Stopwatch(function(elapsed){
            if(elapsed >= animationHeight * 20){
                stopwatch.stop();
                redrawGridCanvas(20 * animationHeight);
                callback();
                return;
            }

            redrawGridCanvas(20 * elapsed / 20);
        });

        workingPieceDropAnimationStopwatch = stopwatch;
    }

    function cancelWorkingPieceDropAnimation(){
        if(workingPieceDropAnimationStopwatch === null){
            return;
        }
        workingPieceDropAnimationStopwatch.stop();
        workingPieceDropAnimationStopwatch = null;
    }

    // Process start of turn
    function startTurn(){
        // Shift working pieces
        for(var i = 0; i < workingPieces.length - 1; i++){
            workingPieces[i] = workingPieces[i + 1];
        }
        workingPieces[workingPieces.length - 1] = rpg.nextPiece();
        workingPiece = workingPieces[0];

        // Refresh Graphics
        redrawGridCanvas();
        redrawNextCanvas();

        if(isAiActive){
            isKeyEnabled = false;
            workingPiece = ai.best(grid, workingPieces);
            startWorkingPieceDropAnimation(function(){
                while(workingPiece.moveDown(grid)); // Drop working piece
                if(!endTurn()){
                    alert('Game Over!');
                    return;
                }
                startTurn();
            })
        }else{
            isKeyEnabled = true;
            gravityTimer.resetForward(500);
        }
    }

    // Process end of turn
    function endTurn(){
        // Add working piece
        grid.addPiece(workingPiece);

        // Clear lines
        score += grid.clearLines();

        // Refresh graphics
        redrawGridCanvas();
        updateScoreContainer();

        return !grid.exceeded();
    }

    // Process gravity tick
    function onGravityTimerTick(){
        // If working piece has not reached bottom
        if(workingPiece.canMoveDown(grid)){
            workingPiece.moveDown(grid);
            redrawGridCanvas();
            return;
        }

        // Stop gravity if working piece has reached bottom
        gravityTimer.stop();

        // If working piece has reached bottom, end of turn has been processed
        // and game cannot continue because grid has been exceeded
        if(!endTurn()){
            isKeyEnabled = false;
            alert('Game Over!');
            return;
        }

        // If working piece has reached bottom, end of turn has been processed
        // and game can still continue.
        startTurn();
    }

    function upButtonEvent () {
        workingPiece.rotate(grid);
        redrawGridCanvas();
    }

    function downButtonEvent () {
        gravityTimer.resetForward(500);
    }

    function leftButtonEvent () {
        if(workingPiece.canMoveLeft(grid)){
            workingPiece.moveLeft(grid);
            redrawGridCanvas();
        }
    }

    function rightButtonEvent () {
        if(workingPiece.canMoveRight(grid)){
            workingPiece.moveRight(grid);
            redrawGridCanvas();
        }
    }

    function spaceButtonEvent () {
        isKeyEnabled = false;
        gravityTimer.stop(); // Stop gravity
        startWorkingPieceDropAnimation(function(){ // Start drop animation
            while(workingPiece.moveDown(grid)); // Drop working piece
            if(!endTurn()){
                alert('Game Over!');
                return;
            }
            startTurn();
        });
    }
    // Process keys
    function onKeyDown(event){
        if(!isKeyEnabled){
            return;
        }
        switch(event.which){
            case 32: // spacebar
                spaceButtonEvent();
                break;
            case 40: // down
                downButtonEvent();
                break;
            case 37: //left
                leftButtonEvent();
                break;
            case 39: //right
                rightButtonEvent();
                break;
            case 38: //up
                upButtonEvent();
                break;
        }
    }

    upButton.onclick = function () {
        upButtonEvent();
    }

    downButton.onclick = function () {
        downButtonEvent();
    }

    leftButton.onclick = function () {
        leftButtonEvent();
    }

    rightButton.onclick = function () {
        rightButtonEvent();
    }

    spaceButton.onclick = function () {
        spaceButtonEvent();
    }

    aiButton.onclick = function(){
        if (isAiActive){
            isAiActive = false;
            aiButton.style.backgroundColor = "#f9f9f9";
        }else{
            isAiActive = true;
            aiButton.style.backgroundColor = "#e9e9ff";

            isKeyEnabled = false;
            gravityTimer.stop();
            startWorkingPieceDropAnimation(function(){ // Start drop animation
                while(workingPiece.moveDown(grid)); // Drop working piece
                if(!endTurn()){
                    alert('Game Over!');
                    return;
                }
                startTurn();
            });
        }
    }

    resetButton.onclick = function(){
        gravityTimer.stop();
        cancelWorkingPieceDropAnimation();
        grid = new Grid(22, 10);
        rpg = new RandomPieceGenerator();
        workingPieces = [null, rpg.nextPiece()];
        workingPiece = null;
        score = 0;
        isKeyEnabled = true;
        updateScoreContainer();
        startTurn();
    }

    aiButton.style.backgroundColor = "#e9e9ff";
    startTurn();
}
