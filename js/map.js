/**
 * Created by sushilmainali on 31/08/15.
 */

/**
 * google map refernce variable
 */
var map;

var service;
/**
 * Reference of infowindow of google map
 */
var infoWindow;
/**
 * Google longitude and latitude object of google
 */
var latLng ;
/**
 * Google search place variable referende
 */
var searchBox;

/**
 * Instance of serached item list
 * knockout observable array
 */
var searchedItem = ko.observableArray();

/**
 * model to input box
 */

var searchText = ko.observable();

/**
 * radio model
 */

var serarchType = ko.observable("local");

/**
 * Instance variable used on local search
 */
var localSearchContent = ko.observableArray();

/**
 * Array storing marker of the map
 * @type {Array}
 */
var markersOuter = [];

/**
 * Variable to store counter for number of
 *
 * @type {number}
 */
var counterWiki = 0;

/**
 * Variable to store the counter reference of
 * marker associated with flicker
 * @type {number}
 */
var counterFlickr = 0;

/**
 * Variable to store the counter reference of
 * marker associated with yelp
 * @type {number}
 */
var counterYelp = 0;

/**
 * checkbox reference for local search
 */
var listSearch;

/**
 * Google search checkbox reference
 */
var googleSearch;

/**
* Input box reference
*/
var input; 

/**
* reference variable to google geocoder object
*/
var geocoder;

/**
* Current location of yelp
**/
var yelpLocation = "-london";

/**
 * Variable to store place search from google.
 */
var places;



/**
 * Class for storing marker's information avaliable on map
 * @param name reference to name of the searched item
 * @param locations reference to longitude and latitude of marker position
 * @param type reference to the type of point of interest i.e. pu
 * @param imageUrl reference to the flickr searched image url reference
 * @param info
 * @constructor
 */

