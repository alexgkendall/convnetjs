(function(global) {
  "use strict";
  var Vol = global.Vol; // convenience

  var UnPoolLayer = function(opt) {

    var opt = opt || {};

    // required
    this.sx = opt.sx; // filter size
    this.pool = opt.pool; // pool layer
    this.in_depth = opt.in_depth;
    this.in_sx = opt.in_sx;
    this.in_sy = opt.in_sy;

    // optional
    this.sy = typeof opt.sy !== 'undefined' ? opt.sy : this.sx;
    this.stride = typeof opt.stride !== 'undefined' ? opt.stride : 2;
    this.pad = typeof opt.pad !== 'undefined' ? opt.pad : 0; // amount of 0 padding to add around borders of input volume

    // computed
    this.out_depth = this.in_depth;
    this.out_sx = Math.floor((this.in_sx + this.pad * 2 - this.sx + 2) * this.stride );
    this.out_sy = Math.floor((this.in_sy + this.pad * 2 - this.sy + 2) * this.stride );
    this.layer_type = 'unpool';
  }

  UnPoolLayer.prototype = {
    forward: function(V, is_training, poolindicies) {
      this.in_act = V;

      var A = new Vol(this.out_sx, this.out_sy, this.out_depth, 0.0);

      var indicies = poolindicies.pop();
      //console.log(indicies.switchx.length)

      var n=0; // a counter for switches
      for(var d=0;d<this.out_depth;d++) {
        var x = -this.pad;
        var y = -this.pad;
        for(var ax=0; ax<this.out_sx; x+=this.stride,ax++) {
          y = -this.pad;
          for(var ay=0; ay<this.out_sy; y+=this.stride,ay++) {

            var v = V.get(ax, ay, d);
            var winx = indicies.switchx[n];
            var winy = indicies.switchy[n];
            n++;

            var oy = y+winy;
            var ox = x+winx;

            A.set(ox, oy, d, v);
          }
        }
      }
      this.out_act = A;
      return this.out_act;
    },
    getParamsAndGrads: function() {
      return [];
    },
    toJSON: function() {
      var json = {};
      json.sx = this.sx;
      json.sy = this.sy;
      json.stride = this.stride;
      json.in_depth = this.in_depth;
      json.out_depth = this.out_depth;
      json.out_sx = this.out_sx;
      json.out_sy = this.out_sy;
      json.layer_type = this.layer_type;
      json.pad = this.pad;
      return json;
    },
    fromJSON: function(json) {
      this.out_depth = json.out_depth;
      this.out_sx = json.out_sx;
      this.out_sy = json.out_sy;
      this.layer_type = json.layer_type;
      this.sx = json.sx;
      this.sy = json.sy;
      this.stride = json.stride;
      this.in_depth = json.in_depth;
      this.pad = typeof json.pad !== 'undefined' ? json.pad : 0; // backwards compatibility
    }
  }

  global.UnPoolLayer = UnPoolLayer;

})(convnetjs);
