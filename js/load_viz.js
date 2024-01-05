const run_state_map = (chart_id, filter_id, map_data, state_data_raw) => {

    const parent_width = document.getElementById(chart_id).offsetWidth;
    const parent_height = 600;
    console.log(map_data);
    console.log('data states');
  
    state_lookup = {
      "AL": "Alabama",
      "AK": "Alaska",
      "AS": "American Samoa",
      "AZ": "Arizona",
      "AR": "Arkansas",
      "CA": "California",
      "CO": "Colorado",
      "CT": "Connecticut",
      "DE": "Delaware",
      "DC": "District Of Columbia",
      "FM": "Federated States Of Micronesia",
      "FL": "Florida",
      "GA": "Georgia",
      "GU": "Guam",
      "HI": "Hawaii",
      "ID": "Idaho",
      "IL": "Illinois",
      "IN": "Indiana",
      "IA": "Iowa",
      "KS": "Kansas",
      "KY": "Kentucky",
      "LA": "Louisiana",
      "ME": "Maine",
      "MH": "Marshall Islands",
      "MD": "Maryland",
      "MA": "Massachusetts",
      "MI": "Michigan",
      "MN": "Minnesota",
      "MS": "Mississippi",
      "MO": "Missouri",
      "MT": "Montana",
      "NE": "Nebraska",
      "NV": "Nevada",
      "NH": "New Hampshire",
      "NJ": "New Jersey",
      "NM": "New Mexico",
      "NY": "New York",
      "NC": "North Carolina",
      "ND": "North Dakota",
      "MP": "Northern Mariana Islands",
      "OH": "Ohio",
      "OK": "Oklahoma",
      "OR": "Oregon",
      "PW": "Palau",
      "PA": "Pennsylvania",
      "PR": "Puerto Rico",
      "RI": "Rhode Island",
      "SC": "South Carolina",
      "SD": "South Dakota",
      "TN": "Tennessee",
      "TX": "Texas",
      "UT": "Utah",
      "VT": "Vermont",
      "VI": "Virgin Islands",
      "VA": "Virginia",
      "WA": "Washington",
      "WV": "West Virginia",
      "WI": "Wisconsin",
      "WY": "Wyoming"
    }

    state_data = []
    state_data_raw.forEach(e => {
      state_data = state_data.concat(e)
    });

    const parseTime = d3.timeParse("%Y-%m-%d")
    const parseMonth = d3.timeParse("%Y/%m");
    sf_formatMonth = d3.timeFormat("%Y/%m");

    let month_set = new Set();
    state_data = state_data.map(d => {
      var hashtags = d.hashtags.replace("[", "")
      hashtags = hashtags.replace("]", "")
      hashtags = hashtags.split(",")
      d = {
        name: d.screen_name,
        state: state_lookup[d.state.toUpperCase()],
        chamber: d.chamber,
        time: parseTime(d.time.split("T")[0]),
        toxicity: parseFloat(d.toxicity),
        severe_toxicity: parseFloat(d.severe_toxicity),
        obscene: parseFloat(d.obscene),
        threat: parseFloat(d.threat),
        insult: parseFloat(d.insult),
        identity_attack: parseFloat(d.identity_attack),
        hashtags: hashtags
      }
      month_set.add(d.time.getFullYear()+'/'+(d.time.getMonth()+1));
      return d
    })

    sf_month_arr = Array.from(month_set).map(d => parseMonth(d))
    //.sort((a, b) => a.getTime() - b.getTime())
    sf_date_start = sf_month_arr[0]
    sf_date_end = sf_month_arr[sf_month_arr.length-1]
    time_filter = [sf_date_start, sf_date_end]
    $('#state-time-label-1').text(sf_formatMonth(sf_date_start))
    $('#state-time-label-2').text(sf_formatMonth(sf_date_end))

    stateGraph = new StateColorGraph('#'+chart_id, parent_width, parent_height);
    stateGraph.wrangleData(map_data, state_data, $("#"+filter_id).val(), time_filter);
  
    $("#"+filter_id).on('change', function() {
      console.log("testing filter");
      stateGraph.wrangleData(map_data, state_data, this.value, [sf_date_start, sf_date_end]);
    });
  
    $("#date-slider").slider({
      range: true,
      max: sf_month_arr.length-1,
      min: 0,
      step: 1,
      values: [0, sf_month_arr.length-1],
      slide: function(event, ui) {
          sf_date_start = sf_month_arr[ui.values[0]]
          sf_date_end = sf_month_arr[ui.values[1]]
          $('#state-time-label-1').text(sf_formatMonth(sf_date_start))
          $('#state-time-label-2').text(sf_formatMonth(sf_date_end))
          stateGraph.wrangleData(map_data, state_data, $("#"+filter_id).val(), [sf_date_start, sf_date_end]);
        }
    })
  }