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
var counterWiki = 0;
var counterFlickr = 0;


var MapItem = function(name, locations, type, imageUrl, info) {
    this.name = name;
    this.locations = locations;
    this.type = type;
    this.imgUrl = imageUrl;
    this.info = info;

    this.setImgUrl = function(newUrl) {
        this.imgUrl = newUrl;
    }

    this.setInfo = function(newInfo) {
        this.info = info;
    }

}

/**
 * To String function for printing the MapItemObject
 * @returns {string}
 */
MapItem.prototype.toString = function mapItemToString() {
    var ret = 'Name: '+this.name+', locations: '+this.locations+', Type: '+this.type+ ' Image Url: '+this.imgUrl;
    return ret;
}


MapItem.prototype.updateImgUrl = function (imgUrl) {
    this.imgUrl = imgUrl;
}


function initialize() {

    // longitude and latitude of the initial location kathmandu;
    // london long  lat 51.501049, -0.026093
    latLng = new google.maps.LatLng(51.501049, -0.026093);
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
    var input = document.getElementById("pac-input");

    // serch box object
    searchBox = new google.maps.places.SearchBox(input);

    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

    //map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);



    var request = {
        location: latLng,
        radius: '500',
        types: ["restaurant","store","museum","pub"] // restaurant
    };

    service = new google.maps.places.PlacesService(map);
    service.nearbySearch(request, callback);


    //google.maps.event.addListener(map, 'dragend', function(){ alert('map dragged');});

    map.addListener('bounds_changed', function() {
        searchBox.setBounds(map.getBounds());
    });

    var markers = [];


    //keyup
    $('#pac-input').on('keypress keyup', function(e) {
        var code = e.keyCode || e.which;
        if (code == 13) {
            console.log(" enter pressed");
            e.preventDefault();
            return false;
        }else {
            searchOnMap(input.value);
        }
    });

    input.onfocus = function() {
      console.log("Getting search box onfocous "+ input.value);
    };



    $('.go_button').click(function() {
        var places = searchBox.getPlaces();
        //console.log(" places "+JSON.stringify(places));

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
        }

        // function calling for displaying searched item to the list
        processSearchEntry(places);

        // clear out the old markers
        markersOuter.forEach(function(marker) {
            marker.setMap(null);
        });

        markersOuter = [];

        var bounds = new google.maps.LatLngBounds();
        var tempMarker;
        var temInfoWin = new google.maps.InfoWindow();

        places.forEach(function(place) {

            var icon = {
                url: place.icon,
                size: new google.maps.Size(71,71),
                origin: new google.maps.Point(0, 0),
                anchor: new google.maps.Point(17, 34),
                scaledSize: new google.maps.Size(25,25)
            };

            tempMarker = new google.maps.Marker({
                map: map,
                icon: icon,
                title: place.name,
                position: place.geometry.location,
                myIndex: markersOuter.length
            });
            // create marker for each place



            // binding the action listener to the markers
            bindMarkerListener(place,map,tempMarker);

            //google.maps.event.addListener(tempMarker, 'click', function(){
            //    infoWindow.setContent(place.name)
            //    infoWindow.open(map, tempMarker);
            //
            //});

            if (place.geometry.viewport) {
                // only geocodes have view port
                bounds.union(place.geometry.viewport);
            } else {
                bounds.extend(place.geometry.location);
            }

            markersOuter.push(tempMarker);
        });

        map.fitBounds(bounds);

    });
    //processYelp(); // processing yelp
    yelpBusinessSearch();

}

function callback(results, status) {

    if(status === google.maps.places.PlacesServiceStatus.OK) {

        // storing on observable array
        processSearchEntry(results);
        // creating marker and storing to the arrary
        createMarker();
    }
};

function createMarker() {  //place

    // iterating each and every element of list
    for(var i=0; i<searchedItem().length;i++) {
        var items = searchedItem()[i];
        var marker = new google.maps.Marker({
            map: map,
            position: items.locations
        });

        markersOuter.push(marker);

        //addMarkerSearch(items.name,marker,items.imgUrl, items.info);

    }

    console.log(" Inside marker called "+ searchedItem()[0]);
};
/**
 * Function for binding the marker and its info window
 */
function bindMarkerListener(place, map, marker) {

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

    searchedItem.removeAll();

    // iterating through the avaliable places
    for(var i=0; i<searchValue.length;i++) {

        var tempItem = searchValue[i];
        var item = new MapItem(tempItem.name, new google.maps.LatLng(tempItem.geometry.location.lat(),
                tempItem.geometry.location.lng()),
                tempItem.types[0], "kk", "default" );
        searchedItem.push(item) ;
        //searchFlickr(searchedItem()[i]);
        yelpBusinessSearch(searchedItem()[i])
        searchWikipedia(searchedItem()[i])
    }

    addListListener();

};


