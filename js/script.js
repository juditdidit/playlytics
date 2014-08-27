$(function() {
	loadup();

	$('#search_field').autocomplete({
		source: function(request, response) {
			$.get('https://api.spotify.com/v1/search', {
				q: 'track:' + request.term,
				type: 'track'
			}, function(data) {
				response($.map(data.tracks.items, function(item) {
					return {
						label: item.name,
						id: item.id,
						duration: item.duration_ms,
						popularity: item.popularity
					};
				}));
			});
		},

		minLength: 3,
		select: function(event, ui) {
			var full_seconds = Math.round(ui.item.duration / 1000); // seconds
			song_duration = calc_duration(full_seconds);

			var list_item  = '<li class="song" data-id="' + ui.item.id + '"';
				list_item += 'data-name="' + ui.item.label + '"';
				list_item += 'data-duration="' + ui.item.duration + '"';
				list_item += 'data-popularity="' + ui.item.popularity + '">';
				list_item += '<div class="name">' + ui.item.label + '</div>';
				list_item += '<div class="popularity center">' + ui.item.popularity + '</div>';
				list_item += '<div class="duration center">' + song_duration + '</div>';
				list_item += '<div class="delete center"><i class="fa fa-times"></i></div>';
				list_item += '</li>';

			$('#songs ul').append(list_item);
			are_songs();
			calc_coolness();
			calc_total_duration();

			store();
		},

		open: function() {
			$( this ).addClass('open');
		},

		close: function() {
			$( this ).removeClass('open');
		}
	});

	// reorder songs
		$('#songs ul').sortable({
			revert: true
		});

		$('ul, li').disableSelection();

		$('#songs ul').on('sortstop', function() {
			store();
		});

	// add tags
		$('button').click(function() {
			add_tags($('input[name="tag"]').val());
			store();
		});

	// delete songs, tags
		$(document).on('click', '#songs li .delete', function() {
			$(this).closest('li').remove();
			
			are_songs();
			calc_total_duration();
			calc_coolness();
			store();
		});

		$(document).on('click', '.tags li', function() {
			$(this).remove();

			are_tags();
			store();
		});

	// rename playlist
		$('input[name="playlist_name"]').keyup(store);
}); // end document ready 

var playlist_duration = 0; // formatted 00:00
var song_duration = 0; // formatted 00:00

function store() { // saving to local storage 
	localStorage.setItem('saved_playlist_name', $('input[name="playlist_name"]').val());
	
	var saved_tags_str = $('#tags ul li').map(function() {
		return $(this).text();
	}).get().join(',');

	localStorage.setItem('saved_tags', saved_tags_str);

	var saved_songs_arr = [];
	$('#songs ul li').each(function() {
		
		var this_song = {
			name: $(this).data('name'),
			id: $(this).data('id'),
			duration: $(this).data('duration'),
			popularity: $(this).data('popularity')
		}

		saved_songs_arr.push(this_song);
	});

	saved_songs_str = JSON.stringify(saved_songs_arr);
	localStorage.setItem('saved_songs', saved_songs_str);
	
	console.log('I saved');

	$('#saved').addClass('show');
	setTimeout(function(){
		$('#saved').removeClass('show');
	},5000);
};

function loadup() { // grabbing from local storage 
	var saved_playlist_name = localStorage.getItem('saved_playlist_name');
	var saved_songs = localStorage.getItem('saved_songs');
	var saved_tags = localStorage.getItem('saved_tags');

	if (saved_playlist_name != null) {
		$('input[name="playlist_name"]').val(saved_playlist_name);
	}

	if (saved_tags != null) {
		add_tags(saved_tags);
	}

	if (saved_songs != null) {
		var all_songs = JSON.parse(saved_songs);

		var length = all_songs.length;

		for (var i = 0; i < length; i++) {
			var full_seconds = Math.round(all_songs[i].duration / 1000); // seconds
			song_duration = calc_duration(full_seconds);

			var list_item  = '<li class="song" data-id="' + all_songs[i].id + '"';
				list_item += 'data-name="' + all_songs[i].name + '"';
				list_item += 'data-duration="' + all_songs[i].duration + '"';
				list_item += 'data-popularity="' + all_songs[i].popularity + '">';
				list_item += '<div class="name">' + all_songs[i].name + '</div>';
				list_item += '<div class="popularity center">' + all_songs[i].popularity + '</div>';
				list_item += '<div class="duration center">' + song_duration + '</div>';
				list_item += '<div class="delete center"><i class="fa fa-times"></i></div>';
				list_item += '</li>';

			$('#songs ul').append(list_item);
		}
	}

	are_songs();
	are_tags();
	calc_coolness();
	calc_total_duration();

	console.log('I loaded everything');
};

function calc_duration(duration) {
	var minutes = Math.floor(duration / 60); // minutes
	var seconds = duration % 60; // remaining seconds

	if (seconds < 10) {
		seconds = '0' + seconds; // formatting seconds
	}

	return minutes + ":" + seconds;
};

function calc_total_duration() {
	var this_song_duration = 0;
	full_playlist_seconds = 0;

	$('#songs ul li').each(function() {
		this_song_duration = Math.round($(this).data('duration') / 1000);
		full_playlist_seconds += this_song_duration;
	});

	playlist_duration = calc_duration(full_playlist_seconds);
	$('#songs .playlist_stats .duration').text(playlist_duration);

	return full_playlist_seconds;
};

function calc_coolness() {
	var coolness = 0;
	var total_coolness = 0;
	var full_playlist_seconds = calc_total_duration();

	$('#songs ul li').each(function() {
		coolness = $(this).data('popularity');
		song_duration = $(this).data('duration') / 1000;
		total_coolness += (coolness * song_duration);
	});

	total_coolness = Math.round(total_coolness / full_playlist_seconds);

	if (isNaN(total_coolness)) {
		total_coolness = '\u2014';
	}

	$('#songs .playlist_stats .popularity').text(total_coolness);
};

function are_songs() {
	if ($('#songs ul li').length > 0) {
		$('#no_songs_added').addClass('hide');
	} else {
		$('#no_songs_added').removeClass('hide');
	}
}

function are_tags() {
	if ($('.tags ul li').length > 0) {
		$('#delete_tag_notice').addClass('show');
	} else {
		$('#delete_tag_notice').removeClass('show');
	}
}

function add_tags(tags) {
	var new_tags = tags;
			
	if (new_tags.length > 0) {
		new_tags = new_tags.split(',');

		var length = new_tags.length;

		for (var i = 0; i < length; i++) {
			$('<li>' + new_tags[i].trim() + '</li>').hide().appendTo($('.tags ul')).fadeIn();
		}

		are_tags();
		$('input[name="tag"]').val('');
	}
};