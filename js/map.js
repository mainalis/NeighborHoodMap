/**
 * Created by sushilmainali on 31/08/15.
 */


var map;
var service;
var infoWindow;
var latLng ;
var searchBox;
var searchedItem = ko.observableArray();
var markersOuter = [];

/**
 * Class to hold the searched Item
 * @param name is name of the searche item
 * @param location the location of the place
 * @param type  point of interest
 * @constructor
 */
var MapItem = function(name, locations, type, imgUrl) {
    this.name = name;
    this.locations = locations;
    this.type = type;
    this.imgUrl = imgUrl;

}

MapItem.prototype.toString = function mapItemToString() {
    var ret = 'Name: '+this.name+', locations: '+this.locations+', Type: '+this.type+ ' Imag Url: '+this.imgUrl;
    return ret;
}


function initialize() {

    // longitude and latitude of the initial location kathmandu;
    latLng = new google.maps.LatLng(27.717245, 85.323961);
    infoWindow = new google.maps.InfoWindow();
    var mapOptions = {
        center: latLng,
        zoom: 16,
        backgroundColor: "#ff0000"
    };

    var drag = function() {
        console.log(" Drag is detected");
    };

    // searchBox adding
    var input = document.getElementById("pac-input")
    //var optionsSearch = google.maps.places.TextSearchRequest();

    // serch box object
    searchBox = new google.maps.places.SearchBox(input);

    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

    //map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);


    var marker = new google.maps.Marker({
        position: latLng,
        title: 'Point A',
        label: "SUSHIL MAINALI",
        map: map,
        draggable: true
    });

    var request = {
        location: latLng,
        radius: '1000',
        types: ["restaurant","store","museum","pub"] // restaurant
    };

    service = new google.maps.places.PlacesService(map);
    service.nearbySearch(request, callback);
    // text search

    // service.textSearch(request, callback);

    //google.maps.event.addListener(map, 'dragend', function(){ alert('map dragged');});

    map.addListener('bounds_changed', function() {
        searchBox.setBounds(map.getBounds());
    });

    var markers = [];

    input.onfocus = function() {
      console.log("Getting search box onfocous "+ input.value);
    };

    input.onkeyup = function() {
        console.log("Onkey up "+ input.value);
        searchOnMap(input.value);
    }

    searchBox.addListener('places_changed', function() {
        console.log("searchBox.addListener "+ searchBox.value);
        var places = searchBox.getPlaces();

        // implementing ajax


        //console.log("Length of places "+places.length);
        //console.log("places "+JSON.stringify(places));

        if (places.length == 0) {
            return;
        };

        if(places.length == 1) {

            latLng = new google.maps.LatLng(places[0].geometry.location.G, places[0].geometry.location.K);
            var mrequest = {
                location: latLng,
                radius: '1000',
                types: ["restaurant", "store", "museum", "pub"] // restaurant
            };

            service.nearbySearch(mrequest, callback);
            console.log("Lat lang " + request);
        }

        // function calling for displaying searched item to the list
        processSearchEntry(places);

        // clear out the old markers
        markers.forEach(function(marker) {
            marker.setMap(null);
        });

        markers = [];

        var bounds = new google.maps.LatLngBounds();
        places.forEach(function(place) {
            var icon = {
                url: place.icon,
                size: new google.maps.Size(71,71),
                origin: new google.maps.Point(0, 0),
                anchor: new google.maps.Point(17, 34),
                scaledSize: new google.maps.Size(25,25)
            };

            // create marker for each place
            markers.push(new google.maps.Marker({
                map: map,
                icon: icon,
                title: place.name,
                position: place.geometry.location,
                myIndex: markers.length
            }));


            // binding the action listener to the markers
            bindMarkerListener(place, infoWindow,map,new google.maps.Marker({
                map: map,
                icon: icon,
                title: place.name,
                position: place.geometry.location,
                myIndex: markers.length
            }) );

            if (place.geometry.viewport) {
                // only geocodes have view port
                bounds.union(place.geometry.viewport);
            } else {
                bounds.extend(place.geometry.location);
            }
        });

        map.fitBounds(bounds);
    });

}

function callback(results, status) {
    if(status === google.maps.places.PlacesServiceStatus.OK) {

        //console.log("places "+JSON.stringify(results));
        // storing on observable array
        processSearchEntry(results);
        for (var i = 0; i < results.length; i++) {

            createMarker(results[i]);
        }

    }
};

function createMarker(place) {

    var marker = new google.maps.Marker({
        map: map,
        position: place.geometry.location
    });

    markersOuter.push(marker);

    google.maps.event.addListener(marker, 'click', function() {
        infoWindow.setContent(place.name);
        infoWindow.open(map, marker);
    });
};
/**
 * Function for binding the marker and its info window
 */
function bindMarkerListener(place,infoWindow, map, marker) {
    google.maps.event.addListener(marker, 'click', function(){
        infoWindow.setContent(place.name)
        infoWindow.open(map, marker);

    });
};
//google.maps.event.addDomListener(window, 'load', initialize);
/**
 * Function for processing the search content of the map
 * @param searchValue
 */
function processSearchEntry(searchValue) {
    // removing item from the observable list
    // clearing knocokout observable list
    console.log("process search entry called ");
    searchedItem.removeAll();

    // iterating through the avaliable places
    for(var i=0; i<searchValue.length;i++) {
        var tempItem = searchValue[i];
        //console.log(i+" "+ " TYPES "+ tempItem.geometry.location.L );

        // the information that can be extracted from the places search are
           // name of place : tempItem.name
           // rating associated: tempItem.rating
        // location tempItem.geometry.location.G   tempItem.geometry.location.K
        // types ---> tempItem.types[0] to tempItem.types[4]
        searchedItem.push( new MapItem(tempItem.name, new google.maps.LatLng(tempItem.geometry.location.H,tempItem.geometry.location.L), tempItem.types[0]), searchFlickr(tempItem.name));
    }

};


