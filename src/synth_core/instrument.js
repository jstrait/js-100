"use strict";

import { Envelope } from "./envelope";
import { Note } from "./note";

var BaseInstrument = function(config) {
  var buildOscillator = function(audioContext, waveform, frequency, detune) {
    var oscillator = audioContext.createOscillator();
    oscillator.type = waveform;
    oscillator.frequency.value = frequency;
    oscillator.detune.value = detune;

    return oscillator;
  };

  var buildGain = function(audioContext, amplitude) {
    var gain = audioContext.createGain();
    gain.gain.value = amplitude;

    return gain;
  };

  var buildFilter = function(audioContext, frequency, resonance) {
    var filter = audioContext.createBiquadFilter();
    filter.frequency.value = frequency;
    filter.Q.value = resonance;

    return filter;
  };

  var scheduleNote = function(audioContext, audioDestination, note, gateOnTime, gateOffTime) {
    var noteContext = baseInstrument.gateOn(audioContext, audioDestination, note, gateOnTime, gateOffTime);
    baseInstrument.gateOff(noteContext, gateOffTime, false);
  };

  var gateOff = function(noteContext, gateOffTime, isInteractive) {
    var MINIMUM_RELEASE_TIME = 0.005;
    var cutoffFrequencyAtReleaseStart, masterGainAtReleaseStart, safeMasterGainRelease, gainReleaseEndTime, releaseEndTime;
    var safeFilterRelease;

    // Filter Envelope Release
    safeFilterRelease = Math.max(MINIMUM_RELEASE_TIME, config.filter.envelope.releaseTime);
    if (isInteractive === true) {
      // Simulate `cancelAndHoldAtTime()`, which is not present in all browsers.
      // See comment below for the master gain node for more info.
      noteContext.filter.frequency.cancelScheduledValues(gateOffTime);
      cutoffFrequencyAtReleaseStart = config.filter.cutoff + Envelope(config.filter.envelope.amount, config.filter.envelope, noteContext.gateOnTime, gateOffTime).valueAtTime(gateOffTime, gateOffTime);
      noteContext.filter.frequency.setValueAtTime(cutoffFrequencyAtReleaseStart, gateOffTime);
    }
    noteContext.filter.frequency.setTargetAtTime(config.filter.cutoff, gateOffTime, safeFilterRelease / 5);

    // Gain Envelope Release
    safeMasterGainRelease = Math.max(MINIMUM_RELEASE_TIME, config.envelope.releaseTime);
    gainReleaseEndTime = gateOffTime + safeMasterGainRelease;

    if (isInteractive === true) {
      // Simulate `cancelAndHoldAtTime()`, which is not present in all browsers.
      // The gain value is manually set to the current gain value because `cancelScheduledValues()`
      // seems to (sometimes? all the time?) reset the gain value at 0. If the gain is 0, the
      // release portion of the envelope will have no effect, and cause notes that are played
      // for a shorter amount of time than the attack+decay time to be suddenly cut off, instead
      // of having a release fade. As mentioned above, using `cancelAndHoldAtTime()` would be
      // another way to solve this problem.
      noteContext.masterGain.gain.cancelScheduledValues(gateOffTime);
      masterGainAtReleaseStart = Envelope(noteContext.amplitude, config.envelope, noteContext.gateOnTime, gateOffTime).valueAtTime(gateOffTime, gateOffTime);
      noteContext.masterGain.gain.setValueAtTime(masterGainAtReleaseStart, gateOffTime);
    }

    noteContext.masterGain.gain.setTargetAtTime(0.0, gateOffTime, safeMasterGainRelease / 5);

    if (noteContext.audioBufferSourceNode !== undefined) {
      noteContext.audioBufferSourceNode.stop(gainReleaseEndTime);
    }
    if (noteContext.oscillator1 !== undefined) {
      noteContext.oscillator1.stop(gainReleaseEndTime);
      noteContext.oscillator2.stop(gainReleaseEndTime);
      noteContext.noise.stop(gainReleaseEndTime);
    }
    if (noteContext.pitchLfoOscillator !== undefined) {
      noteContext.pitchLfoOscillator.stop(gainReleaseEndTime);
    }
    if (noteContext.filterLfoOscillator !== undefined) {
      noteContext.filterLfoOscillator.stop(gainReleaseEndTime);
    }
  };


  var baseInstrument = {
    gateOn: function() {},
    gateOff: gateOff,
    buildOscillator: buildOscillator,
    buildGain: buildGain,
    buildFilter: buildFilter,
    scheduleNote: scheduleNote,
    config: function() { return config; },
  };

  return baseInstrument;
};


