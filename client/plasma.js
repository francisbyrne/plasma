var image_data = {};
var old_image_data = {};

Template.menu.is_fluid = function () {
  return Session.get('fluid_id');
};

Template.menu.is_pixelify = function () {
  return Session.get('pixelify_id');
};

// generate new fractal on mouse click
Template.fractal.events = {
  'click button#generate, keyup input#roughness, keyup input#pixelation': function (evt) {
    if (evt.type === "click" ||
        (evt.type === "keyup" && evt.which === 13)) {

      // get the roughness and pixelation inputs
      var roughness = $('#roughness').val();
      var pixelation = $('#pixelation').val();

      // generate a new fractal
      generate_new_fractal(roughness, pixelation);
    }
  },
  'click button#start-pixelify': function (evt) {
      // get the roughness, pixelation and frequency inputs
      var roughness = $('#roughness').val();
      var pixelation = $('#pixelation').val();
      var frequency = $('#frequency').val();

      // start pixelify mode
      start_pixelify(roughness, pixelation, frequency);
  },
  'click button#stop-pixelify': function (evt) {
      // stop fluid mode
      stop_pixelify();
  },
  'click button#go-fluid': function (evt) {
      // get the roughness, pixelation and frequency inputs
      var roughness = $('#roughness').val();
      var pixelation = $('#pixelation').val();
      var frequency = $('#frequency').val();

      // start fluid mode
      go_fluid(roughness, pixelation, frequency);
  },
  'click button#stop-fluid': function (evt) {
      // stop fluid mode
      stop_fluid();
  }
};

// generate new fractal on page load
Meteor.startup(function () {
  generate_new_fractal();
});

// randomly spew coloured pixels onto the canvas
var start_pixelify = function (roughness, pixelation, frequency) {
  var DEFAULT_FREQUENCY = 500; // 500ms
  var DEFAULT_PIXELATION = 1;

    // set default roughness/pixelation values if they don't exist 
  // or are invalid
  frequency = set_default(frequency, DEFAULT_FREQUENCY);
  pixelation = set_default(pixelation, DEFAULT_PIXELATION);

  var pixelify_id = Meteor.setInterval( function () {
    // generate_new_fractal(roughness, pixelation);
    mutate_fractal(pixelation);
  }, frequency);

  Session.set('pixelify_id', pixelify_id);
};

var stop_pixelify = function () {
  Meteor.clearInterval( Session.get('pixelify_id') );
  Session.set('pixelify_id', undefined);
};

var go_fluid = function (roughness, pixelation, frequency) {

  var DEFAULT_FREQUENCY = 500; // 500ms
  var DEFAULT_PIXELATION = 1;

    // set default roughness/pixelation values if they don't exist 
  // or are invalid
  frequency = set_default(frequency, DEFAULT_FREQUENCY);
  pixelation = set_default(pixelation, DEFAULT_PIXELATION);

  var fluid_id = Meteor.setInterval( function () {
    // generate_new_fractal(roughness, pixelation);
    mutate_fractal(pixelation);
  }, frequency);

  Session.set('fluid_id', fluid_id);
};

var stop_fluid = function () {
  Meteor.clearInterval( Session.get('fluid_id') );
  Session.set('fluid_id', undefined);
};


// generate a new fractal based on the canvas with id="fractal"
var generate_new_fractal = function (roughness_input, pixelation_input) {

  var DEFAULT_ROUGHNESS = 3;
  var DEFAULT_PIXELATION = 1; // 1px minimum pixel size

  // set default roughness/pixelation values if they don't exist 
  // or are invalid
  var roughness = set_default(roughness_input, DEFAULT_ROUGHNESS);
  var pixelation = set_default(pixelation_input, DEFAULT_PIXELATION);

  var context = create_canvas("fractal");

  // create image data array for storing pixels (currently using global variable)
  image_data = context.createImageData(context.canvas.width, context.canvas.height);
  
  // draw the fractal with given roughness and pixelation
  draw_plasma(context, roughness, pixelation);
  console.log(image_data);
};

