"use strict";

var JS100 = JS100 || {};

JS100.Instrument = function(audioContext, config) {
  var instrument = {};

  instrument.audioContext = audioContext;

  // VCO
  instrument.type = config.waveform;
  instrument.amplitude = config.amplitude;

  // LFO
  instrument.lfoWaveform  = config.lfoWaveform;
  instrument.lfoFrequency = config.lfoFrequency;
  instrument.lfoAmplitude = config.lfoAmplitude;

  // VCF
  instrument.filterFrequency   = config.filterCutoff;
  instrument.filterResonance   = config.filterResonance;
  instrument.filterLFOWaveform = config.filterLFOWaveform;
  instrument.filterLFOFrequency = config.filterLFOFrequency;
  instrument.filterLFOAmplitude = config.filterLFOAmplitude;

  // Envelope
  instrument.envelopeAttack  = config.envelopeAttack;
  instrument.envelopeDecay   = config.envelopeDecay;
  instrument.envelopeSustain = config.envelopeSustain;
  instrument.envelopeRelease = config.envelopeRelease;

  return instrument;
};

JS100.InstrumentEvent = function(instrument) {
  var instrumentEvent = {};
  var audioContext = instrument.audioContext;
  instrumentEvent.instrument = instrument;

  var buildOscillator = function(waveform, frequency) {
    var oscillator = audioContext.createOscillator();
    oscillator.type = waveform;
    oscillator.frequency.value = frequency;
 
    return oscillator;
  };

  var buildGain = function(amplitude) {
    var gain = audioContext.createGain();
    gain.gain.value = amplitude;

    return gain;
  };

  var buildFilter = function(frequency, resonance) {
    var filter = audioContext.createBiquadFilter();
    filter.frequency.value = frequency;
    filter.Q.value = resonance;

    return filter;
  };

  // Base sound generator
  var oscillator = buildOscillator(instrument.type, 0.0);

  // LFO for base sound
  var pitchLfoOscillator = buildOscillator(instrument.lfoWaveform, instrument.lfoFrequency);
  var pitchLfoGain = buildGain(instrument.lfoAmplitude);
  pitchLfoOscillator.connect(pitchLfoGain);
  pitchLfoGain.connect(oscillator.frequency);
  
  // Filter
  var filter = buildFilter(instrument.filterFrequency, instrument.filterResonance);
  var filterLfoOscillator = buildOscillator(instrument.filterLFOWaveform, instrument.filterLFOFrequency);
  var filterLfoGain = buildGain(instrument.filterLFOAmplitude);
  filterLfoOscillator.connect(filterLfoGain);
  filterLfoGain.connect(filter.frequency);

  // Master Gain
  var masterGain = audioContext.createGain();

  oscillator.connect(filter);
  filter.connect(masterGain);
  masterGain.connect(audioContext.destination);

  instrumentEvent.play = function(note, gateOnTime, gateOffTime) {
    var attackEndTime, releaseEndTime;

    if (note.frequency() > 0.0) {
      oscillator.frequency.value = note.frequency();

      oscillator.start(gateOnTime);
      pitchLfoOscillator.start(gateOnTime);
      filterLfoOscillator.start(gateOnTime);

      // Envelope Attack
      attackEndTime = gateOnTime + instrument.envelopeAttack;
      masterGain.gain.setValueAtTime(0.0, gateOnTime);
      masterGain.gain.linearRampToValueAtTime(instrument.amplitude, attackEndTime);

      // Envelope Decay+Sustain
      masterGain.gain.linearRampToValueAtTime(instrument.envelopeSustain * instrument.amplitude,
                                              attackEndTime + instrument.envelopeDecay);

      // Envelope Release
      releaseEndTime = gateOffTime + instrument.envelopeRelease;
      oscillator.stop(gateOffTime + instrument.envelopeRelease);
      masterGain.gain.linearRampToValueAtTime(0.0, releaseEndTime);
      pitchLfoOscillator.stop(releaseEndTime);
      filterLfoOscillator.stop(releaseEndTime);
    }
  };

  return instrumentEvent;
}

