var map;
var infowindow;
var service;
var activeInfoWindow;
var currentMarker = {};
var markers = [];
var loadedMarkers = [];
var latestMarkers = []; 

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
var urlParams = new URLSearchParams(window.location.search);

function initMap() {

  //QUERY STRING   
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

  google.maps.event.addDomListener(input, 'keydown', function(event) { 
    if (event.keyCode === 13) { 
        event.preventDefault();
        if($("#search").val()){
          google.maps.event.trigger(event.target, 'keydown', {
              keyCode: 40
          });
      }
    }
}); 

// When it is searched on a map
autocomplete.addListener('place_changed', function (event) {
    var place = autocomplete.getPlace();
      if (!place.geometry) {
        
          //window.alert("No details available for input: '" + place.name + "'");
          //return;
      } 
      if (place.geometry.viewport) {
        map.fitBounds(place.geometry.viewport);
        //console.log(place.geometry.viewport);
      } else {
        map.setCenter(place.geometry.location);
        //console.log(place.geometry.location)
      }

      if($("#search").val()){ 
        $("#search").val("").blur();
      }
      console.log("place.types",place.types);

      if(place.name 
          && place.types.indexOf("neighborhood") === -1  
          && place.types.indexOf("premise") === -1
          && place.types.indexOf("route") === -1
          && place.types.indexOf("postal_code") === -1
          && place.types.indexOf("street_address") === -1){
        
        // creating the Google Maps Marker
        var marker = createMarker(place);

        if (activeInfoWindow) {
          activeInfoWindow.close();
        }
      

        activeInfoWindow = createWindow(marker);
    
        
      }

      map.setZoom(15);

      searchArea({
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      });

  });
  
  // QUERIES
  searchArea(nyc); // on load default to NYC

  // If location is provided on URL
  var lat = urlParams.get('lat');
  var lang = urlParams.get('lang');
  var zoom = urlParams.get('zoom') || 15;

  if(lat && lang) {
    newLocation(lat,lang,zoom);
  }
  map.addListener("center_changed", function() {
    searchArea(map.center);
  });
    
}    

