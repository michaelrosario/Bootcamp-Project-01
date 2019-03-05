var map;
var infowindow;
var service;
var activeInfoWindow;
var loadedMarkers = [];

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
        console.log(place.geometry.viewport);
      } else {
        map.setCenter(place.geometry.location);
        console.log(place.geometry.location)
      }
      map.setZoom(15);
      searchArea({
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      });
      console.log('place',`/search/?lat=${place.geometry.location.lat()}&lang=${place.geometry.location.lng()}`);
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
  
  console.log(lat+" "+lang+" "+zoom);  

  if(lat && lang){
    newLocation(lat,lang,zoom);
  }
 
}    

function newLocation(newLat,newLng,newZoom){

var center = new google.maps.LatLng(newLat, newLng);

map.setZoom(parseInt(newZoom));
map.panTo(center);      
}
var markers = [];
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
            var marker = new google.maps.Marker({
                'position': position,
                name: place.name,
                vicinity: place.vicinity,
                rating: place.rating,
                opening_hours: place.opening_hours,
                id: place.id
              });
            
            
            google.maps.event.addListener(marker, 'click', function() {
                
                console.log(JSON.stringify(place));
                if (infowindow) {
                  infowindow.close();
                }

                if (activeInfoWindow) {
                  activeInfoWindow.close();
                }

                infowindow.setContent(`
                  <strong>${this.name}</strong> <br>
                  ${this.vicinity}<br>
                  ${this.rating ? `Rating: ${this.rating}` : ''} <br>
                  ${this.opening_hours && this.opening_hours.open_now ? `
                    Currently Open<br>
                    <a href="#" class="button checkIn" data-id="${this.id}">Check In</a>`  : 'Currently Closed'}<br>
                  
                `);
                activeInfoWindow = infowindow;
                infowindow.open(map, this);

              });
            
            markers.push(marker);
            //createMarker(results[i]);
            //console.log(loadedMarkers);


          }
        }
      }

      var markerCluster = new MarkerClusterer(map, markers,
        {imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'});

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
 
  // observer
  checkins.on("value", function (snapshot) {
    
    snapshot.forEach(function(items) {
      console.log(items.key);
      console.log($("#"+items.key));
    });
    
  });

  $(document).on('click','a.checkIn',function(){
    var id = $(this).attr("data-id");
    console.log("id",id);
    database.ref("/check-ins/"+id).push({
      id: id,
      checkins: 0,
      timeStamp: new Date()
    });


   
    return false;

  });

  
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