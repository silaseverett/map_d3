//Global key state variables
var selected_variable = "price_singfam";
var selected_year = 2005;

// Global data variables
var geojson;
var town_data;
var map;
var legend;

// Global lookup stuff
var town_to_id;
var column_names = [
  "%_good_aqi",
  "cenpov200",
  "cen_child_pov",
  "cen_english",
  "cen_fam_pov",
  "cen_income_ineq",
  "med_hh_inc",
  "cen_poor",
  "population",
  "cen_pov_for_born",
  "cen_singparhou",
  "cen_pop_o64",
  "cen_pop_u18",
  "cen_earlyed",
  "educatt_college",
  "car_age_householder",
  "elderly_livealone",
  "elderly_pov",
  "grand_caregiver",
  "cen_hunovhcl",
  "cen_medowncosts",
  "cen_ownocchu",
  "hous_afford",
  "own_costs30",
  "per_own_occ",
  "rent_costs30",
  "library_att",
  "edu_per_pupil",
  "dropout",
  "hsgrad_5yr",
  "per_passmath_8th",
  "per_passmath_3rd",
  "avgweeklywage",
  "foreclosures_1fam",
  "foreclose_rate",
  "price_singfam",
  "voters_total"
].reverse();
var good_column_names = [
  "% Good Air Quality",
  "% Below 200% poverty",
  "Child poverty rate",
  "English only home",
  "Families in poverty",
  "Income inequality",
  "Median household income",
  "Pop below poverty line",
  "Population",
  "Poverty rate foreign-born",
  "Single parent households",
  "Population 65+",
  "Population under 18",
  "% Children enrolled in early ed",
  "% College grads",
  "% Elderly with cars",
  "% Elderly living alone",
  "% Elderly below poverty",
  "% Grandparents caregiving to grandchildren",
  "Housing units with no vehicles",
  "Median monthly mortgage",
  "Owner occupied housing units",
  "Housing affordability",
  "% Home-owners paying 30%+ of income on mortgage",
  "% Owner occupied housing",
  "% Renters paying 30%+ of income on rent",
  "Library attendance",
  "Average $ spent per pupil",
  "HS dropout rate",
  "# Students who graduate HS in <5 years",
  "% 8th-graders passing MCAS math",
  "% 3rd-graders passing MCAS math",
  "Avg weekly wage of town jobs",
  "Foreclosure deeds 1-fam home",
  "Foreclosures per 1000 housing units",
  "Median price 1-fam home",
  "Total registered voters"
].reverse();

// miscellaneous globals
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

var map;
var info;
var legend;
var getColor;
var style;
function initializePage() {
  // all the things that can be started off without any data loaded

  // ---------------------------------------------------------------------
  // basic map
  // ---------------------------------------------------------------------
  map = L.map("map").setView([42.3296486, -72.6984194], 9);

  L.tileLayer(
    "https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw",
    {
      maxZoom: 18,
      attribution:
        'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
          '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="http://mapbox.com">Mapbox</a>',
      id: "mapbox.light"
    }
  ).addTo(map);

  // ---------------------------------------------------------------------
  // info box
  // ---------------------------------------------------------------------

  // control that shows state info on hover
  info = L.control();

  info.onAdd = function() {
    this._div = L.DomUtil.create("div", "info");
    this.update();
    return this._div;
  };

  info.update = function(props) {
    this._div.innerHTML =
      "<h4>" +
      (column_names.indexOf(selected_variable) > -1
        ? good_column_names[column_names.indexOf(selected_variable)]
        : "") +
      ", " +
      selected_year +
      "</h4>" +
      (props
        ? "<b>" +
            props.TOWN +
            "</b><br/>" +
            town_data[town_to_id[props.TOWN]][selected_year][
              " " + selected_variable
            ] +
            ""
        : "Hover over a town");
  };

  info.addTo(map);

  // ---------------------------------------------------------------------
  // legend
  // ---------------------------------------------------------------------
  legend = L.control({ position: "bottomright" });
  legend.onAdd = function() {
    this._div = L.DomUtil.create("div", "info legend");
    // this.update();
    return this._div;
  };

  legend.update = function() {
    console.log("Updating legend.");
    var selected_variable_values = [];
    console.log(town_data);
    for (var town_idx = 0; town_idx < good_town_list.length; town_idx++) {
      var town_key = good_town_list[town_idx];
      console.log(town_data[town_to_id[town_key]]);
      console.log(town_key);
      console.log(town_to_id);
      console.log(town_to_id[town_key]);
      if (selected_year in town_data[town_to_id[town_key]]) {
        var cur_val =
          town_data[town_to_id[town_key]][selected_year][
            " " + selected_variable
          ];
        if (cur_val != "NULL") {
          selected_variable_values.push(parseFloat(cur_val));
        }
      }
    }
    getColor.domain(d3.extent(selected_variable_values));

    var roundTo = d3.max(selected_variable_values) < 2 ? 2 : 0;
    var labels = [];
    for (color in colorlist) {
      var domain_extent = getColor.invertExtent(colorlist[color]);
      labels.push(
        '<i style="background:' +
          colorlist[color] +
          '"></i> ' +
          numberWithCommas(domain_extent[0].toFixed(roundTo)) +
          (domain_extent[1] != d3.max(selected_variable_values)
            ? "&ndash;" + numberWithCommas(domain_extent[1].toFixed(roundTo))
            : "+")
      );
    }
    this._div.innerHTML = labels.join("<br>");
  };
  legend.addTo(map);

  var colorlist = [
    "#800026",
    "#BD0026",
    "#E31A1C",
    "#FC4E2A",
    "#FD8D3C",
    "#FEB24C",
    "#FED976",
    "#FFEDA0"
  ].reverse();

  getColor = d3.scaleQuantize().domain([0, 5000]).range(colorlist);

  style = function(feature) {
    // console.log(town_data[town_to_id[feature.properties.TOWN]][selected_year][selected_variable]);
    var x =
      town_data[town_to_id[feature.properties.TOWN]][selected_year][
        " " + selected_variable
      ];

    return {
      weight: 2,
      opacity: 1,
      color: "white",
      dashArray: "3",
      fillOpacity: 0.7,
      fillColor: x === "NULL" ? "#d3d3d3" : getColor(x)
    };
  };
}
initializePage();

