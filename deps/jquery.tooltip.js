/*
 * popup tooltip - jQuery plugin
 * should also attach corresponding tooltip.css
 *
 * Copyright (c) 2011 zolunX10
 *
 * Licensed under the MIT license:
 *   http://www.opensource.org/licenses/mit-license.php
 *
 * Version:  1.0.0
 *
 */
(function ($) {
  $.fn.tooltip = function (options) {
    var tooltip = new Tooltip(options);
    var hoverIn = options.hoverIn || function () {
      },
      hoverOut = options.hoverOut || function () {
      };
    $(this).hover(function (e) {
      e = $.event.fix(e);
      hoverIn.call(this, e);
      tooltip.show(e.pageX, e.pageY);
    },function (e) {
      hoverOut.call(this, e);
      tooltip.hide();
    }).mousemove(function (e) {
        e = $.event.fix(e);
        tooltip.reput(e.pageX, e.pageY);
      });
    return this;
  }
  $.tooltip = function (options) {
    return new Tooltip(options);
  }
  /****
   * options {
   container =body, tooltip的dom的插入位置, 通常用于控制坐标
   position 相对光标的显示位置
   offset 相对显示位置的偏移量
   el 如果非空将使用已有的dom而不再重新生成
   }
   */
  var Tooltip = function (options) {
    var opts = {
      container: "body",
      position: "bottom-middle",
      className: "",
      offset: 6,
      el: null
    };
    if (options) {
      $.extend(opts, options);
    }
    this.opts = opts;
    if (opts.el) {
      this.el = opts.el;
    } else {
      this.el = $('<div class="tooltip"><div class="tooltip-corner"></div><div class="tooltip-content"></div></div>').hide().addClass(opts.className).appendTo(opts.container)[0];
    }
    /*防止鼠标移入框中时触发外围的mouseout
     var self=this;
     $(this.el).mouseover(function(e) {
     self.show();
     });
     */
    this.setPos(opts.position);
    this.render(opts.content);
  }
  Tooltip.prototype = {
    setPos: function (position) {
      var pos = String(position).split("-");
      pos[1] = pos[1] || "midddle";
      this.el.className = ["tooltip", pos.join("-"), this.opts.className].join(" ");
      this.opts.position = pos;
      return this;
    },
    render: function (data) {
      if (typeof(data) == "string") {
        data = $('<p>').html(data);
      }
      this.content = data;
      $('.tooltip-content', this.el).empty().append(data);
      this.sc = {      //重新计算dom大小
        w: $(this.el).outerWidth(),
        h: $(this.el).outerHeight()
      };
      return this;
    },
    reput: function (x, y) {
      var sc = this.sc,
        offset = this.opts.offset,
        pos = this.opts.position;
      if (typeof(x) === "object" && x instanceof Event) {
        var e = $.event.fix(x);
        x = e.pageX, y = e.pageY;
      }
      if (pos[0] === "middle") {
        y -= Math.round(sc.h / 2);
      } else if (pos[0] === "top") {
        y -= sc.h + offset;
      } else {
        y += offset;
      }
      if (pos[1] === "middle") {
        x -= Math.round(sc.w / 2);
      } else if (pos[1] === "left") {
        x -= sc.w + offset;
      } else {
        x += offset;
      }
      $(this.el).css({
        left: x + "px",
        top: y + "px"
      });
      return this;
    },
    show: function (x, y) {
      if (x) {
        this.reput(x, y);
      }
      if (this.timerHide) {
        clearTimeout(this.timerHide);
        this.timerHide = null;
      }
      $(this.el).show();
      return this;
    },
    hide: function () {
      var self = this;
      //防闪烁缓冲
      if (!this.timerHide) {
        this.timerHide = setTimeout(function () {
          $(self.el).hide();
          //$(this.el).fadeOut();
          self.timerHide = null;
        }, 100);
      }
      return this;
    }
  }
})(jQuery);
