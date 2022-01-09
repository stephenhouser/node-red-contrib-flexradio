function format_frequency(frequencyMhz) {
	const mHz = parseInt(frequencyMhz);
	const kHz = parseInt((frequencyMhz * 1000) % 1000);
	const Hz  = parseInt((frequencyMhz * 1000000) % 1000);

	function pad3(n) {
		const pad = '000' + n;
		return pad.substring(pad.length - 3);
	}

	return `${mHz}.${pad3(kHz)}.${pad3(Hz)}`;
}

function Panadapter(config) {
	var margin = {top: 10, right: 50, bottom: 50, left: 10 };
	var width = 1024;
	var height = 768;
	var xScale = d3.scaleLinear();
	var yScale = d3.scaleLinear();
	var xFrequencyScale = d3.scaleLinear();
	var yDbmScale = d3.scaleLinear();
	
	var x_axis = null;
	var y_axis = null;
	
	var settings = { 
		x_pixels: 50, 
		y_pixels: 20, 
		center: 14.074, 
		bandwidth: 0.02, 
		min_dbm: -130, 
		max_dbm: -40,
		tx: 'off',
		slice: 'A',
		rxant: 'ANT1',
		txant: 'ANT1',
		frequency: 14.074,
		filter_width: 0.003
	};

	function make_x_axis(selection) {
		selection.each(function(d, i) {
			const g = d3.select(this);
			g.attr('class', 'axis');
			g.selectAll('g').remove();

			xFrequencyScale
				.domain([settings.center - (settings.bandwidth/2), 
						settings.center + (settings.bandwidth/2)])
				.range([0, width]);

			g.append("g")
				.attr("class", "axis axis--x")
				.attr("transform", "translate(0," + height + ")")
				.call(d3.axisBottom(xFrequencyScale));

			g.append("g")
				.attr("class", "grid")
				.call(d3.axisBottom(xFrequencyScale)
					.tickSize(height))
				.call(g => g.select(".domain")
					.remove())
				.call(g => g.selectAll(".tick text")
					.remove());
					
		});
	}

	function make_y_axis(selection) {
		selection.each(function(d, i) {
			const g = d3.select(this);
			g.attr('class', 'axis');
			g.selectAll('g').remove();

			// Y Axis
			yDbmScale
					.domain([settings.min_dbm, settings.max_dbm])
					.range([height, 0]);

			g.append('g')
				.attr("class", "axis axis--y")
				.attr("transform", "translate(" + width + ", 0)")
				.call(d3.axisRight(yDbmScale));

			g.append("g")
				.attr("class", "grid")
				.call(d3.axisRight(yDbmScale)
					.tickSize(width))
				.call(g => g.select(".domain")
					.remove())
				.call(g => g.selectAll(".tick text")
					.remove());
		});
	}

	function transform(x, y, scale = 1) {
		return `translate(${x*scale}, ${y*scale}) scale(${scale})`;
	}

	function make_flag(selection) {
		selection.each(function(d, i) {
			const g = d3.select(this);
			g.attr('class', 'panadapter-flag');
			g.selectAll('g').remove();

			const pole = g.append("g");
			pole.append("rect")
				.attr("class", "filter-width")
				.attr("x", 0).attr("y", 0)
				.attr("width", 20).attr("height", height);

			pole.append("line")
				.attr("class", "flagpole")
				.attr("x1", 0)
				.attr("y1", 0)
				.attr("x2", 0)
				.attr("y2", height);
			
			pole.append("polyline")
				.attr("class", "flag")
				.attr('points', "-9 0, 9 0, 0 18")

			// background
			const flag_w = 105;
			const flag_h = 35;
			flag_box = g.append('g')
				.attr("x", 0)
				.attr("y", 0)
				.attr("transform", transform(-flag_w - 5, 5, 2));

			flag_box.append("rect")
				.attr("class", "background")
				.attr("x", 0).attr("y", 0)
				.attr("width", flag_w).attr("height", flag_h)

			// rx ant
			flag_box.append("text")
				.attr("class", "ant rx-ant")
				.attr("x", 5).attr("y", 10)
				.text("ANT1");

			// tx ant
			flag_box.append("text")
				.attr("class", "ant tx-ant")
				.attr("x", 35).attr("y", 10)
				.text("ANT1");

			// TX status
			const tx = flag_box.append("g")
				.attr("class", "tx-state");

			tx.append("rect")
				.attr("x", 66).attr("y", 1)
				.attr("width", 23).attr("height", 14)
				.attr("rx", 2).attr("ry", 2)

			tx.append("text")
				.attr("x", 67).attr("y", 14)
				.text("TX");

			// slice letter
			const slice = flag_box.append("g")
				.attr("class", "slice");

			slice.append("rect")
				.attr("x", 90).attr("y", 1)
				.attr("width", 13).attr("height", 14)
				.attr("rx", 2).attr("ry", 2)

				slice.append("text")
					.attr("x", 90).attr("y", 14)
					.text("A");

			// frequency
			flag_box.append("text")
				.attr("class", "frequency")
				.attr("x", flag_w - 2).attr("y", 30)
				.text('888.888.888');
		});
	}

	function pan(selection) {
		selection.each(function(d, i) {
			//   debugger;
			// setting the pan does not use underscores, but the report does
			if (config) {
				if (config.xpixels) {
					config.x_pixels = config.xpixels;
					delete config.xpixels;
				}
				if (config.ypixels) {
					config.y_pixels = config.ypixels;
					delete config.ypixels;
				}
			}
			
			settings = { ...settings, ...config };

			const svg = d3.select(this);
			width = 1024 - margin.left - margin.right;
			height = 768 - margin.top - margin.bottom;

			xScale.domain([0, settings.x_pixels - 1]).range([0, width]);
			yScale.domain([0, settings.y_pixels]).range([height, 0]);

			const g = svg.append("g")
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

			g.append("defs").append("clipPath")
				.attr("id", "clip")
				.append("rect")
				.attr("width", width)
				.attr("height", height);

			x_axis = g.append("g").call(make_x_axis);
			y_axis = g.append("g").call(make_y_axis);
			flag   = g.append("g").call(make_flag);

			data_line = g.append('g')
				.attr('clip-path', 'url(#clip)')
				.append('path')
					.style('fill', "#a3eafa77")
					.style("stroke", "white")
					.attr('class', 'data');

			pan.frequency(settings.center);
			pan.filter_width(settings.filter_width);

			pan.rxant(settings.rxant);
			pan.txant(settings.txant);
			pan.tx(settings.tx);
		});
	}
	
	pan.slice = function(slice) {
		//debugger;
		pan.frequency(slice.RF_frequency)		    
		pan.filter_width(slice.filter_hi/1000);
		pan.rxant(slice.rxant);
		pan.txant(slice.txant);
	}
	
	pan.config = function(display_pan) {
		if (!arguments.length) {
			return settings;
		}
		
		//  debugger;
		if (display_pan && display_pan.xpixels) {
			display_pan.x_pixels = display_pan.xpixels;
			delete display_pan.xpixels;
		}
		
		if (display_pan && display_pan.ypixels) {
			display_pan.y_pixels = display_pan.ypixels;
			delete display_pan.ypixels;
		}
			
		settings = { ...settings, ...display_pan };

		xScale.domain([0, settings.x_pixels - 1]).range([0, width]);
		yScale.domain([0, settings.y_pixels]).range([height, 0]);
		
		x_axis.call(make_x_axis);
		y_axis.call(make_y_axis);

		pan.frequency(settings.center);
		pan.rxant(settings.rxant);
		pan.filter_width(settings.filter_width);

		return pan;
	};

	pan.data = function(data) {
		//  debugger;
		const lineGenerator = d3.area()
			.x(function(d, i) { return xScale(i); })
			.y0(function(d, i) { return yScale(settings.y_pixels - d); })
			.y1(yScale(0));

		const dp = lineGenerator(data);
		data_line
			.attr("d", dp)
			.transition()
			// .duration(100)
			// .ease(d3.easeLinear);

		return pan;
	};

	pan.frequency = function(new_frequency) {	
		if (!arguments.length) {
			return settings.frequency;
		}

		settings.frequency = new_frequency;

		// TODO: if flag is too close to left edge swap sides
		const flag_x = xFrequencyScale(settings.frequency);
		flag.attr("transform", "translate(" + flag_x + ", 0)");

		// update flag
		const freq = flag.select('text.frequency');
		freq.text(format_frequency(new_frequency));

		return pan;
	};

	pan.rxant = function(new_ant) {
		if (!arguments.length) {
			return settings.rxant;
		}

		settings.rxant = new_ant.slice(0,4).toUpperCase();

		const ant = flag.select('text.rx-ant');
		ant.text(settings.rxant);

		return pan;
	}

	pan.txant = function(new_ant) {
		if (!arguments.length) {
			return settings.tx_ant;
		}

		settings.txant = new_ant.slice(0,4).toUpperCase();

		const ant = flag.select('text.tx-ant');
		ant.text(settings.txant);

		return pan;
	}

	pan.filter_width = function(new_width) {
		if (!arguments.length) {
			return settings.filter_width;
		}

		settings.filter_width = new_width;
		const filter = flag.select('rect.filter-width');
		const pixel_width = xFrequencyScale(settings.center + parseFloat(settings.filter_width)) - xFrequencyScale(settings.center);
		filter.attr("width", pixel_width);

		return pan;
	}

	pan.tx = function(new_tx) {
		if (!arguments.length) {
			return settings.tx;
		}

		settings.tx = new_tx;
		const tx = flag.select('.tx-state');
		tx.classed('off', function() { 
			return !settings.tx || settings.tx === 'off'
		});

		return pan;
	}

	pan.margin = function(value) {
		if (!arguments.length) {
			return margin;
		}

		margin = value;
		return pan;
	};
	
	return pan;
}
