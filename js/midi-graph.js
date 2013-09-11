(function(undefined) {
	var defaults = {
	    	paddingLeft:  0.03125,
	    	paddingRight: 0.03125,
	    	paddingTop:   0.125,
	    	ease: 0.6667,
	    	fadeDuration: 3600,
	    	fadeLimit: 0,
	    	scale: 4.982,
	    	gridColor1: 'hsla(0, 0%, 80%, 0.24)',
	    	gridColor2: 'hsla(0, 0%, 80%, 0.12)'
	    };

	var colors = [
	    	[220, 56, 68, 1],
	    	[232, 57, 66, 1],
	    	[244, 58, 65, 1],
	    	[256, 60, 62, 1],
	    	[268, 60, 62, 1],
	    	[280, 61, 61, 1],
	    	[292, 62, 61, 1],
	    	[304, 58, 60, 1],
	    	[316, 62, 62, 1],
	    	[328, 64, 62, 1],
	    	[340, 66, 62, 1],
	    	[352, 68, 62, 1],
	    	[4,   71, 61, 1],
	    	[16,  74, 61, 1],
	    	[28,  77, 61, 1],
	    	[40,  80, 60, 1]
	    ];

	function isNote(data) {
		return data[0] > 127 && data[0] < 160 ;
	}

	function isControl(data) {
		return data[0] > 175 && data[0] < 192 ;
	}

	function returnChannel(data) {
		return data[0] % 16 + 1;
	}

	function now() {
		return window.performance.now();
	}

	function toHSL(h, s, l, a) {
		return ['hsla(', h, ',', s, '%,', l, '%,', a, ')'].join('');
	}

	function clearCanvas(ctx, set) {
		ctx.clearRect(0, 0, set.width, set.height);
	}

	function scaleCanvas(ctx, set) {
		ctx.setTransform(
			set.innerWidth / (128 * set.scale),
			0,
			0,
			set.innerHeight / 127,
			set.paddingLeft,
			set.paddingTop
		);

		ctx.lineJoin = 'round';
		ctx.lineCap = 'round';
	}

	function drawGrid(ctx, set) {
		ctx.save();
		ctx.lineWidth = 2;
		ctx.strokeStyle = set.gridColor1;
		ctx.beginPath();
		ctx.moveTo(0, set.paddingTop + 1);
		ctx.lineTo(set.width, set.paddingTop + 1);
		ctx.stroke();
		ctx.closePath();
		ctx.lineWidth = 2;
		ctx.strokeStyle = set.gridColor2;
		ctx.beginPath();
		ctx.moveTo(0, set.paddingTop + set.innerHeight / 2);
		ctx.lineTo(set.width, set.paddingTop + set.innerHeight / 2);
		ctx.stroke();
		ctx.closePath();
		ctx.restore();
	}

	function drawChannel(ctx, set, c) {
		var hsla = toHSL.apply(this, colors[c]);
		ctx.fillStyle = hsla;
		ctx.strokeStyle = hsla;
	}

	function drawStraightNote(ctx, set, n, v) {
		ctx.lineWidth = 1.5;
		ctx.fillRect(0.5 + n * set.scale, 127 - v, set.scale / 2, v);
		ctx.strokeRect(0.5 + n * set.scale, 127 - v, set.scale / 2, v);
	}

	function drawBentNote(ctx, set, n, v, p) {
		ctx.lineWidth = 1.5;
		ctx.beginPath();
		ctx.moveTo(0.5 + n * 4, 127);
		ctx.bezierCurveTo(0.5 + n * 4, 127 - v * 0.25,
						  0.5 + n * 4, 127 - v * 0.8,
						  0.5 + (n + p) * 4, 127 - v);
		// TODO: The angle of the bar top could be worked out better.
		ctx.lineTo(2.5 + (n + p) * 4, 127 - v + p / 6);
		ctx.bezierCurveTo(2.5 + n * 4, 127 - v * 0.8,
						  2.5 + n * 4, 127 - v * 0.25,
						  2.5 + n * 4, 127);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();
	}

	function drawNote(ctx, set, n, v, p) {
		return !!p ?
			drawBentNote(ctx, set, n, v, p) :
			drawStraightNote(ctx, set, n, v) ;
	}

	function drawControl(ctx, set, n, v, color) {
		ctx.save();
		ctx.strokeStyle = color;
		ctx.lineWidth = 1.5;
		ctx.beginPath();
		ctx.moveTo(1.5 + n * 4, 127);
		ctx.lineTo(1.5 + n * 4, 127 + 2.5 - v);
		ctx.arc(1.5 + n * 4, 127 - v, 2.5, 0.5 * Math.PI, 2.5 * Math.PI, false);
		ctx.stroke();
		ctx.closePath();
		ctx.restore();
	}

	function renderChannel(ctx, set, ch, state) {
		var array, n;

		drawChannel(ctx, set, ch);

		array = state.ccs;

		n = array.length;

		while(n--) {
			if (array[n] === undefined) { continue; }
			drawControl(ctx, set, n, array[n].data[2], array[n].color);
		}

		array = state.notesRender;
		n = array.length;

		while(n--) {
			if (!array[n]) { continue; }
			drawNote(ctx, set, n, array[n], state.pitch);
		}
	}

	function renderGraph(ctx, set, state) {
		var count = 16;

		ctx.save();
		clearCanvas(ctx, set);
		drawGrid(ctx, set);
		scaleCanvas(ctx, set);

		while (count--) {
			renderChannel(ctx, set, count, state[count]);
		}

		ctx.restore();
	}

	function renderNames(nodes, set, state) {
		var ch = 16,
		    active = [],
		    notes, n;

		while (ch--) {
			notes = state[ch].notes;
			n = notes.length;

			while (n--) {
				if (notes[n]) {
					active[n] = true;
				}
			}
		}

		n = active.length;

		while (n--) {
			if (active[n]) {
				nodes[n].classList.add('on');
			}
			else {
				nodes[n].classList.remove('on');
			}
		}
	}

	function createSettings(options, node) {
		var paddingLeft  = (options.paddingLeft || defaults.paddingLeft) * node.width;
		var paddingRight = (options.paddingRight || defaults.paddingRight) * node.width;
		var paddingTop   = (options.paddingTop || defaults.paddingTop) * node.height;
		var innerWidth   = node.width - paddingLeft - paddingRight;
		var innerHeight  = node.height - paddingTop;

		return {
			width:        node.width,
			height:       node.height,
			paddingLeft:  paddingLeft,
			paddingRight: paddingRight,
			paddingTop:   paddingTop,
			innerWidth:   innerWidth,
			innerHeight:  innerHeight,
			gridColor1:   options.gridColor1 || defaults.gridColor1,
			gridColor2:   options.gridColor2 || defaults.gridColor2,
			scale:        innerWidth / innerHeight
		};
	}

	function updateNoteRender(state, data) {
		var channel = returnChannel(data) - 1;
		var notesRender = state[channel].notesRender;
		var notesActual = state[channel].notes;
		var render  = notesRender[data[1]] || 0;
		var actual  = notesActual[data[1]];

		// Render value has reached actual value
		if (render === actual) {
			return false;
		}

		// Render value requires further iteration
		notesRender[data[1]] = (actual - render < 2) ?
			actual :
			render + (actual - render) * defaults.ease ;

		return true;
	}

	function updateCcColor(state, cc, now) {
		var channel = returnChannel(cc.data) - 1;
		var color = colors[channel];
		var fade = (defaults.fadeDuration - now + cc.time) / defaults.fadeDuration;

		if (fade < 0) {
			return false;
		}

		cc.color = toHSL(color[0], color[1] * fade, color[2], color[3] * (defaults.fadeLimit + (1 - defaults.fadeLimit) * fade));
		return true;
	}

	function updateNote(state, data) {
		state[returnChannel(data) - 1].notes[data[1]] = data[0] < 144 ? 0 : data[2] ;
	}

	function updateControl(state, data) {
		var obj = state[returnChannel(data) - 1].ccs[data[1]];

		if (!obj) {
			obj = {};
			state[returnChannel(data) - 1].ccs[data[1]] = obj;
		}

		obj.data = data;
		obj.time = now();
	}

	function MIDIGraph(options) {
		var graph = Object.create(Object.prototype);

		var node = options.node ?
				typeof options.node === 'string' ?
				document.querySelector(options.node) : 
				options.node :
				document.getElementById('midi-graph') ;

		var canvasNode = node.querySelector('.midi_canvas');
		var notesNode  = node.querySelector('.note_index');
		var noteNodes = notesNode.querySelectorAll('li');

		if (!canvasNode.getContext) {
			throw new Error('options.node must be a canvas element.');
		}

		var context = canvasNode.getContext('2d');
		var settings = createSettings(options, canvasNode);
		
		var state = [];
		var notes = [];
		var count = 16;
		var queued = false;

		function render(now) {
			var c = 16,
			    i, cc;

			queued = false;
			
			i = notes.length;

			// Look through updated notes to determine which ones need to
			// continue being animated.
			while (i--) {
				if (updateNoteRender(state, notes[i])) {
					queueRender();
				}
				else {
					notes.splice(i, 1);
				}
			}

			// Look through each channel's ccs to determine what still needs to
			// be animated.
			while (c--) {
				i = state[c].ccs.length;

				while (i--) {
					cc = state[c].ccs[i];

					if (!cc) { continue; }

					if (updateCcColor(state, cc, now)) {
						queueRender();
					}
				}
			}

			renderGraph(context, settings, state);
			renderNames(noteNodes, settings, state);
		}

		function queueRender() {
			if (queued === true) { return; }
			
			window.requestAnimationFrame(render);
			queued = true;
		}

		while (count--) {
			state[count] = {
				notesRender: [],
				notes: [],
				ccs: [],
				pitch: 0
			};
		}

		graph.in = function(e) {
			if (isNote(e.data)) {
				notes.push(e.data);
				updateNote(state, e.data, queueRender);
				queueRender(render);
				return;
			}

			if (isControl(e.data)) {
				updateControl(state, e.data);
				queueRender(render);
				return;
			}
		};

		return graph;
	}

	MIDIGraph.defaults = defaults;

	// Export the Node constructor
	if (this.window && !window.exports) {
		window.MIDIGraph = MIDIGraph;
	}
	else {
		module.name = 'midi-graph';
		exports = MIDIGraph;
	}
})();


// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel

// MIT license

(function() {
	var lastTime = 0;
	var vendors = ['ms', 'moz', 'webkit', 'o'];
	for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
		window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
		window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
								   || window[vendors[x]+'CancelRequestAnimationFrame'];
	}
	
	if (!window.requestAnimationFrame)
		window.requestAnimationFrame = function(callback, element) {
			var currTime = new Date().getTime();
			var timeToCall = Math.max(0, 16 - (currTime - lastTime));
			var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
			  timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};
	
	if (!window.cancelAnimationFrame)
		window.cancelAnimationFrame = function(id) {
			clearTimeout(id);
		};
}());