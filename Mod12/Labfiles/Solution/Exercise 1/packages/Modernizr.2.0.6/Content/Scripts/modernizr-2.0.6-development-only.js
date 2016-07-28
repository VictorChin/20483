/*!
* Note:  While Microsoft is not the author of this script file, Microsoft
* grants you the right to use this file for the sole purpose of either: 
* (i) interacting through your browser with the Microsoft website, subject 
* to the website's terms of use; or (ii) using the files as included with a
* Microsoft product subject to the Microsoft Software License Terms for that
* Microsoft product. Microsoft reserves all other rights to the files not 
* expressly granted by Microsoft, whether by implication, estoppel or
* otherwise. The notices and licenses below are for informational purposes 
* only.
*
* Provided by Informational Purposes Only
* MIT License
*
* Permission is hereby granted, free of charge, to any person obtaining a
* copy of this software and associated documentation files (the "Software"),
* to deal in the Software without restriction, including without limitation
* the rights to use, copy, modify, merge, publish, distribute, sublicense, 
* and/or sell copies of the Software, and to permit persons to whom the 
* Software is furnished to do so, subject to the following conditions:
*
* The copyright notice and this permission notice shall be included in all 
* copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS 
* OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
* FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
* DEALINGS IN THE SOFTWARE.
*
* Modernizr v2.0.6
* http://www.modernizr.com
*
* Copyright (c) 2009-2011 Faruk Ates, Paul Irish, Alex Sexton
*/

/*
 * Modernizr tests which native CSS3 and HTML5 features are available in
 * the current UA and makes the results available to you in two ways:
 * as properties on a global Modernizr object, and as classes on the
 * <html> element. This information allows you to progressively enhance
 * your pages with a granular level of control over the experience.
 *
 * Modernizr has an optional (not included) conditional resource loader
 * called Modernizr.load(), based on Yepnope.js (yepnopejs.com).
 * To get a build that includes Modernizr.load(), as well as choosing
 * which tests to include, go to www.modernizr.com/download/
 *
 * Authors        Faruk Ates, Paul Irish, Alex Sexton, 
 * Contributors   Ryan Seddon, Ben Alman
 */

