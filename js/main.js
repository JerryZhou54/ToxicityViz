$(document).ready(function() {
  
  $('#filters-info-content').hide()
  $('#map-info-content').hide()
  $('#hashtag-info-content').hide()
  const promises = [
      d3.json('./data/states-10m.json'),
      d3.csv('data/part-00000-73761986-18e3-47be-9503-988fe22dcf99-c000.csv'),
      d3.csv('data/part-00001-73761986-18e3-47be-9503-988fe22dcf99-c000.csv')
       // Uncomment to use the full dataset
      /**
      d3.csv(
        "https://storage.googleapis.com/cse6242-team23-res/state_toxic_internal/p1.csv"
      ),
      d3.csv(
        "https:storage.googleapis.com/cse6242-team23-res/state_toxic_internal/p2.csv"
      ),
      d3.csv(
        "https:storage.googleapis.com/cse6242-team23-res/state_toxic_internal/p3.csv"
      ),
      d3.csv(
        "https:storage.googleapis.com/cse6242-team23-res/state_toxic_internal/p4.csv"
      ),
      d3.csv(
        "https:storage.googleapis.com/cse6242-team23-res/state_toxic_internal/p5.csv"
      ),
      d3.csv(
        "https:storage.googleapis.com/cse6242-team23-res/state_toxic_internal/p6.csv"
      ),
      d3.csv(
        "https:storage.googleapis.com/cse6242-team23-res/state_toxic_internal/p7.csv"
      ),
      d3.csv(
        "https:storage.googleapis.com/cse6242-team23-res/state_toxic_internal/p8.csv"
      ),
      d3.csv(
        "https:storage.googleapis.com/cse6242-team23-res/state_toxic_internal/p9.csv"
      )*/

  ];

  map_toggle = 0
  filter_toggle = 0
  hashtag_toggle = 0

  $( '#map-info' ).click(function(){

    this.innerHTML = (map_toggle == 1) ? 'Show Info': 'Hide Info';
    if (map_toggle == 1){
      $('#map-info-content').hide()
      this.innerHTML = 'Show Info';
      map_toggle = 0;
    }

    else {
      $('#map-info-content').show()
      this.innerHTML = 'Hide Info';
      map_toggle = 1
    }

  })

  $( '#filters-info' ).click(function(){

    this.innerHTML = (filter_toggle == 1) ? 'Show Info': 'Hide Info';
    if (filter_toggle == 1){
      $('#filters-info-content').hide()
      this.innerHTML = 'Show Info';
      filter_toggle = 0;
    }

    else {
      $('#filters-info-content').show()
      this.innerHTML = 'Hide Info';
      filter_toggle = 1
    }})

    $( '#hashtag-info' ).click(function(){

      this.innerHTML = (hashtag_toggle == 1) ? 'Show Info': 'Hide Info';
      if (hashtag_toggle == 1){
        $('#hashtag-info-content').hide()
        this.innerHTML = 'Show Info';
        hashtag_toggle = 0;
      }
      else {
        $('#hashtag-info-content').show()
        this.innerHTML = 'Hide Info';
        hashtag_toggle = 1
      }})

  Promise.all(promises).then(function(data) {

    run_state_map('country-map-card', 'links-filter', data[0], data.slice(1));

  }).catch(function (error) {
    console.log(error);
  });

});