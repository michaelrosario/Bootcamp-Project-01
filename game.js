  // Creates an array that lists out all of the options (Rock, Paper, or Scissors).
  var computerChoices = ["r", "p", "s"];

  // Creating variables to hold the number of wins, losses, and ties. They start at 0.
  var name = "Player 1";
  var challenger = false; // if not computer
  var challengerId = "";
  var status = "";
  var wins = 0;
  var losses = 0;
  var ties = 0;
  var round = 1;
  var ready = false;
  var currentUserReady = true; // check is user clicks
  var key = Math.round(new Date().getTime()/1000);

// Initialize Firebase
var config = {
    apiKey: "AIzaSyAMq-zbxLo_tgM9l4APGh0ScK5AKr0Fxao",
    authDomain: "rps-game-19d30.firebaseapp.com",
    databaseURL: "https://rps-game-19d30.firebaseio.com",
    projectId: "rps-game-19d30",
    storageBucket: "rps-game-19d30.appspot.com",
    messagingSenderId: "700549478537"
};
firebase.initializeApp(config);

var database = firebase.database();

var connectionsRef = database.ref("/connections");
var connectedRef = database.ref(".info/connected");

  // When the client's connection state changes...
  connectedRef.on("value", function(snap) {
    // If they are connected..
    if (snap.val()) {
      // Add user to the connections list.
      var con = connectionsRef.push(key);
      
      // Remove user from the connection list when they disconnect.
      database.ref("/messages/"+key).onDisconnect().remove();
      database.ref("/players/"+key).onDisconnect().remove();
      con.onDisconnect().remove();

    }
  });

  // When first loaded or when the connections list changes...
  database.ref('players').on("value", function(snapshot) {
    var currentlyPlaying = 0;
    $(".challenger").empty();
  
    snapshot.forEach(function(userSnapshot) {
      
      var currentKey = parseInt(userSnapshot.key);
      var player = userSnapshot.val();
      if(player.currentlyPlaying){
        currentlyPlaying++;
      }

      // currentKey != key        : Check if it's not you
      // player.status == key     : Check if the player wants to play with you
      // status == currentKey     : Check if you approved to play with player

      if(currentKey !== key && player.status == key && status == currentKey){
        
        $(".challenger").html(`<div class="playerChallenge Item${currentKey}">You are now playing with ${player.name}.</div>`);
        
        if(!challenger){

          challenger = player.name;
          challengerId = currentKey;
          round = 1;   

          // set specifics to player
          $(".player2").text(challenger);
          
          // Update player to currently playing
          database.ref("/players/"+key).update({
            currentlyPlaying : true
          });

          // Update challenger to currently playing
          database.ref("/players/"+currentKey).update({
            currentlyPlaying : true
          });

          $("#messaging .messages").empty();
          $("#messaging").find("input").attr("placeholder",`Send a message to ${challenger}`);
          $("#messaging").slideDown();

        }

      } else if(!challenger){ 

        if(currentKey !== key && player.status == key){
        $(".challenger").html(`<div class="playerChallenge Item${currentKey}">${player.name} wants to play with you! &nbsp; <a href="#" data-username='${player.name}' data-player='${currentKey}'>Accept</a></div>`);
        } else if(currentKey !== key && !player.currentlyPlaying){
          $(".challenger").append(`<div class="playersList Item${currentKey}">Invite ${player.name} to play! &nbsp; <a href="#" data-username='${player.name}' data-player='${currentKey}'>Play Now</a></div>`);
        } else if(currentKey !== key && player.currentlyPlaying) {
          $(".challenger").append(`<p>${player.name} is currently playing...</p>`);
        } else if((snapshot.numChildren() - currentlyPlaying) < 2 &&  $(".challenger").find("div").length === 0) {
            $(".challenger").html(`<p>Waiting for Challengers...</p>`);
        }
      }

    });
  });

  // Send a request to play
  $(document).on("click",".playersList a",function(e){
    e.preventDefault();
    
    var challengerId = $(this).attr('data-player');
    var challengerName = $(this).attr('data-username');
    
    database.ref("/players/"+key).update({
      status : challengerId,
      wins: 0,
      losses: 0,
      ties: 0,
    });

    $(".Item"+challengerId).html(`<p>Asking <strong>${challengerName}</strong> to play... Please wait...</p>`);

  });

  // Accept request to player
  $(document).on("click",".playerChallenge a",function(e){
    e.preventDefault();
    
    var challengerId = $(this).attr('data-player');
    var challengerName = $(this).attr('data-username');
    
    // set player
    database.ref("/players/"+key).update({
      status : challengerId,
      wins: 0,
      losses: 0,
      ties: 0,
    });
    
    challenger = challengerName;
    challengerId = challengerId;
    round = 1;
    
    $(".player2").text(challenger);
    $("#messaging .messages").empty();
    $("#messaging").find("input").attr("placeholder",`Send a message to ${challenger}`);
    $("#messaging").slideDown();
    $(".Item"+challengerId).html(`<p>You are now playing with <strong>${challengerName}</strong>.</p>`);

  });

  // Check if data removed
  database.ref('players').on('child_removed', function(data) {

    // check if the player that left is the challenger
    if(data.key == challengerId){
      
      // Remove the indicator of who you are playing against
      $(".Item"+data.key).remove();
      
      // Reset player
      database.ref("/players/"+key).update({
        status : '',
        currentlyPlaying: false
      });

      $(".status").show().html(`<p>${challenger} left the game! <br>${wins > losses ? 'You win!' : 'You lost!'}</p>`);
      $(".player2").text("Computer");
      round = 1;
      wins = 0;
      losses = 0;
      ties = 0;
      $("#wins").html(`<span>wins:</span> ${wins}`);
      $("#losses").html(`<span>losses:</span> ${losses}`);
      $("#ties").html(`<span>ties:</span> ${ties}`);
      challenger = false;
      challengerId = "";
      if($(".challenger").find('div').length === 0){
        $(".challenger").html(`<p>Waiting for Challengers...</p>`);
      }

    }
  });

  var userChoice = "";
  var challengerChoice = "";
  var userTime = 0;
  var challengerTime = 0;
  
  // Check if data changed
  database.ref('players').on('child_changed', function(data) {
    if(!userChoice && challenger && data.key == key){
      if(userTime != data.val().timesStamp){
        userChoice = data.val().currentChoice;
        userTime = data.val().timesStamp;
        $(".status").removeClass("ready").hide().html(`<p>Waiting for ${challenger}...</p>`).fadeIn();
      }
    } else if(!challengerChoice && challenger && data.key == challengerId){
      if(challengerTime != data.val().timesStamp){
        challengerTime = data.val().timesStamp;
        challengerChoice = data.val().currentChoice;
        $(".status").removeClass("ready").hide().html(`<p>It's your turn, ${name}...</p>`).fadeIn();
      }
    }
    if(ready && challenger && userChoice && challengerChoice){
      $(".status").html("");
      runGame(userChoice,challengerChoice);
    }
  });

  $(".start").on("click",function(e){
    e.preventDefault();
    $(".player-start").submit();
  });

  $(".player-start input").on("focus",function(){
    $(this).parent().removeClass("error")
  }).bind('keypress', alphaOnly);
 
  $(".player-start").on("submit",function(e){
    e.preventDefault();
    if( $(".player").val().length < 2 ){
      
      $(this).addClass("error");
    
    } else {

      name = $(".player").val();
      
      $(".player1").text(name);
      $(".player-start").slideUp();
      $(".game").addClass("ready").fadeIn();
      ready = true;

      database.ref("/players/"+key).set({
        name: name,
        status
      });

      database.ref("/messages/"+key).set({
        message:'',
        timesStamp:'',
      });
      
    }
  });

    database.ref("/players/"+key).on("value", function(snapshot) {

      if(snapshot.child("name").exists()){
        // Set the local variables for highBidder equal to the stored values in firebase.
        wins = parseInt(snapshot.val().wins) || 0;
        ties = parseInt(snapshot.val().ties) || 0;
        losses = parseInt(snapshot.val().losses) || 0;
        status = parseInt(snapshot.val().status) || 0;
    
        $("#wins").html(`<span>wins:</span> ${wins}`);
        $("#losses").html(`<span>losses:</span> ${losses}`);
        $("#ties").html(`<span>ties:</span> ${ties}`);
      }

    });

    $("#wins").html(`<span>wins:</span> ${wins}`);
    $("#losses").html(`<span>losses:</span> ${losses}`);
    $("#ties").html(`<span>ties:</span> ${ties}`);
      
    $(".status").addClass("ready");

    // This function is run whenever the user presses a key.
    document.onkeyup = function(event) {
      
      if(event.target.id === 'player-input' || event.target.id === 'message-input'){
        return; // exclude on key up on input
      }  

      if(currentUserReady){
        var userInput = event.key.toLowerCase();
      }

      if ((userInput === "r") || (userInput === "p") || (userInput === "s") && currentUserReady) {
        
        if(ready && !challenger){
          currentUserReady = false;
          var computerGuess = computerChoices[Math.floor(Math.random() * computerChoices.length)];
          runGame(event.key,computerGuess);
        } else if(ready) {
          currentUserReady = false;
          updateMultiplayerGame(event.key);
        }
      
      }  
    }

    $(".button").on("mousedown",function(e){
      
      e.preventDefault();

      if(currentUserReady){
        var userInput = $(this).attr("data-option");
      }
      
      if ((userInput === "r") || (userInput === "p") || (userInput === "s") && currentUserReady) {

        if(ready && !challenger){
          currentUserReady = false;
          var computerGuess = computerChoices[Math.floor(Math.random() * computerChoices.length)];
          runGame(userInput,computerGuess);
        } else if(ready) {
          currentUserReady = false;
          updateMultiplayerGame(userInput);
        }
      }

      return false;
    });

    function updateMultiplayerGame(input){
     
      // Determines which key was pressed.
      var saveChoice = input.toLowerCase();
      var timesStamp = Math.round(new Date().getTime()/1000);

      if(saveChoice === "r"){
        $("#rock").addClass("active");
      }
      if(saveChoice === "p"){
        $("#paper").addClass("active");
      }
      if(saveChoice === "s"){
        $("#scissors").addClass("active");
      }

      database.ref("/players/"+key).update({
        currentChoice: saveChoice,
        timesStamp: timesStamp
      });

    }

    function runGame(userInput,challengerInput){
      
      if (((userInput === "r") || (userInput === "p") || (userInput === "s")) && ready) {
        
        ready = false;

        if(userInput === "r"){
          $("#rock").addClass("active");
        }
        if(userInput === "p"){
          $("#paper").addClass("active");
        }
        if(userInput === "s"){
          $("#scissors").addClass("active");
        }

        userChoice = "";
        challengerChoice = "";
        
        $(".status")
          .hide()
          .removeClass("ready")
          .show()
          .html(`Round ${round++}`)
          .delay(500)
          .fadeOut();

        $(".left")
          .css({'background':`url(./assets/images/left-${userInput}.png) center center no-repeat`,'background-size':'contain'})
          .addClass("start");

        $(".right")
          .css({'background':`url(./assets/images/right-${challengerInput}.png) center center no-repeat`,'background-size':'contain'})
          .addClass("start");
      
        setTimeout(function(){

            $(".right,.left").removeClass("start").find("img");

        },1600);

      if ((userInput === "r" && challengerInput === "s") ||
            (userInput === "s" && challengerInput === "p") || 
            (userInput === "p" && challengerInput === "r")) {
            wins++;
            setTimeout(function(){ 
              $("#wins").addClass("active");
              $(".status").hide().html("You won!").addClass("win").fadeIn();
            }, 1500 );
            
            database.ref("/players/"+key).update({
              wins : wins
            });

          } else if (userInput === challengerInput) {
            ties++;
            setTimeout(function(){ 
               $("#ties").addClass("active");
               $(".status").hide().html("It's a Tie!").addClass("tie").fadeIn(); 
             }, 1500 );
            database.ref("/players/"+key).update({
              ties : ties
            });
          
          } else {
            losses++;
            setTimeout(function(){ 
              $("#losses").addClass("active");
              $(".status").hide().html("You lost!").addClass("loss").fadeIn();
            }, 1500 );

            database.ref("/players/"+key).update({
              losses : losses
            });
          
          }

          setTimeout(function(){

            $("#losses,#wins,#ties,#rock,#paper,#scissors").removeClass("active");

         },2000);

          setTimeout(function(){
            
            currentUserReady = true;  
            ready = true;
            $(".status").html("READY").addClass("ready").removeClass("loss win tie").fadeIn();

          },2500);
        }
    }

    // messaging
    database.ref('/messages/').on('child_changed', function(snapshot) {
      if(snapshot.child("message").exists()){
        
        if(snapshot.key == key) {
          $(".messages").append(`
          <div style="display:none;" class="message player1-message">
            ${name} &nbsp; <br><span>${snapshot.val().message}</span>
          </div>`);
        } else if(snapshot.key == challengerId) {
          $(".messages").append(`
          <div style="display:none;" class="message player2-message">
           &nbsp; ${challenger}<br><span>${snapshot.val().message}</span>
          </div>`);
        }
        $(".messages div:hidden").fadeIn();
        $(".messages").animate({ scrollTop: $(document).height() }, "slow");
      }
    });

    $(".messages").on('click',function(e){
      e.preventDefault();
      $("#chat input").focus();
    });

    $(".message-send").on("click",function(e){
      e.preventDefault();
      $("#chat").submit();
    });
  
    $("#chat input").on("focus",function(){
      $(this).parent().removeClass("error")
    }).bind('keypress', alphaNumericOnly);
   
    $("#chat").on("submit",function(e){
      e.preventDefault();
      if( $("#message-input").val().length < 2 ){
        
        $(this).addClass("error");
      
      } else {
        
        var message = $("#message-input").val().toString();
        var timesStamp = Math.round(new Date().getTime()/1000);
        $("#message-input").val(""); // empty the input
        database.ref("/messages/"+key).update({
          message: message,
          timesStamp: timesStamp
        });

      }
    });

    function alphaOnly(event) {
      var value = String.fromCharCode(event.which);
      var pattern = new RegExp(/[a-z]/i);
      if (event.keyCode === 13) {
        return; // return key
      } else {
        return pattern.test(value);
      }
   }

   function alphaNumericOnly(event) {
    var value = String.fromCharCode(event.which);
    var pattern = new RegExp(/^[a-zA-Z0-9 '"!?.-]+$/i);
    if (event.keyCode === 13) {
      return; // return key
    } else {
      return pattern.test(value);
    }
 }