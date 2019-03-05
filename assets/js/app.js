var map;
var infowindow;
var service;
var activeInfoWindow;
var currentMarker = {};
var markers = [];
var loadedMarkers = [];


var counter = 0; // keep track of number of checkins
var placeId = "";

// FIREBASE CONFIG
var config = {
  apiKey: "AIzaSyDbUywd58phZolNaXoEYSvAskt2gw0QGLE",
  authDomain: "rimot-41ba4.firebaseapp.com",
  databaseURL: "https://rimot-41ba4.firebaseio.com",
  projectId: "rimot-41ba4",
  storageBucket: "",
  messagingSenderId: "219006616621"
};
firebase.initializeApp(config);

var database = firebase.database();


var checkins = database.ref("/check-ins");

function initMap() {
  
  var nyc = {
    lat: 40.7794406, 
    lng: -73.965438
  };
  
  var customMapTypeId = 'custom_style';

  var jsonStyle = [
      {
          "featureType": "water",
          "elementType": "geometry",
          "stylers": [
              {
                  "color": "#e9e9e9"
              },
              {
                  "lightness": 17
              }
          ]
      },
      {
          "featureType": "landscape",
          "elementType": "geometry",
          "stylers": [
              {
                  "color": "#f5f5f5"
              },
              {
                  "lightness": 20
              }
          ]
      },
      {
          "featureType": "road.highway",
          "elementType": "geometry.fill",
          "stylers": [
              {
                  "color": "#ffffff"
              },
              {
                  "lightness": 17
              }
          ]
      },
      {
          "featureType": "road.highway",
          "elementType": "geometry.stroke",
          "stylers": [
              {
                  "color": "#ffffff"
              },
              {
                  "lightness": 29
              },
              {
                  "weight": 0.2
              }
          ]
      },
      {
          "featureType": "road.arterial",
          "elementType": "geometry",
          "stylers": [
              {
                  "color": "#ffffff"
              },
              {
                  "lightness": 18
              }
          ]
      },
      {
          "featureType": "road.local",
          "elementType": "geometry",
          "stylers": [
              {
                  "color": "#ffffff"
              },
              {
                  "lightness": 16
              }
          ]
      },
      {
          "featureType": "poi",
          "elementType": "geometry",
          "stylers": [
              {
                  "color": "#f5f5f5"
              },
              {
                  "lightness": 21
              }
          ]
      },
      {
          "featureType": "poi.park",
          "elementType": "geometry",
          "stylers": [
              {
                  "color": "#dedede"
              },
              {
                  "lightness": 21
              }
          ]
      },
      {
          "elementType": "labels.text.stroke",
          "stylers": [
              {
                  "visibility": "on"
              },
              {
                  "color": "#ffffff"
              },
              {
                  "lightness": 16
              }
          ]
      },
      {
          "elementType": "labels.text.fill",
          "stylers": [
              {
                  "saturation": 36
              },
              {
                  "color": "#333333"
              },
              {
                  "lightness": 40
              }
          ]
      },
      {
          "elementType": "labels.icon",
          "stylers": [
              {
                  "visibility": "off"
              }
          ]
      },
      {
          "featureType": "transit",
          "elementType": "geometry",
          "stylers": [
              {
                  "color": "#f2f2f2"
              },
              {
                  "lightness": 19
              }
          ]
      },
      {
          "featureType": "administrative",
          "elementType": "geometry.fill",
          "stylers": [
              {
                  "color": "#fefefe"
              },
              {
                  "lightness": 20
              }
          ]
      },
      {
          "featureType": "administrative",
          "elementType": "geometry.stroke",
          "stylers": [
              {
                  "color": "#fefefe"
              },
              {
                  "lightness": 17
              },
              {
                  "weight": 1.2
              }
          ]
      }
  ];
  
  /* https://developers.google.com/maps/documentation/javascript/reference/ */
  map = new google.maps.Map(document.getElementById('map'), {
      zoom: 15,
      center:  nyc,
      disableDefaultUI: true,
      styles: jsonStyle,
  });

  //SEARCH
  var input = document.getElementById("search");
  var autocomplete = new google.maps.places.Autocomplete(input);
  autocomplete.bindTo('bounds', map);

  var marker = new google.maps.Marker({
      map: map,
      anchorPoint: new google.maps.Point(0, -29)
    });

  autocomplete.addListener('place_changed', function() {
    marker.setVisible(false);
    var place = autocomplete.getPlace();
    if (!place.geometry) {
        window.alert("No details available for input: '" + place.name + "'");
        return;
    }
      if (place.geometry.viewport) {
        map.fitBounds(place.geometry.viewport);
        //console.log(place.geometry.viewport);
      } else {
        map.setCenter(place.geometry.location);
        //console.log(place.geometry.location)
      }
      map.setZoom(15);
      searchArea({
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      });
      //console.log('place',`/search/?lat=${place.geometry.location.lat()}&lang=${place.geometry.location.lng()}`);
      marker.setPosition(place.geometry.location);
      marker.setVisible(false);

  });
  
  // QUERY
  searchArea(nyc);

  map.addListener("center_changed", function() {
    searchArea(map.center);
  });
    

  //QUERY STRING
  var urlParams = new URLSearchParams(window.location.search);
  var lat = urlParams.get('lat');
  var lang = urlParams.get('lang');
  var zoom = urlParams.get('zoom') || 15;
  
  //console.log(lat+" "+lang+" "+zoom);  

  if(lat && lang){
    newLocation(lat,lang,zoom);
  }
 
}    

function newLocation(newLat,newLng,newZoom){

var center = new google.maps.LatLng(newLat, newLng);

map.setZoom(parseInt(newZoom));
map.panTo(center);      
}