// validate input to check that it is a number
var is_number = function (input) {
  var regex = /[0-9]|\./;
  return regex.test(input);
};

// takes canvas DOM id, clears it and returns the canvas context
var create_canvas = function (canvas_id) {
  // get canvas element
  var c = document.getElementById(canvas_id);
  var context = c.getContext("2d");

  // clear canvas
  clear_canvas(context);

  return context;
};

// helper method to clear the canvas
var clear_canvas = function (context) {
  // I have lots of transforms right now
  context.save();
  context.setTransform(1,0,0,1,0,0);
  // Will always clear the right space
  context.clearRect(0,0,context.canvas.width,context.canvas.height);
  context.restore();
  // Still have my old transforms
};

// this is something of a "helper function" to create an initial grid
// before the recursive function is called.  
var draw_plasma = function (context, roughness, pixelation) {
  var c1, c2, c3, c4;
  
  // assign the four corners of the intial grid random color values
  // these will end up being the colors of the four corners of the applet.   
  c1 = Math.random();
  c2 = Math.random();
  c3 = Math.random();
  c4 = Math.random();
      
  // call recursive method to divide the grid into four smaller grids and
  // at the base level (where grid is smaller than pixelation factor),
  // set the pixel colour semi-randomly, based on grid size and 
  // roughness factor.
  divide_grid(context, 
              0, 
              0, 
              context.canvas.width, 
              context.canvas.height, 
              c1, 
              c2, 
              c3, 
              c4, 
              pixelation, 
              roughness);

 // copy the image data back onto the canvas
  context.putImageData(image_data, 0, 0);
};

// this is the recursive function that implements the random midpoint
// displacement algorithm.  It will call itself until the grid pieces
// become smaller than one pixel.  
var divide_grid = function (context, x, y, width, height, c1, c2, c3, c4, pixel_size, roughness) {

  // check if grid size is greater than minimum pixel size 
  // (set by pixelation input)
  // if not, jump to base case, else recurse
  if (width > pixel_size || height > pixel_size) { 
    var edge1, edge2, edge3, edge4, middle;
    var new_width = width / 2;
    var new_height = height / 2;

    // randomly displace the midpoint based on the grid size and roughness factor
    middle = (c1 + c2 + c3 + c4) / 4 + displace(context, new_width + new_height, roughness);  
    edge1 = (c1 + c2) / 2;  //Calculate the edges by averaging the two corners of each edge.
    edge2 = (c2 + c3) / 2;
    edge3 = (c3 + c4) / 2;
    edge4 = (c4 + c1) / 2;
    
    // make sure that the midpoint doesn't accidentally "randomly displace" past the boundaries!
    if (middle < 0)
      middle = 0;
    else if (middle > 1.0)
      middle = 1.0;
    
    // do the operation over again for each of the four new grids.     
    divide_grid(context, x, y, new_width, new_height, c1, edge1, middle, edge4, pixel_size, roughness);
    divide_grid(context, x + new_width, y, new_width, new_height, edge1, c2, edge2, middle, pixel_size, roughness);
    divide_grid(context, x + new_width, y + new_height, new_width, new_height, middle, edge2, c3, edge3, pixel_size, roughness);
    divide_grid(context, x, y + new_height, new_width, new_height, edge4, middle, edge3, c4, pixel_size, roughness);

  } else {

    // this is the "base case," where each grid piece is less than the minimum pixelation factor.
    // the four corners of the grid piece will be averaged and drawn as a single pixel.
    var c = (c1 + c2 + c3 + c4) / 4;

    // get a colour object with red, green, blue and alpha properties
    var colour = compute_color(c);

    // for each row (y-value) and column (x-value) in the block set by pixelation factor, 
    // set the pixels to the random colour
    set_point(Math.floor(x), Math.floor(y), colour, pixel_size );
  }
};

// displaces a random point's colour and redraws the canvas
var mutate_fractal = function (pixel_size) {
  var context = create_canvas('fractal');

  old_image_data = image_data;

  var point = displace_random_point(context, pixel_size);

  context.putImageData(image_data,  0, 0);
};

