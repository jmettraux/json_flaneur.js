
var JsonFlaneur = (function() {

  const VERSION = '1.0.0';

  "use strict";

  let self = this;

  //
  // protected functions

  let elementFunctions = {};

  let makeElt = function(tag, atts, text) {

    let m = tag.match(/[#.]?[^#.\s]+/g);
    let tagname = m.find(e => e.match(/^[^#.]/)) || 'div';

    atts = atts || {};

    let e = document.createElement(tagname);
      //
    for (let ic of m) {
      if (ic.match(/^\./)) e.classList.add(ic.slice(1));
      else if (ic.match(/^#/)) e.id = ic.slice(1);
    }
      //
    for (let k in atts) { e.setAttribute(k, atts[k]); }
    if (typeof text === 'string') e.innerText = text;

    for (let fname in elementFunctions) {
      e[fname] = elementFunctions[fname].bind(e);
    }

    return e;
  };

  let determineType = function(o) {

    if (o === null) return 'null';
    if (Array.isArray(o)) return 'array';
    return (typeof o);
  };

  let makeKeyElement = function(js) {

    return makeElt(
      `.json_flaneur_leaf.json_flaneur_key`, {}, JSON.stringify(js));
  };

  let makeValueElement = function(js) {

    let e = makeElt(`.json_flaneur_value`);
    e.appendChild(makeElement(js);
    return e;
  };

  let makeLeafElement = function(t, js) {

    return makeElt(
      `.json_flaneur_leaf.json_flaneur_${t}`, {}, JSON.stringify(js));
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

