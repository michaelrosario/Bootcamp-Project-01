var config = {
    apiKey: "AIzaSyBEcHq4dTxqD0hbDb1hvxwrnIAEzcQr2sc",
    authDomain: "rimot-app.firebaseapp.com",
    databaseURL: "https://rimot-app.firebaseio.com",
    projectId: "rimot-app",
    storageBucket: "rimot-app.appspot.com",
    messagingSenderId: "327629075049"
  };
  firebase.initializeApp(config);

  var database = firebase.database;

  var connectionsRef = database.ref("/connections");
  var connectedRef = database.ref(".info/connected");

  connectedRef.on("value", function (snap) {
    if (snap.val()) {
      var con = connectionsRef.push(true);
      con.onDisconnect().remove();
    }
  })

  connectionsRef.on("value", function (snap) {

    ("#connected-viewers").text(snap.numChildren()); 
  });
  
  var recentUser = User;
  var status;

  database.ref("/userData").on("value", function (snapshot) {
    if (snapshot.child("recentUser").exists() && snapshot.child("status").exists()) {
      recentUser = snapshot.val().recentUser;
      status = snapshot.val().status;

      $("#user-name").text(snapshot.val().recentUser);
      $("#status").text(snapshot.val().status);

      console.log(recentUser);
      console.log(status);
    }

    else {
      $("#user-name").text(recentUser);
      $("#status").text(status);

      console.log(recentUser);
      console.log(status);
    }

  });

  function errorObject () {
    console.log("The read failed: " + errorObject.code)
  };

  $("#submit-status").on("click", function(event) {
    event.preventDefault();
    var userName = $("#user-name").val().trim();
    var userStatus = $("#status").val().trim();

    console.log(userName);
    console.log(userStatus);
  })

  if (userName) {
    database.ref("/userData").set({
      userName: 
      status: 
    })

    console.log(userName);
    console.log(status);

    userName = userData;
    status = message;

    $("#user-name").text(userName);
    $("#status").text(message);
  }