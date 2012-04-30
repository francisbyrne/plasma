var image_data = {};

Template.menu.is_fluid = function () {
  return Session.get('fluid_id');
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

var go_fluid = function (roughness, pixelation, frequency) {

  var DEFAULT_FREQUENCY = 500; // 500ms

    // set default roughness/pixelation values if they don't exist 
  // or are invalid
  if (is_number(frequency) && frequency != 0)
    frequency = parseInt(frequency);
  else
    frequency = DEFAULT_FREQUENCY;

  var fluid_id = Meteor.setInterval( function () {
    generate_new_fractal(roughness, pixelation);
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
  if (is_number(roughness_input) && roughness_input != 0)
    var roughness = parseInt(roughness_input);
  else
    var roughness = DEFAULT_ROUGHNESS;

  if (is_number(pixelation_input) && pixelation_input > 0)
    var pixelation = parseInt(pixelation_input);
  else
    var pixelation = DEFAULT_PIXELATION;

  // get canvas element
  var c = document.getElementById("fractal");
  var context = c.getContext("2d");

  // clear canvas
  clear_canvas(context);

  // create image data array for storing pixels (currently using global variable)
  image_data = context.createImageData(context.canvas.width, context.canvas.height);

  // draw the fractal with given roughness and pixelation
  draw_plasma(context, roughness, pixelation);
};

// validate input to check that it is a number
var is_number = function (input) {
  var regex = /[0-9]|\./;
  return regex.test(input);
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
    for (var i = 0; i < pixel_size; i++) {
      for (var j = 0; j < pixel_size; j++) {
      set_pixel(
        Math.floor(x) + j, 
        Math.floor(y) + i, 
        colour.red, 
        colour.green, 
        colour.blue, 
        colour.alpha, 
        pixel_size );
      }
    }
  }
};


// randomly displaces color value for midpoint depending on size
// of grid piece.
var displace = function (context, num, roughness) {
  var max = num / (context.canvas.width + context.canvas.height) * roughness;
  return (Math.random() - 0.5) * max;
};

// returns an rgba color object based on a color value, c.
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
function set_pixel(x, y, red, green, blue, alpha, pixel_size) {
  var index = (x + y * image_data.width) * 4;
  image_data.data[index+0] = red;
  image_data.data[index+1] = green;
  image_data.data[index+2] = blue;
  image_data.data[index+3] = alpha;
};
