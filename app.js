/* app.js is where the ViewModel object connecting the view (index.html) and the model(s)through the knockout framework is stored */var ViewModel = {	self: this,	map: {}, // Created map as a global variable to be able to access and modify it later on	address: ko.observable(''), // Observable value to save the real-time value of the Address Search textBox	formattedAddress: ko.observable(''), // Observable value to display the formatted address of each research	suggestionList: ko.observableArray(), // Observable array to store the list of suggestion from 4Square	locationConfirm: ko.observable('not set'),	errorStatus: 'Sorry, the address couldn\'t be found due to ', // Stores a standard error status	markerList: [],	displayOrHideTransit: ko.observable('Display Transit Options (if available)'), // Observable value changing when the user displays or hides transit option	transitLayerActive: ko.observable(false),	infoWindow: {}, // Initiates one global infowindow variable	/* Function initializing the map once the Google Maps API script finished loading	also specifies the DOM element to which the map will be attached */	initMap: function() {	  map = new google.maps.Map(document.getElementById('map-container'), {			center: {lat: -34.39, lng: 150.64},			zoom: 8		});	  // initiates the global infoWindow with the map		infoWindow = new google.maps.InfoWindow();		// Allow autocomplete for the input search box with the id 'address'		var autocomplete = new google.maps.places.Autocomplete(document.getElementById('address'),{types:['geocode']});	},	// Function updating the map when user enters its input (address)	updateMap: function() {		// next two lines reset the suggestionList and hides the locationConfirm buttons		ViewModel.locationConfirm('not set');		ViewModel.suggestionList.removeAll();		// creates a geocoder to retrieve lat/lng of string-type address		var geocoder = new google.maps.Geocoder();		// obtains the geocode of the user input		geocoder.geocode({address: ViewModel.address()}, function(results, status) {			if (status === google.maps.GeocoderStatus.OK) {				if (results[0]) {					// centers the map with geocode results			  	map.setCenter(results[0].geometry.location);			  	map.setZoom(14);			  	// Updates the formattedAddress binding			  	ViewModel.formattedAddress(results[0].formatted_address);			  	// captures formatted values of lat & lng coordinates and Address for API uses			  	var Address = results[0].formatted_address;			  	var Lat = results[0].geometry.location.lat();			  	var Lng = results[0].geometry.location.lng();			  	// passes lat & lng parameters to update the list of suggestion			  	ViewModel.updateWalkScore(Lat, Lng, Address);			  	ViewModel.updateSuggestionList(Lat, Lng);				};			} else {				// alerts user that an error occured while searching for input				ViewModel.formattedAddress(ViewModel.errorStatus + status);			};		});	},	getTransitOptions: function() {		// displays or hides transit options if available		if (ViewModel.transitLayerActive() === false) {			// if the transitLayer isn't active, creates a global variable to be toggled			transitLayer = new google.maps.TransitLayer();			transitLayer.setMap(map);			ViewModel.transitLayerActive(true);			// changes the message on the button			ViewModel.displayOrHideTransit('Hide Transit Options');		} else {			transitLayer.setMap(null);			ViewModel.transitLayerActive(false);			ViewModel.displayOrHideTransit('Display Transit Options (if available)');		};	},	updateWalkScore: function(lat, lng, address) {		var WalkscoreAPIKey = '6add8e94aa58a6ee9aec87efbf933652';		var WalkscoreAPIRequest = 'http://api.walkscore.com/score?format=json&address=' + address + '&lat=' +		lat + '&lng=' + lng + '&wsapikey=' + WalkscoreAPIKey;		$.ajax({			url: WalkscoreAPIRequest,			dataType: "jsonp",			success: function(json) {				console.log(json);			},			error: function(request, status) {				alert(status);			}		});	},	updateSuggestionList: function(lat, lng) {		var fourSquareAuthToken = 'oauth_token=MKBPLNIJAWXXU1E1KGV5NHEUNZD5GCCZX5ETXKEPCBMXPKJ0&v=20161111';		// takes the formatted_address parameter and builds a valid foursquare ajax request url		var fourSquareAjaxUrl = 'https://api.foursquare.com/v2/venues/explore?ll=' + lat +  ',' + lng +		'&' + fourSquareAuthToken;		// requests a listing of suggestions from Foursquare API		$.ajax(fourSquareAjaxUrl, {			success: function(responseObject, status) {				if (status === 'success') {					for (var i = 0; i < responseObject.response.groups[0].items.length; i++) {						ViewModel.suggestionList.push(responseObject.response.groups[0].items[i]);					};				};			},			error: function(request, status) {				if (status === 'error') {					alert('there was an error with the request to the foursquare API');					console.log(request);				};			}		});	},	// function creating markers from the suggestionList formerly populated and adjusting the map's bounds	createMarkersAndFitBounds: function() {		// first sets the map of existing markers to null		ViewModel.markerList.forEach(function(place){place.setMap(null)});		// resets the list of markers		ViewModel.markerList = [];		// creates an array to store all the latlng coordinates of each marker		var bounds = new google.maps.LatLngBounds();		// repopulate list of markers with new suggestions		ViewModel.suggestionList().forEach(function(place, index) {			// stores marker specific content to be used when creating the marker			var markerContent = '<div class=\'infowindow\'>' + 								'<h3>' + place.venue.name + '</h3>' + 								'<p>' + place.venue.categories[0].name + '</p></br>';			// loops over the formattedAddress array and adds it to the markerContent			for (var i = 0; i < place.venue.location.formattedAddress.length; i++) {				markerContent += '<p>' + place.venue.location.formattedAddress[i] + '</p>'; 			};			// if the location has a url, adds it to the markerContent			if (place.venue.url != undefined) {				markerContent += '</br><a href=\'' + place.venue.url + '\'>' + place.venue.url + '</a>';			};			// closes the markerContent's div tag			markerContent += '</div>';			// transforms the place's index into a string in order to use it as label			var indexToString = (index + 1).toString();			// creates the google map marker for the place			var marker = new google.maps.Marker({				// once created the markers will drop on screen				animation: google.maps.Animation.DROP,				map: map,				label: indexToString,				content: markerContent,				position: {lat: place.venue.location.lat, lng: place.venue.location.lng}			});			// adds the marker's lat & lng coordinates to the bounds array.			// it will allow us later to fit the bounds and zoom of the map to our marker list			bounds.extend(marker.getPosition());			// Adds a global click event listener on markers to pop open the infowindow and populate it with content			google.maps.event.addListener(marker, "click", (function(marker) {				return function(evt) {			    infoWindow.setContent(marker.content);			    infoWindow.open(map, marker);			  };			})(marker));			// populates the markerList array with markers in order to be able to delete them later on			ViewModel.markerList.push(marker);		});		map.fitBounds(bounds);	},	confirmLocation: function() {		ViewModel.locationConfirm('confirmed');	},	specifyLocation: function() {		ViewModel.locationConfirm('not confirmed');	}	// use a comma here};ko.applyBindings(ViewModel);