function searchOnMap(searchText) {
    deleteMarkers();
    var mName;
    var marker;
    console.log("searchedItem() "+ searchedItem()[0].toString());
    for(var i=0; i<searchedItem().length;i++) {

        if( searchText.length > 1 && searchedItem()[i].name.startsWith(searchText)) {
           var items = searchedItem()[i].locations;
            //console.log("Searched item "+ items);
           //console.log("££££££ " + searchedItem()[i].name);
           //console.log("###### "+searchedItem()[i].location);
            //check location things
            //deleteMarkers();
            mName = searchedItem()[i].name;
            map.setCenter(searchedItem()[i].locations);
            marker = new google.maps.Marker({
                map: map,
                position: searchedItem()[i].locations
            });

            markersOuter.push(marker);
            addMarkerSearch(name,marker);
            //deleteMarkers();

        }

    }


};

/**
 * Function for adding action listener on each marker
 * @param name name to display on infowindow
 * @param marker marker object of location
 */

function addMarkerSearch(name, marker, imgurl) {
    google.maps.event.addListener(marker, 'click', function() {
        //infoWindow.setContent(name);
        infoWindow.setContent(setInfoWindowContent(name, imgurl));
        searchWikipedia(name);
        infoWindow.open(map, marker);
    });

}
/**
 * View Model Implementation of the knockout js
 * @constructor
 */
function ViewModel() {
    var self = this;

    self.name = "sushil mainali";
    self.getName = function(){
        return "Hello <em> "+ self.name +"</em>!";
    };
    self.sItem = searchedItem;

};

var viewModel = new ViewModel();
ko.applyBindings(viewModel);

// Sets the map on all markers in the array.
function setMapOnAll(map) {
    for (var i = 0; i < markersOuter.length; i++) {
        markersOuter[i].setMap(map);
    }
};

// clear markers
function clearMarkers() {
    setMapOnAll(null);
};

// delete all markers
function deleteMarkers() {
    clearMarkers();
    //markers = [];
};



// display helper for the map infowindow

var infoWindowContent = '<div class="info_content">' +
        '<h3> content </h3>' +
        '<p>Info goes here </p>'+
        '</div>';

// initialize the infowindow

var infoWindow = new google.maps.infoWindow({
    content: infoWindowContent
});

function setInfoWindowContent(name, imgurl) {
   // var tt= searchFlickr(name);

    var kk = '<div class="info_content">' +
        '<h3> '+name+' </h3>' +
        '<img src='+imgurl+'/>'+
        '<p>Info goes here </p>'+
        '</div>';

    return kk;
}
// ajax loading of info to the info window on marker

        // testing with wikipedia



function searchWikipedia(placeName) {

    var wikiUrl = 'https://en.wikipedia.org/w/api.php?action=opensearch&'+
        'search='+placeName+'&format=json&callback=wikiCallback';
    var wikiRequestTimeout = setTimeout(function(){

        //$wikiElem.text("Failed to get wikipedia resources");
        console.log("Info not available");
    }, 8000);
    $.ajax({
        url:wikiUrl,
        dataType: 'jsonp',
        type: 'GET',
        contentType: "application/json; charset=utf-8",
        success: function(data, status, xhr) {
            console.log("Data "+data);
            var articleList = data[0];
            for(var i=0; i< articleList.length; i++) {
                var articleStr = articleList[i];
                //console.log(" Value of the ajax "+ articleStr)
                var url = 'http://en.wikipedia.org/wiki/'+articleStr;
                //$wikiElem.append('<li><a href="'+url+'" >' +
                //articleStr + '</a></li>');
            }
            clearTimeout(wikiRequestTimeout);
        }
    });

    // https://en.wikipedia.org/w/api.php?action=opensearch&+
    //search="Nanglo Bakery"&format=json&callback=wikiCallback



};


// flickr


function searchFlickr(searchItem) {

    // 8ff629a31a05d902a75b1d86d9b05730

    // 007e580136c66440
    //var Flickurl = "https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=8ff629a31a05d902a75b1d86d9b05730&";
    var flickrUrl = 'https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=8ff629a31a05d902a75b1d86d9b05730&tags='+searchItem+'&per_page=1&format=json';
    var result;


        $.ajax({
            url: flickrUrl,
            dataType: 'jsonp',
            jsonp: 'jsoncallback',
            type: 'GET',
            contentType: "application/json; charset=utf-8" ,
            success: function(data, status, xhr) {
                console.log("Data "+JSON.stringify(data));
                var articleList = data[0];
                //for(var i=0; i< articleList.length; i++) {
                //    var articleStr = articleList[i];
                //    console.log(" Value of the ajax "+ articleStr)
                //    var url = 'http://en.wikipedia.org/wiki/'+articleStr;
                //    //$wikiElem.append('<li><a href="'+url+'" >' +
                //    //articleStr + '</a></li>');
                //}
                //clearTimeout(wikiRequestTimeout);
                if(data.length > 0) {
                    result = 'https://farm'+data.photos.photo[0].farm+'.staticflickr.com/'+data.photos.photo[0].server+
                    '/'+data.photos.photo[0].id+'_'+data.photos.photo[0].secret+'_t.jpg';
                    console.log("http "+result);
                } else {
                    result = "";
                    console.log("££££££ "+ "zero");
                }


            }
        });
    return result;
}