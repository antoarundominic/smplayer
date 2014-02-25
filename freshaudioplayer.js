var freshAudioPlayer,
    FreshAudioPlayer;

(function(window){

    (function($){
        function FreshAudioPlayer () {
            var fap = this, self = this, init_settings;
            this.sounds = [];
            this.links = [];
            this.soundCount = 0;
            this.lastSound = null;
            this.classNames = ['fp_playing', 'fp_default', 'fp_paused'];

            this.config = {
              autoPlay: false,
              allowMultiple: false,
              autoStart: false,
              emptyTime: '--:--',
              showHMSTime: true,
              lodingBarColor: '#ccc',
              processBarColor: '#000',
              StatusbarBackground: '#eee'
            };

            this._fpData = {
              className: 'fp_default',
              fp_uibox: $('freshplayer')
            };

            this.css = {
              sDefault: 'fp_default',
              sLoading: 'fp_loading',
              sPlaying: 'fp_playing',
              sPaused: 'fp_paused'
            };

            this.events = {
              play: function() {
                $(this._fpData.fp_uibox).removeClass(this._fpData.className);
                $(this._fpData.fp_uibox).addClass(self.css.sPlaying);
                this._fpData.className = self.css.sPlaying;
              },

              pause: function() {
                $(this._fpData.fp_uibox).removeClass(this._fpData.className);
                $(this._fpData.fp_uibox).addClass(self.css.sPaused);
                this._fpData.className = self.css.sPaused;
              },

              resume: function() {
                $(this._fpData.fp_uibox).removeClass(this._fpData.className);
                $(this._fpData.fp_uibox).addClass(self.css.sPlaying);
                this._fpData.className = self.css.sPlaying;
              },

              finish: function () {
                $(this._fpData.fp_uibox).removeClass(this._fpData.className);
                $(this._fpData.fp_uibox).addClass(self.css.sDefault);
                this._fpData.className = self.css.sDefault;
              },

              stop: function() {
               $(this._fpData.fp_uibox.find(".fpload")).css('width',0);
                $(this._fpData.fp_uibox).removeClass(this._fpData.className);
                $(this._fpData.fp_uibox).addClass(self.css.sDefault);
                this._fpData.className = self.css.sDefault;
                $(this._fpData.fp_uibox.find(".fptimer")).text(self.getTime(this.duration || this.durationEstimate,true));

              },

              whileplaying: function() {
                  self.updatePlaying.apply(this);
                
              },

              whileloading: function() {
                if (this.paused) {
                   self.updatePlaying.apply(this);
                }
                $(this._fpData.fp_uibox.find(".fpTotalDuration")).text(self.getTime(this.duration || this.durationEstimate,true));
              }
            };

            $('.smpause').on('click',function () {
              var _sound = soundManager.getSoundById($(this).closest('#fpurl').attr("s_Id"));
              if(_sound.paused){
                _sound.togglePause();
              }
              else{
                _sound.load();
                _sound.play();
              }
            });

            $('.smstop').on('click',function () {
              soundManager.stop($(this).closest('#fpurl').attr("s_Id"));
            }); 

            $('.fpbuffer').on('click',function (e) {
              var _sound= soundManager.getSoundById($(this).closest('#fpurl').attr("s_Id")); 
              _sound.pause();
              self.setPosition(_sound,e);
            });

            $('.fpbuffer').on('mouseover',function (e) {
              var _sound= soundManager.getSoundById($(this).closest('#fpurl').attr("s_Id"));
              $(this).attr('title',self.setPosition(_sound,e,true));
              return false;
            });

            $('.fpbuffer').on('mousemove',function (e) {
              var _sound= soundManager.getSoundById($(this).closest('#fpurl').attr("s_Id"));
              $(this).attr('title',self.setPosition(_sound,e,true));
              return false;
            });

            this.updatePlaying = function () {
              var _timeNow = (self.config.showHMSTime ? self.getTime(this.position,true):parseInt(this.position/1000, 10));
              $(this._fpData.fp_uibox.find(".fptimer")).text(_timeNow);
              $(this._fpData.fp_uibox.find(".fpload")).css('width',((this.position / (this.duration || this.durationEstimate))*100)+'%');
            };

            this.getTime = function (nMSec,bAsString) {
              var nSec = Math.floor(nMSec/1000),
              min = Math.floor(nSec/60),
              sec = nSec-(min*60);
              return (bAsString?(min+':'+(sec<10?'0'+sec:sec)):{'min':min,'sec':sec});
            };

            this.setPosition = function (sound,e, tooltip) {
              var x, _fpStatus, nMsecOffset;
              tooltip = tooltip || false;
              x = parseInt(e.clientX, 10);
              _fpStatus = $(sound._fpData.fp_uibox.find(".fpbuffer"));
              nMsecOffset = Math.floor((x - _fpStatus.offset().left-4)/(_fpStatus.outerWidth())*sound.duration);
              if (!isNaN(nMsecOffset)) {
                nMsecOffset = Math.min(nMsecOffset,sound.duration);
              }
              if (tooltip){
                nMsecOffset = self.getTime(nMsecOffset,true);
                return nMsecOffset;
              }
              if (!isNaN(nMsecOffset)) {
                sound.setPosition(nMsecOffset);
                sound.play();
              }
            };

            this._createSound = function (ele,parent) {
              
              var sound = soundManager.createSound({
                 id:'fpSound'+(self.soundCount++),
                 url:ele.data('filerurl'),
                 autoLoad: true,
                 onplay:self.events.play,
                 onstop:self.events.stop,
                 onpause:self.events.pause,
                 onresume:self.events.resume,
                 onfinish:self.events.finish,
                 onbufferchange:self.events.bufferchange,
                 type:(ele.type||null),
                 whileloading:self.events.whileloading,
                 whileplaying:self.events.whileplaying
              });
              $(parent).attr('id',sound.id);
              sound._fpData = {
                className: self.css.sDefault,
                fp_uibox: $(parent)
              };
              $(sound._fpData.fp_uibox.find(".fptimer")).text(self.getTime(sound.duration || sound.durationEstimate,true));
              $(sound._fpData.fp_uibox).addClass(self.css.sDefault);
              return sound;
            };

            init_settings = function() {
                var oItems = $('.freshplayer'), i, _urlElement, _sound;
                for(i=0; i<oItems.length; i++){
                  _urlElement = $(oItems[i]).find('#fpurl');
                  _sound = self._createSound(_urlElement,oItems[i]);
                  self.sounds.push( _sound );
                  _urlElement.attr("s_Id", _sound.id);

                }
            };

            this.init = function () {
              init_settings();
            };
        }
    
        window.FreshAudioPlayer = FreshAudioPlayer;
        freshAudioPlayer = new FreshAudioPlayer();
        soundManager.onready(freshAudioPlayer.init);
    }(jQuery));

}(window));