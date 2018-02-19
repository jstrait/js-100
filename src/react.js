import React from 'react';
import ReactDOM from 'react-dom';

import Serializer from "./serializer";
import * as JSSynth from "./jssynth";

class IDGenerator {
  constructor(initialNextID) {
    this.nextID = initialNextID;
  };

  next() {
    this.nextID += 1;
    return this.nextID;
  };
};

class TempoSlider extends React.Component {
  constructor(props) {
    super(props);
  };

  render() {
    return <span className="control">
      <label className="control-label align-right">Tempo&nbsp;&nbsp;</label>
      <span className="annotated-input">
        <input type="range" min="30" max="255" value={this.props.tempo} onChange={this.props.onChange} />
        <span>{this.props.tempo}</span>
      </span>
    </span>;
  };
};

class AmplitudeSlider extends React.Component {
  constructor(props) {
    super(props);
  };

  render() {
    return <span className="control">
      <label className="control-label align-right">Volume&nbsp;&nbsp;</label>
      <span className="annotated-input">
        <input type="range" min="0.0" max="1.0" step="0.01" value={this.props.amplitude} onChange={this.props.onChange} />
        <span>{(this.props.amplitude * 100).toFixed(0)}%</span>
      </span>
    </span>;
  };
};

class PlayButton extends React.Component {
  constructor(props) {
    super(props);
  };

  render() {
    return <button className={"mr1 round button-full button-hollow" + (this.props.playing ? " button-enabled" : "")} onClick={this.props.onClick}>►</button>;
  };
};

class TransportError extends React.Component {
  constructor(props) {
    super(props);
  };

  render() {
    return <div className="transport-error ml2 mr2">
      <span className="block bold red"><span className="round white bg-red inline-block center mr-half width-1 lh3">!</span>Playback not support in your browser</span>
      <span className="block">Try a recent version of Chrome, Safari, or Firefox.</span>
    </div>;
  };
};

class Transport extends React.Component {
  constructor(props) {
    super(props);
  };

  render() {
    let transportContent;

    if (this.props.enabled) {
      transportContent = <div className="transport-inner flex flex-align-center">
        <PlayButton playing={this.props.playing} onClick={this.props.togglePlaying} />
        <span className="transport-controls inline-block">
          <TempoSlider tempo={this.props.tempo} onChange={this.props.updateTempo} />
          <AmplitudeSlider amplitude={this.props.amplitude} onChange={this.props.updateAmplitude} />
        </span>
      </div>;
    }
    else {
      transportContent = <TransportError />
    }

    return <div id="transport" className="flex flex-uniform-size flex-align-center">
      {transportContent}
    </div>;
  };
};

class Download extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      enabled: false,
    };

    this.toggleEnabled = this.toggleEnabled.bind(this);
  };

  toggleEnabled(e) {
    this.setState((prevState, props) => ({
      enabled: !prevState.enabled,
    }));
  };

  render() {
    return <div id="download-container" className="relative">
      <button className="button-full button-hollow right" onClick={this.toggleEnabled}>
        <span className="h3 lh-flush">&darr;</span>&nbsp; *.wav
      </button>
      <a id="hidden-download-link" className="display-none" download={this.props.downloadFileName + ".wav"} href="#"></a>
      <div className={"mt3 pl1 pr1 pt1 pb1 popup-box" + (this.state.enabled ? "" : " display-none")}>
        <label className="block">File Name:</label>
        <span className="flex">
          <input className="underlinedInput flex-uniform-size" type="text" value={this.props.downloadFileName} onChange={this.props.setDownloadFileName} />
          <span>.wav</span>
        </span>
        <button className="button-full button-hollow mt1 right" onClick={this.props.export}>Download</button>
      </div>
    </div>;
  };
};

class TrackHeader extends React.Component {
  constructor(props) {
    super(props);

    this.setTrackName = this.setTrackName.bind(this);
    this.setTrackVolume = this.setTrackVolume.bind(this);
    this.toggleTrackMute = this.toggleTrackMute.bind(this);
  };

  setTrackName(e) {
    this.props.setTrackName(this.props.track.id, e.target.value);
  };

  setTrackVolume(e) {
    this.props.setTrackVolume(this.props.track.id, parseFloat(e.target.value));
  };

  toggleTrackMute(e) {
    this.props.toggleTrackMute(this.props.track.id, !this.props.track.muted);
  };

  render() {
    const shortTrackName = function(fullTrackName) {
      return fullTrackName.substring(0, 2);
    };

    return <li className="flex flex-column flex-uniform-size flex-justify-center list-style-none pl1 pr1 border-box bb br">
      <span className="short-name">{shortTrackName(this.props.track.name)}</span>
      <input className="underlinedInput full-width" type="text" value={this.props.track.name} onChange={this.setTrackName} />
      <span className="sequencer-volume-container flex flex-align-center">
        <button className={"button-hollow button-small" + (this.props.track.muted ? " button-enabled" : "")} onClick={this.toggleTrackMute}>Mute</button>
        <input className="flex-uniform-size" style={{marginLeft: "4px", width: "1px"}} type="range" min="0.0" max="1.0" step="0.01" disabled={this.props.track.muted} value={this.props.track.volume} onChange={this.setTrackVolume} />
      </span>
    </li>;
  };
};

class TrackPatternListHeader extends React.Component {
  constructor(props) {
    super(props);
  };

  render() {
    return <ul className="flex ml0 pl0 no-whitespace-wrap">
      {[1,2,3,4,5,6,7,8].map((measure, measureIndex) =>
      <li key={measureIndex} className={"sequencer-cell flex-uniform-size list-style-none border-box bb" + (this.props.currentStep === measureIndex ? " sequencer-currentStep" : "")}>
        <span className="inline-block center full-width">{measure}</span>
      </li>
      )}
    </ul>;
  };
};

class TrackPatternList extends React.Component {
  constructor(props) {
    super(props);
  };

  render() {
    return <ul className="flex full-height ml0 pl0 no-whitespace-wrap">
      {this.props.track.patterns.map((pattern, index) =>
      <li key={index} className={"sequencer-cell flex-uniform-size full-height list-style-none center border-box bb br" + (this.props.currentStep === index ? " sequencer-currentStep-light" : "")}>
        <TrackMeasure measure={index} trackID={this.props.track.id} pattern={pattern} trackPatternOptions={this.props.trackPatternOptions} setTrackPattern={this.props.setTrackPattern} />
      </li>
      )}
    </ul>;
  };
};

class TrackMeasure extends React.Component {
  constructor(props) {
    super(props);

    this.setMeasurePattern = this.setMeasurePattern.bind(this);
  };

  setMeasurePattern(e) {
    this.props.setTrackPattern(this.props.trackID, this.props.measure, parseInt(e.target.value, 10));
  };

  render() {
    return <span className="flex flex-align-center full-height pl-half pr-half border-box">
      <select className="full-width" value={this.props.pattern.patternID} onChange={this.setMeasurePattern}>
        <option key={0} value="-1"></option>
        {this.props.trackPatternOptions.map((trackPatternOption, index) =>
        <option key={index + 1} value={trackPatternOption.id}>{trackPatternOption.name}</option>
        )}
      </select>
    </span>;
  };
};

class TrackRemoveButton extends React.Component {
  constructor(props) {
    super(props);

    this.removeTrack = this.removeTrack.bind(this);
  };

  removeTrack(e) {
    this.props.removeTrack(this.props.trackID);
  };

  render() {
    return <button className="button-small button-hollow full-width round" onClick={this.removeTrack}>X</button>
  };
};


class Sequencer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      expanded: true,
    };

    this.toggleExpansion = this.toggleExpansion.bind(this);
  };

  toggleExpansion() {
    this.setState((prevState, props) => ({
      expanded: !prevState.expanded,
    }));
  };

  render() {
    return <div className="pt1 pb1 border-box bt-thick">
      <h2 className="mt0 mb1 pl1">Sequencer</h2>
      <div className="flex">
        <ul className={"flex flex-column mt0 ml0 pl0 overflow-scroll-x border-box " + (this.state.expanded ? "expanded" : "contracted")}>
          <li className="list-style-none pl1 border-box bb">
            <span>
              <button className="button-tiny button-hollow sequencer-expand" onClick={this.toggleExpansion}>&rarr;</button>
            </span>
          </li>
          {this.props.tracks.map((track) =>
            <TrackHeader key={track.id}
                         track={track}
                         setTrackName={this.props.setTrackName}
                         setTrackVolume={this.props.setTrackVolume}
                         toggleTrackMute={this.props.toggleTrackMute} />
          )}
        </ul>
        <ul className="flex flex-uniform-size flex-column mt0 ml0 pl0 overflow-scroll-x border-box">
          <li className="inline-block list-style-none full-width border-box">
            <TrackPatternListHeader currentStep={this.props.currentStep} />
          </li>
          {this.props.tracks.map((track) =>
          <li key={track.id} className="list-style-none full-width height-4 border-box">
            <TrackPatternList currentStep={this.props.currentStep} track={track} trackPatternOptions={this.props.trackPatternOptions[track.id]} setTrackPattern={this.props.setTrackPattern} />
          </li>
          )}
        </ul>
        <ul className={"flex flex-column mt0 ml0 pl0 overflow-scroll-x border-box" + (this.state.expanded ? "" : " display-none")}>
          <li className="list-style-none inline-block pr1 border-box bb">&nbsp;</li>
          {this.props.tracks.map((track) =>
          <li key={track.id} className="flex flex-align-center flex-uniform-size pl-half pr-half list-style-none border-box bb bl">
            <TrackRemoveButton trackID={track.id} removeTrack={this.props.removeTrack} />
          </li>
          )}
        </ul>
      </div>
      <div className="pl1">
        <button className="block button-full button-hollow" onClick={this.props.addTrack}>Add Track</button>
      </div>
    </div>;
  };
};

