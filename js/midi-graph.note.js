(function(jQuery, app, undefined){
	var debug = true; //window.debug;

	// View functions
	
	jQuery.extend(app.views, {
		note: function(node, data) {
			var elem = jQuery(node);

			MIDI()
			.then(function(midi) {
				midi.on({ message: 'noteon', data1: data.number }, function(e) {
					elem
					.height(e.data2)
					.addClass('on');

					e.noteoff(function() {
						elem
						.height(0)
						.removeClass('on');
					});
				});
			});

			return elem;
		}
	});
})(jQuery, window.app_midi);