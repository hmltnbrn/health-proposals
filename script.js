(function() {

  d3.selection.prototype.show = function() {
    this.style('display', 'block');
    return this;
  }

  d3.selection.prototype.showFlex = function() {
    this.style('display', 'flex');
    return this;
  }

  d3.selection.prototype.hide = function() {
    this.style('display', 'none');
    return this;
  }

  d3.selection.prototype.toggle = function() {
    var isHidden = this.style('display') == 'none';
    return this.style('display', isHidden ? 'inherit' : 'none');
  }

  d3.selection.prototype.check = function() {
    this.property("checked", true);
    this.attr("checked", true);
    return this;
  }

  d3.selection.prototype.uncheck = function() {
    this.property("checked", false);
    this.attr("checked", false);
    return this;
  }

  var system = "federal";

  d3.selectAll("input[name='plans']").on("change", function() {
    system = this.value;
    if(system === "federal") {
      d3.select(".federal-container").show();
      d3.select(".international-container").hide();
      d3.select(".select-proposal-text span").text("proposal");
      d3.select("h1.federal-header").show();
      d3.select("h1.international-header").hide();
      d3.select(".descriptive-text.federal-text").show();
      d3.select(".descriptive-text.international-text").hide();
    }
    else if(system === "international") {
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

  document.addEventListener('click', function(e) {
    if(e.target && e.target.id == 'compare-input') {
      if(e.target.checked) {
        e.target.parentNode.querySelector(".material-icons").innerText = "check_circle";
      }
      else {
        e.target.parentNode.querySelector(".material-icons").innerText = "radio_button_unchecked";
      }
    }
    else if(e.target && e.target.className == 'material-icons x-full-tooltip') {
      d3.selectAll(`.compare-${e.target.id.split("-")[1]}`).uncheck();
      let event = new Event('change');
      document.querySelector(`.compare-${e.target.id.split("-")[1]}`).dispatchEvent(event);
    }
  });

  queue()
    .defer(d3.json, 'data/federal-proposals.json')
    .defer(d3.json, 'data/international-systems.json')
    .await(checkSize);

  window.addEventListener('resize', checkSize);
  window.addEventListener('orientationchange', checkSize);

  var federalData;
  var internationalData;
  var firstTime = true;
  var mobile = false;

  function checkSize(error, federalProposals, internationalSystems) {
    if(firstTime) {
      federalData = federalProposals;
      internationalData = internationalSystems;
      firstTime = false;
    }
    if(screen.width <= 768 || window.innerWidth <= 768) {
      mobile = true;
      d3.select(".mobile-container").show();
      d3.select(".desktop-container").hide();
    }
    else {
      mobile = false;
      d3.select(".desktop-container").show();
      d3.select(".mobile-container").hide();
    }
    renderAll();
  }

  function renderAll() {
    if(!mobile) {
      if(system === "federal") {
        renderDesktop(federalData);
      }
      else if(system === "international") {
        renderDesktop(internationalData);
      }
    }
    else {
      if(system === "federal") {
        renderMobile(federalData);
      }
      else if(system === "international") {
        renderMobile(internationalData);
      }
    }
  }

  function renderDesktop(proposals) {

    d3.select("#desktop-timeline").remove();
    d3.selectAll(".tooltip").remove();
    d3.selectAll(".full-tooltip").remove();
    d3.select(".select-proposal-text").show();
    d3.select(".compare-proposal-container").hide();

    var chartDiv = document.getElementById("timeline-container");
    var w = chartDiv.clientWidth,
        h = 40,
        margin = { top: 20, right: 0, bottom: 20, left: 0 },
        radius = 7;

    var svg = d3.select(".timeline-container").append("svg").attr({
      id: "desktop-timeline",
      width: w,
      height: h,
      transform: "translate(" + [0, -1*margin.top] + ")",
    });

    var xScale = d3.scale.linear()
      .domain([0, 100])
      .range([margin.left, w - margin.right]);

    var xAxis = d3.svg.axis()
      .scale(xScale)
      .orient("top")
      .ticks(0)
      .outerTickSize([3.5]);

    var colorLine = d3.scale.linear()
      .domain([0, 100])
      .range(['#4abdbc', '#054d7f'])
      .interpolate(d3.interpolateHcl);

    var defs = svg.append("defs");

    var gradient = defs.append("linearGradient")
      .attr("id", "svgGradient")
      .attr("x1", "0%")
      .attr("x2", "100%");

    gradient.append("stop")
      .attr('class', 'start')
      .attr("offset", "0%")
      .attr("stop-color", "#4abdbc")
      .attr("stop-opacity", 1);

    gradient.append("stop")
      .attr('class', 'end')
      .attr("offset", "100%")
      .attr("stop-color", "#054d7f")
      .attr("stop-opacity", 1);

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

    var proposalsLength = [...new Set(proposals.map(value => value.x))].length;
    var previousCxValue;
    var previousColorValue;
    var cxOffset = 2;
    var colorOffset = 2;
    var proposalsCounted = {};
    proposals.forEach(function(d) {
      proposalsCounted[d.x] = (proposalsCounted[d.x] || 0) + 1;
    });

    var circleAttrs = {
      cx: function(d) {
        if(previousCxValue && previousCxValue === d.x) cxOffset += (100/proposalsLength) / proposalsCounted[d.x];
        else cxOffset = 2;
        let cx = xScale((d.x * 100 / proposalsLength) + cxOffset);
        previousCxValue = d.x;
        return cx;
      },
      cy: 20,
      r: radius,
      stroke: "white",
      "stroke-width": "1px",
      fill: function(d) {
        if(previousColorValue && previousColorValue === d.x) colorOffset += (100/proposalsLength) / proposalsCounted[d.x];
        else colorOffset = 2;
        let color = colorLine((d.x * 100 / proposalsLength) + colorOffset);
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

    let circles = svg.selectAll("circle")
      .data(proposals);

    circles.enter()
      .append("circle")
      .attr(circleAttrs)
      .on("mouseover", mouseOver)
      .on("mouseout", function(d) {
        if(clicked.indexOf(d.id) === -1) {
          moused[d.id] = false;
          d3.select(`.tooltip-${d.id}`).transition()
            .style("opacity", 0);
          d3.selectAll(`.tooltip-${d.id}`)
            .remove();
          sectionActive[d.x] = sectionActive[d.x] -= 1;
          maintainTimelineHeight(d);
        }
      })
      .on("click", function(d) {
        var index = clicked.indexOf(d.id);
        var checkIndex = checking.indexOf(d.id);
        if(index === -1) {
          clicked.push(d.id);
          if(!moused[d.id]) {
            mouseOver(d);
            moused[d.id] = true;
          }
        }
        else {
          moused[d.id] = false;
          d3.select(`.tooltip-${d.id}`).transition()
            .style("opacity", 0);
          d3.selectAll(`.tooltip-${d.id}`)
            .remove();
          if(index !== -1) clicked.splice(index, 1);
          if(checkIndex !== -1) checking.splice(checkIndex, 1);
          d3.select(`.full-tooltip-${d.id}`).transition()
            .style("opacity", 0);
          d3.selectAll(`.full-tooltip-${d.id}`)
            .remove();
          setTimeout(() => {
            redoOptions();
            updateTooltips(d);
          }, 0);
        }
      });

    circles.exit().remove();

    function mouseOver(d) {
      if(clicked.indexOf(d.id) === -1) {
        sectionActive[d.x] = (sectionActive[d.x] || 0) + 1;
        maintainTimelineHeight(d);
        moused[d.id] = true;
        let disableEnable = activeFullTools >= 2 ? "disabled" : "enabled";
        var div = d3.select("#timeline-container")
          .append("div")
          .attr("class", `tooltip tooltip-${d.id} tooltip-x-${d.x}`)
          .style("opacity", 0);
        div.html(`
          <h2 class="tooltip-name">${d.name}</h2>
          <div class="compare-bottom">
            <div class="compare-check">
              <label>
                <input type="checkbox" id="compare-input" class="compare-${d.id}" ${disableEnable}><span class="outer-span"><span>COMPARE</span> <i class="material-icons">radio_button_unchecked</i></span>
              </label>
            </div>
          </div>
        `)
          .style("width", `calc(100%/${proposalsLength})`)
          .style("left", `calc(100%/${proposalsLength}*${d.x})`)
          .style("top", (20 + (140 * sectionActive[d.x] - 140)) + "px");
        div.transition()
          .style("opacity", 1);
        toggleCompareDivs(d);
      }
      else if(clicked.indexOf(d.id) !== -1 && !moused[d.id]) {
        maintainTimelineHeight(d);
        moused[d.id] = true;
        let disableEnable = activeFullTools >= 2 ? "disabled" : "enabled";
        var div = d3.select("#timeline-container")
          .append("div")
          .attr("class", `tooltip tooltip-${d.id} tooltip-x-${d.x}`)
          .style("opacity", 0);
        div.html(`
          <h2 class="tooltip-name">${d.name}</h2>
          <div class="compare-bottom">
            <div class="compare-check">
              <label>
                <input type="checkbox" id="compare-input" class="compare-${d.id}" ${disableEnable}><span class="outer-span"><span>COMPARE</span> <i class="material-icons">radio_button_unchecked</i></span>
              </label>
            </div>
          </div>
        `)
          .style("width", `calc(100%/${proposalsLength})`)
          .style("left", `calc(100%/${proposalsLength}*${d.x})`)
          .style("top", (20 + (140 * sectionActive[d.x] - 140)) + "px");
        div.transition()
          .style("opacity", 1);
        toggleCompareDivs(d);
      }
    }

    function toggleCompareDivs(d) {
      document.querySelector(`.compare-${d.id}`).addEventListener("change", function(e) {
        let checked = d3.select(this).property("checked");
        let index = checking.indexOf(d.id);
        if (checked && index === -1 && activeFullTools < 2) {
          d3.select(".select-proposal-text").hide();
          d3.select(".compare-proposal-container").showFlex();
          checking.push(d.id);
          var divs = d3.select(".compare-proposal-container")
            .append("div")
            .attr("class", `full-tooltip full-tooltip-${d.id}`)
            .style("opacity", 0);
          divs.html(setFullTooltopHtml(d));
          divs.transition()
            .style("opacity", 1);
          activeFullTools++;
        }
        else if(!checked) {
          if(index !== -1) checking.splice(index, 1);
          d3.select(`.full-tooltip-${d.id}`).transition()
            .style("opacity", 0);
          d3.selectAll(`.full-tooltip-${d.id}`)
            .remove();
          activeFullTools--;
        }
        setTimeout(() => {
          redoOptions();
        }, 0);
      });
    }

    function setFullTooltopHtml(d) {
      if(system === "federal") {
        let transitionHeader = d.transition.time || "";
        let transitionText = d.transition.text || "";
        return `
          <div class="option-head">
            <h4 class="option-head-number">Option ${checking.length}</h4>
            <div class="close-full-tooltip">
              <i id="close-${d.id}" class="material-icons x-full-tooltip">close</i>
            </div>
          </div>
          <h2>${d.name}</h2>
          <h3>Sponsor</h3>
          <p>${d.sponsor}</p>
          <h3>New Coverage Enhancement or Option</h3>
          <p>${d.enhancement}</p>
          <h3>Who Is Eligible?</h3>
          <p>${d.eligibility}</p>
          <h3>How Do People Pay for Coverage and Health Care?</h3>
          <p>${d.cost}</p>
          <h3>How Are Health Care Costs Managed?</h3>
          <p>${d.management}</p>
          <h3>${transitionHeader}</h3>
          <p>${transitionText}</p>
          <a href="${d.link}" target="_blank">Read the bill</a>
        `;
      }
      else if(system === "international") {
        return `
          <div class="option-head">
            <h4 class="option-head-number">Option ${checking.length}</h4>
            <div class="close-full-tooltip">
              <i id="close-${d.id}" class="material-icons x-full-tooltip">close</i>
            </div>
          </div>
          <h2>${d.name}</h2>
          <h3>How Are People Covered?</h3>
          <p>${d.coverage.text}</p>
          <ul>
            ${d.coverage.bullets.map(b => `<li>${b}</li>`).join("")}
          </ul>
          <h3>How Do People Pay for Coverage and Health Care?</h3>
          ${d.cost.map(c => `<p>${c}</p>`).join("")}
          <h3>How Are Health Care Costs Managed?</h3>
          ${d.management.map(m => `<p>${m}</p>`).join("")}
          ${d.links.map(l => `<a href="${l.link}" target="_blank">${l.text}</a>`).join("")}
        `;
      }
    }

    function redoOptions() {
      d3.selectAll(".full-tooltip").each(function(d, i) {
        d3.select(this).select(".option-head-number").text(`Option ${i + 1}`);
      });
      if(checking.length === 0) {
        d3.select(".select-proposal-text").show();
        d3.select(".compare-proposal-container").hide();
      }
    }

    function updateTooltips(d) {
      d3.selectAll(`.tooltip-x-${d.x}`).each(function(d, i) {
        d3.select(this).style("top", (20 + (140 * (i + 1) - 140)) + "px");
      });
    }

    function maintainTimelineHeight(d) {
      let h = chartDiv.clientHeight;
      let newHeight = 170 * (sectionActive[d.x]);
      let maxValue = Math.max(...sectionActive);
      if(sectionActive[d.x] > 1 && newHeight > h) {
        d3.select("#timeline-container")
          .style("height", newHeight);
      }
      else if(newHeight < h && sectionActive[d.x] >= maxValue) {
        d3.select("#timeline-container")
          .style("height", newHeight);
      }
    }

  }

  function renderMobile(proposals) {
  }

})();
