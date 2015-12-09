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
var counterYelp = 0;
var listSearch;
var googleSearch;

var MapItem = function(name, locations, type, imageUrl, info) {
    this.name = name;
    this.locations = locations;
    this.type = type;
    this.imgUrl = imageUrl;
    this.info = info;
    this.review = "notFound";
    this.rating = "00:00:00";

    // setter for the MpItem attributes

    this.setImgUrl = function(newUrl) {
        this.imgUrl = newUrl;
    };

    this.setInfo = function(newInfo) {
        this.info = info;
    };

    this.setReview = function(newReview) {
        this.review = newReview;
    };

    this.setRating = function(newRating) {
        this.rating = newRating;
    }

};

/**
 * To String function for printing the MapItemObject
 * @returns {string}
 */
MapItem.prototype.toString = function mapItemToString() {
    var ret = 'Name: '+this.name+', locations: '+this.locations+', Type: '+this.type+ ' Image Url: '+this.imgUrl;
    return ret;
};


MapItem.prototype.updateImgUrl = function (imgUrl) {
    this.imgUrl = imgUrl;
};


function initialize() {

    listSearch = $("#list_search");
    googleSearch = $("#google_search");

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


    var request = {
        location: latLng,
        radius: '500',
        types: ["restaurant","store","museum","pub"] // restaurant
    };

    service = new google.maps.places.PlacesService(map);
    service.nearbySearch(request, callback);

    map.addListener('bounds_changed', function() {
        searchBox.setBounds(map.getBounds());
    });

    var markers = [];


    //keyup action listener
    $('#pac-input').on('keypress keyup', function(e) {
        var code = e.keyCode || e.which;
        if (code == 13) {
            e.preventDefault();
            return false;
        }else{
            if(listSearch.prop('checked')){
                searchOnMap(input.value);
            }
        }
    });

    input.onfocus = function() {
      console.log("Getting search box onfocous "+ input.value);
    };


    // go button press action listener
    $('.go_button').click(function() {

        var places = searchBox.getPlaces();

        if (places.length == 0) {
            return;
        }

        if(places.length == 1) {

            latLng = new google.maps.LatLng(places[0].geometry.location.G, places[0].geometry.location.K);
            //service.nearbySearch(mrequest, callback);
        }


        markersOuter = [];

        // clear all old markers
        //markersOuter.forEach(function(marker) {
        //    marker.setMap(null);
        //});

        // function calling for displaying searched item to the list
        processSearchEntry(places);

        var bounds = new google.maps.LatLngBounds();

        places.forEach(function(place) {

            var icon = {
                url: place.icon,
                size: new google.maps.Size(35,35),
                origin: new google.maps.Point(0, 0),
                anchor: new google.maps.Point(8, 17),
                scaledSize: new google.maps.Size(15,15)
            };


            markersOuter.push(new google.maps.Marker({
                map: map,
                //icon: icon,
                title: place.name,
                position: place.geometry.location,
                animation: google.maps.Animation.DROP,
                myIndex: markersOuter.length
            }) );
            // create marker for each place

            // binding the action listener to the markers
            //bindMarkerListener(place,map,tempMarker);

            if (place.geometry.viewport) {
                // only geocodes have view port
                bounds.union(place.geometry.viewport);
            } else {
                bounds.extend(place.geometry.location);
            }


        });

        map.fitBounds(bounds);

    });




    listSearch.change(function(){
        if(this.checked) {
            googleSearch.prop('checked',false);
            //autocomplete.unbindAll();
            google.maps.event.clearInstanceListeners(searchBox);
        }
    });

    googleSearch.change(function(){
        if(this.checked){
            listSearch.prop('checked', false);
            //google.maps.event.addListener(input);
        }
    });

}

function callback(results, status) {

    if(status === google.maps.places.PlacesServiceStatus.OK) {

        // storing on observable array
        processSearchEntry(results);
        // creating marker and storing to the arrary
        createMarker();
    }
}
function createMarker() {  //place


    // iterating each and every element of list
    for(var i=0; i<searchedItem().length;i++) {

        var items = searchedItem()[i];

        markersOuter.push( new google.maps.Marker({
            map: map,
            position: items.locations,
            animation: google.maps.Animation.DROP
        }) );
    }

    // applying custom layout to the info window
    google.maps.event.addListener(infoWindow, 'domready', function(){

        var iwOuter = $('.gm-style-iw');

        var iwBackground = iwOuter.prev();


        // Removes background shadow DIV
        iwBackground.children(':nth-child(2)').css({'display' : 'none'});

        // Removes white background DIV
        iwBackground.children(':nth-child(4)').css({'display' : 'none'});

        // Moves the infowindow 115px to the right.
        //iwOuter.parent().parent().css({left: '115px'});

        // Moves the shadow of the arrow 76px to the left margin.
        //iwBackground.children(':nth-child(1)').attr('style', function(i,s){ return s + 'left: 76px !important;'});

        // Moves the arrow 76px to the left margin.
        //iwBackground.children(':nth-child(3)').attr('style', function(i,s){ return s + 'left: 76px !important;'});

        // Changes the desired tail shadow color.
        //iwBackground.children(':nth-child(3)').find('div').children().css({'box-shadow': 'rgba(72, 181, 233, 0.6) 0px 1px 6px', 'z-index' : '1'});

        // Reference to the div that groups the close button elements.
        var iwCloseBtn = iwOuter.next();

        // Apply the desired effect to the close button
        iwCloseBtn.css({opacity: '1', right: '38px', top: '3px', border: '7px solid #48b5e9', 'border-radius': '13px', 'box-shadow': '0 0 5px #3990B9'});

        //if($('.info_content').height() < 140){
        //    $('.iw-bottom-gradient').css({display: 'none'});
        //}

        iwCloseBtn.mouseout(function(){
            $(this).css({opacity: '0.5'});
        });


    });





}