// Creating helper function to build / append pop-up window on-click //
function createWindow(marker) {

  if(!marker.amenities){
    database.ref('/check-ins/'+marker.id).once('value').then(function(markerData) {
      if(markerData.exists() && markerData.val().checkins) {
        if(markerData.exists() && markerData.val().amenities){
          var timeStamp = '';
          if(markerData.val().timeStamp){
            timeStamp = markerData.val().timeStamp;
            marker.timeStamp = timeStamp;
          }
          var amenities = markerData.val().amenities;
          marker.amenities = amenities;
          marker.reload = true;
          console.log("loading amenities for " + marker.name + " " + amenities);
          createWindow(marker);
        }
      }
    });
  }
  
  var amenities = "";

  if(marker.amenities && marker.amenities.length){
    amenities = '';
    for(var i = 0; i < marker.amenities.length; i++){
      if(marker.amenities[i] == "Free Wi-Fi"){
        amenities += `<span><img src="../assets/images/wifi-icon.svg" height="20" width="20"></span>`;
      } else if(marker.amenities[i] == "Power Outlets"){
        amenities += `<span><img src="../assets/images/outlet-icon.svg" height="20" width="20"></span>`;
      } else if(marker.amenities[i] == "Restrooms"){
        amenities += `<span><img src="../assets/images/restrooms-icon.svg" height="20" width="20"></span>`;
      } else if(marker.amenities[i] == "Food/Drink"){
        amenities += `<span><img src="../assets/images/fork-knife-icon.svg" height="20" width="20"></span>`;
      }
    }
  }
  var checkInStatus = '';
  console.log(marker.timeStamp);
  if(marker.timeStamp){
    var date = marker.timeStamp;
    checkInStatus = `Latest check-in ${moment(date).fromNow()}`;
  }
  infowindow.setContent(`
    <div class="businessName" id="marker${marker.id}">
      <strong>${marker.name}</strong> <br>
      <div class="address">${marker.vicinity}</div>
      <div class="price">
      ${marker.price_level && marker.price_level === 4 ? 'Prices: $$$$' : ''}
      ${marker.price_level && marker.price_level === 3 ? 'Prices: $$$<span style="opacity: 0.3">$</span>' : ''}
      ${marker.price_level && marker.price_level === 2 ? 'Prices: $$<span style="opacity: 0.3">$$</span>' : ''}
      ${marker.price_level && marker.price_level === 1 ? 'Prices: $<span style="opacity: 0.3">$$$</span>' : ''}
      ${marker.price_level && marker.price_level === 0 ? 'Prices: <span style="opacity: 0.3">$$$$</span>' : ''}
      </div>
      ${marker.amenities && marker.amenities.length > 0 && amenities ?
        `<div class="amenities">${amenities}</div>` : ''
      }
      <div class="rating">${marker.rating ? `<strong>${marker.rating}</strong>` : ''}</div><br>
      <div class="hours">${marker.opening_hours && marker.opening_hours.open_now ? `
      Currently Open
      <a href="#" class="button checkIn" data-id="${marker.id}">Check In</a>`  : 'Currently Closed'}<br>
      </div>
      <div class="check-in-status">
          <span>How busy is this location?</span>
          <ul>
            <li><a class="checkInStatus empty" data-id="${marker.id}" data-status="empty"><img src="../assets/images/empty-icon.svg"  height="20" width="20" /></a></li>
            <li><a class="checkInStatus moderate" data-id="${marker.id}" data-status="moderate"><img src="../assets/images/moderate-icon.svg"  height="20" width="20" /.></a></li>
            <li><a class="checkInStatus full" data-id="${marker.id}" data-status="full"><img src="../assets/images/full-icon.svg"  height="20" width="20" /></a></li>
          </ul>
      </div>  
      ${checkInStatus ? `<div class="checkInStatusTime">${checkInStatus}</div>` : ""}
    </div>
  `);

  if(marker.reload){
    activeInfoWindow = infowindow;
    marker.reload = false;
    activeInfoWindow.open(map, marker);
  }
  
  return infowindow;
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

  if(markers.length){
    request.pagetoken = Math.floor(new Date()*1000);
    //console.log("request.pagetoken",request.pagetoken);
  }

  service = new google.maps.places.PlacesService(map);

  service.nearbySearch(request, function(results, status) {

      if (status === google.maps.places.PlacesServiceStatus.OK) {

        latestMarkers = []; // a smaller array set to check for what markers changed

        for (var i = 0; i < results.length; i++) {
          if(!placeExists(results[i].id,loadedMarkers)){
            var place = results[i];
            loadedMarkers.push(place);

            var marker = createMarker(place);
            
            // check for latest markers that have changed
            database.ref('/check-ins/'+marker.id).once('value').then(function(markerData) {
                
                if(markerData.exists() && markerData.val().checkins) {
                  var currentTimeStamp = '';
                  if(markerData.exists() && markerData.val().timeStamp) {
                    currentTimeStamp = markerData.val().timeStamp;
                  }
                  var currentCounter = markerData.val().checkins;
                  var amenities = [];
                  if(markerData.exists() && markerData.val().amenities){
                    amenities = markerData.val().amenities;
                  }
                  if(parseInt(currentCounter) > 0){
                    //console.log("place exists in DB, loading.. ."+ markerData.val().id + " " + markerData.val().checkins);
                    indexes = $.map(latestMarkers, function(obj, index) {
                      if(obj.id == markerData.val().id) {
                          return index;
                      }
                    });
                    currentMarker = latestMarkers[indexes];
                    if(currentMarker && currentMarker.amenities) { 
                      currentMarker.amenities = amenities; 
                      currentMarker.timeStamp = currentTimeStamp;
                    }
                    if(currentMarker){ updateMarker(currentMarker,currentCounter); }
                  }
                }
            });
          }
        }
      }
      /* Removed clustering in favor for live checkins
      var markerCluster = new MarkerClusterer(map, markers,
        {imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'});
      */
  });
}

function createMarker(place){

    var position = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };

    var currentIcon = {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 6,
      fillColor: '#c2c4c2',
      strokeColor: '#c2c4c2'
    };

    if(place.opening_hours && place.opening_hours.open_now){
      currentIcon = {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 6,
        fillColor: '#8FBC8F',
        strokeColor: '#8FBC8F'
      };
    }

    // creating the Google Maps Marker
    var marker = new google.maps.Marker({
        'position': position,
        name: place.name,
        vicinity: place.vicinity,
        rating: place.rating,
        opening_hours: place.opening_hours,
        price_level: place.price_level,
        id: place.id,
        map: map,
        icon: currentIcon,
    });
    
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
          price_level: this.price_level,
          opening_hours: this.opening_hours,
          rating: this.rating,
        };

        placeId = this.id;
        //console.log('current_place is '+placeId);

        // check firebase for related data
        database.ref('/check-ins/' + marker.id).once('value').then(function(snapshot) {
          
          if(snapshot.exists() && snapshot.val().checkins){
            counter = snapshot.val().checkins;
          } else {
            counter = 0;
          }
          if(snapshot.exists() && snapshot.val().amenities){
            marker.amenities = snapshot.val().amenities;
          } else {
            marker.amenities = [];
          }

          if(snapshot.exists() && snapshot.val().timeStamp){
            marker.timeStamp = snapshot.val().timeStamp;
          } else {
            marker.timeStamp = '';
          }
          //console.log("counter",counter);
          infowindow = createWindow(marker);


        });
    
        activeInfoWindow = infowindow; // keep track of the open infobox
        infowindow.open(map, this); // open the infobox

  });
  markers.push(marker); // keep track of all loaded markers
  latestMarkers.push(marker); // keep track of recent markers

  var id = urlParams.get('id');
  if(id == marker.id) { 
    //  console.log("match");
      infowindow = createWindow(marker);
      activeInfoWindow = infowindow; // keep track of the open infobox
      infowindow.open(map, marker);
  }
  return marker;
}

