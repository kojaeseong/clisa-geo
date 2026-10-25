/* WORLD OF DECISION · 1962 — game engine (ko and en; 2026-10-23 in-place language switch: the screen, the data and the address change, the music and the game state carry on) */
(function(){
'use strict';
var LANG=(new URLSearchParams(location.search).get('lang')==='en'||/^en/.test(document.documentElement.lang||''))?'en':'ko';
/* data and engine live once under /play/1914/; the English page sets data-base to reuse them */
/* the base is absolute so that data and audio still resolve after the address is switched between /play/1914/ and /en/play/1914/ */
var BASE=document.documentElement.getAttribute('data-base')||(/\/play\/1962\/$/.test(location.pathname)?location.pathname.replace(/^\/en\//,'/'):'');
var EN, SITE, DISP, SWITCHING=false, VIEW=null;
function T(ko,en){return EN?en:ko;}
var LANGLINK=true; /* on-site: area switch on; the English page comes later */
/* Black Han Sans has no accented Latin letters, so English headings use Archivo Black */
function setLang(l){ LANG=l; EN=l==='en'; SITE=EN?'/en':''; DISP=EN?'"Archivo Black",sans-serif':'"Black Han Sans",sans-serif'; document.documentElement.lang=l; document.title='WORLD OF DECISION · 1962 | '+(EN?'Clisa Geopolitics':'클리사 지오폴리틱스'); }
setLang(LANG);
var ROLES=[
 {id:'ar',flag:'su'},{id:'pl',flag:'su'},{id:'jfk',flag:'us'},{id:'nsk',flag:'su'},{id:'fc',flag:'cu'},{id:'hm',flag:'gb'},{id:'ut',flag:'un'}
];
var EMBLEM={"su": "<svg viewBox=\"0 0 64 64\" aria-hidden=\"true\"><path d=\"M32 6l4.4 12.3H50l-10.7 7.8 4.1 12.5L32 31l-11.4 7.6 4.1-12.5L14 18.3h13.6z\" fill=\"currentColor\" opacity=\".9\"/><path d=\"M19 56c7-9 14-14 23-20l-2-2c-8 5-15 9-23 17z\" fill=\"currentColor\"/><path d=\"M47 50c-6-6-9-12-9-19 0-5 3-8 7-8-3 3-4 7-2 12 2 5 6 9 11 12z\" fill=\"currentColor\"/><path d=\"M12 47l6-6 5 5-6 6z\" fill=\"currentColor\"/></svg>"};
var FLAGS={
 us:'<svg viewBox="0 0 19 10"><rect width="19" height="10" fill="#fff"/><g fill="#B22234"><rect width="19" height="0.77"/><rect y="1.54" width="19" height="0.77"/><rect y="3.08" width="19" height="0.77"/><rect y="4.62" width="19" height="0.77"/><rect y="6.15" width="19" height="0.77"/><rect y="7.69" width="19" height="0.77"/><rect y="9.23" width="19" height="0.77"/></g><rect width="7.6" height="5.38" fill="#3C3B6E"/></svg>',
 cu:'<svg viewBox="0 0 60 30"><rect width="60" height="30" fill="#fff"/><rect width="60" height="6" fill="#002A8F"/><rect y="12" width="60" height="6" fill="#002A8F"/><rect y="24" width="60" height="6" fill="#002A8F"/><path d="M0 0l25.98 15L0 30z" fill="#CB1515"/><path d="M8.66 10.00L9.78 13.45L13.42 13.45L10.48 15.59L11.60 19.05L8.66 16.91L5.72 19.05L6.84 15.59L3.90 13.45L7.54 13.45Z" fill="#fff"/></svg>',
 un:'<svg viewBox="0 0 60 40"><rect width="60" height="40" fill="#5B92E5"/><g transform="translate(30 19.3) scale(1.02)"><g fill="none" stroke="#fff" stroke-width="0.38"><circle r="10"/><circle r="2.00"/><circle r="4.00"/><circle r="6.00"/><circle r="8.00"/><path d="M0 0L0.00 -10.00"/><path d="M0 0L7.07 -7.07"/><path d="M0 0L10.00 -0.00"/><path d="M0 0L7.07 7.07"/><path d="M0 0L0.00 10.00"/><path d="M0 0L-7.07 7.07"/><path d="M0 0L-10.00 0.00"/><path d="M0 0L-7.07 -7.07"/></g><path fill="#fff" d="M5.7 5.4L5.6 5.5L5.4 5.5L5.3 5.4L5.2 5.4L5.0 5.4L4.9 5.4L4.8 5.3L4.7 5.3L4.7 5.1L4.7 4.9L4.6 4.8L4.5 4.8L4.4 4.7L4.3 4.7L4.1 4.7L3.9 4.7L3.8 4.7L3.8 4.6L3.8 4.6L3.7 4.4L3.6 4.5L3.5 4.5L3.4 4.6L3.3 4.6L3.2 4.6L3.1 4.6L2.9 4.8L2.8 4.9L2.7 4.9L2.6 5.0L2.5 5.1L2.4 5.1L2.4 5.1L2.2 5.2L2.1 5.3L2.0 5.3L1.9 5.3L1.7 5.2L1.6 5.2L1.6 5.2L1.5 5.1L1.4 5.1L1.3 5.1L1.2 5.0L1.3 4.9L1.2 4.9L1.1 4.8L1.2 4.7L1.1 4.6L1.0 4.5L1.1 4.4L1.1 4.2L1.1 4.1L1.2 4.0L1.3 3.9L1.4 3.8L1.3 3.6L1.4 3.5L1.5 3.4L1.5 3.3L1.6 3.3L1.7 3.2L1.8 3.1L1.9 3.0L2.0 3.0L2.1 2.9L2.1 2.8L2.2 2.8L2.3 2.7L2.4 2.7L2.4 2.9L2.5 2.8L2.6 2.8L2.7 2.7L2.9 2.7L3.0 2.6L3.0 2.5L3.0 2.4L3.1 2.3L3.2 2.2L3.3 2.1L3.4 2.1L3.4 2.0L3.4 1.9L3.5 1.8L3.5 1.7L3.5 1.6L3.4 1.5L3.3 1.5L3.2 1.4L3.2 1.6L3.2 1.7L3.1 1.7L3.1 1.8L3.0 1.9L2.9 1.9L2.8 1.8L2.8 1.7L2.9 1.6L2.9 1.4L2.9 1.3L3.0 1.2L3.1 1.1L3.0 1.0L2.9 1.0L2.8 1.1L2.7 1.2L2.7 1.1L2.7 1.0L2.6 1.1L2.7 1.2L2.7 1.2L2.7 1.3L2.6 1.4L2.5 1.3L2.6 1.5L2.6 1.6L2.6 1.6L2.7 1.7L2.8 1.8L2.7 1.9L2.6 1.9L2.7 2.0L2.8 2.0L2.9 2.1L2.8 2.2L2.7 2.2L2.8 2.1L2.7 2.1L2.6 2.2L2.5 2.1L2.4 2.1L2.2 2.1L2.1 2.1L2.0 2.2L2.1 2.3L2.2 2.3L2.3 2.2L2.4 2.2L2.5 2.3L2.5 2.4L2.4 2.3L2.3 2.4L2.1 2.4L2.0 2.3L1.9 2.4L1.9 2.5L1.8 2.5L1.7 2.6L1.7 2.7L1.7 2.8L1.7 3.0L1.7 3.1L1.6 3.2L1.5 3.2L1.4 3.2L1.3 3.3L1.3 3.2L1.2 3.1L1.2 3.0L1.1 2.9L1.2 2.9L1.3 2.8L1.4 2.8L1.5 2.7L1.4 2.6L1.3 2.5L1.2 2.5L1.3 2.4L1.4 2.4L1.4 2.3L1.4 2.2L1.4 2.0L1.5 2.0L1.5 1.9L1.4 1.8L1.4 1.7L1.4 1.6L1.5 1.7L1.5 1.8L1.6 1.8L1.7 1.7L1.7 1.6L1.8 1.6L1.8 1.4L1.7 1.4L1.8 1.3L1.7 1.2L1.7 1.1L1.7 1.1L1.7 1.0L1.6 1.1L1.6 1.2L1.5 1.2L1.4 1.1L1.4 1.0L1.4 0.9L1.3 1.0L1.3 1.1L1.3 1.2L1.4 1.3L1.4 1.3L1.5 1.4L1.6 1.5L1.6 1.5L1.6 1.7L1.5 1.6L1.4 1.6L1.3 1.5L1.3 1.7L1.2 1.7L1.2 1.6L1.1 1.6L1.1 1.5L1.1 1.4L1.1 1.3L1.1 1.2L1.1 1.1L1.0 0.9L1.1 0.8L1.1 0.7L1.1 0.6L1.2 0.6L1.3 0.5L1.4 0.5L1.5 0.6L1.4 0.7L1.3 0.7L1.4 0.7L1.5 0.7L1.6 0.7L1.6 0.6L1.5 0.5L1.5 0.4L1.4 0.4L1.4 0.3L1.4 0.2L1.4 0.1L1.4 -0.0L1.4 -0.1L1.4 -0.2L1.3 -0.2L1.2 -0.2L1.1 -0.2L1.2 -0.3L1.3 -0.3L1.4 -0.3L1.5 -0.3L1.4 -0.4L1.4 -0.4L1.3 -0.3L1.2 -0.3L1.1 -0.3L1.2 -0.3L1.1 -0.4L1.1 -0.5L1.1 -0.4L1.0 -0.5L0.9 -0.5L0.8 -0.5L0.7 -0.6L0.6 -0.6L0.6 -0.7L0.6 -0.8L0.7 -0.8L0.7 -0.9L0.6 -0.9L0.5 -1.0L0.4 -1.0L0.4 -1.1L0.3 -1.2L0.3 -1.2L0.2 -1.1L0.1 -1.2L0.0 -1.2L-0.0 -1.3L-0.2 -1.3L-0.2 -1.3L-0.3 -1.4L-0.3 -1.3L-0.4 -1.3L-0.5 -1.2L-0.6 -1.2L-0.7 -1.2L-0.8 -1.2L-0.9 -1.3L-1.0 -1.2L-1.0 -1.3L-1.0 -1.4L-0.8 -1.4L-0.8 -1.5L-0.7 -1.5L-0.8 -1.5L-0.9 -1.6L-0.8 -1.7L-0.7 -1.8L-0.7 -1.8L-0.6 -1.9L-0.5 -1.9L-0.5 -2.0L-0.5 -2.1L-0.5 -2.2L-0.5 -2.3L-0.4 -2.4L-0.4 -2.5L-0.3 -2.6L-0.3 -2.5L-0.2 -2.4L-0.2 -2.3L-0.3 -2.2L-0.3 -2.1L-0.4 -2.0L-0.4 -1.9L-0.5 -1.8L-0.4 -1.9L-0.3 -1.8L-0.2 -1.9L-0.2 -2.0L-0.1 -2.1L-0.0 -2.0L0.1 -2.0L0.2 -2.0L0.3 -2.1L0.4 -2.1L0.5 -2.2L0.6 -2.3L0.5 -2.3L0.4 -2.3L0.4 -2.4L0.4 -2.5L0.4 -2.6L0.5 -2.7L0.6 -2.8L0.7 -2.9L0.7 -2.9L0.9 -3.0L1.0 -3.0L1.1 -3.0L1.1 -3.1L1.3 -3.1L1.3 -3.2L1.2 -3.3L1.3 -3.4L1.4 -3.4L1.4 -3.3L1.4 -3.2L1.5 -3.2L1.4 -3.1L1.5 -3.0L1.6 -3.0L1.5 -2.9L1.6 -2.9L1.7 -2.9L1.8 -3.0L1.7 -3.1L1.6 -3.1L1.7 -3.1L1.8 -3.1L1.8 -3.3L1.8 -3.4L1.9 -3.5L1.9 -3.6L2.0 -3.6L2.1 -3.6L2.2 -3.7L2.3 -3.7L2.4 -3.7L2.5 -3.7L2.6 -3.7L2.7 -3.6L2.8 -3.6L2.9 -3.5L3.0 -3.5L3.0 -3.4L3.1 -3.4L3.2 -3.4L3.3 -3.4L3.3 -3.6L3.3 -3.7L3.3 -3.8L3.3 -3.9L3.4 -4.0L3.5 -3.9L3.6 -3.9L3.7 -3.9L3.8 -3.8L3.8 -3.8L3.8 -3.7L3.8 -3.6L3.8 -3.5L3.9 -3.4L4.0 -3.3L4.1 -3.4L4.2 -3.4L4.2 -3.6L4.2 -3.7L4.1 -3.8L4.1 -3.9L4.2 -4.0L4.2 -4.1L4.3 -4.0L4.3 -3.9L4.3 -3.7L4.3 -3.6L4.3 -3.5L4.3 -3.4L4.2 -3.3L4.1 -3.3L4.0 -3.2L4.0 -3.1L3.9 -3.0L3.9 -2.9L4.0 -2.9L4.1 -2.8L4.0 -2.7L3.9 -2.7L3.9 -2.6L3.9 -2.5L3.8 -2.4L3.8 -2.3L3.9 -2.3L4.0 -2.2L4.1 -2.1L4.2 -2.1L4.2 -2.0L4.4 -2.0L4.5 -1.9L4.6 -1.8L4.6 -1.8L4.7 -1.7L4.9 -1.8L5.0 -1.8L5.1 -1.7L5.2 -1.7L5.2 -1.6L5.2 -1.5L5.1 -1.4L5.0 -1.3L4.9 -1.3L4.8 -1.2L4.8 -1.1L4.7 -1.1L4.6 -1.0L4.5 -1.0L4.5 -0.9L4.5 -0.7L4.4 -0.8L4.4 -0.7L4.4 -0.6L4.3 -0.5L4.3 -0.4L4.3 -0.2L4.3 -0.1L4.3 -0.0L4.3 0.1L4.3 0.2L4.2 0.3L4.2 0.4L4.2 0.5L4.1 0.6L4.0 0.6L3.9 0.7L3.9 0.8L4.0 0.8L4.1 0.8L4.2 0.7L4.3 0.6L4.4 0.5L4.3 0.4L4.3 0.3L4.2 0.3L4.4 0.2L4.4 0.1L4.5 0.0L4.6 0.1L4.6 0.1L4.7 0.2L4.8 0.3L4.8 0.4L4.8 0.5L4.9 0.6L4.9 0.7L4.9 0.8L4.9 1.0L5.0 1.1L5.0 1.3L5.0 1.4L4.9 1.5L4.8 1.5L4.7 1.5L4.5 1.5L4.4 1.5L4.4 1.6L4.3 1.6L4.1 1.6L4.1 1.7L3.9 1.7L3.8 1.7L3.7 1.7L3.7 1.8L3.7 1.8L3.8 1.8L4.0 1.8L4.1 1.8L4.2 1.8L4.4 1.8L4.4 1.8L4.5 1.7L4.7 1.7L4.7 1.6L4.8 1.6L4.9 1.5L5.0 1.6L5.1 1.4L5.1 1.3L5.1 1.2L5.1 1.0L5.1 0.9L5.2 0.8L5.3 0.9L5.4 1.0L5.5 1.1L5.6 1.2L5.7 1.4L5.7 1.6L5.7 1.7L5.7 1.8L5.8 1.9L5.8 2.0L5.8 2.1L5.9 2.2L6.0 2.3L6.0 2.3L6.1 2.3L6.2 2.3L6.3 2.2L6.4 2.3L6.5 2.3L6.6 2.4L6.7 2.5L6.6 2.6L6.6 2.8L6.6 2.9L6.6 3.1L6.8 3.1L6.9 3.1L6.9 3.2L6.9 3.4L6.9 3.6L7.0 3.6L7.0 3.7L7.0 3.9L7.0 4.1L7.0 4.2L7.0 4.3L6.9 4.4L6.9 4.6L6.8 4.7L6.8 4.8L6.7 4.8L6.6 4.9L6.6 5.0L6.5 5.2L6.4 5.3L6.4 5.4L6.3 5.4L6.2 5.5L6.1 5.5L6.1 5.4L5.8 5.4ZM3.2 0.4L3.1 0.5L3.0 0.5L2.9 0.4L2.9 0.3L2.8 0.5L2.9 0.5L2.9 0.6L3.0 0.7L3.1 0.6L3.2 0.6L3.3 0.6L3.5 0.6L3.5 0.4L3.4 0.4L3.3 0.4L3.3 0.3L3.2 0.4ZM-2.6 5.0L-2.5 5.0L-2.3 5.1L-2.2 5.2L-2.2 5.2L-2.1 5.3L-2.1 5.4L-2.0 5.5L-2.1 5.6L-2.2 5.6L-2.2 5.7L-2.1 5.8L-2.1 5.8L-1.9 5.8L-1.8 5.8L-1.7 5.8L-1.6 5.9L-1.6 5.9L-1.5 6.0L-1.4 6.0L-1.3 6.1L-1.2 6.1L-1.0 6.1L-0.9 6.2L-0.8 6.3L-0.7 6.3L-0.6 6.4L-0.6 6.5L-0.6 6.6L-0.7 6.6L-0.8 6.7L-0.9 6.7L-0.9 6.8L-1.1 6.8L-1.1 6.9L-1.1 7.0L-1.2 7.1L-1.3 7.2L-1.4 7.3L-1.5 7.3L-1.7 7.3L-1.8 7.3L-2.0 7.3L-2.2 7.3L-2.3 7.3L-2.5 7.3L-2.5 7.4L-2.5 7.5L-2.7 7.5L-2.9 7.5L-3.1 7.5L-2.9 7.5L-2.8 7.5L-2.9 7.5L-3.0 7.5L-3.1 7.6L-3.3 7.6L-3.4 7.6L-3.5 7.5L-3.7 7.5L-3.8 7.4L-3.9 7.3L-3.9 7.2L-3.9 7.2L-3.9 7.4L-3.8 7.4L-3.8 7.6L-3.9 7.6L-4.3 7.5L-4.4 7.4L-4.5 7.3L-4.7 7.3L-4.8 7.3L-4.9 7.2L-5.0 7.2L-5.0 7.2L-4.9 7.3L-5.1 7.2L-5.0 7.3L-5.1 7.3L-5.2 7.3L-5.3 7.3L-5.5 7.2L-5.5 7.3L-5.4 7.4L-5.5 7.4L-5.7 7.3L-5.8 7.3L-5.9 7.3L-5.9 7.4L-6.0 7.3L-6.2 7.2L-6.3 7.2L-6.4 7.1L-6.4 7.1L-6.4 7.1L-6.3 7.2L-6.4 7.1L-6.4 7.0L-6.5 7.0L-6.4 7.1L-6.4 7.0L-6.6 6.9L-6.6 6.8L-6.5 6.9L-6.4 6.9L-6.5 6.9L-6.6 6.7L-6.6 6.6L-6.5 6.7L-6.5 6.8L-6.5 6.7L-6.5 6.7L-6.5 6.6L-6.3 6.7L-6.4 6.6L-6.4 6.4L-6.5 6.4L-6.4 6.4L-6.3 6.5L-6.3 6.6L-6.2 6.6L-6.1 6.5L-6.0 6.5L-6.1 6.4L-6.0 6.3L-5.9 6.2L-5.8 6.2L-5.7 6.2L-5.6 6.2L-5.4 6.1L-5.4 6.1L-5.3 6.0L-5.2 5.9L-5.1 5.9L-5.0 5.9L-5.0 5.8L-4.9 5.7L-4.8 5.7L-4.7 5.6L-4.7 5.5L-4.7 5.4L-4.8 5.3L-4.9 5.2L-4.9 5.0L-5.0 4.9L-5.0 4.8L-5.0 4.7L-5.0 4.5L-5.0 4.4L-5.0 4.2L-4.9 4.1L-5.0 4.0L-4.9 3.9L-4.8 4.0L-4.8 3.9L-4.7 3.9L-4.6 3.8L-4.4 3.9L-4.3 3.9L-4.2 3.9L-4.2 3.8L-4.1 3.8L-4.1 3.6L-4.1 3.5L-4.2 3.5L-4.3 3.4L-4.3 3.3L-4.4 3.2L-4.4 3.1L-4.4 3.0L-4.3 2.9L-4.3 2.8L-4.4 2.7L-4.4 2.6L-4.4 2.4L-4.4 2.3L-4.4 2.2L-4.5 2.0L-4.6 1.9L-4.6 1.8L-4.6 1.7L-4.6 1.5L-4.6 1.3L-4.5 1.2L-4.5 1.2L-4.3 1.1L-4.3 1.0L-4.3 0.9L-4.2 0.8L-4.2 0.8L-4.1 0.7L-4.1 0.6L-4.0 0.5L-3.9 0.5L-3.9 0.4L-4.0 0.4L-4.0 0.5L-4.1 0.6L-4.2 0.6L-4.3 0.7L-4.3 0.8L-4.3 0.6L-4.2 0.6L-4.2 0.5L-4.2 0.4L-4.0 0.4L-4.0 0.3L-3.9 0.2L-3.8 0.2L-3.7 0.1L-3.7 0.0L-3.7 -0.1L-3.6 -0.1L-3.5 -0.2L-3.4 -0.2L-3.3 -0.3L-3.2 -0.2L-3.0 -0.2L-2.9 -0.2L-2.8 -0.2L-2.8 -0.1L-2.7 -0.1L-2.7 -0.2L-2.6 -0.3L-2.5 -0.3L-2.5 -0.3L-2.4 -0.4L-2.3 -0.4L-2.2 -0.4L-2.1 -0.5L-2.0 -0.5L-2.0 -0.6L-1.9 -0.7L-1.9 -0.7L-1.8 -0.8L-1.7 -0.9L-1.7 -1.0L-1.7 -0.9L-1.7 -1.1L-1.7 -1.2L-1.8 -1.2L-1.8 -1.3L-1.8 -1.5L-1.7 -1.6L-1.7 -1.4L-1.7 -1.3L-1.6 -1.3L-1.5 -1.3L-1.4 -1.4L-1.3 -1.4L-1.3 -1.3L-1.3 -1.2L-1.3 -1.1L-1.2 -1.2L-1.1 -1.2L-1.1 -1.1L-1.2 -1.0L-1.1 -1.0L-1.0 -1.0L-1.0 -0.9L-1.0 -0.8L-1.1 -0.7L-1.1 -0.6L-1.2 -0.6L-1.3 -0.5L-1.3 -0.4L-1.3 -0.3L-1.3 -0.2L-1.4 -0.3L-1.3 -0.2L-1.4 -0.1L-1.4 -0.0L-1.4 0.1L-1.4 0.1L-1.5 0.3L-1.5 0.3L-1.4 0.3L-1.4 0.5L-1.4 0.5L-1.4 0.6L-1.3 0.6L-1.2 0.6L-1.2 0.5L-1.2 0.6L-1.2 0.7L-1.3 0.8L-1.2 0.8L-1.1 0.9L-1.2 0.9L-1.3 0.9L-1.4 0.9L-1.4 0.8L-1.4 0.9L-1.5 0.9L-1.5 0.8L-1.6 0.9L-1.7 0.8L-1.9 0.9L-1.9 1.0L-1.9 1.1L-1.9 1.2L-1.9 1.3L-1.9 1.4L-1.9 1.5L-2.0 1.6L-2.0 1.6L-1.9 1.7L-1.9 1.6L-1.8 1.6L-1.7 1.6L-1.6 1.5L-1.6 1.4L-1.5 1.4L-1.4 1.3L-1.3 1.2L-1.3 1.3L-1.3 1.4L-1.2 1.5L-1.3 1.6L-1.3 1.7L-1.2 1.7L-1.2 1.6L-1.1 1.7L-1.2 1.8L-1.2 1.9L-1.1 2.0L-1.1 2.1L-1.2 2.1L-1.1 2.1L-1.1 2.2L-1.1 2.3L-1.3 2.3L-1.4 2.3L-1.5 2.2L-1.6 2.1L-1.7 2.1L-1.8 2.1L-1.9 2.2L-2.0 2.1L-1.9 2.2L-1.8 2.2L-1.6 2.2L-1.5 2.2L-1.7 2.2L-1.6 2.3L-1.7 2.4L-1.6 2.5L-1.5 2.5L-1.6 2.5L-1.8 2.5L-1.7 2.5L-1.8 2.4L-1.9 2.4L-2.0 2.4L-2.1 2.4L-2.2 2.4L-2.3 2.4L-2.4 2.4L-2.5 2.4L-2.4 2.3L-2.5 2.3L-2.6 2.4L-2.6 2.5L-2.7 2.5L-2.8 2.5L-2.9 2.4L-3.1 2.4L-3.1 2.5L-3.2 2.6L-3.2 2.7L-3.3 2.7L-3.3 2.7L-3.3 2.6L-3.3 2.5L-3.2 2.4L-3.3 2.3L-3.3 2.2L-3.4 2.1L-3.4 2.0L-3.5 2.1L-3.5 2.0L-3.6 1.9L-3.6 1.8L-3.7 1.7L-3.8 1.6L-3.9 1.6L-3.9 1.7L-4.1 1.7L-4.2 1.7L-4.3 1.8L-4.3 1.9L-4.3 2.1L-4.2 2.2L-4.2 2.3L-4.1 2.3L-4.0 2.3L-3.9 2.4L-3.8 2.5L-3.9 2.5L-4.0 2.5L-4.2 2.6L-4.1 2.7L-4.1 2.8L-4.0 2.9L-4.1 3.0L-4.2 3.1L-4.2 3.1L-4.3 3.2L-4.2 3.3L-4.2 3.4L-4.1 3.5L-4.0 3.6L-4.0 3.7L-3.9 3.7L-3.8 3.7L-3.7 3.8L-3.5 3.8L-3.4 3.9L-3.5 3.9L-3.6 4.0L-3.5 3.9L-3.4 4.0L-3.3 4.1L-3.2 4.2L-3.1 4.3L-2.9 4.4L-2.9 4.4L-2.8 4.5L-2.8 4.6L-2.7 4.7L-2.6 4.8L-2.6 4.9ZM-1.2 9.5L-1.1 9.6L-1.0 9.6L-1.1 9.6L-1.3 9.5ZM-4.5 8.2L-4.5 8.3L-4.6 8.3L-4.7 8.2L-4.6 8.3ZM1.2 2.3L1.1 2.3L1.1 2.2L1.1 2.1L1.0 2.1L0.9 2.0L0.9 1.9L1.0 1.9L1.0 2.0L1.1 2.0L1.2 2.1L1.3 2.1L1.3 2.3L1.2 2.3L1.1 2.4L1.2 2.3ZM0.9 2.1L1.0 2.2L1.0 2.3L0.9 2.4L0.9 2.4L0.9 2.3L0.8 2.2L0.9 2.2ZM2.9 -6.0L2.7 -6.0L2.6 -6.0L2.7 -6.0L2.9 -6.0L3.0 -6.0ZM5.0 -1.8L5.0 -1.9L5.1 -2.0L5.2 -2.0L5.2 -1.9L5.1 -1.9ZM0.9 -0.1L1.0 -0.0L1.1 0.0L1.1 0.1L1.0 0.1L0.9 0.0L0.9 -0.1ZM1.1 0.1L1.2 0.1L1.2 0.2L1.1 0.1ZM0.3 -2.4L0.3 -2.5L0.3 -2.7L0.4 -2.8L0.3 -2.9L0.4 -2.8L0.4 -2.7L0.4 -2.5L0.3 -2.4ZM2.3 -4.2L2.2 -4.2L2.3 -4.3L2.4 -4.4L2.4 -4.5L2.3 -4.5L2.2 -4.6L2.3 -4.6L2.4 -4.5L2.5 -4.4L2.5 -4.3L2.4 -4.2L2.3 -4.2ZM2.9 -4.6L2.8 -4.6L2.7 -4.5L2.7 -4.6L2.9 -4.6ZM2.2 -4.9L2.2 -5.0L2.3 -5.1L2.4 -5.1L2.4 -5.0L2.5 -4.9L2.6 -4.9L2.5 -4.9L2.4 -4.9L2.3 -4.9ZM-0.3 -6.3L-0.2 -6.2L-0.2 -6.2L-0.3 -6.3ZM-0.2 -6.3L-0.2 -6.4L-0.1 -6.4L0.1 -6.4L0.2 -6.4L0.1 -6.4L-0.1 -6.4L-0.2 -6.3ZM1.0 -6.1L0.9 -6.1L0.8 -6.2L0.7 -6.2L0.6 -6.2L0.5 -6.3L0.3 -6.4L0.2 -6.4L0.3 -6.5L0.2 -6.5L0.2 -6.6L0.0 -6.6L-0.1 -6.7L0.1 -6.7L0.2 -6.7L0.3 -6.6L0.4 -6.5L0.6 -6.5L0.7 -6.5L0.8 -6.5L0.9 -6.6L1.0 -6.5L1.1 -6.4L1.2 -6.4L1.3 -6.3L1.3 -6.2L1.4 -6.2L1.5 -6.1L1.6 -6.1L1.7 -6.0L1.7 -6.0L1.9 -5.9L1.7 -5.9L1.8 -5.9L1.9 -5.8L1.8 -5.7L1.7 -5.8L1.7 -5.9L1.6 -6.0L1.6 -6.0L1.5 -6.0L1.3 -6.0L1.2 -6.0L1.1 -6.1L1.0 -6.1ZM0.5 0.5L0.6 0.5L0.6 0.6L0.6 0.5L0.4 0.5ZM-3.4 -8.0L-3.5 -8.0L-3.5 -8.1L-3.4 -8.2L-3.4 -8.3L-3.3 -8.3L-3.2 -8.4L-3.2 -8.5L-3.1 -8.6L-3.0 -8.6L-2.9 -8.6L-2.7 -8.7L-2.6 -8.7L-2.7 -8.6L-2.8 -8.5L-2.9 -8.5L-2.9 -8.4L-3.1 -8.3L-3.1 -8.3L-3.2 -8.2L-3.3 -8.1L-3.3 -8.0ZM-3.3 -7.7L-3.4 -7.6L-3.5 -7.6L-3.7 -7.7L-3.8 -7.6L-3.9 -7.6L-4.0 -7.5L-4.0 -7.6L-3.9 -7.7L-3.9 -7.8L-3.8 -7.9L-3.8 -7.9L-3.6 -8.0L-3.7 -7.9L-3.6 -7.9L-3.6 -7.7L-3.5 -7.7L-3.3 -7.7L-3.2 -7.7ZM3.8 -4.5L3.7 -4.6L3.6 -4.6L3.5 -4.6L3.4 -4.6L3.2 -4.6L3.1 -4.6L3.0 -4.7L3.0 -4.8L2.9 -4.8L3.0 -4.9L3.1 -4.8L3.1 -4.9L3.1 -5.0L3.2 -5.1L3.3 -5.1L3.4 -5.1L3.6 -5.1L3.7 -5.0L3.7 -5.0L3.8 -4.9L3.9 -4.8L4.0 -4.8L3.9 -4.7L3.9 -4.6L3.9 -4.5ZM6.7 1.2L6.9 1.2L6.9 1.3L7.1 1.3L7.2 1.4L7.3 1.5L7.4 1.6L7.5 1.7L7.5 1.9L7.4 2.0L7.4 2.1L7.3 2.1L7.2 2.2L7.1 2.1L7.1 2.0L6.9 2.0L6.8 1.9L6.8 1.8L6.9 1.7L6.8 1.6L6.8 1.5L6.8 1.4L6.7 1.3ZM0.3 -3.0L0.2 -3.1L0.4 -3.2L0.5 -3.1L0.5 -3.2L0.5 -3.1L0.4 -3.0L0.3 -3.0ZM0.5 -3.2L0.5 -3.3L0.5 -3.4L0.6 -3.5L0.6 -3.6L0.7 -3.6L0.8 -3.6L0.9 -3.7L1.0 -3.5L1.1 -3.5L1.2 -3.5L1.1 -3.5L1.0 -3.5L0.9 -3.5L0.8 -3.4L0.7 -3.4L0.6 -3.4L0.6 -3.3L0.5 -3.2ZM2.5 2.4L2.5 2.5L2.4 2.6L2.4 2.5ZM4.5 -3.4L4.5 -3.4L4.5 -3.6L4.5 -3.7L4.4 -3.8L4.4 -3.9L4.4 -4.1L4.4 -4.2L4.4 -4.3L4.3 -4.4L4.4 -4.5L4.4 -4.6L4.5 -4.5L4.6 -4.4L4.6 -4.3L4.6 -4.2L4.6 -4.1L4.6 -3.9L4.6 -3.8L4.6 -3.7L4.6 -3.6L4.6 -3.5L4.6 -3.3ZM3.0 -5.8L3.1 -5.8L3.2 -5.8L3.3 -5.7L3.2 -5.7L3.1 -5.8L3.0 -5.8ZM3.3 -5.7L3.3 -5.8L3.3 -5.8L3.4 -5.7L3.3 -5.7ZM3.4 -5.6L3.4 -5.6L3.5 -5.6L3.6 -5.6L3.5 -5.6ZM2.5 -5.4L2.7 -5.4L2.8 -5.3L2.9 -5.2L3.0 -5.3L3.0 -5.3L2.8 -5.4L2.7 -5.4L2.8 -5.4L2.9 -5.4L2.9 -5.5L2.9 -5.6L3.0 -5.6L3.0 -5.5L3.1 -5.5L3.2 -5.5L3.2 -5.4L3.2 -5.3L3.1 -5.3L3.1 -5.2L3.0 -5.2L2.9 -5.2L2.8 -5.2L2.7 -5.3L2.6 -5.3L2.5 -5.3ZM4.3 -4.7L4.3 -4.8L4.2 -4.9L4.1 -5.0L4.0 -5.0L4.0 -5.1L3.9 -5.2L3.9 -5.2L3.8 -5.3L3.9 -5.3L4.1 -5.1L4.2 -5.0L4.3 -4.9L4.4 -4.8L4.5 -4.7L4.5 -4.6L4.4 -4.6L4.3 -4.7ZM2.3 -5.5L2.2 -5.5L2.3 -5.6L2.2 -5.4ZM2.1 -5.8L2.1 -5.9L2.2 -5.8L2.3 -5.8ZM0.4 1.5L0.5 1.6L0.4 1.7L0.4 1.7L0.2 1.7L0.2 1.6L0.3 1.6L0.4 1.5ZM-3.2 3.6L-3.3 3.5L-3.3 3.4L-3.2 3.5L-3.2 3.4L-3.1 3.5L-3.1 3.5L-3.0 3.6L-3.0 3.7L-3.1 3.7L-3.2 3.6ZM-1.8 -7.1L-1.9 -7.1L-2.0 -7.1L-2.2 -7.1L-2.0 -7.2L-1.9 -7.2L-1.8 -7.1ZM9.2 -1.5L9.1 -1.6L9.2 -1.5L9.1 -1.4ZM-3.5 -6.1L-3.5 -6.2L-3.4 -6.3L-3.5 -6.2ZM0.0 0.4L0.1 0.5L0.1 0.6L0.1 0.5L0.1 0.7L0.1 0.8L0.2 0.9L0.2 1.0L0.2 1.1L0.1 1.1L0.2 1.1L0.2 1.2L0.1 1.2L0.0 1.3L0.1 1.3L0.1 1.4L0.0 1.4L-0.1 1.5L-0.1 1.6L-0.2 1.6L-0.3 1.6L-0.3 1.7L-0.4 1.8L-0.4 1.9L-0.5 1.9L-0.6 1.8L-0.6 1.7L-0.6 1.6L-0.6 1.5L-0.6 1.4L-0.5 1.3L-0.5 1.3L-0.5 1.2L-0.5 1.1L-0.5 1.1L-0.5 1.0L-0.5 0.9L-0.5 0.8L-0.6 0.7L-0.5 0.7L-0.5 0.6L-0.4 0.6L-0.4 0.5L-0.3 0.5L-0.2 0.5L-0.1 0.5L0.0 0.4ZM-3.5 2.8L-3.4 2.8L-3.4 2.9L-3.4 3.0L-3.3 3.1L-3.3 3.2L-3.3 3.3L-3.3 3.3L-3.4 3.2L-3.4 3.1L-3.5 3.0L-3.5 2.9L-3.6 2.8L-3.6 2.7L-3.7 2.7L-3.5 2.7ZM2.9 -3.6L3.0 -3.7L3.1 -3.6L3.1 -3.5L3.0 -3.6ZM-6.0 7.5L-6.2 7.4L-6.2 7.4L-6.4 7.2L-6.3 7.3L-6.2 7.3L-6.2 7.4L-6.1 7.5L-6.2 7.3L-6.1 7.4L-6.1 7.3L-6.2 7.3L-6.1 7.3L-6.0 7.4L-5.9 7.4L-5.9 7.6L-5.8 7.6L-5.7 7.7L-5.7 7.8L-5.6 7.9L-5.7 7.8L-5.8 7.7L-5.9 7.6ZM-6.2 6.4L-6.2 6.4L-6.1 6.3L-6.1 6.4ZM-6.5 7.0L-6.4 7.1L-6.5 7.0L-6.6 7.0ZM-6.2 7.4L-6.0 7.6L-6.1 7.5L-6.2 7.5ZM-2.6 -0.3L-2.7 -0.2L-2.7 -0.2L-2.7 -0.3L-2.6 -0.4ZM-0.9 0.2L-1.0 0.2L-1.0 0.1L-0.9 0.1L-0.9 0.2ZM-1.2 0.1L-1.1 0.2L-1.2 0.3L-1.1 0.2L-1.2 0.3L-1.2 0.4L-1.3 0.4L-1.3 0.3L-1.4 0.3L-1.4 0.1L-1.3 0.1L-1.3 0.2L-1.3 0.0L-1.1 0.1ZM-1.1 0.0L-1.1 0.1L-1.2 0.0L-1.2 -0.0L-1.2 -0.1L-1.1 -0.1L-1.1 0.0ZM-0.3 0.4L-0.3 0.5L-0.4 0.5L-0.5 0.5L-0.6 0.6L-0.7 0.5L-0.8 0.5L-0.7 0.4L-0.6 0.5L-0.5 0.4L-0.5 0.4L-0.5 0.4L-0.5 0.3L-0.4 0.3L-0.3 0.4ZM-1.0 0.4L-1.1 0.4L-1.2 0.5L-1.1 0.4ZM-1.3 0.9L-1.4 1.1L-1.4 1.0L-1.4 0.9ZM-0.5 0.3L-0.6 0.4L-0.7 0.4L-0.6 0.3L-0.6 0.3ZM-0.8 0.4L-0.8 0.5L-0.8 0.6L-0.8 0.7L-0.8 0.6L-0.9 0.5L-0.8 0.4L-0.8 0.3ZM-1.1 2.3L-1.2 2.4L-1.1 2.5L-1.1 2.5L-1.1 2.6L-1.2 2.6L-1.3 2.5L-1.3 2.5L-1.3 2.4L-1.2 2.3L-1.1 2.3ZM-1.1 0.7L-1.0 0.7L-0.9 0.7L-0.9 0.8L-0.8 0.9L-0.9 1.0L-0.8 1.1L-0.9 1.1L-0.9 1.2L-0.8 1.3L-0.9 1.4L-0.9 1.3L-1.0 1.3L-1.0 1.5L-1.1 1.4L-1.1 1.5L-1.2 1.4L-1.2 1.3L-1.2 1.2L-1.3 1.2L-1.2 1.2L-1.1 1.1L-1.0 1.1L-1.0 0.9L-1.0 0.8L-1.1 0.8L-1.1 0.7L-1.0 0.6L-0.9 0.6L-1.0 0.7ZM-2.0 5.7L-1.9 5.7L-2.0 5.8L-2.1 5.7L-2.2 5.7ZM0.8 -6.7L0.8 -6.8L0.7 -6.9L0.6 -7.0L0.6 -7.0L0.5 -7.1L0.5 -7.2L0.4 -7.3L0.3 -7.3L0.2 -7.4L0.1 -7.4L0.0 -7.5L-0.1 -7.5L-0.2 -7.6L-0.3 -7.6L-0.4 -7.7L-0.5 -7.8L-0.5 -8.0L-0.4 -8.1L-0.3 -8.2L-0.2 -8.2L-0.1 -8.3L-0.0 -8.4L0.0 -8.5L0.3 -8.5L0.5 -8.6L0.7 -8.5L0.8 -8.5L0.9 -8.5L1.1 -8.5L1.3 -8.5L1.4 -8.4L1.5 -8.3L1.6 -8.2L1.7 -8.2L1.7 -8.1L1.8 -8.1L1.7 -8.1L1.9 -8.0L2.0 -8.1L2.1 -8.0L2.2 -7.9L2.3 -7.8L2.4 -7.8L2.6 -7.7L2.8 -7.6L3.0 -7.6L3.1 -7.5L3.3 -7.5L3.5 -7.4L3.7 -7.4L3.8 -7.3L3.9 -7.3L4.0 -7.2L4.2 -7.1L4.4 -7.1L4.6 -7.0L4.7 -6.9L4.7 -6.8L4.6 -6.7L4.6 -6.7L4.6 -6.5L4.6 -6.4L4.6 -6.2L4.6 -6.3L4.5 -6.1L4.4 -6.1L4.3 -6.1L4.2 -6.1L4.1 -6.2L4.0 -6.2L3.8 -6.3L3.7 -6.3L3.6 -6.4L3.5 -6.4L3.4 -6.4L3.3 -6.3L3.2 -6.4L3.1 -6.4L3.0 -6.4L2.9 -6.3L2.7 -6.4L2.7 -6.4L2.6 -6.5L2.5 -6.5L2.4 -6.5L2.3 -6.5L2.1 -6.5L2.0 -6.5L1.9 -6.5L1.8 -6.6L1.7 -6.6L1.6 -6.6L1.7 -6.7L1.8 -6.8L1.7 -6.8L1.6 -6.9L1.5 -6.9L1.4 -7.0L1.3 -7.1L1.2 -7.1L1.1 -7.0L1.0 -6.9L1.0 -6.8L0.9 -6.7L0.9 -6.7L0.8 -6.7ZM0.8 -8.7L0.6 -8.7L0.5 -8.7L0.4 -8.7L0.3 -8.7L0.3 -8.8L0.4 -8.8L0.5 -8.9L0.6 -8.9L0.7 -8.8L0.8 -8.7Z"/><g fill="#fff"><path fill="none" stroke="#fff" stroke-width="0.55" stroke-linecap="round" d="M2.07 11.72A11.9 11.9 0 0 1 -8.84 -7.96"/><path transform="translate(1.02 11.86) rotate(227.1)" d="M0 0Q1.53 -0.88 3.40 -0.20Q1.87 0.72 0 0z"/><path transform="translate(1.02 11.86) rotate(131.1)" d="M0 0Q1.30 -0.77 2.90 -0.17Q1.59 0.63 0 0z"/><path transform="translate(-1.08 11.85) rotate(-122.8)" d="M0 0Q1.53 -0.88 3.40 -0.20Q1.87 0.72 0 0z"/><path transform="translate(-1.08 11.85) rotate(-218.8)" d="M0 0Q1.30 -0.77 2.90 -0.17Q1.59 0.63 0 0z"/><path transform="translate(-3.15 11.48) rotate(-112.6)" d="M0 0Q1.53 -0.88 3.40 -0.20Q1.87 0.72 0 0z"/><path transform="translate(-3.15 11.48) rotate(-208.6)" d="M0 0Q1.30 -0.77 2.90 -0.17Q1.59 0.63 0 0z"/><path transform="translate(-5.12 10.74) rotate(-102.5)" d="M0 0Q1.53 -0.88 3.40 -0.20Q1.87 0.72 0 0z"/><path transform="translate(-5.12 10.74) rotate(-198.5)" d="M0 0Q1.30 -0.77 2.90 -0.17Q1.59 0.63 0 0z"/><path transform="translate(-6.93 9.67) rotate(-92.4)" d="M0 0Q1.53 -0.88 3.40 -0.20Q1.87 0.72 0 0z"/><path transform="translate(-6.93 9.67) rotate(-188.4)" d="M0 0Q1.30 -0.77 2.90 -0.17Q1.59 0.63 0 0z"/><path transform="translate(-8.53 8.30) rotate(-82.2)" d="M0 0Q1.53 -0.88 3.40 -0.20Q1.87 0.72 0 0z"/><path transform="translate(-8.53 8.30) rotate(-178.2)" d="M0 0Q1.30 -0.77 2.90 -0.17Q1.59 0.63 0 0z"/><path transform="translate(-9.86 6.67) rotate(-72.1)" d="M0 0Q1.53 -0.88 3.40 -0.20Q1.87 0.72 0 0z"/><path transform="translate(-9.86 6.67) rotate(-168.1)" d="M0 0Q1.30 -0.77 2.90 -0.17Q1.59 0.63 0 0z"/><path transform="translate(-10.88 4.83) rotate(-61.9)" d="M0 0Q1.53 -0.88 3.40 -0.20Q1.87 0.72 0 0z"/><path transform="translate(-10.88 4.83) rotate(-157.9)" d="M0 0Q1.30 -0.77 2.90 -0.17Q1.59 0.63 0 0z"/><path transform="translate(-11.56 2.84) rotate(-51.8)" d="M0 0Q1.53 -0.88 3.40 -0.20Q1.87 0.72 0 0z"/><path transform="translate(-11.56 2.84) rotate(-147.8)" d="M0 0Q1.30 -0.77 2.90 -0.17Q1.59 0.63 0 0z"/><path transform="translate(-11.88 0.76) rotate(-41.6)" d="M0 0Q1.53 -0.88 3.40 -0.20Q1.87 0.72 0 0z"/><path transform="translate(-11.88 0.76) rotate(-137.6)" d="M0 0Q1.30 -0.77 2.90 -0.17Q1.59 0.63 0 0z"/><path transform="translate(-11.82 -1.35) rotate(-31.5)" d="M0 0Q1.53 -0.88 3.40 -0.20Q1.87 0.72 0 0z"/><path transform="translate(-11.82 -1.35) rotate(-127.5)" d="M0 0Q1.30 -0.77 2.90 -0.17Q1.59 0.63 0 0z"/><path transform="translate(-11.40 -3.41) rotate(-21.4)" d="M0 0Q1.53 -0.88 3.40 -0.20Q1.87 0.72 0 0z"/><path transform="translate(-11.40 -3.41) rotate(-117.4)" d="M0 0Q1.30 -0.77 2.90 -0.17Q1.59 0.63 0 0z"/><path transform="translate(-10.62 -5.36) rotate(-11.2)" d="M0 0Q1.53 -0.88 3.40 -0.20Q1.87 0.72 0 0z"/><path transform="translate(-10.62 -5.36) rotate(-107.2)" d="M0 0Q1.30 -0.77 2.90 -0.17Q1.59 0.63 0 0z"/><path transform="translate(-9.51 -7.15) rotate(-1.1)" d="M0 0Q1.53 -0.88 3.40 -0.20Q1.87 0.72 0 0z"/><path transform="translate(-9.51 -7.15) rotate(-97.1)" d="M0 0Q1.30 -0.77 2.90 -0.17Q1.59 0.63 0 0z"/><path fill="none" stroke="#fff" stroke-width="0.55" stroke-linecap="round" d="M-2.07 11.72A11.9 11.9 0 0 0 8.84 -7.96"/><path transform="translate(-1.02 11.86) rotate(-47.1)" d="M0 0Q1.53 -0.88 3.40 -0.20Q1.87 0.72 0 0z"/><path transform="translate(-1.02 11.86) rotate(48.9)" d="M0 0Q1.30 -0.77 2.90 -0.17Q1.59 0.63 0 0z"/><path transform="translate(1.08 11.85) rotate(-57.2)" d="M0 0Q1.53 -0.88 3.40 -0.20Q1.87 0.72 0 0z"/><path transform="translate(1.08 11.85) rotate(38.8)" d="M0 0Q1.30 -0.77 2.90 -0.17Q1.59 0.63 0 0z"/><path transform="translate(3.15 11.48) rotate(-67.4)" d="M0 0Q1.53 -0.88 3.40 -0.20Q1.87 0.72 0 0z"/><path transform="translate(3.15 11.48) rotate(28.6)" d="M0 0Q1.30 -0.77 2.90 -0.17Q1.59 0.63 0 0z"/><path transform="translate(5.12 10.74) rotate(-77.5)" d="M0 0Q1.53 -0.88 3.40 -0.20Q1.87 0.72 0 0z"/><path transform="translate(5.12 10.74) rotate(18.5)" d="M0 0Q1.30 -0.77 2.90 -0.17Q1.59 0.63 0 0z"/><path transform="translate(6.93 9.67) rotate(-87.6)" d="M0 0Q1.53 -0.88 3.40 -0.20Q1.87 0.72 0 0z"/><path transform="translate(6.93 9.67) rotate(8.4)" d="M0 0Q1.30 -0.77 2.90 -0.17Q1.59 0.63 0 0z"/><path transform="translate(8.53 8.30) rotate(-97.8)" d="M0 0Q1.53 -0.88 3.40 -0.20Q1.87 0.72 0 0z"/><path transform="translate(8.53 8.30) rotate(-1.8)" d="M0 0Q1.30 -0.77 2.90 -0.17Q1.59 0.63 0 0z"/><path transform="translate(9.86 6.67) rotate(-107.9)" d="M0 0Q1.53 -0.88 3.40 -0.20Q1.87 0.72 0 0z"/><path transform="translate(9.86 6.67) rotate(-11.9)" d="M0 0Q1.30 -0.77 2.90 -0.17Q1.59 0.63 0 0z"/><path transform="translate(10.88 4.83) rotate(-118.1)" d="M0 0Q1.53 -0.88 3.40 -0.20Q1.87 0.72 0 0z"/><path transform="translate(10.88 4.83) rotate(-22.1)" d="M0 0Q1.30 -0.77 2.90 -0.17Q1.59 0.63 0 0z"/><path transform="translate(11.56 2.84) rotate(-128.2)" d="M0 0Q1.53 -0.88 3.40 -0.20Q1.87 0.72 0 0z"/><path transform="translate(11.56 2.84) rotate(-32.2)" d="M0 0Q1.30 -0.77 2.90 -0.17Q1.59 0.63 0 0z"/><path transform="translate(11.88 0.76) rotate(-138.4)" d="M0 0Q1.53 -0.88 3.40 -0.20Q1.87 0.72 0 0z"/><path transform="translate(11.88 0.76) rotate(-42.4)" d="M0 0Q1.30 -0.77 2.90 -0.17Q1.59 0.63 0 0z"/><path transform="translate(11.82 -1.35) rotate(-148.5)" d="M0 0Q1.53 -0.88 3.40 -0.20Q1.87 0.72 0 0z"/><path transform="translate(11.82 -1.35) rotate(-52.5)" d="M0 0Q1.30 -0.77 2.90 -0.17Q1.59 0.63 0 0z"/><path transform="translate(11.40 -3.41) rotate(-158.6)" d="M0 0Q1.53 -0.88 3.40 -0.20Q1.87 0.72 0 0z"/><path transform="translate(11.40 -3.41) rotate(-62.6)" d="M0 0Q1.30 -0.77 2.90 -0.17Q1.59 0.63 0 0z"/><path transform="translate(10.62 -5.36) rotate(-168.8)" d="M0 0Q1.53 -0.88 3.40 -0.20Q1.87 0.72 0 0z"/><path transform="translate(10.62 -5.36) rotate(-72.8)" d="M0 0Q1.30 -0.77 2.90 -0.17Q1.59 0.63 0 0z"/><path transform="translate(9.51 -7.15) rotate(-178.9)" d="M0 0Q1.53 -0.88 3.40 -0.20Q1.87 0.72 0 0z"/><path transform="translate(9.51 -7.15) rotate(-82.9)" d="M0 0Q1.30 -0.77 2.90 -0.17Q1.59 0.63 0 0z"/></g></g></svg>',
 su:'<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAlgAAAEsBAMAAADtE9ClAAAAMFBMVEX/5gD/3AD/1wD+1wD/1QD+0wD3twDqfwDbQQDPEADNAwDMAgDMAQDMAADKAADJAAB7MkObAAAKXklEQVR42u3cbXAU9R0H8O/upUB0crsbHgpD9m4DCU+XXGJAMjyIyNBaQGoldCiC02FoC4wP2Ekp0srQotMRjYO2Ux+mtZU6YumDjDxFitQSBtvwEC6HERSSe8IxEpLbvQQR5W77YnNJGrnchjd9sd/fK+buwovPfP+//f33SWgGy26JJCAWsYhFLGIRiwTEIhaxiEUsYpGAWMQiFrGIZZWpE8tupQrqwsSyGyxT14lls3J2t80lls1qPP9mHrHsVtxkg7dbPsPcSyybB0P3vtmRMLHsHQylhMfQiWWrXO8Kcns5sWxV5MJ9Iw+7HYol2L4xpEMHgK4j7nVa5xEAEAqdhpVj+5dFMgCYb3kV82vzAcAMEStDGYestn5FMu7dZoVytUGsDDODuUmL68DQF6NjHwMEJbUurBDrxqUsa371bq8uCO7IqJ/qgvvkkA1xLsNM1fLk5aszymTE/HfCzPv5sW0tCrEyRutA5SZl0VFJQYv0/tmax1Z0Om50cK23/dNR04dsl74hArnBmS+Xv1AvE2uAkezj+yLPTZCHwSx6auejHY6bsgY3wefvvzv3uAeIvvL8TxY50Gpw253SSRv+KAHGpWVbz3BvmO3Hl+V5iY6wt0h4VyNWtupqKw4NL4/P230nzzpkLa+uxD59vrTQTDgSK2cwPzbHxkoWrdlZOMWzp0xmsrLsD6W9U2t23n+wYpYRZrKyycaF1meqPesmyvE5TsQaxFAKJA59EdF+VeJ+8lsfLr/GZThwRdrydlY2NFffH9zt5jLMUpJxsnpFJw5UPjjS4DLMcjAs2Dv6hXoZo6bnvV0sD3MeljCIJ1mTHvfLaiGADv+aMk85sQacHC78+yHrJFbjmH3zHLjhGUyDdxnru/fPpV+XHBisQSULQigdp1S+ztEhS9PSAOtqqxjgRtrWj0d4woBGLDsVP7hv7mlHnnS4CSxZPvfcEmdq5Qz6L4RKc/v1DbudeDQc1EY6PZte3zJsVaPMZNlZuV/+4NLjOSudd411cHNWz9mHyVOGPKU672LYTT3o5PnPo2MOVoSZLJttS711+Y8dtxBvosEDEI95r7wxMT6aybIVLdV9z9A/xZisjGUaTa3Dci3j90Z1Hbrl6mgmK1MZ3nxTbz+dLytAx/lH/B9EY0xWhkqNfOZwQ6holiJ/DgydfObLTtFh0RpEsiLnHjTz5yuKMmIugGBjHT6rixHrxsFyb+wS2kNxvfiuUffJaFdVzdhUpnG7c6OKnXtdBcYLUuDVFwAo0cWGdH4Ok5UhWIkAAMA/5jcRAMEjwVj0YtRJ+2nbDT569Omr1l+cXKPLAIZ8/uchsxOSk7Ds7g1TvuOLrX/5Vi/WAMC9Sodx3M1leKND4XrVClbkJa8GAGb7S5FYtCvKZfiVYKk7tFYAQOmctd1D/IXWa5+onw+TuQz7Hwr//rrV3V0Hbg92fyYVByC1yFyGAxwKt6bvJzVv9ahil5O2POJNBwspxQRSdexZmTqW+s3ujgVAMM/nxosVB+0PxUEFSzx7e+/RT/jYK0PS2eAzzFjAA33HCRkwPioj1g2DhdTkX6Z6P5fEIC466e5SG1hmn2BdfCYW7vlCLtIBJz1sYQMr0dOxNKQWnPT3JusuwHTv0YnVW9fTwVKDQFPN3p5oJWUDqRIHPWxhA8sotmYp13sry5FceKK093hoApLOZdinCqtVDQB81dP3Ak2v7AukrSADRrycWH12RLVLggBctRXjV5QjufBET7vX/RrQJhGrT/k2qBrgq557ZfpeoKlnkIAgA4JuEqvvlqh2SRCu2mmNatWKciR9Bxenl6EJhB10E6Ct7Y5vg6r5qu/QxKbpR4HY4d8G+v4HXIb9o3WmdloQUKvuKUeqpH5xT4uHEGey+kdrbPUdGiAem1YHxA5Z0TKd9hJOm+fgg+cmShqApGe5EYb3bDQGIOkpcMMV7YwxWf9TJWv8mrUgpwWBWG53tBz21KHNK9JiiyBbC3LBSSOcKnzqYlCG6LQXaNm9bqjI6V5fEQSiY56IA9HdXqvJEytjr/doSI3YNleH0eYHTJlYA4wR90aB8IytKXNsRAc8txnEyhytjXENqZxtnSH/a2HAlAViDRCtRxJAy4J3yt6UAUgjI8S6QenpaIU0oKlm/3E/AChhYn21TE86Wg8ngOTC+joAMBzU4O3fzNZY8S/r9hkk1bw5YYjtw1OAmHixnMnqH6szS3L/cYe1EF1vPwQgNdUDQDAWM1n9KzJzy6V9P+t+N2m7qnrSX1T+2jnXwuzen1W6+emLpbu9edeGAchtlj7s/sLvc9ANWnbvz6p5dqk/Nqa+KC8EAJc3dsdJbPI6aG9oL1mp5F98Dbp5/USre8ZnofhwX+pMrg4AYnSXg/aG9npWUnWrED3hcYd/NH6pjLY3m/9pfeGdtNpBr6O2d4qmaZc3JSajaKnaNapZRsehhNWoxESxQax+wZq5xxNWJ9Yr4YbbL+zSoYwo7x7bdcFJp5btLEMz2LpedbVtSbyWAsRCGfGW9Ffasa6gTKy+VgvXJoIFk7a6ZxQG+h9MC+Z82znrMPvoYEYXbd4XUM9WxmqX7tH6HyZztmnO2UhnHx2isx5/tjIR21Qljpj55TsT9V7nwjhgzLrwnWtchunmLtXUVDV4R+84IyMy5bH9pekgjb8euC0MuKJvSBqTZdX7xzdXNYjCgk81QGrHLUd8ShzAuHFHO6p3SIA5+9L3rjFZVlNSl7saIMasK6nJkbtO/S6/QkF7KLSs8sG1RqDPk0/Eipz9RR7gnVRlvXmmvfiLP7T8LY78+eMmfP+t1i15APxjnjCIBcBs2ZkIAP4yf7n1QfsI7a+huCDnf/d6UJXWGmHAFXnJIS88z4KV9OSpgChs6llp5umphYAZPzVcRvCD7W4A/oJVxAKA+kfcgCt6sc8ZvngLIBQqSN8mAjHnqDNOAGbZG0bP+8NAwbRwfu9nytSeQ2ltxQ4AQlhyBlaWCV6Py4AoTc+A4dsQ1wA4ZTNt50ypVrsyw2xgXXA1FYFYAKBAHH9qY2Omr30bT2soWRIkFgCYeurEss0ZTyy4ah8OYH+R7gysLA3e+0lg+LLKuswTesmMriOrH3DI1bBso4P0e2HC7IEsEh+Ff3ia2x3rcFiIy50DjZzJHLk5nxtpq2eFBGXg8bzDcMwLS2/yBYnOLJEExCIWsYhFLGKRgFjEIhaxiEUsEhCLWMQiFrGIRQJiEYtYxCIWsUhALGIRi1jEIhYJiEUsYhGLWMQiAbGIRSxiEYtYJCAWsYhFLGIRiwTEIhaxiEUsYpGAWMQiFrGIRSwSEItYxCIWsYhFAmIRi1jEIhaxSEAsYhGLWMQiFgmIRSxiEYtYxCIBsYhFLGIRi1gkIBaxiEUsYhGLBMQiFrGIRSxikYBYxCIWsYhFLBIQi1jEIhaxiEUCYhGLWMQiFrFIQCxiEYtYxCIWCYhFLGIRi1jEIgGxiEUsYhGLWCQgFrGIRSxiEYsExCIWsYhFLGKRgFjEIhaxiEUsEhCLWMQiFrGIRQJiEev/Xf8FMdRMDq/R63YAAAAASUVORK5CYII=" alt="" style="width:100%;height:100%;display:block;object-fit:cover">',
 de:'<svg viewBox="0 0 5 3"><rect width="5" height="1" fill="#000"/><rect y="1" width="5" height="1" fill="#fff"/><rect y="2" width="5" height="1" fill="#D00"/></svg>',
 at:'<svg viewBox="0 0 6 4"><rect width="3" height="4" fill="#C8102E"/><rect y="1.33" width="3" height="1.34" fill="#fff"/><rect x="3" width="3" height="4" fill="#fff"/><rect x="3" width="3" height="1.33" fill="#C8102E"/><rect x="3" y="2.67" width="3" height="1.33" fill="#477050"/></svg>',
 ru:'<svg viewBox="0 0 3 2"><rect width="3" height="2" fill="#fff"/><rect y=".67" width="3" height=".67" fill="#0039A6"/><rect y="1.33" width="3" height=".67" fill="#D52B1E"/></svg>',
 fr:'<svg viewBox="0 0 3 2"><rect width="1" height="2" fill="#002395"/><rect x="1" width="1" height="2" fill="#fff"/><rect x="2" width="1" height="2" fill="#ED2939"/></svg>',
 gb:'<svg viewBox="0 0 60 30"><path d="M0,0 v30 h60 v-30 z" fill="#012169"/><path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6"/><path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" stroke-width="2.4"/><path d="M30,0 v30 M0,15 h60" stroke="#fff" stroke-width="10"/><path d="M30,0 v30 M0,15 h60" stroke="#C8102E" stroke-width="6"/></svg>',
 rs:'<svg viewBox="0 0 3 2"><rect width="3" height="2" fill="#fff"/><rect width="3" height=".67" fill="#C6363C"/><rect y=".67" width="3" height=".67" fill="#0C4076"/></svg>'
};
/* period colours per role: stripe = flag or dynastic colours, acc = accent used for role name, key boxes and stamps */
var THEME={
 ar:{stripe:['#1C2A3A','#CC0000'],acc:'#8B1A1A'},
 pl:{stripe:['#8E1A1A','#3A2E1F'],acc:'#8E1A1A'},
 nsk:{stripe:['#CC0000','#FFD700'],acc:'#CC0000'},
 jfk:{stripe:['#B31942','#FFFFFF','#0A3161'],acc:'#0A3161'},
 fc:{stripe:['#002A8F','#FFFFFF','#CB1515'],acc:'#002A8F'},
 hm:{stripe:['#C8102E','#FFFFFF','#012169'],acc:'#012169'},
 ut:{stripe:['#5B92E5','#FFFFFF'],acc:'#1B3F73'},
 de:{stripe:['#111111','#FFFFFF','#C1121F'],acc:'#111111'},
 at:{stripe:['#111111','#E3B21B'],acc:'#7A5A00'},
 ru:{stripe:['#FFFFFF','#1C3F94','#C1121F'],acc:'#1C3F94'},
 fr:{stripe:['#1F3E8C','#FFFFFF','#C8202E'],acc:'#1F3E8C'},
 gb:{stripe:['#C1121F','#FFFFFF','#0B2A5B'],acc:'#0B2A5B'},
 rs:{stripe:['#C6363C','#0C4076','#FFFFFF'],acc:'#A3262C'}
};
var IMGLABS={en:{wilhelm2:'Wilhelm II',bethmann:'Bethmann Hollweg',moltke:'Moltke',berchtold:'Berchtold',franzjoseph:'Franz Joseph',tisza:'Tisza',conrad:'Conrad',nicholas2:'Nicholas II',sazonov:'Sazonov',poincare:'Poincaré',viviani:'Viviani',grey:'Grey',asquith:'Asquith',churchill:'Churchill',pasic:'Pašić',albert1:'Albert I',lichnowsky:'Lichnowsky',jaures:'Jaurès'},ko:{wilhelm2:'빌헬름 2세',bethmann:'베트만홀베크',moltke:'몰트케',berchtold:'베르히톨트',franzjoseph:'프란츠 요제프',tisza:'티서',conrad:'콘라트',nicholas2:'니콜라이 2세',sazonov:'사조노프',poincare:'푸앵카레',viviani:'비비아니',grey:'그레이',asquith:'아스퀴스',churchill:'처칠',pasic:'파시치',albert1:'알베르 1세',lichnowsky:'리히노프스키',jaures:'조레스'}};
function IMGLAB(){return IMGLABS[LANG];}
var app=document.getElementById('app');
var C=null, R=null, S=null, MAPS=null, TYPES=null, cache={};
var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;

function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
/* inline "(가상)" markers are shown once as a stamp instead of inside sentences */
function clean(s){return String(s==null?'':s).replace(/\s*\((가상|가상 장면|가상 전개|hypothetical|alternate)\)/gi,'');}
function tx(s){return esc(clean(s));}
function get(url){ if(cache[url]) return Promise.resolve(cache[url]); var k=url.replace(BASE,'').replace(/^.*data\//,''); if(window.INLINE&&INLINE[k]!==undefined){ if(INLINE[k]===null) return Promise.reject(new Error('none')); cache[url]=INLINE[k]; return Promise.resolve(INLINE[k]); }
  return fetch(url,{cache:'no-cache'}).then(function(r){if(!r.ok) throw new Error(url+' '+r.status); return r.json();}).then(function(j){cache[url]=j;return j;});}
function opt(url){ return get(url).catch(function(){return null;}); }
function top(){ if(SWITCHING) return; window.scrollTo({top:0,behavior:reduce?'auto':'smooth'});}
function store(k,v){ try{ if(v===undefined) return localStorage.getItem(k); localStorage.setItem(k,v); }catch(e){ return null; } }

/* ---------- sound (synthesised, no files) ---------- */
var SND={on:store('wod62-sound')!=='off', ctx:null, music:null};
function ac(){ if(!SND.on) return null; try{ if(!SND.ctx){ var A=window.AudioContext||window.webkitAudioContext; if(!A) return null; SND.ctx=new A(); } if(SND.ctx.state==='suspended') SND.ctx.resume(); return SND.ctx; }catch(e){ return null; } }
function noise(ctx,dur){ var b=ctx.createBuffer(1,Math.max(1,Math.floor(ctx.sampleRate*dur)),ctx.sampleRate), d=b.getChannelData(0); for(var i=0;i<d.length;i++) d[i]=Math.random()*2-1; var s=ctx.createBufferSource(); s.buffer=b; return s; }
function env(ctx,g,t,a,peak,dec){ g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(peak,t+a); g.gain.exponentialRampToValueAtTime(0.0001,t+a+dec); }
function sfx(kind){
  var ctx=ac(); if(!ctx) return; var t=ctx.currentTime, out=ctx.destination;
  if(kind==='click'||kind==='key'){ var n=noise(ctx,.03), f=ctx.createBiquadFilter(), g=ctx.createGain(); f.type='bandpass'; f.frequency.value=kind==='key'?3200:1800; f.Q.value=1.2; n.connect(f).connect(g).connect(out); env(ctx,g,t,.002,kind==='key'?.08:.28,.035); n.start(t); n.stop(t+.04); return; }
  if(kind==='page'){ var n2=noise(ctx,.25), f2=ctx.createBiquadFilter(), g2=ctx.createGain(); f2.type='bandpass'; f2.Q.value=.8; f2.frequency.setValueAtTime(700,t); f2.frequency.exponentialRampToValueAtTime(3500,t+.2); n2.connect(f2).connect(g2).connect(out); env(ctx,g2,t,.02,.26,.22); n2.start(t); n2.stop(t+.26); return; }
  if(kind==='wire'){ [0,.14,.28].forEach(function(o,i){ var os=ctx.createOscillator(), g3=ctx.createGain(); os.type='square'; os.frequency.value=780; os.connect(g3).connect(out); var d=i===1?.11:.05; env(ctx,g3,t+o,.004,.07,d); os.start(t+o); os.stop(t+o+d+.02); }); return; }
  if(kind==='stamp'){ var o=ctx.createOscillator(), g4=ctx.createGain(); o.type='sine'; o.frequency.setValueAtTime(140,t); o.frequency.exponentialRampToValueAtTime(55,t+.18); o.connect(g4).connect(out); env(ctx,g4,t,.004,.75,.22); o.start(t); o.stop(t+.25);
    var n4=noise(ctx,.08), f4=ctx.createBiquadFilter(), g5=ctx.createGain(); f4.type='lowpass'; f4.frequency.value=900; n4.connect(f4).connect(g5).connect(out); env(ctx,g5,t,.002,.25,.07); n4.start(t); n4.stop(t+.09); return; }
  if(kind==='drum'){ [0,.42].forEach(function(o2,i){ var os2=ctx.createOscillator(), g6=ctx.createGain(); os2.type='sine'; os2.frequency.setValueAtTime(i?62:70,t+o2); os2.frequency.exponentialRampToValueAtTime(38,t+o2+.9); os2.connect(g6).connect(out); env(ctx,g6,t+o2,.01,i?.85:.6,1.1); os2.start(t+o2); os2.stop(t+o2+1.2);
      var n6=noise(ctx,.3), f6=ctx.createBiquadFilter(), g7=ctx.createGain(); f6.type='lowpass'; f6.frequency.value=300; n6.connect(f6).connect(g7).connect(out); env(ctx,g7,t+o2,.005,.18,.25); n6.start(t+o2); n6.stop(t+o2+.3); }); return; }
  if(kind==='rise'||kind==='fall'){ var os4=ctx.createOscillator(), g9=ctx.createGain(); os4.type='triangle'; os4.frequency.setValueAtTime(kind==='rise'?330:520,t); os4.frequency.exponentialRampToValueAtTime(kind==='rise'?520:300,t+.25); os4.connect(g9).connect(out); env(ctx,g9,t,.01,.12,.28); os4.start(t); os4.stop(t+.32); return; }
  if(kind==='end'){ [98,147,196].forEach(function(fq,i){ var os3=ctx.createOscillator(), g8=ctx.createGain(); os3.type='triangle'; os3.frequency.value=fq; os3.connect(g8).connect(out); g8.gain.setValueAtTime(0.0001,t); g8.gain.exponentialRampToValueAtTime(.13,t+.4+i*.15); g8.gain.exponentialRampToValueAtTime(0.0001,t+3); os3.start(t); os3.stop(t+3.1); }); }
}
/* the operator's two score tracks play one after the other, alternating for as long as the game is open */
/* 2026-10-25: 진영별 음악. 첫 곡만 진영마다 다르고(서방·소련 측·유엔) 잠수함·불안·카운트다운 세 곡은 공통. 역할을 고를 때 한 번 바뀌고, 장면 전환에는 바뀌지 않는다 */
var BGM_COMMON=[BASE+'audio/submarine.mp3',BASE+'audio/uneasy.mp3',BASE+'audio/countdown.mp3'];
var BGM_CAMP={jfk:'west',hm:'west',nsk:'east',pl:'east',ar:'east',fc:'east',ut:'un'};
function bgmFor(id){ var c=BGM_CAMP[id]; return (c?[BASE+'audio/'+c+'.mp3']:[]).concat(BGM_COMMON); }
var BGM=bgmFor(null), BGMVOL=.35, NOBGM=document.documentElement.getAttribute('data-bgm')==='off';
SND.list=[]; SND.idx=0;
function setPlaylist(id){ var L=bgmFor(id); if(L.join('|')===BGM.join('|')) return;
  var was=false; try{ var cur=SND.list[SND.idx]; was=!!(cur&&!cur.paused); if(cur) cur.pause(); }catch(e){}
  BGM=L; SND.list=[]; SND.idx=0; if(was&&SND.on) music(true); }
function track(k){ if(!SND.list[k]){ var a=new Audio(BGM[k]); a.preload='none'; a.volume=BGMVOL; a.addEventListener('ended',function(){ if(SND.on&&SND.idx===k){ SND.idx=(k+1)%BGM.length; var b=track(SND.idx); b.currentTime=0; b.play().catch(function(){}); } }); SND.list[k]=a; } return SND.list[k]; }
/* v1962: as in 1914, the stored tracks play one after another in rotation; scenes never switch or restart the music */
function music(play){
  if(NOBGM) return;
  try{ var a=track(SND.idx); if(play&&SND.on) a.play().catch(function(){}); else a.pause(); }catch(e){}
}
function soundBtn(){ return '<button class="sbtn" id="snd" aria-pressed="'+(SND.on?'true':'false')+'">'+(SND.on?T('소리 켬','Sound on'):T('소리 끔','Sound off'))+'</button>'; }
function langBtn(){ return LANGLINK?'<button class="sbtn lbtn" id="lsw" lang="'+(EN?'ko':'en')+'" aria-label="'+(EN?'한국어로 보기':'View in English')+'">'+(EN?'한국어':'English')+'</button>':''; }
/* switch the language in place: same screen, same role and choices, same music; only the words, the data and the address change */
function switchLang(l){
  if(l===LANG) return;
  setLang(l);
  if(/^\/(en\/)?play\/1962\/$/.test(location.pathname)){ try{ var q=new URLSearchParams(location.search); q.delete('lang'); var qs=q.toString(); history.replaceState(null,'',(EN?'/en':'')+'/play/1962/'+(qs?'?'+qs:'')+location.hash); }catch(e){} }
  var jobs=[get(BASE+'data/common.'+LANG+'.json'),opt(BASE+'data/maps'+(EN?'.en':'')+'.json'),opt(BASE+'data/types.'+LANG+'.json')];
  if(R) jobs.push(get(BASE+'data/'+R.id+'.'+LANG+'.json'));
  Promise.all(jobs).then(function(r){
    C=r[0]; MAPS=r[1]; TYPES=r[2];
    if(R){ R=r[3]; if(S) S.hist=S.hist.map(function(h){ var n=R.nodes[h.id]; var c=n&&n.choices.filter(function(x){return x.key===h.pick;})[0]; return c?histEntry(n,c):h; }); }
    SWITCHING=true; try{ if(VIEW) VIEW(); } finally{ SWITCHING=false; }
  }).catch(function(e){ app.textContent=T('자료를 불러오지 못했습니다. ','Could not load the game data. ')+e.message; });
}
function bindSound(){ var l=document.getElementById('lsw'); if(l) l.onclick=function(){ sfx('click'); switchLang(EN?'ko':'en'); };
  var b=document.getElementById('snd'); if(!b) return; b.onclick=function(){ SND.on=!SND.on; store('wod62-sound',SND.on?'on':'off'); b.textContent=SND.on?T('소리 켬','Sound on'):T('소리 끔','Sound off'); b.setAttribute('aria-pressed',SND.on?'true':'false'); if(SND.on){ sfx('click'); music(true);} else music(false); }; }

/* 2026-10-23 (partner suggestion): roles already played light up on the role screen; kept in the browser as role:ending pairs */
function doneMap(){ var m={}; String(store('wod62-done')||'').split(',').forEach(function(x){ var a=x.split(':'); if(a[0]) m[a[0]]=a[1]||''; }); return m; }
function markDone(id,k){ var m=doneMap(); m[id]=k; store('wod62-done',Object.keys(m).map(function(x){return x+':'+m[x];}).join(','));
  /* 2026-10-23 (operator decision): the finished run is kept so its ending, type and card can be opened again from the role screen */
  var sv={}; try{ sv=JSON.parse(store('wod62-save')||'{}')||{}; }catch(e){}
  sv[id]={k:k,g:S.g,flags:S.flags,ax:S.ax,axLast:S.axLast,qn:S.qn,hist:S.hist.map(function(h){return [h.id,h.pick];})};
  store('wod62-save',JSON.stringify(sv)); }
function savedRun(id){ try{ var sv=JSON.parse(store('wod62-save')||'{}'); return sv&&sv[id]||null; }catch(e){ return null; } }
function replay(id){
  var sv=savedRun(id); if(!sv) return;
  get(BASE+'data/'+id+'.'+LANG+'.json').then(function(r){
    R=r; setTheme(id);
    S={g:sv.g,flags:sv.flags||{},ax:sv.ax||{},axLast:sv.axLast||{},hist:[],node:r.first,qn:sv.qn||0};
    S.hist=(sv.hist||[]).map(function(a){ var n=R.nodes[a[0]], c=n&&n.choices.filter(function(x){return x.key===a[1];})[0]; S.node=a[0]; return c?histEntry(n,c):null; }).filter(function(x){return x;});
    ending('END:'+sv.k,0,true);
  });
}
/* ③ (partner suggestion): a calendar strip from 28 June to 4 August with the current scene and the decisions already made */
function timeline(n){
  var d0=Date.UTC(1962,9,14), d1=Date.UTC(1962,9,28), span=d1-d0;
  var at=function(s){ var m=String(s||'').match(/^(\d{4})-(\d{2})-(\d{2})/); if(!m) return null; var v=(Date.UTC(+m[1],+m[2]-1,+m[3])-d0)/span; return Math.max(0,Math.min(1,v)); };
  var cur=at(n.date); if(cur==null) return '';
  var ticks=[['1962-10-14',T('10.14','14 Oct')],['1962-10-16',T('10.16','16 Oct')],['1962-10-22',T('10.22','22 Oct')],['1962-10-24',T('10.24','24 Oct')],['1962-10-26',T('10.26','26 Oct')],['1962-10-28',T('10.28','28 Oct')]];
  var past=(S.hist||[]).map(function(h){return at(h.date);}).filter(function(v){return v!=null;});
  var over=String(n.date||'')>'1962-10-28', before=String(n.date||'')<'1962-10-14';
  return '<div class="tl" aria-label="'+esc(T('달력','Calendar'))+'"><div class="tl-bar">'+
    ticks.map(function(x){ var v=at(x[0]); return '<i class="tk" style="left:'+(v*100)+'%"></i>'+(x[1]?'<span class="tl-l" style="left:'+(v*100)+'%">'+x[1]+'</span>':''); }).join('')+
    past.map(function(v){ return '<i class="pt" style="left:'+(v*100)+'%"></i>'; }).join('')+
    '<i class="now" style="left:'+(cur*100)+'%"></i></div>'+
    '<div class="tl-now" style="left:'+(cur*100)+'%"><span>'+(over?T('10월 28일 이후 · ','after 28 Oct · '):before?T('10월 14일 이전 · ','before 14 Oct · '):'')+dayLabel(n.date)+'</span></div></div>';
}
/* v4.24 (2026-10-23) three-area switch: Geopolitics · Academy · Game, same tab (progress is saved per role). The off-site preview keeps the plain label. */
function areaNav(){ if(!LANGLINK) return '<span>CLISA GAMES</span>'; return '<nav class="asw" aria-label="'+T('클리사 영역','Clisa sections')+'"><a href="'+SITE+'/">'+T('지오폴리틱스','Geopolitics')+'</a><a href="'+SITE+'/academy/">'+T('아카데미','Academy')+'</a><a href="'+SITE+'/play/" class="on" aria-current="page">'+T('게임','Game')+'</a></nav>'; }
function chgBtn(){ return (R&&VIEW!==roles)?'<button class="sbtn" id="chg" title="'+T('다른 자리에서 다시 시작합니다. 이 자리의 진행은 지워집니다.','Start again in another chair. Progress in this chair is discarded.')+'">'+T('자리 바꾸기','Change chair')+'</button>':''; }
function brand(){return '<div class="brandbar">'+areaNav()+'<span class="bb-r"><span>WORLD OF DECISION · 1962</span>'+langBtn()+chgBtn()+soundBtn()+'</span></div>';}
function render(h){ app.innerHTML=h; bindSound(); var cb=document.getElementById('chg'); if(cb) cb.onclick=function(){ sfx('click'); R=null; S=null; roles(); }; }
function dayLabel(d){ if(!d) return ''; var m=d.match(/^(\d{4})-(\d{2})-(\d{2})/); if(!m) return esc(d); return EN?(+m[3])+' '+['January','February','March','April','May','June','July','August','September','October','November','December'][+m[2]-1]:(+m[2])+'월 '+(+m[3])+'일'; }
function yearOf(d){ var m=String(d||'').match(/^(\d{4})/); return m?m[1]:''; }
function setTheme(id){
  var th=THEME[id], root=document.documentElement;
  if(!th){ root.removeAttribute('data-role'); root.style.removeProperty('--acc'); root.style.removeProperty('--stripe'); return; }
  var n=th.stripe.length, stops=th.stripe.map(function(c,i){return c+' '+(i*100/n)+'% '+((i+1)*100/n)+'%';}).join(',');
  root.setAttribute('data-role',id); root.style.setProperty('--acc',th.acc); root.style.setProperty('--stripe','linear-gradient(180deg,'+stops+')');
}

/* ---------- screens ---------- */
function title(){
  VIEW=title; setTheme(null); setPlaylist(null);
  render('<section class="title">'+
   '<div class="kicker">'+areaNav()+'<span class="bb-r"><span>'+esc(C.ep)+'</span>'+langBtn()+soundBtn()+'</span></div>'+
   '<div class="of">WORLD OF</div><h1>DECISION</h1>'+
   '<div class="row">'+(EN?'<span class="ko">'+esc(C.sub||'')+'</span>':'<span class="ko">'+esc(C.title)+'</span>')+'<span class="stamp-r">'+esc(C.ep)+'</span></div>'+
   '<p class="hook">'+esc(C.hook)+'</p>'+
   '<button class="btn" id="go">'+T('결정하러 가기','Take your seat')+'</button>'+
   '<div class="count"><div><b>13</b>'+T('일간의 위기',' days of crisis')+'</div><div><b>7</b>'+T('개 자리',' chairs')+'</div><div><b>?</b>'+T('알 수 없는 결말',' an unknown ending')+'</div></div>'+rights()+'</section>');
  document.getElementById('go').onclick=function(){ sfx('stamp'); music(true); roles(); };
}
function roles(){
  VIEW=roles; setTheme(null); setPlaylist(null);
  Promise.all(ROLES.map(function(r){return opt(BASE+'data/'+r.id+'.'+LANG+'.json');})).then(function(list){
    var dm=doneMap(), nd=ROLES.filter(function(r){return dm[r.id]!==undefined;}).length;
    var h=brand()+'<h2 class="h2">'+T('누구의 자리에 앉으시겠습니까?','Whose chair will you take?')+'</h2><p class="lead">'+T('어느 자리를 골라도 같은 1962년 10월 안에서 움직입니다. 짧은 자리(아르히포프·플리예프)에서 시작해 보셔도 좋습니다.','Every chair plays out inside the same October 1962. The short chairs (Arkhipov, Pliyev) are a good place to start.')+
      (nd?' <span class="prog">'+T('끝낸 자리 ','Chairs completed: ')+nd+' / '+ROLES.length+'</span>':'')+'</p><div class="roles">';
    ROLES.forEach(function(r,i){var d=list[i], dk=dm[r.id];
      h+='<button class="role'+(d?'':' off')+(dk!==undefined?' done':'')+'" data-id="'+r.id+'"><span class="rt"><span class="flag">'+FLAGS[r.flag]+'</span>'+(dk!==undefined?'<span class="donek'+(savedRun(r.id)?' re':'')+'"'+(savedRun(r.id)?' data-replay="'+r.id+'" role="button" title="'+T('지난 결과 다시 보기','Open the last result')+'"':'')+'>'+(savedRun(r.id)?T('결말 ','Ending ')+esc(dk||'')+' · '+T('결과 보기','See result')+' →':T('끝냄','Done')+(dk?' · '+T('결말 ','Ending ')+esc(dk):''))+'</span>':'')+'</span>'+
        '<span class="cty">'+esc(d?d.country:'')+'</span><span class="who">'+esc(d?d.person:T('준비 중','Coming soon'))+'</span><span class="card">'+esc(d?d.card:'')+'</span>'+(d?'':'<span class="soon">'+T('준비 중','Coming soon')+'</span>')+'</button>';});
    render(h+'</div>');
    app.querySelectorAll('.role').forEach(function(b){b.onclick=function(ev){ var rp=ev.target.closest&&ev.target.closest('[data-replay]'); sfx('click'); if(rp) replay(rp.dataset.replay); else start(b.dataset.id);};});
    top();
  });
}
function start(id){
  get(BASE+'data/'+id+'.'+LANG+'.json').then(function(r){
    R=r; setTheme(id); setPlaylist(id);
    S={g:Object.assign({risk:30,ally:60,home:50,prestige:50},r.start||{}),flags:{},ax:{},axLast:{},hist:[],node:r.first,qn:0};
    prologue(0);
  });
}
/* prologue in pages: the shared opening, the role, the dossier */
function prologue(p){
  VIEW=function(){ prologue(p); };
  var pages=[
    '<div class="stamp"><div class="day">'+T('10월 14일','14 October')+'</div><div class="meta"><b>1962'+T('년','')+'</b> · '+T('일요일 아침 · 쿠바 산크리스토발 상공','Sunday morning · over San Cristóbal, Cuba')+'</div></div>'+
        '<div class="paper prose">'+C.prologue.map(function(x){return '<p>'+tx(x)+'</p>';}).join('')+'</div>',
    '<h2 class="scene-title">'+esc(R.person)+'</h2><div class="paper prose"><p>'+tx(R.intro)+'</p></div>'
  ];
  (R.dossier||[]).forEach(function(x,k,a){ pages.push('<h2 class="scene-title">'+T('인물 파일','Dossier')+' <span class="dn">'+(k+1)+' / '+a.length+'</span></h2><div class="dossier one"><div class="dcard"><b>'+esc(x.h)+'</b><p>'+tx(x.t)+'</p></div></div>'); });
  var last=p>=pages.length-1;
  render(brand()+'<div class="pg">'+pages[p]+'</div>'+pager(p,pages.length,last?T('7월로 들어가기','Enter July'):T('다음','Next')));
  bindPager(function(){ prologue(p-1); }, function(){ if(last){ sfx('stamp'); scene(S.node);} else prologue(p+1); });
  top();
}
function pager(p,n,label){
  return '<div class="pager"><span class="dots">'+(n>1?Array.apply(null,Array(n)).map(function(_,i){return '<i'+(i===p?' class="on"':'')+'></i>';}).join(''):'')+'</span>'+
   '<span class="pbtns">'+(p>0?'<button class="btn small ghost" id="pv">'+T('이전','Back')+'</button>':'')+(label?'<button class="btn" id="pn">'+esc(label)+'</button>':'')+'</span></div>';
}
function bindPager(prev,next){
  var a=document.getElementById('pv'), b=document.getElementById('pn');
  if(a) a.onclick=function(){ sfx('click'); sfx('page'); prev(); };
  if(b) b.onclick=function(){ sfx('click'); setTimeout(function(){sfx('page');},60); next(); };
}
function hud(delta,n){
  var keys=['risk','ally','home','prestige'];
  var lab={risk:C.gauges.risk,ally:R.allyLabel||C.gauges.ally,home:C.gauges.home,prestige:C.gauges.prestige};
  var emb=(ROLES.filter(function(r){return r.id===R.id;})[0]||{}).emblem; return '<div class="hud" id="hud"><div class="stripe" aria-hidden="true"></div><div class="hud-top"><span class="who">'+(emb&&EMBLEM[emb]?'<span class="emb">'+EMBLEM[emb]+'</span>':'')+esc(R.person)+'</span><span class="qn">'+T('결정 ','Decision ')+(S.qn)+'</span></div><div class="gauges">'+
   keys.map(function(k){var v=S.g[k], d=delta&&delta[k]||0;
     return '<div class="g '+k+'"><div class="lab"><span>'+esc(lab[k])+'</span><span>'+v+(d?'<span class="d '+(d>0?'up':'dn')+'">'+(d>0?'+':'')+d+'</span>':'')+'</span></div><div class="bar"><div class="fill" style="width:'+v+'%"></div></div></div>';}).join('')+
   '</div>'+(n?timeline(n):'')+'</div>';
}
function portrait(key){
  if(!key) return '';
  var lab=IMGLAB()[key]||'', src=(R.images&&R.images[key])||(C.images&&C.images[key]);
  if(!src) return '';
  return '<figure class="portrait"><img src="'+esc(src.src)+'" alt="'+esc(lab)+'" loading="lazy"><figcaption>'+esc(lab)+(src.credit?'<br>'+esc(src.credit):'')+'</figcaption></figure>';
}
/* maps: base drawing from data/maps.json, marks and routes drawn per scene */
function mapBox(m){
  if(!m||!MAPS||!MAPS[m.key]) return '';
  var M=MAPS[m.key], P=M.places||{}, out='';
  (m.routes||[]).forEach(function(r){ var a=P[r[0]], b=P[r[1]]; if(!a||!b) return;
    var mx=(a[0]+b[0])/2, my=(a[1]+b[1])/2-Math.abs(b[0]-a[0])*.18-10;
    out+='<path class="mr" d="M'+a[0]+','+a[1]+' Q'+mx+','+my+' '+b[0]+','+b[1]+'" marker-end="url(#ah-'+m.key+')"/>'; });
  (m.marks||[]).forEach(function(k){ var p=P[k]; if(!p) return;
    var side=p[3]||'r', lx=p[0], ly=p[1]+9, anc='';
    if(side==='l'){ lx-=14; anc=' text-anchor="end"'; } else if(side==='r'){ lx+=14; }
    else if(side==='u'){ ly=p[1]-14; anc=' text-anchor="middle"'; } else if(side==='d'){ ly=p[1]+36; anc=' text-anchor="middle"'; }
    else if(side==='ul'){ lx-=10; ly=p[1]-12; anc=' text-anchor="end"'; } else if(side==='ur'){ lx+=10; ly=p[1]-12; }
    else if(side==='dl'){ lx-=10; ly=p[1]+34; anc=' text-anchor="end"'; } else if(side==='dr'){ lx+=10; ly=p[1]+34; }
    else if(side==='L'&&p[4]){ lx=p[0]+p[4][0]; ly=p[1]+p[4][1]; anc=p[4][0]<0?' text-anchor="end"':''; out+='<path class="mld" d="M'+p[0]+','+p[1]+' L'+(lx+(p[4][0]<0?4:-4))+','+(ly-5)+'"/>'; }   // 빽빽한 곳: 표지를 밖으로 빼고 선으로 잇는다
    out+='<circle class="mk" cx="'+p[0]+'" cy="'+p[1]+'" r="'+(M.r||9)+'"/><text class="ml" x="'+lx+'" y="'+ly+'"'+anc+'>'+esc(p[2])+'</text>'; });
  return '<figure class="map"><svg viewBox="'+M.vb+'" role="img" aria-label="'+esc(clean(m.caption)||T('지도','Map'))+'"><defs><marker id="ah-'+m.key+'" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="ah"/></marker></defs>'+M.base+out+'</svg>'+
   (M.legend&&M.legend.length?'<div class="maplegend">'+M.legend.map(function(l){return '<span><i class="lg" style="border-color:'+esc(l.color)+(l.thin?';border-width:1px':'')+'"></i>'+esc(EN&&l.en?l.en:l.label)+'</span>';}).join('')+'</div>':'')+
   (m.caption?'<figcaption>'+tx(m.caption)+'</figcaption>':'')+(M.credit?'<figcaption class="cr">'+esc(M.credit)+'</figcaption>':'')+'</figure>';
}

/* v1962: formal document block — telegram, radiogram, order, letter — with sender, addressee, copies, number, classification, date, subject, signature */
function docHtml(d){
  var kind=d.kind||T('전 보','TELEGRAM');
  var top='<div class="th"><span class="tt">'+esc(kind)+'</span>'+(d.no?'<span class="tf"><i>'+T('번호','No.')+'</i>'+esc(d.no)+'</span>':'<span></span>')+(d.cls?'<span class="tc">'+esc(d.cls)+'</span>':'<span></span>')+'</div>';
  var rows=[[T('발신','FROM'),d.from],[T('수신','TO'),d.to],[T('참조','COPY'),d.cc],[T('일시','DATE'),d.at],[T('제목','SUBJECT'),d.subject]].filter(function(r){return r[1];});
  var hd='<div class="td">'+rows.map(function(r){return '<div class="tr"><i>'+r[0]+'</i><span>'+esc(r[1])+'</span></div>';}).join('')+'</div>';
  return '<div class="telegram doc"><div class="tdoc">'+top+hd+'<div class="tx" id="tx"></div>'+(d.sign?'<div class="tsign">'+esc(d.sign)+'</div>':'')+'</div></div>';
}
/* telegrams arrived as printed tape pasted line by line onto the form: one strip per '/' segment */
function typeOut(el,text,instant){
  var lines=String(text).split(/\s*\/\s*/).filter(function(x){return x;});
  el.innerHTML=lines.map(function(){return '<span class="strip"></span>';}).join('');
  var st=el.querySelectorAll('.strip');
  if(reduce||instant){ lines.forEach(function(x,k){st[k].textContent=x;}); el.classList.add('done'); return; }
  sfx('wire');
  var k=0,i=0; (function step(){ if(k>=lines.length){ el.classList.add('done'); return; }
    i+=2; st[k].textContent=lines[k].slice(0,i); st[k].classList.add('on'); if(i%6===0) sfx('key');
    if(i>=lines[k].length){ k++; i=0; setTimeout(step,180); } else setTimeout(step,24); })();
}
function head(n){
  var hypo=n.hypo||/\(가상/.test(n.title||'');
  return '<div class="stamp"><div class="day">'+dayLabel(n.date)+'</div><div class="meta"><b>'+esc(yearOf(n.date)+T('년',''))+'</b>'+esc((n.time?' · '+n.time:'')+(n.place?' · '+n.place:''))+'</div>'+''+'</div>'+
   '<h2 class="scene-title">'+tx(n.title)+'</h2>'+(n.clock?'<div class="clock">'+esc(n.clock)+'</div>':'');
}
/* a scene is shown in pages: what happened meanwhile → the room and the voices → the decision */
function scene(id){
  var n=R.nodes[id]; if(!n){ app.textContent=T('장면을 찾을 수 없습니다: ','Scene not found: ')+id; return; }
  S.node=id; S.qn++; S.chosen=null; S.delta=null;
  S.order=n.choices.map(function(_,i){return i;}); for(var a=S.order.length-1;a>0;a--){ var b=Math.floor(Math.random()*(a+1)), t=S.order[a]; S.order[a]=S.order[b]; S.order[b]=t; }
  scenePage(n,scenePages(n),0);
}
/* 2026-10-23 (operator decision): a long room page is split so that the voices get a page of their own; short scenes stay on one page */
function splitAt(){ return EN?1000:450; }  /* Latin text runs about twice the characters of Korean for the same scene */
function scenePages(n){
  var pages=[];
  if(n.event||n.telegram||n.map) pages.push('brief');
  var v=n.voices||[], len=clean(n.scene||'').length+v.reduce(function(s,x){return s+clean(x.text||'').length;},0);
  if(v.length&&(len>splitAt()||v.length>=3)){ pages.push('room0'); pages.push('voices'); } else pages.push('room');
  pages.push('decide');
  return pages;
}
function voicesHtml(n){ return '<div class="voices">'+(n.voices||[]).map(function(v){var me=/당신|^You\b/.test(v.who); return '<div class="voice'+(me?' me':'')+'"><div class="w">'+esc(v.who)+(v.kind==='quote'?'<i class="q">'+T('기록','On record')+'</i>':'<i>'+T('요지','In substance')+'</i>')+'</div><div class="t">'+(v.kind==='quote'?'“'+tx(v.text)+'”':tx(v.text))+'</div></div>';}).join('')+'</div>'; }
function scenePage(n,pages,p){
  VIEW=function(){ var m=R.nodes[S.node], pg=scenePages(m); scenePage(m,pg,Math.min(p,pg.length-1)); };  /* the page count can differ by language */
  var kind=pages[p], body='';
  if(kind==='brief'){
    body=(n.event?'<div class="event"><span class="lab">'+T('그사이','Meanwhile')+'</span>'+tx(n.event)+'</div>':'')+
      (n.telegram?docHtml(n.telegram):'')+
      mapBox(n.map);
  } else if(kind==='room'){
    body='<div class="paper wm">'+(function(){var e=(ROLES.filter(function(r){return r.id===R.id;})[0]||{}).emblem;return e&&EMBLEM[e]?'<span class="wmk" aria-hidden="true">'+EMBLEM[e]+'</span>':'';})()+portrait(n.img)+'<p class="prose" style="margin:0 0 14px">'+tx(n.scene)+'</p>'+voicesHtml(n)+'</div>';
  } else if(kind==='room0'){
    body='<div class="paper wm">'+(function(){var e=(ROLES.filter(function(r){return r.id===R.id;})[0]||{}).emblem;return e&&EMBLEM[e]?'<span class="wmk" aria-hidden="true">'+EMBLEM[e]+'</span>':'';})()+portrait(n.img)+'<p class="prose" style="margin:0">'+tx(n.scene)+'</p></div>';
  } else if(kind==='voices'){
    var lead=clean(n.scene||'').split(/(?<=[.다요!?])\s+/)[0];
    body='<div class="paper"><p class="vlead">'+esc(lead)+'</p><h3 class="vh">'+T('방 안의 목소리','Voices in the room')+'</h3>'+voicesHtml(n)+'</div>';
  } else {
    body=(n.pressure?'<div class="pressure"><span class="lab">'+T('속사정 · ','Behind the scenes · ')+esc(n.pressure.title)+'</span><p>'+tx(n.pressure.text)+'</p>'+(n.pressure.fx?'<p class="pfx">'+T('이 압력은 일부 선택의 결과에 영향을 줍니다.','This pressure changes the outcome of some choices.')+'</p>':'')+'</div>':'')+
      '<p class="ask">'+T('당신의 결정은?','Your decision?')+'</p><div class="choices">'+(S.order||n.choices.map(function(_,i){return i;})).map(function(i,pos){var c=n.choices[i]; return '<button class="choice" data-i="'+i+'" data-k="'+String.fromCharCode(65+pos)+'">'+tx(c.text)+(c.why?'<span class="why">'+tx(c.why)+'</span>':'')+'</button>';}).join('')+'</div><div id="res"></div>';
  }
  var last=p===pages.length-1;
  var done=last&&S.chosen!=null;
  render(brand()+hud(done?S.delta:null,n)+head(n)+'<div class="pg">'+body+'</div>'+(last?pager(p,pages.length,''):pager(p,pages.length,T('다음','Next'))));
  top();
  if(kind==='brief'&&n.telegram) typeOut(document.getElementById('tx'),clean(n.telegram.text||''),SWITCHING);
  bindPager(function(){ scenePage(n,pages,p-1); }, function(){ scenePage(n,pages,p+1); });
  if(last) app.querySelectorAll('.choice').forEach(function(b){b.onclick=function(){choose(n,+b.dataset.i);};});
  if(done){ markPick(S.chosen); showResult(n,n.choices[S.chosen],S.delta,true); }  /* a choice already made on this scene (redrawn after a language switch) */
}
function apply(c,n){
  var d={}, fx=Object.assign({},c.fx||{});
  var pf=n&&n.pressure&&n.pressure.fx&&n.pressure.fx[c.key]; if(pf) Object.keys(pf).forEach(function(k){fx[k]=(fx[k]||0)+pf[k];});
  [].concat(c.fxIf||[]).forEach(function(r){ if(has(r.flag)) Object.keys(r.fx||{}).forEach(function(k){fx[k]=(fx[k]||0)+r.fx[k];}); });
  ['risk','ally','home','prestige'].forEach(function(k){var v=fx[k]||0; var nv=Math.max(0,Math.min(100,S.g[k]+v)); d[k]=nv-S.g[k]; S.g[k]=nv;});
  (c.set||[]).forEach(function(f){S.flags[f]=true;});
  (c.axes||[]).forEach(function(a){S.ax[a]=(S.ax[a]||0)+1; S.axLast[pairOf(a)]=a;});
  return d;
}
function pairOf(a){return {P:0,R:0,H:1,D:1,S:2,A:2,F:3,L:3}[a];}
/* no same-as-history label during play: the July Crisis is not a quiz, and the comparison waits for the ending */
function histEntry(n,c){
  var rc=n.choices.filter(function(x){return x.real===true;})[0]||n.choices.filter(function(x){return x.real==='partial';})[0]||{};
  return {id:n.id||S.node,date:n.date,title:clean(n.title),pick:c.key,text:clean(c.text),real:c.real,realKey:rc.key,realText:clean(rc.text),realNote:c.realNote?clean(c.realNote):'',note:n.note&&n.note.text?clean(n.note.text):''};
}
function markPick(i){ app.querySelectorAll('.choice').forEach(function(b){b.disabled=true; if(+b.dataset.i===i) b.classList.add('picked');}); }
function choose(n,i){
  var c=n.choices[i];
  markPick(i);
  var d=apply(c,n);
  S.hist.push(histEntry(n,c)); S.chosen=i; S.delta=d;
  document.getElementById('hud').outerHTML=hud(d,n);
  var nx0=resolve(c.next), heavy=(d.risk||0)>=15||nx0==='END:E';
  sfx(heavy?'drum':'stamp'); if(d.risk) setTimeout(function(){ sfx(d.risk>0?'rise':'fall'); }, heavy?900:350);
  showResult(n,c,d,false);
}
function showResult(n,c,d,quiet){
  var nx0=resolve(c.next), res=document.getElementById('res');
  res.innerHTML='<div class="result">'+
    '<p class="after">'+tx(c.after||'')+'</p>'+
    '<div class="next"><button class="btn" id="nx">'+(isEnd(nx0)?T('결말 보기','See the ending'):T('다음 장면','Next scene'))+'</button></div></div>';
  if(!quiet) res.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});
  document.getElementById('nx').onclick=function(){ sfx('click'); setTimeout(function(){sfx('page');},60); var nx=resolve(c.next); if(isEnd(nx)) ending(nx); else scene(nx); };
}
function has(f){ return Array.isArray(f)? f.some(function(x){return S.flags[x];}) : !!S.flags[f]; }
function resolve(nx){
  if(nx==null) return 'END';
  if(typeof nx==='string') return nx;
  if(Array.isArray(nx)){ for(var i=0;i<nx.length;i++){ var r=nx[i]; if(test(r)) return resolve(r.then); } return 'END'; }
  return test(nx)?resolve(nx.then):resolve(nx['else']);
}
function test(r){
  var ok=true;
  if(r.ifAll) ok=ok&&r.ifAll.every(function(x){return S.flags[x];});
  if(r['if']!==undefined) ok=ok&&has(r['if']);
  if(r.ifNot!==undefined) ok=ok&&!has(r.ifNot);
  if(r.ifNode!==undefined) ok=ok&&([].concat(r.ifNode).indexOf(S.node)>=0);
  if(r.ifRiskBelow!==undefined) ok=ok&&S.g.risk<r.ifRiskBelow;
  if(r.ifRiskAtLeast!==undefined) ok=ok&&S.g.risk>=r.ifRiskAtLeast;
  if(r.ifAllyBelow!==undefined) ok=ok&&S.g.ally<r.ifAllyBelow;
  if(r.any) ok=ok&&r.any.some(test);
  return ok;
}
function isEnd(nx){ return typeof nx==='string' && nx.indexOf('END')===0; }
function endingKey(nx){
  if(nx.indexOf('END:')===0) return nx.slice(4);
  var rules=R.endingLogic||[]; for(var i=0;i<rules.length;i++){ if(test(rules[i])) return rules[i].then; }
  return 'E';
}
function typeCode(){
  var pairs=[['P','R'],['H','D'],['S','A'],['F','L']];
  return pairs.map(function(p,i){var a=S.ax[p[0]]||0,b=S.ax[p[1]]||0; if(a>b) return p[0]; if(b>a) return p[1]; return S.axLast[i]||p[0];}).join('');
}
function flip(code,idx){ var m={P:'R',R:'P',H:'D',D:'H',S:'A',A:'S',F:'L',L:'F'}; return code.split('').map(function(ch,i){return (idx===undefined||idx===i)?m[ch]:ch;}).join(''); }
function typeOf(code){ var list=TYPES||C.types; return list.filter(function(t){return t.code===code;})[0]||C.types.filter(function(t){return t.code===code;})[0]; }
function axisBars(){
  var pairs=[['P','R'],['H','D'],['S','A'],['F','L']];
  return '<div class="axbars">'+pairs.map(function(p){var a=S.ax[p[0]]||0,b=S.ax[p[1]]||0,t=a+b||1,w=Math.round(a*100/t);
    return '<div class="axb"><span>'+esc(C.axes[p[0]])+' '+a+'</span><div class="axt"><div style="width:'+w+'%"></div></div><span>'+b+' '+esc(C.axes[p[1]])+'</span></div>';}).join('')+'</div>';
}
/* the ending is a small dossier of pages */
function ending(nx,p0,quiet){
  if(!quiet) sfx('end');
  var k=endingKey(nx), E=C.endings[k]||{title:k,text:''};
  if(!quiet) markDone(R.id,k);
  var ep=(R.epilogues||{})[k]||''; (R.epilogueAdd||[]).forEach(function(a){ if([].concat(a.ending).indexOf(k)>=0&&test(a)) ep+=(ep?' ':'')+a.text; }); if(S.g.prestige<30&&'ABFG'.indexOf(k)>=0) ep+=(ep?' ':'')+T('국내에서는 굴욕 외교라는 비판이 거셌습니다.','At home, critics attacked the settlement as a humiliating climb-down.');
  var code=typeCode(), t=typeOf(code)||{}, mate=typeOf(flip(code,3))||{}, foe=typeOf(flip(code))||{};
  var asked=S.hist.length, same=S.hist.filter(function(x){return x.real===true;}).length;
  var lec=(C.lectures[k]||[]).concat(C.lectures['*']||[]);
  var F=t.figure||null;
  var pages=[
   {tab:T('결말','Ending'),h:'<div class="end-k"><span>'+T('결말 ','Ending ')+esc(k)+'</span><span>'+esc(C.ep)+'</span></div><h2 class="end-t">'+esc(E.title)+'</h2>'+
     '<div class="end-hypo">'+(E.hypo?T('당신이 만든 1962년 · 가상의 역사','Your 1962 · an alternate history'):T('실제로 일어난 역사','What really happened'))+'</div>'+
     '<div class="paper prose"><p>'+tx(E.text)+'</p>'+(ep?'<p>'+tx(ep)+'</p>':'')+'</div>'},
   {tab:T('전략가 유형','Strategist type'),h:'<div class="typecard"><div class="k">STRATEGIST TYPE</div><div class="n">'+esc(t.name||code)+'</div><div class="l">'+esc(t.line||'')+'</div>'+
     '<div class="ax">'+code.split('').map(function(a){return '<span>'+esc(C.axes[a])+'</span>';}).join('')+'</div>'+axisBars()+
     (t.traits?'<p class="tp">'+esc(t.traits)+'</p>':'')+
     (t.you?'<p class="tp you">'+esc(t.you)+'</p>':'')+
     '<div class="pair">'+T('찰떡 궁합 ','Best match: ')+esc(mate.name||'')+T(' · 상극 ',' · Opposite: ')+esc(foe.name||'')+T(' · 실제 역사와 같은 선택 ',' · Same as history: ')+same+' / '+asked+'</div>'+
     '<div class="share"><button class="btn small" id="card">'+T('결과 카드 만들기','Make result card')+'</button><button class="btn small ghost" id="copy">'+T('게임 주소 복사','Copy game link')+'</button></div><div id="cardbox" class="cardbox" hidden></div></div>'+
     (F?'<div class="sec"><h3>'+esc(F.name)+' ('+esc(F.years)+', '+esc(F.country)+')</h3><p>'+esc(F.life)+'</p><p>'+esc(F.story)+'</p></div>':'<p class="tp">'+esc(t.story||'')+'</p>')+
     (t.kin&&t.kin.length?'<div class="sec"><h3>'+T('당신과 닮은 또 다른 인물','Others who decided like you')+'</h3>'+t.kin.map(function(q){return '<div class="kin"><b>'+esc(q.name)+'</b> <span>'+esc(q.years)+' · '+esc(q.country)+'</span><p>'+esc(q.why)+'</p></div>';}).join('')+'</div>':'')+
     (t.caution?'<div class="note"><b>'+T('이 유형이 놓치기 쉬운 것','What this type tends to miss')+'</b>'+esc(t.caution)+'</div>':'')+
     '<p class="foot">'+esc(C.typeNote)+'</p>'},
   {tab:T('선택 비교','Your choices'),h:'<div class="sec"><h3>'+T('당신의 선택과 실제 역사','Your choices against history')+'</h3><table class="cmp">'+S.hist.map(function(x){
     var sm=x.real===true||(x.real==='partial'&&x.realKey===x.pick);
     return '<tr><td>'+esc(dayLabel(x.date))+'</td><td><b>'+esc(x.title)+'</b><br>'+(sm?'<span class="ok">● '+T('실제 역사와 같은 선택','Same as history')+'</span> '+esc(x.text):T('당신: ','You: ')+esc(x.text)+(x.realText?'<br><span class="rl">'+T('실제: ','History: ')+esc(x.realText)+'</span>':''))+(x.realNote?'<br><span class="rn">'+esc(x.realNote)+'</span>':'')+'</td></tr>';}).join('')+'</table></div>'},
   {tab:T('배경','Background'),h:(R.movers?'<div class="sec"><h3>'+T('이 인물을 움직인 것들','What drove this figure')+'</h3><p>'+tx(R.movers.intro)+'</p><ul class="plain">'+R.movers.views.map(function(v){return '<li>'+tx(v)+'</li>';}).join('')+'</ul>'+(R.movers.note?'<p class="foot">'+tx(R.movers.note)+'</p>':'')+'</div>':'')+
     '<div class="sec"><h3>'+T('배경 읽기','Background reading')+'</h3>'+(C.background||[]).map(function(b){return '<details class="bg"><summary>'+esc(b.q)+'</summary>'+b.a.map(function(q){return '<p>'+esc(q)+'</p>';}).join('')+'</details>';}).join('')+'</div>'},
   {tab:T('실제 역사','History'),h:'<div class="sec"><h3>'+T('실제로 일어난 일','What actually happened')+'</h3><ul class="plain">'+C.history.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul></div>'+
     (S.hist.some(function(x){return x.note;})?'<div class="sec"><h3>'+T('당신이 지난 장면의 역사 노트','History notes of the scenes you passed')+'</h3><ul class="plain">'+S.hist.filter(function(x){return x.note;}).map(function(x){return '<li><b>'+esc(dayLabel(x.date))+' · '+esc(x.title)+'</b><br>'+tx(x.note)+'</li>';}).join('')+'</ul></div>':'')+
     '<div class="sec"><h3>'+T('한반도와 동아시아','Korea and East Asia')+'</h3><ul class="plain">'+C.eastasia.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul></div>'+
     '<div class="sec"><h3>'+T('함께 읽을 강의','Related lectures')+'</h3><ul class="plain">'+lec.map(function(q){return '<li><a href="'+SITE+'/academy/ir101/'+q+'/" target="_blank" rel="noopener">'+esc(C.lectureTitles[q])+'</a></li>';}).join('')+'</ul></div>'+
     '<div class="share"><button class="btn" id="again">'+T('다른 나라로 다시 하기','Play another power')+'</button></div>'+more()+rights()}
  ];
  function show(p){
    VIEW=function(){ ending(nx,p,true); };
    render(brand()+'<div class="tabs" role="tablist">'+pages.map(function(x,i){return '<button role="tab" class="tab'+(i===p?' on':'')+'" data-p="'+i+'" aria-selected="'+(i===p)+'">'+esc(x.tab)+'</button>';}).join('')+'</div>'+
      '<div class="pg">'+pages[p].h+'</div>'+pager(p,pages.length,p<pages.length-1?T('다음','Next'):''));
    app.querySelectorAll('.tab').forEach(function(b){ b.onclick=function(){ sfx('page'); show(+b.dataset.p); }; });
    bindPager(function(){ show(p-1); }, function(){ show(p+1); });
    var ag=document.getElementById('again'); if(ag) ag.onclick=function(){ sfx('click'); roles(); };
    var cp=document.getElementById('copy'); if(cp) cp.onclick=function(){ var b=this, u=location.href.split('#')[0]; try{navigator.clipboard.writeText(u).then(function(){b.textContent=T('복사했습니다','Copied');},function(){b.textContent=u;});}catch(e){b.textContent=u;} };
    var cd=document.getElementById('card'); if(cd) cd.onclick=function(){ sfx('stamp'); shareCard(t,E,k,same,asked); };
    top();
  }
  show(p0||0);
}
/* shrink a canvas font until the text fits; result left in x._t */
function fit(x,s,font,px,w){ s=String(s||''); while(px>16){ x.font=font.replace('%',px); if(x.measureText(s).width<=w) break; px-=2; } x._t=s; }
/* links back into clisa.ai open in a new tab so the game (and its music) keeps running; from the ending screen (text needs operator approval before going public) */
function more(){
  var L=EN?[['/en/brief/','Briefings','Recent events linked to our assessments and forecasts'],['/en/forecast/','Forecasts','Probability forecasts and how they turned out'],['/en/academy/ir101/','Intro to IR','The ideas behind the crisis, lecture by lecture'],['/en/subscribe/','Subscribe','New briefings and features in your feed reader']]
    :[['/brief/','정세 브리핑','최근 사건을 클리사의 판단·전망과 연결해 정리'],['/forecast/','전망과 검증','사안별 확률 전망과 그 결과'],['/academy/ir101/','국제정치 입문','위기를 움직인 생각을 강의로'],['/subscribe/','새 글 알림 받기','새 브리핑과 특집을 구독 앱으로']];
  return '<div class="sec more"><h3>'+T('1962년의 질문은 현재도 이어집니다','The questions of 1962 are still open')+'</h3><div class="morelinks">'+L.map(function(a){return '<a href="'+SITE.replace(/\/en$/,'')+a[0]+'" target="_blank" rel="noopener"><b>'+esc(a[1])+'</b><span>'+esc(a[2])+'</span></a>';}).join('')+'</div></div>';
}
/* copyright and contact, shown on the title screen and at the end of the ending pages */
function rights(){
  return '<footer class="rights"><p>'+T('© 2026 클리사 지오폴리틱스. 이 게임의 글, 그림, 지도, 음악, 프로그램의 저작권은 클리사 지오폴리틱스에 있습니다. 음악은 클리사가 직접 만든 곡입니다. 지도의 국경 자료(CShapes 2.0)와 바탕 자료(Natural Earth), 인용한 사료는 공개 자료입니다.','© 2026 Clisa Geopolitics. The text, artwork, maps, music and software of this game are the copyright of Clisa Geopolitics. The music was produced by Clisa. The border data (CShapes 2.0), the base map data (Natural Earth) and the quoted historical documents are open sources.')+'</p>'+
    '<p>'+T('문의','Contact')+' <a href="mailto:clisageo@clisa.ai">clisageo@clisa.ai</a> · <a href="'+SITE+'/" target="_blank" rel="noopener">clisa.ai'+(EN?'/en':'')+'</a></p></footer>';
}
function shareCard(t,E,k,same,asked){
  var W=1080,H=1350,cv=document.createElement('canvas'); cv.width=W; cv.height=H; var x=cv.getContext('2d');
  /* 1962: 짙은 남색 바탕(1914의 회색과 구분), 흰 글씨 */
  var ink='#FFFFFF',red='#FF5A5A',sans='"Pretendard Variable","Noto Sans KR",sans-serif', th=THEME[R.id]||{stripe:[ink]};
  x.fillStyle='#0B1F3A'; x.fillRect(0,0,W,H);
  th.stripe.forEach(function(c,i){ x.fillStyle=c; x.fillRect(0,i*18,W,18); });
  x.fillStyle=ink; x.fillRect(70,90,W-140,4); x.fillRect(70,102,W-140,2);
  x.textAlign='left'; x.font='500 28px "IBM Plex Mono",monospace'; x.fillText('CLISA GAMES',70,155); x.textAlign='right'; x.fillText(C.ep,W-70,155);
  x.textAlign='left'; x.font='400 52px "Bebas Neue",sans-serif'; x.fillText('W O R L D   O F',70,250);
  x.font='400 190px "Bebas Neue",sans-serif'; x.fillText('DECISION',66,420);
  x.fillStyle=ink; x.fillRect(70,460,W-140,2);
  x.font='500 30px '+sans; fit(x,R.person+T(' · 당신의 전략가 유형',' · your strategist type'),'500 %px '+sans,30,W-140); x.fillText(x._t,70,540);
  fit(x,t.name||'','400 %px '+DISP,120,W-140); x.fillText(x._t,66,690);
  fit(x,t.line||'','600 %px '+sans,40,W-140); x.fillStyle='#C9D3E0'; x.fillText(x._t,70,760);
  x.fillStyle=ink; x.fillRect(70,820,W-140,2);
  fit(x,T('결말 ','Ending ')+k+' · '+E.title,'400 %px '+DISP,54,W-140); x.fillText(x._t,70,910);
  x.save(); x.translate(70,1000); x.rotate(-0.04); x.strokeStyle=red; x.lineWidth=5; x.font='800 40px '+sans; var st=T('실제 역사와 같은 선택 ','Same as history ')+same+'/'+asked, sw=Math.max(560,x.measureText(st).width+48); x.strokeRect(0,0,sw,86); x.fillStyle=red; x.fillText(st,24,58); x.restore();
  x.fillStyle=ink; x.fillRect(70,H-150,W-140,2); x.font='500 30px "IBM Plex Mono",monospace'; x.fillText('clisa.ai'+(EN?'/en':'')+'/play/1962',70,H-100);
  var url=cv.toDataURL('image/png'), box=document.getElementById('cardbox'), fname='world-of-decision-1962.png';
  /* 2026-10-20: card copy, save and share (copy falls back to save where the browser blocks image copying) */
  var blobP=new Promise(function(res){ if(cv.toBlob) cv.toBlob(function(b){res(b);},'image/png'); else fetch(url).then(function(r){return r.blob();}).then(res); });
  var canShare=false; try{ canShare=!!(navigator.canShare&&navigator.canShare({files:[new File([new Blob([''],{type:'image/png'})],fname,{type:'image/png'})]})); }catch(e){}
  box.innerHTML='<img src="'+url+'" alt="'+T('결과 카드','Result card')+'"><div class="share" style="margin-top:0">'+
    '<button class="btn small" id="cardcopy">'+T('카드 이미지 복사','Copy card image')+'</button>'+
    '<a class="btn small ghost" id="cardsave" style="text-decoration:none" href="'+url+'" download="'+fname+'">'+T('이미지 저장','Save image')+'</a>'+
    (canShare?'<button class="btn small ghost" id="cardshare">'+T('공유','Share')+'</button>':'')+
    '<button class="btn small ghost" id="cardclose">'+T('닫기','Close')+'</button></div>'+
    '<p class="foot">'+T('이미지를 길게 누르거나 오른쪽 버튼을 눌러 저장할 수도 있습니다.','You can also long-press or right-click the image to save it.')+'</p>';
  box.hidden=false; document.getElementById('cardclose').onclick=function(){box.hidden=true;};
  var save=function(){ var a=document.createElement('a'); a.href=url; a.download=fname; document.body.appendChild(a); a.click(); a.remove(); };
  document.getElementById('cardcopy').onclick=function(){ var b=this, fail=function(){ save(); b.textContent=T('복사가 막혀 이미지로 저장했습니다','Copy blocked; image saved instead'); };
    try{ if(!(navigator.clipboard&&navigator.clipboard.write&&window.ClipboardItem)) return fail();
      navigator.clipboard.write([new ClipboardItem({'image/png':blobP})]).then(function(){ b.textContent=T('복사했습니다','Copied'); }, fail); }catch(e){ fail(); } };
  var sh=document.getElementById('cardshare'); if(sh) sh.onclick=function(){ blobP.then(function(bl){ return navigator.share({files:[new File([bl],fname,{type:'image/png'})], title:'WORLD OF DECISION · 1962', text:T('나의 전략가 유형: ','My strategist type: ')+(t.name||''), url:location.href.split('#')[0]}); }).catch(function(){}); };
}
Promise.all([get(BASE+'data/common.'+LANG+'.json'),opt(BASE+'data/maps'+(EN?'.en':'')+'.json'),opt(BASE+'data/types.'+LANG+'.json')]).then(function(r){
  C=r[0]; MAPS=r[1]; TYPES=r[2];
  var h=location.hash.slice(1); if(h&&ROLES.some(function(x){return x.id===h;})) start(h); else title();
}).catch(function(e){app.textContent=T('자료를 불러오지 못했습니다. ','Could not load the game data. ')+e.message;});
})();