class InstrumentEditor extends React.Component {
  constructor(props) {
    super(props);

    this.setWaveForm1 = this.setWaveForm1.bind(this);
    this.setWaveForm2 = this.setWaveForm2.bind(this);
    this.setWaveForm1Octave = this.setWaveForm1Octave.bind(this);
    this.setWaveForm2Octave = this.setWaveForm2Octave.bind(this);
    this.setWaveForm2Detune = this.setWaveForm2Detune.bind(this);
    this.setFilterCutoff = this.setFilterCutoff.bind(this);
    this.setFilterResonance = this.setFilterResonance.bind(this);
    this.setLFOAmplitude = this.setLFOAmplitude.bind(this);
    this.setLFOFrequency = this.setLFOFrequency.bind(this);
    this.setLFOWaveForm = this.setLFOWaveForm.bind(this);
    this.setFilterModulator = this.setFilterModulator.bind(this);
    this.setFilterLFOAmplitude = this.setFilterLFOAmplitude.bind(this);
    this.setFilterLFOFrequency = this.setFilterLFOFrequency.bind(this);
    this.setFilterLFOWaveForm = this.setFilterLFOWaveForm.bind(this);
    this.setFilterEnvelopeAttack = this.setFilterEnvelopeAttack.bind(this);
    this.setFilterEnvelopeDecay = this.setFilterEnvelopeDecay.bind(this);
    this.setFilterEnvelopeSustain = this.setFilterEnvelopeSustain.bind(this);
    this.setFilterEnvelopeRelease = this.setFilterEnvelopeRelease.bind(this);
    this.setEnvelopeAttack = this.setEnvelopeAttack.bind(this);
    this.setEnvelopeDecay = this.setEnvelopeDecay.bind(this);
    this.setEnvelopeSustain = this.setEnvelopeSustain.bind(this);
    this.setEnvelopeRelease = this.setEnvelopeRelease.bind(this);
  };

  setWaveForm1(e) {
    this.props.updateInstrument(this.props.instrument.id, "waveform1", e.target.value);
  };

  setWaveForm2(e) {
    this.props.updateInstrument(this.props.instrument.id, "waveform2", e.target.value);
  };

  setWaveForm1Octave(e) {
    this.props.updateInstrument(this.props.instrument.id, "waveform1Octave", parseInt(e.target.value, 10));
  };

  setWaveForm2Octave(e) {
    this.props.updateInstrument(this.props.instrument.id, "waveform2Octave", parseInt(e.target.value, 10));
  };

  setWaveForm2Detune(e) {
    this.props.updateInstrument(this.props.instrument.id, "waveform2Detune", parseInt(e.target.value, 10));
  };

  setFilterCutoff(e) {
    this.props.updateInstrument(this.props.instrument.id, "filterCutoff", parseInt(e.target.value, 10));
  };

  setFilterResonance(e) {
    this.props.updateInstrument(this.props.instrument.id, "filterResonance", parseInt(e.target.value, 10));
  };

  setLFOAmplitude(e) {
    this.props.updateInstrument(this.props.instrument.id, "lfoAmplitude", parseInt(e.target.value, 10));
  };

  setLFOFrequency(e) {
    this.props.updateInstrument(this.props.instrument.id, "lfoFrequency", parseFloat(e.target.value));
  };

  setLFOWaveForm(e) {
    this.props.updateInstrument(this.props.instrument.id, "lfoWaveform", e.target.value);
  };

  setFilterModulator(e) {
    this.props.updateInstrument(this.props.instrument.id, "filterModulator", e.target.value);
  };

  setFilterLFOAmplitude(e) {
    this.props.updateInstrument(this.props.instrument.id, "filterLFOAmplitude", parseFloat(e.target.value));
  };

  setFilterLFOFrequency(e) {
    this.props.updateInstrument(this.props.instrument.id, "filterLFOFrequency", parseFloat(e.target.value));
  };

  setFilterLFOWaveForm(e) {
    this.props.updateInstrument(this.props.instrument.id, "filterLFOWaveform", e.target.value);
  };

  setFilterEnvelopeAttack(e) {
    this.props.updateInstrument(this.props.instrument.id, "filterEnvelopeAttack", parseFloat(e.target.value));
  };

  setFilterEnvelopeDecay(e) {
    this.props.updateInstrument(this.props.instrument.id, "filterEnvelopeDecay", parseFloat(e.target.value));
  };

  setFilterEnvelopeSustain(e) {
    this.props.updateInstrument(this.props.instrument.id, "filterEnvelopeSustain", parseFloat(e.target.value));
  };

  setFilterEnvelopeRelease(e) {
    this.props.updateInstrument(this.props.instrument.id, "filterEnvelopeRelease", parseFloat(e.target.value));
  };

  setEnvelopeAttack(e) {
    this.props.updateInstrument(this.props.instrument.id, "envelopeAttack", parseFloat(e.target.value));
  };

  setEnvelopeDecay(e) {
    this.props.updateInstrument(this.props.instrument.id, "envelopeDecay", parseFloat(e.target.value));
  };

  setEnvelopeSustain(e) {
    this.props.updateInstrument(this.props.instrument.id, "envelopeSustain", parseFloat(e.target.value));
  };

  setEnvelopeRelease(e) {
    this.props.updateInstrument(this.props.instrument.id, "envelopeRelease", parseFloat(e.target.value));
  };