// Check if id exists in our list already
function placeExists(placeId,arr) {
  return arr.some(function(el) {
    return el.id === placeId;
}); 
}

// Check in button
$(document).on('click','a.checkIn',function(){

    var id = $(this).attr("data-id");
    // console.log("id",id);
    counter++;
    placeId = id;

    updateMarker(currentMarker,counter);

    $("#marker"+id).find(".checkIn").hide();
    $("#marker"+id).find(".check-in-status").show();

    /*
     database.ref("/check-ins/"+id).update({
      id: id,
      checkins: counter,
      timeStamp: new Date()
    });
    */

    return false;

});

$(document).on('click','a.checkInStatus',function(){
  var counter = 0;
  var id = $(this).attr("data-id");
  var status = $(this).attr("data-status");
  console.log("checkin"+ status);

  if(status == "empty") { counter = 1; }
  if(status == "moderate") { counter = 5; }
  if(status == "full") { counter = 10; }
  
  database.ref("/check-ins/"+id).update({
    id: id,
    checkins: counter,
    timeStamp: new Date()
  });

  $(".check-in-status").html(`<span class="thanks">Thank you!</span>`)
  return false;

});

// We update any open markers
database.ref('/check-ins/').on('child_changed', function(data) {
  updatefromDB(data);
});

// We update any open markers 
database.ref('/check-ins/').on('child_added', function(data) {
  updatefromDB(data);
});

function updatefromDB(data) {
    var amenities = [];
    var timeStamp = '';
    if(data.key){
      var counter = data.val().checkins;
      if(data.exists() && data.val().amenities){
        amenities = data.val().amenities;
      }
      if(data.exists() && data.val().timeStamp){
        timeStamp = data.val().timeStamp;
      }
      if(parseInt(counter) > 0){
        // console.log("checkins changed", data.key);
        $("#marker"+data.key).find(".checkIn").html(`Check In`);
        $("#marker"+data.key).find(".checkInStatusTime").html(`Someone just checked in!`);
      
        indexes = $.map(markers, function(obj, index) {
          if(obj.id == data.key) {
              return index;
          }
        });
        
        currentMarker = markers[indexes];
        if(currentMarker && amenities.length){ 
          currentMarker.amenities = amenities; 
          currentMarker.timeStamp = timeStamp;
        }
        if(currentMarker){ updateMarker(currentMarker,counter); }
      }
    }
}

  // This updates the color of the marker
function updateMarker(marker,checkins){

    if(marker){
      // console.log("updateMarker : loading marker"+ marker.id);
      currentMarker = marker;
    
      var colorIdx = 1;
      if(checkins >= 10){
        colorIdx = 3;
      } else if(checkins >= 5){
        colorIdx = 2;
      } else if(checkins >= 1){
        colorIdx = 1;
      }

      var color = ["#FF0000","#00FF00","#ffa500","#FF0000",];
                  
      var icon = currentMarker.getIcon();
      icon.fillColor = color[colorIdx];
      icon.strokeColor = color[colorIdx];
      colorIdx++;
      colorIdx %= color.length;
      currentMarker.setIcon(icon);
    }
}

$(document).on("click",".get-location",function(e){
    e.preventDefault();
    // console.log("get location");
    getLocation();
    return false;
});

function getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(showPosition);
    } else {
      alert("Geolocation is not supported by this browser.");
    }
}
function showPosition(position) {
    var lat = position.coords.latitude;
    var lng = position.coords.longitude;
    console.log("get coords "+lat+" "+lng);
    map.setCenter(new google.maps.LatLng(lat, lng));
}