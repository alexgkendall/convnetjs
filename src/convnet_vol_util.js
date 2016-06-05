(function(global) {
  "use strict";
  var Vol = global.Vol; // convenience

  // Volume utilities
  // intended for use with data augmentation
  // crop is the size of output
  // dx,dy are offset wrt incoming volume, of the shift
  // fliplr is boolean on whether we also want to flip left<->right
  var augment = function(V, crop, dx, dy, fliplr) {
    // note assumes square outputs of size crop x crop
    if(typeof(fliplr)==='undefined') var fliplr = false;
    if(typeof(dx)==='undefined') var dx = global.randi(0, V.sx - crop);
    if(typeof(dy)==='undefined') var dy = global.randi(0, V.sy - crop);

    // randomly sample a crop in the input volume
    var W;
    if(crop !== V.sx || dx!==0 || dy!==0) {
      W = new Vol(crop, crop, V.depth, 0.0);
      for(var x=0;x<crop;x++) {
        for(var y=0;y<crop;y++) {
          if(x+dx<0 || x+dx>=V.sx || y+dy<0 || y+dy>=V.sy) continue; // oob
          for(var d=0;d<V.depth;d++) {
           W.set(x,y,d,V.get(x+dx,y+dy,d)); // copy data over
          }
        }
      }
    } else {
      W = V;
    }

    if(fliplr) {
      // flip volume horziontally
      var W2 = W.cloneAndZero();
      for(var x=0;x<W.sx;x++) {
        for(var y=0;y<W.sy;y++) {
          for(var d=0;d<W.depth;d++) {
           W2.set(x,y,d,W.get(W.sx - x - 1,y,d)); // copy data over
          }
        }
      }
      W = W2; //swap
    }
    return W;
  }

  // img is a DOM element that contains a loaded image
  // returns a Vol of size (W, H, 4). 4 is for RGBA
  var img_to_vol = function(img, convert_grayscale) {

    if(typeof(convert_grayscale)==='undefined') var convert_grayscale = false;

    var canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    var ctx = canvas.getContext("2d");

    // due to a Firefox bug
    try {
      ctx.drawImage(img, 0, 0);
    } catch (e) {
      if (e.name === "NS_ERROR_NOT_AVAILABLE") {
        // sometimes happens, lets just abort
        return false;
      } else {
        throw e;
      }
    }

    try {
      var img_data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    } catch (e) {
      if(e.name === 'IndexSizeError') {
        return false; // not sure what causes this sometimes but okay abort
      } else {
        throw e;
      }
    }

    // prepare the input: get pixels and normalize them
    var p = img_data.data;
    var W = img.width;
    var H = img.height;
    var pv = []
    for(var i=0;i<p.length;i++) {
      pv.push(p[i]); // DONT normalize image pixels to [-0.5, 0.5]
    }
    var x = new Vol(W, H, 4, 0.0); //input volume (image)
    x.w = pv;

    if(convert_grayscale) {
      // flatten into depth=1 array
      var x1 = new Vol(W, H, 1, 0.0);
      for(var i=0;i<W;i++) {
        for(var j=0;j<H;j++) {
          x1.set(i,j,0,x.get(i,j,0));
        }
      }
      x = x1;
    }
    else {
      // remove A channel
      var x1 = new Vol(W, H, 3, 0.0);
      for(var i=0;i<W;i++) {
        for(var j=0;j<H;j++) {
          for(var d=0;d<3;d++) {
            x1.set(i,j,d,x.get(i,j,d));
          }
        }
      }
      x = x1;
    }

    return x;
  }

  // img is a DOM element that contains a loaded image
  // returns a Vol of size (W, H, 4). 4 is for RGBA
  var vol_to_img = function(vol, colours, convert_grayscale) {

    if(typeof(convert_grayscale)==='undefined') var convert_grayscale = false;

    // Add alpha channel to image
    var vol_c = new Vol(vol.sx, vol.sy, 4, 0.0);
    for(var i=0;i<vol.sx;i++) {
      for(var j=0;j<vol.sy;j++) {
        var maxval = -99999;
        var maxid = -1;
        for(var d=0;d<vol.depth;d++) {
          if(vol.get(i,j,d) > maxval) {
            maxval = vol.get(i,j,d);
            maxid = d;
          }
        }
        vol_c.set(i,j,0, colours[maxid][0]);
        vol_c.set(i,j,1, colours[maxid][1]);
        vol_c.set(i,j,2, colours[maxid][2]);
        vol_c.set(i,j,3, colours[maxid][3]);
      }
    }

    var canvas_col = document.createElement('canvas');
    canvas_col.width = vol.sx;//img.width;
    canvas_col.height = vol.sy;//img.height;
    var ctx = canvas_col.getContext("2d");

    var u = new Uint8ClampedArray(vol_c.w)
    var img_data = new ImageData(u, canvas_col.width, canvas_col.height)
    ctx.putImageData(img_data , 0, 0)

    return canvas_col.toDataURL();
  }

  global.augment = augment;
  global.img_to_vol = img_to_vol;
  global.vol_to_img = vol_to_img;

})(convnetjs);