// displace a random point's colour by a random amount
// takes canvas's context and pixel size and returns point
var displace_random_point = function (context, pixel_size) {
  var point = get_random_point(context, pixel_size);
  index = get_index(point);
  
  // console.log(index);
  // console.log(point);

  point.colour = displace_colour(point.colour);

  // console.log('displaced colour:');
  // console.log(point.colour);

  set_point(point.x, point.y, point.colour, pixel_size);

  return point;
};

var displace_colour = function (colour) {
  var multiplier = 255;
  colour.red = bound_value( colour.red + Math.floor((Math.random() - 0.5) * multiplier) );
  colour.green = bound_value( colour.green + Math.floor((Math.random() - 0.5) * multiplier) );
  colour.blue = bound_value( colour.blue + Math.floor((Math.random() - 0.5) * multiplier) );

  return colour;
};

// returns a random point on the canvas along with its colour
var get_random_point = function (context, pixel_size) {
  var point = {};
  var width = context.canvas.width / pixel_size - 1;
  var rand_x = Math.random()
  point.x = Math.round(rand_x * width) * pixel_size;
  var height = context.canvas.height / pixel_size - 1;
  var rand_y = Math.random();
  point.y = Math.round(rand_y * height) * pixel_size;
  point.colour = get_colour(point);

  return point;
};

// checks that a value doesn't exceed a max/min value and sets it to
// max/min if so
var bound_value = function (value, min, max) {
  min = (typeof min == 'undefined') ? 0 : min;
  max = (typeof max == 'undefined') ? 255 : max;
  if (value > max)
    value = max;
  else if (value < min)
    value = min;
  return value;
};


// check if value is a number and not 0.
// if so return integer value, else return default
var set_default = function (value, default_value) {
  return (is_number(value) && value != 0) ? parseInt(value) : default_value
};


// randomly displaces color value for midpoint depending on size
// of grid piece.
var displace = function (context, num, roughness) {
  num = (typeof num == 'undefined') ? 1 : num;
  roughness = (typeof roughness == 'undefined') ? 3 : roughness;
  var max = num / (context.canvas.width + context.canvas.height) * roughness;
  return (Math.random() - 0.5) * max;
};

// returns an rgba color object based on a color value between 0 and 1, c.
// eg. {red: 42, green: 71, blue: 255, alpha: 255}
var compute_color = function (c) {   
  var red = 0;
  var green = 0;
  var blue = 0;
  
  if (c < 0.5)
    red = c * 2;
  else
    red = (1.0 - c) * 2;
  
  if (c >= 0.3 && c < 0.8)
    green = (c - 0.3) * 2;
  else if (c < 0.3)
    green = (0.3 - c) * 2;
  else
    green = (1.3 - c) * 2;
  
  if (c >= 0.5)
    blue = (c - 0.5) * 2;
  else
    blue = (0.5 - c) * 2;
  
  return {'red': red * 255, 'green': green * 255, 'blue': blue * 255, 'alpha': 255};
};

// set the red, green, blue and alpha components of a pixel at x, y
// in the image_data array, which will be drawn to the canvas
var set_point = function (x, y, colour, pixel_size) {
  var index;
  pixel_size = (typeof pixel_size == 'undefined') ? 1 : pixel_size;
  
  for (i = 0; i < pixel_size; i++) {
    for (j = 0; j < pixel_size; j++) {
      index = ((x+j) + (y+i) * image_data.width) * 4;
      image_data.data[index+0] = colour.red;
      image_data.data[index+1] = colour.green;
      image_data.data[index+2] = colour.blue;
      image_data.data[index+3] = colour.alpha;
    }
  }
};

// return a colour object at x, y on the canvas
var get_colour = function (point) {
  var colour = {};
  var index = get_index(point);
  colour.red = image_data.data[index];
  colour.green = image_data.data[index+1];
  colour.blue = image_data.data[index+2];
  colour.alpha = image_data.data[index+3];

  return colour;
};

var get_index = function (point) {
  return (point.x + point.y * image_data.width) * 4;
};
