$(document).ready(function(){
  $('.spinner').show();
  getTorrents();
  setInterval(function() {
     getTorrents();
  }, 4000);

  // Torrent button ajax load
  $(document.body).off('click', '#torrents .torrent-action a');
  $(document.body).on('click', '#torrents .torrent-action a', function(event) {
    event.preventDefault();

    // set spinner inside button
    $(this).html('<i class="icon-spinner icon-spin"></i>');

    // do ajax request
    $.ajax({
      url: $(this).attr('href'),
      success: function(response) {
        // Refresh torrent list after successfull request with a tiny delay
        if (response.result == 'success') {
          window.setTimeout(getTorrents, 500);
        }
      }
    });
  });
});

function getTorrents(){
  $.ajax({
    'url': WEBDIR + 'utorrent/torrents',
    'success': function(response){
      if (response.result == 200) {
        $('#torrents').html('');
        var dl_speed_sum=up_speed_sum=0;
        $.each(response.torrents, function(index, torrent){
          tr = $('<tr>');

          dl_speed_sum += torrent.dl_speed;
          up_speed_sum += torrent.up_speed;

          var progressBar = $('<div>');
          progressBar.addClass('bar');
          progressBar.css('width', (torrent.percentage_done/10.) + '%');

          var  progress = $('<div>');
          progress.addClass('progress');
          if (torrent.percentage_done >= 1) {
            progress.addClass('progress-success');
          }
          progress.append(progressBar);

          // Round to 2 decimals
          ratio = Math.round(torrent.ratio*100) / 100;

          // Button group
          buttons = $('<div>').addClass('btn-group');

          // Action button (pause or resume)
          actionButton = generateTorrentActionButton(torrent);
          buttons.append(actionButton);

          // Remove button
          removeButton = $('<a>').
            addClass('btn btn-mini').
            html('<i class="icon-remove"></i>').
            attr('href', WEBDIR + 'utorrent/remove/' + torrent.id).
            attr('title', 'Remove torrent');
          buttons.append(removeButton);

          tr.append(
            $('<td>').html(torrent.name
              +'<br><small><i class="icon-long-arrow-down"></i> ' + getReadableFileSizeString(torrent.dl_speed)
              +'/s <i class="icon-long-arrow-up"></i> ' + getReadableFileSizeString(torrent.up_speed) + '/s</small>'
            ),
            $('<td>').text(ratio),
            $('<td>').text(getReadableTime(torrent.eta)),
            $('<td>').text(getStatusInfo(torrent)),
            $('<td>').addClass('span3').html(progress),
            $('<td>').addClass('torrent-action').append(buttons)
          );
          $('#torrents').append(tr);
        });
        $('#queue_download').text(getReadableFileSizeString(dl_speed_sum) + '/s');
        $('#queue_upload').text(getReadableFileSizeString(up_speed_sum) + '/s');
        $('.spinner').hide();
      }
    }
  });
}

function generateTorrentActionButton(torrent) {
  button = $('<a>').addClass('btn btn-mini');
  // Resume button if torrent is paused
  if (getStatusInfo(torrent).toLowerCase() == "paused") {
    button.html('<i class="icon-play"></i>');
    button.attr('href', WEBDIR + 'utorrent/start/' + torrent.id);
    button.attr('title', 'Resume torrent');
  } else { // Pause button
    button.html('<i class="icon-pause"></i>');
    button.attr('href', WEBDIR + 'utorrent/stop/' + torrent.id);
    button.attr('title', 'Pause torrent');
  }

  return button;
}

/**
 * Converts bytes to readable filesize in kb, MB, GB etc.
 */
function getReadableFileSizeString(fileSizeInBytes) {
    var i = -1;
    var byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB'];
    do {
        fileSizeInBytes = fileSizeInBytes / 1024;
        i++;
    } while (fileSizeInBytes > 1024);
    return Math.round(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i];
};

/**
 * Converts seconds to readable time.
 */
function getReadableTime(timeInSeconds) {
  if (timeInSeconds < 1) {
    return '0:00:00';
  }

  var days = parseInt( timeInSeconds / 86400 ) % 7;
  var hours = parseInt( timeInSeconds / 3600 ) % 24;
  var minutes = parseInt( timeInSeconds / 60 ) % 60;
  var seconds = parseInt(timeInSeconds % 60);

  // Add leading 0 and : to seconds
  seconds = ':'+ (seconds  < 10 ? "0" + seconds : seconds);

  if (days < 1) {
    days = '';
  } else {
    days = days + 'd ';
    // remove seconds if the eta is 1 day or more
    seconds = '';
  }
  return days + hours + ":" + (minutes < 10 ? "0" + minutes : minutes) + seconds;
};


function getStatusInfo(torrent) {
    var status = eval(torrent.status);
    var status = [];
    if (status.indexOf(32)){
        return "Paused";
    } else {
        if (status.indexOf(1)) {
            return (torrent.percentage_done == 1000) ? "Seeding" : "Downloading";
        } else {
            if (status.indexOf(8)) {
                return "Checked";
            } else {
                if (status.indexOf(16)) {
                    return "Error";
                } else {
                    if (status.indexOf(64)) {
                        return "Queued";
                    } else {
                        if (torrent.percentage_done == 1000) {
                            return "Finished";
                        } else {
                            return "Incomplete";
                        }
                    }
                }
            }
        }
    }
}