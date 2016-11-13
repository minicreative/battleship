var toams7AI = function(game, is_player_one, delay) {

    if (is_player_one) var key = game.registerPlayerOne();
    else key = game.registerPlayerTwo();

    var turn_delay = 0;
    if (delay != undefined) turn_delay = delay;

    // Setup current player tag
    var currentPlayer = 1;

    // Setup storage for smart hits
    var foundShip, hitX, hitY, direction;
    var reset = function () {
        foundShip = false;
        hitX = 0;
        hitY = 0;
        direction = 0;
        counter = 0;
        firstMiss = 0;
    }
    reset();

    game.registerEventHandler(SBConstants.TURN_CHANGE_EVENT, function (e) {
        currentPlayer = e.who;
        if (isMyTurn(currentPlayer)) {
            var x, y;
            if (!foundShip) {
                var coordinates = getSmarterRandom();
                x = coordinates.x;
                y = coordinates.y;
            } else if (!counter) {
                switch (direction) {
                    case 0: x = hitX; y = hitY+1; break;
                    case 1: x = hitX+1; y = hitY; break;
                    case 2: x = hitX; y = hitY-1; break;
                    case 3: x = hitX-1; y = hitY; break;
                }
            } else if (!firstMiss) {
                switch (direction) {
                    case 0: x = hitX; y = hitY+counter+1; break;
                    case 1: x = hitX+counter+1; y = hitY; break;
                    case 2: x = hitX; y = hitY-counter+1; break;
                    case 3: x = hitX-counter+1; y = hitY; break;
                }
            } else {
                switch (direction) {
                    case 0: x = hitX; y = hitY-firstMiss; break;
                    case 1: x = hitX-firstMiss; y = hitY; break;
                    case 2: x = hitX; y = hitY+firstMiss; break;
                    case 3: x = hitX+firstMiss; y = hitY; break;
                }
            }
            setTimeout(function () {game.shootAt(key, game.normalizeX(x), game.normalizeY(y));}, turn_delay);
        }
    });

    game.registerEventHandler(SBConstants.HIT_EVENT, function (e) {
        if (isMyTurn(currentPlayer)) {

            // Check if ship is mine, if so consider a miss
            if (e.ship.isMine(key)) return;

            // If ship hasn't been found
            if (!foundShip) {
                hitX = e.x; hitY = e.y;
                foundShip = true;
            } else if (!firstMiss) {
                counter++;
            } else {
                firstMiss++;
            }
        }
    });

    game.registerEventHandler(SBConstants.MISS_EVENT, function (e) {
        if (isMyTurn(currentPlayer)) {
            if (foundShip) {
                if (!counter) {
                    direction++;
                } else if (!firstMiss) {
                    firstMiss = 1;
                } else {
                    reset();
                }
            }
        }
    });

    var isMyTurn = function (currentPlayer) {
        if (is_player_one && (currentPlayer == 1)) return true;
        if (!is_player_one && (currentPlayer == 2)) return true;
        return false;
    };

    var getSmarterRandom = function (x, y) {
        x = Math.floor(Math.random() * game.getBoardSize());
        y = Math.floor(Math.random() * game.getBoardSize());
        if (game.queryLocation(key, x, y).type == ('p'+currentPlayer)) return getSmarterRandom(x, y);
        if (game.queryLocation(key, x, y).type == 'miss') return getSmarterRandom(x,y);
        return {"x": x, "y": y};
    };

    this.giveUpKey = function() {
	       return key;
    }
}
