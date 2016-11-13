
// SUPER BATTLESHIP
// Author: Tomas Roy

    // Setup global variables
    var game, currentPlayer, turnCount, player1, player2, board;

    // Initialize game when document is ready
    $(document).ready(function () {
        initializeGame();
    });

    // Initalize Game: makes a new game object, runs functions
    var initializeGame = function (config, useSmartAI) {

        // Start loading sequence
        $("#loading").css('display', 'block');

        // Initialize game object
        game = new SuperBattleship(config);

        // Run setup functions
        player1 = game.registerPlayerOne(); // Register player one
        if (useSmartAI) player2 = new toams7AI(game, false, 100).giveUpKey(); // Register player two with toams7AI.js
        else player2 = new DumbAI(game, false, 100).giveUpKey(); // Register player two with DumbAI.js
        game.startGame(); // Start game

        // Decide whether to make new game if ships touch borders (prevent ship cutoff)
        var reinitialize = false;
        var size = game.getBoardSize();
        var fleet = game.getPlayerOneFleet();
        var otherFleet = game.getPlayerTwoFleet();
        for (var i in otherFleet) fleet.push(otherFleet[i]);
        for (var i in fleet) {
            var ship = fleet[i];
            var shipSize = ship.getSize();
            var position = ship.getPosition(player1);
            if (!position) position = ship.getPosition(player2);
            if (position.x < shipSize || position.y < shipSize || position.x > size-shipSize || position.y > size-shipSize) {
                reinitialize = true; break;
            }
        }

        // Make new game, if not, run remaining setup
        if (reinitialize) initializeGame(config, useSmartAI);
        else {
            setupBoard(); // Setup board
            setupHandlers(); // Start listening to game events
            setupListeners(); // Start listening to user interactions
            drawShips(); // Draw ships
            setupMoveForm(); // Adds options to #moveShip form based on player 1 fleet
            $("#loading").css('display', 'none'); // End loading sequence

            // Setup status
            currentPlayer = 1;
            turnCount = 0;
            $("#turnCount").html(turnCount);
            $("#currentPlayer").html("Player "+currentPlayer);
            $("#turnLimit").html(game.getTurnLimit());
            $("#log").empty();
        }
    };

    // Setup Board: adds cells to board based on game size
    var setupBoard = function () {

        // Get board div from DOM
        board = $("#board");

        // Clear board in case cells already exist
        board.empty();

        // Remove gameover class and add message
        board.removeClass("gameover");
        board.append("<div class='message'></div>");

        // Get dimesions of board and details from game object
        var width = board.width();
        var height = board.height();
        var size = game.getBoardSize();
        var cellWidth = width / size;
        var cellHeight = height / size;

        // Create cells and add to board
        for (var x=0; x < size; x++) {
            for (var y=0; y < size; y++) {
                var cell = $("<div></div>");
                cell.addClass("cell");
                cell.attr('x', x);
                cell.attr('y', y);
                cell.attr('id', 'x'+x+'y'+y);
                cell.css('width', cellWidth);
                cell.css('height', cellHeight);
                cell.css('top', y*cellWidth);
                cell.css('left', x*cellHeight);
                board.append(cell);
            }
        }
    };

    // Setup Handlers: initializes game event handlers
    var setupHandlers = function () {

        // Initialize log DOM element
        var log = $("#log");

        // Process all events
        game.registerEventHandler(SBConstants.ALL_EVENTS, function (event) {

            // Don't run function if turn change
            if (event.event_type == 0) return;

            // Initialize message
            var message = "Player "+currentPlayer+": ";

            // Determine owner
            var owner = "";
            if (event.event_type == 1 || event.event_type == 3) {
                var player_code = event.ship.getOwner();
                if (player_code == SBConstants.PLAYER_ONE) owner = "Player 1's ";
                else owner = "Player 2's ";
            }

            // Add event to message
            if (event.event_type == 1) message += "Hit " + owner + event.ship.getName() + "!";
            if (event.event_type == 2) message += "Missed!";
            if (event.event_type == 3) message += "Sunk " + owner + event.ship.getName() + "!";
            if (event.event_type == 4) {
                if (event.winner == 4) message = "Game was a draw.";
                else message = "Winner: Player " + event.winner + "!";
                turnCount = game.getTurnCount();
                $("#turnCount").html(turnCount);
                board.find('.message').html(message);
                board.addClass('gameover');
            }

            // Add message to DOM
            var output = $("<div class='message'>" + message + "</div>");
            log.prepend(output);
        })

        // Process turn change events
        game.registerEventHandler(SBConstants.TURN_CHANGE_EVENT, function (event) {

            // Update status variables
            turnCount = game.getTurnCount();
            currentPlayer = event.who;

            // Clear misses & player tags
            $(".cell.miss").each(function () {
                var cell = $(this);
                if (cell.attr("expires") == turnCount) cell.removeClass("miss");
            })

            // Update currentPlayer and turn count
            $("#turnCount").html(turnCount);
            $("#currentPlayer").html("Player "+currentPlayer);
        });

        // Process miss and hit events
        game.registerEventHandler(SBConstants.MISS_EVENT, function(event) {processFire(event)});
        game.registerEventHandler(SBConstants.HIT_EVENT, function(event) {processFire(event)});

    };

    // Process Fire: handles players shooting
    var processFire = function (e) {

        // Get DOM element for cell
        var cell = $("#x" + e.x + "y" + e.y);

        // Add class for hit
        if (e.event_type == 1) {
            cell.addClass("hit");
        }

        // Add class for miss
        if (e.event_type == 2) {
            cell.addClass("miss");
            cell.attr("expires", e.expiration);
        }
    };

    // Draw Ships: populates a specified players board with their ships
    var drawShips = function () {

        // Clear isShip cells and their hit cells
        $(".isMyShip").each(function () {
            $(this).removeClass('isMyShip');
            $(this).removeClass('hit');
        })

        // Clear visible
        $(".visible").each(function () {
            $(this).removeClass('visible');
        });

        // Get fleet array for player one & two, combine into fullfleet
        var fleet1 = game.getPlayerOneFleet();
        var fleet2 = game.getPlayerTwoFleet();
        var fullfleet = new Array();
        for (var i in fleet1) fullfleet.push(fleet1[i]);
        for (var i in fleet2) fullfleet.push(fleet2[i]);

        // Iterate through fleets
        for (var i in fullfleet) {

            // Get current ship
            var ship = fullfleet[i];

            // Get position of ship whether player1 or player2
            var position = ship.getPosition(player1);
            if (!position) position = ship.getPosition(player2);

            // Get other variables
            var x = position.x;
            var y = position.y;
            var direction = position.direction;
            var size = ship.getSize();

            // Iterate through ship cells
            for (var j=0; j < size; j++) {

                // Initialize cell, determine direction, assign cell
                var cell;
                switch (direction) {
                    case "north": cell = $('#x'+(x)+'y'+(y+j)); break;
                    case "south": cell = $('#x'+(x)+'y'+(y-j)); break;
                    case "east": cell = $('#x'+(x-j)+'y'+(y)); break;
                    case "west": cell = $('#x'+(x+j)+'y'+(y)); break;
                }

                // Handle player1 ships
                if (ship.isMine(player1)) {
                    // Add ship class to cell
                    cell.addClass('isMyShip');

                    // Get dimensions of modified cell, query location, and add hit class
                    var shipX = cell.attr('x');
                    var shipY = cell.attr('y');
                    var locationDetails = game.queryLocation(player1, shipX, shipY);
                    if (locationDetails.state == 1) cell.addClass('hit');
                }

                // Handle player2 ships
                else cell.addClass('isOtherShip');
            }
        }

        // Iterate through other ships, check if visible
        $('.isOtherShip').each(function () {
            var cell = $(this);
            var x = cell.attr('x');
            var y = cell.attr('y');
            for (var i in fleet1) {
                var ship = fleet1[i];
                if (ship.canSee(player1, x, y)) cell.addClass('visible');
            }
        });
    };

    // Setup Move Form: populates a form that allows players to move ships
    var setupMoveForm = function () {

        // Get fleet from player 1
        var fleet = game.getPlayerOneFleet();

        // Get form objects
        var form = $("#moveShip");
        var shipList = form.find("#shipList");
        shipList.empty();

        // Add ships to form
        for (var i in fleet) {
            var ship = fleet[i];
            var name = ship.getName();
            var option = $('<option value="' + name + '">' + name + '</option>');
            shipList.append(option);
        }
    };

    // Setup Listeners: initialize functions which listen to the view
    var setupListeners = function () {

        // Listen to cell click, perform shoot function
        $(".cell").on('click', function (event) {
            var cell = $(this);
            game.shootAt(player1, cell.attr('x'), cell.attr('y'));
        });

        // Listen to moveShip submit, perform move or rotate function
        $("#moveShip").on('submit', function (event) {

            // Prevent default action
            event.preventDefault();

            // Return if game over
            if (game.getStatus() == 2) return;

            // Get values from form
            var shipName = $("#shipList").val();
            var direction = $("#direction").val();

            // Get ship from fleet
            var shipToMove = game.getShipByName(player1, shipName);

            // Add to log
            $("#log").prepend("<div class='message'>Player " + currentPlayer + ": Moved their " + shipName + " " + direction + "</div>");

            // Move ship
            switch (direction) {
                case "forward": game.moveShipForward(player1, shipToMove); break;
                case "backward": game.moveShipBackward(player1, shipToMove); break;
                case "clockwise": game.rotateShipCW(player1, shipToMove); break;
                case "counter-clockwise": game.rotateShipCCW(player1, shipToMove); break;
            }

            // Redraw ships
            drawShips();
        });

        // Listen to newGame submit
        $("#newGame").on('submit', function (event) {
            // Prevent default action
            event.preventDefault();

            // Get values from form
            var sizeInput = $("#size").val();
            if (sizeInput == '') var size = 50;
            else var size = parseInt(sizeInput, 10);

            // Get values from form
            var turnsInput = $("#turns").val();
            if (turnsInput == '') var turns = 200;
            else var turns = parseInt(turnsInput, 10);

            // Get values from smartAI
            var useSmartAI = $("#smartAI")[0].checked;

            // Validate then initialize
            if (size < 20) alert("Size should be at least 20");
            else initializeGame({
                "boardSize": size,
                "turnLimit": turns,
            }, useSmartAI);
        });

        // Listen to showNearby
        $("#showVisible").on('click', function (event) {
            if ($(this)[0].checked) board.addClass('showVisible');
            else board.removeClass('showVisible');
        });

        // Listen to showAll
        $("#showAll").on('click', function (event) {
            if ($(this)[0].checked) board.addClass('showAll');
            else board.removeClass('showAll');
        });

    };