function searchArea(place){
var request = {
      location: place,
      keyword: 'coffee',
      radius: 1000,
    };
  infowindow = new google.maps.InfoWindow();

  service = new google.maps.places.PlacesService(map);

  service.nearbySearch(request, function(results, status) {

      if (status === google.maps.places.PlacesServiceStatus.OK) {
        for (var i = 0; i < results.length; i++) {
          if(!placeExists(results[i].id,loadedMarkers)){
            var place = results[i];
            loadedMarkers.push(place);
            var position = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
            var currentIcon = {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 6,
              fillColor: '#8FBC8F',
              strokeColor: '#8FBC8F'
            };
    
            
            // creating the Google Maps Marker
            var marker = new google.maps.Marker({
                'position': position,
                name: place.name,
                vicinity: place.vicinity,
                rating: place.rating,
                opening_hours: place.opening_hours,
                id: place.id,
                map: map,
                icon: currentIcon,
              });

              /*database.ref('/check-ins/' + place.id).once('value').then(function(snapshot) {
                  
                counter = (snapshot.val() && snapshot.val().checkins) || 0;
                if(counter > 0){
                  updateMarker(marker);
                }
                
              });
              */
            
            // when marker is clicked
            google.maps.event.addListener(marker, 'click', function() {
                
                //console.log(JSON.stringify(place));
                if (infowindow) {
                  infowindow.close();
                }

                if (activeInfoWindow) {
                  activeInfoWindow.close();
                }

                currentMarker = this;

                var marker = {
                  id : this.id,
                  name: this.name,
                  vicinity: this.vicinity,
                  opening_hours: this.opening_hours,
                  rating: this.rating,
                };

                placeId = this.id;
                //console.log('current_place is '+placeId);

                //console.log("counter outside",counter);
                database.ref('/check-ins/' + marker.id).once('value').then(function(snapshot) {
                  
                  counter = (snapshot.val() && snapshot.val().checkins) || 0;
                  //console.log("counter inside",counter);

                  infowindow.setContent(`
                    <div id="marker${marker.id}">
                      <strong>${marker.name}</strong> <br>
                      ${marker.vicinity}<br>
                      ${marker.rating ? `Rating: ${marker.rating}` : ''} <br>
                      ${marker.opening_hours && marker.opening_hours.open_now ? `
                      Currently Open<br>
                      <a href="#" class="button checkIn" data-id="${marker.id}">Check In [${counter}]</a>`  : 'Currently Closed'}<br>
                    </div>
                  `);
                });
            
                activeInfoWindow = infowindow;
                infowindow.open(map, this);

              });
            
            markers.push(marker);
            //createMarker(results[i]);
            //console.log(loadedMarkers);


          }
        }
      }
/*
      var markerCluster = new MarkerClusterer(map, markers,
        {imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'});
*/
  });
}

// Check if id exists in our list already
function placeExists(placeId,arr) {
  return arr.some(function(el) {
    return el.id === placeId;
}); 
}


/*

var config = {
    apiKey: "AIzaSyBEcHq4dTxqD0hbDb1hvxwrnIAEzcQr2sc",
    authDomain: "rimot-app.firebaseapp.com",
    databaseURL: "https://rimot-app.firebaseio.com",
    projectId: "rimot-app",
    storageBucket: "rimot-app.appspot.com",
    messagingSenderId: "327629075049"
  };
  firebase.initializeApp(config);
*/
 
  // observer
  checkins.on("value", function (snapshot) {
  /*  
    snapshot.forEach(function(items) {
      console.log(items.key);
      console.log($("#"+items.key));
    });
  */
    
  });

  $(document).on('click','a.checkIn',function(){

    var id = $(this).attr("data-id");
    console.log("id",id);
    counter++;
    placeId = id;

    updateMarker(currentMarker,counter);

    $("#marker"+id).find(".checkIn").html(`Check In [${counter}]`);
  
    database.ref("/check-ins/"+id).update({
      id: id,
      checkins: counter,
      timeStamp: new Date()
    });

    return false;

  });

  // We update any open markers
  database.ref('/check-ins/').on('child_changed', function(data) {
    console.log("checkins changed", data.key);
    if(data.key){
      var counter = data.val().checkins;
      $("#marker"+data.key).find(".checkIn").html(`Check In [${counter}]`);
      
      indexes = $.map(markers, function(obj, index) {
        if(obj.id == data.key) {
            return index;
        }
      });
      
      currentMarker = markers[indexes];
      if(currentMarker){ updateMarker(currentMarker,counter); }
      //console.log('indexes',indexes);
  
    }
  });

   // We update any open markers
   database.ref('/check-ins/').on('child_added', function(data) {
    console.log("checkins added", data.key);
    if(data.key){
      var counter = data.val().checkins;
      $("#marker"+data.key).find(".checkIn").html(`Check In [${counter}]`);
      
      indexes = $.map(markers, function(obj, index) {
        if(obj.id == data.key) {
            return index;
        }
      });
      
      currentMarker = markers[indexes];
      if(currentMarker){ updateMarker(currentMarker,counter); }

  
    }
  });


  function updateMarker(marker,checkins){

    if(marker){
      currentMarker = marker;
    }
    var colorIdx = 1;
    if(checkins >= 5){
      colorIdx = 3;
    }
    if(checkins >= 10){
      colorIdx = 0;
    }


    var color = ["#FF0000", "#00FF00", "#0000FF","#ffa500"];
                
                var icon = currentMarker.getIcon();
                icon.fillColor = color[colorIdx];
                icon.strokeColor = color[colorIdx];
                colorIdx++;
                colorIdx %= color.length;
                currentMarker.setIcon(icon);
  }

  
  

  
/*

  
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

  */