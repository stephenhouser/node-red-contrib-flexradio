<style>
	svg .path {
		fill: none;
	}
	
	.data_line {
	  fill: none;
	  stroke: #000;
	  stroke-width: 1.5px;
	}
	
	.axis--y, .axis--x {
		stroke: white !important;
		color: lightgray !important;
		font-size: 14pt;
		font-weight: lighter;
		fill: #032734 !important;
	}
	
	path.domain {
		fill: none !important;
	}
	
	.panadapter-background {
		background-image: linear-gradient(#042432, #083c59);    
	}

	.flag-background {
		background-image: linear-gradient(#042432, #083c59);    
	}
	
	.grid .tick line {
		stroke: lightgrey;
		opacity: 0.3;
	}
	.grid path {
		  stroke-width: 0;
	}
	
	.svg-container {
		height: 100%;
		width: 100%;
		overflow: hidden;
	} 
	
</style>
<div id='container' class="svg-container">
</div>

<script>
	function PanadapterFlag(config) {
		
		var frequency = 7.200;
        var flag_x = 360;
		var text_node = null;
		var bandwidth = .2
		var box_x = flag_x - 180
		var ssb_x = 0
		var ssb_w = 20
		function flag(selection) {

			selection.each(function(d, i) {
				const svg = d3.select(this);

				svg.classed('panadapter-flag', true);

    			flag_node = svg.append("line")
    				.style("stroke", "yellow")
		            .style("stroke-width", 2)    				
    				.attr("x1", flag_x)
    				.attr("y1", 50)
    				.attr("x2", flag_x)
    				.attr("y2", 700);
    				
				box_node = svg.append("rect")
					.attr("x", box_x)
					.attr("y", 10)
					.attr("height", 40)
					.attr("width", 180)
					.attr("fill", "lightgrey")
					.attr("fill-opacity", 0.1)
					.style("stroke", "yellow");
					
				ssb_node = svg.append("rect")
					.attr("x", ssb_x)
					.attr("y", 10)
					.attr("height", 700)
					.attr("width", ssb_w)
					.attr("fill", "lightgrey")
					.attr("fill-opacity", 0.2)
					.style("stroke", "lightgrey")					
		            .style("stroke-width", .1);  
				text_node = svg.append("text")
					.attr("x", -85)
					.attr("y", 40)
					.attr("fill", "yellow")
					.attr("font-size", "28px")
					.text(frequency);
			});
		}
	
		flag.frequency = function(value) {

			if (!arguments.length) {
				return flag;
			}
	
			frequency = value;

			if (text_node) {
				text_node.text((frequency * 1000).toFixed(2) +" mhz") ;
			}
	
			return flag;
		}
	    
	    flag.freq_x = function(value) {

			if (!arguments.length) {
				return flag;
			}
	
			flag_x = value;
			box_x = value - 180;
			text_x = value - 175;
			ssb_x = value;
			ssb_w = 20
            if(value < 0){
                box_x = value;
                text_x = value + 5;
            }
   
			if (box_node) {
				box_node.attr("x",box_x) ;
			}
			if (ssb_node) {
                ssb_node.attr("x",ssb_x) ; 
				ssb_node.attr("width", ssb_w)			
			}
			if (text_node) {
				text_node.attr("x",text_x) ;
			}			
			if (flag_node) {
				flag_node.attr("x1",flag_x) ;
				flag_node.attr("x2",flag_x) ;				
			}	
			return flag;
		}
        flag.bw = function(value,mode,loc) {

			if (!arguments.length) {
				return flag;
			}
			ssb_x = loc
			ssb_w = (1 / value) * 2
			
	        if(mode == "lsb"){
			    ssb_x = loc - ssb_w
            }else if(mode == "usb"){
			    ssb_x = loc;            
            }else if(mode == "cw"){
			    ssb_x = loc - (ssb_w / 2);			
			}	        

			if (ssb_node) {
				ssb_node.attr("width", ssb_w)
                ssb_node.attr("x",ssb_x) ; 				
			}
	
			return flag;
		}

		return flag;
	}	

	
	function Panadapter(config) {
		var margin = {top: 10, right: 50, bottom: 50, left: 10 };
		var width = 600;
		var height = 600;
		var xScale = d3.scaleLinear();
		var yScale = d3.scaleLinear();
		
		var x_axis = null;
		var y_axis = null;
		
		let settings = { 
			samples: 512, 
			range: 512, 
			center: 7.2, 
			bandwidth: 0.2, 
			min_dbm: -120, 
			max_dbm: -60,
			rx_freq: 360,
			mode: "lsb"
		};
	

		function make_x_axis(selection) {
			selection.each(function(d, i) {
				const g = d3.select(this);
				g.attr('class', 'axis');
				g.selectAll('g').remove();

				scaleXAxis = d3.scaleLinear()
					.domain([settings.center - (settings.bandwidth/2), settings.center + (settings.bandwidth/2)])
					.range([0, width]);
	
				g.append("g")
				    .attr("class", "axis axis--x")
					.attr("transform", "translate(0," + height + ")")
					.call(d3.axisBottom(scaleXAxis));
	
				g.append("g")
					.attr("class", "grid")
					.call(d3.axisBottom(scaleXAxis)
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
				scaleYAxis = d3.scaleLinear()
						.domain([settings.min_dbm, settings.max_dbm])
						.range([height, 0]);
	
				g.append('g')
				    .attr("class", "axis axis--y")
					.attr("transform", "translate(" + width + ", 0)")
					.call(d3.axisRight(scaleYAxis));
	
				g.append("g")
					.attr("class", "grid")
					.call(d3.axisRight(scaleYAxis)
						.tickSize(width))
					.call(g => g.select(".domain")
						.remove())
					.call(g => g.selectAll(".tick text")
						.remove());
			});
		}


		function pan(selection) {
			selection.each(function(d, i) {
				settings = { ...config, ...settings };
	
				const svg = d3.select(this);
				width = 790 - margin.left - margin.right;
				height = 600 - margin.top - margin.bottom;

				xScale.domain([0, settings.samples - 1]).range([0, width]);
				yScale.domain([0, settings.range]).range([height, 0]);

				const g = svg.append("g")
					.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	
				g.append("defs").append("clipPath")
					.attr("id", "clip")
					.append("rect")
					.attr("width", width)
					.attr("height", height);
	
				x_axis = g.append("g").call(make_x_axis);
				y_axis = g.append("g").call(make_y_axis);
	
				data_line = g.append('g')
					.attr('clip-path', 'url(#clip)')
					.append('path')
						.attr('class', 'data');
				
				flag = PanadapterFlag();
				g.append("g")
					.attr('id', 'pan1')
					.attr("transform", "translate(" + settings.rx_freq + ", 0)")
					.call(flag);	

	
			});
		}		
		pan.config = function(config) {
			settings = { ...settings, ...config };
			xScale.domain([0, settings.samples - 1]).range([0, width]);
			yScale.domain([0, settings.range]).range([height, 0]);
			flag.frequency(settings.freq);
			x_axis.call(make_x_axis);
			y_axis.call(make_y_axis);
			flag.freq_x(config.rx_freq);
			flag.bw(config.bandwidth,settings.mode,config.rx_freq);
		};
	

	
		pan.margin = function(value) {
			if (!arguments.length) {
				return margin;
			}
	
			margin = value;
			return pan;
		};
	
		pan.data = function(data) {
			const lineGenerator = d3.area()
				.x(function(d, i) { return xScale(i); })
				.y0(function(d, i) { return yScale(settings.range - d); })
				.y1(yScale(0));
	
			const dp = lineGenerator(data);
			data_line
				.attr("d", dp)
				.style('fill', "#a3eafa77")
				.style("stroke", "white")
				.transition()
				.duration(100)
				.ease(d3.easeLinear);
	
			return pan;
		};
	
		return pan;
	}
	
	function pan_main(scope) {
		function make_panadapter(config) {
			const pan = Panadapter(config)
				.margin({top: 10, left: 10, bottom: 50, right: 50})
	
			var svg = d3.select("div#container")
			    .classed('svg-container', true)
				.append("svg")
				.attr("preserveAspectRatio", "none")
				.attr("viewBox", "0 0 800 600")
				.attr("height", "100%")
				.attr("width", "100%")
				.attr("class", "panadapter-background")
				.classed("svg-content", true)
				.call(pan)

			return pan;
		}

		const timer = setInterval(function() {
			if (window.d3) {
				clearInterval(timer);
	
				const pan = make_panadapter({samples: 100, range: 100});
				scope.$watch('msg', function (msg) {
					if (msg) {
						if (msg.config) {
						    pan.config(msg.config);
						} else {
							pan.data(msg.payload.data);
						}
					}
				});
			}
		}, 1000);
	}
	
	pan_main(scope);
</script>