  render() {
    let cutoffLFOModulation = <span>
      <span className="block mt1 lightText">Cutoff Wobble:</span>
        <span className="control">
        <label className="control-label indented">Amount:</label>
        <span className="annotated-input">
          <input onChange={this.setFilterLFOAmplitude} type="range" min="0.0" max="1.0" step="0.01" />
          <span>{(this.props.instrument.filterLFOAmplitude * 100).toFixed(0)}%</span>
        </span>
      </span>
      <span className="control">
        <label className="control-label indented">Rate:</label>
        <span className="annotated-input">
          <input onChange={this.setFilterLFOFrequency} type="range" min="0.0" max="20.0" step="0.1" />
          <span>{this.props.instrument.filterLFOFrequency}Hz</span>
        </span>
      </span>
      <span className="control">
        <label className="control-label indented">Waveform:</label>
        <span className="flex waveformOptionsContainer">
          <span className="radioContainer">
            <input id="filterLFOWaveformSine" value="sine" type="radio" checked={this.props.instrument.filterLFOWaveform === "sine"} onChange={this.setFilterLFOWaveForm} />
            <label htmlFor="filterLFOWaveformSine" className="radioLabel">Sine</label>
          </span>
          <span className="radioContainer">
            <input id="filterLFOWaveformSquare" value="square" type="radio" checked={this.props.instrument.filterLFOWaveform === "square"} onChange={this.setFilterLFOWaveForm} />
            <label htmlFor="filterLFOWaveformSquare" className="radioLabel">Square</label>
          </span>
          <span className="radioContainer">
            <input id="filterLFOWaveformSaw" value="sawtooth" type="radio" checked={this.props.instrument.filterLFOWaveform === "sawtooth"} onChange={this.setFilterLFOWaveForm} />
            <label htmlFor="filterLFOWaveformSaw" className="radioLabel">Saw</label>
          </span>
          <span className="radioContainer">
            <input id="filterLFOWaveformTriangle" value="triangle" type="radio" checked={this.props.instrument.filterLFOWaveform === "triangle"} onChange={this.setFilterLFOWaveForm} />
            <label htmlFor="filterLFOWaveformTriangle" className="radioLabel">Triangle</label>
          </span>
        </span>
      </span>
    </span>;

    let cutoffEnvelopeModulation = <span>
      <span className="block mt1 lightText">Cutoff Envelope:</span>
      <span className="control">
        <label className="control-label indented">Attack Speed:</label>
        <span className="annotated-input">
          <input type="range" min="0.0" max="0.3" step="0.01" value={this.props.instrument.filterEnvelopeAttack} onChange={this.setFilterEnvelopeAttack} />
          <span>{this.props.instrument.filterEnvelopeAttack * 1000} ms</span>
        </span>
      </span>
      <span className="control">
        <label className="control-label indented">Decay Speed:</label>
        <span className="annotated-input">
          <input type="range" min="0.0" max="0.3" step="0.01" value={this.props.instrument.filterEnvelopeDecay} onChange={this.setFilterEnvelopeDecay} />
          <span>{this.props.instrument.filterEnvelopeDecay * 1000} ms</span>
        </span>
      </span>
      <span className="control">
        <label className="control-label indented">Sustain:</label>
        <span className="annotated-input">
          <input type="range" min="0.0" max="1.0" step="0.01" value={this.props.instrument.filterEnvelopeSustain} onChange={this.setFilterEnvelopeSustain} />
          <span>{(this.props.instrument.filterEnvelopeSustain * 100).toFixed(0)}%</span>
        </span>
      </span>
      <span className="control">
        <label className="control-label indented">Release Speed:</label>
        <span className="annotated-input">
          <input type="range" min="0.0" max="0.3" step="0.01" value={this.props.instrument.filterEnvelopeRelease} onChange={this.setFilterEnvelopeRelease} />
          <span>{this.props.instrument.filterEnvelopeRelease * 1000} ms</span>
        </span>
      </span>
    </span>;

    let cutoffModulation = (this.props.instrument.filterModulator === "lfo") ? cutoffLFOModulation : cutoffEnvelopeModulation;


    return <div className="flex overflow-scroll-x pb1 instrument-panel-container">
      <div className="pr1 br instrument-panel">
        <h2 className="h3 section-header">Sound Generator</h2>
        <span className="block mt1 lightText">Base:</span>
        <span className="control">
          <label className="control-label indented">Waveform:</label>
          <span className="flex waveformOptionsContainer">
            <span className="radioContainer">
              <input id="waveformSine" value="sine" type="radio" checked={this.props.instrument.waveform1 === "sine"} onChange={this.setWaveForm1} />
              <label htmlFor="waveformSine" className="radioLabel">Sine</label>
            </span>
            <span className="radioContainer">
              <input id="waveformSquare" value="square" type="radio" checked={this.props.instrument.waveform1 === "square"} onChange={this.setWaveForm1} />
              <label htmlFor="waveformSquare" className="radioLabel">Square</label>
            </span>
            <span className="radioContainer">
              <input id="waveformSaw" value="sawtooth" type="radio" checked={this.props.instrument.waveform1 === "sawtooth"} onChange={this.setWaveForm1} />
              <label htmlFor="waveformSaw" className="radioLabel">Saw</label>
            </span>
            <span className="radioContainer">
              <input id="waveformTriangle" value="triangle" type="radio" checked={this.props.instrument.waveform1 === "triangle"} onChange={this.setWaveForm1} />
              <label htmlFor="waveformTriangle" className="radioLabel">Triangle</label>
            </span>
          </span>
        </span>
        <span className="control">
          <label className="control-label indented">Octave:</label>
          <span className="annotated-input">
            <input type="range" min="-2" max="2" step="1" value={this.props.instrument.waveform1Octave} onChange={this.setWaveForm1Octave} />
            <span>{(this.props.instrument.waveform1Octave > 0) ? "+" : ""}{this.props.instrument.waveform1Octave}</span>
          </span>
        </span>
        <span className="block mt1 lightText">Secondary:</span>
        <span className="control">
          <label className="control-label indented">Waveform:</label>
          <span className="flex waveformOptionsContainer">
            <span className="radioContainer">
              <input id="waveformSine2" value="sine" type="radio" checked={this.props.instrument.waveform2 === "sine"} onChange={this.setWaveForm2} />
              <label htmlFor="waveformSine2" className="radioLabel">Sine</label>
            </span>
            <span className="radioContainer">
              <input id="waveformSquare2" value="square" type="radio" checked={this.props.instrument.waveform2 === "square"} onChange={this.setWaveForm2} />
              <label htmlFor="waveformSquare2" className="radioLabel">Square</label>
            </span>
            <span className="radioContainer">
              <input id="waveformSaw2" value="sawtooth" type="radio" checked={this.props.instrument.waveform2 === "sawtooth"} onChange={this.setWaveForm2} />
              <label htmlFor="waveformSaw2" className="radioLabel">Saw</label>
            </span>
            <span className="radioContainer">
              <input id="waveformTriangle2" value="triangle" type="radio" checked={this.props.instrument.waveform2 === "triangle"} onChange={this.setWaveForm2} />
              <label htmlFor="waveformTriangle2" className="radioLabel">Triangle</label>
            </span>
          </span>
        </span>
        <span className="control">
          <label className="control-label indented">Octave:</label>
          <span className="annotated-input">
            <input type="range" min="-2" max="2" step="1" value={this.props.instrument.waveform2Octave} onChange={this.setWaveForm2Octave} />
            <span>{(this.props.instrument.waveform2Octave > 0) ? "+" : ""}{this.props.instrument.waveform2Octave}</span>
          </span>
        </span>
        <span className="control">
          <label className="control-label indented">Detune:</label>
          <span className="annotated-input">
            <input type="range" min="-100" max="100" step="1" value={this.props.instrument.waveform2Detune} onChange={this.setWaveForm2Detune} />
            <span>{this.props.instrument.waveform2Detune}c</span>
          </span>
        </span>
      </div>
      <div className="pl1 pr1 br border-box instrument-panel">
        <h2 className="h3 section-header">Filter</h2>
        <span className="control">
          <label className="control-label">Cutoff:</label>
          <span className="annotated-input">
            <input type="range" min="50" max="9950" step="50" value={this.props.instrument.filterCutoff} onChange={this.setFilterCutoff} />
            <span>{this.props.instrument.filterCutoff}Hz</span>
          </span>
        </span>
        <span className="control">
          <label className="control-label">Resonance:</label>
          <span className="annotated-input">
            <input type="range" min="0" max="20" step="1.0" value={this.props.instrument.filterResonance} onChange={this.setFilterResonance} />
            <span>{this.props.instrument.filterResonance}</span>
          </span>
        </span>
        <span className="control">
          <label className="control-label">Modulation:</label>
          <span className="flex waveformOptionsContainer">
            <span className="radioContainer">
              <input id="filterModulatorLFO" value="lfo" type="radio" checked={this.props.instrument.filterModulator === "lfo"} onChange={this.setFilterModulator} />
              <label htmlFor="filterModulatorLFO" className="radioLabel">Wobble</label>
            </span>
            <span className="radioContainer">
              <input id="filterModulatorEnvelope" value="envelope" type="radio" checked={this.props.instrument.filterModulator === "envelope"} onChange={this.setFilterModulator} />
              <label htmlFor="filterModulatorEnvelope" className="radioLabel">Envelope</label>
            </span>
          </span>
        </span>
        {cutoffModulation}
      </div>

      <div className="pl1 border-box instrument-panel">
        <h2 className="h3 section-header">Pitch Wobble</h2>
        <span className="control">
          <label className="control-label">Amount:</label>
          <span className="annotated-input">
            <input type="range" min="0" max="100" step="1" value={this.props.instrument.lfoAmplitude} onChange={this.setLFOAmplitude} />
            <span>{this.props.instrument.lfoAmplitude}Hz</span>
          </span>
        </span>
        <span className="control">
          <label className="control-label">Rate:</label>
          <span className="annotated-input">
            <input type="range" min="0.0" max="20.0" step="0.1" value={this.props.instrument.lfoFrequency} onChange={this.setLFOFrequency} />
            <span>{this.props.instrument.lfoFrequency}Hz</span>
          </span>
        </span>
        <span className="control">
          <label className="control-label">Waveform:</label>
          <span className="flex waveformOptionsContainer">
            <span className="radioContainer">
              <input id="lfoWaveformSine" value="sine" type="radio" checked={this.props.instrument.lfoWaveform === "sine"} onChange={this.setLFOWaveForm} />
              <label htmlFor="lfoWaveformSine" className="radioLabel">Sine</label>
            </span>
            <span className="radioContainer">
              <input id="lfoWaveformSquare" value="square" type="radio" checked={this.props.instrument.lfoWaveform === "square"} onChange={this.setLFOWaveForm} />
              <label htmlFor="lfoWaveformSquare" className="radioLabel">Square</label>
            </span>
            <span className="radioContainer">
              <input id="lfoWaveformSaw" value="sawtooth" type="radio" checked={this.props.instrument.lfoWaveform === "sawtooth"} onChange={this.setLFOWaveForm} />
              <label htmlFor="lfoWaveformSaw" className="radioLabel">Saw</label>
            </span>
            <span className="radioContainer">
              <input id="lfoWaveformTriangle" value="triangle" type="radio" checked={this.props.instrument.lfoWaveform === "triangle"} onChange={this.setLFOWaveForm} />
              <label htmlFor="lfoWaveformTriangle" className="radioLabel">Triangle</label>
            </span>
          </span>
        </span>

        <h2 className="h3 section-header">Loudness Envelope</h2>
        <span className="control">
          <label className="control-label">Attack Speed:</label>
          <span className="annotated-input">
            <input type="range" min="0.0" max="0.3" step="0.01" value={this.props.instrument.envelopeAttack} onChange={this.setEnvelopeAttack} />
            <span>{this.props.instrument.envelopeAttack * 1000} ms</span>
          </span>
        </span>
        <span className="control">
          <label className="control-label">Decay Speed:</label>
          <span className="annotated-input">
            <input type="range" min="0.0" max="0.3" step="0.01" value={this.props.instrument.envelopeDecay} onChange={this.setEnvelopeDecay} />
            <span>{this.props.instrument.envelopeDecay * 1000} ms</span>
          </span>
        </span>
        <span className="control">
          <label className="control-label">Sustain Volume:</label>
          <span className="annotated-input">
            <input type="range" min="0.0" max="1.0" step="0.01" value={this.props.instrument.envelopeSustain} onChange={this.setEnvelopeSustain} />
            <span>{(this.props.instrument.envelopeSustain * 100).toFixed(0)}%</span>
          </span>
        </span>
        <span className="control">
          <label className="control-label">Release Speed:</label>
          <span className="annotated-input">
            <input type="range" min="0.0" max="0.3" step="0.01" value={this.props.instrument.envelopeRelease} onChange={this.setEnvelopeRelease} />
            <span>{this.props.instrument.envelopeRelease * 1000} ms</span>
          </span>
        </span>
      </div>
    </div>;
  };
};