function SampleInstrument(config) {
  var BASE_FREQUENCY = Note(config.rootNoteName, config.rootNoteOctave, 1.0, 1).frequency();
  var sampleInstrument = BaseInstrument(config);

  var buildBufferSourceNode = function(audioContext, target, note) {
    var audioBufferSourceNode = audioContext.createBufferSource();
    audioBufferSourceNode.buffer = config.audioBuffer;
    audioBufferSourceNode.playbackRate.value = note.frequency() / BASE_FREQUENCY;
    audioBufferSourceNode.loop = config.loop;
    audioBufferSourceNode.connect(target);

    return audioBufferSourceNode;
  };

  sampleInstrument.gateOn = function(audioContext, audioDestination, note, gateOnTime, gateOffTime) {
    var masterGain, calculatedMasterGainEnvelope;
    var filter, filterLfoGain, filterLfoOscillator, calculatedFilterEnvelope;
    var envelopeAttackStartTime = Math.max(0.0, gateOnTime - 0.001);
    var audioBufferSourceNode;

    // Master Gain
    masterGain = audioContext.createGain();
    masterGain.connect(audioDestination);

    calculatedMasterGainEnvelope = Envelope(note.amplitude(), config.envelope, gateOnTime, gateOffTime);

    // Master Gain Envelope Attack
    masterGain.gain.setValueAtTime(0.0, envelopeAttackStartTime);
    masterGain.gain.linearRampToValueAtTime(calculatedMasterGainEnvelope.attackEndAmplitude, calculatedMasterGainEnvelope.attackEndTime);

    // Master Gain Envelope Decay/Sustain
    if (calculatedMasterGainEnvelope.attackEndTime < gateOffTime) {
      masterGain.gain.linearRampToValueAtTime(calculatedMasterGainEnvelope.decayEndAmplitude, calculatedMasterGainEnvelope.decayEndTime);
    }

    masterGain.connect(audioDestination);

    // Filter
    filter = sampleInstrument.buildFilter(audioContext, config.filter.cutoff, config.filter.resonance);

    filterLfoGain = sampleInstrument.buildGain(audioContext, config.filter.lfo.amplitude);
    filterLfoGain.connect(filter.detune);

    filterLfoOscillator = sampleInstrument.buildOscillator(audioContext, config.filter.lfo.waveform, config.filter.lfo.frequency, 0);
    filterLfoOscillator.connect(filterLfoGain);
    filterLfoOscillator.start(gateOnTime);

    calculatedFilterEnvelope = Envelope(config.filter.envelope.amount, config.filter.envelope, gateOnTime, gateOffTime);

    // Envelope Attack
    filter.frequency.setValueAtTime(config.filter.cutoff, envelopeAttackStartTime);
    filter.frequency.linearRampToValueAtTime(config.filter.cutoff + calculatedFilterEnvelope.attackEndAmplitude, calculatedFilterEnvelope.attackEndTime);

    // Envelope Decay/Sustain
    if (calculatedFilterEnvelope.attackEndTime < gateOffTime) {
      filter.frequency.linearRampToValueAtTime(config.filter.cutoff + calculatedFilterEnvelope.decayEndAmplitude, calculatedFilterEnvelope.decayEndTime);
    }

    filter.connect(masterGain);

    // Audio Buffer
    audioBufferSourceNode = buildBufferSourceNode(audioContext, filter, note);
    audioBufferSourceNode.start(gateOnTime);

    return {
      gateOnTime: gateOnTime,
      amplitude: note.amplitude(),
      audioBufferSourceNode: audioBufferSourceNode,
      masterGain: masterGain,
      filter: filter,
      filterLfoOscillator: filterLfoOscillator,
    };
  };


  return sampleInstrument;
};

