class TFProcess {
  constructor(name, setup, loop) {
    this.processId = guid();
    this.name = name;
    this.setup = setup;
    this.loop = loop;
    this.loopInterval = 100;
    this.process = () => {
      //console.log(this, "process executed");
      if (this.loop) {
        this.loop();
        //console.log(this, "loop ended");
        this.loopHandler = setTimeout(this.process, this.loopInterval);
      }
    };
    this.runOnes = () => {
      if (this.loop) {
        this.loop();
      }
    };
    this.start = () => {
      if (this.setup) this.setup();
      this.process();
    };
    this.stop = () => {
      clearTimeout(this.loopHandler);
    };
  }
}

function guid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