function searchOnMap(searchText) {
    deleteMarkers();
    var mName;
    var marker;
    var imUrl;
    var tempObs = ko.observableArray();
    var info;

    //console.log("searchedItem() "+ searchedItem()[0].toString());
    for(var i=0; i<searchedItem().length;i++) {

        if( searchText.length > 1 && searchedItem()[i].name.toLowerCase().startsWith(searchText.toLowerCase())) {

           var items = searchedItem()[i].locations;
            //check location things
            mName = searchedItem()[i].name;
            imUrl = searchedItem()[i].imgUrl;
            info = searchedItem()[i].info;
            map.setCenter(searchedItem()[i].locations);
            marker = new google.maps.Marker({
                map: map,
                position: searchedItem()[i].locations
            });

            markersOuter.push(marker);
            addMarkerSearch(mName,marker,imUrl, info);
            //deleteMarkers();
            tempObs.push(searchedItem()[i]);

        }

    }

    if(tempObs().length > 0) {

        searchedItem.removeAll();
        searchedItem((tempObs().slice()));//= tempObs;
        addListListener();
    }


};

/**
 * Function for adding action listener on each marker
 * @param name name to display on infowindow
 * @param marker marker object of location
 */

function addMarkerSearch(name, marker, imgurl, info) {

    google.maps.event.addListener(marker, 'click', function() {
        infoWindow.setContent(setInfoWindowContent(name, imgurl, info));
        //searchWikipedia(name);
        infoWindow.open(map, marker);
    });

}
/**
 * View Model Implementation of the knockout js
 * @constructor
 */
function ViewModel() {
    var self = this;
    self.name = "Searched Location";
    self.getName = function(){
        return "Current <em> "+ self.name +"</em>!";
    };
    self.sItem = searchedItem;
    //disableOnEnterPress();

};

var viewModel = new ViewModel();
ko.applyBindings(viewModel,  document.getElementById('marker_list'));

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

function setInfoWindowContent(name, imgurl, info) {
   // var tt= searchFlickr(name);

    var kk = '<div class="info_content">' +
        '<h3> '+name+' </h3>' +
        '<img src='+imgurl+'/>'+
        '<p>'+info+'</p>'+
        '</div>';

    return kk;
}
// ajax loading of info to the info window on marker



// testing with wikipedia
function searchWikipedia(placeName) {

    var wikiUrl = 'https://en.wikipedia.org/w/api.php?action=opensearch&'+
        'search=' + placeName.name + '&format=json&callback=wikiCallback';

    var wikiRequestTimeout = setTimeout(function(){

    }, 8000);
    $.ajax({
        url:wikiUrl,
        dataType: 'jsonp',
        type: 'GET',
        contentType: "application/json; charset=utf-8",
        success: function(data, status, xhr) {
            //console.log("Data "+data);
            var articleList = data[0];
            var url = 'http://en.wikipedia.org/wiki/'+articleList;
            placeName.info = url;
            //console.log(("wiki url "+url));
            counterMarker('wikipedia');
                //$wikiElem.append('<li><a href="'+url+'" >' +
                //articleStr + '</a></li>');
            clearTimeout(wikiRequestTimeout);
        }
    });


};


// flickr


function searchFlickr(searchItem) {

    //var Flickurl = "https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=8ff629a31a05d902a75b1d86d9b05730&";
    var flickrUrl = 'https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=8ff629a31a05d902a75b1d86d9b05730&tags='
        +searchItem.name+'&per_page=1&format=json';
    var result;


        $.ajax({
            url: flickrUrl,
            dataType: 'jsonp',
            jsonp: 'jsoncallback',
            type: 'GET',
            contentType: "application/json; charset=utf-8" ,
            success: function(data, status, xhr) {

                var articleList = data[0];
                //clearTimeout(wikiRequestTimeout);
                if(data.photos.photo.length > 0) {

                    result = 'https://farm'+data.photos.photo[0].farm+'.staticflickr.com/'+data.photos.photo[0].server+
                    '/'+data.photos.photo[0].id+'_'+data.photos.photo[0].secret+'_t.jpg';
                     //searchItem.setImgUrl(result);
                     searchItem.imgUrl = result;

                } else {

                    result = "img/rsz_photo_not_available1.png";
                    searchItem.imgUrl = result;

                }

                counterMarker('flickr');

            },
            error: function(request, error) {

            }
        });

    return result;
}

// handling list click

function handleListClicked(clickedItem, position) {

    var item = searchedItem()[position];
    var len = markersOuter.length;

    var pos = -1;
    while(len-- ) {

        if((markersOuter[len].position.lat() == item.locations.lat()) &&
            (markersOuter[len].position.lng() == item.locations.lng() )) {

            pos = len;
            break;
        }
    }

    if(pos === -1) {
        pos = 0;
    }

    google.maps.event.trigger(markersOuter[pos],'click');

}