function SynthInstrument(config) {
  var synthInstrument = BaseInstrument(config);

  synthInstrument.gateOn = function(audioContext, audioDestination, note, gateOnTime, gateOffTime) {
    var masterGainAmplitude, masterGain, calculatedMasterGainEnvelope;
    var filter, filterLfoGain, filterLfoOscillator, calculatedFilterEnvelope;
    var oscillator1, oscillator1Gain, oscillator2, oscillator2Gain, noise, noiseGain;
    var pitchLfoOscillator, pitchLfoGain;

    var envelopeAttackStartTime = Math.max(0.0, gateOnTime - 0.001);

    // Master Gain
    masterGain = audioContext.createGain();
    masterGain.connect(audioDestination);

    masterGainAmplitude = note.amplitude() / (config.oscillators.length + 1);
    calculatedMasterGainEnvelope = Envelope(masterGainAmplitude, config.envelope, gateOnTime, gateOffTime);

    // Master Gain Envelope Attack
    masterGain.gain.setValueAtTime(0.0, envelopeAttackStartTime);
    masterGain.gain.linearRampToValueAtTime(calculatedMasterGainEnvelope.attackEndAmplitude, calculatedMasterGainEnvelope.attackEndTime);

    // Master Gain Envelope Decay/Sustain
    if (calculatedMasterGainEnvelope.attackEndTime < gateOffTime) {
      masterGain.gain.linearRampToValueAtTime(calculatedMasterGainEnvelope.decayEndAmplitude, calculatedMasterGainEnvelope.decayEndTime);
    }


    // Filter
    filter = synthInstrument.buildFilter(audioContext, config.filter.cutoff, config.filter.resonance);

    filterLfoGain = synthInstrument.buildGain(audioContext, config.filter.lfo.amplitude);
    filterLfoGain.connect(filter.detune);

    filterLfoOscillator = synthInstrument.buildOscillator(audioContext, config.filter.lfo.waveform, config.filter.lfo.frequency, 0);
    filterLfoOscillator.connect(filterLfoGain);
    filterLfoOscillator.start(gateOnTime);

    calculatedFilterEnvelope = Envelope(config.filter.envelope.amount, config.filter.envelope, gateOnTime, gateOffTime);

    // Envelope Attack
    filter.frequency.setValueAtTime(config.filter.cutoff, envelopeAttackStartTime);
    filter.frequency.linearRampToValueAtTime(config.filter.cutoff + calculatedFilterEnvelope.attackEndAmplitude, calculatedFilterEnvelope.attackEndTime);

    // Envelope Decay/Sustain
    if (calculatedFilterEnvelope.attackEndTime < gateOffTime) {
      filter.frequency.linearRampToValueAtTime(config.filter.cutoff + calculatedFilterEnvelope.decayEndAmplitude, calculatedFilterEnvelope.decayEndTime);
    }

    filter.connect(masterGain);


    // Base sound generator
    oscillator1Gain = synthInstrument.buildGain(audioContext, config.oscillators[0].amplitude);
    oscillator1 = synthInstrument.buildOscillator(audioContext,
                                                  config.oscillators[0].waveform,
                                                  note.frequency() * Math.pow(2, config.oscillators[0].octave),
                                                  config.oscillators[0].detune);
    oscillator1.connect(oscillator1Gain);
    oscillator1Gain.connect(filter);
    oscillator1.start(gateOnTime);

    // Secondary sound generator
    oscillator2Gain = synthInstrument.buildGain(audioContext, config.oscillators[1].amplitude);
    oscillator2 = synthInstrument.buildOscillator(audioContext,
                                                  config.oscillators[1].waveform,
                                                  note.frequency() * Math.pow(2, config.oscillators[1].octave),
                                                  config.oscillators[1].detune);
    oscillator2.connect(oscillator2Gain);
    oscillator2Gain.connect(filter);
    oscillator2.start(gateOnTime);

    // Noise
    noiseGain = synthInstrument.buildGain(audioContext, config.noise.amplitude);
    noise = audioContext.createBufferSource();
    noise.buffer = config.noise.audioBuffer;
    noise.loop = true;
    noise.connect(noiseGain);
    noiseGain.connect(filter);
    noise.start(gateOnTime);

    // LFO for base sound
    if (config.lfo.frequency > 0.0 && config.lfo.amplitude > 0.0) {
      pitchLfoOscillator = synthInstrument.buildOscillator(audioContext, config.lfo.waveform, config.lfo.frequency, 0);
      pitchLfoGain = synthInstrument.buildGain(audioContext, config.lfo.amplitude);
      pitchLfoOscillator.connect(pitchLfoGain);
      pitchLfoGain.connect(oscillator1.detune);
      pitchLfoGain.connect(oscillator2.detune);
      pitchLfoOscillator.start(gateOnTime);
    }

    return {
      gateOnTime: gateOnTime,
      amplitude: masterGainAmplitude,
      oscillator1: oscillator1,
      oscillator2: oscillator2,
      noise: noise,
      filter: filter,
      masterGain: masterGain,
      pitchLfoOscillator: pitchLfoOscillator,
      filterLfoOscillator: filterLfoOscillator,
    };
  };


  return synthInstrument;
};


export { SynthInstrument, SampleInstrument };