function highlightFeature(e) {
  var layer = e.target;

  layer.setStyle({
    weight: 5,
    color: "#666",
    dashArray: "",
    fillOpacity: 0.7
  });

  if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
    layer.bringToFront();
  }

  info.update(layer.feature.properties);
}

function resetHighlight(e) {
  var layer = e.target;
  layer.setStyle({
    weight: 2,
    opacity: 1,
    color: "white",
    dashArray: "3"
  });
  info.update();
}

function zoomToFeature(e) {
  map.fitBounds(e.target.getBounds());
}

function onEachFeature(feature, layer) {
  function showMunicipalData(e) {
    selected_town = feature.properties.TOWN;
    console.log("Clicked " + selected_town);
  }
  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight,
    click: showMunicipalData
  });
}

var collection;
var good_town_list;
var geojson;
var town_to_id;
var q = d3
  .queue()
  .defer(d3.json,"https://massmutual.github.io/pvpc_map/data/Political_Boundaries_MM/Municipal_Boundaries_PVPC_FRCOG.geojson")
  .defer(d3.csv,"https://massmutual.github.io/pvpc_map/data/pvpc_map/pvpc_towns.csv")
  .defer(d3.text,"https://massmutual.github.io/pvpc_map/data/pvpc_map/pvpc_data.csv")
  .awaitAll(function(error, results) {
    if (error) throw error;
    console.log(results);

    // geodata
    collection = results[0];

    good_town_list = collection.features.map(function(d) {
      return d.properties.TOWN;
    });
    console.log(good_town_list);

    map.attributionControl.addAttribution(
      'Town data by <a href="http://www.pvpc.org/">PVPC</a>'
    );

    // linked town data
    var links = results[1];
    town_to_id = {};
    for (var i = 0; i < links.length; i++) {
      if (links[i][" community"] != undefined) {
        town_to_id[links[i][" community"].toUpperCase()] = links[i].id;
      }
    }

    // the full dataset
    Papa.parse(results[2], {
      delimiter: ",",
      header: true,
      complete: loadTownData
    });
  });

var svg;
var y;
var h;
function loadTownData(results, file) {
  json_data = results["data"];
  town_data = {};
  for (var i = 0; i < json_data.length; i++) {
    cur_id = json_data[i]["id"];
    cur_year = json_data[i][" year"];
    if (json_data[i][" duration"] != 1) {
      continue;
    }
    if (!(cur_id in town_data)) {
      town_data[cur_id] = {};
    }
    if (!(cur_year in town_data[cur_id])) {
      town_data[cur_id][cur_year] = json_data[i];
    }
  }
  console.log(town_data);

  geojson = L.geoJson(collection, {
    onEachFeature: onEachFeature
  }).addTo(map);

  updatePage();
}

// everything that actually depends upon data being loaded
var updatePage = function() {
  legend.update();
  geojson.setStyle(style);
  info.update();
};

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}