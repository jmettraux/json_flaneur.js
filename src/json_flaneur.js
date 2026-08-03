
var JsonFlaneur = (function() {

  const VERSION = '1.0.0';

  "use strict";

  let self = this;

  //
  // protected functions

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
    if (isElt(o)) return 'elt';
    return (typeof o);
  };

  let sortArgs = function(args) {

    return Array.from(args).reduce(
      function(h, e) { h[determineType(e) + 's'].push(e); return h; },
      { strings: [], elts: [], objects: [], arrays: [], numbers: [],
        booleans: [], nulls: [], undefineds: [] });
  }

  let elementFunctions = {};

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
      if (ic.match(/^\./)) e.classList.add(ic.slice(1));
      else if (ic.match(/^#/)) e.id = ic.slice(1);
    }
      //
    for (let k in atts) { e.setAttribute(k, atts[k]); }
    if (typeof txt === 'string') e.innerText = txt;

    for (let fname in elementFunctions) {
      e[fname] = elementFunctions[fname].bind(e);
    }

    return e;
  };

  let makeKeyElement = function(js) {

    return makeElt(
      `.json_flaneur_leaf.json_flaneur_key`, JSON.stringify(js));
  };

  let makeValueElement = function(js) {

    let e = makeElt(`.json_flaneur_value`);
    e.appendChild(makeElement(js));

    return e;
  };

  let makeLeafElement = function(t, js) {

    return makeElt(
      `.json_flaneur_leaf.json_flaneur_${t}`, JSON.stringify(js));
  };

  let makeEntryElement = function(t, k, v) {

    let e = makeElt(`.json_flaneur_entry.json_flaneur_${t}_entry`);
    e.appendChild(makeKeyElement(k));
    e.appendChild(makeValueElement(v));

    return e;
  };

  let makeCollectionElement = function(t, js) {

    let e = makeElt(`.json_flaneur_collection.json_flaneur_${t}`);
    for (let k in js) { e.appendChild(makeEntryElement(t, k, js[k])); }

    return e;
  };

  let makeElement = function(js) {

    let t = determineType(js);
    if (t === 'array' || t === 'object') return makeCollectionElement(t, js)
    if (t) return makeLeafElement(t, js);

    throw new Error(`JsonFlaneur: cannot make element out of ${typeof js}`);
  };

  //
  // public functions

  this.makeElement = makeElement;
  this.make = makeElement;

  //
  // over.

  return this;

}).apply({}); // end JsonFlaneur

