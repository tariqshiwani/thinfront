var loader = (function() {
  return {
    show: function(obj) {
      var container = $("body");
      if (typeof obj == "object") {
        container = obj;
        obj.addClass("loader-cont");
      }

      var blk = $("#_loader_block_ui");
      if (blk.length == 0)
        blk = $(
          "<div id='_loader_block_ui' class='loader_block_ui'><div class='loader-anim'></div></div>"
        );
      container.append(blk);
    },
    hide: function(obj) {
      if (typeof obj == "object") obj.removeClass("loader-cont");
      $("#_loader_block_ui").remove();
    }
  };
})();
