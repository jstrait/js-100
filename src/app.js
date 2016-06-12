"use strict";

var app = angular.module('js120', []);

app.controller('InstrumentCollectionController', ['$rootScope', '$scope', 'InstrumentService', 'PatternService', function($rootScope, $scope, InstrumentService, PatternService) {
  var buildInstrumentOptions = function() {
    return InstrumentService.instruments().map(function(instrument) {
     return { id: instrument.id, name: instrument.name };
    });
  };

  $scope.instrumentOptions = buildInstrumentOptions();
  $scope.$on('InstrumentService.update', function(event) {
    $scope.instrumentOptions = buildInstrumentOptions();
  });

  $scope.selectedInstrumentID = 1;

  $scope.addInstrument = function() {
    var newInstrument = InstrumentService.addInstrument();
    PatternService.addPattern(newInstrument.id);
    $scope.selectedInstrumentID = newInstrument.id;
    $scope.changeSelectedInstrument(newInstrument.id);
  };

  $scope.changeSelectedInstrument = function(instrumentID) {
    $scope.selectedInstrumentID = instrumentID;
    $rootScope.$broadcast('InstrumentCollectionController.selectedInstrumentChanged', { instrumentID: instrumentID });
  };
}]);


app.controller('InstrumentController', ['$scope', 'InstrumentService', function($scope, InstrumentService) {
  var instrumentID = 1;
  
  $scope.instrument = InstrumentService.instrumentByID(instrumentID);
  $scope.$on('InstrumentCollectionController.selectedInstrumentChanged', function(event, args) {
    instrumentID = args.instrumentID;
    $scope.instrument = InstrumentService.instrumentByID(instrumentID);
  });

  $scope.$on('InstrumentService.update', function(event) {
    $scope.instrument = InstrumentService.instrumentByID(instrumentID);
  });

  $scope.updateInstrument = function() {
    InstrumentService.updateInstrument();
  };
}]);


app.controller('PatternCollectionController', ['$rootScope', '$scope', 'PatternService', 'SequencerService', function($rootScope, $scope, PatternService, SequencerService) {
  var instrumentID = 1;

  var buildPatternOptions = function() {
    return PatternService.patternsByInstrumentID(instrumentID).map(function(pattern) {
     return { id: pattern.id, name: pattern.name };
    });
  };

  $scope.patternOptions = buildPatternOptions();
  $scope.$on('InstrumentCollectionController.selectedInstrumentChanged', function(event, args) {
    instrumentID = args.instrumentID;
    $scope.patternOptions = buildPatternOptions();
    $scope.changeSelectedPattern($scope.patternOptions[0].id);
  });
  $scope.$on('PatternService.update', function(event) {
    $scope.patternOptions = buildPatternOptions();
  });

  $scope.selectedPatternID = 1;

  $scope.addPattern = function() {
    var newPattern = PatternService.addPattern(instrumentID);
    $scope.changeSelectedPattern(newPattern.id);
  };

  $scope.removePattern = function(patternID) {
    SequencerService.unsetPattern(patternID);
    PatternService.removePattern(patternID);
  };

  $scope.changeSelectedPattern = function(patternID) {
    $scope.selectedPatternID = patternID;
    $rootScope.$broadcast('PatternCollectionController.selectedPatternChanged', { patternID: patternID });
  };
}]);


app.controller('PatternController', ['$scope', 'InstrumentService', 'PatternService', function($scope, InstrumentService, PatternService) {
  var instrumentID = 1;
  $scope.pattern = PatternService.patternByID(1);

  var buildInstrumentOptions = function() {
    return InstrumentService.instruments().map(function(instrument) {
     return { id: instrument.id, name: instrument.name };
    });
  };

  $scope.instrumentOptions = buildInstrumentOptions();
  $scope.$on('InstrumentService.update', function(event) {
    $scope.instrumentOptions = buildInstrumentOptions();
  });
  $scope.$on('PatternCollectionController.selectedPatternChanged', function(event, args) {
    $scope.pattern = PatternService.patternByID(args.patternID);
  });

  $scope.$on('PatternService.update', function(event) {
    $scope.pattern = PatternService.patternByID($scope.pattern.id);
  });

  $scope.updateName = function() {
    PatternService.updateName($scope.pattern.id);
  };

  $scope.changeInstrument = function() {
    PatternService.changeInstrument($scope.pattern.id);
  };

  $scope.addTrack = function() {
    PatternService.addTrack($scope.pattern.id);
  };

  $scope.removeTrack = function(trackIndex) {
    PatternService.removeTrack($scope.pattern.id, trackIndex);
  };

  $scope.toggleTrackMute = function(trackIndex) {
    PatternService.toggleTrackMute($scope.pattern.id, trackIndex);
  };

  $scope.updateNotes = function(trackIndex, noteIndex) {
    PatternService.updateNotes($scope.pattern.id, trackIndex, noteIndex);
  };
}]);


