/* Takes in a 2-level hierarchical set of data, and renders a series of divs
showing all of the measures sized proportinally to each other based on their
value compared to the grand total. This ensures that the largest spending item
will have the largest font.
*/
;/* global $ */
(function($){
  // Credit: https://remysharp.com/2010/07/21/throttling-function-calls
function debounce(fn, delay) {
  var timer = null;
  return function () {
    var context = this, args = arguments;
    clearTimeout(timer);
    timer = setTimeout(function () {
      fn.apply(context, args);
    }, delay);
  };
}

  function getRootElement() {
      return $("#list-container");
  }

  function getResizeElements(rootElement) {
      return rootElement.find(".o-measure");
  }

  function readData(callback) {
     $.when($.getJSON("./data/fy2017/c4okc_fy2017.json"),
            $.getJSON("./data/population.json"))
     .done(function(budgetData, populationData) {
         callback(budgetData[0], populationData[0]);
     })
     .fail(function (jqxhr, textStatus, error) {
         output("Had a problem getting the data: " + error);
     });
  }

  // master function to begin after data retrieval
  function processData(budgetData, populationData) {
      var aggregated = aggregateData(budgetData);
      var perCapita = calculatePerCapita(aggregated, populationData);
      var sorted = sortData(perCapita);
      var rootElement = getRootElement();
      rootElement = renderList(rootElement, sorted);
      resizeList();
  }

  // Create a new list that reduces the data into totals based on given keys
  function aggregateData(data){
      aggregated = data.reduce(function(acc,val){
          var key = val.agency+"-"+val.program;
          // break here, what's happening?
          if (!acc.hasOwnProperty(key)){
            acc[key] =
            {
              "agency": val.agency,
              "program": val.program,
              "program_total": 0
            };
          }
          acc[key]["program_total"] += Number(val.value);
          return acc;
      }, {});
      // convert single object to array
      aggArray = [];
      for(var key in aggregated) {
        aggArray.push(aggregated[key]);
      }

      return aggArray;
    }

  // Calculates the per capita value of each program total
  function calculatePerCapita(budgetData, populationData) {
    // expects aggregated budget data with "program_total" attribute
    // find the metro population, assume 2017
    var metroPopObject = $.grep(populationData, function(e){return e.year == 2017});
    var metroPop = Number(metroPopObject[0]["metro-population"]);

    var perCapitaData = budgetData.map(function (e) {
      var programTotal = Number(e["program_total"]);
      var programPerCapita = programTotal / metroPop;

      return {
        "agency": e["agency"],
        "program": e["program"],
        "program_total": e["program_total"].toLocaleString(),
        "program_per_capita": programPerCapita.toLocaleString(undefined,
          { maximumFractionDigits: 2, minimumFractionDigits: 2})
      };
    });

    return perCapitaData;
  }

  // assumes the data is already structured with L1, L2 & measure
  function sortData(data) {
      var sortedData = data.sort(function(a, b) {
          // sort only by program total
            return b.program_per_capita - a.program_per_capita; // descending order
          });

      return sortedData;
  }

  //Render the elements in the data as a series of divs with the 'o-row' class applied
  function renderList(rootElement, data) {
      data.forEach(function (element) {
          rowDiv = $("<div class='o-row'></div>");
          rowDiv.className = "o-row";
          rowDiv.id = element.L2;

          spanMeasure = $("<span class='o-measure'></span>");
          spanMeasure.append("<span class='o-cash'>$</span");
          spanMeasure.append("<span class='o-value'>" + element.program_per_capita + "</span>");

          spanDetail = $("<span class='o-detail'></span>");
          spanDetail.append("<p class='o-l1'>" + element.agency + "</p>");
          spanDetail.append("<p class='o-l2'>" + element.program + "</p>");
          spanDetail.append("<p class='o-total'>Total: $" + element.program_total + "</p>");

          rowDiv.append(spanMeasure);
          rowDiv.append(spanDetail);
          rootElement.append(rowDiv);
      });

      return rootElement;
  }

  // Resize the list based on window size
  function resizeList() {
      rootElement = getRootElement();
      elementsToResize = getResizeElements(rootElement);

      var maxWidth = 1800;
      var defaultScaler = 22.5; //scaler - multiplication factor for fonts
      var minScaler = 4.2;


      var newWidth = Math.min($(window).width(), maxWidth); // sets max for width calc
      var scaler = Math.max(defaultScaler * newWidth / maxWidth, minScaler); // min scale

      elementsToResize.each(function(k,v) {
          var valSpan = $(v).children('.o-value')[0];
          var value = $(valSpan).text();
          var fontSize = getFontSize(value, scaler);
          $(v).css('font-size', fontSize + 'px');
      });

  }

  function getFontSize(val, scaler) {
      var minSize = 18; // minimum font size
      var pc = String(val);
      var str = pc.replace(',', ''); // "100.01"
      var val = Number(str); // 100.01
      var roundNum = Math.round(val);
      var periodCount = (str.match(/\./g) || []).length;
      var numeralCount = (str.match(/[0-9]/g) || []).length;
      var nonNumerals = Math.floor((String(roundNum).length-1) / 3) + periodCount; // count of periods and commas

      var size = Math.sqrt((val) / (.7*( (.56 * numeralCount) + (.27*nonNumerals) ))); // font size function
      var fontSize = scaler * size;

      return Math.max(fontSize, minSize);

  }

  // helpers
  function output(message) {
    alert(message);
  }

  // resize fonts when window resizes
  $(window).resize(debounce(resizeList, 250));

  // find root element
  // TODO: make root element dynamic
  readData(processData);
})($);