function addListListener() {
    $("#marker_list li").click(function() {
        //console.log("clicked on list");
        handleListClicked($(this).text(), $(this).index());
    });
}

function disableOnEnterPress() {

    $('#pac-input').on('keyup keypress', function(e) {
        var code = e.keyCode || e.which;
        if (code == 13) {
            console.log(" enter pressed");
            e.preventDefault();
            return false;
        }
    });
}

function loadButton() {
    $('.go_button').onclick()
}


function nonce_generate() {
    return (Math.floor(Math.random() * 1e12).toString());
}

// yelp access with oauth

function processYelp() {

    // need a way to hiding consumer key and token

    var consumer_key = "n7Xp4IsnMZLAVuuyVjz-hA";
    var consumer_secret = "KUbgJZlaNi69BKOVII5iI-QC-aI";
    var token = "RB_d80kXSa3sHeiEW7_tBBH2-DAfp572";
    var token_secret = "60tGsaUF8Sn4jDy4vI4ySYxn5yU";
    var YELP_BASE_URL = 'https://api.yelp.com/v2/search'; // search /?location=
    var src = 'San Francisco';

    var yelp_url = YELP_BASE_URL;//+ self.selected_place().Yelp.business_id;

    var parameters = {
        oauth_consumer_key: consumer_key,
        oauth_token: token,
        oauth_nonce: nonce_generate(),
        oauth_timestamp: Math.floor(Date.now()/1000),
        oauth_signature_method: 'HMAC-SHA1',
        oauth_version : '1.0',
        callback: 'cb',              // This is crucial to include for jsonp implementation in AJAX or else the oauth-signature will be wrong.
        location: 'coventry',
        term: 'cafe'

    };

    var encodedSignature = oauthSignature.generate('GET',yelp_url, parameters, consumer_secret,token_secret);
    parameters.oauth_signature = encodedSignature;

    var settings = {
        url: yelp_url,
        data: parameters,
        cache: true,                // This is crucial to include as well to prevent jQuery from adding on a cache-buster parameter "_=23489489749837", invalidating our oauth-signature
        dataType: 'jsonp',
        success: function(results) {
            // Do stuff with results
            //console.log("success "+ JSON.stringify(results));
        },
        error: function() {
            // Do stuff on fail
        }
    };

    // Send AJAX query via jQuery library.
    $.ajax(settings);

}


function counterMarker(calledFunction) {


    if(calledFunction === 'flickr') {
        counterFlickr++;
    } else if(calledFunction === 'wikipedia') {
        counterWiki++;
    }

    if(counterFlickr == searchedItem().length &&
        counterWiki == searchedItem().length) {

        for(var i=0; i<searchedItem().length;i++) {
            var items = searchedItem()[i];
            addMarkerSearch(items.name,markersOuter[i],items.imgUrl, items.info);
        }

        counterFlickr = 0;
        counterWiki = 0;
    }
}



function yelpBusinessSearch(bussiness) {


    // need a way to hiding consumer key and token

    var consumer_key = "n7Xp4IsnMZLAVuuyVjz-hA";
    var consumer_secret = "KUbgJZlaNi69BKOVII5iI-QC-aI";
    var token = "RB_d80kXSa3sHeiEW7_tBBH2-DAfp572";
    var token_secret = "60tGsaUF8Sn4jDy4vI4ySYxn5yU";
    var YELP_BASE_URL ='https://api.yelp.com/v2/business/'; // search /?location=
    var src = bussiness.name+'-london';//'city-arms-coventry';//

    var yelp_url = YELP_BASE_URL+src;//+ self.selected_place().Yelp.business_id;

    var parameters = {
        oauth_consumer_key: consumer_key,
        oauth_token: token,
        oauth_nonce: nonce_generate(),
        oauth_timestamp: Math.floor(Date.now()/1000),
        oauth_signature_method: 'HMAC-SHA1',
        oauth_version : '1.0',
        callback: 'cb'             // This is crucial to include for jsonp implementation in AJAX or else the oauth-signature will be wrong.

    };

    var encodedSignature = oauthSignature.generate('GET',yelp_url, parameters, consumer_secret,token_secret);
    parameters.oauth_signature = encodedSignature;

    var settings = {
        url: yelp_url,
        data: parameters,
        cache: true,                // This is crucial to include as well to prevent jQuery from adding on a cache-buster parameter "_=23489489749837", invalidating our oauth-signature
        dataType: 'jsonp',
        success: function(results) {
            // Do stuff with results
            //console.log("success "+ JSON.stringify(results));
            console.log(" --- - "+results.mobile_url);
        },
        error: function() {
            // Do stuff on fail
        }
    };

    // Send AJAX query via jQuery library.
    $.ajax(settings);
}