class PatternListItem extends React.Component {
  constructor(props) {
    super(props);

    this.setSelectedPatternID = this.setSelectedPatternID.bind(this);
    this.removePattern = this.removePattern.bind(this);
  };

  setSelectedPatternID(e) {
    this.props.setSelectedPattern(this.props.pattern.id);
  };

  removePattern(e) {
    e.stopPropagation();
    this.props.removePattern(this.props.pattern.id);
  };

  render() {
    return <li className={"flex flex-align-center flex-justify-space-between list-style-none pointer border-box mr1 width-5 " + (this.props.pattern.id === this.props.selectedPattern.id ? "paneTabSelected" : "paneTabUnselected")} onClick={this.setSelectedPatternID}>
      <span className="no-whitespace-wrap overflow-hidden-x overflow-ellipsis">{this.props.pattern.name}</span>
      <button className={"button-small button-hollow round ml1 pt0 pb0 pl0 pr0" + (this.props.removable ? "" : " display-none")} onClick={this.removePattern}>&nbsp;X&nbsp;</button>
    </li>
  };
};

class NoteInput extends React.Component {
  constructor(props) {
    super(props);

    this.setNoteValue = this.setNoteValue.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
  };

  setNoteValue(e) {
    let rawNoteValue = this.unformatNote(e.target.value);
    this.props.setNoteValue(rawNoteValue, this.props.patternID, this.props.rowIndex, this.props.noteIndex);
  };

  changeCurrentlySelectedNote(rowIndexDelta, noteIndexDelta) {
    let nextNoteId = `pattern-${this.props.patternID}-row-${this.props.rowIndex + rowIndexDelta}-note-${this.props.noteIndex + noteIndexDelta}`;

    document.getElementById(nextNoteId).focus();
  };

  onKeyDown(e) {
    let element = e.target;

    if (e.keyCode === 32) {  // Space bar
      this.props.setNoteValue("", this.props.patternID, this.props.rowIndex, this.props.noteIndex);
    }
    else if (e.keyCode >= 48 && e.keyCode <= 57) {  // Numbers 0 through 9
      if (/^.*\d$/.test(element.value)) {
        this.props.setNoteValue(this.unformatNote(element.value.slice(0, element.value.length - 1)), this.props.patternID, this.props.rowIndex, this.props.noteIndex);
      }
    }
    else if (e.keyCode === 189) {  // Dash
      this.props.setNoteValue("", this.props.patternID, this.props.rowIndex, this.props.noteIndex);
    }
    else if (e.keyCode === 37) {  // Left arrow key
      if (element.selectionStart === 0 && !(element.classList.contains('firstNote'))) {
        this.changeCurrentlySelectedNote(0, -1);
      }
    }
    else if (e.keyCode === 39) {  // Right arrow key
      if (element.selectionEnd === element.value.length && !(element.classList.contains('lastNote'))) {
        this.changeCurrentlySelectedNote(0, 1);
      }
    }
    else if (e.keyCode === 38) {  // Up arrow key
      if (!(element.classList.contains('firstRow'))) {
        this.changeCurrentlySelectedNote(-1, 0);
      }
    }
    else if (e.keyCode === 40) {  // Down arrow key
      if (!(element.classList.contains('lastRow'))) {
        this.changeCurrentlySelectedNote(1, 0);
      }
    }
  };

  onKeyUp(e) {
    if (e.keyCode === 32) {  // Space bar
      this.props.setNoteValue("", this.props.patternID, this.props.rowIndex, this.props.noteIndex);
    }
  };

  noteIsValid(rawNoteString) {
    return /^$|^-$|^ $|(^[A-G](b|bb|#|##){0,1}[0-7]$)/.test(rawNoteString);
  };

  formatNote(rawNoteString) {
    let formattedNoteName = rawNoteString;

    // Only make first character uppercase, but not subsequent characters, to avoid
    // making a 'b' uppercase, which will mess with ♭ replacement.
    let firstCharacter = formattedNoteName.substr(0, 1);
    formattedNoteName = firstCharacter.toUpperCase() + formattedNoteName.substr(1);

    formattedNoteName = formattedNoteName.replace("##", "𝄪");
    formattedNoteName = formattedNoteName.replace("#", "♯");
    formattedNoteName = formattedNoteName.replace("bb", "𝄫");
    formattedNoteName = formattedNoteName.replace("b", "♭");
    formattedNoteName = formattedNoteName.replace("-", "—");

    return formattedNoteName;
  };

  unformatNote(rawNoteString) {
    rawNoteString = rawNoteString.replace("♯", "#");
    rawNoteString = rawNoteString.replace("𝄪", "##");
    rawNoteString = rawNoteString.replace("♭", "b");
    rawNoteString = rawNoteString.replace("𝄫", "bb");

    return rawNoteString;
  };

  render() {
    let formattedNoteName = this.formatNote(this.props.note.name);
    let noteIsValid = this.noteIsValid(this.props.note.name);

    return <input id={`pattern-${this.props.patternID}-row-${this.props.rowIndex}-note-${this.props.noteIndex}`} type="text" maxLength="4" className={"note" + (this.props.rowIndex === 0 ? " firstRow" : "") + (this.props.rowIndex === this.props.rowCount - 1 ? " lastRow" : "") + (this.props.noteIndex === 0 ? " firstNote" : "") + (this.props.noteIndex === this.props.noteCount - 1 ? " lastNote" : "") + (noteIsValid ? "" : " ng-invalid ng-dirty")} value={formattedNoteName} onChange={this.setNoteValue} onKeyDown={this.onKeyDown} onKeyUp={this.onKeyUp} />;
  }
};

class PatternRowRemoveButton extends React.Component {
  constructor(props) {
    super(props);

    this.removePatternRow = this.removePatternRow.bind(this);
  }

  removePatternRow(e) {
    this.props.removePatternRow(this.props.patternID, this.props.rowIndex);
  };

  render() {
    return <button className="button-small button-hollow full-width round" onClick={this.removePatternRow}>X</button>;
  };
};

class PatternEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      tipsAndTricksVisible: false,
    };

    this.setPatternName = this.setPatternName.bind(this);
    this.addPattern = this.addPattern.bind(this);
    this.addPatternRow = this.addPatternRow.bind(this);
    this.removePatternRow = this.removePatternRow.bind(this);
    this.setTipsAndTricksVisible = this.setTipsAndTricksVisible.bind(this);
  };

  setPatternName(e) {
    this.props.setPatternName(this.props.selectedPattern.id, e.target.value);
  };

  addPattern(e) {
    this.props.addPattern(this.props.selectedPattern.trackID);
  };

  addPatternRow(e) {
    this.props.addPatternRow(this.props.selectedPattern.id);
  };

  removePatternRow(e) {
    this.props.removePatternRow();
  };

  setTipsAndTricksVisible(e) {
    this.setState((prevState, props) => ({
      tipsAndTricksVisible: !prevState.tipsAndTricksVisible,
    }));
  };

  render() {
    const tipsAndTricks = <ul className="toggleable">
      <li>A note is a letter between A and G plus an octave between 0 and 7. For example: <b>A3</b>, <b>C♯4</b>, <b>E♭2</b></li>
      <li>Use &lsquo;#&rsquo; to enter a sharp, and a lowercase &lsquo;b&rsquo; to enter a flat</li>
      <li>Use &mdash; to lengthen a note. For example, &lsquo;A4&mdash;&mdash;&mdash;&rsquo; will last for 4 steps, while &lsquo;A4&mdash;&rsquo; will last for two, and &lsquo;A4&rsquo; will last for one.</li>
      <li>Press <code>SPACE</code> to clear the current note</li>
      <li>Use the left/right arrow keys to move between notes, and the up/down arrow keys to move between rows</li>
    </ul>;

    return <div className={(this.state.selectedTab === "instrument" ? " display-none" : "")}>
      <div className="mb2">
        <ul className="flex pl0 mt0 mb1 overflow-scroll-x full-width">
          {this.props.patterns.map((pattern) =>
          <PatternListItem key={pattern.id} pattern={pattern} selectedPattern={this.props.selectedPattern} removable={this.props.patterns.length > 1} setSelectedPattern={this.props.setSelectedPattern} removePattern={this.props.removePattern} />
          )}
        </ul>
        <button className="block button-full button-hollow" onClick={this.addPattern}>Add Pattern</button>
      </div>

      <label>Name:</label> <input className="underlinedInput" value={this.props.selectedPattern.name} onChange={this.setPatternName} type="text" /> <span className="h4"><a className="helperToggle underline" onClick={this.setTipsAndTricksVisible}>Tips and Tricks</a></span>
      {(this.state.tipsAndTricksVisible === true) ? tipsAndTricks : undefined}
      <div className="flex">
        <ul className="flex flex-column flex-uniform-size mt0 ml0 pl0 overflow-scroll-x border-box">
          <li className="inline-block list-style-none full-width">
            <ul className="ml0 pl0 center no-whitespace-wrap">
              {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16].map((noteIndex) =>
              <li key={noteIndex} className="list-style-none inline-block note-container">
                <span className="h4 note-column-header">{noteIndex}</span>
              </li>
              )}
            </ul>
          </li>
          {this.props.selectedPattern.rows.map((patternRow, rowIndex) =>
          <li key={rowIndex} className="inline-block list-style-none full-width">
            <ul className="ml0 pl0 no-whitespace-wrap">
              {patternRow.notes.map((note, noteIndex) =>
              <li key={noteIndex} className="list-style-none inline-block note-container">
                <NoteInput note={note} patternID={this.props.selectedPattern.id} rowIndex={rowIndex} rowCount={this.props.selectedPattern.rows.length} noteIndex={noteIndex} noteCount={patternRow.notes.length} setNoteValue={this.props.setNoteValue} />
              </li>
              )}
            </ul>
          </li>
          )}
        </ul>
        <ul className="flex flex-column mt0 ml0 pl0 overflow-scroll-x border-box">
          <li className="list-style-none flex-uniform-size">&nbsp;</li>
          {this.props.selectedPattern.rows.map((patternRow, rowIndex) =>
          <li key={rowIndex} className="list-style-none flex-uniform-size">
            <PatternRowRemoveButton patternID={this.props.selectedPattern.id} rowIndex={rowIndex} removePatternRow={this.props.removePatternRow} />
          </li>
          )}
        </ul>
      </div>
      <div className="mb1 overflow-auto">
        <button className="block button-full button-hollow" onClick={this.addPatternRow}>Add Row</button>
      </div>
    </div>;
  };
};


class TrackEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedTab: "instrument",
    };

    this.setSelectedTrack = this.setSelectedTrack.bind(this);
    this.selectInstrumentTab = this.selectInstrumentTab.bind(this);
    this.selectPatternsTab = this.selectPatternsTab.bind(this);
  };

  setSelectedTrack(e) {
    this.props.setSelectedTrack(parseInt(e.target.value, 10));
  };

  selectInstrumentTab(e) {
    this.setState({ selectedTab: "instrument" });
  };

  selectPatternsTab(e) {
    this.setState({ selectedTab: "patterns" });
  };

  render() {
    let instrumentEditor = <InstrumentEditor instrument={this.props.instrument} updateInstrument={this.props.updateInstrument} />;
    let patternEditor = <PatternEditor patterns={this.props.patterns} selectedPattern={this.props.selectedPattern} setSelectedPattern={this.props.setSelectedPattern} setPatternName={this.props.setPatternName} addPattern={this.props.addPattern} removePattern={this.props.removePattern} addPatternRow={this.props.addPatternRow} removePatternRow={this.props.removePatternRow} setNoteValue={this.props.setNoteValue} />;

    let panel = (this.state.selectedTab === "instrument") ? instrumentEditor : patternEditor;

    return <div className="mt1 pl1 pr1 pt1 pb1 border-box bt-thick bb-thick">
      <div className="mb2">
        <h2 className="mt0 mb1">Track Editor</h2>
        <select className="mr2 inline-block width-5" style={{verticalAlign: "middle"}} value={this.props.selectedTrackID} onChange={this.setSelectedTrack}>
          {this.props.tracks.map((track) =>
          <option key={track.id} value={track.id}>{track.name}</option>
          )}
        </select>
        <ul className="m0 pl0 inline-block">
          <li className="inline-block list-style-none mr1">
            <a href="javascript:void(0);" className={"paneTab" + (this.state.selectedTab === "instrument" ? " paneTabSelected" : "")} onClick={this.selectInstrumentTab}>Instrument</a>
          </li>
          <li className="inline-block list-style-none">
            <a href="javascript:void(0);" className={"paneTab" + (this.state.selectedTab === "patterns" ? " paneTabSelected" : "")} onClick={this.selectPatternsTab}>Patterns</a>
          </li>
        </ul>
      </div>
      {panel}
    </div>;
  };
};


