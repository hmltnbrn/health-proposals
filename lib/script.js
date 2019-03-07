"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

(function () {
  d3.selection.prototype.show = function () {
    this.style('display', 'block');
    return this;
  };

  d3.selection.prototype.showFlex = function () {
    this.style('display', 'flex');
    return this;
  };

  d3.selection.prototype.hide = function () {
    this.style('display', 'none');
    return this;
  };

  d3.selection.prototype.toggle = function () {
    var isHidden = this.style('display') == 'none';
    return this.style('display', isHidden ? 'inherit' : 'none');
  };

  d3.selection.prototype.check = function () {
    this.property("checked", true);
    this.attr("checked", true);
    return this;
  };

  d3.selection.prototype.uncheck = function () {
    this.property("checked", false);
    this.attr("checked", false);
    return this;
  };

  var system = "federal";
  d3.selectAll("input[name='plans']").on("change", function () {
    system = this.value;

    if (system === "federal") {
      d3.select(".federal-container").show();
      d3.select(".international-container").hide();
      d3.select(".select-proposal-text span").text("proposal");
      d3.select("h1.federal-header").show();
      d3.select("h1.international-header").hide();
      d3.select(".descriptive-text.federal-text").show();
      d3.select(".descriptive-text.international-text").hide();
    } else if (system === "international") {
      d3.select(".international-container").show();
      d3.select(".federal-container").hide();
      d3.select(".select-proposal-text span").text("country");
      d3.select("h1.international-header").show();
      d3.select("h1.federal-header").hide();
      d3.select(".descriptive-text.international-text").show();
      d3.select(".descriptive-text.federal-text").hide();
    }

    renderAll();
  });
  document.addEventListener('click', function (e) {
    if (e.target && e.target.id == 'compare-input') {
      if (e.target.checked) {
        e.target.parentNode.querySelector(".material-icons").innerText = "check_circle";
      } else {
        e.target.parentNode.querySelector(".material-icons").innerText = "radio_button_unchecked";
      }
    } else if (e.target && e.target.className == 'material-icons x-full-tooltip') {
      d3.selectAll(".compare-" + String(e.target.id.split("-")[1])).uncheck();
      var event = new Event('change');
      document.querySelector(".compare-" + String(e.target.id.split("-")[1])).dispatchEvent(event);
    }
  });
  queue().defer(d3.json, 'data/federal-proposals.json').defer(d3.json, 'data/international-systems.json').await(checkSize);
  window.addEventListener('resize', checkSize);
  window.addEventListener('orientationchange', checkSize);
  var federalData;
  var internationalData;
  var firstTime = true;
  var mobile = false;

  function checkSize(error, federalProposals, internationalSystems) {
    if (firstTime) {
      federalData = federalProposals;
      internationalData = internationalSystems;
      firstTime = false;
    }

    if (screen.width <= 768 || window.innerWidth <= 768) {
      mobile = true;
      d3.select(".mobile-container").show();
      d3.select(".desktop-container").hide();
    } else {
      mobile = false;
      d3.select(".desktop-container").show();
      d3.select(".mobile-container").hide();
    }

    renderAll();
  }

  function renderAll() {
    if (!mobile) {
      if (system === "federal") {
        renderDesktop(federalData);
      } else if (system === "international") {
        renderDesktop(internationalData);
      }
    } else {
      if (system === "federal") {
        renderMobile(federalData);
      } else if (system === "international") {
        renderMobile(internationalData);
      }
    }
  }

  function renderDesktop(proposals) {
    d3.select("#desktop-timeline").remove();
    d3.selectAll(".viz-tooltip").remove();
    d3.selectAll(".full-tooltip").remove();
    d3.select(".select-proposal-text").show();
    d3.select(".compare-proposal-container").hide();
    var chartDiv = document.getElementById("timeline-container");
    var w = chartDiv.clientWidth,
        h = 40,
        margin = {
      top: 20,
      right: 0,
      bottom: 20,
      left: 0
    },
        radius = 7;
    var svg = d3.select(".timeline-container").append("svg").attr({
      id: "desktop-timeline",
      width: w,
      height: h,
      transform: "translate(" + [0, -1 * margin.top] + ")"
    });
    var xScale = d3.scale.linear().domain([0, 100]).range([margin.left, w - margin.right]);
    var xAxis = d3.svg.axis().scale(xScale).orient("top").ticks(0).outerTickSize([3.5]);
    var colorLine = d3.scale.linear().domain([0, 100]).range(['#4abdbc', '#054d7f']).interpolate(d3.interpolateHcl);
    var defs = svg.append("defs");
    var gradient = defs.append("linearGradient").attr("id", "svgGradient").attr("x1", "0%").attr("x2", "100%");
    gradient.append("stop").attr('class', 'start').attr("offset", "0%").attr("stop-color", "#4abdbc").attr("stop-opacity", 1);
    gradient.append("stop").attr('class', 'end').attr("offset", "100%").attr("stop-color", "#054d7f").attr("stop-opacity", 1);
    svg.append("g").attr({
      "class": "axis",
      "stroke": "white",
      "transform": "translate(" + [0, margin.top] + ")",
      "fill": "none",
      "stroke-width": "9px"
    }).call(xAxis);
    svg.append("g").attr({
      "class": "axis",
      "stroke": "url(#svgGradient)",
      "transform": "translate(" + [0, margin.top] + ")",
      "fill": "none",
      "stroke-width": "7px"
    }).call(xAxis);

    var proposalsLength = _toConsumableArray(new Set(proposals.map(function (value) {
      return value.x;
    }))).length;

    var previousCxValue;
    var previousColorValue;
    var cxOffset = 2;
    var colorOffset = 2;
    var proposalsCounted = {};
    proposals.forEach(function (d) {
      proposalsCounted[d.x] = (proposalsCounted[d.x] || 0) + 1;
    });
    var circleAttrs = {
      cx: function cx(d) {
        if (previousCxValue && previousCxValue === d.x) cxOffset += 100 / proposalsLength / proposalsCounted[d.x];else cxOffset = 2;
        var cx = xScale(d.x * 100 / proposalsLength + cxOffset);
        previousCxValue = d.x;
        return cx;
      },
      cy: 20,
      r: radius,
      stroke: "white",
      "stroke-width": "1px",
      fill: function fill(d) {
        if (previousColorValue && previousColorValue === d.x) colorOffset += 100 / proposalsLength / proposalsCounted[d.x];else colorOffset = 2;
        var color = colorLine(d.x * 100 / proposalsLength + colorOffset);
        previousColorValue = d.x;
        return color;
      },
      class: "data-point"
    };
    var clicked = [];
    var checking = [];
    var moused = [];
    var sectionActive = Array(proposalsLength).fill(0);
    var activeFullTools = 0;
    var circles = svg.selectAll("circle").data(proposals);
    circles.enter().append("circle").attr(circleAttrs).on("mouseover", mouseOver).on("mouseout", function (d) {
      if (clicked.indexOf(d.id) === -1) {
        moused[d.id] = false;
        d3.select(".tooltip-" + String(d.id)).transition().style("opacity", 0);
        d3.selectAll(".tooltip-" + String(d.id)).remove();
        sectionActive[d.x] = sectionActive[d.x] -= 1;
        maintainTimelineHeight(d);
      }
    }).on("click", function (d) {
      var index = clicked.indexOf(d.id);
      var checkIndex = checking.indexOf(d.id);

      if (index === -1) {
        clicked.push(d.id);

        if (!moused[d.id]) {
          mouseOver(d);
          moused[d.id] = true;
        }
      } else {
        moused[d.id] = false;
        d3.select(".tooltip-" + String(d.id)).transition().style("opacity", 0);
        d3.selectAll(".tooltip-" + String(d.id)).remove();
        if (index !== -1) clicked.splice(index, 1);

        if (checkIndex !== -1) {
          checking.splice(checkIndex, 1);
          activeFullTools--;
        }

        d3.select(".full-tooltip-" + String(d.id)).transition().style("opacity", 0);
        d3.selectAll(".full-tooltip-" + String(d.id)).remove();
        setTimeout(function () {
          redoOptions();
          updateTooltips(d);
        }, 0);
      }
    });
    circles.exit().remove();

    function mouseOver(d) {
      if (clicked.indexOf(d.id) === -1) {
        sectionActive[d.x] = (sectionActive[d.x] || 0) + 1;
        maintainTimelineHeight(d);
        moused[d.id] = true;
        var disableEnable = activeFullTools >= 2 ? "disabled" : "enabled";
        var div = d3.select("#timeline-container").append("div").attr("class", "viz-tooltip tooltip-" + String(d.id) + " tooltip-x-" + String(d.x)).style("opacity", 0);
        div.html("\n          <h2 class=\"tooltip-name\">" + String(d.name) + "</h2>\n          <div class=\"compare-bottom\">\n            <div class=\"compare-check\">\n              <label>\n                <input type=\"checkbox\" id=\"compare-input\" class=\"compare-" + String(d.id) + "\" " + disableEnable + "><span class=\"outer-span\"><span>COMPARE</span> <i class=\"material-icons\">radio_button_unchecked</i></span>\n              </label>\n            </div>\n          </div>\n        ").style("width", "calc(100%/" + String(proposalsLength) + ")").style("left", "calc(100%/" + String(proposalsLength) + "*" + String(d.x) + ")").style("top", 20 + (140 * sectionActive[d.x] - 140) + "px");
        div.transition().style("opacity", 1);
        toggleCompareDivs(d);
      } else if (clicked.indexOf(d.id) !== -1 && !moused[d.id]) {
        maintainTimelineHeight(d);
        moused[d.id] = true;

        var _disableEnable = activeFullTools >= 2 ? "disabled" : "enabled";

        var div = d3.select("#timeline-container").append("div").attr("class", "viz-tooltip tooltip-" + String(d.id) + " tooltip-x-" + String(d.x)).style("opacity", 0);
        div.html("\n          <h2 class=\"tooltip-name\">" + String(d.name) + "</h2>\n          <div class=\"compare-bottom\">\n            <div class=\"compare-check\">\n              <label>\n                <input type=\"checkbox\" id=\"compare-input\" class=\"compare-" + String(d.id) + "\" " + _disableEnable + "><span class=\"outer-span\"><span>COMPARE</span> <i class=\"material-icons\">radio_button_unchecked</i></span>\n              </label>\n            </div>\n          </div>\n        ").style("width", "calc(100%/" + String(proposalsLength) + ")").style("left", "calc(100%/" + String(proposalsLength) + "*" + String(d.x) + ")").style("top", 20 + (140 * sectionActive[d.x] - 140) + "px");
        div.transition().style("opacity", 1);
        toggleCompareDivs(d);
      }
    }

    function toggleCompareDivs(d) {
      document.querySelector(".compare-" + String(d.id)).addEventListener("change", function (e) {
        var checked = d3.select(this).property("checked");
        var index = checking.indexOf(d.id);

        if (checked && index === -1 && activeFullTools < 2) {
          d3.select(".select-proposal-text").hide();
          d3.select(".compare-proposal-container").showFlex();
          checking.push(d.id);
          var divs = d3.select(".compare-proposal-container").append("div").attr("class", "full-tooltip full-tooltip-" + String(d.id)).style("opacity", 0);
          divs.html(setFullTooltopHtml(d));
          divs.transition().style("opacity", 1);
          activeFullTools++;
        } else if (!checked) {
          if (index !== -1) checking.splice(index, 1);
          d3.select(".full-tooltip-" + String(d.id)).transition().style("opacity", 0);
          d3.selectAll(".full-tooltip-" + String(d.id)).remove();
          activeFullTools--;
        }

        setTimeout(function () {
          redoOptions();
        }, 0);
      });
    }

    function setFullTooltopHtml(d) {
      if (system === "federal") {
        var transitionHeader = d.transition.time || "";
        var transitionText = d.transition.text || "";
        return "\n          <div class=\"option-head\">\n            <h4 class=\"option-head-number\">Option " + String(checking.length) + "</h4>\n            <div class=\"close-full-tooltip\">\n              <i id=\"close-" + String(d.id) + "\" class=\"material-icons x-full-tooltip\">close</i>\n            </div>\n          </div>\n          <h2>" + String(d.name) + "</h2>\n          <h3>Sponsor</h3>\n          <p>" + String(d.sponsor) + "</p>\n          <h3>New Coverage Enhancement or Option</h3>\n          <p>" + String(d.enhancement) + "</p>\n          <h3>Who Is Eligible?</h3>\n          <p>" + String(d.eligibility) + "</p>\n          <h3>How Do People Pay for Coverage and Health Care?</h3>\n          <p>" + String(d.cost) + "</p>\n          <h3>How Are Health Care Costs Managed?</h3>\n          <p>" + String(d.management) + "</p>\n          <h3>" + String(transitionHeader) + "</h3>\n          <p>" + String(transitionText) + "</p>\n          <a href=\"" + String(d.link) + "\" target=\"_blank\">Read the bill</a>\n        ";
      } else if (system === "international") {
        return "\n          <div class=\"option-head\">\n            <h4 class=\"option-head-number\">Option " + String(checking.length) + "</h4>\n            <div class=\"close-full-tooltip\">\n              <i id=\"close-" + String(d.id) + "\" class=\"material-icons x-full-tooltip\">close</i>\n            </div>\n          </div>\n          <h2>" + String(d.name) + "</h2>\n          <h3>How Are People Covered?</h3>\n          <p>" + String(d.coverage.text) + "</p>\n          <ul>\n            " + String(d.coverage.bullets.map(function (b) {
          return "<li>" + String(b) + "</li>";
        }).join("")) + "\n          </ul>\n          <h3>How Do People Pay for Coverage and Health Care?</h3>\n          " + String(d.cost.map(function (c) {
          return "<p>" + String(c) + "</p>";
        }).join("")) + "\n          <h3>How Are Health Care Costs Managed?</h3>\n          " + String(d.management.map(function (m) {
          return "<p>" + String(m) + "</p>";
        }).join("")) + "\n          " + String(d.links.map(function (l) {
          return "<a href=\"" + String(l.link) + "\" target=\"_blank\">" + String(l.text) + "</a>";
        }).join("")) + "\n        ";
      }
    }

    function redoOptions() {
      d3.selectAll(".full-tooltip").each(function (d, i) {
        d3.select(this).select(".option-head-number").text("Option " + String(i + 1));
      });

      if (checking.length === 0) {
        d3.select(".select-proposal-text").show();
        d3.select(".compare-proposal-container").hide();
      }
    }

    function updateTooltips(d) {
      d3.selectAll(".tooltip-x-" + String(d.x)).each(function (d, i) {
        d3.select(this).style("top", 20 + (140 * (i + 1) - 140) + "px");
      });
    }

    function maintainTimelineHeight(d) {
      var h = chartDiv.clientHeight;
      var newHeight = 170 * sectionActive[d.x];
      var maxValue = Math.max.apply(Math, _toConsumableArray(sectionActive));

      if (sectionActive[d.x] > 1 && newHeight > h) {
        d3.select("#timeline-container").style("height", newHeight);
      } else if (newHeight < h && sectionActive[d.x] >= maxValue) {
        d3.select("#timeline-container").style("height", newHeight);
      }
    }
  }

  function renderMobile(proposals) {}
})();