var MapItem = function(name, locations, type, imageUrl, info) {
    this.name = name;
    this.locations = locations;
    this.type = type;
    this.imgUrl = imageUrl;
    this.info = info;
    this.review = "notFound";
    this.rating = "00:00:00";

    /**
     * Setter function for new url reference
      * @param newUrl  new flickr url
     */
    this.setImgUrl = function(newUrl) {
        this.imgUrl = newUrl;
    };

    /**
     * setter function to update info field of MapItem
     * @param newInfo new info string
     */
    this.setInfo = function(newInfo) {
        this.info = newInfo;
    };

    /**
     * Setter function for storing yelp review of business
     * @param newReview review url string
     */
    this.setReview = function(newReview) {
        this.review = newReview;
    };

    /**
     * Setter function for selected marker
     * @param newRating  string to display current
     * rating of marker place
     */
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

/**
 * Function used by google map to initialize map and markers
 */
function initialize() {

    /**
     * local search reference initialize
     * @type {*|jQuery|HTMLElement}
     */
    listSearch = $("#list_search");

    /**
     * google search reference initialize
     * @type {*|jQuery|HTMLElement}
     */
    googleSearch = $("#google_search");

    /**
     * gecoding reference initalization
     * @type {google.maps.Geocoder}
     */
	geocoder = new google.maps.Geocoder;

    /**
     * google longitude and latitude object reference
     * @type {google.maps.LatLng}
     */
    latLng = new google.maps.LatLng(51.501049, -0.026093);

    /**
     * google map marker infowindo reference
     * @type {google.maps.InfoWindow}
     */
    infoWindow = new google.maps.InfoWindow();

    /**
     * Map's extra settings for centering the map
     * zooming and background color of the map
     * @type {{center: google.maps.LatLng, zoom: number, backgroundColor: string}}
     */
    var mapOptions = {
        center: latLng,
        zoom: 16,
        backgroundColor: "#ff0000"
    };

    /**
     * getting reference of input search fron html
     * @type {HTMLElement}
     */
    input = document.getElementById("pac-input");

    /**
     * Google map places searchbox object reference
     * @type {google.maps.places.SearchBox}
     */
    //searchBox = new google.maps.places.SearchBox(input);
	
	


    /**
     * Google map's  map object reference
     * @type {google.maps.Map}
     */
    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

    /**
     * Extra search  options for google place search
     * @type {{location: google.maps.LatLng, radius: string, types: string[]}}
     */
    var request = {
        location: latLng,
        radius: '500',
        types: ["restaurant","store","museum","pub"]
    };

    /**
     * Google place service reference
     * @type {google.maps.places.PlacesService}
     */
    service = new google.maps.places.PlacesService(map);

    /**
     * Google nearby search function
     */
    service.nearbySearch(request, callback);

    /**
     * adding action listener for map bounds
     * and attached it to search box
     */
  /*  map.addListener('bounds_changed', function() {
        searchBox.setBounds(map.getBounds());
    });
 */
    var markers = [];



    /**
     * Input box action listener
     */
    $('#pac-input').on('keypress keyup', function(e) {
        var code = e.keyCode || e.which;
        if (code == 13) {
            e.preventDefault();
            return false;
        }else{
            if(serarchType() == "local"){

				if(searchText().length> 0) {
					 searchOnMap(searchText());
				} else {
                     addToMap();
				}				
            }
        }
    });


}

/**
 * Function for disabling autocomplete of input box
 */
function disableGoogleAutoComplete() {
    google.maps.event.clearInstanceListeners(input);
}

/**
 * Function adding autocomplete  listener to input
 */
function enableGoogleAutoComplete() {
    searchBox = new google.maps.places.SearchBox(input);
	google.maps.event.addListener(searchBox, 'places_changed', function() {
		places = searchBox.getPlaces();
		if (places.length == 0) {
		  return;
		}

		    /**
         * calling reversGecoding to get the name of city
         * which is use in yelp  business search call
         */
		reverseGeocoding( new google.maps.LatLng(places[0].geometry.location.lat(),
                places[0].geometry.location.lng()) , function(cityLoc){
			yelpLocation = "-"+cityLoc[0].split(",")[0].toLowerCase();
        });
		
	});
}

/**
 * callback function of place services
 * @param results the available search places
 * @param status gives info about wheteher search is successfull or not
 */
function callback(results, status) {

    if(status === google.maps.places.PlacesServiceStatus.OK) {

        /**
         * Adding available result to knockout observable array
         */
        processSearchEntry(results);

        /**
         * Creating markers fron available result
         */
        createMarker();
    }
}

/**
 * Helper function of callback
 * this function creates a marker and store to
 * the array
 */
function createMarker() {
    /**
     * Iterating through the list of places
     */
    for(var i=0; i<localSearchContent().length;i++) {
        var items = localSearchContent()[i];
        markersOuter.push( new google.maps.Marker({
            map: map,
            position: items.locations,
            animation: google.maps.Animation.DROP
        }) );
    }

    // applying custom layout to the info window
    /**
     * Changing apperarance of infowindow
     */
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


/**
 * Function for processing the search content of the map
 * @param searchValue
 */
function processSearchEntry(searchValue) {

    /**
     * removing content of searchedItem
     * if there exists any
     */
    //searchedItem.removeAll();
    localSearchContent.removeAll();

    /**
     * Iterating through the content of observable list
     */
    for(var i=0; i<searchValue.length;i++) {

        var tempItem = searchValue[i];
        var item = new MapItem(tempItem.name, new google.maps.LatLng(tempItem.geometry.location.lat(),
                tempItem.geometry.location.lng()),
                tempItem.types[0], "kk", "default" );

        /**
         * setting rating to the MapItem object
         */
        item.setRating(tempItem.rating);

        /**
         * Adding MapItem object to the observable list
         */
        localSearchContent.push(item);

        /**
         * searching contents of info window
         * asynchronously
         */

        // flicker search for image
        /**
         * Searching image from flickr
         */
        searchFlickr(localSearchContent()[i]);

        /**
         * Searching business review from yelp
         */
        //yelpBusinessSearch(searchedItem()[i]);
        yelpBusinessSearch(localSearchContent()[i]);

        /**
         * Wikipedia search , this search is
         * not used in this application
         */
        //searchWikipedia(searchedItem()[i]);
        searchWikipedia(localSearchContent()[i])
    }

    /**
     * adding local list to main list
     */


    searchedItem(localSearchContent().slice());

    /**
     * adding listener to the observable list
     */
    addListListener();

}

/**
 * Function implementing functionality of local search
 * this function will search markers available on map
 * @param searchText
 */
function searchOnMap(searchText) {

	/**
	* Observable array for local search
	**/
    var tempObs = ko.observableArray();
    searchedItem.removeAll();
    searchedItem((localSearchContent().slice()));


    console.log("search on map is called "+searchText);

    /**
     * information of marker reference
     */
    var name;

    var indices = [];

    /**
     * Iterating through the available
     * list of places
     */
    for(var i=0; i<searchedItem().length;i++) {
        /**
         * checking whether searched text matched
         * the name of the available places.
         * if it match the criteria then add
         * it to the observable list
         */

        name = searchedItem()[i].name;
        if(searchText.length > 1 && name.toLowerCase().startsWith(searchText)) {
            /**
             * Adding MapItem to the observable array
             */
            tempObs.push(searchedItem()[i]);
            indices.push(i);
        }

    }
	
	

    /**
     * checking the size of searched item
     * observable array list and if it's length is
     * greater than 0 do the further processing
     */
    if(tempObs().length > 0) {

        searchedItem.removeAll();
        searchedItem((tempObs().slice()));
        /**
         * adding listener to the new observable list
         */
        addListListener();

    }

	for(var i=0; i<tempObs().length; i++) {

		var mapItem = tempObs()[i];
        markersOuter[indices[i]].setMap(map);
		map.setCenter(mapItem.locations);

	}
	
	

}
/**
 * Function for adding action listener on each marker
 * @param name name to display on info window
 * @param marker marker object of location
 */

function addMarkerSearch(name, marker, imgurl, info, item) {

    google.maps.event.addListener(marker, 'click',function(){

        /**
         * Adding bouncing animation to marker
         */
        toggleBounce(marker);

        /**
         * Adding info to the marker
         */
        infoWindow.setContent(setInfoWindowContent(name, imgurl, info, item));
        infoWindow.open(map, marker);

        /**
         * Setting time out to the toogle bounce
         */
        setTimeout(function(){ toggleBounce(marker);}, 1500);

    });

}
/**
 * View Model Implementation of the knockout js
 * @constructor
 */
function ViewModel() {
    var self = this;
    self.sItem = searchedItem;
    self.inputBox  = searchText;
    self.search = serarchType;
    self.goButtonEvent = function() {
        console.log("handle go click")
        handleGoButtonClick();
    }
}

/**
 * Creating knockoout viewmodel object
 * @type {ViewModel}
 */
var viewModel = new ViewModel();


/**
 *
 * Subscriber for observer
 */

viewModel.search.subscribe(function(newValue){


    if(newValue == 'google') {
        enableGoogleAutoComplete();
        viewModel.inputBox (" ");


    } else {

        disableGoogleAutoComplete();
        viewModel.inputBox(" ");
    }
});

/**
 * Binding view model to the DOM
 */
ko.applyBindings(viewModel); //document.getElementById('marker_list')
//ko.applyBindings({ searchText: ko.observable("ssss") });


// Sets the map on all markers in the array.
function setMapOnAll(map) {
    for (var i = 0; i < markersOuter.length; i++) {
        markersOuter[i].setMap(map);
    }
    $.each(markersOuter, function(index, val){
        val.setMap(map);
    });
}

/**
 * Clearing marker available on array
 */
function clearMarkers() {
    setMapOnAll(null);
}

/**
 * Deleting all marker on map
 */
function deleteMarkers() {
    $.each(markersOuter, function(index, val){
        val.setMap(null);
    });
}

/**
 * Setting info content to the
 * @param name
 * @param imgurl
 * @param info
 * @param item
 * @returns {string}
 */
function setInfoWindowContent(name, imgurl, info, item) {

    /**
     * Variable referencing link
     */
    var link;

    /**
     * Creating review link to the info content
     * if particular marker location has a available review on yelp
     * the add it otherwise set it to "#"
     */
    if(item.review !== "#"){
        link = '<a href= '+item.review+' target="_blank">'+'Review</a>';
    }else {
        link = "Not Available";
    }

    /**
     * content variable to display inside info content
     * of marker
     * @type {string}
     */
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

/**
 * Searching reference of marker in wikipedia
 * @param placeName name of a marker
 */
function searchWikipedia(placeName) {

    var wikiUrl = 'https://en.wikipedia.org/w/api.php?action=opensearch&'+
        'search=' + placeName.name + '&format=json&callback=wikiCallback';

    var wikiRequestTimeout = setTimeout(function(){

    }, 2000);

    $.ajax({
        url:wikiUrl,
        dataType: 'jsonp',
        type: 'GET',
        contentType: "application/json; charset=utf-8",
        success: function(data, status, xhr) {
            var articleList = data[0];
            var url = 'http://en.wikipedia.org/wiki/'+articleList;
            placeName.info = url;
            counterMarker('wikipedia');
            clearTimeout(wikiRequestTimeout);
        }
    });

}


/**
 * Searching image url of cliked marker item
 * @param searchItem
 * @returns {*}
 */
function searchFlickr(searchItem) {

    var flickrUrl = 'https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=8ff629a31a05d902a75b1d86d9b05730&tags='
        +searchItem.name+'&per_page=1&format=json';
    var result;
    var flickrRequestTimeout = setTimeout(function(){
    }, 3000);

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
                clearTimeout(flickrRequestTimeout);
            },
            error: function(request, error) {

            }
        });

    return result;
}