app.controller('SequencerController', ['$scope', 'PatternService', 'SequencerService', 'TransportService', function($scope, PatternService, SequencerService, TransportService) {
  $scope.patterns = SequencerService.patterns();
  $scope.currentStep = 1;

  var buildPatternOptions = function() {
    var patternOptions = PatternService.patterns().map(function(pattern) {
      return { id: pattern.id, name: pattern.name };
    });

    patternOptions.unshift({ id: -1, name: ''});

    return patternOptions;
  };

  $scope.patternOptions = buildPatternOptions();
  $scope.$on('PatternService.update', function(event) {
    $scope.patternOptions = buildPatternOptions();
  });

  $scope.changeSequencer = function(sequenceIndex) {
    SequencerService.changeSequencer(sequenceIndex);
  };

  $scope.addRow = function(rowIndex) {
    SequencerService.addRow(rowIndex);
  };

  $scope.removeRow = function(rowIndex) {
    SequencerService.removeRow(rowIndex);
  };

  $scope.toggleRowMute = function(rowIndex) {
    SequencerService.toggleRowMute(rowIndex);
  };

  $scope.syncCurrentStep = function() {
    if (TransportService.currentStep()) {
      $scope.currentStep = Math.floor((TransportService.currentStep() / 16) % 8) + 1;
    }
    else
    {
      $scope.currentStep = null;
    }
  };
}]);


app.controller('TransportController', ['$scope', 'SerializationService', 'TransportService', function($scope, SerializationService, TransportService) {
  $scope.playing = false;
  $scope.amplitude = 0.25;
  $scope.tempo = 100;
  $scope.loop = true;
  $scope.downloadFileName = "js-120";

  TransportService.setPatterns(SerializationService.serialize());
  $scope.$on('InstrumentService.update', function(event) {
    TransportService.setPatterns(SerializationService.serialize());
  });
  $scope.$on('PatternService.update', function(event) {
    TransportService.setPatterns(SerializationService.serialize());
  });
  $scope.$on('SequencerService.update', function(event) {
    TransportService.setPatterns(SerializationService.serialize());
  });

  $scope.updateTempo = function() {
    TransportService.setTempo(parseInt($scope.tempo, 10));
  };

  $scope.updateAmplitude = function() {
    TransportService.setAmplitude(parseFloat($scope.amplitude));
  };

  $scope.toggle = function() {
    TransportService.toggle();
    $scope.playing = !$scope.playing;
  };

  $scope.updateLoop = function() {
    TransportService.loop = $scope.loop;
  };

  $scope.export = function() {
    var exportCompleteCallback = function(blob) {
      var url  = window.URL.createObjectURL(blob);

      var hiddenDownloadLink = document.getElementById("hidden-download-link");
      if (typeof hiddenDownloadLink.download != "undefined") {
        hiddenDownloadLink.download = $scope.downloadFileName + ".wav";
        hiddenDownloadLink.href = url;
        hiddenDownloadLink.click();
      }
      else {
        alert("Downloading to Wave file is not supported in your browser.");
      }

      window.URL.revokeObjectURL(blob);
    };

    TransportService.export(exportCompleteCallback);
  };
}]);


// Copied from Angular docs, added to allow using an integer value
// with a <select> tag.
app.directive('convertToNumber', function() {
  return {
    require: 'ngModel',
    link: function(scope, element, attrs, ngModel) {
      ngModel.$parsers.push(function(val) {
        return parseInt(val, 10);
      });
      ngModel.$formatters.push(function(val) {
        return '' + val;
      });
    }
  };
});


app.directive('transportProgress', ['$interval', function($interval) {
  return {
    require: 'ngModel',
    link: function(scope, element, attrs, ctrl) {
      if (!ctrl) return;
      var updateProgress = function() {
        scope.syncCurrentStep();
      };

      element.on('$destroy', function() {
        $interval.cancel(timeoutId);
      });

      var timeoutId = $interval(function() {
        updateProgress();
      }, 1);
    },
  };
}]);


