/*
 * Katie James
 * Coffee Crawl
 * List Generator Page Script
 * CSIS 304 Final Project
 */

/*
 * Uses the Turf JS library to convert data to geojson
 */

$(document).ready(getJSONData);

/* Function to get and return the coffee shop JSON data */
function getJSONData() {
    $.ajax({
        type: "GET",
        crossDomain: true,
        url: "data.json",
        dataType: "json",
        success: function(data) {
            //console.log("success!");
            loadPage(data);
        }
    });
}

function loadPage(data) {
    var coffeeShopList = data.features;

    /***************** GENERATE COFFEE CRAWL LIST FROM FORM *****************/
    $("#submit-button").click(function() {
        //if form is valid, find all coffee shops from JSON data that match the description specified
        if (validateForm()) {
            //console.log("valid form");

            //if there's already a list, remove it
            $("#list").empty();

            var coffeeCrawl = [];
            var num = $("#num").val();
            var coffeeType = $("#coffee-type").val();
            var food = $("#food-options").val();
            var activity = $("#activity").val();
            var roast = $("#roast").prop("checked");

            //traverse through every coffee shop object
            $.each(coffeeShopList, function(i, store) {
                var prop = store.properties;
                var flag = false;

                //if the specified quality does not match this coffee shop, flag it so that it will not be added to the coffee crawl list
                if ($.inArray(coffeeType, prop.coffee_type) === -1) {
                    //console.log("coffee type does not match");
                    flag = true;
                }
                else if (food !== "coffee" && $.inArray(food, prop.food_options) === -1) {
                    //console.log("food does not match");
                    flag = true;
                }
                else if ($.inArray(activity, prop.activity) === -1) {
                    //console.log("activity does not match");
                    flag = true;
                }
                else if (roast && !prop.roasts_own_coffee) {
                    //console.log("roast own coffee does not match");
                    flag = true;
                }

                if (!flag) {
                    //console.log("pushed to list");
                    coffeeCrawl.push(store);
                }
            });

            //randomly remove shops from the list until left with the specified number of shops from form
            if (num < coffeeCrawl.length) {
                var numToRemove = coffeeCrawl.length - num;
                for (var i = 0; i < numToRemove; i++) {
                    coffeeCrawl.splice(Math.floor(Math.random() * coffeeCrawl.length), 1);
                }
            }

            displayList(coffeeCrawl);

            //if there aren't enough shops that match the description, display a message
            if (num > coffeeCrawl.length) {
                $(".list-title").after("<h4 id=\"fyi\">(fyi, the number of shops that match your specifications is less than the number you specified!)");
            }
        }
        else {
            $("#list").empty();
            $("#list").append("<h4 id=\"fyi\">Please complete the form!</h4>");
        }
    });

    /* Function to display the coffee crawl list */
    function displayList(list) {
        $("#list").append("<h2 class=\"list-title\">Your Very Own Coffee Crawl</h2>");
        
        displayOptimizedPath(list);

        $.each(list, function(i, store) {
            displayStore(i, store);
        });

        $("#reset-button").removeClass("hidden");
    }

    /***************** CREATE AND DISPLAY OPTIMIZED PATH *****************/
    /* Function to display the map with the optimized path between the generated coffee shops on the list */
    function displayOptimizedPath(list) {
        //create container for MapBox map
        $("h2.list-title").append("<div id=\"map\" class=\"contain generator-map\"></div>");

        //turn the list back into geojson
        var listData = turf.featureCollection(list);
        mapboxgl.accessToken = "pk.eyJ1Ijoia2phbWVzMTciLCJhIjoiY2s4cndtOTVyMDJ1dDNlcGFueWMwYWR1NiJ9.pxxSphkpk-gqZpsTxthRFg";

        //initialize a map
        var map = new mapboxgl.Map({
            container: "map",
            style: "mapbox://styles/mapbox/light-v10",
            center: [-122.6750, 45.5051],
            zoom: 11
        });

        //load the map with the optimized path
        map.on("load", function() {
            //add resultant coffee crawl list to map as layer
            map.addLayer({
                "id": "locations",
                "type": "symbol",
                "source": {
                    "type": "geojson",
                    "data": listData
                },
                "layout": {
                    "icon-image": "cafe-15",
                    "icon-size": 1.4,
                    "icon-allow-overlap": true
                },
            });

            var nothing = turf.featureCollection([]);
            map.addSource("route", {
                type: "geojson",
                data: nothing
            });

            //add path between shops to map as layer with an empty source
            map.addLayer({
                "id": "routeline-active",
                "type": "line",
                "source": "route",
                "layout": {
                    "line-join": "round",
                    "line-cap": "round"
                },
                "paint": {
                    "line-color": "#000000",
                    "line-width": [
                        "interpolate",
                        ["linear"],
                        ["zoom"],
                        12, 3,
                        22, 12
                    ]
                }
            }, "waterway-label");

            makeQuery(listData);

            //add directionality to route line as layer
            map.addLayer({
                id: "routearrows",
                type: "symbol",
                source: "route",
                layout: {
                    "symbol-placement": "line",
                    "text-field": "▶",
                    "text-size": [
                        "interpolate",
                        ["linear"],
                        ["zoom"],
                        12, 24,
                        22, 60
                    ],
                    "symbol-spacing": [
                        "interpolate",
                        ["linear"],
                        ["zoom"],
                        12, 30,
                        22, 160
                    ],
                    "text-keep-upright": false
                },
                paint: {
                    "text-color": "#000000",
                    "text-halo-color": "hsl(55, 11%, 96%)",
                    "text-halo-width": 3
                }
            }, "waterway-label");
        });

        /* Function to make the request to the Optimization API */
        function makeQuery(listData) {
            $.ajax({
                url: assembleQueryURL(listData),
                type: "GET"
            }).done(function(data) {
                //create a geojson feature collection
                var routeGeoJSON = turf.featureCollection([turf.feature(data.trips[0].geometry)]);

                //update the route source by getting the route source and setting the data equal to routeGeoJSON
                map.getSource("route").setData(routeGeoJSON);
            });
        }

        /* Function to build the request to the Optimization API */
        function assembleQueryURL(listData) {
            var coordinates = [];

            $.each(listData.features, function(i, store) {
                coordinates.push(store.geometry.coordinates);
            });

            //create and return query URL
            return 'https://api.mapbox.com/optimized-trips/v1/mapbox/driving/' + coordinates.join(';') +  '?geometries=geojson&source=first&access_token=' + mapboxgl.accessToken;
        }

        /***************** POPUPS ON HOVER *****************/
        var popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false
        });

        map.on("mouseenter", "locations", function(e) {
            //change cursor to pointer
            map.getCanvas().style.cursor = "pointer";

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
}

/* Function to validate the submitted form. The form is valid iff all fields have been completed */
function validateForm() {
    var result = true;
    if ($("#num").val() == "" || $("#coffee-type").val() == null || $("#food-options").val() == null || $("#activity").val() == null) {
        result = false;
    }
    return result;
}

/* Function to display the information of each store in the coffee crawl list */
function displayStore(i, store) {
    var prop = store.properties;

    $("#list").append(`<button class="collapsible"><h3>${prop.name}<h3></button>`);
    $("#list").append(`<div id="list-item-${i}" class="content content-hidden">
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

    //make each item in the list collapsible
    var coll = $(".collapsible");

    coll[i].addEventListener("click", function() {
        this.classList.toggle("active");
        var content = this.nextElementSibling;
        if (content.style.maxHeight) {
            content.style.maxHeight = null;
        }
        else {
            content.style.maxHeight = content.scrollHeight + "px";
        }
    });
}

/*  When the reset button is clicked, reset the form */
$("#reset-button").click(function() {
    $("#reset-button").addClass("hidden");
    $("#list").empty();
    $("#num").val("");
    $("#coffee-type").val("none");
    $("#food-options").val("none");
    $("#roast").prop("checked", false);
    $("#activity").val("none");
});



