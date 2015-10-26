<waypoint>
<div each={ opts.waypoints }>
  <div class='waypoint row'>
    <div class='waypoint-distance large-3 column'>
      <div class='row total-distance'>
        <div class="large-12 column">
          {this.totalDistance}
        </div>
      </div>
      <div class='row relative-distance'>
        <div class="large-12 column">
          {this.relativeDistance}
        </div>
      </div>
    </div>
    <div class='waypoint-tulip large-5 column'>
      Tulip
    </div>
    <div class='waypoint-notes large-4 column'>
      {this.notes}
    </div>
  </div>
</div>
</waypoint>