/**
 * Function for binding the marker and its info window
 */
function bindMarkerListener(place, map, marker) {

    google.maps.event.addListener(marker, 'click', function(){
        infoWindow.setContent(place.name);
        infoWindow.open(map, marker);

    });
}
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

        // setting rating value
        item.setRating(tempItem.rating);

        // inserting searhes item to list
        searchedItem.push(item);

        // searching content of info window asynchronously

        // flicker search for image
        searchFlickr(searchedItem()[i]);
        // yelp search for review
        yelpBusinessSearch(searchedItem()[i]);
        searchWikipedia(searchedItem()[i])
    }

    addListListener();

}
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
        searchedItem((tempObs().slice()));
        addListListener();
    }


}
/**
 * Function for adding action listener on each marker
 * @param name name to display on infowindow
 * @param marker marker object of location
 */

function addMarkerSearch(name, marker, imgurl, info, item) {

    google.maps.event.addListener(marker, 'click',function(){
        // adding bouncing animation to marker
        toggleBounce(marker);
        console.log("Marker "+marker);
        // adding info content to the marker
        infoWindow.setContent(setInfoWindowContent(name, imgurl, info, item));
        infoWindow.open(map, marker);
        // setting time out for marker
        //setTimeout(toggleBounce, 1500, marker);
        setTimeout(function(){ toggleBounce(marker);}, 1500);

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

}
var viewModel = new ViewModel();
ko.applyBindings(viewModel,  document.getElementById('marker_list'));

// Sets the map on all markers in the array.
function setMapOnAll(map) {
    for (var i = 0; i < markersOuter.length; i++) {
        markersOuter[i].setMap(map);
    }
}
// clear markers
function clearMarkers() {
    setMapOnAll(null);
}
// delete all markers
function deleteMarkers() {
    clearMarkers();
}

// initialize the infowindow

//var infoWindow = new google.maps.infoWindow({
//    content: infoWindowContent,
//    maxWidth: 300
//});

function setInfoWindowContent(name, imgurl, info, item) {
    var link;
    // creating review link
    if(item.review !== "#"){
        link = '<a href= '+item.review+' target="_blank">'+'Review</a>';
    }else {
        link = "#";
    }

    var content = '<div id="info_container">' +
        '<div class="content_title">' +name+ '</div>'+
        '<div class="info_content"> '+
        '<div id="p_content">' +
        'Type  : '+ item.type+ '<br>'+
         'Review : '+link +'<br>'+
         'Rating : '+item.rating+
        '</div>' +
        '<div id="image_content">' + '<img src='+imgurl+'/>'+ '</div>'+
        '</div>'+
        '</div>';
    return content;
}

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
            counterMarker('wikipedia');
            clearTimeout(wikiRequestTimeout);
        }
    });


}
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

    //console.log("pos "+pos);
    // ,toggleBounce(markersOuter[pos])

    google.maps.event.trigger(markersOuter[pos],'click');

}

function toggleBounce(mMarker) {

    if (mMarker.getAnimation() !== null) {
        mMarker.setAnimation(null);
    } else {
        mMarker.setAnimation(google.maps.Animation.BOUNCE);
    }
}


function addListListener() {

    $("#marker_list li").click(function() {

        handleListClicked($(this).text(), $(this).index());
    });
}

function disableOnEnterPress() {

    $('#pac-input').on('keyup keypress', function(e) {
        var code = e.keyCode || e.which;
        if (code == 13) {
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


/**
 * Function for inserting searched item image and review
 * @param calledFunction is a string associates with searched type
 */

function counterMarker(functionName) {


    if(functionName === 'flickr') {
        counterFlickr++;
    } else if(functionName === 'wikipedia') {
        counterWiki++;
    } else if(functionName === 'yelp') {
        counterYelp++;
    }
    //counterWiki == searchedItem().length &&

    if(counterFlickr == searchedItem().length &&

        counterYelp == searchedItem().length) {

        for(var i=0; i<searchedItem().length;i++) {
            var items = searchedItem()[i];

            // adding info content
            addMarkerSearch(items.name,markersOuter[i],items.imgUrl, items.info, items);
        }
        counterFlickr = 0;
        counterWiki = 0;
        counterYelp = 0;
    }
}




function yelpBusinessSearch(bussiness) {


    // need a way to hiding consumer key and token

    var consumer_key = "n7Xp4IsnMZLAVuuyVjz-hA";
    var consumer_secret = "KUbgJZlaNi69BKOVII5iI-QC-aI";
    var token = "RB_d80kXSa3sHeiEW7_tBBH2-DAfp572";
    var token_secret = "60tGsaUF8Sn4jDy4vI4ySYxn5yU";
    var YELP_BASE_URL ='https://api.yelp.com/v2/business/'; // search /?location=
    var src = bussiness.name.replace(/ /g, "-")+'-london';//'city-arms-coventry';//

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
        crossDomain: true,
        statusCode: {
            400 : function(xhr) {
                console.log("400 catch");
            }
        },
        success: function(results) {
            // Do stuff with results
            bussiness.setReview(results.mobile_url);
            counterMarker('yelp');
        },

        error: function() {
            // Do stuff on fail
        } ,

    };




    try {
        // if fail call the counter
        $.ajax(settings).fail( function(jqXHR, textStatus, errorThrown) {
            counterMarker('yelp');
            bussiness.setReview("#");
        });

    } catch(err) {
        console.log(" error "+err);
    }
}