window.Modernizr = (function( window, document, undefined ) {

    var version = '2.0.6',

    Modernizr = {},
    
    // option for enabling the HTML classes to be added
    enableClasses = true,

    docElement = document.documentElement,
    docHead = document.head || document.getElementsByTagName('head')[0],

    /**
     * Create our "modernizr" element that we do most feature tests on.
     */
    mod = 'modernizr',
    modElem = document.createElement(mod),
    mStyle = modElem.style,

    /**
     * Create the input element for various Web Forms feature tests.
     */
    inputElem = document.createElement('input'),

    smile = ':)',

    toString = Object.prototype.toString,

    // List of property values to set for css tests. See ticket #21
    prefixes = ' -webkit- -moz- -o- -ms- -khtml- '.split(' '),

    // Following spec is to expose vendor-specific style properties as:
    //   elem.style.WebkitBorderRadius
    // and the following would be incorrect:
    //   elem.style.webkitBorderRadius

    // Webkit ghosts their properties in lowercase but Opera & Moz do not.
    // Microsoft foregoes prefixes entirely <= IE8, but appears to
    //   use a lowercase `ms` instead of the correct `Ms` in IE9

    // More here: http://github.com/Modernizr/Modernizr/issues/issue/21
    domPrefixes = 'Webkit Moz O ms Khtml'.split(' '),

    ns = {'svg': 'http://www.w3.org/2000/svg'},

    tests = {},
    inputs = {},
    attrs = {},

    classes = [],

    featureName, // used in testing loop


    // Inject element with style element and some CSS rules
    injectElementWithStyles = function( rule, callback, nodes, testnames ) {

      var style, ret, node,
          div = document.createElement('div');

      if ( parseInt(nodes, 10) ) {
          // In order not to give false positives we create a node for each test
          // This also allows the method to scale for unspecified uses
          while ( nodes-- ) {
              node = document.createElement('div');
              node.id = testnames ? testnames[nodes] : mod + (nodes + 1);
              div.appendChild(node);
          }
      }

      // <style> elements in IE6-9 are considered 'NoScope' elements and therefore will be removed
      // when injected with innerHTML. To get around this you need to prepend the 'NoScope' element
      // with a 'scoped' element, in our case the soft-hyphen entity as it won't mess with our measurements.
      // http://msdn.microsoft.com/en-us/library/ms533897%28VS.85%29.aspx
      style = ['&shy;', '<style>', rule, '</style>'].join('');
      div.id = mod;
      div.innerHTML += style;
      docElement.appendChild(div);

      ret = callback(div, rule);
      div.parentNode.removeChild(div);

      return !!ret;

    },


    // adapted from matchMedia polyfill
    // by Scott Jehl and Paul Irish
    // gist.github.com/786768
    /*
     * The following excerpt, obtained from the above-cited github project, is provided for information purposes only.
     *
     * matchMedia() polyfill - test whether a CSS media type or media query applies
     * primary author: Scott Jehl
     * Copyright (c) 2010 Filament Group, Inc
     * MIT license
     * adapted by Paul Irish to use the matchMedia API
     * http://dev.w3.org/csswg/cssom-view/#dom-window-matchmedia
     * which webkit now supports: http://trac.webkit.org/changeset/72552
     *
     * Doesn't implement media.type as there's no way for crossbrowser property
     * getters. instead of media.type == 'tv' just use media.matchMedium('tv')
     */
    testMediaQuery = function( mq ) {

      if ( window.matchMedia ) {
        return matchMedia(mq).matches;
      }

      var bool;

      injectElementWithStyles('@media ' + mq + ' { #' + mod + ' { position: absolute; } }', function( node ) {
        bool = (window.getComputedStyle ?
                  getComputedStyle(node, null) :
                  node.currentStyle)['position'] == 'absolute';
      });

      return bool;

     },


    /**
      * isEventSupported determines if a given element supports the given event
      * function from http://yura.thinkweb2.com/isEventSupported/
      */
    isEventSupported = (function() {

      var TAGNAMES = {
        'select': 'input', 'change': 'input',
        'submit': 'form', 'reset': 'form',
        'error': 'img', 'load': 'img', 'abort': 'img'
      };

      function isEventSupported( eventName, element ) {

        element = element || document.createElement(TAGNAMES[eventName] || 'div');
        eventName = 'on' + eventName;

        // When using `setAttribute`, IE skips "unload", WebKit skips "unload" and "resize", whereas `in` "catches" those
        var isSupported = eventName in element;

        if ( !isSupported ) {
          // If it has no `setAttribute` (i.e. doesn't implement Node interface), try generic element
          if ( !element.setAttribute ) {
            element = document.createElement('div');
          }
          if ( element.setAttribute && element.removeAttribute ) {
            element.setAttribute(eventName, '');
            isSupported = is(element[eventName], 'function');

            // If property was created, "remove it" (by setting value to `undefined`)
            if ( !is(element[eventName], undefined) ) {
              element[eventName] = undefined;
            }
            element.removeAttribute(eventName);
          }
        }

        element = null;
        return isSupported;
      }
      return isEventSupported;
    })();

    // hasOwnProperty shim by kangax needed for Safari 2.0 support
    var _hasOwnProperty = ({}).hasOwnProperty, hasOwnProperty;
    if ( !is(_hasOwnProperty, undefined) && !is(_hasOwnProperty.call, undefined) ) {
      hasOwnProperty = function (object, property) {
        return _hasOwnProperty.call(object, property);
      };
    }
    else {
      hasOwnProperty = function (object, property) { /* yes, this can give false positives/negatives, but most of the time we don't care about those */
        return ((property in object) && is(object.constructor.prototype[property], undefined));
      };
    }

    /**
     * setCss applies given styles to the Modernizr DOM node.
     */
    function setCss( str ) {
        mStyle.cssText = str;
    }

    /**
     * setCssAll extrapolates all vendor-specific css strings.
     */
    function setCssAll( str1, str2 ) {
        return setCss(prefixes.join(str1 + ';') + ( str2 || '' ));
    }

    /**
     * is returns a boolean for if typeof obj is exactly type.
     */
    function is( obj, type ) {
        return typeof obj === type;
    }

    /**
     * contains returns a boolean for if substr is found within str.
     */
    function contains( str, substr ) {
        return !!~('' + str).indexOf(substr);
    }

    /**
     * testProps is a generic CSS / DOM property test; if a browser supports
     *   a certain property, it won't return undefined for it.
     *   A supported CSS property returns empty string when its not yet set.
     */
    function testProps( props, prefixed ) {
        for ( var i in props ) {
            if ( mStyle[ props[i] ] !== undefined ) {
                return prefixed == 'pfx' ? props[i] : true;
            }
        }
        return false;
    }

    /**
     * testPropsAll tests a list of DOM properties we want to check against.
     *   We specify literally ALL possible (known and/or likely) properties on
     *   the element including the non-vendor prefixed one, for forward-
     *   compatibility.
     */
    function testPropsAll( prop, prefixed ) {

        var ucProp  = prop.charAt(0).toUpperCase() + prop.substr(1),
            props   = (prop + ' ' + domPrefixes.join(ucProp + ' ') + ucProp).split(' ');

        return testProps(props, prefixed);
    }

    /**
     * testBundle tests a list of CSS features that require element and style injection.
     *   By bundling them together we can reduce the need to touch the DOM multiple times.
     */
    /*>>testBundle*/
    var testBundle = (function( styles, tests ) {
        var style = styles.join(''),
            len = tests.length;

        injectElementWithStyles(style, function( node, rule ) {
            var style = document.styleSheets[document.styleSheets.length - 1],
                // IE8 will bork if you create a custom build that excludes both fontface and generatedcontent tests.
                // So we check for cssRules and that there is a rule available
                // More here: https://github.com/Modernizr/Modernizr/issues/288 & https://github.com/Modernizr/Modernizr/issues/293
                cssText = style.cssRules && style.cssRules[0] ? style.cssRules[0].cssText : style.cssText || "",
                children = node.childNodes, hash = {};

            while ( len-- ) {
                hash[children[len].id] = children[len];
            }

            /*>>touch*/           Modernizr['touch'] = ('ontouchstart' in window) || hash['touch'].offsetTop === 9; /*>>touch*/
            /*>>csstransforms3d*/ Modernizr['csstransforms3d'] = hash['csstransforms3d'].offsetLeft === 9;          /*>>csstransforms3d*/
            /*>>generatedcontent*/Modernizr['generatedcontent'] = hash['generatedcontent'].offsetHeight >= 1;       /*>>generatedcontent*/
            /*>>fontface*/        Modernizr['fontface'] = /src/i.test(cssText) &&
                                                                  cssText.indexOf(rule.split(' ')[0]) === 0;        /*>>fontface*/
        }, len, tests);

    })([
        // Pass in styles to be injected into document
        /*>>fontface*/        '@font-face {font-family:"font";src:url("https://")}'         /*>>fontface*/
        
        /*>>touch*/           ,['@media (',prefixes.join('touch-enabled),('),mod,')',
                                '{#touch{top:9px;position:absolute}}'].join('')           /*>>touch*/
                                
        /*>>csstransforms3d*/ ,['@media (',prefixes.join('transform-3d),('),mod,')',
                                '{#csstransforms3d{left:9px;position:absolute}}'].join('')/*>>csstransforms3d*/
                                
        /*>>generatedcontent*/,['#generatedcontent:after{content:"',smile,'";visibility:hidden}'].join('')  /*>>generatedcontent*/
    ],
      [
        /*>>fontface*/        'fontface'          /*>>fontface*/
        /*>>touch*/           ,'touch'            /*>>touch*/
        /*>>csstransforms3d*/ ,'csstransforms3d'  /*>>csstransforms3d*/
        /*>>generatedcontent*/,'generatedcontent' /*>>generatedcontent*/
        
    ]);/*>>testBundle*/


    /**
     * Tests
     * -----
     */

    tests['flexbox'] = function() {
        /**
         * setPrefixedValueCSS sets the property of a specified element
         * adding vendor prefixes to the VALUE of the property.
         * @param {Element} element
         * @param {string} property The property name. This will not be prefixed.
         * @param {string} value The value of the property. This WILL be prefixed.
         * @param {string=} extra Additional CSS to append unmodified to the end of
         * the CSS string.
         */
        function setPrefixedValueCSS( element, property, value, extra ) {
            property += ':';
            element.style.cssText = (property + prefixes.join(value + ';' + property)).slice(0, -property.length) + (extra || '');
        }

        /**
         * setPrefixedPropertyCSS sets the property of a specified element
         * adding vendor prefixes to the NAME of the property.
         * @param {Element} element
         * @param {string} property The property name. This WILL be prefixed.
         * @param {string} value The value of the property. This will not be prefixed.
         * @param {string=} extra Additional CSS to append unmodified to the end of
         * the CSS string.
         */
        function setPrefixedPropertyCSS( element, property, value, extra ) {
            element.style.cssText = prefixes.join(property + ':' + value + ';') + (extra || '');
        }

        var c = document.createElement('div'),
            elem = document.createElement('div');

        setPrefixedValueCSS(c, 'display', 'box', 'width:42px;padding:0;');
        setPrefixedPropertyCSS(elem, 'box-flex', '1', 'width:10px;');

        c.appendChild(elem);
        docElement.appendChild(c);

        var ret = elem.offsetWidth === 42;

        c.removeChild(elem);
        docElement.removeChild(c);

        return ret;
    };

    // On the S60 and BB Storm, getContext exists, but always returns undefined
    // http://github.com/Modernizr/Modernizr/issues/issue/97/

    tests['canvas'] = function() {
        var elem = document.createElement('canvas');
        return !!(elem.getContext && elem.getContext('2d'));
    };

    tests['canvastext'] = function() {
        return !!(Modernizr['canvas'] && is(document.createElement('canvas').getContext('2d').fillText, 'function'));
    };

    // This WebGL test may false positive. 
    // But really it's quite impossible to know whether webgl will succeed until after you create the context. 
    // You might have hardware that can support a 100x100 webgl canvas, but will not support a 1000x1000 webgl 
    // canvas. So this feature inference is weak, but intentionally so.
    
    // It is known to false positive in FF4 with certain hardware and the iPad 2.
    
    tests['webgl'] = function() {
        return !!window.WebGLRenderingContext;
    };

    /*
     * The Modernizr.touch test only indicates if the browser supports
     *    touch events, which does not necessarily reflect a touchscreen
     *    device, as evidenced by tablets running Windows 7 or, alas,
     *    the Palm Pre / WebOS (touch) phones.
     *
     * Additionally, Chrome (desktop) used to lie about its support on this,
     *    but that has since been rectified: http://crbug.com/36415
     *
     * We also test for Firefox 4 Multitouch Support.
     *
     * For more info, see: http://modernizr.github.com/Modernizr/touch.html
     */

    tests['touch'] = function() {
        return Modernizr['touch'];
    };

    /**
     * geolocation tests for the new Geolocation API specification.
     *   This test is a standards compliant-only test; for more complete
     *   testing, including a Google Gears fallback, please see:
     *   http://code.google.com/p/geo-location-javascript/
     * or view a fallback solution using google's geo API:
     *   http://gist.github.com/366184
     */
    tests['geolocation'] = function() {
        return !!navigator.geolocation;
    };

    // Per 1.6:
    // This used to be Modernizr.crosswindowmessaging but the longer
    // name has been deprecated in favor of a shorter and property-matching one.
    // The old API is still available in 1.6, but as of 2.0 will throw a warning,
    // and in the first release thereafter disappear entirely.
    tests['postmessage'] = function() {
      return !!window.postMessage;
    };

    // Web SQL database detection is tricky:

    // In chrome incognito mode, openDatabase is truthy, but using it will
    //   throw an exception: http://crbug.com/42380
    // We can create a dummy database, but there is no way to delete it afterwards.

    // Meanwhile, Safari users can get prompted on any database creation.
    //   If they do, any page with Modernizr will give them a prompt:
    //   http://github.com/Modernizr/Modernizr/issues/closed#issue/113

    // We have chosen to allow the Chrome incognito false positive, so that Modernizr
    //   doesn't litter the web with these test databases. As a developer, you'll have
    //   to account for this gotcha yourself.
    tests['websqldatabase'] = function() {
      var result = !!window.openDatabase;
      /*  if (result){
            try {
              result = !!openDatabase( mod + "testdb", "1.0", mod + "testdb", 2e4);
            } catch(e) {
            }
          }  */
      return result;
    };

    // Vendors had inconsistent prefixing with the experimental Indexed DB:
    // - Webkit's implementation is accessible through webkitIndexedDB
    // - Firefox shipped moz_indexedDB before FF4b9, but since then has been mozIndexedDB
    // For speed, we don't test the legacy (and beta-only) indexedDB
    tests['indexedDB'] = function() {
      for ( var i = -1, len = domPrefixes.length; ++i < len; ){
        if ( window[domPrefixes[i].toLowerCase() + 'IndexedDB'] ){
          return true;
        }
      }
      return !!window.indexedDB;
    };

    // documentMode logic from YUI to filter out IE8 Compat Mode
    //   which false positives.
    tests['hashchange'] = function() {
      return isEventSupported('hashchange', window) && (document.documentMode === undefined || document.documentMode > 7);
    };

    // Per 1.6:
    // This used to be Modernizr.historymanagement but the longer
    // name has been deprecated in favor of a shorter and property-matching one.
    // The old API is still available in 1.6, but as of 2.0 will throw a warning,
    // and in the first release thereafter disappear entirely.
    tests['history'] = function() {
      return !!(window.history && history.pushState);
    };

    tests['draganddrop'] = function() {
        return isEventSupported('dragstart') && isEventSupported('drop');
    };

    // Mozilla is targeting to land MozWebSocket for FF6
    // bugzil.la/659324
    tests['websockets'] = function() {
        for ( var i = -1, len = domPrefixes.length; ++i < len; ){
          if ( window[domPrefixes[i] + 'WebSocket'] ){
            return true;
          }
        }
        return 'WebSocket' in window;
    };


    // http://css-tricks.com/rgba-browser-support/
    tests['rgba'] = function() {
        // Set an rgba() color and check the returned value

        setCss('background-color:rgba(150,255,150,.5)');

        return contains(mStyle.backgroundColor, 'rgba');
    };

    tests['hsla'] = function() {
        // Same as rgba(), in fact, browsers re-map hsla() to rgba() internally,
        //   except IE9 who retains it as hsla

        setCss('background-color:hsla(120,40%,100%,.5)');

        return contains(mStyle.backgroundColor, 'rgba') || contains(mStyle.backgroundColor, 'hsla');
    };

    tests['multiplebgs'] = function() {
        // Setting multiple images AND a color on the background shorthand property
        //  and then querying the style.background property value for the number of
        //  occurrences of "url(" is a reliable method for detecting ACTUAL support for this!

        setCss('background:url(https://),url(https://),red url(https://)');

        // If the UA supports multiple backgrounds, there should be three occurrences
        //   of the string "url(" in the return value for elemStyle.background

        return /(url\s*\(.*?){3}/.test(mStyle.background);
    };


    // In testing support for a given CSS property, it's legit to test:
    //    `elem.style[styleName] !== undefined`
    // If the property is supported it will return an empty string,
    // if unsupported it will return undefined.

    // We'll take advantage of this quick test and skip setting a style
    // on our modernizr element, but instead just testing undefined vs
    // empty string.


    tests['backgroundsize'] = function() {
        return testPropsAll('backgroundSize');
    };

    tests['borderimage'] = function() {
        return testPropsAll('borderImage');
    };


    // Super comprehensive table about all the unique implementations of
    // border-radius: http://muddledramblings.com/table-of-css3-border-radius-compliance

    tests['borderradius'] = function() {
        return testPropsAll('borderRadius');
    };

    // WebOS unfortunately false positives on this test.
    tests['boxshadow'] = function() {
        return testPropsAll('boxShadow');
    };

    // FF3.0 will false positive on this test
    tests['textshadow'] = function() {
        return document.createElement('div').style.textShadow === '';
    };


    tests['opacity'] = function() {
        // Browsers that actually have CSS Opacity implemented have done so
        //  according to spec, which means their return values are within the
        //  range of [0.0,1.0] - including the leading zero.

        setCssAll('opacity:.55');

        // The non-literal . in this regex is intentional:
        //   German Chrome returns this value as 0,55
        // https://github.com/Modernizr/Modernizr/issues/#issue/59/comment/516632
        return /^0.55$/.test(mStyle.opacity);
    };


    tests['cssanimations'] = function() {
        return testPropsAll('animationName');
    };


    tests['csscolumns'] = function() {
        return testPropsAll('columnCount');
    };


    tests['cssgradients'] = function() {
        /**
         * For CSS Gradients syntax, please see:
         * http://webkit.org/blog/175/introducing-css-gradients/
         * https://developer.mozilla.org/en/CSS/-moz-linear-gradient
         * https://developer.mozilla.org/en/CSS/-moz-radial-gradient
         * http://dev.w3.org/csswg/css3-images/#gradients-
         */

        var str1 = 'background-image:',
            str2 = 'gradient(linear,left top,right bottom,from(#9f9),to(white));',
            str3 = 'linear-gradient(left top,#9f9, white);';

        setCss(
            (str1 + prefixes.join(str2 + str1) + prefixes.join(str3 + str1)).slice(0, -str1.length)
        );

        return contains(mStyle.backgroundImage, 'gradient');
    };


    tests['cssreflections'] = function() {
        return testPropsAll('boxReflect');
    };


    tests['csstransforms'] = function() {
        return !!testProps(['transformProperty', 'WebkitTransform', 'MozTransform', 'OTransform', 'msTransform']);
    };


    tests['csstransforms3d'] = function() {

        var ret = !!testProps(['perspectiveProperty', 'WebkitPerspective', 'MozPerspective', 'OPerspective', 'msPerspective']);

        // Webkit’s 3D transforms are passed off to the browser's own graphics renderer.
        //   It works fine in Safari on Leopard and Snow Leopard, but not in Chrome in
        //   some conditions. As a result, Webkit typically recognizes the syntax but
        //   will sometimes throw a false positive, thus we must do a more thorough check:
        if ( ret && 'webkitPerspective' in docElement.style ) {

          // Webkit allows this media query to succeed only if the feature is enabled.
          // `@media (transform-3d),(-o-transform-3d),(-moz-transform-3d),(-ms-transform-3d),(-webkit-transform-3d),(modernizr){ ... }`
          ret = Modernizr['csstransforms3d'];
        }
        return ret;
    };


    tests['csstransitions'] = function() {
        return testPropsAll('transitionProperty');
    };


    /*>>fontface*/
    // @font-face detection routine by Diego Perini
    // http://javascript.nwbox.com/CSSSupport/
    tests['fontface'] = function() {
        return Modernizr['fontface'];
    };
    /*>>fontface*/

    // CSS generated content detection
    tests['generatedcontent'] = function() {
        return Modernizr['generatedcontent'];
    };



    // These tests evaluate support of the video/audio elements, as well as
    // testing what types of content they support.
    //
    // We're using the Boolean constructor here, so that we can extend the value
    // e.g.  Modernizr.video     // true
    //       Modernizr.video.ogg // 'probably'
    //
    // Codec values from : http://github.com/NielsLeenheer/html5test/blob/9106a8/index.html#L845
    //                     thx to NielsLeenheer and zcorpan

    // Note: in FF 3.5.1 and 3.5.0, "no" was a return value instead of empty string.
    //   Modernizr does not normalize for that.

    tests['video'] = function() {
        var elem = document.createElement('video'),
            bool = false;
            
        // IE9 Running on Windows Server SKU can cause an exception to be thrown, bug #224
        try {
            if ( bool = !!elem.canPlayType ) {
                bool      = new Boolean(bool);
                bool.ogg  = elem.canPlayType('video/ogg; codecs="theora"');

                // Workaround required for IE9, which doesn't report video support without audio codec specified.
                //   bug 599718 @ msft connect
                var h264 = 'video/mp4; codecs="avc1.42E01E';
                bool.h264 = elem.canPlayType(h264 + '"') || elem.canPlayType(h264 + ', mp4a.40.2"');

                bool.webm = elem.canPlayType('video/webm; codecs="vp8, vorbis"');
            }
            
        } catch(e) { }
        
        return bool;
    };

    tests['audio'] = function() {
        var elem = document.createElement('audio'),
            bool = false;

        try { 
            if ( bool = !!elem.canPlayType ) {
                bool      = new Boolean(bool);
                bool.ogg  = elem.canPlayType('audio/ogg; codecs="vorbis"');
                bool.mp3  = elem.canPlayType('audio/mpeg;');

                // Mimetypes accepted:
                //   https://developer.mozilla.org/En/Media_formats_supported_by_the_audio_and_video_elements
                //   http://bit.ly/iphoneoscodecs
                bool.wav  = elem.canPlayType('audio/wav; codecs="1"');
                bool.m4a  = elem.canPlayType('audio/x-m4a;') || elem.canPlayType('audio/aac;');
            }
        } catch(e) { }
        
        return bool;
    };


    // Firefox has made these tests rather unfun.

    // In FF4, if disabled, window.localStorage should === null.

    // Normally, we could not test that directly and need to do a
    //   `('localStorage' in window) && ` test first because otherwise Firefox will
    //   throw http://bugzil.la/365772 if cookies are disabled

    // However, in Firefox 4 betas, if dom.storage.enabled == false, just mentioning
    //   the property will throw an exception. http://bugzil.la/599479
    // This looks to be fixed for FF4 Final.

    // Because we are forced to try/catch this, we'll go aggressive.

    // FWIW: IE8 Compat mode supports these features completely:
    //   http://www.quirksmode.org/dom/html5.html
    // But IE8 doesn't support either with local files

    tests['localstorage'] = function() {
        try {
            return !!localStorage.getItem;
        } catch(e) {
            return false;
        }
    };

    tests['sessionstorage'] = function() {
        try {
            return !!sessionStorage.getItem;
        } catch(e){
            return false;
        }
    };


    tests['webworkers'] = function() {
        return !!window.Worker;
    };


    tests['applicationcache'] = function() {
        return !!window.applicationCache;
    };


    // Thanks to Erik Dahlstrom
    tests['svg'] = function() {
        return !!document.createElementNS && !!document.createElementNS(ns.svg, 'svg').createSVGRect;
    };

    // specifically for SVG inline in HTML, not within XHTML
    // test page: paulirish.com/demo/inline-svg
    tests['inlinesvg'] = function() {
      var div = document.createElement('div');
      div.innerHTML = '<svg/>';
      return (div.firstChild && div.firstChild.namespaceURI) == ns.svg;
    };

    // Thanks to F1lt3r and lucideer, ticket #35
    tests['smil'] = function() {
        return !!document.createElementNS && /SVG/.test(toString.call(document.createElementNS(ns.svg, 'animate')));
    };

    tests['svgclippaths'] = function() {
        // Possibly returns a false positive in Safari 3.2?
        return !!document.createElementNS && /SVG/.test(toString.call(document.createElementNS(ns.svg, 'clipPath')));
    };

    // input features and input types go directly onto the ret object, bypassing the tests loop.
    // Hold this guy to execute in a moment.
    function webforms() {
        // Run through HTML5's new input attributes to see if the UA understands any.
        // We're using f which is the <input> element created early on
        // Mike Taylr has created a comprehensive resource for testing these attributes
        //   when applied to all input types:
        //   http://miketaylr.com/code/input-type-attr.html
        // spec: http://www.whatwg.org/specs/web-apps/current-work/multipage/the-input-element.html#input-type-attr-summary
        
        // Only input placeholder is tested while textarea's placeholder is not. 
        // Currently Safari 4 and Opera 11 have support only for the input placeholder
        // Both tests are available in feature-detects/forms-placeholder.js
        Modernizr['input'] = (function( props ) {
            for ( var i = 0, len = props.length; i < len; i++ ) {
                attrs[ props[i] ] = !!(props[i] in inputElem);
            }
            return attrs;
        })('autocomplete autofocus list placeholder max min multiple pattern required step'.split(' '));

        // Run through HTML5's new input types to see if the UA understands any.
        //   This is put behind the tests runloop because it doesn't return a
        //   true/false like all the other tests; instead, it returns an object
        //   containing each input type with its corresponding true/false value

        // Big thanks to @miketaylr for the html5 forms expertise. http://miketaylr.com/
        Modernizr['inputtypes'] = (function(props) {

            for ( var i = 0, bool, inputElemType, defaultView, len = props.length; i < len; i++ ) {

                inputElem.setAttribute('type', inputElemType = props[i]);
                bool = inputElem.type !== 'text';

                // We first check to see if the type we give it sticks..
                // If the type does, we feed it a textual value, which shouldn't be valid.
                // If the value doesn't stick, we know there's input sanitization which infers a custom UI
                if ( bool ) {

                    inputElem.value         = smile;
                    inputElem.style.cssText = 'position:absolute;visibility:hidden;';

                    if ( /^range$/.test(inputElemType) && inputElem.style.WebkitAppearance !== undefined ) {

                      docElement.appendChild(inputElem);
                      defaultView = document.defaultView;

                      // Safari 2-4 allows the smiley as a value, despite making a slider
                      bool =  defaultView.getComputedStyle &&
                              defaultView.getComputedStyle(inputElem, null).WebkitAppearance !== 'textfield' &&
                              // Mobile android web browser has false positive, so must
                              // check the height to see if the widget is actually there.
                              (inputElem.offsetHeight !== 0);

                      docElement.removeChild(inputElem);

                    } else if ( /^(search|tel)$/.test(inputElemType) ){
                      // Spec doesnt define any special parsing or detectable UI
                      //   behaviors so we pass these through as true

                      // Interestingly, opera fails the earlier test, so it doesn't
                      //  even make it here.

                    } else if ( /^(url|email)$/.test(inputElemType) ) {
                      // Real url and email support comes with prebaked validation.
                      bool = inputElem.checkValidity && inputElem.checkValidity() === false;

                    } else if ( /^color$/.test(inputElemType) ) {
                        // chuck into DOM and force reflow for Opera bug in 11.00
                        // github.com/Modernizr/Modernizr/issues#issue/159
                        docElement.appendChild(inputElem);
                        docElement.offsetWidth;
                        bool = inputElem.value != smile;
                        docElement.removeChild(inputElem);

                    } else {
                      // If the upgraded input compontent rejects the :) text, we got a winner
                      bool = inputElem.value != smile;
                    }
                }

                inputs[ props[i] ] = !!bool;
            }
            return inputs;
        })('search tel url email datetime date month week time datetime-local number range color'.split(' '));
    }


    // End of test definitions
    // -----------------------



    // Run through all tests and detect their support in the current UA.
    // todo: hypothetically we could be doing an array of tests and use a basic loop here.
    for ( var feature in tests ) {
        if ( hasOwnProperty(tests, feature) ) {
            // run the test, throw the return value into the Modernizr,
            //   then based on that boolean, define an appropriate className
            //   and push it into an array of classes we'll join later.
            featureName  = feature.toLowerCase();
            Modernizr[featureName] = tests[feature]();

            classes.push((Modernizr[featureName] ? '' : 'no-') + featureName);
        }
    }

    // input tests need to run.
    Modernizr.input || webforms();


    /**
     * addTest allows the user to define their own feature tests
     * the result will be added onto the Modernizr object,
     * as well as an appropriate className set on the html element
     *
     * @param feature - String naming the feature
     * @param test - Function returning true if feature is supported, false if not
     */
     Modernizr.addTest = function ( feature, test ) {
       if ( typeof feature == "object" ) {
         for ( var key in feature ) {
           if ( hasOwnProperty( feature, key ) ) { 
             Modernizr.addTest( key, feature[ key ] );
           }
         }
       } else {

         feature = feature.toLowerCase();

         if ( Modernizr[feature] !== undefined ) {
           // we're going to quit if you're trying to overwrite an existing test
           // if we were to allow it, we'd do this:
           //   var re = new RegExp("\\b(no-)?" + feature + "\\b");  
           //   docElement.className = docElement.className.replace( re, '' );
           // but, no rly, stuff 'em.
           return; 
         }

         test = typeof test == "boolean" ? test : !!test();

         docElement.className += ' ' + (test ? '' : 'no-') + feature;
         Modernizr[feature] = test;

       }

       return Modernizr; // allow chaining.
     };
    

    // Reset modElem.cssText to nothing to reduce memory footprint.
    setCss('');
    modElem = inputElem = null;

    //>>BEGIN IEPP
    // Enable HTML 5 elements for styling (and printing) in IE.
    if ( window.attachEvent && (function(){ var elem = document.createElement('div');
                                            elem.innerHTML = '<elem></elem>';
                                            return elem.childNodes.length !== 1; })() ) {
                                              
        // iepp v2 by @jon_neal & afarkas : github.com/aFarkas/iepp/
        (function(win, doc) {
          win.iepp = win.iepp || {};
          var iepp = win.iepp,
            elems = iepp.html5elements || 'abbr|article|aside|audio|canvas|datalist|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|section|summary|time|video',
            elemsArr = elems.split('|'),
            elemsArrLen = elemsArr.length,
            elemRegExp = new RegExp('(^|\\s)('+elems+')', 'gi'),
            tagRegExp = new RegExp('<(\/*)('+elems+')', 'gi'),
            filterReg = /^\s*[\{\}]\s*$/,
            ruleRegExp = new RegExp('(^|[^\\n]*?\\s)('+elems+')([^\\n]*)({[\\n\\w\\W]*?})', 'gi'),
            docFrag = doc.createDocumentFragment(),
            html = doc.documentElement,
            head = html.firstChild,
            bodyElem = doc.createElement('body'),
            styleElem = doc.createElement('style'),
            printMedias = /print|all/,
            body;
          function shim(doc) {
            var a = -1;
            while (++a < elemsArrLen)
              // Use createElement so IE allows HTML5-named elements in a document
              doc.createElement(elemsArr[a]);
          }

          iepp.getCSS = function(styleSheetList, mediaType) {
            if(styleSheetList+'' === undefined){return '';}
            var a = -1,
              len = styleSheetList.length,
              styleSheet,
              cssTextArr = [];
            while (++a < len) {
              styleSheet = styleSheetList[a];
              //currently no test for disabled/alternate stylesheets
              if(styleSheet.disabled){continue;}
              mediaType = styleSheet.media || mediaType;
              // Get css from all non-screen stylesheets and their imports
              if (printMedias.test(mediaType)) cssTextArr.push(iepp.getCSS(styleSheet.imports, mediaType), styleSheet.cssText);
              //reset mediaType to all with every new *not imported* stylesheet
              mediaType = 'all';
            }
            return cssTextArr.join('');
          };

          iepp.parseCSS = function(cssText) {
            var cssTextArr = [],
              rule;
            while ((rule = ruleRegExp.exec(cssText)) != null){
              // Replace all html5 element references with iepp substitute classnames
              cssTextArr.push(( (filterReg.exec(rule[1]) ? '\n' : rule[1]) +rule[2]+rule[3]).replace(elemRegExp, '$1.iepp_$2')+rule[4]);
            }
            return cssTextArr.join('\n');
          };

          iepp.writeHTML = function() {
            var a = -1;
            body = body || doc.body;
            while (++a < elemsArrLen) {
              var nodeList = doc.getElementsByTagName(elemsArr[a]),
                nodeListLen = nodeList.length,
                b = -1;
              while (++b < nodeListLen)
                if (nodeList[b].className.indexOf('iepp_') < 0)
                  // Append iepp substitute classnames to all html5 elements
                  nodeList[b].className += ' iepp_'+elemsArr[a];
            }
            docFrag.appendChild(body);
            html.appendChild(bodyElem);
            // Write iepp substitute print-safe document
            bodyElem.className = body.className;
            bodyElem.id = body.id;
            // Replace HTML5 elements with <font> which is print-safe and shouldn't conflict since it isn't part of html5
            bodyElem.innerHTML = body.innerHTML.replace(tagRegExp, '<$1font');
          };


          iepp._beforePrint = function() {
            // Write iepp custom print CSS
            styleElem.styleSheet.cssText = iepp.parseCSS(iepp.getCSS(doc.styleSheets, 'all'));
            iepp.writeHTML();
          };

          iepp.restoreHTML = function(){
            // Undo everything done in onbeforeprint
            bodyElem.innerHTML = '';
            html.removeChild(bodyElem);
            html.appendChild(body);
          };

          iepp._afterPrint = function(){
            // Undo everything done in onbeforeprint
            iepp.restoreHTML();
            styleElem.styleSheet.cssText = '';
          };



          // Shim the document and iepp fragment
          shim(doc);
          shim(docFrag);

          //
          if(iepp.disablePP){return;}

          // Add iepp custom print style element
          head.insertBefore(styleElem, head.firstChild);
          styleElem.media = 'print';
          styleElem.className = 'iepp-printshim';
          win.attachEvent(
            'onbeforeprint',
            iepp._beforePrint
          );
          win.attachEvent(
            'onafterprint',
            iepp._afterPrint
          );
        })(window, document);
    }
    //>>END IEPP

    // Assign private properties to the return object with prefix
    Modernizr._version      = version;

    // expose these for the plugin API. Look in the source for how to join() them against your input
    Modernizr._prefixes     = prefixes;
    Modernizr._domPrefixes  = domPrefixes;
    
    // Modernizr.mq tests a given media query, live against the current state of the window
    // A few important notes:
    //   * If a browser does not support media queries at all (eg. oldIE) the mq() will always return false
    //   * A max-width or orientation query will be evaluated against the current state, which may change later.
    //   * You must specify values. Eg. If you are testing support for the min-width media query use: 
    //       Modernizr.mq('(min-width:0)')
    // usage:
    // Modernizr.mq('only screen and (max-width:768)')
    Modernizr.mq            = testMediaQuery;   
    
    // Modernizr.hasEvent() detects support for a given event, with an optional element to test on
    // Modernizr.hasEvent('gesturestart', elem)
    Modernizr.hasEvent      = isEventSupported; 

    // Modernizr.testProp() investigates whether a given style property is recognized
    // Note that the property names must be provided in the camelCase variant.
    // Modernizr.testProp('pointerEvents')
    Modernizr.testProp      = function(prop){
        return testProps([prop]);
    };        

    // Modernizr.testAllProps() investigates whether a given style property,
    //   or any of its vendor-prefixed variants, is recognized
    // Note that the property names must be provided in the camelCase variant.
    // Modernizr.testAllProps('boxSizing')    
    Modernizr.testAllProps  = testPropsAll;     


    
    // Modernizr.testStyles() allows you to add custom styles to the document and test an element afterwards
    // Modernizr.testStyles('#modernizr { position:absolute }', function(elem, rule){ ... })
    Modernizr.testStyles    = injectElementWithStyles; 


    // Modernizr.prefixed() returns the prefixed or nonprefixed property name variant of your input
    // Modernizr.prefixed('boxSizing') // 'MozBoxSizing'
    
    // Properties must be passed as dom-style camelcase, rather than `box-sizing` hypentated style.
    // Return values will also be the camelCase variant, if you need to translate that to hypenated style use:
    //
    //     str.replace(/([A-Z])/g, function(str,m1){ return '-' + m1.toLowerCase(); }).replace(/^ms-/,'-ms-');
    
    // If you're trying to ascertain which transition end event to bind to, you might do something like...
    // 
    //     var transEndEventNames = {
    //       'WebkitTransition' : 'webkitTransitionEnd',
    //       'MozTransition'    : 'transitionend',
    //       'OTransition'      : 'oTransitionEnd',
    //       'msTransition'     : 'msTransitionEnd', // maybe?
    //       'transition'       : 'transitionEnd'
    //     },
    //     transEndEventName = transEndEventNames[ Modernizr.prefixed('transition') ];
    
    Modernizr.prefixed      = function(prop){
      return testPropsAll(prop, 'pfx');
    };



    // Remove "no-js" class from <html> element, if it exists:
    docElement.className = docElement.className.replace(/\bno-js\b/, '')
                            
                            // Add the new classes to the <html> element.
                            + (enableClasses ? ' js ' + classes.join(' ') : '');

    return Modernizr;

})(this, this.document);
// SIG // Begin signature block
// SIG // MIIaZgYJKoZIhvcNAQcCoIIaVzCCGlMCAQExCzAJBgUr
// SIG // DgMCGgUAMGcGCisGAQQBgjcCAQSgWTBXMDIGCisGAQQB
// SIG // gjcCAR4wJAIBAQQQEODJBs441BGiowAQS9NQkAIBAAIB
// SIG // AAIBAAIBAAIBADAhMAkGBSsOAwIaBQAEFLQIaLjMgu6n
// SIG // xUlj3vYAVCAqp4G7oIIVNjCCBKkwggORoAMCAQICEzMA
// SIG // AACIWQ48UR/iamcAAQAAAIgwDQYJKoZIhvcNAQEFBQAw
// SIG // eTELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0
// SIG // b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1p
// SIG // Y3Jvc29mdCBDb3Jwb3JhdGlvbjEjMCEGA1UEAxMaTWlj
// SIG // cm9zb2Z0IENvZGUgU2lnbmluZyBQQ0EwHhcNMTIwNzI2
// SIG // MjA1MDQxWhcNMTMxMDI2MjA1MDQxWjCBgzELMAkGA1UE
// SIG // BhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNV
// SIG // BAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBD
// SIG // b3Jwb3JhdGlvbjENMAsGA1UECxMETU9QUjEeMBwGA1UE
// SIG // AxMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMIIBIjANBgkq
// SIG // hkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAs3R00II8h6ea
// SIG // 1I6yBEKAlyUu5EHOk2M2XxPytHiYgMYofsyKE+89N4w7
// SIG // CaDYFMVcXtipHX8BwbOYG1B37P7qfEXPf+EhDsWEyp8P
// SIG // a7MJOLd0xFcevvBIqHla3w6bHJqovMhStQxpj4TOcVV7
// SIG // /wkgv0B3NyEwdFuV33fLoOXBchIGPfLIVWyvwftqFifI
// SIG // 9bNh49nOGw8e9OTNTDRsPkcR5wIrXxR6BAf11z2L22d9
// SIG // Vz41622NAUCNGoeW4g93TIm6OJz7jgKR2yIP5dA2qbg3
// SIG // RdAq/JaNwWBxM6WIsfbCBDCHW8PXL7J5EdiLZWKiihFm
// SIG // XX5/BXpzih96heXNKBDRPQIDAQABo4IBHTCCARkwEwYD
// SIG // VR0lBAwwCgYIKwYBBQUHAwMwHQYDVR0OBBYEFCZbPltd
// SIG // ll/i93eIf15FU1ioLlu4MA4GA1UdDwEB/wQEAwIHgDAf
// SIG // BgNVHSMEGDAWgBTLEejK0rQWWAHJNy4zFha5TJoKHzBW
// SIG // BgNVHR8ETzBNMEugSaBHhkVodHRwOi8vY3JsLm1pY3Jv
// SIG // c29mdC5jb20vcGtpL2NybC9wcm9kdWN0cy9NaWNDb2RT
// SIG // aWdQQ0FfMDgtMzEtMjAxMC5jcmwwWgYIKwYBBQUHAQEE
// SIG // TjBMMEoGCCsGAQUFBzAChj5odHRwOi8vd3d3Lm1pY3Jv
// SIG // c29mdC5jb20vcGtpL2NlcnRzL01pY0NvZFNpZ1BDQV8w
// SIG // OC0zMS0yMDEwLmNydDANBgkqhkiG9w0BAQUFAAOCAQEA
// SIG // D95ASYiR0TE3o0Q4abJqK9SR+2iFrli7HgyPVvqZ18qX
// SIG // J0zohY55aSzkvZY/5XBml5UwZSmtxsqs9Q95qGe/afQP
// SIG // l+MKD7/ulnYpsiLQM8b/i0mtrrL9vyXq7ydQwOsZ+Bpk
// SIG // aqDhF1mv8c/sgaiJ6LHSFAbjam10UmTalpQqXGlrH+0F
// SIG // mRrc6GWqiBsVlRrTpFGW/VWV+GONnxQMsZ5/SgT/w2at
// SIG // Cq+upN5j+vDqw7Oy64fbxTittnPSeGTq7CFbazvWRCL0
// SIG // gVKlK0MpiwyhKnGCQsurG37Upaet9973RprOQznoKlPt
// SIG // z0Dkd4hCv0cW4KU2au+nGo06PTME9iUgIzCCBLowggOi
// SIG // oAMCAQICCmECjkIAAAAAAB8wDQYJKoZIhvcNAQEFBQAw
// SIG // dzELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0
// SIG // b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1p
// SIG // Y3Jvc29mdCBDb3Jwb3JhdGlvbjEhMB8GA1UEAxMYTWlj
// SIG // cm9zb2Z0IFRpbWUtU3RhbXAgUENBMB4XDTEyMDEwOTIy
// SIG // MjU1OFoXDTEzMDQwOTIyMjU1OFowgbMxCzAJBgNVBAYT
// SIG // AlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQH
// SIG // EwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29y
// SIG // cG9yYXRpb24xDTALBgNVBAsTBE1PUFIxJzAlBgNVBAsT
// SIG // Hm5DaXBoZXIgRFNFIEVTTjpGNTI4LTM3NzctOEE3NjEl
// SIG // MCMGA1UEAxMcTWljcm9zb2Z0IFRpbWUtU3RhbXAgU2Vy
// SIG // dmljZTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoC
// SIG // ggEBAJbsjkdNVMJclYDXTgs9v5dDw0vjYGcRLwFNDNjR
// SIG // Ri8QQN4LpFBSEogLQ3otP+5IbmbHkeYDym7sealqI5vN
// SIG // Yp7NaqQ/56ND/2JHobS6RPrfQMGFVH7ooKcsQyObUh8y
// SIG // NfT+mlafjWN3ezCeCjOFchvKSsjMJc3bXREux7CM8Y9D
// SIG // SEcFtXogC+Xz78G69LPYzTiP+yGqPQpthRfQyueGA8Az
// SIG // g7UlxMxanMTD2mIlTVMlFGGP+xvg7PdHxoBF5jVTIzZ3
// SIG // yrDdmCs5wHU1D92BTCE9djDFsrBlcylIJ9jC0rCER7t4
// SIG // utV0A97XSxn3U9542ob3YYgmM7RHxqBUiBUrLHUCAwEA
// SIG // AaOCAQkwggEFMB0GA1UdDgQWBBQv6EbIaNNuT7Ig0N6J
// SIG // TvFH7kjB8jAfBgNVHSMEGDAWgBQjNPjZUkZwCu1A+3b7
// SIG // syuwwzWzDzBUBgNVHR8ETTBLMEmgR6BFhkNodHRwOi8v
// SIG // Y3JsLm1pY3Jvc29mdC5jb20vcGtpL2NybC9wcm9kdWN0
// SIG // cy9NaWNyb3NvZnRUaW1lU3RhbXBQQ0EuY3JsMFgGCCsG
// SIG // AQUFBwEBBEwwSjBIBggrBgEFBQcwAoY8aHR0cDovL3d3
// SIG // dy5taWNyb3NvZnQuY29tL3BraS9jZXJ0cy9NaWNyb3Nv
// SIG // ZnRUaW1lU3RhbXBQQ0EuY3J0MBMGA1UdJQQMMAoGCCsG
// SIG // AQUFBwMIMA0GCSqGSIb3DQEBBQUAA4IBAQBz/30unc2N
// SIG // iCt8feNeFXHpaGLwCLZDVsRcSi1o2PlIEZHzEZyF7BLU
// SIG // VKB1qTihWX917sb1NNhUpOLQzHyXq5N1MJcHHQRTLDZ/
// SIG // f/FAHgybgOISCiA6McAHdWfg+jSc7Ij7VxzlWGIgkEUv
// SIG // XUWpyI6zfHJtECfFS9hvoqgSs201I2f6LNslLbldsR4F
// SIG // 50MoPpwFdnfxJd4FRxlt3kmFodpKSwhGITWodTZMt7MI
// SIG // qt+3K9m+Kmr93zUXzD8Mx90Gz06UJGMgCy4krl9DRBJ6
// SIG // XN0326RFs5E6Eld940fGZtPPnEZW9EwHseAMqtX21Tyi
// SIG // 4LXU+Bx+BFUQaxj0kc1Rp5VlMIIFvDCCA6SgAwIBAgIK
// SIG // YTMmGgAAAAAAMTANBgkqhkiG9w0BAQUFADBfMRMwEQYK
// SIG // CZImiZPyLGQBGRYDY29tMRkwFwYKCZImiZPyLGQBGRYJ
// SIG // bWljcm9zb2Z0MS0wKwYDVQQDEyRNaWNyb3NvZnQgUm9v
// SIG // dCBDZXJ0aWZpY2F0ZSBBdXRob3JpdHkwHhcNMTAwODMx
// SIG // MjIxOTMyWhcNMjAwODMxMjIyOTMyWjB5MQswCQYDVQQG
// SIG // EwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UE
// SIG // BxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENv
// SIG // cnBvcmF0aW9uMSMwIQYDVQQDExpNaWNyb3NvZnQgQ29k
// SIG // ZSBTaWduaW5nIFBDQTCCASIwDQYJKoZIhvcNAQEBBQAD
// SIG // ggEPADCCAQoCggEBALJyWVwZMGS/HZpgICBCmXZTbD4b
// SIG // 1m/My/Hqa/6XFhDg3zp0gxq3L6Ay7P/ewkJOI9VyANs1
// SIG // VwqJyq4gSfTwaKxNS42lvXlLcZtHB9r9Jd+ddYjPqnNE
// SIG // f9eB2/O98jakyVxF3K+tPeAoaJcap6Vyc1bxF5Tk/TWU
// SIG // cqDWdl8ed0WDhTgW0HNbBbpnUo2lsmkv2hkL/pJ0KeJ2
// SIG // L1TdFDBZ+NKNYv3LyV9GMVC5JxPkQDDPcikQKCLHN049
// SIG // oDI9kM2hOAaFXE5WgigqBTK3S9dPY+fSLWLxRT3nrAgA
// SIG // 9kahntFbjCZT6HqqSvJGzzc8OJ60d1ylF56NyxGPVjzB
// SIG // rAlfA9MCAwEAAaOCAV4wggFaMA8GA1UdEwEB/wQFMAMB
// SIG // Af8wHQYDVR0OBBYEFMsR6MrStBZYAck3LjMWFrlMmgof
// SIG // MAsGA1UdDwQEAwIBhjASBgkrBgEEAYI3FQEEBQIDAQAB
// SIG // MCMGCSsGAQQBgjcVAgQWBBT90TFO0yaKleGYYDuoMW+m
// SIG // PLzYLTAZBgkrBgEEAYI3FAIEDB4KAFMAdQBiAEMAQTAf
// SIG // BgNVHSMEGDAWgBQOrIJgQFYnl+UlE/wq4QpTlVnkpDBQ
// SIG // BgNVHR8ESTBHMEWgQ6BBhj9odHRwOi8vY3JsLm1pY3Jv
// SIG // c29mdC5jb20vcGtpL2NybC9wcm9kdWN0cy9taWNyb3Nv
// SIG // ZnRyb290Y2VydC5jcmwwVAYIKwYBBQUHAQEESDBGMEQG
// SIG // CCsGAQUFBzAChjhodHRwOi8vd3d3Lm1pY3Jvc29mdC5j
// SIG // b20vcGtpL2NlcnRzL01pY3Jvc29mdFJvb3RDZXJ0LmNy
// SIG // dDANBgkqhkiG9w0BAQUFAAOCAgEAWTk+fyZGr+tvQLEy
// SIG // tWrrDi9uqEn361917Uw7LddDrQv+y+ktMaMjzHxQmIAh
// SIG // Xaw9L0y6oqhWnONwu7i0+Hm1SXL3PupBf8rhDBdpy6Wc
// SIG // IC36C1DEVs0t40rSvHDnqA2iA6VW4LiKS1fylUKc8fPv
// SIG // 7uOGHzQ8uFaa8FMjhSqkghyT4pQHHfLiTviMocroE6WR
// SIG // Tsgb0o9ylSpxbZsa+BzwU9ZnzCL/XB3Nooy9J7J5Y1ZE
// SIG // olHN+emjWFbdmwJFRC9f9Nqu1IIybvyklRPk62nnqaIs
// SIG // vsgrEA5ljpnb9aL6EiYJZTiU8XofSrvR4Vbo0HiWGFzJ
// SIG // NRZf3ZMdSY4tvq00RBzuEBUaAF3dNVshzpjHCe6FDoxP
// SIG // bQ4TTj18KUicctHzbMrB7HCjV5JXfZSNoBtIA1r3z6Nn
// SIG // CnSlNu0tLxfI5nI3EvRvsTxngvlSso0zFmUeDordEN5k
// SIG // 9G/ORtTTF+l5xAS00/ss3x+KnqwK+xMnQK3k+eGpf0a7
// SIG // B2BHZWBATrBC7E7ts3Z52Ao0CW0cgDEf4g5U3eWh++VH
// SIG // EK1kmP9QFi58vwUheuKVQSdpw5OPlcmN2Jshrg1cnPCi
// SIG // roZogwxqLbt2awAdlq3yFnv2FoMkuYjPaqhHMS+a3ONx
// SIG // PdcAfmJH0c6IybgY+g5yjcGjPa8CQGr/aZuW4hCoELQ3
// SIG // UAjWwz0wggYHMIID76ADAgECAgphFmg0AAAAAAAcMA0G
// SIG // CSqGSIb3DQEBBQUAMF8xEzARBgoJkiaJk/IsZAEZFgNj
// SIG // b20xGTAXBgoJkiaJk/IsZAEZFgltaWNyb3NvZnQxLTAr
// SIG // BgNVBAMTJE1pY3Jvc29mdCBSb290IENlcnRpZmljYXRl
// SIG // IEF1dGhvcml0eTAeFw0wNzA0MDMxMjUzMDlaFw0yMTA0
// SIG // MDMxMzAzMDlaMHcxCzAJBgNVBAYTAlVTMRMwEQYDVQQI
// SIG // EwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4w
// SIG // HAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xITAf
// SIG // BgNVBAMTGE1pY3Jvc29mdCBUaW1lLVN0YW1wIFBDQTCC
// SIG // ASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAJ+h
// SIG // bLHf20iSKnxrLhnhveLjxZlRI1Ctzt0YTiQP7tGn0Uyt
// SIG // dDAgEesH1VSVFUmUG0KSrphcMCbaAGvoe73siQcP9w4E
// SIG // mPCJzB/LMySHnfL0Zxws/HvniB3q506jocEjU8qN+kXP
// SIG // CdBer9CwQgSi+aZsk2fXKNxGU7CG0OUoRi4nrIZPVVIM
// SIG // 5AMs+2qQkDBuh/NZMJ36ftaXs+ghl3740hPzCLdTbVK0
// SIG // RZCfSABKR2YRJylmqJfk0waBSqL5hKcRRxQJgp+E7VV4
// SIG // /gGaHVAIhQAQMEbtt94jRrvELVSfrx54QTF3zJvfO4OT
// SIG // oWECtR0Nsfz3m7IBziJLVP/5BcPCIAsCAwEAAaOCAasw
// SIG // ggGnMA8GA1UdEwEB/wQFMAMBAf8wHQYDVR0OBBYEFCM0
// SIG // +NlSRnAK7UD7dvuzK7DDNbMPMAsGA1UdDwQEAwIBhjAQ
// SIG // BgkrBgEEAYI3FQEEAwIBADCBmAYDVR0jBIGQMIGNgBQO
// SIG // rIJgQFYnl+UlE/wq4QpTlVnkpKFjpGEwXzETMBEGCgmS
// SIG // JomT8ixkARkWA2NvbTEZMBcGCgmSJomT8ixkARkWCW1p
// SIG // Y3Jvc29mdDEtMCsGA1UEAxMkTWljcm9zb2Z0IFJvb3Qg
// SIG // Q2VydGlmaWNhdGUgQXV0aG9yaXR5ghB5rRahSqClrUxz
// SIG // WPQHEy5lMFAGA1UdHwRJMEcwRaBDoEGGP2h0dHA6Ly9j
// SIG // cmwubWljcm9zb2Z0LmNvbS9wa2kvY3JsL3Byb2R1Y3Rz
// SIG // L21pY3Jvc29mdHJvb3RjZXJ0LmNybDBUBggrBgEFBQcB
// SIG // AQRIMEYwRAYIKwYBBQUHMAKGOGh0dHA6Ly93d3cubWlj
// SIG // cm9zb2Z0LmNvbS9wa2kvY2VydHMvTWljcm9zb2Z0Um9v
// SIG // dENlcnQuY3J0MBMGA1UdJQQMMAoGCCsGAQUFBwMIMA0G
// SIG // CSqGSIb3DQEBBQUAA4ICAQAQl4rDXANENt3ptK132855
// SIG // UU0BsS50cVttDBOrzr57j7gu1BKijG1iuFcCy04gE1CZ
// SIG // 3XpA4le7r1iaHOEdAYasu3jyi9DsOwHu4r6PCgXIjUji
// SIG // 8FMV3U+rkuTnjWrVgMHmlPIGL4UD6ZEqJCJw+/b85HiZ
// SIG // Lg33B+JwvBhOnY5rCnKVuKE5nGctxVEO6mJcPxaYiyA/
// SIG // 4gcaMvnMMUp2MT0rcgvI6nA9/4UKE9/CCmGO8Ne4F+tO
// SIG // i3/FNSteo7/rvH0LQnvUU3Ih7jDKu3hlXFsBFwoUDtLa
// SIG // FJj1PLlmWLMtL+f5hYbMUVbonXCUbKw5TNT2eb+qGHpi
// SIG // Ke+imyk0BncaYsk9Hm0fgvALxyy7z0Oz5fnsfbXjpKh0
// SIG // NbhOxXEjEiZ2CzxSjHFaRkMUvLOzsE1nyJ9C/4B5IYCe
// SIG // FTBm6EISXhrIniIh0EPpK+m79EjMLNTYMoBMJipIJF9a
// SIG // 6lbvpt6Znco6b72BJ3QGEe52Ib+bgsEnVLaxaj2JoXZh
// SIG // tG6hE6a/qkfwEm/9ijJssv7fUciMI8lmvZ0dhxJkAj0t
// SIG // r1mPuOQh5bWwymO0eFQF1EEuUKyUsKV4q7OglnUa2ZKH
// SIG // E3UiLzKoCG6gW4wlv6DvhMoh1useT8ma7kng9wFlb4kL
// SIG // fchpyOZu6qeXzjEp/w7FW1zYTRuh2Povnj8uVRZryROj
// SIG // /TGCBJwwggSYAgEBMIGQMHkxCzAJBgNVBAYTAlVTMRMw
// SIG // EQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRt
// SIG // b25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRp
// SIG // b24xIzAhBgNVBAMTGk1pY3Jvc29mdCBDb2RlIFNpZ25p
// SIG // bmcgUENBAhMzAAAAiFkOPFEf4mpnAAEAAACIMAkGBSsO
// SIG // AwIaBQCggb4wGQYJKoZIhvcNAQkDMQwGCisGAQQBgjcC
// SIG // AQQwHAYKKwYBBAGCNwIBCzEOMAwGCisGAQQBgjcCARUw
// SIG // IwYJKoZIhvcNAQkEMRYEFMy9Mn1v5xzS/X8HE8IO0NY8
// SIG // o31xMF4GCisGAQQBgjcCAQwxUDBOoCaAJABNAGkAYwBy
// SIG // AG8AcwBvAGYAdAAgAEwAZQBhAHIAbgBpAG4AZ6EkgCJo
// SIG // dHRwOi8vd3d3Lm1pY3Jvc29mdC5jb20vbGVhcm5pbmcg
// SIG // MA0GCSqGSIb3DQEBAQUABIIBAFd8iLWgOE2l4BAoxOjd
// SIG // YEj1vWMe6t22fZQk4wCZjDbhV8xAvnea0yTSRdAAhkNP
// SIG // WN+DMfvHzZXVmV1TAlsyqoksjCOS9mGjuf41JsZHUCz6
// SIG // N3IcyiK7FjJ4jEbENu7cDOlrrnsQvgUueDlvUrlv19VT
// SIG // ct+oFF/4ZW+zCk9MATh90X9bf4S/FG+thuYCL9adnHIj
// SIG // fE29iRTARP2YqWMR5aHVZxD2TpvO3L6Ljspzw/InKjoZ
// SIG // Ph888df/MTQAGaxzrPefMXPeM56H5+E1Eb4W572zbJaZ
// SIG // ba3t6I5mHNuXwzTGuWDPpOySlBazlKlM6Ha0pybotIwr
// SIG // Nc4lIuAe+QtcmZOhggIfMIICGwYJKoZIhvcNAQkGMYIC
// SIG // DDCCAggCAQEwgYUwdzELMAkGA1UEBhMCVVMxEzARBgNV
// SIG // BAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQx
// SIG // HjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEh
// SIG // MB8GA1UEAxMYTWljcm9zb2Z0IFRpbWUtU3RhbXAgUENB
// SIG // AgphAo5CAAAAAAAfMAkGBSsOAwIaBQCgXTAYBgkqhkiG
// SIG // 9w0BCQMxCwYJKoZIhvcNAQcBMBwGCSqGSIb3DQEJBTEP
// SIG // Fw0xMjEwMDEyMjEwMzRaMCMGCSqGSIb3DQEJBDEWBBQk
// SIG // +N1Y6o8ci2zXaUGEWUWJaj0uAzANBgkqhkiG9w0BAQUF
// SIG // AASCAQA8qnmzfVwmJA72fD4g+fLqHoUDrysWNl/muHM9
// SIG // 1kxtBM/RwnVxqcOA9cnDbWfbdyRIf5boRA8/L8vTV0tO
// SIG // 6ijy4USjxRslJxNHsgWgT6XBxH+f+7uB9oePK5VJ/0wm
// SIG // 2IxFOo0wHpJ8u3/cfCCscvJ7ax+exKKySoNKZYB+q4i4
// SIG // zfUT+dwFHK5zN6GE1O+rXD+flCLgVG56Zl9o3LcYKfBc
// SIG // aqRuxTh5JQ1rpVgXuSJrAriY4X9QoJUp2CefHQ66fXOj
// SIG // SvbXPiwCHvL6fRiuthB4Lx84rfHBLE8vL0q98uHmwxbF
// SIG // T6VPxE+MWbvMlGNDiiEGavISG/BZkh/4zJoA3jIz
// SIG // End signature block
