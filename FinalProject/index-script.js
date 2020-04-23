/*
 * Katie James
 * Coffee Crawl
 * Home Page Script
 * CSIS 304 Final Project
 */

$(document).ready(getJSONData);

/***************** LOAD MAPBOX MAP WITH LOCATIONS *****************/
/* Function to get and return the coffee shop JSON data */
function getJSONData() {
    $.ajax({
        type: "GET",
        crossDomain: true,
        url: "data.json",
        dataType: "json",
        success: function(data) {
            console.log("success!");
            loadPage(data);
        }
        
    });
}

function loadPage(data) {
    console.log("reached loadpage function");
    var coffeeShopList = data.features;
    console.log(coffeeShopList);
    mapboxgl.accessToken = "pk.eyJ1Ijoia2phbWVzMTciLCJhIjoiY2s4cndtOTVyMDJ1dDNlcGFueWMwYWR1NiJ9.pxxSphkpk-gqZpsTxthRFg";

    //create new map object
    var map = new mapboxgl.Map({
        container: "map",
        style: "mapbox://styles/mapbox/light-v10",
        center: [-122.6750, 45.5051],
        zoom: 12
    });

    //assign unique id to each coffee shop
    $.each(coffeeShopList, function(i, store) {
        store.properties.id = i;
    });

    //load map
    map.on("load", function(e) {
        //add data to map as a layer
        map.addLayer({
            "id": "locations",
            "type": "symbol",
            "source": {
                "type" : "geojson",
                "data": data
            },
            "layout": {
                //TODO change icon image
                "icon-image": "cafe-15",
                "icon-size": 1.4,
                "icon-allow-overlap": true
            }
        });
        displayLocationList(data);
    });

    /***************** POPUPS ON HOVER *****************/
    var popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false
    });

    map.on("mouseenter", "locations", function(e) {
        //change cursor to pointer
        map.getCanvas().style.cursor = "pointer";

        //get location coordinates and shop name
        var coordinates = e.features[0].geometry.coordinates.slice();
        var name = e.features[0].properties.name;

        //ensure that if the map is zoomed out, the popup appears over the right location
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        //display popup and set its coordinates
        popup.setLngLat(coordinates);
        popup.setHTML(name);
        popup.addTo(map);
    });

    map.on("mouseleave", "locations", function() {
        map.getCanvas().style.cursor = "";
        popup.remove();
    });
}

/* Function to display each location's name and address in the sidebar as a list */
function displayLocationList(data) {
    $.each(coffeeShopList, function(i, store) {
        var prop = store.properties;

        //add listing section to sidebar
        $("#listings").append(`<div id="listing-${prop.id}" class="item"></div>`);

        //add the link to the individual listing
        $(`#listing-${prop.id}`).append(`<a class="title" id="link-${prop.id}">${prop.name}</a>`);

        //add details to the individual listing
        $(`#listing-${prop.id}`).append(`<div>${prop.formatted_address}</div>`);
    });
}


/***************** LOCATIONS IN SIDEBAR ARE CLICKED *****************/
$(document).on("click", "a", function(e) {
    console.log("listing clicked");

    //get the id of this listing
    var id = $(this).attr("id").replace("link-", "");

    //fly to this listing and display its respective popup
    var clickedListing = data.features[id];
    flyToStore(clickedListing);
    displayPopUp(clickedListing);

    //if a link is currently active, remove its active class so only one lising is active at a time
    if ($(".active:first")) {
        $(".active:first").removeClass("active");
    }

    //make the clicked link active
    $(this).parent().addClass("active");

    displayListingBelow(clickedListing);
});

/* Function to "fly" to the clicked-on store */
function flyToStore(currentFeature) {
    map.flyTo({
        center: currentFeature.geometry.coordinates,
        zoom: 14
    });
}

/* Function to display the styled popup window when a store is clicked on */
function displayPopUp(currentFeature) {
    var popUps = $(".mapboxgl-popup");

    //if there's already an open popup, close it
    if (popUps[0]) {
        popUps[0].remove();
    }

    var popup = new mapboxgl.Popup({
        closeOnClick: true
    });
    popup.setLngLat(currentFeature.geometry.coordinates)
    popup.setHTML(`<h3>${currentFeature.properties.name}</h3>`)
    popup.addTo(map);
}

/* Function to display the store's information below the map */
function displayListingBelow(currentFeature) {
    var prop = currentFeature.properties;

    //if there's already a store's information listed, remove it
    $("#listing-info").empty();

    $("#listing-info").append(`<h3>${prop.name}</h3>
        <div class="content">
            <div class="basic-info">
                <p><i class="fas fa-map-marker-alt icon"></i>${prop.formatted_address}</p>
                <p><i class="fas fa-phone-alt icon"></i>${prop.formatted_phone}</p>
                <p><i class="fas fa-globe-americas icon"></i><a href="http://${prop.website}" target="_blank">${prop.website}</a></p>
                <p><i class="fas fa-clock icon"></i>${prop.hours}</p>
            </div>
            <div class="row">
                <img src=${prop.images.main} alt="coffee shop" class="main-image col">
                <div class="col specialties">
                    <h4>What to get</h4>
                    <ul>
                        <li>${prop.specialties[0]}</li>
                        <li>${prop.specialties[1]}</li>
                        <li>${prop.specialties[2]}</li>
                    </ul>
                </div>    
            </div>
            <p class="col description">${prop.blurb.description}</p>
            <div class="row">
                <img src=${prop.images.secondary} alt="coffee shop" class="secondary-image col">
                <img src=${prop.images.tertiary} alt="coffee shop" class="tertiary-image col">
            </div>
        </div>`);
}