app.directive('noteInput', function () {
  return {
    require: 'ngModel',
    link: function (scope, element, attrs, ctrl) {
       if (!ctrl) return;

       var formatNoteValue = function(rawValue) {
         var formattedValue = rawValue;

         // Make first character uppercase (but not subsequent characters, to avoid
         // making a 'b' uppercase, which will mess with ♭ replacement).
         var firstCharacter = formattedValue.substr(0, 1);
         formattedValue = firstCharacter.toUpperCase() + formattedValue.substr(1);

         formattedValue = formattedValue.replace("##", "𝄪");
         formattedValue = formattedValue.replace("#", "♯");
         formattedValue = formattedValue.replace("bb", "𝄫");
         formattedValue = formattedValue.replace("b", "♭");
         formattedValue = formattedValue.replace("-", "—");

         return formattedValue;
       };

       ctrl.$formatters.push(function (a) {
         return formatNoteValue(ctrl.$modelValue);
       });

       ctrl.$parsers.unshift(function (viewValue) {
         var parsedValue = viewValue;

         // Make first character uppercase (but not subsequent characters, to avoid
         // making a 'b' uppercase, which will mess with ♭ replacement).
         var firstCharacter = viewValue.substr(0, 1);
         parsedValue = firstCharacter.toUpperCase() + viewValue.substr(1);
         parsedValue = parsedValue.replace("♯", "#");
         parsedValue = parsedValue.replace("𝄪", "##");
         parsedValue = parsedValue.replace("♭", "b");
         parsedValue = parsedValue.replace("𝄫", "bb");

         if (/^$|^-$|(^[A-G](b|bb|#|##){0,1}[0-7]$)/.test(parsedValue)) {
           ctrl.$setValidity('noteInput', true);
           return parsedValue;
         }
         else {
           ctrl.$setValidity('noteInput', false);
           return '';
         }
       });

       element.bind('blur', function(e) {
         element.val(formatNoteValue(element.val()));
       });

       element.bind('keydown', function(e) {
         var changeCurrentlySelectedNote = function(element, config) {
           var patternID = parseInt(element[0].id.split("-")[1], 10);
           var trackIndex = parseInt(element[0].id.split("-")[3], 10);
           var noteIndex = parseInt(element[0].id.split("-")[5], 10);
           var nextNoteId = 'pattern-' + patternID + '-track-' + (trackIndex + config.trackIndexDelta) + '-note-' + (noteIndex + config.noteIndexDelta);

           document.getElementById(nextNoteId).focus();
         };

         var currentValue = element.val();

         if (e.keyCode === 32) {  // Space bar
           element.val('');
         }
         else if (e.keyCode >= 48 && e.keyCode <= 57) {  // Numbers 0 through 9
           if (/^.*\d$/.test(currentValue)) {
             element.val(currentValue.slice(0, currentValue.length - 1));
           }
         }
         else if (e.keyCode === 189) {  // Dash
           element.val('');
         }
         else if (e.keyCode === 37) {  // Left arrow key
           if (element[0].selectionStart === 0 && !(element.hasClass('firstNote'))) {
             changeCurrentlySelectedNote(element, { trackIndexDelta: 0, noteIndexDelta: -1 });
           }
         }
         else if (e.keyCode === 39) {  // Right arrow key
           if (element[0].selectionEnd === currentValue.length && !(element.hasClass('lastNote'))) {
             changeCurrentlySelectedNote(element, { trackIndexDelta: 0, noteIndexDelta: 1 });
           }
         }
         else if (e.keyCode === 38) {  // Up arrow key
           if (!(element.hasClass('firstTrack'))) {
             changeCurrentlySelectedNote(element, { trackIndexDelta: -1, noteIndexDelta: 0 });
           }
         }
         else if (e.keyCode === 40) {  // Down arrow key
           if (!(element.hasClass('lastTrack'))) {
             changeCurrentlySelectedNote(element, { trackIndexDelta: 1, noteIndexDelta: 0 });
           }
         }
       });

       element.bind('keyup', function(e) {
         if (e.keyCode === 32) {  // Space bar
           element.val('');
         }
       });
    }
  };
});
