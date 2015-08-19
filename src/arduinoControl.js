var arduino = inheritFrom(HTMLElement,function(){
	var self= this;
	var arduino = this;
	this.digiHandlers =[];
	this.anaHandlers =[];
	var START = 128;
	var DIGI_READ = 0;
	var DIGI_WRITE = 32;	//pins 2-13
	var ANA_READ = 64;
	var DIGI_WATCH_2 = 72; //pins 14-19
	var ANA_REPORT = 80;
	var ANA_WRITE = 96;		//pins 3,5,6,9,10,11
	var DIGI_WATCH = 112;	//pins 2-13

	var wsClient = $("$web-socket");

  this.onMessage = function(evt) {
		msg = evt.data
		for(var i=0; i<msg.length-1; i++){
			var chr = msg.charCodeAt(i);
			if(chr&(START+ANA_READ)){  //if the packet is analogRead
				var pin = ((chr & 56)>>3);				//extract the pin number
				var val = ((chr & 7)<<7)+(msg.charCodeAt(++i)&127); //extract the value

				if(typeof self.anaHandlers[pin] == 'function') self.anaHandlers[pin](val);
			}
			else if(chr&(START+DIGI_READ)){			//if the packet is digitalRead
				var pin = ((chr & 62)>>1);
				var val = chr&1;

				if(typeof self.digiHandlers[pin] == 'function') self.digiHandlers[pin](val);
			}
		}
  };

	function asChar(val) {
		return String.fromCharCode(val);
	}

  arduino.digitalWrite = function(pin, state) {
		if(pin<=13) wsClient.send("r|"+asChar(START+DIGI_WRITE+((pin&15)<<1)+(state&1)));
		else console.log("Pin must be less than 13");
  };

  arduino.digitalRead = function(pin) {
    wsClient.send("r|"+asChar(START+DIGI_READ+(pin&31)));
  };

  arduino.analogWrite = function(pin, val) {
		if(val>=0&&val<256)
    	wsClient.send("r|"+asChar(START+ANA_WRITE+((pin&7)<<1)+(val>>7))+asChar(val&127));
  };

  arduino.watchPin = function(pin, handler) {
    if(pin<13) wsClient.send("r|"+asChar(START+DIGI_WATCH+(pin&15)));
		else wsClient.send("r|"+asChar(START+DIGI_WATCH_2+((pin-13)&7)));
    arduino.handlers[pin] = handler;
  };

  this.analogReport = function(pin, interval, handler) {
		interval/=2;
		if(interval<256){
			wsClient.send(asChar(START+ANA_REPORT+((pin&7)<<1)+(interval>>7))+asChar(interval&127));
    	arduino.handlers[pin] = handler;
		}
		else console.log("interval must be less than 512");
  };

  arduino.setHandler = function(pin, handler) {
    arduino.handlers[pin] = handler;
  };

  arduino.analogRead = function(pin) {
    wsClient.send(asChar(START+ANA_READ+((pin&7))));
  };

  arduino.stopReport = function(pin) {
    wsClient.send(asChar(START+ANA_REPORT+((pin&7)<<1))+asChar(0));
  };

	this.createdCallback = function () {
    if(typeof $("$web-socket") === 'object')
			$("$web-socket").customCallback = this.onMessage.bind(this);
  }
});

document.registerElement('web-arduino', arduino);