JS100.Transport = function(audioContext, instrument, rawNotes, tempo, loop) {
  var transport = {};

  var SCHEDULE_AHEAD_TIME = 0.2;
  var TICK_INTERVAL = 50;  // in milliseconds

  var parseRawNotes = function(rawNotes) {
    var sequence = [];
    var splitNotes = rawNotes.split(" ");

    for (var i = 0; i < splitNotes.length; i++) {
      var noteParts = splitNotes[i].split("-");
      var note = JS100.Note(noteParts[0], noteParts[1], 1);
      sequence[i] = note;
    }

    return sequence;
  };

  transport.updateTempo = function(newTempo) {
    transport.tempo = newTempo;

    var sixteenthsPerMinute = transport.tempo * 4;
    transport.stepTime = 60.0 / sixteenthsPerMinute;
  };

  transport.toggle = function() {
    if (playing) {
      stop();
    }
    else {
      start();
    }
  };

  function tick() {
    var sequence = transport.sequence;
    var finalTime = audioContext.currentTime + SCHEDULE_AHEAD_TIME;
    var note;
    var e;

    while (nextNoteTime < finalTime) {
      note = sequence[sequenceIndex];

      e = new JS100.InstrumentEvent(transport.instrument);
      e.play(note, nextNoteTime, nextNoteTime + transport.stepTime);

      sequenceIndex += 1;
      if (sequenceIndex >= sequence.length) {
        if (transport.loop) {
          sequenceIndex = 0;
        }
        else {
          stop();
        }
      }

      nextNoteTime += transport.stepTime;
    }
  };

  function start() {
    sequenceIndex = 0;
    nextNoteTime = audioContext.currentTime;

    tick();
    timeoutId = window.setInterval(tick, TICK_INTERVAL);
    playing = true;
  };

  function stop() {
    window.clearInterval(timeoutId);
    playing = false;
  };

  var sequenceIndex;
  var nextNoteTime;
  var timeoutId;
  var playing = false;

  transport.sequence = parseRawNotes(rawNotes);
  transport.loop = loop;
  transport.instrument = instrument;

  transport.updateTempo(tempo);

  return transport;
};


JS100.Note = function(noteName, octave, duration) {
  var note = {};

  note.noteName = noteName;
  note.octave = octave;
  note.duration = duration;

  note.frequency = function() {
    if (noteName === "_" || noteName === ".") {
      return 0.0;
    }

    noteName = JS100.MusicTheory.ENHARMONIC_EQUIVALENTS[noteName];
    var octaveMultiplier = Math.pow(2.0, (octave - JS100.MusicTheory.MIDDLE_OCTAVE));
    var frequency = JS100.MusicTheory.NOTE_RATIOS[noteName] * JS100.MusicTheory.MIDDLE_A_FREQUENCY * octaveMultiplier;

    return frequency;
  };

  return note;
};

JS100.MusicTheory = {
  NOTE_RATIOS: {
    "A"  : 1.0,
    "A#" : 16.0 / 15.0,
    "B"  : 9.0 / 8.0,
    "C"  : 6.0 / 5.0,
    "C#" : 5.0 / 4.0,
    "D"  : 4.0 / 3.0,
    "D#" : 45.0 / 32.0,
    "E"  : 3.0 / 2.0,
    "F"  : 8.0 / 5.0,
    "F#" : 5.0 / 3.0,
    "G"  : 9.0 / 5.0,
    "G#" : 15.0 / 8.0
  },

  ENHARMONIC_EQUIVALENTS: {
    "A"   : "A",
    "G##" : "A",
    "Bbb" : "A",
    
    "A#"  : "A#",
    "Bb"  : "A#",
    "Cbb" : "A#",
    
    "B"   : "B",
    "A##" : "B",
    "Cb"  : "B",
    
    "C"   : "C",
    "B#"  : "C",
    "Dbb" : "C",
    
    "C#"  : "C#",
    "B##" : "C#",
    "Db"  : "C#",
    
    "D"   : "D",
    "C##" : "D",
    "Ebb" : "D",
    
    "D#"  : "D#",
    "Eb"  : "D#",
    "Fbb" : "D#",
    
    "E"   : "E",
    "D##" : "E",
    "Fb"  : "E",
    
    "F"   : "F",
    "E#"  : "F",
    "Gbb" : "F",
    
    "F#"  : "F#",
    "E##" : "F#",
    "Gb"  : "F#",
    
    "G"   : "G",
    "F##" : "G",
    "Abb" : "G",
    
    "G#"  : "G#",
    "Ab"  : "G#"
  },

  MIDDLE_OCTAVE: 4,
  MIDDLE_A_FREQUENCY: 440.0,
};