class App extends React.Component {
  constructor(props) {
    super(props);

    this.idGenerator = new IDGenerator(100);

    this.state = {
      transport: {
        enabled: true,
        playing: false,
        amplitude: 0.25,
        tempo: 100,
        step: undefined,
      },
      instruments: [
        {
          id:                 1,
          name:               'Melody',
          waveform1:          'sawtooth',
          waveform1Octave:    0,
          waveform2:          'sawtooth',
          waveform2Detune:    6,
          waveform2Octave:    0,
          lfoWaveform:        'sine',
          lfoFrequency:       5,
          lfoAmplitude:       6,
          filterCutoff:       2200,
          filterResonance:    0,
          filterModulator:    'lfo',
          filterLFOWaveform:  'sine',
          filterLFOFrequency: 5,
          filterLFOAmplitude: 0.46,
          filterEnvelopeAttack:  0.04,
          filterEnvelopeDecay:   0.0,
          filterEnvelopeSustain: 1.0,
          filterEnvelopeRelease: 0.2,
          envelopeAttack:     0.04,
          envelopeDecay:      0.0,
          envelopeSustain:    1.0,
          envelopeRelease:    0.2,
        },
        {
          id:                 2,
          name:               'Chords',
          waveform1:          'triangle',
          waveform1Octave:    0,
          waveform2:          'sine',
          waveform2Detune:    6,
          waveform2Octave:    0,
          lfoWaveform:        'sine',
          lfoFrequency:       5,
          lfoAmplitude:       0,
          filterCutoff:       1400,
          filterResonance:    0,
          filterModulator:    'lfo',
          filterLFOWaveform:  'sine',
          filterLFOFrequency: 2.4,
          filterLFOAmplitude: 0.78,
          filterEnvelopeAttack:  0.04,
          filterEnvelopeDecay:   0.0,
          filterEnvelopeSustain: 1.0,
          filterEnvelopeRelease: 0.2,
          envelopeAttack:     0.05,
          envelopeDecay:      0.0,
          envelopeSustain:    1.0,
          envelopeRelease:    0.0,
        },
        {
          id:                 3,
          name:               'Bass',
          waveform1:          'sawtooth',
          waveform1Octave:    0,
          waveform2:          'sawtooth',
          waveform2Detune:    0,
          waveform2Octave:    0,
          lfoWaveform:        'sine',
          lfoFrequency:       5,
          lfoAmplitude:       0,
          filterCutoff:       1200,
          filterResonance:    0,
          filterModulator:    'lfo',
          filterLFOWaveform:  'sine',
          filterLFOFrequency: 5,
          filterLFOAmplitude: 0,
          filterEnvelopeAttack:  0.04,
          filterEnvelopeDecay:   0.0,
          filterEnvelopeSustain: 1.0,
          filterEnvelopeRelease: 0.2,
          envelopeAttack:     0.02,
          envelopeDecay:      0.0,
          envelopeSustain:    1.0,
          envelopeRelease:    0.0,
        },
      ],
      patterns: [
        {
          id: 1,
          name: 'Melody 1',
          trackID: 1,
          rows: [
            {
              notes: [{name: 'G2'},
                      {name: '-'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},
                      {name: ''},
                      {name: ''},
                      {name: ''},
                      {name: 'G2'},
                      {name: '-'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},
                      {name: ''},
                      {name: ''},
                      {name: ''},],
            },
          ],
        },
        {
          id: 2,
          name: 'Melody 2',
          trackID: 1,
          rows: [
            {
              notes: [{name: 'Ab2'},
                      {name: 'Bb3'},
                      {name: 'C3'},
                      {name: '-'},
                      {name: '-'},
                      {name: '-'},
                      {name: '-'},
                      {name: '-'},
                      {name: '-'},
                      {name: '-'},
                      {name: '-'},
                      {name: '-'},
                      {name: 'Bb3'},
                      {name: ''},
                      {name: 'Ab2'},
                      {name: ''},],
            },
          ],
        },
        {
          id: 3,
          name: 'Melody 3',
          trackID: 1,
          rows: [
            {
              notes: [{name: 'G2'},
                      {name: '-'},
                      {name: '-'},
                      {name: '-'},
                      {name: 'Eb3'},
                      {name: '-'},
                      {name: '-'},
                      {name: '-'},
                      {name: 'B3'},
                      {name: 'C3'},
                      {name: 'B3'},
                      {name: 'C3'},
                      {name: 'B3'},
                      {name: 'C3'},
                      {name: 'A3'},
                      {name: 'B3'},],
            },
          ],
        },
        {
          id: 4,
          name: 'Melody 4',
          trackID: 1,
          rows: [
            {
              notes: [{name: 'C3'},
                      {name: '-'},
                      {name: '-'},
                      {name: '-'},
                      {name: '-'},
                      {name: '-'},
                      {name: '-'},
                      {name: '-'},
                      {name: '-'},
                      {name: '-'},
                      {name: '-'},
                      {name: '-'},
                      {name: '-'},
                      {name: '-'},
                      {name: '-'},
                      {name: '-'},],
            },
          ],
        },
        {
          id: 5,
          name: 'Melody 5',
          trackID: 1,
          rows: [
            {
              notes: [{name: 'C3'},
                      {name: '-'},
                      {name: '-'},
                      {name: '-'},
                      {name: '-'},
                      {name: '-'},
                      {name: '-'},
                      {name: '-'},
                      {name: '-'},
                      {name: '-'},
                      {name: '-'},
                      {name: '-'},
                      {name: 'C3'},
                      {name: '-'},
                      {name: '-'},
                      {name: '-'},],
            },
          ],
        },
        {
          id: 6,
          name: 'Melody 6',
          trackID: 1,
          rows: [
            {
              notes: [{name: 'C3'},
                      {name: ''},
                      {name: 'Bb3'},
                      {name: '-'},
                      {name: '-'},
                      {name: '-'},
                      {name: '-'},
                      {name: '-'},
                      {name: 'G2'},
                      {name: '-'},
                      {name: '-'},
                      {name: '-'},
                      {name: '-'},
                      {name: '-'},
                      {name: '-'},
                      {name: '-'},],
            },
          ],
        },
        {
          id: 7,
          name: 'Chords 1',
          trackID: 2,
          rows: [
            {
              notes: [{name: 'G3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},
                      {name: 'G3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},
                      {name: 'G3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},
                      {name: 'G3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},],
            },
            {
              notes: [{name: 'Eb3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},
                      {name: 'Eb3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},
                      {name: 'Eb3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},
                      {name: 'Eb3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},],
            },
            {
              notes: [{name: 'C3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},
                      {name: 'C3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},
                      {name: 'C3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},
                      {name: 'C3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},],
            },
          ],
        },
        {
          id: 8,
          name: 'Chords 2',
          trackID: 2,
          rows: [
            {
              notes: [{name: 'Ab3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},
                      {name: 'Ab3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},
                      {name: 'Ab3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},
                      {name: 'Ab3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},],
            },
            {
              notes: [{name: 'F3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},
                      {name: 'F3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},
                      {name: 'F3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},
                      {name: 'F3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},],
            },
            {
              notes: [{name: 'C3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},
                      {name: 'C3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},
                      {name: 'C3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},
                      {name: 'C3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},],
            },
          ],
        },
        {
          id: 9,
          name: 'Chords 3',
          trackID: 2,
          rows: [
            {
              notes: [{name: 'G3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},
                      {name: 'G3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},
                      {name: 'G3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},
                      {name: 'G3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},],
            },
            {
              notes: [{name: 'Eb3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},
                      {name: 'Eb3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},
                      {name: 'F3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},
                      {name: 'F3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},],
            },
            {
              notes: [{name: 'C3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},
                      {name: 'C3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},
                      {name: 'D3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},
                      {name: 'D3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},],
            },
          ],
        },
        {
          id: 10,
          name: 'Chords 4',
          trackID: 2,
          rows: [
            {
              notes: [{name: 'G3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},
                      {name: 'G3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},
                      {name: 'G3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},
                      {name: 'G3'},
                      {name: '-'},
                      {name: '-'},
                      {name: 'Ab3'},],
            },
            {
              notes: [{name: 'Eb3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},
                      {name: 'Eb3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},
                      {name: 'Eb3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},
                      {name: 'Eb3'},
                      {name: '-'},
                      {name: '-'},
                      {name: 'F3'},],
            },
            {
              notes: [{name: 'C3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},
                      {name: 'C3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},
                      {name: 'C3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},
                      {name: 'C3'},
                      {name: '-'},
                      {name: '-'},
                      {name: 'C3'},],
            },
          ],
        },
        {
          id: 11,
          name: 'Chords 5',
          trackID: 2,
          rows: [
            {
              notes: [{name: 'G3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},
                      {name: 'G3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},
                      {name: 'G3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},
                      {name: 'G3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},],
            },
            {
              notes: [{name: 'Eb3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},
                      {name: 'Eb3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},
                      {name: 'Eb3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},
                      {name: 'Eb3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},],
            },
            {
              notes: [{name: 'Bb3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},
                      {name: 'Bb3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},
                      {name: 'Bb3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},
                      {name: 'C3'},
                      {name: '-'},
                      {name: '-'},
                      {name: ''},],
            },
          ],
        },
        {
          id: 12,
          name: 'Bass 1',
          trackID: 3,
          rows: [
            {
              notes: [{name: 'C1'},
                      {name: ''},
                      {name: ''},
                      {name: ''},
                      {name: 'C1'},
                      {name: ''},
                      {name: ''},
                      {name: ''},
                      {name: 'C1'},
                      {name: ''},
                      {name: ''},
                      {name: ''},
                      {name: 'C1'},
                      {name: ''},
                      {name: ''},
                      {name: ''},],
            },
          ],
        },
        {
          id: 13,
          name: 'Bass 2',
          trackID: 3,
          rows: [
            {
              notes: [{name: 'C1'},
                      {name: ''},
                      {name: ''},
                      {name: ''},
                      {name: 'C1'},
                      {name: ''},
                      {name: ''},
                      {name: ''},
                      {name: 'G0'},
                      {name: ''},
                      {name: ''},
                      {name: ''},
                      {name: 'G0'},
                      {name: ''},
                      {name: ''},
                      {name: ''},],
            },
          ],
        },
        {
          id: 14,
          name: 'Bass 3',
          trackID: 3,
          rows: [
            {
              notes: [{name: 'C1'},
                      {name: ''},
                      {name: ''},
                      {name: ''},
                      {name: 'C1'},
                      {name: ''},
                      {name: ''},
                      {name: ''},
                      {name: 'C1'},
                      {name: ''},
                      {name: ''},
                      {name: ''},
                      {name: 'C1'},
                      {name: ''},
                      {name: ''},
                      {name: 'F0'},],
            },
          ],
        },
        {
          id: 15,
          name: 'Bass 4',
          trackID: 3,
          rows: [
            {
              notes: [{name: 'Eb1'},
                      {name: ''},
                      {name: ''},
                      {name: ''},
                      {name: 'Eb1'},
                      {name: ''},
                      {name: ''},
                      {name: ''},
                      {name: 'Eb1'},
                      {name: ''},
                      {name: ''},
                      {name: ''},
                      {name: 'C1'},
                      {name: ''},
                      {name: ''},
                      {name: ''},],
            },
          ],
        },
        {
          id: 16,
          name: 'Bass 5',
          trackID: 3,
          rows: [
            {
              notes: [{name: 'G0'},
                      {name: ''},
                      {name: ''},
                      {name: ''},
                      {name: 'G0'},
                      {name: ''},
                      {name: ''},
                      {name: ''},
                      {name: 'G0'},
                      {name: ''},
                      {name: ''},
                      {name: ''},
                      {name: 'G0'},
                      {name: ''},
                      {name: ''},
                      {name: ''},],
            },
          ],
        },
      ],
      tracks: [
        {
          id: 1,
          name: "Melody",
          instrumentID: 1,
          muted: false,
          volume: 0.8,
          patterns: [
            { patternID: 1, },
            { patternID: 2, },
            { patternID: 3, },
            { patternID: 4, },
            { patternID: 5, },
            { patternID: 6, },
            { patternID: 3, },
            { patternID: 4, },
          ],
        },
        {
          id: 2,
          name: "Chords",
          instrumentID: 2,
          muted: false,
          volume: 0.8,
          patterns: [
            { patternID:  7, },
            { patternID:  8, },
            { patternID:  9, },
            { patternID: 10, },
            { patternID:  7, },
            { patternID: 11, },
            { patternID:  9, },
            { patternID:  7, },
          ],
        },
        {
          id: 3,
          name: "Bass",
          instrumentID: 3,
          muted: false,
          volume: 0.8,
          patterns: [
            { patternID: 12, },
            { patternID: 12, },
            { patternID: 13, },
            { patternID: 14, },
            { patternID: 12, },
            { patternID: 15, },
            { patternID: 16, },
            { patternID: 12, },
          ],
        },
      ],
      selectedTrackID: 1,
      selectedPatternID: 1,
      downloadFileName: "js-120",
    };

    this.itemByID = this.itemByID.bind(this);
    this.indexByID = this.indexByID.bind(this);

    // Transport
    let stopCallback = function() { };
    this.timeoutID = undefined;
    this.songPlayer = new JSSynth.SongPlayer();
    this.offlineSongPlayer = new JSSynth.SongPlayer();
    this.transport = new JSSynth.Transport(this.songPlayer, stopCallback);
    this.togglePlaying = this.togglePlaying.bind(this);
    this.updateAmplitude = this.updateAmplitude.bind(this);
    this.updateTempo = this.updateTempo.bind(this);
    this.setDownloadFileName = this.setDownloadFileName.bind(this);
    this.export = this.export.bind(this);
    this.syncTransportNotes();

    // Sequencer
    this.setTrackName = this.setTrackName.bind(this);
    this.setTrackVolume = this.setTrackVolume.bind(this);
    this.toggleTrackMute = this.toggleTrackMute.bind(this);
    this.setTrackPattern = this.setTrackPattern.bind(this);
    this.addTrack = this.addTrack.bind(this);
    this.removeTrack = this.removeTrack.bind(this);

    // Track Editor
    this.setSelectedTrack = this.setSelectedTrack.bind(this);
    this.trackByID = this.trackByID.bind(this);
    this.instrumentByID = this.instrumentByID.bind(this);
    this.patternByID = this.patternByID.bind(this);
    this.patternIndexByID = this.patternIndexByID.bind(this);
    this.patternsByTrackID = this.patternsByTrackID.bind(this);
    this.setPatternName = this.setPatternName.bind(this);
    this.setSelectedPattern = this.setSelectedPattern.bind(this);
    this.updateInstrument = this.updateInstrument.bind(this);
    this.addPattern = this.addPattern.bind(this);
    this.removePattern = this.removePattern.bind(this);
    this.addPatternRow = this.addPatternRow.bind(this);
    this.removePatternRow = this.removePatternRow.bind(this);
    this.setNoteValue = this.setNoteValue.bind(this);
  };

  itemByID(array, targetID) {
    let i;
    for (i = 0; i < array.length; i++) {
      if (array[i].id === targetID) {
        return array[i];
      }
    }

    return undefined;
  };

  indexByID(array, targetID) {
    let i;
    for (i = 0; i < array.length; i++) {
      if (array[i].id === targetID) {
        return i;
      }
    }

    return undefined;
  };

  trackByID(id) {
    return this.itemByID(this.state.tracks, id);
  };

  trackIndexByID(id) {
    return this.indexByID(this.state.tracks, id);
  };

  instrumentByID(id) {
    return this.itemByID(this.state.instruments, id);
  };

  instrumentIndexByID(id) {
    return this.indexByID(this.state.instruments, id);
  };

  patternByID(id) {
    return this.itemByID(this.state.patterns, id);
  };

  patternIndexByID(id) {
    return this.indexByID(this.state.patterns, id);
  };

  patternsByTrackID(trackID) {
    let i;
    let patterns = [];

    for (i = 0; i < this.state.patterns.length; i++) {
      if (this.state.patterns[i].trackID === trackID) {
        patterns.push(this.state.patterns[i]);
      }
    }

    return patterns;
  };

  searchForNextPatternIDAscending(trackID, patterns, startIndex) {
    let i = startIndex;

    while (i < patterns.length) {
      if (patterns[i].trackID === trackID) {
        return patterns[i].id;
      }
      i++;
    }

    return undefined;
  };

  searchForNextPatternIDDescending(trackID, patterns, startIndex) {
    let i = startIndex;

    while (i >= 0) {
      if (patterns[i].trackID === trackID) {
        return patterns[i].id;
      }
      i--;
    }

    return undefined;
  };

  updateTempo(e) {
    const newTempo = parseInt(e.target.value, 10);

    this.setState((prevState, props) => ({
      transport: {
        enabled: prevState.transport.enabled,
        playing: prevState.transport.playing,
        amplitude: prevState.transport.amplitude,
        tempo: newTempo,
        step: prevState.transport.step,
      }
    }));
    this.transport.setTempo(newTempo);
  };

  updateAmplitude(e) {
    const newAmplitude = parseFloat(e.target.value);

    this.setState((prevState, props) => ({
      transport: {
        enabled: prevState.transport.enabled,
        playing: prevState.transport.playing,
        amplitude: newAmplitude,
        tempo: prevState.transport.tempo,
        step: prevState.transport.step,
      }
    }));
    this.transport.setAmplitude(newAmplitude);
  };

  syncCurrentStep() {
    let newStep = Math.floor((this.transport.currentStep() / 16) % 8);

    this.setState((prevState, props) => ({
      transport: {
        enabled: prevState.transport.enabled,
        playing: prevState.transport.playing,
        amplitude: prevState.transport.amplitude,
        tempo: prevState.transport.tempo,
        step: newStep,
      }
    }));
  };

  togglePlaying(e) {
    this.transport.toggle();

    if (!this.state.transport.playing) {
      this.timeoutID = setInterval(() => this.syncCurrentStep(), 15);

      this.setState((prevState, props) => ({
        transport: {
          enabled: prevState.transport.enabled,
          playing: !(prevState.transport.playing),
          amplitude: prevState.transport.amplitude,
          tempo: prevState.transport.tempo,
          step: prevState.transport.step,
        }
      }));
    }
    else {
      clearInterval(this.timeoutID);

      this.setState((prevState, props) => ({
        transport: {
          enabled: prevState.transport.enabled,
          playing: !(prevState.transport.playing),
          amplitude: prevState.transport.amplitude,
          tempo: prevState.transport.tempo,
          step: undefined,
        }
      }));
    }
  };

  syncTransportNotes() {
    let serializedNotes = Serializer.serialize(this.state.tracks, this.state.instruments, this.state.patterns);
    this.songPlayer.replaceNotes(serializedNotes);
    this.offlineSongPlayer.replaceNotes(serializedNotes);
  };

  setTrackName(id, newTrackName) {
    let tracks = this.state.tracks;
    let newTrackList = tracks.concat([]);
    let i;
    for (i = 0; i < newTrackList.length; i++) {
      if (newTrackList[i].id == id) {
        newTrackList[i].name = newTrackName;
      }
    }

    this.setState({
      tracks: newTrackList
    });
  };

  setTrackVolume(id, newTrackVolume) {
    let tracks = this.state.tracks;
    let newTrackList = tracks.concat([]);
    let i;
    for (i = 0; i < newTrackList.length; i++) {
      if (newTrackList[i].id == id) {
        newTrackList[i].volume = newTrackVolume;
      }
    }

    this.setState({
      tracks: newTrackList
    });
    this.syncTransportNotes();
  };

  toggleTrackMute(id, newMutedState) {
    let tracks = this.state.tracks;
    let newTrackList = tracks.concat([]);
    let i;
    for (i = 0; i < newTrackList.length; i++) {
      if (newTrackList[i].id == id) {
        newTrackList[i].muted = newMutedState;
      }
    }

    this.setState({
      tracks: newTrackList
    });
    this.syncTransportNotes();
  };

  setTrackPattern(trackID, measure, patternID) {
    this.trackByID(trackID).patterns[measure].patternID = patternID;
    this.forceUpdate();

    this.syncTransportNotes();
  };

  addTrack() {
    let newInstrumentID = this.idGenerator.next();
    let newInstrument = {
      id:                    newInstrumentID,
      name:                  'Instrument ' + newInstrumentID,
      waveform1:             'sawtooth',
      waveform1Octave:       0,
      waveform2:             'square',
      waveform2Detune:       0,
      waveform2Octave:       0,
      lfoWaveform:           'sine',
      lfoFrequency:          5,
      lfoAmplitude:          0,
      filterCutoff:          9950,
      filterResonance:       0,
      filterModulator:       'lfo',
      filterLFOWaveform:     'sine',
      filterLFOFrequency:    5,
      filterLFOAmplitude:    0,
      filterEnvelopeAttack:  0.0,
      filterEnvelopeDecay:   0.0,
      filterEnvelopeSustain: 1.0,
      filterEnvelopeRelease: 0.0,
      envelopeAttack:        0.0,
      envelopeDecay:         0.0,
      envelopeSustain:       1.0,
      envelopeRelease:       0.0,
    };

    let newTrack = {
      id: this.idGenerator.next(),
      name: 'New Track',
      instrumentID: newInstrument.id,
      muted: false,
      volume: 0.8,
      patterns: [
        { patternID: -1, },
        { patternID: -1, },
        { patternID: -1, },
        { patternID: -1, },
        { patternID: -1, },
        { patternID: -1, },
        { patternID: -1, },
        { patternID: -1, },
      ],
    };

    let newPattern = {
      id: this.idGenerator.next(),
      name: newTrack.name + " 1",
      trackID: newTrack.id,
      rows: [
        {
          notes: [{name: ''},
                  {name: ''},
                  {name: ''},
                  {name: ''},
                  {name: ''},
                  {name: ''},
                  {name: ''},
                  {name: ''},
                  {name: ''},
                  {name: ''},
                  {name: ''},
                  {name: ''},
                  {name: ''},
                  {name: ''},
                  {name: ''},
                  {name: ''},],
        },
      ]
    };


    this.setState((prevState, props) => ({
      instruments: prevState.instruments.concat([newInstrument]),
      patterns: prevState.patterns.concat([newPattern]),
      tracks: prevState.tracks.concat([newTrack])
    }));
  };

  removeTrackInner(id) {
    let track = this.trackByID(id);
    let trackIndex = this.trackIndexByID(id);
    let newSelectedTrackID = this.state.selectedTrackID;
    let newSelectedPatternID = this.state.selectedPatternID;

    let newInstruments = this.state.instruments.concat([]);
    newInstruments.splice(this.instrumentIndexByID(track.instrumentID), 1);

    let newTracks = this.state.tracks.concat([]);
    newTracks.splice(trackIndex, 1);

    let newPatterns = this.state.patterns.concat([]);
    newPatterns = newPatterns.filter(pattern => pattern.trackID !== track.id);

    if (newSelectedTrackID === id && newTracks.length > 0) {
      if (trackIndex === this.state.tracks.length - 1) {
        newSelectedTrackID = this.state.tracks[trackIndex - 1].id;
      }
      else {
        newSelectedTrackID = this.state.tracks[trackIndex + 1].id;
      }
      newSelectedPatternID = this.patternsByTrackID(newSelectedTrackID)[0].id;
    }

    this.setState({
      selectedTrackID: newSelectedTrackID,
      selectedPatternID: newSelectedPatternID,
      instruments: newInstruments,
      patterns: newPatterns,
      tracks: newTracks,
    }, function() {
      this.syncTransportNotes();
    });
  };

  removeTrack(id) {
    if (this.state.tracks.length === 1) {
      this.addTrack();

      let newSelectedTrackID = this.state.tracks[this.state.tracks.length - 1].id;

      this.setState({
        selectedTrackID: newSelectedTrackID,
        selectedPatternID: this.patternsByTrackID(newSelectedTrackID)[0].id,
      }, function() {
        this.removeTrackInner(id);
      });
    }
    else {
      this.removeTrackInner(id);
    }
  };

  addPattern(trackID) {
    let track = this.trackByID(trackID);
    let newPatternID = this.idGenerator.next();

    let newPattern = {
      id: this.idGenerator.next(),
      name: track.name + " " + (this.patternsByTrackID(trackID).length + 1),
      trackID: trackID,
      rows: [
        {
          notes: [{name: ''},
                  {name: ''},
                  {name: ''},
                  {name: ''},
                  {name: ''},
                  {name: ''},
                  {name: ''},
                  {name: ''},
                  {name: ''},
                  {name: ''},
                  {name: ''},
                  {name: ''},
                  {name: ''},
                  {name: ''},
                  {name: ''},
                  {name: ''},],
        },
      ]
    };

    this.setState({patterns: this.state.patterns.concat(newPattern)});
  };

  removePattern(id) {
    let i;
    let pattern = this.patternByID(id);
    let patternIndex = this.patternIndexByID(id);
    let newPatterns = this.state.patterns.concat([]);
    let track = this.trackByID(pattern.trackID);
    let trackIndex = this.trackIndexByID(track.id);
    let newTracks = this.state.tracks.concat([]);
    let newTrack = Object.assign({}, track);

    let newSelectedPatternID = this.state.selectedPatternID;

    newPatterns.splice(patternIndex, 1);

    newTrack.patterns = track.patterns.concat([]);
    for (i = 0; i < newTrack.patterns.length; i++) {
      if (newTrack.patterns[i].patternID === pattern.id) {
        newTrack.patterns[i].patternID = -1;
      }
    }
    newTracks[trackIndex] = newTrack;

    if (newSelectedPatternID === pattern.id) {
      newSelectedPatternID = this.searchForNextPatternIDAscending(track.id, this.state.patterns, patternIndex + 1);
      if (newSelectedPatternID === undefined) {
        newSelectedPatternID = this.searchForNextPatternIDDescending(track.id, this.state.patterns, patternIndex - 1);
      }
    }

    this.setState({
      patterns: newPatterns,
      tracks: newTracks,
      selectedPatternID: newSelectedPatternID,
    }, function() {
      this.syncTransportNotes();
    });
  };

  addPatternRow(patternID) {
    let newRow = {
      notes: [{name: ''},
              {name: ''},
              {name: ''},
              {name: ''},
              {name: ''},
              {name: ''},
              {name: ''},
              {name: ''},
              {name: ''},
              {name: ''},
              {name: ''},
              {name: ''},
              {name: ''},
              {name: ''},
              {name: ''},
              {name: ''}],
    };

    let pattern = this.patternByID(patternID);
    pattern.rows.push(newRow);
    this.forceUpdate();
  };

  removePatternRow(patternID, rowIndex) {
    let patternIndex = this.patternIndexByID(patternID);

    let newPatterns = this.state.patterns.concat([]);
    newPatterns[patternIndex].rows.splice(rowIndex, 1);
    if (newPatterns[patternIndex].rows.length === 0) {
      newPatterns[patternIndex].rows.push({
        notes: [{name: ''},
                {name: ''},
                {name: ''},
                {name: ''},
                {name: ''},
                {name: ''},
                {name: ''},
                {name: ''},
                {name: ''},
                {name: ''},
                {name: ''},
                {name: ''},
                {name: ''},
                {name: ''},
                {name: ''},
                {name: ''}],
      });
    }

    this.setState({
      patterns: newPatterns,
    }, function() {
      this.syncTransportNotes();
    });
  };

  setSelectedTrack(newSelectedTrackID) {
    let newSelectedPatternID = this.state.selectedPatternID;
    if (newSelectedTrackID !== this.state.selectedTrackID) {
      newSelectedPatternID = this.searchForNextPatternIDAscending(newSelectedTrackID, this.state.patterns, 0);
    }

    this.setState({
      selectedTrackID: newSelectedTrackID,
      selectedPatternID: newSelectedPatternID,
    });
  };

  setSelectedPattern(newSelectedPatternID) {
    this.setState({ selectedPatternID: newSelectedPatternID });
  };

  setPatternName(patternID, newName) {
    this.patternByID(patternID).name = newName;
    this.forceUpdate();
  };

  setNoteValue(noteValue, patternID, rowIndex, noteIndex) {
    let i;
    let pattern = this.patternByID(patternID);

    pattern.rows[rowIndex].notes[noteIndex].name = noteValue;

    if (noteValue === "-") {
      i = noteIndex - 1;
      while (i >= 0 && pattern.rows[rowIndex].notes[i].name === "") {
        pattern.rows[rowIndex].notes[i].name = "-";
        i -= 1;
      }
    }
    else if (noteValue === "") {
      i = noteIndex + 1;
      while (i < pattern.rows[rowIndex].notes.length && pattern.rows[rowIndex].notes[i].name === "-") {
        pattern.rows[rowIndex].notes[i].name = "";
        i += 1;
      }
    }

    this.forceUpdate();
    this.syncTransportNotes();
  };

  updateInstrument(id, field, value) {
    this.instrumentByID(id)[field] = value;
    this.forceUpdate();

    this.syncTransportNotes();
  };

  setDownloadFileName(e) {
    this.setState({ downloadFileName: e.target.value });
  };

  export(e) {
    let exportCompleteCallback = function(blob) {
      let url = window.URL.createObjectURL(blob);

      let hiddenDownloadLink = document.getElementById("hidden-download-link");
      hiddenDownloadLink.href = url;
      hiddenDownloadLink.click();

      window.URL.revokeObjectURL(blob);
    };

    let offlineTransport = new JSSynth.OfflineTransport(this.offlineSongPlayer, this.state.transport.tempo, this.state.transport.amplitude, exportCompleteCallback);
    offlineTransport.tick();
  };

  render() {
    let selectedTrack = this.trackByID(this.state.selectedTrackID);
    let instrument = this.instrumentByID(selectedTrack.instrumentID);
    let patterns = this.patternsByTrackID(this.state.selectedTrackID);

    let i;
    let trackPatternOptions = {};
    for (i = 0; i < this.state.tracks.length; i++) {
      trackPatternOptions[this.state.tracks[i].id] = this.patternsByTrackID(this.state.tracks[i].id);
    }

    return <div>
      <div id="header" className="flex flex-align-center pl1 pr1 pt1 pb1 border-box full-width">
        <div id="logo-container">
          <h1 className="logo h2 bold mt0 mb0">JS-120</h1>
          <span className="lightText">Web Synthesizer</span>
        </div>
        <Transport enabled={this.state.transport.enabled}
                   playing={this.state.transport.playing}
                   amplitude={this.state.transport.amplitude}
                   tempo={this.state.transport.tempo}
                   togglePlaying={this.togglePlaying}
                   updateAmplitude={this.updateAmplitude}
                   updateTempo={this.updateTempo} />
        <Download downloadFileName={this.state.downloadFileName} setDownloadFileName={this.setDownloadFileName} export={this.export} />
      </div>
      <Sequencer tracks={this.state.tracks}
                 trackPatternOptions={trackPatternOptions}
                 currentStep={this.state.transport.step}
                 setTrackName={this.setTrackName}
                 setTrackVolume={this.setTrackVolume}
                 toggleTrackMute={this.toggleTrackMute}
                 setTrackPattern={this.setTrackPattern}
                 addTrack={this.addTrack}
                 removeTrack={this.removeTrack} />
      <TrackEditor tracks={this.state.tracks}
                   selectedTrackID={this.state.selectedTrackID}
                   selectedPattern={this.patternByID(this.state.selectedPatternID)}
                   instrument={instrument}
                   patterns={patterns}
                   setSelectedTrack={this.setSelectedTrack}
                   updateInstrument={this.updateInstrument}
                   setSelectedPattern={this.setSelectedPattern}
                   setPatternName={this.setPatternName}
                   addPattern={this.addPattern}
                   removePattern={this.removePattern}
                   addPatternRow={this.addPatternRow}
                   removePatternRow={this.removePatternRow}
                   setNoteValue={this.setNoteValue} />
      <div className="flex flex-column flex-uniform-size flex-justify-end mt2">
        <p className="center mt0 mb1">Made by <a href="http://www.joelstrait.com">Joel Strait</a>, &copy; 2014-18</p>
      </div>
    </div>;
  };
};

ReactDOM.render(
  <App />,
  document.getElementById('root')
);