/**
 * marker clicked listener
 * @param clickedItem marker clicked
 * @param position the index of the marker
 */
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

    /**
     * display info content to the clicked marker
     */
    google.maps.event.trigger(markersOuter[pos],'click');

}

/**
 * marker bouncing animation
 * @param mMarker
 */
function toggleBounce(mMarker) {

    if (mMarker.getAnimation() !== null) {
        mMarker.setAnimation(null);
    } else {
        mMarker.setAnimation(google.maps.Animation.BOUNCE);
    }
}

/**
 * adding clicked listener to the observable list
 */
function addListListener() {

    $("#marker_list li").click(function() {

        handleListClicked($(this).text(), $(this).index());
    });
}

/**
 * disabling function when user press enter on input
 */
function disableOnEnterPress() {

    $('#pac-input').on('keyup keypress', function(e) {
        var code = e.keyCode || e.which;
        if (code == 13) {
            e.preventDefault();
            return false;
        }
    });
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

    if(counterFlickr == searchedItem().length &&

        counterYelp == searchedItem().length) {

        for(var i=0; i<searchedItem().length;i++) {
            var items = searchedItem()[i];

            /**
             * adding info content
             */
            addMarkerSearch(items.name,markersOuter[i],items.imgUrl, items.info, items);
        }

        counterFlickr = 0;
        counterWiki = 0;
        counterYelp = 0;
    }
}

