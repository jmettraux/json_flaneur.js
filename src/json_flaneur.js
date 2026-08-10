
var JsonFlaneur = (function() {

  const VERSION = '1.0.0';

  "use strict";

  let self = this;

  // "com" is short for "composite"
  //
  // "kable" is short for "collapsable"
  // "ked" is short for "collapsed"

  //
  // protected functions

  let slic = function(kla) { return kla.match(/^\./) ? kla.slice(1) : kla; }

  let hasc = function(elt, kla) {

    return elt && elt.classList.contains(slic(kla));
  }

  let addc = function(elt, kla, add=true) {

    if ( ! isElt(elt)) return;
    if (add) elt.classList.add(slic(kla));
    else elt.classList.remove(slic(kla));
  };

  let isElt = function(o) {

    return (
      (o !== null) &&
      (typeof o === 'object') &&
      (typeof o.tagName === 'string') &&
      (typeof o.getElementsByClassName === 'function'));
  };

  let determineType = function(o) {

    if (o === null) return 'null';
    if (Array.isArray(o)) return 'array';
    if (isElt(o)) return 'element';
    return (typeof o);
  };

  let sortArgs = function(args) {

    args = Array.from(args);

    let r = args.reduce(
      function(h, e) { h[determineType(e) + 's'].push(e); return h; },
      { strings: [], elements: [], objects: [], arrays: [], numbers: [],
        booleans: [], nulls: [], undefineds: [], functions: [] });
    r.empty = (args.length < 1);

    return r;
  }

  let elementFunctions = {};
    //
  elementFunctions.jfIsEmpty = function() {
    return this.querySelectorAll('.jflaneur-val').length === 0;
  };
  elementFunctions.jfHasAny = function() {
    return this.querySelectorAll('.jflaneur-val').length > 0;
  };

  let rootFunctions = {};
    //
  rootFunctions.jfCollapse = function() {

    let args = sortArgs(arguments);

    let pe = this.parentElement;

    if (args.empty) {

      toggle(pe, true);
    }
    else if (args.functions.length > 0) {

      let f = args.functions[0];

      for (let e of pe.querySelectorAll('.jflaneur-kable')) {
        if (hasc(e, '.jflaneur-empty')) continue;
        addc(e, '.jflaneur-ked', f(e));
      }
    }
  };

  let computeDepth = function(elt) {

    let ce = elt.closest('.jflaneur-com');

    return ce ? 1 + computeDepth(ce.parentElement) : -1;
  };

  elementProperties = {};
  elementProperties.jf = {
    get() {
      let t = hasc(this, '.jflaneur-array') ? 'array' : 'object';
      let ve = this.closest('.jflaneur-val');
      let ke = ve && ve.previousElementSibling;
      let ka = ke && hasc(ke, '.jflaneur-array-key');
      let k = ke && ke.__jflaneur_key;
      this.__jf = this.__jf || {
        type: t,
        key: k && (ka ? parseInt(k, 10) : k),
        depth: computeDepth(this),
        path: ke && (ke.title || computeTitle(ke)),
        length: this.childNodes[0].childNodes.length / 2 };
      return this.__jf;
    },
    enumberable: false,
  };

  let makeElt = function(/*tag, atts, text*/) {

    let args = sortArgs(arguments);
    let tag = args.strings.shift();
    let atts = args.objects.shift() || {};
    let txt = args.strings.shift();

    let m = tag.match(/[#.]?[^#.\s]+/g);
    let tagname = m.find(e => e.match(/^[^#.]/)) || 'div';

    let e = document.createElement(tagname);
      //
    for (let ic of m) {
      if (ic.match(/^\./)) addc(e, ic);
      else if (ic.match(/^#/)) e.id = ic.slice(1);
    }
      //
    for (let k in atts) { e.setAttribute(k, atts[k]); }
    if (typeof txt === 'string') e.innerText = txt;

    for (let fname in elementFunctions) {
      e[fname] = elementFunctions[fname].bind(e);
    }
    for (let pname in elementProperties) {
      Object.defineProperty(e, pname, elementProperties[pname]);
    }

    return e;
  };

  let computeTitle = function(e) {

    let k = e.__jflaneur_key;

    if (hasc(e, '.jflaneur')) return '$';

    let pt = computeTitle(e.parentElement); if ( ! k) return pt;

    let ce = e.closest('.jflaneur-com');

    return pt + (hasc(ce, '.jflaneur-array') ? `[${k}]` : `.${k}`);
  };

  let toggle = function(elt, all) {

    let k = '.jflaneur-ked';
    let s = '.jflaneur-kable';
    let ce = elt.querySelector(s);

    if ( ! ce) return;

    let ked = hasc(ce, k);

    for (let e of (all ? elt.querySelectorAll(s) : [ ce ])) {
      if (hasc(e, '.jflaneur-string') || e.jfHasAny()) addc(e, k, ! ked);
    }

    window.getSelection().removeAllRanges();
      // remove any spurious text selection...
  };

  let keyClick = function(ev) {

    ev.stopPropagation();

    toggle(this.nextElementSibling, ev.shiftKey || ev.ctrlKey);
  };

  let valClick = function(ev) {

    ev.stopPropagation();

    if ( ! hasc(this.childNodes[0], '.jflaneur-ked')) return;

    toggle(this, ev.shiftKey || ev.ctrlKey);
  };

  let comClick = function(ev) {

    ev.stopPropagation();

    toggle(this.parentElement, ev.shiftKey || ev.ctrlKey);
  };

  let keyEnter = function(ev) {

    ev.stopPropagation();

    this.title = this.title || computeTitle(this);

    if ( ! (
      hasc(this, '.jflaneur-array-key') ||
      hasc(this, '.jflaneur-object-key')
    )) return;

    if (this.style.cursor === 'pointer') return;

    let ve = this.nextElementSibling.childNodes[0];

    if ( ! hasc(ve, 'jflaneur-kable')) return;
    if (hasc(ve, '.jflaneur-empty')) return;

    this.style.cursor = 'pointer';
  };

  let makeKeyElement = function(t, js) {

    let k = '' + js;

    let e = makeElt(`.jflaneur-key.jflaneur-${t}-key`, k)
    e.__jflaneur_key = k;

    e.addEventListener('click', keyClick.bind(e));
    e.addEventListener('mouseenter', keyEnter.bind(e));

    return e;
  };

  let makeValElement = function(t, k, v) {

    let e = makeElt(`.jflaneur-val.jflaneur-${t}-val`);
    e.__jflaneur_key = k;
    e.__jflaneur_json = v;

    e.appendChild(makeElement(v));

    e.addEventListener('click', valClick.bind(e));
    e.addEventListener('mouseenter', keyEnter.bind(e));

    return e;
  };

  let makeStringElement = function(t, js) {

    return makeElt(
      '.jflaneur-sca.jflaneur-string.jflaneur-kable', JSON.stringify(js));
  };

  let makeLeafElement = function(t, js) {

    return makeElt(
      `.jflaneur-sca.jflaneur-${t}`, JSON.stringify(js));
  };

  let makeComElement = function(t, js) {

    let e = makeElt(`.jflaneur-com.jflaneur-${t}.jflaneur-kable`);
    let be = makeElt(`.jflaneur-com-body.jflaneur-${t}-body`);

    e.appendChild(be);

    let o = [];
    for (let k in js) { if (js.hasOwnProperty(k)) o.push([ k, js[k] ]); }

    let c = o.length;

    if (c > 0) {
      for (let [ k, v ] of o) {
        be.appendChild(makeKeyElement(t, k));
        be.appendChild(makeValElement(t, k, v));
      }
      e.setAttribute(
        'data-size',
        t === 'array' ? `${c} item${c < 2 ? '' : 's'}` :
        `${c} entr${c < 2 ? 'y' : 'ies'}`);
    }
    else {
      addc(e, '.jflaneur-empty');
      addc(be, '.jflaneur-empty');
    }

    e.addEventListener('click', comClick.bind(e));

    return e;
  };

  let makeElement = function(js) {

    let t = determineType(js);
    if (t === 'array' || t === 'object') return makeComElement(t, js)
    if (t === 'string') return makeStringElement(t, js);
    if (t) return makeLeafElement(t, js);

    throw new Error(`JsonFlaneur: cannot make element out of ${typeof js}`);
  };

  //
  // public functions

  const NO_JSON = {
    _explanation_:
      "please pass an array or an object to JasonFlaneur.make(); ;-)" };

  this.makeElement = function(/* elt=null, js, opts={} */) {

    let args = sortArgs(arguments);

    let elt = args.elements[0];
    let js = args.arrays.shift() || args.objects.shift() || NO_JSON;
    //let opts = args.objects.shift(); // TODO
    let fun = args.functions.shift();

    let clas = [].concat(
      args.strings
        .filter(e => e.match(/^\.[a-z][-_a-z0-9]*$/)),
      args.strings
        .filter(e => e.match(/^-[a-z][-_a-z0-9]*$/))
        .map(e => `.jflaneur${e}`));

    let e = makeElement(js);

    addc(e, '.jflaneur'); // for the variables ;-)
    //e.__jflaneur_key = '$';

    for (let fn in rootFunctions) { e[fn] = rootFunctions[fn].bind(e); }
    for (let cla of clas) { addc(e, cla); }

    if (elt) elt.appendChild(e);

    if (fun) e.jfCollapse(fun);

    return e;
  };
  this.make = this.makeElement;

  //
  // over.

  return this;

}).apply({}); // end JsonFlaneur

