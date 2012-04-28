
// randomly displaces color value for midpoint depending on size
// of grid piece.
var displace = function (context, num) {
  var max = num / (context.canvas.width + context.canvas.height) * 3;
  return (Math.random() - 0.5) * max;
};

// returns an rgb color object based on a color value, c.
// eg. {red: 42, green: 71, blue: 255}
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
  
  return {'red': red, 'green': green, 'blue': blue};
};

// generate a new fractal based on the canvas with id="fractal"
var generate_new_fractal = function () {
  var c = document.getElementById("fractal");
  var context = c.getContext("2d");
  draw_plasma(context);
};

// this is something of a "helper function" to create an initial grid
// before the recursive function is called.  
var draw_plasma = function (context) {
  var c1, c2, c3, c4;
  
  // assign the four corners of the intial grid random color values
  // these will end up being the colors of the four corners of the applet.   
  c1 = Math.random();
  c2 = Math.random();
  c3 = Math.random();
  c4 = Math.random();
      
  divide_grid(context, 0, 0, context.canvas.width , context.canvas.height , c1, c2, c3, c4, 5);
 // console.log(c1 + ", " + c1 + ", " + c2 + ", " + c3 + ", " + c4);

    Session.set('is_loading', undefined);
};

// this is the recursive function that implements the random midpoint
// displacement algorithm.  It will call itself until the grid pieces
// become smaller than one pixel.  
var divide_grid = function (context, x, y, width, height, c1, c2, c3, c4, pixel_size) {
  var edge1, edge2, edge3, edge4, middle;
  var new_width = width / 2;
  var new_height = height / 2;
  pixel_size = (typeof pixel_size !== 'undefined') ? pixel_size : 1;

  if (width > pixel_size || height > pixel_size) { 
    middle = (c1 + c2 + c3 + c4) / 4 + displace(context, new_width + new_height);  //Randomly displace the midpoint!
    edge1 = (c1 + c2) / 2;  //Calculate the edges by averaging the two corners of each edge.
    edge2 = (c2 + c3) / 2;
    edge3 = (c3 + c4) / 2;
    edge4 = (c4 + c1) / 2;
    
    //Make sure that the midpoint doesn't accidentally "randomly displaced" past the boundaries!
    if (middle < 0)
      middle = 0;
    else if (middle > 1.0)
      middle = 1.0;
    
    //Do the operation over again for each of the four new grids.     
    divide_grid(context, x, y, new_width, new_height, c1, edge1, middle, edge4, pixel_size);
    divide_grid(context, x + new_width, y, new_width, new_height, edge1, c2, edge2, middle, pixel_size);
    divide_grid(context, x + new_width, y + new_height, new_width, new_height, middle, edge2, c3, edge3, pixel_size);
    divide_grid(context, x, y + new_height, new_width, new_height, edge4, middle, edge3, c4, pixel_size);
  } else {
    //This is the "base case," where each grid piece is less than the size of a pixel.
    //The four corners of the grid piece will be averaged and drawn as a single pixel.
    var c = (c1 + c2 + c3 + c4) / 4;
    
    var colour = compute_color(c);
    var hex = rgb_to_hex(colour.red * 255, colour.green * 255, colour.blue * 255);
    context.fillStyle = hex;
    context.fillRect(x, y, pixel_size, pixel_size);
  }
};

// take RGB values and convert to a hex colour represenation.
// eg. (255, 0, 255) returns "FF00FF"
var rgb_to_hex = function (r, g, b) {
  return to_hex(r) + to_hex(g) + to_hex(b);
};

// converts a number (from 0 to 255) to hex (00 to FF)
function to_hex(n) {
  if (n==null) return "00";
  n = parseInt(n); 
  if (n == 0 || isNaN(n)) 
    return "00";
  n = Math.max(0, n); 
  n = Math.min(n, 255); 
  n = Math.round(n);
  return "0123456789ABCDEF".charAt( (n - n % 16) / 16) + "0123456789ABCDEF".charAt(n % 16);
};

// display loading gif
Template.loader.show = function () {
  console.log(Session.get('is_loading'));
  if (typeof Session.get('is_loading') !== 'undefined')
    return true;
  else
    return false
};

// generate new fractal on mouse click
Template.fractal.events = {
  'click button': function (evt) {
    Session.set('is_loading', 'hello');
    generate_new_fractal();
  }
};

// generate new fractal on page load
Meteor.startup(function () {
  Session.set('is_loading', 'hello');
  generate_new_fractal();
});