/**
 * Searching review using yelp business search api
 * @param business the name of the bussiness to tsearch
*/
function yelpBusinessSearch(business) {

    /**
     * Need a way to hiding consumer key and token
     * yet not implemented
     * @type {string}
     */
    var consumer_key = "n7Xp4IsnMZLAVuuyVjz-hA";
    var consumer_secret = "KUbgJZlaNi69BKOVII5iI-QC-aI";
    var token = "RB_d80kXSa3sHeiEW7_tBBH2-DAfp572";
    var token_secret = "60tGsaUF8Sn4jDy4vI4ySYxn5yU";
    var YELP_BASE_URL ='https://api.yelp.com/v2/business/';
    var src = business.name.replace(/ /g, "-") +  yelpLocation.replace(/ /g, "-");
    var yelp_url = YELP_BASE_URL + src;

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
        timeout: 1000,
        success: function(results) {
            business.setReview(results.mobile_url);
            counterMarker('yelp');
        },
        complete: function(xhr, data) {
            if (xhr.status != 0)
                console.log('success');
            else
                console.log('fail');
        }

    }


        //$.ajax(settings).fail( function(jqXHR, textStatus, errorThrown) {
        //    counterMarker('yelp');
        //    business.setReview("#");
        //});

    $.ajax(settings)
        .done(function() { })
        .fail(function() {
            counterMarker('yelp');
            business.setReview("#");
        });

	
}


/**
 * Function for getting city name when
 * latitude and longitude is provided
 */
function reverseGeocoding(latLang, callB) {


    geocoder.geocode({'location': latLang}, function(results, status){

        if (status === google.maps.GeocoderStatus.OK) {
            /**
             * Instance variable for storing
             * city, country, region name
             **/
            //console.log("result "+ JSON.stringify(results));
            var cityLoc = [];
            $.each(results, function(i, val) {
                $.each(val.types, function(j, item) {
                    if(item === 'postal_town') {
                        cityLoc.push(val.formatted_address);
                        yelpLocation = "-"+val.formatted_address.split(",")[0].toLowerCase();
                    } else if(item === 'country') {
                        cityLoc.push(val.formatted_address);
                    } else if(item === 'administrative_area_level_1') {
                        cityLoc.push(val.formatted_address);
                    }
                });
            });

            /**
             *calling callback
             **/
            callB(cityLoc);
        } else {
            // handle error
        }

    });



}

/**
 * function used by local search
 * to add marker on map
 */
function addToMap() {
    searchedItem.removeAll();
    deleteMarkers();

    searchedItem((localSearchContent().slice()));

    $.each(markersOuter, function(index, val){
        val.setMap(map);
    });

    addListListener();
}


function handleGoButtonClick() {
    /**
     * getting place from entered text
     * using google map place search api
     */
    //places = searchBox.getPlaces();

    /**
     * if searched result is zero
     */
    if (places.length == 0) { //typeof(places) == 'undefined' ||
        return;
    }

    /**
     * if searched place length is 1
     */
    if(places.length == 1) {

        latLng = new google.maps.LatLng(places[0].geometry.location.G, places[0].geometry.location.K);
        //service.nearbySearch(mrequest, callback);
    }

    /**
     * clearing array holding markers
     * @type {Array}
     */
    markersOuter = [];


    /**
     * calling processSearchEntry to adding
     * searched item to the list
     */
    processSearchEntry(places);

    /**
     * Getting bounds to the map
     * @type {google.maps.LatLngBounds}
     */
    var bounds = new google.maps.LatLngBounds();

    /**
     * Iterating through avaliable searched item
     * and adding it to the markersOuter array
     */
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


        if (place.geometry.viewport) {
            // only geocodes have view port
            bounds.union(place.geometry.viewport);
        } else {
            bounds.extend(place.geometry.location);
        }

    });

    map.fitBounds(bounds);
}


