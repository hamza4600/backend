/**
 *  * Based on Atomic CSS philosphy, without generating any extra classes
 * Instead, this script will check each "class" attributes in the DOM matching the follwing patterns:
 *     [ variant ]:[ property ]:[ value|CssVariable ]@[ mediaQuery ]
 * then will inject in the head of the page the proper CSS code matching the class declaration
 * 
 * exemple:
 *   bg:red  => .bg\:red { background-color:red; }
 *   mb:3vr  => .mb\:3vr { margin-bottom: 3 * var(--unit-vr); }
 *   items:center  => .items\:center { align-items: center; }
 * 
 * It uses a MutationObserver to detect any 'class' attribute changes and update the injected CSS
 * 

 * 
 */
(function() {
    let helpers = {
        mask:      'overflow:hidden;',
        center:    'display:flex;align-items:center;justify-content:center;',
        circle:    'border-radius: 100%;',
        sticky:    'position:sticky',
        wrap:      'flex-wrap:wrap;',
        relative:  'position: relative;',
        rel:       'position: relative;',
        fit:       'height:100%; width: 100%;',
        grid:      'display: grid; grid-template-columns:repeat(var(--grid-cols), minmax(0, 1fr));',
        flex:      'display: flex;',
        block:     'display: block;',
        iblock:    'display: inline-block;',
        abs:       'position:absolute;',
        absolute:  'position:absolute;',
        fix:       'position:fixed;',
        fixed:     'position:fixed;',
        none:      'display: none;',
        hidden:    'visibility: hidden;',
        fill:      'fill:currentColor',
        stroke:    'stroke:currentColor',
        bg:        'background-color:currentColor',
        c:         'color:currentColor',
        border:    'border: solid 1px currentColor;',
        shadow:    '--shadowX:0;--shadowY:0;--shadowBlur:10px;--shadowColor:rgba(0,0,0,0.5); box-shadow: var(--shadowX) var(--shadowY) var(--shadowBlur) var(--shadowColor);',
        transform: '--translateX:0;--translateY:0; --rotate:0; --scaleX:1; --scaleY:1; will-change:transform; transform: translate(var(--translateX), var(--translateY)) rotate(var(--rotate)) scale(var(--scaleX), var(--scaleY)) translateZ(0);',
        before:    { selector:'::before', prop:'content: \'\';display:inline-block;' },
        after:     { selector:'::after', prop:'content: \'\';display:inline-block;' },
        pusht:     'top: 100%',
        pushr:     'right: 100%',
        pushb:     'bottom: 100%',
        pushl:     'left: 100%',
        nowrap:    'white-space:nowrap',
        //to simplify font helpers and avoid conflcit between fs(font-size) and fs(font-style)
        'italic': 'font-style:italic',
        'normal': 'font-style:normal',
        
        'aa': '-webkit-font-smoothing: antialiased;-moz-osx-font-smoothing: grayscale;',
        'auto-aa': '-webkit-font-smoothing: auto;-moz-osx-font-smoothing: auto;',
       
        uppercase: 'text-transform: uppercase',
        underline: 'text-decoration:underline',
    };

    let propsAlias = {
 
        'content': 'content',

        'dashoffset':'stroke-dashoffset',
        'dasharray':'stroke-dasharray',

        'blend': 'mix-blend-mode',
        'backdrop': 'backdrop-filter',
        'filter': 'filter',


        'float':'float',
        'clear':'clear',

        //Typography
        'fs':'font-size',
        'fw': 'font-weight',
        'ff':'font-family',
        'lh': 'line-height',
        'spacing':'letter-spacing',
        'letter':'letter-spacing',
        //top/left/right/bottom
        t:     'top',
        tl:     'top,left',
        tr:     'top,right',
        l:     'left',
        b:     'bottom',
        bl:     'bottom,left',
        'br':     'bottom,right',
        r:     'right',
        //padding
        p:      'padding',
        'p-t':    'padding-top',
        'p-tl':    'padding-top, padding-left',
        'p-lt':    'padding-left, padding-top',
        'p-l':    'padding-left',
        'p-b':    'padding-bottom',
        'p-bl':    'padding-bottom, padding-left',
        'p-lb':    'padding-left, padding-bottom',
        'p-r':    'padding-right',
        'p-tr':    'padding-top, padding-right',
        'p-rt':    'padding-right, padding-top',
        'p-x':    'padding-right, padding-left',
        'p-y':    'padding-top, padding-bottom',
        //Margin
        m:     'margin',
        'm-t':    'margin-top',
        'm-l':    'margin-left',
        'm-b':    'margin-bottom',
        'm-r':    'margin-right',
        'm-x':    'margin-left, margin-right',
        'm-y':    'margin-top, margin-bottom',
        w:     'width',
        h:     'height',
        //Colors
        c:     'color',
        bg:    'background',
        'bg-clip': 'background-clip',
        'bg-size': 'background-size',
        'bg-pos': 'background-position',
        'bg-img': 'background-image',
        'bg-repeat': 'background-repeat',
        'bg-color': 'background-color',

        fill:      'fill',
        stroke:    'stroke',
        //Size
        'min-w':  'min-width',
        'min-h':  'min-height',
        'max-w':  'max-width',
        'max-h':  'max-height',
        //Flex
        dir: 'flex-direction',
        direction: 'flex-direction',
        justify: 'justify-content',
        just: 'justify-content',
        align:   'text-align',
        'align-x':   'text-align',
        'align-y':   'vertical-align',
        items:   'align-items',
        grow:    'flex-grow',
        wrap: 'flex-wrap',
        shrink:  'flex-shrink',
        //adds space betweeen its children nodes
        'space-x': {selector: '> *:not(:last-child)', prop:'margin-right'},
        'space-y': {selector: '> *:not(:last-child)', prop:'margin-bottom'},
        //adds border betweeen its children nodes
        'div-x': {selector: '> *:not(:last-child)', prop:'border-right: solid 1px; border-right-color'},
        'div-y': {selector: '> *:not(:last-child)', prop:'border-bottom: solid 1px; border-bottom-color'},
        //Transforms
        'origin':'transform-origin', 
        'shift': '--translateX, --translateY',
        'shift-x': '--translateX',
        'shift-y': '--translateY',
        'shift-z': '--translateZ', 
        'translate': '--translateX, --translateY',
        'translate-x': '--translateX',
        'translate-y': '--translateY',
        'translate-z': '--translateZ',
        'rotate': '--rotate',
        'scale': '--scaleX, --scaleY',
        'scale-x': '--scaleX',
        'scale-y': '--scaleY',
        //Grids
        'cols': '--grid-cols',
        'gap': 'gap',
        'gap-x': 'column-gap',
        'gap-y': 'row-gap',
        'auto-rows':'grid-auto-rows',
        'auto-flow':'grid-auto-flow',
        'auto-cols':'grid-auto-columns',
        //Shadow
        'box-shadow': 'box-shadow',
        's-x':      '--shadowX',
        's-y':      '--shadowY',
        sb:      '--shadowBlur',
        sc:      '--shadowColor',
        
        //Borders
        'border':  'border',//need to use full name to avoid conflcit with 'b:bottom'

        'b-t':     'border-top',//can receive comma separated values
        'b-r':     'border-right',//can receive comma separated values
        'b-b':     'border-bottom',//can receive comma separated values
        'b-l':     'border-left',//can receive comma separated values
        'b-tr':    'border-top-right',//can receive comma separated values
        'b-br':    'border-bottom-right',//can receive comma separated values
        'b-bl':    'border-bottom-left',//can receive comma separated values
        'b-tl':    'border-top-left',//can receive comma separated values

        'bc':       'border-color',
        'bc-t':     'border-top-color',
        'bc-r':     'border-right-color',
        'bc-b':     'border-bottom-color',
        'bc-l':     'border-left-color',
        'bc-tr':    'border-top-right-color',
        'bc-br':    'border-bottom-right-color',
        'bc-bl':    'border-bottom-left-color',
        'bc-tl':    'border-top-left-color',

        'bw':       'border-width',
        'bw-t':     'border-top-width',
        'bw-r':     'border-right-width',
        'bw-b':     'border-bottom-width',
        'bw-l':     'border-left-width',
        'bw-tr':    'border-top-right-width',
        'bw-br':    'border-bottom-right-width',
        'bw-bl':    'border-bottom-left-width',
        'bw-tl':    'border-top-left-width',

        'bs':      'border-style',
        'bs-t':     'border-top-style',
        'bs-r':     'border-right-style',
        'bs-b':     'border-bottom-style',
        'bs-l':     'border-left-style',
        'bs-tr':    'border-top-right-style',
        'bs-br':    'border-bottom-right-style',
        'bs-bl':    'border-bottom-left-style',
        'bs-tl':    'border-top-left-style',
        
        'radius':       'border-radius',
        'radius-t':     'border-top-radius',
        'radius-r':     'border-right-radius',
        'radius-b':     'border-bottom-radius',
        'radius-l':     'border-left-radius',
        'radius-tr':    'border-top-right-radius',
        'radius-br':    'border-bottom-right-radius',
        'radius-bl':    'border-bottom-left-radius',
        'radius-tl':    'border-top-left-radius',

        'bo':       'border-opacity',
        'bo-t':     'border-top-opacity',
        'bo-r':     'border-right-opacity',
        'bo-b':     'border-bottom-opacity',
        'bo-l':     'border-left-opacity',
        'bo-tr':    'border-top-right-opacity',
        'bo-br':    'border-bottom-right-opacity',
        'bo-bl':    'border-bottom-left-opacity',
        'bo-tl':    'border-top-left-opacity',

        //Misc
        display:'display',
        d:'display',
        object:'object-fit',
        scroll: 'overscroll-behavior',
        list: 'list-style',
        decoration: 'text-decoration',
        pos: 'position',
        pointer: 'pointer-events',
        cursor: 'cursor',
        appearance: 'appearance',
        'z':'z-index',
        'index':'z-index',
        
        'o':'opacity',
        'opacity':'opacity',
        'alpha':'opacity',

        'overflow':'overflow',
        'overflow-x':'overflow-x',
        'overflow-y':'overflow-y',

        'deco': 'text-decoration',
        
        'transition':'transition',
        'animation':'animation',
        'anim':'animation',
        'tween':'transition',
        'tween-delay':  'transition-delay',
        'delay':  'transition-delay',
        'tween-property': 'transition-property',
        'property': 'transition-property',
        'prop': 'transition-property',
        'tween-length':'transition-duration',
        'tween-duration':'transition-duration',
        'tween-ease': 'transition-timing-function',
        'anim-delay':    'animation-delay',
        'anim-duration': 'animation-duration',
        'anim-ease': 'animation-timing-function',
    };


    let variants = {
        'even': {pre:'', post:':nth-child(even)'},
        'odd':  {pre:'', post:':nth-child(odd)'},
        'child-1':  {pre:'', post:':nth-child(1)'},
        'child-2':  {pre:'', post:':nth-child(2)'},
        'child-3':  {pre:'', post:':nth-child(3)'},
        'child-4':  {pre:'', post:':nth-child(4)'},
        'child-5':  {pre:'', post:':nth-child(5)'},
        'child-6':  {pre:'', post:':nth-child(6)'},
        'child-7':  {pre:'', post:':nth-child(7)'},
        'child-8':  {pre:'', post:':nth-child(8)'},
        'child-9':  {pre:'', post:':nth-child(9)'},
        'child-10':  {pre:'', post:':nth-child(10)'},
        'last-child':  {pre:'', post:':last-child'},

        'disabled':         {pre:'',          post:':disabled'},
        
        'hover':         {pre:'',          post:':hover'},
        'parent-hover':  {pre:':hover > ', post:''},
        'parents-hover': {pre:':hover ',   post:''},
        'sibling-hover': {pre:':hover ~ ', post:''},
        'previous-hover': {pre:':hover + ', post:''}, 
        'group-hover':    {pre:'.group:hover ',          post:''},
        
        'checked':         {pre:'',            post:':checked'},
        'parent-checked':  {pre:':checked > ', post:''},
        'parents-checked': {pre:':checked ',   post:''},
        'sibling-checked': {pre:':checked ~ ', post:''},
        'previous-checked':    {pre:':checked + ', post:''}, 
        'group-checked':    {pre:'.group:checked ',          post:''},
        
        'focus':           {pre:'',          post:':focus'},
        'parent-focus':    {pre:':focus > ', post:''},
        'parents-focus':   {pre:':focus ',   post:''},
        'sibling-focus': {pre:':focus ~ ', post:''},
        'previous-focus':    {pre:':focus + ', post:''}, 
        'group-focus':    {pre:'.group:focus ',          post:''},
        
        'active':          {pre:'',post:':active'},
        'parent-active':   {pre:':active > ',post:''},
        'parents-active':  {pre:':active ',post:''},
        'sibling-active': {pre:':active ~ ', post:''},
        'previous-active':    {pre:':active + ', post:''}, 
        'group-active':    {pre:'.group:active ',          post:''},
        
        'parents-is-active':          {pre:'.is-ready .is-active ',post:''},
        'parent-is-active':          {pre:'.is-ready .is-active > ',post:''},
        'group-is-active':    {pre:'.is-ready .group.is-active ',          post:''},
        'anim-in':          {pre:'.is-ready .is-active ',post:''},
        

        'placeholder':     {pre:'', post:'::placeholder '},
        'has-placeholder': {pre:'', post:':placeholder-shown '},
        'sibling-has-placeholder': {pre:':placeholder-shown ~ ', post:''},
        'previous-has-placeholder':    {pre:':active + ', post:''}, 

        'scrollbar':          {pre:'', post:'::-webkit-scrollbar'},
        'scroll-track':    {pre:'', post:'::-webkit-scrollbar-track'},
        'scroll-thumb':    {pre:'', post:'::-webkit-scrollbar-thumb'},
        'scroll-button':   {pre:'', post:'::-webkit-scrollbar-button'},

        'after':  { post:'::after', pre:'' },
        'before': { post:'::before', pre:'' },


    };

    let valuesAlias = {
        between: 'space-between',
        around:  'space-around',
        evenly:  'space:evenly',
        start:   'flex-start',
        end:     'flex-end',
        fit:     '100%',
        current: 'currentColor',
        abs:     'absolute',
        col:     'column',
        trans:   'transparent'
    };
            
    let cache = {};

    let propRegPart = '';
    let variantRegPart = '';
    let selector = '';
    let helperRegPart = '';
    for (let h in helpers) { 
        selector+=`.${h},`; 
        helperRegPart += h+'|'; 
    }
    for (let p in propsAlias) { 
        selector+=`[class*='${p}:'],`; 
        propRegPart += p+'|'; 
    }
    for (let v in variants) { 
        selector+=`[class*='${v}:'],`; 
        variantRegPart += (v).replace(/\-/,'\\-')+'|'; 
    }
    propRegPart = propRegPart.replace(/\|$/,'');
    helperRegPart = helperRegPart.replace(/\|$/,'');
    selector = selector.replace(/\,$/,'');
    variantRegPart = variantRegPart.replace(/\|$/,'');

    let helperReg = new RegExp( '^'+helperRegPart+'$' );
    let utilReg = new RegExp( '^('+propRegPart+')\\:[^\\s]+' );
    let variantReg = new RegExp( '^('+variantRegPart+')\\:(.+)' );

//////////////////////////////////////////////////////
//////////////////////////////////////////////////////
//////////////////////////////////////////////////////
    let helperStyle = document.createElement('style');
    helperStyle.type = 'text/css';
    document.getElementsByTagName('head')[0].appendChild(helperStyle);
    //
    let aliasStyle = document.createElement('style');
    aliasStyle.type = 'text/css';
    aliasStyle.innerHTML += `:root {`;
    for (let k in valuesAlias) {
        aliasStyle.innerHTML += `--alias-${k}: ${valuesAlias[k]};`;
    }
    aliasStyle.innerHTML += `}`;
    document.getElementsByTagName('head')[0].appendChild(aliasStyle);
    //
    var style = document.createElement('style');
    style.type = 'text/css';
    document.getElementsByTagName('head')[0].appendChild(style);
    //
    var responsiveStyle = document.createElement('style');
    responsiveStyle.type = 'text/css';
    document.getElementsByTagName('head')[0].appendChild(responsiveStyle);
    var responsiveStyleCache = {};
//////////////////////////////////////////////////////
//////////////////////////////////////////////////////
//////////////////////////////////////////////////////


    function parse(el, compCache) {

        let newStyles = '';
        let newResponsiveStyles = {};
        let newHelperStyles = '';

        let clss = el.getAttribute('class').replace(/\n/g, " ");

        if (/\([^)]+\)\:/.test(el.getAttribute('class'))) {
            clss = clss.replace(/\([^)]+\)/g, (a,b,c)=>{
                return a.replace(/\s/g, ';')
            });
        }

        let clssArr = clss.split(' ');

        clssArr.forEach((cls)=>{

            

            let selectorPre = '';
            let selectorPost = '';
            let variantName = '';
            let hasVariant;

            if ( /\([^)]+\)\:?/.test(cls)  ) {

                cls = cls.replace(/\;/g, ' ');
                let sel;
                cls          = cls.replace(/\([^)]+\)\:?/,(a,b,c)=> {sel = a; return ''} );

                let selectorParts = sel.replace(/(\(|\))/g,'').replace(/\:$/,'').split('&');
                selectorPre  = (selectorParts[0]||'') + ' ';
                selectorPost = (selectorParts[1]||'') + ' '; 
                hasVariant   = true;
                variantName = sel
                    .replace(/\(/g,'\\(')
                    .replace(/\)/g,'\\)')
                    .replace(/\&/g,'\\&')
                    .replace(/\+/g,'\\+')
                    .replace(/\~/g,'\\~')
                    .replace(/\>/g,'\\>')
                    .replace(/\:/g,'\\:')
                    .replace(/\*/g,'\\*')
                    .replace(/\./g,'\\.')
                    .replace(/\s/g,'.');
            }

            else if ( variantReg.test(cls)  ) {
                try {
                    variantName  = cls.replace(variantReg,(a,b)=>b).replace(/(\r\n|\n|\r)/gm, "");
                    cls          = cls.replace(variantName+':', '');
                    selectorPre  = variants[variantName].pre;
                    selectorPost = variants[variantName].post;
                    hasVariant   = true; 
                    variantName  += "\\:";
                }
                catch(e) {
                    // console.log('['+variantName+']')
                }
            }

            
            if ( utilReg.test(cls) ) {
                    

                
                if ( !cache[ variantName+cls.replace( /([\W_])/g, (a)=> '\\'+a ) ]  ) {
                    
                
                    let prop = cls.split(':')[0];
                    let val  = cls.split(':')[1];
                    
                    
                    if (propsAlias[prop] != undefined) {
                      
                    
                        if (val===undefined) {
                            console.warn('missing value or wrong property syntax: "' + cls + '"');
                        }
                        else {

                           
                            let matchingprops = typeof propsAlias[prop] == 'string' ? propsAlias[prop].split(',') : propsAlias[prop].prop.split(',');
                            let selector = propsAlias[prop].selector ? propsAlias[prop].selector : '';
                            let clsContent = '';
                            let important = /\!/g.test(val) ?'!important':'';
                            val = val.replace('!','');

                            let queryStart = '';
                            if (/\@/.test(val)) { 
                                let q;
                                val = val.replace(/\@(.*)/,(a,b,c)=>{ q=b; return '' });
                                // if (compCache['--media-'+q]) {
                                    // console.log(`computedStyle.getPropertyValue('--media-'+${q})`)
                                    // compCache['--media-'+q] = computedStyle.getPropertyValue('--media-'+q)
                                // }
                                if (compCache['--media-'+q]) {
                                    queryStart = `${compCache['--media-'+q]}`;
                                }
                            }



                            matchingprops.forEach((propName)=>{
                                let valParts = val.split(',');
                                let totalVal = '';
                                valParts.forEach((val)=>{
                                    // handle css custom units(vr, fx, fx, ect)
                                    if (/^[0-9.-]+[^0-9.-]+$/.test(val)) {
                                        let unit = val.replace( /^[0-9.-]+([^0-9.-]+)$/, (a,b)=>b);
                                        let num  = val.replace(unit,'');
                                        if (compCache['--unit-'+unit]) {
                                            totalVal += `calc( ${num} * var(--unit-${unit}) )`; 
                                        }
                                        else {
                                            totalVal += `${val}`;
                                        }
                                    }
                                    else {
                                        //check for alias in CSS variables on :root
                                        let aliasVar = `--alias-${val}`;
                                        totalVal += compCache[ aliasVar ] ? `var(--alias-${val})` : val;
                                    }
                                    totalVal +=  propName === 'transition-property' ? ',' : ' ';//use white space to seperate values
                                });
                                clsContent += `${propName}: ${ totalVal.replace(/\,$/,'') } ${important};`;
                            });


                            
                            
                            cls = cls.replace( /([\W_])/g, (a)=> '\\'+a );

                            if (queryStart != '') {
                                newResponsiveStyles[queryStart] = newResponsiveStyles[queryStart] || '';
                                newResponsiveStyles[queryStart] += `${selectorPre}.${variantName}${cls}${selector}${selectorPost}{ ${clsContent} }`;
                            }
                            else {
                                newStyles += `${selectorPre}.${variantName}${cls}${selector}${selectorPost}{ ${clsContent} }`;
                            }
                            cache[ variantName + cls ] = clsContent;

                        }
                    }
                }
            }



                

            if( helperReg.test(cls.replace( /([\W_])/g, (a)=> '\\'+a )) ) {
                

                
                let helpCls = cls.replace(/\@.*/,'');
                if ( 
                    helpers[ helpCls ] != undefined 
                    && !cache[ variantName +cls.replace( /([\W_])/g, (a)=> '\\'+a ) ]  ) {
                    

                    let content  = typeof helpers[helpCls] == 'string' ? helpers[helpCls] : helpers[helpCls].prop;
                    let selector = helpers[helpCls].selector ? helpers[helpCls].selector : '';
                    let queryStart = '';
                    if (/\@/g.test(cls)) { 
                        let q;
                        cls.replace(/\@(.*)/,(a,b,c)=>{ q=b; return '' });
                        // compCache['--media-'+q] = compCache['--media-'+q] || computedStyle.getPropertyValue('--media-'+q)
                        if (compCache['--media-'+q]) {
                            queryStart = `${compCache['--media-'+q]}`;
                        }
                    }

                    if (queryStart != '') {
                        newResponsiveStyles[queryStart] = newResponsiveStyles[queryStart] || '';
                        newResponsiveStyles[queryStart] += ` .${variantName}${cls}${selector} { ${content} }`;
                    }
                    else {
                        newHelperStyles += ` .${variantName}${cls}${selector} { ${content} }`;
                        
                    }


                    cache[  variantName+cls.replace( /([\W_])/g, (a)=> '\\'+a ) ] = `.${variantName}${cls}${selector} { ${content} }`;
                }
            }
        });
        ///////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////

        let responsiveStyleNeedsUpdate = false;
        for (let query in newResponsiveStyles) {   
            responsiveStyleCache[query] = responsiveStyleCache[query] || '';
            responsiveStyleCache[query] += `${newResponsiveStyles[query]}`;
            responsiveStyleNeedsUpdate = true;
        }                                 

        if (responsiveStyleNeedsUpdate) {
            let result = '';
            // for (let query in responsiveStyleCache) {   
            //     result += `@media ${query} { ${ responsiveStyleCache[query] } }`
            // }
            let orderedStyles = [];
            for (let query in responsiveStyleCache) {
                orderedStyles.push(query);
            }

            orderedStyles.sort((a,b)=>{
                let orderA = Number(a.replace(/^([^px]+).*/,(x,y)=>y) );
                let orderB = Number(b.replace(/^([^px]+).*/,(x,y)=>y) );
                return orderA < orderB ? -1 : 1
            });
            
            orderedStyles.forEach((q)=>{   
                result += `@media ${q} { ${ responsiveStyleCache[q] } }`;
            });


            responsiveStyle.innerHTML = result;
        }

        if (newHelperStyles != '') {                          
            helperStyle.innerHTML += newHelperStyles;          
        }                                                     
        if (newStyles != '') {                                
            style.innerHTML += newStyles;                     
        }                                                     
        ///////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////
    }





    // could pass in an array of specific stylesheets for optimization
    function getAllCSSVariableNames(styleSheets = document.styleSheets){
        var cssVars = [];
        // loop each stylesheet
        for(var i = 0; i < styleSheets.length; i++){
        // loop stylesheet's cssRules
        try{ // try/catch used because 'hasOwnProperty' doesn't work
            for( var j = 0; j < styleSheets[i].cssRules.length; j++){
                try{
                    // loop stylesheet's cssRules' style (property names)
                    for(var k = 0; k < styleSheets[i].cssRules[j].style.length; k++){
                    let name = styleSheets[i].cssRules[j].style[k];
                    // test name for css variable signiture and uniqueness
                    if(name.startsWith('--') && cssVars.indexOf(name) == -1){
                        cssVars.push(name);
                    }
                    }
                } catch (error) {}
            }
        } catch (error) {}
        }
        return cssVars;
    }
    
    let queueList = [];
    let compCache = {};
    let computedStyle = getComputedStyle(document.documentElement);

    let cssVariables = getAllCSSVariableNames();
    cssVariables.forEach((name)=>{
        compCache[name] = computedStyle.getPropertyValue(name);
    });

    function updateComputedStyle() {
        computedStyle = getComputedStyle(document.documentElement);
    }
    window.updateComputedStyle = updateComputedStyle;

    function getComputedCache() {
        return compCache;
    }
    window.getComputedCache = getComputedCache;


    function resolveParse() {
        requestAnimationFrame(resolveParse); 
        if (queueList.length > 0) {
            queueList.forEach((node)=>{
                parse(node, compCache);
            });
        }
        queueList = [];
    }
    function addToParseQueue(node) {
        let hasNode = false;
        queueList.forEach((queueNode)=>{
            if (node == queueNode) hasNode = true;
        });
        if (!hasNode) {
            queueList.push(node);
        }
    }
    requestAnimationFrame(resolveParse); 


    /**
     * parse the provded node and generates utility classes if needed
     * @param {HTMLElement} el 
     */
    function getCSSClasses(el)  {
        if (el.matches && el.matches(selector) ) {
            addToParseQueue(el);
        }
        el.querySelectorAll && el.querySelectorAll(selector).forEach((o)=>{
            addToParseQueue(o);
        });
    }


    let lastVW = -1;
    let lastVH = -1;
    function onResize() {
        if (lastVW != window.innerWidth
            || (window.innerWidth > 768 && lastVH != window.innerHeight) 
        ) {
            document.documentElement.style.setProperty('--vw', document.body.clientWidth + "px");
            document.documentElement.style.setProperty('--vh', window.innerHeight + "px");
            getCSSClasses(document.documentElement);
        }
        lastVW = window.innerWidth;
        lastVH = window.innerHeight;
    }
    window.addEventListener('resize', onResize);
    
   
    document.addEventListener('DOMContentLoaded', (event) => {
        onResize();
    });

    setTimeout(()=>{
        onResize();
    }, 1000);


    var dom_observer = new MutationObserver(function(mutations) {
        mutations.forEach((mutation)=>{
            if (mutation.type == 'childList' && mutation.target.tagName != 'STYLE') {
                mutation.addedNodes.forEach((node)=>{
                    getCSSClasses( node );
                });
            }
            if (mutation.type == 'attributes' ) {
                getCSSClasses( mutation.target );
            }
        });
    });

    dom_observer.observe( document.documentElement || document.body,{ 
        attributes: true, 
        attributeFilter: ['class'], 
        subtree:true, 
        childList: true, 
        characterData: true  
    });

    getCSSClasses(document.documentElement);


    window.UtilityCSS = ()=>{ return  helperStyle.innerHTML + '\n' + aliasStyle.innerHTML + '\n' + style.innerHTML };
    window.getAllCSSVariableNames = getAllCSSVariableNames;


})();

var support = {};
  var tests = {
    touch:        typeof window === 'undefined' ? false : function(){ return 'ontouchstart' in window || /*|| (navigator.maxTouchPoints > 0)*/navigator.msMaxTouchPoints > 0; },
    msPointer:    typeof window === 'undefined' ? false : function(){ return !!window.navigator.msPointerEnabled; },
    pointer:      typeof window === 'undefined' ? false : function(){ return !!window.navigator.pointerEnabled; },
    pointerdown:  function(){ return this.touch() ? 'touchstart' : this.pointer() ? 'pointerdown' : this.msPointer() ? 'MSPointerDown' : 'mousedown'; },
    pointerup:    function(){ return this.touch() ? 'touchend' : this.pointer() ? 'pointerup' : this.msPointer() ? 'MSPointerUp' : 'mouseup'; },
    pointermove:  function(){ return this.touch() ? 'touchmove' : this.pointer() ? 'pointermove' : this.msPointer() ? 'MSPointerMove' : 'mousemove'; },
    pointerenter: function(){ return this.touch() ? 'touchstart' : this.pointer() ? 'pointerenter' : this.msPointer() ? 'MSPointerEnter' : 'mouseenter'; },
    pointerleave: function(){ return this.touch() ? 'touchend' : this.pointer() ? 'pointerleave' : this.msPointer() ? 'MSPointerLeave' : 'mouseleave'; },
    pointerover:  function(){ return this.touch() ? 'touchstart' : this.pointer() ? 'pointerover' : this.msPointer() ? 'MSPointerOver' : 'mouseover'; },
    pointerout:   function(){ return this.touch() ? 'touchend' : this.pointer() ? 'pointerout' : this.msPointer() ? 'MSPointerOut' : 'mouseout'; },
  };
  var featureName;
  for (var feature in tests) {
    if (tests.hasOwnProperty(feature)) {
      featureName = feature;
      support[featureName] = tests[feature]();
    }
  }



  const EXP_REG = /\$\$([0-9]+)\$\$/g;
  function hyphenise(str) {
    return str.replace( /([a-z])([A-Z])/g, '$1-$2' ).toLowerCase();
  }

  class Binding {
    constructor(options) {
      this.oldValue = null;
      this.node = options.node;
      this.lvls = options.lvls;
      this.optional = options.optional;
      this.nameIndex = options.nameIndex;
      this.valueIndex = options.valueIndex;
      this.name = options.name;
      this.value = options.value;
      this.type =options.type;
      this.index =options.index;

      if (/\?/g.test(this.name) ) {
        this.optional = true;
        this.node.removeAttribute( this.name );
        this.name = this.name.replace(/\?/g, '');
      }
      /**
       * Even if some browser support the native is="", Safari doesnt
       * So we patch this attribute to make sure all brosers begave the same
       */
      // if (/(data\-)?is$/g.test(this.name) ) {
      //   this.optional = true
      //   this.node.removeAttribute( this.name )
      //   this.name = this.name.replace(/(data\-)?is$/g, '$is')
      //   this.node.setAttribute( this.name, this.value )
      //   // let newNode = document.createElement( this.value )
      //   // this.node.removeAttribute('data-is');
      //   // Array.from(this.node.attributes).forEach(node => 
      //   //   newNode.setAttributeNode(node.cloneNode(true))
      //   // );
      //   // this.node.parentNode.replaceChild(newNode, this.node);
      //   // this.node = newNode;
      // }
      // if (/\.data/g.test(this.name) ) {
      //   this.isProperty = true
      // }
      if (/(on\-|\@)/.test(this.name)) {
        this.type = 'event';
        let eventName = this.name.replace(/^(on\-|\@)/,'');
        this.eventName = support[eventName] || eventName;
        this.eventHandler = this.eventHandler.bind(this);
        // delegateEvent( this.node, eventName, this.eventHandler );
        this.node.removeEventListener(this.eventName, this.eventHandler);
        this.node.addEventListener(this.eventName, this.eventHandler);
      }
      if (this.type == 'text') {
        this.parts = [];
        let lastIndex = 0;
        let originValue = this.node.nodeValue;
        originValue.replace(EXP_REG, (a,b,c)=>{
          this.parts.push({
            type:'static',
            str: originValue.substr(lastIndex, c-lastIndex) 
          });
          this.parts.push({type:'value',index: b>>0});
          lastIndex = c + a.length;
          return a;
        });
        this.parts.push({
          type:'static',
          str: originValue.substr(lastIndex, originValue.length) 
        });
        this.node.nodeValue = '';
      }
    }
    eventHandler(e) {
      this.callback && this.callback(e);
    }
    destroy() {
      if (this.eventName) {
        this.node.removeEventListener(this.eventName, this.eventHandler);
      }
      this.node = null;
    }
    _update(values) {
      if (this.type=='event') {
        let value = this.valueIndex != -1  ? values[this.valueIndex] : this.value;
        this.callback = value;
      }
      if (this.type=='text') {
        let parent = this.node.parentNode;

        this.parts.forEach((part)=>{
          if (values[part.index] == void 0) {
            return
          }
          if ( part.type == 'value' ) {
            if ( Array.isArray(values[part.index]) ) 
            {
              part.entries = part.entries || [];

              values[part.index].forEach((item, itemIndex)=>{
                if (item.htmlTemplate) {
                  if(part.entries[itemIndex] == undefined) {
                    part.entries[itemIndex] = new TemplateInstance( item.htmlTemplate, parent );
                  }
                  part.entries[itemIndex].render(item.values);
                }
              });
              
              for(let i=values[part.index].length; i<part.entries.length; i++) {
                part.entries[i] && part.entries[i].destroy();
              }
              part.entries.splice(values[part.index].length, part.entries.length);

            }
            else if ( values[part.index].htmlTemplate ) 
            {
              part.template && part.template.destroy();
              part.template = new TemplateInstance( values[part.index].htmlTemplate, parent );
              part.template.render(values[part.index].values);
            }
            else {
              if (!part.node) {
                part.node = document.createElement('span');
                parent && parent.insertBefore( part.node, this.node );
              }
              if (part.node.oldText == void 0 || part.node.oldText != values[part.index] ) {
                part.node.innerHTML = values[part.index];
                part.node.oldText = values[part.index];
              }
            }
          }
          else {
            if (!part.node) {
              part.node = document.createTextNode(part.str);
              parent.insertBefore( part.node, this.node );
            }
            if (part.node.nodeValue !== values[part.index]) {
              part.node.nodeValue = values[part.index];
            }
          }
        });
      }
      if (this.type=='attribute') {

        let value = this.valueIndex != -1 ? values[this.valueIndex] : this.value;
        let name   = this.nameIndex != -1 ? values[this.nameIndex] : this.name;
        
        if (name=="class") {

            // if (value) {
            
            let newClasses = !value || value == '' ? [] : value.trim().replace(/\s+/g,' ').replace(/(?:\r\n|\r|\n)/g, ' ').split(' ');
            
            if (this.oldValue) {
              let oldValuesArr = this.oldValue.replace(/\s+/g,' ').replace(/(?:\r\n|\r|\n)/g, ' ').trim().split(' ');
              let filteredOldValuesArr = oldValuesArr.filter(oldClass => !newClasses.includes( oldClass ) && oldClass.trim() != '' );
              if (filteredOldValuesArr.length > 0) {
                this.node.classList.remove.apply(this.node.classList, filteredOldValuesArr );
              }
              newClasses = newClasses.filter(newClass => !oldValuesArr.includes(newClass) );
            }
            newClasses = newClasses.filter(newClass => newClass.trim()!=='' );
            if (newClasses.length > 0) {
              this.node.classList.add.apply(this.node.classList, newClasses );
            }

          // }
          // else {
          //   console.log('NOT A STRING', value)
          // }


        }
        else if (name=="style" && typeof value == 'object') {
          //removable propety by setting its value to false or null
          if (this.oldValue && typeof this.oldValue == 'object') {
            for (let s in this.oldValue) {
              if (value[s] == void 0 || value[s] == null) {
                this.node.style.removeProperty( hyphenise(s) );
              }
            }
          }
          for (let s in  value) {
            if (value[s] !== void 0 && value[s] !== null) {
              this.node.style[s] = value[s];
            }
          }
        }
        else if (this.node.props && this.node.set && (this.name.replace(/^data\-/,'') in this.node.props) ) {
          this.node.set({
            [this.name.replace(/^data\-/,'')]: value
          });
        }
        else {
          if (this.nameIndex != -1 || (this.optional && !value) ) {
            this.node.removeAttribute(name);
          }
          else {
            if (this.oldValue == void 0 || typeof this.oldValue === 'object' || (this.oldValue !== value) ) {
              this.node.setAttribute(name, typeof value == 'object' ? JSON.stringify(value) : value  );
            }
          }
        }
        this.oldValue = value;
      }
    }
  }


  let templateCache = new Map();
  class TemplateInstance {
    constructor(options, parentNode) {
      this.parentNode = parentNode;
      this.bindings   = [];
      this.templateTag = options.templateTag;
      
      let c = options.templateTag.content.cloneNode(true);
      this.c = c.firstChild;//fragment ?

      let $wrapper = document.createElement('div');
      $wrapper.appendChild( c );
      c = $wrapper;

      /** Fixing IOs 11 Autoplay bug on cloned videos from document fragment */
      let videos = c.querySelectorAll('video');
      videos.forEach(vid=>{
        if (!vid._isClone && !vid._clone) {
          let $cloneVideo = vid.cloneNode();
          vid._clone = $cloneVideo;
          $cloneVideo._isClone = true;
          $cloneVideo.setAttribute('is-clone',''); 
          vid.parentNode.insertBefore( $cloneVideo, vid );
          vid.parentNode.removeChild( vid );
        }
      });
      /**/
      
      this.rootNodes = [];
      for (let i=0; i<c.childNodes.length; i++) {
        this.rootNodes.push( c.childNodes[i] );
      }

      options.bindingOptions.forEach( binding => {
        let n = c;
        binding.lvls.forEach( lvl => {
          n = n.childNodes[lvl];
        });
        binding.node = n;
        this.bindings.push(new Binding(binding));
      });

      this.rootNodes.forEach((n)=>{
        this.parentNode.appendChild( n );
      });

    }

    render(values) {
      this.bindings.forEach( binding => {
        binding._update(values);
      });
    }
    destroy() {
      this.bindings.forEach( binding => {
        binding.destroy();
      });
      this.rootNodes.forEach((n)=>{
        n && n.parentNode && n.parentNode.removeChild(n);
      });
      this.rootNodes = [];
    }
  }

  class HTMLTemplate {
    constructor(strings, values) {
      this.bindingOptions = [];
      let filteredString = '';
      for (let i=0; i<strings.length; i++) {
        let value = '';
        if (i < strings.length-1) {
          value = '$$'+i+'$$';
        }
        filteredString += strings[i] + value; 
      }
      this.templateTag = document.createElement('template');
      this.templateTag.innerHTML = filteredString;
      this.getBindings(this.templateTag.content, this.bindingOptions, []);
      this.values    = values;
    }
    getBindings(node, bindings, lvls) {
      if (node.nodeType == Node.TEXT_NODE) {
        if ( EXP_REG.test(node.nodeValue) ) {
          bindings.push({lvls, type:'text'} );
        }
      }
      else if (node.attributes) {
        for (let a = 0; a<node.attributes.length; a++) {
          let attr = node.attributes[a];
          if (!EXP_REG.test(attr.name) && !EXP_REG.test(attr.value)) 
            continue
          let attrName = attr.name;
          let nameIndex  = -1;
          let valueIndex = -1;
          
          attr.name.replace(EXP_REG, (a,b)=>{
            nameIndex = b>>0;
            node.removeAttribute( attrName );
            bindings.push({
              lvls, 
              nameIndex, 
              valueIndex,
              name:  attrName, 
              value: attr.value, 
              type:  'attribute'
            });
          });

          attr.value.replace(EXP_REG, (a,b)=>{
            valueIndex = b>>0;
            bindings.push({
              lvls, 
              nameIndex, 
              valueIndex,
              name:  attrName, 
              value: attr.value, 
              type:  'attribute'
            });
          });
          
        }
      }
      if (node.childNodes) {
        for (let i=0; i<node.childNodes.length; i++) {
          let newlvls = JSON.parse(JSON.stringify(lvls));
          newlvls.push( i );
          this.getBindings( node.childNodes[i], bindings, newlvls);
        }
      }
    }
  }


  function html(strings, ...values) {
    let htmlTemplate = templateCache.get(strings);
    if (!htmlTemplate) {
      htmlTemplate = new HTMLTemplate(strings, values);
      templateCache.set(strings, htmlTemplate);
    }
    return {htmlTemplate, values};
  }


  class Component extends HTMLElement {

    get defaultData() {
      return {}
    }
    constructor() {
      super();
      this.data = this.defaultData;
      this.created && this.created();
      if (this.styles) {
        if ( !document.getElementById(this.tagName + '-style') ) {
          this.$componentStyle = document.createElement('style');
          this.$componentStyle.id = this.tagName + '-style';
          this.$componentStyle.setAttribute('id', this.tagName + '-style');
          this.$componentStyle.type = 'text/css';
          this.$componentStyle.innerHTML = this.styles;
          document.getElementsByTagName('head')[0].appendChild(this.$componentStyle);
        }
      }
    }

    fire(eventName, opt) {
      this.dispatchEvent( new CustomEvent(eventName, {detail: opt || null}) );
    }

    connectedCallback() {
      if (this.props) {
        for (let k in this.props) {
          this.hydrateFromAttribute(k);
        }
      }
      this.attached && this.attached();
      this._isConnected = true;
      this._update();
      requestAnimationFrame(()=>{
        this.ready && this.ready();
        if (this.update || this.resize) {
          componentInstances.push(this);
        }
      });
    }

    hydrateFromAttribute(k) {
      if (!this.props[k]) {
        return
      }
      let type = this.props[k];
      if (this.props[k].type) {
        type = this.props[k].type;
      }

      let defaultVal = this.props[k] && this.props[k].default;

      let _k = k.replace(/([A-Z])/g, (g) => `-${g[0].toLowerCase()}`);
      

      let attrName = this.hasAttribute('data-'+_k) ? 'data-'+_k : this.hasAttribute(_k) ? _k : null;

      if (!attrName) {
        if (defaultVal != void 0) {
          this.data[k] = defaultVal;
        }
        return
      }

      let val = this.getAttribute(attrName);

      if (/\$\$[^\$]+\$\$/.test(val)) {
        return
      }

      if (type === Object) {
        try {
          this.data[k] = JSON.parse( val );
        }
        catch(e) {
          console.warn(`<${this.tagName.toLowerCase() + '>  '+this.getAttribute('name')} -  JSON parse error on attribute ${attrName}=${ val }`, e);
        }
        this.setAttribute(attrName, '$$'+k+'$$');
      }
      else if (type === Boolean) {
        this.data[k] = val === 'false' ? false : val === 'true' ? true : (!val?false:true);
      }
      else {
        this.data[k] = type( val );
      }
    }

    attributeChangedCallback(attrName, oldValue, newValue) {
      if (this.props) {
        this.hydrateFromAttribute(attrName);
      }
      this.attributeChanged && this.attributeChanged(attrName, oldValue, newValue);
      this._update();
    }
    
    disconnectedCallback() {
      this.detached && this.detached();
      
      this.innerHTML = '';
      this._isConnected = false;
      
      if (this.update || this.resize) {
        for (let i=0; i<componentInstances.length; i++) {
          let component = componentInstances[i];
          if (component == this) {
            componentInstances.splice(i,1);
            break;
          }
        }
      }
      if (this.template) {
        this.template.destroy();
        this.template = null;
      }
      if (this.$componentStyle) {
        this.$componentStyle.parentNode.removeChild( this.$componentStyle );
      }
    }
    set(data) {
      let hasChanged = false;
      for (let p in data) {
        if (this.data[p] != data[p]) {
          this.data[p] = data[p];
          hasChanged = true;
        }
      }
      hasChanged && this._update();
    }
    _update() {
      if (!this.render) {
        return
      }
      let result = this.render(this.data);
      if (!this.template) {
        this.template = new TemplateInstance(result.htmlTemplate, this);
      }
      else {
        if (this.template.templateTag != result.htmlTemplate.templateTag) {
          this.template.destroy();
          this.template = new TemplateInstance(result.htmlTemplate, this);
        }
      }
      this.template.render(result.values);
      this.afterRender && this.afterRender();
    }
  }
  var componentInstances = [];
  function update(e) {
    requestAnimationFrame( update );
    componentInstances.forEach((component)=>{
      component.update && component.update();
    });
  }
  
  let lastVW = 0;
  let lastVH = 0;
  function resize() {
    if (
        window.forceResize
      || lastVW != window.innerWidth
      || (window.innerWidth >= 768 && lastVH != window.innerHeight) 
    ) {
      componentInstances.forEach((component)=>{
        component.resize && component.resize();
      });
    }
    lastVW = window.innerWidth;
    lastVH = window.innerHeight;
    window.forceResize = false;
  }

  window.addEventListener('resize', resize, false);
  window.addEventListener('orientationchange', resize, false);
  resize();
  update();

/**
 * JavaScript port of Webkit implementation of CSS cubic-bezier(p1x.p1y,p2x,p2y) by http://mck.me
 * http://svn.webkit.org/repository/webkit/trunk/Source/WebCore/platform/graphics/UnitBezier.h
 */
let CubicBezier = (function(){
    var DEFAULT_DURATION = 400;//ms
    var solveEpsilon = function(duration) {
      return 1.0 / (200.0 * duration);
    };
    var unitBezier = function(p1x, p1y, p2x, p2y) {
      var cx = 3.0 * p1x;
      var bx = 3.0 * (p2x - p1x) - cx;
      var ax = 1.0 - cx -bx;
      var cy = 3.0 * p1y;
      var by = 3.0 * (p2y - p1y) - cy;
      var ay = 1.0 - cy - by;
      var sampleCurveX = function(t) {
        return ((ax * t + bx) * t + cx) * t;
      };
      var sampleCurveY = function(t) {
        return ((ay * t + by) * t + cy) * t;
      };
      var sampleCurveDerivativeX = function(t) {
        return (3.0 * ax * t + 2.0 * bx) * t + cx;
      };
      var solveCurveX = function(x, epsilon) {
        var t0,t1,t2,x2,d2,i;
        for (t2 = x, i = 0; i < 8; i++) {
          x2 = sampleCurveX(t2) - x;
          if (Math.abs (x2) < epsilon) {
            return t2;
          }
          d2 = sampleCurveDerivativeX(t2);
          if (Math.abs(d2) < 1e-6) {
            break;
          }
          t2 = t2 - x2 / d2;
        }
        t0 = 0.0;
        t1 = 1.0;
        t2 = x;
        if (t2 < t0) 
          return t0;
        if (t2 > t1) 
          return t1;
        while (t0 < t1) {
          x2 = sampleCurveX(t2);
          if (Math.abs(x2 - x) < epsilon) {
            return t2;
          }
          if (x > x2) {
            t0 = t2;
          } else {
            t1 = t2;
          }
          t2 = (t1 - t0) * 0.5 + t0;
        }
        // Failure.
        return t2;
      };
      var solve = function(x, epsilon) {
        return sampleCurveY(solveCurveX(x, epsilon));
      };
      return function(x, duration) {
        return solve(x, solveEpsilon(+duration || DEFAULT_DURATION));
      };
    };
    return function(p1x, p1y, p2x, p2y, x, duration) {
      return unitBezier(p1x, p1y, p2x, p2y)(x, duration);
    };
})();


class  ScrollObject extends Component {
    get props() {
        return  {
            ratio:     {type: Number, default: 0.1},
            speed:     {type: String, default: 0.5},
            scrollTop: {type: Number, default: 0 },
            scale:     {type: Number, default: 1},
            parallax:  {type:Boolean, default:false},
            stack:  {type:Boolean, default:false},
            scale:  {type:Boolean, default:false},
            fade:  {type:Boolean, default:false},
            ref:  {type:String, default:null},

        }
    }
    created() {
        this.data = {
            y:         0,
            height:    0,
            top:       0,
            currScale: 1,
        };
    }
    detached() {
        this.$scrollManager && this.$scrollManager.removeScrollObject( this );
    }
    attached() {
        let node = this;
        while (node != document.documentElement && node.parentNode) {
            if (node.parentNode.addScrollObject) {
                node.parentNode.addScrollObject( this );
                this.$scrollManager = node.parentNode;
                break;
            }
            node = node.parentNode;
        }
        requestAnimationFrame(()=>{
            this.resize();
        });
    }
    resize() {
        
        let node = this.data.ref ? document.getElementById(this.data.ref) : this;
        
        if (!node) {
            console.log('MISSING REF NODE ?', this, this.data.ref );
            return
        }
        
        this.data.width  = node.clientWidth;
        this.data.height = node.clientHeight;
        this.data.left   = node.offsetLeft;
        this.data.top    = node.offsetTop;

        // if (this.data.ref) {
        //     requestAnimationFrame(()=>{
        //         console.log('REF', this.data.top)
        //     })
        // }

        while (node && node.offsetParent && node.offsetParent != document && node !== document  ) {
            this.data.top += node.offsetParent.offsetTop;
            this.data.left += node.offsetParent.offsetLeft;
            node = node.offsetParent;
        }

    }
    update() {

        let {stack, fade, parallax, scrollTop, top, scale} = this.data;

        if (scrollTop != void 0) {

            if (top - scrollTop < window.innerHeight * 0.9) {
                if (!this.isActive){
                    this.isActive = true;
                    this.classList.add('is-active');
                    // this.querySelector('video') && this.querySelector('video').play()
                }
            }
            else {
                if (this.isActive){
                    this.isActive = false;
                    this.classList.remove('is-active');
                    // this.querySelector('video') && this.querySelector('video').pause()
                }
            }

            
            if ((parallax||scale||fade) 
                && (window.innerWidth > 768 || window.innerWidth > window.innerHeight > 812) ) {
                let s = 1;
                if (parallax) {
                    let y = scrollTop - top;
                    y *= (this.data.ratio || 1);
                    this.data.y += (y - this.data.y) * this.data.speed;
                }
                if (scale || fade) {
                    s = Math.min( 1, Math.max( 0, Math.abs(Math.min(0, top - scrollTop)) / (window.innerHeight * 1.5) ) );
                    s = 1- CubicBezier(0.550, 0.055, 0.675, 0.190, s, 1);
                }
                if (fade) {
                    this.style.opacity = s;
                }
                if (scale) {
                  this.data.currScale += (s - this.data.currScale) * 0.4;
                }
                if (parallax||scale) {
                  this.style.transform  = `translateY(${this.data.y}px) scale(${Math.floor(this.data.currScale * 10000)/10000}) translateZ(0)`;
                }
                this.style.transition = 'none';
            }
            else {
                this.style.removeProperty('transform');
                this.style.removeProperty('transition');
            }

            if (stack ){
                if( top - scrollTop < 0) {
                    !this.isStacked && this.classList.add('is-stacked');
                    this.isStacked = true;
                }
                else {
                    this.isStacked && this.classList.remove('is-stacked');
                    this.isStacked = false;
                }
            }

        }
    }
}

customElements.define('scroll-object', ScrollObject);

class CoreMultiline extends Component {
    get props() {
        return  {
            scrollTop: Number
        }
    }
    created() {
        this.data = {
            scrollTop: 0,
            height:    0,
            top:       0,
         };
    }
    get styles() {
        return `
            core-multiline {
                position: relative;
                display: block;
            }
            core-multiline .mask {
                overflow: hidden;
            }
            core-multiline .line {
                display: block;
                will-change: opacity, transform;
                opacity: 0;
                transform: translateY(100%) translateZ(0);
                animation: 0s cubic-bezier(0.430, 0.195, 0.020, 1.000) 0s forwards line_leave;
            }
            .is-ready .is-active .line {
                transform: translateY(-10%) translateZ(0); 
                animation: 2s cubic-bezier(0.430, 0.195, 0.020, 1.000) 0s forwards line_enter;
            }
            @keyframes line_enter { 
                from { opacity: 0; transform: translateY(100%) rotate(4deg) translateZ(0); } 
                to {   opacity: 1; transform:translateY(-15%) translateZ(0); }  
            }
            @keyframes line_leave { 
                from { opacity: 1; transform:translateY(-15%) translateZ(0) } 
                to {   opacity: 0; transform: translateY(-100%) translateZ(0); } 
            }`
    }
    created() {
        this.direction = -1;
        this.$lines = []; 
        this.words = [];
    }
    ready() {

        let node = this;
        while (node != document.documentElement && node.parentNode) {
            if (node.parentNode.addScrollObject) {
                node.parentNode.addScrollObject( this );
                this.$scrollManager = node.parentNode;
                break;
            }
            node = node.parentNode;
        }

        this.debug = this.hasAttribute('debug');

        this.wordClass = (this.getAttribute('word-class') || 'missing-word-class').split(' ');
        this.lineClass = (this.getAttribute('line-class') || 'line').split(' ');

        this.delay = Number(this.getAttribute('delay')) || 0;
        this.delayOut = Number(this.getAttribute('delay-out')) || 0;
        this.originalContent = this.innerHTML;

        this.contentToWords();

        if (this.words.length == 1 && this.words[0] == "") {
            var observer = new MutationObserver((mutationsList, observer)=>{
                if (this.isResizing) {
                    return
                }
                this.isResizing = true;
                for(var mutation of mutationsList) {
                    if (mutation.type == 'childList') {
                        this.originalContent = this.innerHTML;
                        this.contentToWords();
                        setTimeout(()=>{
                            this.resize();
                        }, 100);
                    }
                }
            });
            observer.observe(this, { childList: true });
        }
        else {
            setTimeout(()=>{
                this.resize();
            }, 100);
        }
    }

    contentToWords() {

        this.innerHTML = '';
        
        this.$wordsWrapper = document.createElement('div'); 
        this.$wordsWrapper.style.opacity = 0;
        this.appendChild(this.$wordsWrapper);

        this.$linesWrapper = document.createElement('div');
        this.$linesWrapper.style.position = 'absolute';
        this.$linesWrapper.style.width = '100%';
        this.$linesWrapper.style.left = 0;
        this.$linesWrapper.style.top = 0;
        this.appendChild(this.$linesWrapper);

        this.words = this.originalContent
                            .replace(/\<\s?br\s?\/?\s?\>/g,' br ')
                            .replace(/\<\s?sup\s?\/?\s?\>/g,' [sup] ')
                            .replace(/\<\s?\/\s?sup\s?\/?\s?\>/g,' [/sup] ')
                            .trim().split(' ');

        this.$words  = [];        
        this.wordPos = [];
        this.$wordsWrapper.innerHTML = '';
        //first, wrap each words in a span and add it to the DOM 

        let isInSup = false;
        for (let i=0; i<this.words.length; i++) {
            let $word;
            if ( this.words[i].trim() == "br") {
                $word = document.createElement('br');
            }
            else if (this.words[i].trim() == "[sup]") {
                isInSup = true;
                continue;
            }
            else if (this.words[i].trim() == "[/sup]") {
                isInSup = false;
                continue;
            }
            else {
                $word = document.createElement( isInSup ? 'sup' : 'span');
                $word.style.display = 'inline-block';
                $word.innerHTML = this.words[i].trim();
            }
            this.$words.push( $word );
            this.$wordsWrapper.appendChild( $word );
            this.$wordsWrapper.appendChild( document.createTextNode(" ") );
        }
        
    }

    setDirection(direction) {
        this.direction = direction;
        this.onDirectionChange();
    }
    onDirectionChange() {
        this.style.opacity = 1;
        this.$lines.forEach(($line, index)=>{
            let mult = this.direction == -1 ? (index+1) * 0.15 + this.delay :  (this.$lines.length - (index)) * 0.1 + this.delayOut;
            // $line.style.transitionDelay = ( mult ) + 's'
            $line.style.animationDelay = ( mult ) + 's';
        });
    }
    resize() {

        this.data.top = this.offsetTop;
        let node = this;
        while (node && node.offsetParent && node.offsetParent != document && node !== document && document !== node.offsetParent ) {
            this.data.top += node.offsetParent.offsetTop;
            node = node.offsetParent;
        }
        
        this.$lines = [];
        this.$masks = [];

        if (!this.$words) {
            return
        }

        //now retirve all word positions
        for (let i=0; i<this.$words.length; i++) {
            this.wordPos[i] = this.$words[i].offsetTop;
        }

        this.$linesWrapper.innerHTML = '';
        this.$linesWrapper.style.fontSize = 0;
        this.$linesWrapper.style.lineHeight = 0;

        let lastTop = 0;
        let $mask = document.createElement('span');
        $mask.classList.add('mask');
        $mask.style.display = 'block';
        $mask.style.position = 'relative';
        let $line = document.createElement('span');
        $line.style.display = 'inline-block';
        $line.style.position = 'relative';
        $line.classList.add.apply($line.classList, this.lineClass);
        $line.classList.add.apply($line.classList, this.wordClass);
        this.$lines.push( $line );
        $mask.appendChild( $line );
        this.$linesWrapper.appendChild( $mask );

        let isInSup = false;
        for (let i=0; i<this.words.length; i++) {
            let $word;
            if (this.words[i].trim() == "" || this.words[i].trim() == "&nbsp;") {
                continue;
            }
            else if (this.words[i].trim() == "[sup]") {
                isInSup = true;
                continue;
            }
            else if (this.words[i].trim() == "[/sup]") {
                isInSup = false;
                continue;
            }
            else if ( this.words[i].trim() == "br") {
                $line.appendChild( document.createTextNode(' ') );
                continue;
                // $word = document.createElement('span');
                // $word.style.display = 'block';//fake <BR>
            }
            else {
                $word = document.createElement(isInSup ? 'sup' : 'span');
                $word.style.display = 'inline-block';
                $word.innerHTML = this.words[i].trim();
            }
            $word.style.position = 'relative';
            $line.appendChild($word);
            $line.appendChild( document.createTextNode(' ') );

            let t = this.wordPos[i];

            if (t > lastTop) {

                $line.removeChild( $line.lastChild );//remove the space
                $line.removeChild($word);

                $mask = document.createElement('span');
                $mask.classList.add('mask');
                $mask.style.display = 'block';
                $mask.style.position = 'relative';
                $line = document.createElement('span');
                $line.style.display = 'inline-block';
                $line.style.position = 'relative';
                $line.classList.add.apply($line.classList, this.lineClass);
                $line.classList.add.apply($line.classList, this.wordClass);
                $line.appendChild($word);
                $line.appendChild( document.createTextNode(' ') );
                $mask.appendChild( $line );
                this.$linesWrapper.appendChild( $mask );
                this.$lines.push( $line );
                lastTop = t;
                continue
            }
            lastTop = t;
        }
        this.onDirectionChange();
    }    
    update() {
        if (this.data.scrollTop != void 0) {
            if (this.data.top - this.data.scrollTop < window.innerHeight * 0.9) {
                if (!this.isActive){
                    this.isActive = true;
                    this.classList.add('is-active');
                }
            }
            else {
                if (this.isActive){
                    this.isActive = false;
                    this.classList.remove('is-active');
                }
            }
        }
    }
}

customElements.define('core-multiline', CoreMultiline);

class PageBlock extends Component {
    get props() {
      return {
        content: Object,
        name:    String,
      }
    }
    static get observedAttributes() {
        return ["content", "name"]
    }
    render() {
        let {content, globalContent, name} = this.data;

        if (name) {
            if ( !/^\$\$[0-9]+\$\$$/.test(name.trim()) 
                && name != this.data.lastName) {
                this.innerHTML = '';
                this.$component = document.createElement( name );
                this.appendChild(this.$component);
                this.data.lastName = name;
            }
        }
        if (this.$component && content) {
            if (this.$component.set) {
                this.$component.set({ content });
            }
            else {
                this.$component.setAttribute('content', typeof content === 'object' ? JSON.stringify(content) : content);
            }
        }
        return html``
    }
  }

  customElements.define('page-block', PageBlock);

class RollNumber extends Component {
    get props() {
        return  {
            number: Number,
            numberClass: String
        }
    }
    get styles() {
        return `
            roll-number {
                display: inline-block;
                position: relative;
                font-size: 0;
            }`
    }

    created() {
        this.data = {
            currAngle: 0,
            currAngle2: 0,
            step: Math.PI*2/10,
            angle: 0,
            parts: [0,1],
            roll:  [0,1,2,3,4,5,6,7,8,9]
        };
    }

    update() {
        let {number} = this.data;
        if (number === void 0 || number === null) {
            return
        }
        let number10 =  Math.floor(number / 10);
        this.data.currAngle  += ( ((number10 / 10 ) * (Math.PI*2))  - this.data.currAngle) * 0.1;
        this.data.currAngle2 += ( (number / 10) * (Math.PI*2)  - this.data.currAngle2) * 0.1;
        this._update();
    }   
 
    render() {
        let {currAngle,currAngle2,step, numberClass} = this.data;
        return html`
            <div>
                ${ this.data.parts.map( (part, i) => {
                    let angle = (i == 0 ? currAngle : currAngle2);
                    return html`
                        <span class="rel mask iblock">

                            <div class="abs l:0 t:-1px w:fit h:20% index:2" style="background:linear-gradient(180deg, #fff 0%, rgba(255,255,255,0) 100%)"></div>
                            <div class="abs l:0 b:-1px w:fit h:10% index:2" style="background:linear-gradient(0deg, #fff 0%, rgba(255,255,255,0) 100%)"></div>

                            <span class="iblock o:0 ${numberClass}">0</span>

                            ${ this.data.roll.map( (j) => {
                                let localAngle = (angle + j * step);
                                return html`
                                    <span class="iblock abs tl:0 l:50% align:center ${numberClass}"
                                          data-local-angle="${(localAngle) % (Math.PI*2)}" 
                                        style="${{
                                            letterSpacing: 'normal', 
                                            transform:     `translate(-50%, ${ Math.sin( localAngle ) * 200 }%) translateZ(0)`,
                                            opacity:       (localAngle % (Math.PI*2)) > Math.PI/2 && (localAngle % (Math.PI*2)) < Math.PI/2*3 ? 0 : 1
                                        }}">${j== 0 ? 0 : 10-j}</span>`
                            }) }
                        </span>`
                }) }
            </div>`
    }
}

customElements.define('roll-number', RollNumber);

function getPosition (node, scope) {
    var root = scope || document;
    var offsetTop  = node.offsetTop;
    var offsetLeft = node.offsetLeft;
    while (node && node.offsetParent && node.offsetParent != document && node !== root && root !== node.offsetParent ) {
      offsetTop += node.offsetParent.offsetTop;
      offsetLeft += node.offsetParent.offsetLeft;
      node = node.offsetParent;
    }
    return {
      top: offsetTop,
      left: offsetLeft
    };
}

class ScrollManager extends Component {

    created() {
        this._scrollTop        = 0;
        this._currScrollTop    = 0;
        this._themeSwitchers   = [];
        this._headerBlocks     = [];
        this.lastScroll        = Date.now();
        this.$scrollObjects    = [];
        this._onScroll         = this._onScroll.bind(this);
        this.data = {
            smoothScroll: true
        };
    }

    attached() {
        document.removeEventListener('scroll', this._onScroll, false);
        document.addEventListener('scroll', this._onScroll, false);
    }

    ready() {
        // this.$scrollContent     = this.querySelector('[scroll-content]')
        // this.$scrollPlaceholder = this.querySelector('[scroll-placeholder]')
    }

    resize() {

        this.$footer = document.querySelector('[footer]');
        this.footerTop = (this.$footer && getPosition( this.$footer, document ).top) || 100000000;

        this._headerBlocks = [];
        this.$headerBlocks = this.querySelectorAll('[header-block]');


        for (let i=0; i<this.$headerBlocks.length; i++) {
            this._headerBlocks.push({
                el:   this.$headerBlocks[i],
                top:  -1000,
                left: -1000,
                height: 0,
                width: 0,
            });
        }
        for (let i=0; i<this._headerBlocks.length; i++) {
            let p = getPosition( this._headerBlocks[i].el, document );
            this._headerBlocks[i].top = p.top;
            this._headerBlocks[i].left = p.left;
            this._headerBlocks[i].height = this._headerBlocks[i].el.clientHeight;
            this._headerBlocks[i].width = this._headerBlocks[i].el.clientWidth;
        }

        this._themeSwitchers = [];
        this.$themeSwitcher = this.querySelectorAll('[theme]');
        for (let i=0; i<this.$themeSwitcher.length; i++) {
            this._themeSwitchers.push({
                el:  this.$themeSwitcher[i],
                theme: this.$themeSwitcher[i].getAttribute('theme') || 'light',
                top:  -1000,
                left: -1000,
                height: 0,
                width: 0,
            });
        }
        for (let i=0; i<this._themeSwitchers.length; i++) {
            let p = getPosition( this._themeSwitchers[i].el, document );
            this._themeSwitchers[i].top = p.top;
            this._themeSwitchers[i].left = p.left;
            this._themeSwitchers[i].height = this._themeSwitchers[i].el.clientHeight;
            this._themeSwitchers[i].width = this._themeSwitchers[i].el.clientWidth;
        }
        
        this.$scrollObjects.forEach((el)=>{
            el.resize && el.resize();
        });

        // if (this.data.smoothScroll && this.$scrollContent) {
        //     this.$scrollPlaceholder.style.height = this.$scrollContent.clientHeight + 'px';
        // }
        // this.$scrollContent     = this.querySelector('[scroll-content]')
        // this.$scrollPlaceholder = this.querySelector('[scroll-placeholder]')
        
        this._onScroll();

    }

    _onScroll() {
        if (this.preventScroll){
            return
        }
        this.lastScroll = Date.now();
        this._lastScroll = this._scrollTop;
        this._scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    }

    addScrollObject(node) {
        let hasSO = false;
        for (let i=0; i<this.$scrollObjects.length; i++) {
            if (this.$scrollObjects[i] == node) {
                hasSO = true;
                break;
            }
        }
        if (!hasSO) {
            this.$scrollObjects.push( node );
            this.resize();
        }
    }

    removeScrollObject(node) {
        for (let i=0; i<this.$scrollObjects.length; i++) {
            if (this.$scrollObjects[i] == node) {
                this.$scrollObjects.splice(i, 1 );
                break;
            }
        }
        this.resize();
    }
    
    update() {

        // if (this.data.smoothScroll && this.$scrollContent) {
        //     this._currScrollTop += (this._scrollTop - this._currScrollTop) * 0.1;
        //     this.$scrollContent.style.transform = `translateY(${this._currScrollTop * -1}px) translateZ(0)`
        // }
        // else {
            this._currScrollTop = this._scrollTop;
        // }

        this.$scrollObjects.forEach((el)=>{
            el.set({scrollTop: this._currScrollTop });
        });


        if (this.$footer){
            for (let i=0; i<this._headerBlocks.length; i++) {
                let block = this._headerBlocks[i];
                if (this.footerTop - this._currScrollTop < window.innerHeight) {
                    if (block.el.classList.contains('is-dark')){
                        block.el.classList.remove('is-dark');
                        if (window.innerWidth < 768) {
                            block.el.style.visibility = 'hidden';
                            block.el.style.transition = 'none';
                            requestAnimationFrame(()=>{
                                block.el.style.removeProperty('visibility');
                            });
                        }
                    } 
                    if (!block.el.classList.contains('is-pageend')){
                        block.el.classList.add('is-pageend');
                    } 
                }
                else {
                    if (block.el.classList.contains('is-pageend')){
                        block.el.classList.remove('is-pageend');
                    } 
                }
            }
        }
        
        this._themeSwitchers.forEach((el)=>{
            for (let i=0; i<this._headerBlocks.length; i++) {
                let headerTheme = 'light';
                let block = this._headerBlocks[i];
                
                for (let j=0; j<this._themeSwitchers.length; j++) {
                    let switcher = this._themeSwitchers[j];
                    if (switcher.top !== -1000 
                        && switcher.top - this._currScrollTop < (block.top + block.height ) 
                        && switcher.top - this._currScrollTop + switcher.height > block.top + block.height * 0.5
                        && switcher.left < block.left + block.width * 0.5
                        && switcher.left + switcher.width > block.left + block.width * 0.5
                        ) {
                        headerTheme = switcher.theme;
                    }
                }
                if (block.el.lastClass !== headerTheme) {
                    block.el.classList[headerTheme == 'dark' ? 'add':'remove']('is-dark');
                    block.el.lastClass = headerTheme;
                    if (window.innerWidth < 768) {
                        block.el.style.visibility = 'hidden';
                        block.el.style.transition = 'none';
                        requestAnimationFrame(()=>{
                            block.el.style.removeProperty('visibility');
                        });
                    }
                }
            }
        });
        

    }
}

customElements.define('scroll-manager', ScrollManager);

class AppHeader extends Component {
    
    get defaultData() {
        return {
            metanavOpened: false,
        }
    }

    get props() {
        return  {
            content: Object,
            path: String,
            menuopened: {type: Boolean, default: false}
        }
    }

    created() {
        this.onNavItemEnter = this.onNavItemEnter.bind(this);
        this.onMouseLeave   = this.onMouseLeave.bind(this);
        this.toggleMenu     = this.toggleMenu.bind(this);
        this.onSignUpDown   = this.onSignUpDown.bind(this);
    }
    attached() {
        this.addEventListener('mouseleave', this.onMouseLeave);
    }
    detached(){
        this.removeEventListener('mouseleave', this.onMouseLeave);
    }
    onNavItemEnter(e) {
        if (window.innerWidth < 767) return
        this.set( {metanavOpened:  e.currentTarget.hasAttribute('has-metanav')} );
    }
    onMouseLeave(e) {
        this.set( {metanavOpened: false} );
    }
    onSignUpDown() {
        this.fire('signupdown');
    }
    toggleMenu() {
        this.fire('togglemenu');
    }
    render() {

        let { content, metanavOpened, menuopened, path } = this.data;

        return !content ? html``: html`

            <div class="
                | abs tl:0 bg:black50 w:fit h:100vh transform  tween:opacity,1s,easeOut
                | ${`o:${!metanavOpened?0:1}`}">
            </div>

            <div class="
                abs tl:0 bg:#fff fit transform tween:all,1s,easeOut
                ${`shift-y:${!metanavOpened?-100:0}%`} 
                ${`o:${!metanavOpened?0:1}`}">
            </div>

            <header  
                data-path="${path}" 
                class="
                | pointer:none rel 
                | ${metanavOpened?'is-metanav':''}">

                <div header-block 
                    class="
                        p-x:102fx pointer:auto p-y:54fy flex justify:between c:theme items:stretch
                        p-y:47fy@m p-x:6.25%@m items:center@m" >

                        <a href="/"  
                            class="
                                flex items:center just:start
                                z:3 ibock pointer:auto o:0 transform shift-y:-100% prop:transform,opacity!
                                anim-in:o:1 anim-in:shift-y:0 anim-in:tween:all,1.8s,0.6s,easeOut
                                ${menuopened?'c:#000!':''}"
                            aria-label="Home">
                            <span aria-hidden="true" class="iblock tween:opacity,0.6s,easeOut" >
                                <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    viewBox="0 0 248.697 36.857"
                                    class="
                                        w:1.5c fill:currentColor
                                        w:125px@m
                                        tween:all,0.6s,easeOut">
                                    <g transform="matrix(1.33333 0 0 -1.33333 0 36.857)">
                                        <path d="M18.456 3.767c0-1.038-.423-1.98-1.106-2.66A3.758 3.758 0 0014.688 0H3.768A3.777 3.777 0 000 3.767c0 .817.26 1.578.708 2.193a3.712 3.712 0 01-.543-1.947c0-1.264.63-2.508 1.786-3.216a3.782 3.782 0 015.184 1.232l3.392 5.505h4.16a3.777 3.777 0 003.767-3.767" fill="#f9c110"/><path d="M16.837 27.595c-.132.023-.265.03-.397.04.133-.007.266-.02.397-.04" fill="#94bee0"/><path d="M10.528 7.534L7.135 2.029A3.78 3.78 0 001.952.797 3.764 3.764 0 00.166 4.013c0 .667.173 1.344.543 1.947 0 .004.004.004.004.008.003.004.003.008.007.012.12.16.246.31.387.447a3.755 3.755 0 002.66 1.107z" fill="#f5881f"/><path d="M16.109 16.588l-5.581-9.054H3.767a3.755 3.755 0 01-2.66-1.107A3.785 3.785 0 01.72 5.98l12.254 19.888a3.737 3.737 0 003.023 1.767 3.748 3.748 0 01-1.634-.495 3.773 3.773 0 01-1.376-5.143z" fill="#94bee0"/><path d="M19.945 23.88c0-.676-.178-1.356-.556-1.968l-3.28-5.324-3.122 5.408a3.773 3.773 0 001.376 5.143 3.72 3.72 0 002.475.455 3.6 3.6 0 001.32-.499 3.774 3.774 0 001.787-3.215" fill="#5e6afc"/><path d="M30.31.9a3.703 3.703 0 00-1.872-.503 3.779 3.779 0 00-3.272 1.88L16.11 16.587l3.28 5.324c.378.612.556 1.292.556 1.968a3.774 3.774 0 01-1.787 3.215 3.605 3.605 0 01-1.32.5 3.757 3.757 0 002.672-1.832l12.18-19.72A3.777 3.777 0 0030.31.9" fill="#fc636f"/><path d="M51.322 5.857v17.037h-3.637V2.404h13.479v3.454zM63.879 2.404h3.488v14.745h-3.488zM77.715 11.152l-2.233.46c-.91.173-1.485.748-1.485 1.543 0 .91.875 1.692 2.118 1.692 1.968 0 2.601-1.359 2.728-2.21l2.958.851c-.24 1.451-1.577 4.11-5.686 4.11-3.062 0-5.42-2.175-5.42-4.742 0-2.038 1.357-3.73 3.97-4.305l2.175-.483c1.174-.242 1.727-.853 1.727-1.635 0-.909-.76-1.692-2.21-1.692-1.876 0-2.878 1.174-3.004 2.51l-3.05-.853c.183-1.657 1.818-4.443 6.077-4.443 3.764 0 5.57 2.475 5.57 4.72 0 2.175-1.45 3.878-4.235 4.477M91.459 5.34c-1.302 0-1.877.552-1.877 1.853v6.837h3.063v3.12h-3.063v4.512h-3.176V19.45c0-1.3-.69-2.301-2.268-2.301h-.76v-3.12h2.727V6.617c0-2.762 1.693-4.397 4.42-4.397 1.267 0 1.935.242 2.142.334v2.912a6.915 6.915 0 00-1.209-.126M103.21 10.9l3.212 8.517 3.2-8.518zm5.353 12.338h-4.132L96.235 2.404h3.776l1.956 5.226h8.91l1.99-5.226h3.891zM128.625 7.883c-.334-1.116-1.393-2.716-3.684-2.716-2.22 0-4.12 1.657-4.12 4.627 0 2.97 1.9 4.57 4.052 4.57 2.244 0 3.245-1.45 3.58-2.752l3.142 1.151c-.61 2.36-2.785 4.835-6.745 4.835-4.247 0-7.539-3.269-7.539-7.804 0-4.477 3.292-7.839 7.63-7.839 3.87 0 6.08 2.51 6.781 4.812zM142.22 17.334c-1.935 0-3.569-.944-4.272-2.544v2.36h-3.417V2.405h3.51v7.02c0 2.763 1.242 4.328 3.971 4.328.356 0 .76-.023 1.151-.08v3.568c-.15.023-.518.092-.944.092M151.888 5.098c-2.152 0-4.109 1.634-4.109 4.696s1.957 4.627 4.11 4.627c2.186 0 4.12-1.565 4.12-4.627 0-3.085-1.934-4.696-4.12-4.696m0 12.5c-4.387 0-7.633-3.292-7.633-7.804 0-4.547 3.246-7.839 7.632-7.839 4.42 0 7.666 3.292 7.666 7.84 0 4.511-3.246 7.803-7.666 7.803M168.406 11.152l-2.245.46c-.91.173-1.484.748-1.484 1.543 0 .91.885 1.692 2.128 1.692 1.969 0 2.602-1.359 2.717-2.21l2.97.851c-.242 1.451-1.577 4.11-5.687 4.11-3.061 0-5.42-2.175-5.42-4.742 0-2.038 1.358-3.73 3.958-4.305l2.188-.483c1.174-.242 1.727-.853 1.727-1.635 0-.909-.76-1.692-2.21-1.692-1.877 0-2.878 1.174-3.005 2.51l-3.05-.853c.173-1.657 1.808-4.443 6.077-4.443 3.753 0 5.57 2.475 5.57 4.72 0 2.175-1.45 3.878-4.234 4.477M182.287 11.152l-2.244.46c-.91.173-1.485.748-1.485 1.543 0 .91.886 1.692 2.118 1.692 1.968 0 2.613-1.359 2.728-2.21l2.969.851c-.241 1.451-1.576 4.11-5.697 4.11-3.05 0-5.41-2.175-5.41-4.742 0-2.038 1.358-3.73 3.959-4.305l2.176-.483c1.186-.242 1.727-.853 1.727-1.635 0-.909-.748-1.692-2.21-1.692-1.877 0-2.866 1.174-2.993 2.51l-3.062-.853c.184-1.657 1.819-4.443 6.089-4.443 3.752 0 5.57 2.475 5.57 4.72 0 2.175-1.45 3.878-4.235 4.477M65.584 23.52a2.3 2.3 0 002.3-2.3c0-1.272-1.03-2.272-2.3-2.272-1.242 0-2.272 1-2.272 2.271s1.03 2.301 2.272 2.301" />
                                    </g>
                                </svg>
                            </span>
                        </a>

                        <nav class="
                        flex justify:end items:center
                            | pointer:auto o:0
                            | transform shift-y:-100% prop:transform,opacity!
                            | anim-in:o:1 anim-in:shift-y:0 anim-in:tween:1.8s,0.7s,easeOut
                            | pos:fixed@m bg:#fff@m c:#000@m! 
                            | tween:1.1s,0s,easeOut@m! h:100vh@m d:flex@m w:fit@m
                            | tl:0@m wrap:wrap@m dir:col@m  just:center@m p-l:6.5%@m
                            | items:start@m m-b:30fy@m
                            | ${`o:${menuopened?1:0}@m!`}
                            | ${`pointer:${menuopened?'auto':'none'}@m!`}">

                            <div class="flex justify:end items:center tween:opacity,0.6s,easeOut">

                                <ul class="
                                    | fs:15fx flex justify:end items:center 
                                    | fs:46fx@m wrap:wrap@m c:#000@m! space-y:0.2em@m m-b:1em@m">
                                    
                                    <li class="
                                        | flex justify:end items:center 
                                        | wrap:wrap@m space-y:0.2em@m">

                                        ${ !content.header_nav ? html`` :  content.header_nav.map((link)=>{
                                            return html`
                                                <span class="d:block w:fit@m">
                                                    <a  class="iblock m-r:32fx rel " 
                                                        href="${(link.page || link.url || '').replace(/https\:\/\/[^/]*\//g, '/').replace('/api/', '/')}" 
                                                        ?target="${ link.url ? '_blank' : false }"
                                                        on-mouseenter="${ this.onNavItemEnter }" 
                                                        ?has-metanav="${ link.meta_nav ? true : false }"
                                                        data-link="${ link.page && link.page.replace(/https\:\/\/[^/]*\//g, '/').replace(/\/$/,'').replace('/api/', '/') == path  }"
                                                        data-path="${ path  }">
                                                        <span class="
                                                            | tween:transform,0.6s,easeOut
                                                            | abs b:-4px l:0 w:fit h:1px bg:currentColor iblock origin:0,0 transform scale-x:0 
                                                            | (:hover > &):scale-x:1
                                                            | ${ link.meta_nav ? 'd:none' : '' }
                                                            | ${ link.page && link.page.replace(/https\:\/\/[^/]*\//g, '/').replace(/\/$/,'').replace('/api/', '/') == path ? 'scale-x:1' : '' }">
                                                        </span>
                                                        <span class="rel tween:all,0.6s,easeOut">
                                                            ${link.title}
                                                        </span>
                                                    </a>
                                                </span>`
                                        }) }
                                    </div>

                                    <button aria-hidden="true" @click="${ this.onSignUpDown }"
                                        class="d:none | d:block@m w:fit@m fs:46fx@m c:#000@m!">
                                        <div role="button" class="iblock bg:none rel">
                                            <span class="rel tween:all,0.6s,easeOut">
                                                Sign Up
                                            </span>
                                        </div>
                                    </button>
                                </ul>
                                
                                <button @click="${ this.onSignUpDown }"
                                      class="
                                        | cursor:pointer rel lh:1.05 fs:16fx iblock  radius:100px p-y:25fy p-x:0.35c max-w:2c
                                        | c:#fff! hover:c:#000! bg:none
                                        | (.is-dark &):c:#fff! (.is-dark &:hover):c:#000!
                                        | d:none@m">

                                    <span aria-hidden="true"  class="
                                        | abs tl:0 fit iblock radius:100px border:solid,2px,blue bg:blue c:#fff
                                        | (:hover > &):bg:#fff (:hover > &):bc:black10 (:hover > &):c:#000
                                        | (.is-dark &):bg:none  (.is-dark &):bc:white20! (.is-dark :hover > &):bc:#fff!
                                        | tween:all,0.6s,easeOut">
                                    </span>
                                

                                    <!-- white circle -->
                                    <div class="abs tl:0 fit radius:300px bg:#fff o:0 anim-in:tween:0.5s,easeOut (button:hover &):o:1"></div>
                                        
                                    <!-- border -->
                                    <span class="(.is-dark &):o:0! radius:100px abs fit tl:0 block border:solid,2px,#d7d7d7 o:0 (button:hover &):o:1 anim-in:tween:opacity,0.6s,easeOut"></span>

                                    
                                    <span class="rel tween:all,0.6s,easeOut">Sign Up</span>
                                </button>

                            </div>
                        </nav>
                                
                        <div class="
                            | iblock rel z:3 d:none tween:opacity,0.6s,easeOut
                            | d:block@m">
                            <button 
                                @click="${this.toggleMenu}"
                                aria-label="${menuopened?'close menu':'open menu'}"
                                class="c:theme w:30px bg:none
                                    ${menuopened?'c:#000!':''}">
                                <span class="block bg:currentColor h:1px m-b:6px"></span>
                                <span class="block bg:currentColor h:1px"></span>
                            </button>
                        </div>

                </div>

                <div class="
                    p-x:102fx p-x:6.25%@m tween:all,1s,easeOut  
                    ${!metanavOpened?'pointer:none':'pointer:auto'}
                    ${metanavOpened?'o:1':'o:0'} 
                    d:none@m">

                    <hr class="
                        d:none bg:#ccc m-b:90fy h:3px origin:0,0 tween:all,1s,easeOut
                        transform scale-y:0.5
                        ${`scale-x:${metanavOpened?1:0}`}  
                        ${`tween-delay:${metanavOpened?0.1:0}s`}"/>

                    <div class="flex items:start just:start p-b:150fy">

                        ${ content.header_nav && content.header_nav.map( link =>{
                            return !link.meta_nav ? html`` : html`${link.meta_nav.map((metaSection,j)=>{
                                return html`
                                    <div class="
                                        | w:25% p-l:32fx">
                                        <h3 class="
                                            | rel fs:0 m-b:60fy block transform 
                                            | ${`(.is-ready &):tween:all,1s,${metanavOpened?(0.3+j*0.1):0}s,easeOut`}
                                            | ${`shift-y:${!metanavOpened?10:0}vh`}  
                                            | ${`o:${!metanavOpened?0:1}`}">
                                            <span class="
                                                | abs r:100% t:50% m-r:15fx transform shift-y:-50% 
                                                | w:15px fs:0 iblock align-y:middle circle before before:p-t:100% 
                                                | ${'bg:'+metaSection.color}">
                                            </span>
                                            <span class="fs:24fx fw:500 iblock rel align-y:middle">
                                                <span class="abs bl:0 w:fit h:2px bg:currentColor iblock"></span>
                                                <span class="rel">
                                                    ${metaSection.title}
                                                </span>
                                            </span>
                                        </h3>
                                        <ul>
                                            ${ !metaSection.links ? html``: metaSection.links.map( (metalink, metaIndex) => {

                                                let $comingSoon = !metalink.page&&!metalink.url ? html`
                                                    <span class="abs nowrap w:fit tl:0 bg:#fff fit iblock tween:opacity,0.6s,easeOut o:0 (a:hover>&):o:1">
                                                        Coming Soon
                                                    </span>`:html``;
                                                    
                                                return html`
                                                    <li class="
                                                        | m-b:30fy transform 
                                                        | ${`(.is-ready &):tween:all,1s,${metanavOpened?(0.3+(j+metaIndex)*0.1):0}s,easeOut`} 
                                                        | ${`shift-y:${!metanavOpened?10:0}vh`}  
                                                        | ${`o:${!metanavOpened?0:1}`}">
                                                        <a ?href="${(metalink.page||metalink.url).replace(/https\:\/\/[^/]*\//g, '/')}" 
                                                            ?target="${metalink.url?'_blank':false}"
                                                            class="
                                                                | rel fs:16fx 
                                                                | ${(!metalink.page&&!metalink.url)?'c:#b7b7b7':''}">
                                                            ${ metalink.title }
                                                            ${ $comingSoon }
                                                        </a>
                                                    </li>`
                                            }) }
                                        </ul>
                                    </div>`
                            }) }`
                        }) }
                    </div>
                </div>

            </header>`
    }
}

customElements.define('app-header', AppHeader);

// <p class="
// c:grey fs:14fx lh:1.785 m-b:53fy d:none@m">
// 77 Washington Ave. 4th Floor, Brooklyn, NY 11025
// </p>

// <p class="d:none c:grey fs:14fx lh:1.785
// d:block@m w:163fx@m fs:10fx@m m-b:27fy@m">
// 77 Washington Ave. 4th Floor, Brooklyn,<br>NY<br>11025
// </p>

class AppFooter extends Component {
    get props() {
        return  {
            content: Object,
        }
    }
    onNewsletterSubmit(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.reset();
        this.set({newsletterSuccess: true});
    }
    render(data) {
        let {content, newsletterSuccess} = this.data;
        return !content ? html`` : html`
            <footer footer 
                    class="
                        w:fit p-x:103fx c:light bg:dark p-b:40fy p-t:50fy 
                        p-t:38fy@m p-x:6.25%@m">
                <div class=
                        "m-b:118fy flex items:start just:between wrap:wrap 
                        m-b:60fy@m">
                    <div class="w:fit@m d:flex@m just:between@m">
                        <a href="/" 
                            class="
                                block m-b:60fy 
                                m-b:27fy@m">
                            <svg class="w:150fx w:100fx@m  " xmlns="http://www.w3.org/2000/svg" viewBox="0 0 248.697 36.857"><g transform="matrix(1.33333 0 0 -1.33333 0 36.857)"><path d="M18.456 3.767c0-1.038-.423-1.98-1.106-2.66A3.758 3.758 0 0014.688 0H3.768A3.777 3.777 0 000 3.767c0 .817.26 1.578.708 2.193a3.712 3.712 0 01-.543-1.947c0-1.264.63-2.508 1.786-3.216a3.782 3.782 0 015.184 1.232l3.392 5.505h4.16a3.777 3.777 0 003.767-3.767" fill="#f9c110"/><path d="M16.837 27.595c-.132.023-.265.03-.397.04.133-.007.266-.02.397-.04" fill="#94bee0"/><path d="M10.528 7.534L7.135 2.029A3.78 3.78 0 001.952.797 3.764 3.764 0 00.166 4.013c0 .667.173 1.344.543 1.947 0 .004.004.004.004.008.003.004.003.008.007.012.12.16.246.31.387.447a3.755 3.755 0 002.66 1.107z" fill="#f5881f"/><path d="M16.109 16.588l-5.581-9.054H3.767a3.755 3.755 0 01-2.66-1.107A3.785 3.785 0 01.72 5.98l12.254 19.888a3.737 3.737 0 003.023 1.767 3.748 3.748 0 01-1.634-.495 3.773 3.773 0 01-1.376-5.143z" fill="#94bee0"/><path d="M19.945 23.88c0-.676-.178-1.356-.556-1.968l-3.28-5.324-3.122 5.408a3.773 3.773 0 001.376 5.143 3.72 3.72 0 002.475.455 3.6 3.6 0 001.32-.499 3.774 3.774 0 001.787-3.215" fill="#5e6afc"/><path d="M30.31.9a3.703 3.703 0 00-1.872-.503 3.779 3.779 0 00-3.272 1.88L16.11 16.587l3.28 5.324c.378.612.556 1.292.556 1.968a3.774 3.774 0 01-1.787 3.215 3.605 3.605 0 01-1.32.5 3.757 3.757 0 002.672-1.832l12.18-19.72A3.777 3.777 0 0030.31.9" fill="#fc636f"/><path d="M51.322 5.857v17.037h-3.637V2.404h13.479v3.454zM63.879 2.404h3.488v14.745h-3.488zM77.715 11.152l-2.233.46c-.91.173-1.485.748-1.485 1.543 0 .91.875 1.692 2.118 1.692 1.968 0 2.601-1.359 2.728-2.21l2.958.851c-.24 1.451-1.577 4.11-5.686 4.11-3.062 0-5.42-2.175-5.42-4.742 0-2.038 1.357-3.73 3.97-4.305l2.175-.483c1.174-.242 1.727-.853 1.727-1.635 0-.909-.76-1.692-2.21-1.692-1.876 0-2.878 1.174-3.004 2.51l-3.05-.853c.183-1.657 1.818-4.443 6.077-4.443 3.764 0 5.57 2.475 5.57 4.72 0 2.175-1.45 3.878-4.235 4.477M91.459 5.34c-1.302 0-1.877.552-1.877 1.853v6.837h3.063v3.12h-3.063v4.512h-3.176V19.45c0-1.3-.69-2.301-2.268-2.301h-.76v-3.12h2.727V6.617c0-2.762 1.693-4.397 4.42-4.397 1.267 0 1.935.242 2.142.334v2.912a6.915 6.915 0 00-1.209-.126M103.21 10.9l3.212 8.517 3.2-8.518zm5.353 12.338h-4.132L96.235 2.404h3.776l1.956 5.226h8.91l1.99-5.226h3.891zM128.625 7.883c-.334-1.116-1.393-2.716-3.684-2.716-2.22 0-4.12 1.657-4.12 4.627 0 2.97 1.9 4.57 4.052 4.57 2.244 0 3.245-1.45 3.58-2.752l3.142 1.151c-.61 2.36-2.785 4.835-6.745 4.835-4.247 0-7.539-3.269-7.539-7.804 0-4.477 3.292-7.839 7.63-7.839 3.87 0 6.08 2.51 6.781 4.812zM142.22 17.334c-1.935 0-3.569-.944-4.272-2.544v2.36h-3.417V2.405h3.51v7.02c0 2.763 1.242 4.328 3.971 4.328.356 0 .76-.023 1.151-.08v3.568c-.15.023-.518.092-.944.092M151.888 5.098c-2.152 0-4.109 1.634-4.109 4.696s1.957 4.627 4.11 4.627c2.186 0 4.12-1.565 4.12-4.627 0-3.085-1.934-4.696-4.12-4.696m0 12.5c-4.387 0-7.633-3.292-7.633-7.804 0-4.547 3.246-7.839 7.632-7.839 4.42 0 7.666 3.292 7.666 7.84 0 4.511-3.246 7.803-7.666 7.803M168.406 11.152l-2.245.46c-.91.173-1.484.748-1.484 1.543 0 .91.885 1.692 2.128 1.692 1.969 0 2.602-1.359 2.717-2.21l2.97.851c-.242 1.451-1.577 4.11-5.687 4.11-3.061 0-5.42-2.175-5.42-4.742 0-2.038 1.358-3.73 3.958-4.305l2.188-.483c1.174-.242 1.727-.853 1.727-1.635 0-.909-.76-1.692-2.21-1.692-1.877 0-2.878 1.174-3.005 2.51l-3.05-.853c.173-1.657 1.808-4.443 6.077-4.443 3.753 0 5.57 2.475 5.57 4.72 0 2.175-1.45 3.878-4.234 4.477M182.287 11.152l-2.244.46c-.91.173-1.485.748-1.485 1.543 0 .91.886 1.692 2.118 1.692 1.968 0 2.613-1.359 2.728-2.21l2.969.851c-.241 1.451-1.576 4.11-5.697 4.11-3.05 0-5.41-2.175-5.41-4.742 0-2.038 1.358-3.73 3.959-4.305l2.176-.483c1.186-.242 1.727-.853 1.727-1.635 0-.909-.748-1.692-2.21-1.692-1.877 0-2.866 1.174-2.993 2.51l-3.062-.853c.184-1.657 1.819-4.443 6.089-4.443 3.752 0 5.57 2.475 5.57 4.72 0 2.175-1.45 3.878-4.235 4.477M65.584 23.52a2.3 2.3 0 002.3-2.3c0-1.272-1.03-2.272-2.3-2.272-1.242 0-2.272 1-2.272 2.271s1.03 2.301 2.272 2.301" fill="#fff"/></g></svg> 
                        </a>
                        
                      

                        <div class="rel w:310fx | d:none@m">
                            <h4 class="fs:16fx lh:1.55 m-b:48fy c:#7d7d7d | m-b:35fy@m">
                                Newsletter
                            </h4>
                            <form @submit="${ e => { this.onNewsletterSubmit(e); } }"class="flex items:center just:between b-b:solid,1px,#8f8a86">
                                <input 
                                    class="bg:none fs:24fx lh:2.08 c:light placeholder:c:light (&:focus::placeholder):c:dark! (&::placeholder):tween:all,0.4s,easeOut" 
                                    placeholder="Email Address" 
                                    />
                                <button class="rel grow:0 fill:#707070 bg:none hover:fill:yellow (&:hover):rotate:45deg rotate:0deg transform tween:all,0.4s,easeOut">
                                    <svg class="w:13px h:21px transform rotate:-135deg shift-y:20%" 
                                            xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21.333 32.801"><path d="M9.334 11.468v16.266L1.867 20.27 0 22.134l10.667 10.667 10.667-10.667-1.867-1.865L12 27.734V11.468z"/><path d="M9.333 11.89H12V0H9.333z"/></svg>
                                    <svg class="abs tl:0 w:13px h:21px transform rotate:-135deg shift-y:20%" 
                                            xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21.333 32.801"><path d="M9.334 11.468v16.266L1.867 20.27 0 22.134l10.667 10.667 10.667-10.667-1.867-1.865L12 27.734V11.468z"/><path d="M9.333 11.89H12V0H9.333z"/></svg>
                                </button>
                            </form>
                        </div>
                    </div>
                    <div class="
                            w:fit@m d:flex@m just:between@m items:start@m p-t:30fy@m">
                        <div class="
                                flex justify:between items:center w:310fx m-b:60fy 
                                w:260fx@m">
                            <span 
                                class="
                                    c:#7d7d7d iblock m-r:32fx fs:16fx 
                                    fs:14fx@m">
                                Get started
                            </span>
                            <div class="
                                    space-x:7fx fs:0 
                                    display:none@m">
                                <span aria-hidden="true" class="iblock w:16fx circle bg:pink after after:p-t:100%"></span>
                                <span aria-hidden="true" class="iblock w:16fx circle bg:blue after after:p-t:100%"></span>
                                <span aria-hidden="true" class="iblock w:16fx circle bg:yellow after after:p-t:100%"></span>
                            </div>
                        </div>
                        <ul class="w:310fx fs:16fx space-y:1.3em lh:1.25 
                                   w:260fx@m fs:14fx@m space-y:1.5em@m">

                            ${ content.footer_nav && content.footer_nav.map((link)=>{
                                return html`
                                    <li>
                                        <a href="${ (link.page || link.url) }" ?target="${link.url?'_blank':false}" class="rel">
                                            ${ link.title }
                                            <span class="
                                                tween:transform,0.6s,easeOut
                                                abs bl:0 w:fit h:1px bg:currentColor iblock origin:0,0 transform scale-x:0 (:hover > &):scale-x:1
                                                ">
                                            </span>
                                        </a>
                                    </li>`
                            }) }

                        </ul>
                    </div>
                </div>

                <div class="
                        d:none 
                        d:block@m m-b:77fy@m">
                    <h4 class="
                            fs:16fx lh:1.55 c:#7d7d7d
                            fs:12fx@m m-b:26fy@m">
                        Newsletter
                    </h4>
                    <form class="flex items:center  just:between b-b:solid,1px,#8f8a86">
                        <input 
                            placeholder="Email Address" 
                            class="
                                bg:none fs:24fx lh:2.08 
                                fs:22fx@m"/>
                        <button class="grow:0 fill:#707070 bg:none hover:fill:yellow">
                            <svg class="w:13px h:21px transform rotate:-135deg shift-y:20%" 
                                    xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21.333 32.801"><path d="M9.334 11.468v16.266L1.867 20.27 0 22.134l10.667 10.667 10.667-10.667-1.867-1.865L12 27.734V11.468z"/><path d="M9.333 11.89H12V0H9.333z"/></svg>
                        </button>
                    </form>
                </div>

                <nav class="
                        w:310fx fs:16fx lh:1.25 m-b:110fy space-x:18px m-b:31fy 
                        space-x:15fx@m">
                    ${ content.social_nav && content.social_nav.map((link)=>{
                        return html`
                            <a href="${(link.page || link.url || '') }"
                                 target="_blank" class="o:0.5 hover:o:1 tween:opacity,0.6s,easeOut">
                                <img class="w:15px" src="${link.image && link.image.url}">
                            </a>`
                    }) }
                </nav>

                <hr class="
                        b-b:solid,1px,grey m-b:40fy 
                        m-b:15fy@m"/>
                
                <div class="flex justify:between m-b:110fy">
                    <p class="
                            (& br):display:none
                            (& br):display:block@m
                            fs:12fx 
                            fs:10fx@m lh:3.4@m">
                        © 2021 ListAcross. All Rights Reserved.<br/> Accelerated by <a href="https://www.ouiwill.com">Oui Will</a>
                    </p>
                    <nav class="
                            flex just:between items:center w:310fx fs:12fx 
                            fs:10fx@m lh:3.4@m d:block@m w:auto@m wrap:wrap@m">

                        ${ content.footer_second_nav && content.footer_second_nav.map((link)=>{
                            return html`
                                <a class="d:block@m w:fit@m rel o:0.5 hover:o:1 tween:opacity,0.6s,easeOut" 
                                    href="${ (link.page || link.url || '').replace(/https\:\/\/[^/]*\//g, '/').replace('/api/', '/') }">
                                    <span class="
                                        tween:transform,0.6s,easeOut
                                        abs bl:0 w:fit h:1px bg:currentColor iblock origin:0,0 transform scale-x:0 (:hover > &):scale-x:1">
                                    </span>
                                    ${link.title}
                                </a>`
                        }) }

                    </nav>
                </div>
            </footer>`
    }
}

customElements.define('app-footer', AppFooter);

class CircleRange extends Component {
    get props() {
        return  {
            number: Number,
            min: Number,
            max: Number,
        }
    }
    get styles() {
        return `
            circle-range {
                display: block;
                width: 100%;
                --rangeBtnSize: 54px;
            }
            circle-range:after {
                content: ""; 
                padding-top: 100%; 
                display: block;
            }
            circle-range > button {
                box-shadow: 0px 0px 15px rgba(0,0,0,0.25);
                position: absolute;
                top:  calc( var(--rangeBtnSize) / -2 ); 
                left: calc( var(--rangeBtnSize) / -2 );
                border-radius: 100%;
                width: var(--rangeBtnSize); 
                height: var(--rangeBtnSize);
                background: #fff;
                display: flex;
                align-items:center;
                justify-content:center;
            }
            circle-range > button:before {
                content: "";
                display:block;
                height: 10px; width: 10px;
                background: #5f7fd3;
                border-radius:100px;
            }
            circle-range > svg {
                position: absolute;
                top: calc( var(--rangeBtnSize) / 2 ); 
                left: calc( var(--rangeBtnSize) / 2 );
                width: calc(100% - (var(--rangeBtnSize) / 2) * 2); height: calc(100% - (var(--rangeBtnSize) / 2) * 2);
            }`
    }
    created() {
        this.data = {
            height: 0,
            width:  0,
            top:    0,
            left:   0,
            x: 0,
            y: 0,
            angle: (0.92 * Math.PI*2) - Math.PI,
            progress: 0,
        };
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
    }
    attached() {
        document.addEventListener('mousemove', this.onMouseMove, false);
        document.addEventListener('mouseup', this.onMouseUp, false);
        document.addEventListener('touchmove', this.onMouseMove, {passive:false});
        document.addEventListener('touchend', this.onMouseUp, false);
        this.resize();
    }
    ready() {
        setTimeout(()=>{
            this.resize();
        }, 1000);
    }
    detached() {        
        document.addEventListener('mousemove', this.onMouseMove, false);
        document.addEventListener('mouseup', this.onMouseUp, false);
        document.addEventListener('touchmove', this.onMouseMove);
        document.addEventListener('touchend', this.onMouseUp);
    }
    resize() {
        this.data.height = this.clientHeight;
        this.data.width  = this.clientWidth;
        this.data.top    = this.offsetTop;
        this.data.left   = this.offsetLeft;
        let node         = this;
        while (node && node.offsetParent && node.offsetParent != document && node !== document ) {
            this.data.top += node.offsetParent.offsetTop;
            this.data.left += node.offsetParent.offsetLeft;
            node = node.offsetParent;
        }
        this.updateButtonPosition();
    }
    onMouseDown(e) {
        this.isPointerDown = true;
    }
    onMouseUp(e) {
        if (this.isPointerDown) {
            e.preventDefault();
            e.stopPropagation();
        }
        this.isPointerDown = false;
    }
    onMouseMove(e) {

        if (!this.isPointerDown) return

        e.preventDefault();
        e.stopPropagation();

        let evt = e.touches || e.changedTouches ? (e.touches[0] || e.changedTouches[0] ) : e;
        let centerX = this.data.width/2;
        let centerY = this.data.height/2;

        let localX = evt.pageX - this.data.left;
        let localY = evt.pageY - this.data.top;

        let angle = (Math.atan2(localY - centerY, localX - centerX) ) % Math.PI;

        let ratio = (angle + Math.PI) / (Math.PI*2);

        //min/max
        if (ratio < 0.92 && ratio > 0.58) {
            ratio = (ratio-0.58) / (0.92 - 0.58) < 0.5 ? 0.58 : 0.92;
        }
        
        this.data.progress = ratio > 0.58 ? (ratio-0.92) / (0.58 + (1-0.92)) : (ratio + (1-0.92)) / (0.58 + (1-0.92)) ;
        this.dispatchEvent( new CustomEvent('change', { detail: { progress: this.data.progress } }) );
        
        this.data.angle = (ratio * Math.PI*2) - Math.PI;
        
        this.updateButtonPosition();
    }
    
    updateButtonPosition() {
        let centerX = this.data.width/2;
        let centerY = this.data.height/2;
        let x = centerX + Math.cos( this.data.angle ) * (this.data.width/2 - 27);
        let y = centerY + Math.sin( this.data.angle ) * (this.data.width/2 - 27);
        this.set({x,y});
    }

    render() {
        let {x,y,progress} = this.data;


    
        return html`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 916 916">
            
                <mask id="myMask">
                    <rect x="0" y="0" width="916" height="916" fill="black" />
                    <circle cx="458" cy="458" r="448" fill="none" stroke-width="23" stroke="white" stroke-dasharray="2820" stroke-dashoffset="${ 2820 - 2820*0.66*progress }" transform="rotate(150 458 458)"></circle>
                </mask>

                <mask id="myMask2">
                    <rect x="0" y="0" width="916" height="916" fill="black" />
                    <circle cx="458" cy="458" r="448" fill="none" stroke-width="23" stroke="white" stroke-dasharray="2820" stroke-dashoffset="${ 2820 - 2820*0.66 }" transform="rotate(150 458 458)"></circle>
                </mask>
        
                <circle mask="url(#myMask2)" cx="458" cy="458" r="448" fill="none" stroke-width="23" stroke="#e5e5e5" stroke-dasharray="4 11.5" ></circle>
                <circle mask="url(#myMask)" cx="458" cy="458" r="448" fill="none" stroke-width="23" stroke="#5f7fd3" stroke-dasharray="4 11.5" ></circle>
    
            </svg>
            <button span
                class="index:3" 
                on-pointerdown="${ this.onMouseDown }" 
                style="${{
                    transform: `translate(${x}px,${y}px) translateZ(0)`
                }}">
            </button>`
    }
}

customElements.define('circle-range', CircleRange);

class AppLoader extends Component {
    
    get props() {
        return  {
            content: Object,
            active:  Boolean,
            reset:   Boolean,
        }
    }

    render() {
        let {active, content, reset} = this.data;
        return !content ? html``: html`
            <div class="transform 
                ${reset?'':`tween:transform,1.3s,0.15s,easeOut2 `}
                ${`shift-y:${reset?100:active?0:-100}%`}">
                <div class="
                    h:100vh bg:dark transform  
                      bg:#191819@m
                    ${reset?'':`tween:transform,1.4s,easeOut2`} 
                    ${`shift-y:${reset||active?0:-20}vh`}">
                </div>
                <canvas class="
                    abs bl:0 h:20vh w:fit origin:0,100% transform m-b:1px 
                    ${reset?'':`tween:transform,1.4s,easeOut2`} 
                    ${`scale-y:${reset||active?0:1}`}">
                </canvas>

                <canvas class="
                    abs l:0 b:100% h:20vh w:fit origin:0,100% transform m-b:-1px
                    ${reset?'':`tween:transform,1.4s,easeOut2`} 
                    ${`scale-y:${reset?0:1}`}">
                </canvas>
                
                <div class="
                    pointer:none abs tl:50% transform 
                    shift-x:-50% shift-y:-50% w:300fx before before:p-t:100% w:200fx@m">

                    <video 
                        muted playsinline preload="none" loop autoplay playsinline
                        src="${content && content.loader_video.url}"
                        class="
                            abs tl:0 w:fit transform 
                            ${reset?'':`tween:transform,1.4s,easeOut2`} 
                            ">
                    </video>
                </div>

            </div>`
    }

    resize() {
        if (!this.$canvas) return
        this.$canvas.width=  window.innerWidth * window.devicePixelRatio;
        this.$canvas.height=  window.innerHeight * 0.2 * window.devicePixelRatio;
        this.ctx = this.$canvas.getContext("2d");
        this.ctx.fillStyle='#191819';
        this.ctx.fillRect(0, 0, this.$canvas.width, this.$canvas.height);
        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.fillStyle='blue';
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.$canvas.height);
        this.ctx.bezierCurveTo(this.$canvas.width*0.33, this.$canvas.height*-0.2, this.$canvas.width*0.66, this.$canvas.height*-0.2,this.$canvas.width, this.$canvas.height);
        this.ctx.fill();


        this.$canvas2.width=  window.innerWidth * window.devicePixelRatio;
        this.$canvas2.height=  window.innerHeight * 0.2 * window.devicePixelRatio;
        this.ctx2 = this.$canvas2.getContext("2d");
        this.ctx2.fillStyle='#191819';
        this.ctx2.fillRect(0, 0, this.$canvas2.width, this.$canvas2.height);
        this.ctx2.globalCompositeOperation = 'destination-in';
        this.ctx2.fillStyle='blue';
        this.ctx2.beginPath();
        this.ctx2.moveTo(0, this.$canvas2.height);
        this.ctx2.bezierCurveTo(this.$canvas2.width*0.33, this.$canvas2.height*-0.2, this.$canvas2.width*0.66, this.$canvas2.height*-0.2,this.$canvas2.width, this.$canvas2.height);
        this.ctx2.fill();

    }

    afterRender() {
        this.$canvas = this.querySelectorAll('canvas')[0];
        this.$canvas2 = this.querySelectorAll('canvas')[1];

        //ios autoplay bug workaround
        this.$video = this.querySelector('video');
        if (this.$video && !this.$video.isWatchingTouchStart) {
            this.$video.isWatchingTouchStart = true;
            document.addEventListener('touchstart', ()=>{
                this.$video.play();
            });
        }

        if (!this.$canvas) return
        if (!this.hasRenderedOnce) {
            this.hasRenderedOnce = true;
            this.resize();    
        }
    }

}

customElements.define('app-loader', AppLoader);

class StrokeButton extends Component {
    get props() {
        return  {
            title: String,
            url: String,
            external: Boolean,
            mobile: Boolean,
        }
    }
    render(data) {
        let {title,url,external, mobile} = this.data;
        return html`
        <a href="${url}"
            ?target="${external?'_blank':false}"
            class="group rel fs:16fx lh:1.05 iblock p-x:0.35c p-y:25fy min-w:2c min-w:2c
                | min-w:150px@m lh:16fx@m p-y:24fy@m fw:500@m p-x:25fx@m">
            
            <span aria-hidden="true" class="pointer:none iblock abs tl:0 fit radius:100px mask 
                | anim-in:tween:all,1s,1.5s,easeOut transform shift-x:-100% anim-in:shift-x:100%">
                <span class="iblock fit border:solid,2px,light radius:100px 
                    | anim-in:tween:all,1s,1.5s,easeOut transform shift-x:100% anim-in:shift-x:-100%">
                </span>
            </span>

            <span aria-hidden="true" 
                class="
                  pointer:none iblock abs tl:0 fit radius:100px mask 
                  anim-in:tween:all,0.9s,1.7s,easeOut2 transform shift-x:-100% anim-in:shift-x:0%">
                <span class='
                      iblock fit border:solid,2px,light radius:100px 
                      anim-in:tween:all,0.9s,1.7s,easeOut2 transform shift-x:100% anim-in:shift-x:0%'>
                </span>
            </span>

            <span aria-hidden="true" class="
                pointer:none o:0 iblock abs tl:0 fit tween:1.3s,1.7s,easeOut2 anim-in:o:1  
                ${mobile?`bg:white60@m`:''}"
                >
                <div class="fit bg:white radius:100px (a:hover &):o:0! anim-in:tween:0.6s,easeOut">
                </div>
            </span>

            <span class="rel o:0 anim-in:o:1 anim-in:tween:opacity,0.9s,1.7s,easeOut2">
                <span class="c:dark! rel group-hover:c:#fff! tween:color,0.6s,easeOut">
                    ${title}
                </span>
            </span>
        </a>`

    }
}

customElements.define('stroke-button', StrokeButton);

class ExpandButton extends Component {
    get defaultData(){
        return {
            hoverStartPos: [0, 0],
        }
    }
    get props() {
        return  {
            title: String,
            url: String,
            external: Boolean
        }
    }
    ready() {
        this.resize();
    }
    resize() {
        let $anchor = this.querySelector('a');
        let $circle = this.querySelector('[data-circle]');
        if ($anchor) {
            let width  = $anchor.clientWidth;
            let height = $anchor.clientHeight;
            this.set({width, height}); 
        }
        if ($circle) {
            let circleWidth  = $circle.clientWidth;
            let circleHeight = $circle.clientHeight;
            this.set({circleWidth, circleHeight}); 
        }
    }
    render() {
        let {title,url,external, hoverStartPos, width, height, circleWidth, circleHeight} = this.data;
        return html`
            <a data-wrap href="${url}"
                ?target="${external?'_blank':false}"
                class="
                    rel fs:15fx iblock c:light p-y:23fy p-x:0.35c lh:1.05
                    min-w:150px@m lh:16fx@m p-y:24fy@m fw:500@m
                ">

                <span class="radius:100px  mask abs fit tl:0 block transform scale:0 anim-in:scale:1 anim-in:tween:all,1s,0.8s,easeOut3">
                    <span class="abs fit tl:0 block o:1 ">

                        <!-- blue bg + left right circles -->
                        <span class="abs fit tl:0 block transform scale-x:0 anim-in:scale-x:1 anim-in:tween:all,1s,1.3s,easeOut bg:blue">
                        </span>
                        <span class="abs fit tl:0 block transform shift-x:50% anim-in:shift-x:0% anim-in:tween:all,1s,1.3s,easeOut">
                            <span class="
                                iblock abs tl:0 
                                transform scale:1 shift-x:-50%
                                anim-in:scale:1 anim-in:tween:all,1s,1.3s,easeOut h:100% anim-in:shift-x:0%">
                                <img src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" height="100%">
                                <span class="bg:#fff abs t:0 r:50% block w:300% h:fit"></span>
                                <span class="radius:100px mask bg:blue abs tl:0 block fit"></span>
                            </span>
                        </span>
                        <span class="abs fit tl:0 block transform shift-x:-50% anim-in:shift-x:0% anim-in:tween:all,1s,1.3s,easeOut">
                            <span class="
                                    iblock abs tr:0 
                                    transform scale:1 shift-x:50%
                                    anim-in:scale:1 anim-in:tween:all,1s,1.3s,easeOut h:100% anim-in:shift-x:0%
                                    radius:100px">
                                <img src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" height="100%">
                                <span class="bg:#fff abs t:0 l:50% block w:300% h:fit"></span>
                                <span class="radius:100px mask bg:blue abs tl:0 block fit"></span>
                            </span>
                        </span>

                        <!-- white circle -->
                        <div class="abs tl:0 fit radius:300px bg:#fff o:0 anim-in:tween:0.5s,easeOut (a:hover &):o:1"></div>
                            
                        <!-- border -->
                        <span class="radius:100px abs fit tl:0 block border:solid,2px,#d7d7d7 o:0 (:hover>span>span>&):o:1 anim-in:tween:opacity,0.6s,easeOut"></span>

                    </span>
                </span>

                
                <span class="rel o:0 anim-in:o:1 anim-in:tween:opacity,1s,1.3s,easeOut ">
                    <span class="(a:hover &):c:dark! anim-in:tween:color,0.6s,easeOut">
                        ${title}
                    </span>
                </span>

            </a>`

    }
}

customElements.define('expand-button', ExpandButton);

function srcSet(sizes) {
    return !sizes ? '' : `${sizes.retina} 1920w, ${sizes.large} 1440w, ${sizes.mobile} 768w`
}

class BlockArticle extends Component {
    get props() {
        return {
            direction: String,
            content:   Object
        }
    }
    render() {
        
        let {content} = this.data;
        let directionClass = this.data.direction != 'reverse' ? '' : 'dir:row-reverse';
        let contentClass   = this.data.direction != 'reverse' ? 'p-x:127fx p-r:104fx ' : 'p-l:50fx p-r:205fx ';

        if (!content) return html`` 

        let $cta = !content.link.page && !content.link.url ? html`` : html`
            <expand-button
                title="${ content.link.title || 'Learn More' }"
                url="${(content.link.page || content.link.url).replace( /https\:\/\/[^/]*\//g,'/' ).replace('/api/', '/')}"
                external="${content.link.url?true:false}">
            </expand-button>`;

        return html`
                
                <scroll-object class="
                    | flex items:center justify:center wrap:wrap
                    | ${directionClass}">
                    <figure class="
                        | rel p-y:98fy p-x:90fx w:7c grow:0 shrink:0 
                        | ${'bg:'+(content.background||'blue')} 
                        | w:fit@m p-x:12%@m p-y:47fy@m m-b:36fy@m mask o:0 transform scale:0.8 anim-in:scale:1 anim-in:o:1 anim-in:tween:all,1.1s,easeOut">
                        <scroll-object 
                            parallax="true"
                            class="block rel before before:p-t:80%">
                            <img 
                                class="abs tl:0 fit object:cover transform scale:1.2 anim-in:scale:1 anim-in:tween:all,1.1s,easeOut" 
                                src="${ content.image?.sizes?.base64 }"
                                srcset="${ srcSet(content.image?.sizes) }"
                                loading=lazy 
                                decoding="async"
                                />
                        </scroll-object>
                    </figure>
                    <div class="
                        | w:5c grow:0 shrink:0 
                        | ${contentClass}
                        | w:fit@m p-x:6.25%@m align-x:center@m">
                        <h3>
                            <span class="
                                | block fs:12fx c:#808080 fw:500 letter:0.15em uppercase m-b:20fy lh:1.1 fadeIn anim-delay:1.3s! 
                                | m-b:18fy@m fs:10fx@m letter:0.14em@m"> 
                                ${content.headline}
                            </span>
                            <span class="
                                | block fs:40fx fw:500 lh:1.25 underline m-b:30fy 
                                | fs:26.6fx@m lh:33fx@m m-b:24fy@m">
                                <core-multiline 
                                    word-class="fs:40fx lh:1.25 | fs:26.6fx@m lh:33fx@m" 
                                    line-class="anim--underline"> 
                                    ${content.title}
                                </core-multiline>
                            </span>
                        </h3>
                        <div class="
                            | fs:16fx lh:1.9 c:#959595 m-b:40fy 
                            | p-x:6.25%@m fs:13fx@m lh:23fx@m m-b:37fy@m">
                            <core-multiline word-class="fs:16fx lh:1.9 | fs:13fx@m lh:23fx@m" > 
                                ${content.text}
                            </core-multiline>
                        </div>
                        <div>
                            ${ $cta }
                        </div>
                    </div>
                </scroll-object>`
    }
}

customElements.define('block-article', BlockArticle);

class BlockArticles extends Component {
   get props() {
        return {
            content: Object,
        }
    }
    render() {
        let content = this.data.content;
        return !content ? html`` : html`
            <div
                class="
                    space-y:195fy m-b:107fy
                    space-y:100fy@m m-b:111fy@m"
                >
                ${content.slides && content.slides.map((slide,i)=>{
                    return html`
                        <block-article 
                            class="block" parallax parallax-ratio="0.1"
                            data-direction="${i%2!=0?'reverse':''}"
                            data-content="${slide}"></block-article>`
                })}
            </div>`
    }
}

customElements.define('block-articles', BlockArticles);

class BlockBlog extends Component {
    get props() {
        return {
            content: Object
        }
    }
    created() {
        this.data = {
            slides: []
        };
    }
    fetch() {
        if (this.data.content && this.data.content.global && this.data.content.global.apiBase) {
            console.log('fetch blog');
            let xmlhttp = new XMLHttpRequest();
            xmlhttp.onreadystatechange = ()=>{
                if(xmlhttp.readyState === 4){
                    let slides = JSON.parse(xmlhttp.responseText);
                    this.set({ slides });
                    requestAnimationFrame(()=>{
                        window.dispatchEvent(new Event('resize'));
                        requestAnimationFrame(()=>{
                            this.fire('contentchange'); 
                        });
                    });
                }
            };
            xmlhttp.open('GET', this.data.content?.global?.apiBase + '/post/news', true);
            xmlhttp.send();
        }
    }
    render() {
        let {slides, content} = this.data;
    
        if (!content) return html``
    

        if (slides.length==0 && !this.isLoading) {
            this.isLoading = this.fetch();
            return html``
        } 

        let $featuredArticle = !content.use_featured || slides.length == 0 ? html`` : html`
            <article class="flex just:between items:center wrap:wrap">
                <div _theme="dark" 
                    class="w:615fx rel before radius:10px mask before:p-t:80%
                           m-b:35fy@m ">
                    <img 
                        src="${ slides[0]?.fields?.thumbnail?.sizes?.base64 }"
                        srcset="${ srcSet(slides[0]?.fields?.thumbnail?.sizes) }"
                        loading=lazy 
                        decoding="async"
                        class="abs tl:0 fit object:cover" />
                </div>
                <div class="w:560fx p-l:45fx p-r:135fx | p-x:0@m">
                    <p class="block fs:12fx c:#808080 uppercase m-b:20fy lh:1.1
                              fs:16fx@m">
                        ${slides[0].date}
                    </p>
                    <h3>
                        <span class="block fs:36fx fw:500 lh:1.38 underline m-b:30fy">
                            ${slides[0].title}
                        </span>
                    </h3>
                    <p class="fs:16fx lh:1.9 c:#959595 m-b:40fy">
                        ${slides[0].fields.short_description}
                    </p>
                    <a href="${slides[0].url.replace(/https\:\/\/[^/]*\//g, '/').replace('/api/', '/')}" 
                        class="fs:15fx iblock bg:none border:solid,2px,black10 radius:100px p-y:23fy p-x:0.35c lh:1.05
                                min-w:125px@m fs:12fx@m lh:16fx@m p-y:16fy@m fw:500@m align-x:center@m
                                hover:bg:blue hover:c:#fff tween:all,0.6s,easeOut">
                        Read More
                    </a>
                </div>
            </article>`; 
        
        return  html`
            <scroll-object class="block rel p-x:105fx p-t:200fy
                        p-x:6.25%@m p-t:140fy@m">
                <div class="p-b:70fy b-b:solid,1px,black10 m-b:60fy ">
                    ${$featuredArticle}
                </div>
                <div class="space-y:70fy flex just:between items:stretch wrap:wrap">
                    ${slides && slides.map((slide,i)=>{
                        if ( (content.use_featured && i==0) || !slide.fields) {
                            return html``
                        }
                        return html`
                            <a href="${slide.url.replace(/https\:\/\/[^/]*\//g, '/').replace('/api/', '/')}" 
                                class="w:560fx p-b:70fy b-b:solid,1px,black10 m-b:60fy | w:fit@m">
                                    <div class="rel before before:p-t:66% radius:10px mask m-b:35fy">
                                        <img src="${slide.fields.thumbnail && slide.fields.thumbnail.url}" 
                                            class="abs tl:0 fit object:cover" />
                                    </div>
                                    <div class="w:5c grow:0 shrink:0 | w:fit@m">
                                        <p class="block fs:12fx c:#808080 uppercase m-b:20fy lh:1.1 | fs:16fx@m">
                                            ${slide.date}
                                        </p>
                                        <h3 class="block fs:28fx fw:500 lh:1.4 underline m-b:20fy
                                                    fs:20fx@m">
                                            ${slide.title}
                                        </h3>
                                        <p class="fs:16fx lh:1.9 c:#959595">
                                            ${slide.fields.short_description}
                                        </p>
                                    </div>
                            </a>`
                    })}
                </div>
                <div class="align-x:center p-b:175fy">
                    <button class="fs:15fx iblock bg:none border:solid,2px,black10 radius:100px p-y:23fy p-x:0.35c lh:1.05
                                   hover:bg:blue hover:c:#fff tween:all,0.6s,easeOut
                                   min-w:125px@m fs:12fx@m lh:16fx@m p-y:16fy@m fw:500@m align-x:center@m">
                        Load More
                    </button>
                </div>
            </scroll-object>`
    }
}

customElements.define('block-blog', BlockBlog);

class BlockBreak extends Component {
    render() {
        return html`<hr class="o:0.15 m-l:47fx m-r:47fx w:auto b-b:solid,1px,grey m-b:60fy | m-b:90fy@m d:none@m" />`
    }
}

customElements.define('block-break', BlockBreak);

class BlockContact extends Component {
    get props() {
        return { content: Object }
    }
    render() {
        let {content} = this.data;
        return !content ? html``: html`
            <scroll-object class="
                block p-l:309fx p-t:265fy m-b:155fy 
                p-x:6.25%@m p-t:140fy@m m-b:60fy@m"
                >
                <h2 class="
                    | fs:140fx lh:180fx
                    | fs:86fx@m">
                    <core-multiline delay="0.1" word-class="fs:140fx lh:180fx | fs:86fx@m">
                        ${content.title}
                    </core-multiline>
                </h2>
                <p class="
                    | fs:26fx lh:50fx m-b:78fy
                    | m-b:60fy@m fs:20fx@m lh:32fy@m">
                    <core-multiline delay="0.4" word-class="fs:26fx lh:50fx | fs:20fx@m lh:32fy@m">
                        ${content.text}
                    </core-multiline>
                </p>
           
        <!--
                <div theme="dark" 
                    class="
                        | rel before before:p-t:56.5% radius:10px mask
                        | before:p-t:80%@m">
                    <img src="${content.image && content.image.url}" 
                        class="abs tl:0 fit object:cover" />
                </div>
        -->

                <div class="rel before before:p-t:56.5% radius:10px mask | before:p-t:80%@m transform scale:0.8 anim-in:scale:1 tween:transform,1.8s,0.3s,easeOut">
                    <scroll-object 
                        theme="dark" 
                        class="abs tl:0 fit block mask" 
                        parallax="true">
                        <div class="abs tl:0 fit  ">
                            <div class="abs fit tl:0  transform scale:1.2 anim-in:scale:1 tween:transform,1.8s,0.3s,easeOut">
                                <img 
                                    alt=""  
                                    class="abs tl:0 fit object:cover" 
                                    src="${ content.image?.sizes?.base64 }"
                                    srcset="${ srcSet(content.image?.sizes) }"
                                    loading=lazy 
                                    decoding="async"
                                    />
                            </div>
                        </div>
                    </scroll-object>
                </div>
                
            </scroll-object>`
    }
}

customElements.define('block-contact', BlockContact);

class BlockCover extends Component {
    get props() {
        return {
            content: Object
        }
    }
    render() {
        let {content} = this.data;

        if (!content) return html``

        let $scrollBtn = !content || !content.use_scroll_button ?  html`` : html`
            <button 
                on-click="${this.autoScroll}" 
                class="
                    blink
                    abs bg:none b:145fy l:103fx fill:light 
                    l:6.25%@m"
                >  
                <svg 
                    width="20" 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 21.333 32.801"
                    >
                    <path d="M9.334 11.468v16.266L1.867 20.27 0 22.134l10.667 10.667 10.667-10.667-1.867-1.865L12 27.734V11.468z"/>
                    <path d="M9.333 11.89H12V0H9.333z"/>
                </svg>
            </button>`;

        let $cta = !content || !content.link || (!content.link.page&&!content.link.url) ?  html`` : html`
            <stroke-button
                class="align-x:center"
                url="${(content.link.page||content.link.url).replace( /https\:\/\/[^/]*\//g,'/' ).replace('/api/', '/')}"
                external="${content.link.url?true:false}"
                title="${content.link.title}">
            </stroke-button>`;
            
        return html`
            <scroll-object theme="dark" class="
                    c:light rel flex items:center just:start h:93vh mask m-b:127fy$
                    (page-block:last-child &):m-b:0fy mask">
                
                <scroll-object class="abs tl:0 fit block" parallax="true">
                    <div class="abs tl:0 fit transform scale:1.2 anim-in:scale:1 tween:all,1.3s,easeOut">
                        <img 
                            class="abs tl:0 fit object:cover" 
                            src="${ content.image?.sizes?.base64 }"
                            srcset="${ srcSet(content.image?.sizes) }"
                            loading=lazy 
                            decoding="async"
                            />
                        <video muted loop 
                            ?autoplay="${content.video && content.video.url}"
                            src="${content.video && content.video.url}"
                            class="abs tl:0 fit object:cover"
                            style="${{opacity:content.video && content.video.url?1:0}}">
                        </video>
                    </div>
                </scroll-object>

                <article 
                    class="rel p-l:103fx m-b:31fy
                            p-x:6.25%@m p-l:6.25%@m">
                    <h1 class="fs:140fx fw:400 lh:1.285 m-b:14fy | fs:86fx@m lh:76fx@m m-b:25fy@m">
                        <core-multiline delay="0.7" word-class="fs:140fx fw:400 lh:1.285 | fs:86fx@m lh:76fx@m">
                            ${content.title}
                        </core-multiline>
                    </h1>
                    <div class="fs:30fx lh:1.33 m-b:40fy w:385fx | fs:16fx@m lh:24fx@m fw:500@m m-b:30fy@m max-w:80%@m">
                        <core-multiline delay="0.9" word-class="fs:30fx lh:1.33 | fs:16fx@m lh:24fx@m fw:500@m">
                            ${content.text}
                        </core-multiline>
                    </div>
                    <div>
                        ${ $cta }
                    </div>
                </article>

                ${ $scrollBtn }

            </scroll-object>`
    }
    autoScroll() {
        console.log("autoScroll");
        window.scrollTo(0,window.innerHeight);
    }
}

customElements.define('block-cover', BlockCover);

class BlockEditorial extends Component {
    get props() {
        return {
            content: Object
        }
    }
    render() {
        let {content} = this.data;
        return !content ? html`` : html`
        
            <scroll-object 
                theme="light" 
                class="block p-t:200fy p-b:175fy p-x:45fw | p-t:140fy@m p-x:6.5%@m">
                <header class="align-x:center m-x:auto w:660fx | w:fit@m">
                    <span class="block fs:12fx c:#808080 uppercase m-b:20fy lh:1.1">
                        ${content.date}
                    </span>
                    <h2 class="
                        fs:60fx lh:1.33 m-b:80fy 
                        fs:50fx@m lh:1@m">
                        ${content.title}
                    </h2>
                </header>
                <div class="p-x:45fx m-b:125fy p-x:0@m m-b:60fy@m">
                    <div class="rel before radius:10px mask before:p-t:56% | before:p-t:80%">
                        <scroll-object class="abs tl:0 fit object:cover" parallax="true">
                            <img src="${content.image && content.image.url}" alt="" class="abs tl:0 fit object:cover"/>
                        </scroll-object>
                    </div>
                </div>
                <div class="wysiwyg w:600fx m-x:auto | w:fit@m">
                    ${content.text}
                </div>
            </scroll-object>`
    }
}

customElements.define('block-editorial', BlockEditorial);

class BlockFeatured extends Component {
    render() {
        let {content} = this.data;
        return !content ? html``: html`
            <section class="m-b:210fy">
                <h3 class="align-x:center fs:40fx lh:25fx m-b:60fy">
                    ${content.title}
                </h3>  
                <hr class="bg:grey bb:solid,1px,grey m-b:100fy" />
                <nav class="flex just:center wrap:wrap space-x:85fx">
                    ${content.slides && content.slides.map((slide,i)=>{
                        return html`
                            <a href="${slide.url}" target="_blank">
                                <img class="h:23px w:auto" src="${slide.image && slide.image.url}" />
                            </a>`
                    })}
                </nav>
            </section>`
    }
}

customElements.define('block-featured', BlockFeatured);

class BlockForm extends Component {
    get props() {
        return {
            content:   Object,
            globalContent:   Object,
        }
    }
    render() {

        let {content} = this.data;

        if (!content || !content.form) return html``

        let fields = content.form.post_meta.fm_meta.form.fields;

        return html`
            <core-ajax-form 
                class="block m-b:237fy"
                data-action="${content.form.url}">
                <form data-form class="p-l:309fx p-r:411fx space-y:56fy | p-x:6.25%@m">

                    <scroll-object class="block space-y:56fy">
                        ${ fields.map(field => {

                            let $label = html`<label class="
                                pointer:none abs tl:0 block w:fit fs:40fx lh:40fx m-b:21fy 
                                origin:0,0 transform scale:0.4 shift-y:-50%
                                sibling-has-placeholder:scale:1
                                sibling-has-placeholder:shift-y:0
                                c:#acacac
                                tween:all,0.6s,easeOut
                                
                                (.is-error + &):c:red
                                ">
                                ${field.title}
                            </label>`;

                            let $input;
                            switch (field.type) {
                                case 'text': 
                                case 'email': 
                                    $input = html`
                                        <input data-required 
                                            name="${field.name}" 
                                            class="fs:40fx lh:40fx p-b:21fy placerholder:c:grey b-b:solid,1px,grey w:fit" 
                                            type="text" 
                                            placeholder=" " />`;
                                    break;
                                case 'textarea': 
                                    $input = html`
                                        <textarea name="${field.name}" 
                                            class="fs:40fx lh:40fx p-b:21fy c:grey b-b:solid,1px,grey w:fit" 
                                            rows="9" 
                                            placeholder=" "></textarea>`;
                                    break;
                            }
                            return html`
                                    <fieldset class="rel anim-in:shift-y:0 transform shift-y:7vh anim-in:o:1 o:0 ">
                                        ${ $input }
                                        ${ $label }
                                    </fieldset>`
                        }) }
                    </scroll-object>
                        

                    <div class="w:fit flex items:center just:between wrap:wrap">
                        <button class="
                            rel lh:1.05 fs:16fx iblock radius:100px p-y:25fy p-x:0.35c max-w:2c
                            radius:100px border:solid,2px,blue tween:all,0.6s,easeOut c:#fff bg:blue
                            (:hover > &):bg:#fff (:hover > &):bc:black10 (:hover > &):c:dark
                            max-w:100%@m w:auto@m  p-x:24fx@m">
                            <span class="rel">
                                Submit Message
                            </span>
                        </button>
                        <p class="o:0 (.is-success &):o:1 fs:18px lh:1 fw:400">Thank you, your message has been successfully sent.</p>
                    </div>

                </form>
            </core-ajax-form>`
    }
}

customElements.define('block-form', BlockForm);

class BlockHome extends Component {
    
    get defaultData() {
        return  {
            scrollTop: 0,
            canPlay: false
        }
    }
    
    get props() {
        return {
            content: Object
        }
    }

    created() {
        this._onScroll = this._onScroll.bind(this);
        this.onVideoLoaded = this.onVideoLoaded.bind(this);
    }

    onVideoLoaded() {
        console.log('___onVideoLoaded___');
        this.data.canPlay = true;
        this.fire('videoready');
    }

    attached() {
        this.data.isMobile = 
            (window.innerWidth > window.innerHeight && window.innerWidth <= 812)
            || (window.innerWidth < window.innerHeight && window.innerWidth <= 767);

        !this.data.isMobile && this.set({ playVideo: true });

        document.removeEventListener('scroll', this._onScroll, false);
        document.addEventListener('scroll', this._onScroll, false);

        //security to prevent infinite loader
        setTimeout(()=>{
            this.data.canPlay = true;
            this.fire('videoready');
        }, 4000);
    }

    detached() {
        document.removeEventListener('scroll', this._onScroll);
    }

    _onScroll() {
        if (this.preventScroll){
            return
        }
        this.lastScroll = Date.now();
        this._lastScroll = this.data.scrollTop;
        this.data.scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    }

    autoScroll() {
        window.scrollTo(0,window.innerHeight);
    }

    afterRender() {
    }

    update() {
        this.data;

    }

    render() {
        
        let {content, playVideo, isMobile} = this.data;
        
        if (!content) return html``
        
        let $img = html``;
        let sizes = content[(isMobile?'mobile_image':'image')] && content[(isMobile?'mobile_image':'image')].sizes;
        
        if (sizes) {
            $img = html`
                <img src="${sizes.base64}" alt="" loading="lazy" srcset="${ srcSet(sizes) }"
                     class="abs tl:0 fit w:fit" />`;
        }

        return !content ? html`` : html`

            <section class="c:light rel mask"> 

                <!--
                <scroll-object 
                    theme="dark" 
                    class="
                        bg:blue block rel 
                        before before:p-t:121.5% before:w:fit  
                        before:d:none@m bg:#38438c@m h:100vh@m">
                    <div class="abs tl:0 w:fit h:fit">
                        <video 
                            muted playsinline preload="none" loop autoplay 
                            src="${content.video && content.video.url}"
                            class="abs tl:0 fit object:cover">
                        </video>
                        <gl-scene 
                            class="block abs tl:0 w:fit h:100vh pos:sticky">
                        </gl-scene>
                    </div>
                    <div class="abs tl:0 fit bg:#000 o:0.15 z:3"></div> 
                </scroll-object>-->

                <scroll-object 
                    theme="dark" 
                    parallax="true"
                    class="
                        z:2 bg:blue block rel before before:p-t:120% before:w:fit  
                        before:d:none@m bg:#38438c@m h:100vh@m">
                        
                    <div class="
                        abs bl:0 fit transform shift-y:50vh 
                        anim-in:scale:1 anim-in:scale:1.1 anim-in:tween:transform,2.4s,easeOut3 
                        anim-in:shift-y:10vh 
                        h:100%@m anim-in:shift-y:0vh@m
                        before@m before:bg:#3a4492@m before:fit@m">

                        <img src="https://d2v6doicvavr5y.cloudfront.net/cover-top.png" class="w:fit abs l:0 t:-30% z:2" />
                    
                        <div class="fit">
                            ${ $img }
                        </div>

                        <video muted loop 
                            @canplay="${ this.onVideoLoaded }"
                            autoplay="true"
                            ?src="${content.video && content.video.url}"
                            class="abs tl:0 fit w:fit"
                            style="${{opacity:1}}">
                        </video>
                    </div>
                </scroll-object>


                <scroll-object class="z:4 abs l:0 t:15.5vr w:fit | t:20vh@m">
                    <article class="align-x:center">
                        <h1 class="
                            fs:80fx fw:400 lh:7.5vr m-b:1.5vr letter:0.006em
                            fs:46fx@m lh:50fx@m m-b:25fy@m">
                            <core-multiline 
                                delay="1"
                                word-class="fs:80fx lh:7.5vr | fs:46fx@m lh:50fx@m">
                                ${content.title}
                            </core-multiline>
                        </h1>
                        <div class="
                            fs:24fx lh:1.5 m-b:40fy fadeIn anim-delay:1.3s! letter:0.006em
                            fs:16fx@m lh:24fx@ fw:500@m m-b:30fy@m">
                            <core-multiline 
                                delay="1.1"
                                word-class="fs:24fx lh:1.5 | fs:16fx@m lh:24fx@m">
                                ${content.text}
                            </core-multiline>
                        </div>
                        <div class="">
                            ${ content.links && content.links.map(link=>{
                                return html`
                                <stroke-button
                                    url="${link.url}"
                                    external="${link.external}"
                                    title="${link.title}">
                                </stroke-button>`
                            }) }
                        </div>
                    </article>
                </scroll-object>
                
                <button 
                    @click="${this.autoScroll}" 
                    class="c:light abs bg:none l:50% b:30fy transform shift-x:-50% 
                            d:none w:70fx h:70fx radius:100px border:solid,2px,white20 
                            d:block@m">
                    <svg class="w:10px h:18px transform rotate:0deg fill:currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21.333 32.801">
                        <path d="M9.334 11.468v16.266L1.867 20.27 0 22.134l10.667 10.667 10.667-10.667-1.867-1.865L12 27.734V11.468z"/>
                        <path d="M9.333 11.89H12V0H9.333z"/>
                    </svg>
                </button>

            </section>`
    }
}

customElements.define('block-home', BlockHome);

class BlockIntro extends Component {
    get props() {
        return {
            content: Object
        }
    }
    render() {
        let {content} = this.data;
        return !content ? html`` : html`
            <section id="get-started" class="
                | p-l:6c p-r:2c p-t:120fy m-b:152fy 
                | p-x:6.25%@m p-t:54fy@m m-b:83fy@m">
                <h2 class="
                    | fs:40fx lh:1.429 fw:500 m-b:55fy spacing:0.006em
                    | fs:26.5fx@m lh:40fx@m m-b:35fy@m">
                    <core-multiline delay="0" word-class="fs:40fx lh:1.429 fw:500 | fs:26.5fx@m lh:40fx@m">
                        ${content.title}
                    </core-multiline>
                </h2>
                <div class="p-r:1.1c fs:24fx lh:1.65 p-r:40fx@m fs:20fx@m lh:32fx@m c:#626262@m">
                    <core-multiline delay="0.2" word-class="fs:24fx lh:1.65 | fs:20fx@m lh:32fx@m">
                        ${content.text}
                    </core-multiline>
                </div>
            </section>`
    }
}

customElements.define('block-intro', BlockIntro);

class BlockLegals extends Component {
    get props() {
        return {
            content: Object
        }
    }
    render() {
        let {content} = this.data;
        return !content ? html`` : html`
            <scroll-object theme="dark" class="block c:light bg:dark p-t:350fy p-b:175fy">
                <h2 class="fs:140fx lh:1 m-b:205fy p-l:95fx">
                    <core-multiline delay="0.7" word-class="fs:140fx lh:1">
                        ${content.title}
                    </core-multiline>
                </h2>
                <div class="m-r:0 m-l:auto w:823fx p-r:335fx">
                    ${content.text}
                </div>
            </scroll-object>`
    }
}

customElements.define('block-legals', BlockLegals);

class BlockLogin extends Component {
    get props() {
        return {
            content: Object
        }
    }
    render() {
        let {content} = this.data;
        return html`
            <section class="p-l:103fx rel flex items:center just:start h:100vh mask">
                <scroll-object theme="dark" class="abs tl:0 fit object:cover" parallax="true">
                    <img 
                        alt=""  
                        class="abs tl:0 fit object:cover" 
                        src="${ content.image?.sizes?.base64 }"
                        srcset="${ srcSet(content.image?.sizes) }"
                        loading=lazy 
                        decoding="async"
                        />
                    <video 
                        muted playsinline preload="none" loop autoplay  
                        src="${content.video && content.video.url}"
                        class="abs tl:0 fit object:cover"
                        ></video>
                </scroll-object>
                <article theme="light" class="rel m-b:31fy bg:white w:480fx p-x:68fx p-y:80fy c:dark">
                    <h1 class="fs:48fx fw:400 lh:1 m-b:55fy">${content.title}</h1>
                    <form class="space-y:35fy m-b:80fy ">
                        <input-text class="block rel fs:18fx lh:1" label="placeholder">
                            <input class="p-b:14fy placerholder:c:grey b-b:solid,1px,grey w:fit " type="text" placeholder=" " />
                            <label class="pointer:none abs c:grey tl:0 w:fit transform scale:0.55 shift-y:-100% sibling-has-placeholder:scale:1 sibling-has-placeholder:c:grey sibling-has-placeholder:shift-y:0  origin:0,0 tween:all,0.7s,ease block w:fit">Email Address</label>
                        </input-text>
                        <input-text class="block rel fs:18fx lh:1" label="placeholder">
                            <input class="p-b:14fy placerholder:c:grey b-b:solid,1px,grey w:fit" type="text" placeholder=" " />
                            <label class="pointer:none abs c:grey tl:0 w:fit transform scale:0.55 shift-y:-100% sibling-has-placeholder:scale:1 sibling-has-placeholder:c:grey sibling-has-placeholder:shift-y:0  origin:0,0 tween:all,0.7s,ease block w:fit">Password</label>
                        </input-text>
                        <div class="flex items:center just:between">
                            <a href="" class="fs:15fx iblock radius:100px bg:blue c:light  hover:bg:#fff hover:border:solid,2px,blue hover:c:blue p-y:18fy p-x:0.35c lh:1.05">Sign In</a>
                            <a href="" class="fs:14fx iblock lh:1.05 c:grey hover:deco:underline">Forgot password?</a>
                        </div>
                    </form>
                    <p class="fs:14fx c:grey">
                        Dont have an account ? <a href="/" class="underline c:blue deco:underline">Sign up here</a>
                    </p>
                </article>
            </section>`
    }
}

customElements.define('block-login', BlockLogin);

class BlockPricing extends Component {

    get props() {
        return {
            content: Object
        }
    }
    
    created() {
        this.data = {
            maxListing: 99,
            progress:   0,
            currentPrice: 48
        };
    }

    onCircleRangeChange(e) {
        this.set({progress: e.detail.progress });
    }

    render() {

        if(!this.data.content) return html``
        
        let {content, currentPrice, progress, maxListing} = this.data;
        let {slides} = content; 
        let listing = Math.round(progress * maxListing);
        let closestListing = 100000;
        let closestListingIndex = -1;

        slides.forEach( (slide, i) => {
            if ( Math.abs(Number(slide.listings) - listing) < closestListing ) {
                closestListingIndex = i;
                closestListing = Math.abs(Number(slide.listings) - listing);
            }
        });
        
        let currentSlide = slides[closestListingIndex];

        return html`
            <section class="m-b:195fy">

                <div class="
                        p-l:97fx p-r:310fx flex items-start justify:between m-b:155fy wrap:wrap 
                        p-x:6.25%@m just:center@m align-x:center@m m-b:44fy@m p-t:65fy@m">
                    <h3 class="
                            block fs:120fx fw:400 lh:1 underline m-b:30fy
                            fs:86fx@m lh:106fy@m m-b:37fy@m">
                        <core-multiline 
                            class="block rel"
                            word-class="fs:120fx lh:1 fs:86fx@m lh:106fy@m">
                            ${content.title}
                        </core-multiline>
                    </h3>
                    <p class="
                            fs:18fx lh:2.08 c:#898989 w:306fx
                            w:fit@m fs:20fx@m p-x:6.25%@m lh:32fx@m">
                        ${content.text}
                    </p>
                </div>

                <h4 class="
                        d:none block align-x:center fs:12fx c:#808080 m-b:20fy lh:1.2 
                        d:block@m align-x:center@m fs:33fx@m lh:40fx@m fw:500@m p-t:60fy@m">
                    <core-multiline word-class="fs:12fx lh:1.2 | fs:33fx@m lh:40fx@m"> 
                        How many listings do<br/>you need?
                    </core-multiline>
                </h4>

                <scroll-object class="
                         p-l:110fx p-r:170fx flex items:center justify:between wrap:wrap
                        p-x:6.25%@m">
                    <div class="
                            rel w:575fx before before:p-t:100%
                            w:fit@m m-b:-60fy@m">

                        <circle-range 
                            class="abs tl:0 w:fit" 
                            on-change="${ this.onCircleRangeChange.bind(this) }">
                        </circle-range>

                        <div class="abs tl:0 fit flex items:center just:center">
                            <div class="align-x:center pointer:none" >
                                <span class="
                                        block fs:12fx c:#808080 m-b:20fy lh:1.2 letter:0.015em
                                        d:none@m">
                                    How many listings do<br/>you need?
                                </span>
                                <h3 class="
                                        block fs:180fx fw:normal lh:1 underline 
                                        m-b:30fy align-x:center mask
                                        fs:0@m m-b:0@m">
                                    <roll-number 
                                        number-class="fs:180fx fs:100fx@m" 
                                        number="${listing}" 
                                        class="iblock">
                                    </roll-number>
                                </h3>
                                <p class="
                                    fs:22fx lh:1.36 c:grey
                                    d:none@m">
                                    Listings Per Month
                                </p>
                            </div>
                        </div>

                    </div>

                    <p class="
                        | d:none rel z:2 w:fit align-x:center  fs:22fx lh:1.36 c:grey letter:0.015em
                        | d:block@m  p-t:0@m m-b:30fy@m fs:16fx@m">
                        Listings Per Month
                    </p>
                    
                    <div class="
                            div-y:#d7d7d7 w:445fx rel z:2
                            w:fit@m div-y:transparent@m align-x:center@m ">
                        <span class="
                                block fs:12fx c:#808080 uppercase m-b:20fy 
                                lh:1.1 fw:500 m-b:20fy p-b:18fy  letter:0.015em
                                d:none@m


                            ">
                            Recommended for you
                        </span>

                        <div class="rel">
                            ${ slides.map((slide, slideIndex)=>html`
                                <h3 class="
                                    | p-b:15fy block m-b:30fy flex items:center just:start
                                    | just:center@m p-b:0fy@m m-b:20fy@m d:flex@m
                                    | ${slideIndex>0?'abs tl:0 w:fit':''}
                                    | ${closestListingIndex == slideIndex?'o:1':'o:0'}
                                    | anim-in:tween:all,0.6s,easeOut
                                ">
                                    <span class="
                                        | iblock w:34fx h:34fx circle m-r:20fx
                                        | ${'bg:'+(slide?.color)} transform
                                        | ${closestListingIndex == slideIndex?'scale:1':'scale:0'}
                                        | anim-in:tween:all,0.6s,easeOut">
                                    </span>
                                    <span class="iblock fs:50fx fw:400 lh:1 | fs:26fx@m lh:33fx@m">
                                        ${slide?.title}
                                    </span> 
                                </h3>`
                            )}
                        </div>

                        <h3 class="
                                p-b:42fy block m-b:23fy flex items:start
                                just:center@m d:flex@m">
                            <span class="
                                    rel l:-0.05em fs:125fx fw:normal lh:1 mask
                                    fs:83fx@m lh:83fx@m">
                                <span class="iblock align-y:middle ">$</span><roll-number 
                                    class="iblock align-y:middle letter:-0.04em | lh:1@m" 
                                    number-class="fs:125fx letter:-0.04em | fs:83fx@m lh:1@m" 
                                    number="${currentSlide && currentSlide.price}">
                                </roll-number>
                            </span>
                            <sup class="
                                    fs:30fx c:grey lh:70fy fw:400 t:0.5em rel
                                    fs:40fx@m lh:83fx@m
                                ">
                                .99<span class="d:none@m"> / Month</span>
                            </sup> 
                        </h3>

                        <div 
                            class="
                                rel
                                m-b:30fy fs:12fx lh:35fx p-b:23fy letter:0.015em fw:500 c:#959595
                                (& li:before):fs:1.5em
                                (& li:before):fw:bold 
                                (& li:before):content:dot
                                (& li:before):align-y:baseline
                                (& li:before):t:0.05em
                                (& li:before):pos:relative
                                (& li:before):m-r:1em

                                (& li:before):d:none@m
                            ">
                            ${currentSlide && currentSlide.text}
                        </div>
                        
                        <expand-button
                            title="${currentSlide && currentSlide.link && currentSlide.link.title}"
                            url="${currentSlide && currentSlide.link && (currentSlide.link.page || currentSlide.link.url.replace( /https\:\/\/[^/]*\//g,'/' ).replace('/api/', '/'))}"
                            external="${currentSlide.link && currentSlide.link.url?true:false}">
                        </expand-button>

                    </div>
                </scroll-object>
            </section>`
    }
}

customElements.define('block-pricing', BlockPricing);

class BlockProfile extends Component {
    get props() {
        return {
            direction: String,
            content:   Object
        }
    }
    render() {
        let {content} = this.data;
        let quoteClasses   = this.data.direction != 'reverse' ? 'p-t:115fy  p-r:190fx w:515fx' : 'p-t:70fy p-l:103fx w:431fx';
        let directionClass = this.data.direction != 'reverse' ? '' : 'dir:row-reverse dir:row@m';
        return !content ? html``: html`
            <article class="flex just:between items:start ${directionClass}
                            | w:fit@m wrap:wrap@m">
                <figure class="w:308fx rel m-b:48fy | w:60%@m">
                    <div theme="dark" class="rel radius:10px m-b:20fy after after:p-t:127% mask">
                        <img
                            src="${ content.image?.sizes?.base64 }"
                            srcset="${ srcSet(content.image?.sizes) }"
                            loading=lazy 
                            decoding="async"
                            class="abs tl:0 fit object:fit" />
                    </div>
                    <figcaption class="fs:16fx lh:30fx">
                        <h3 class="fs:16fx fw:500">${content.title}<h3>
                        <p class="fs:16fx fw:400 c:#7d7d7d">
                            ${content.subtitle}
                        </p>
                    </figcaption>
                </figure>
                <blockquote class="fs:24fx lh:45fx c:grey p-x:0@m w:fit@m p-t:0@m ${quoteClasses}">
                    <span class="italic fs:1.5em">“</span><br/>
                    ${content.text}
                </blockquote>
            </article>`
    }
}

customElements.define('block-profile', BlockProfile);

class BlockProfiles extends Component {
    get props() {
        return {
            content: Object
        }
    }
    render() {
        let {content} = this.data;
        return !content ? html`` : html`
            <div class="space-y:193fy  p-x:206fx m-b:237fy | p-x:6.25%@m space-y:60fy@m">
                ${content.slides && content.slides.map((slide,i)=>{
                    return html`
                        <block-profile 
                            class="block"
                            data-direction="${i%2!=0?'reverse':''}"
                            data-content="${slide}"></block-profile>`
                })}
            </div>`
    }
}

customElements.define('block-profiles', BlockProfiles);

class BlockPush extends Component {
    get props() {
        return {
            content: Object
        }
    }
    render() {
        let {content} = this.data;

        return !content ? html``: html`
            <section class="
                | p-x:47fx p-b:100fy p-t:90fy 
                | ${'bg:'+content.background||'#000'}
                | p:0@m">

                <scroll-object class="
                    | block rel before 
                    | ${`before:p-t:${content.ratio||50}%`}
                    | before:p-t:153.5%@m">

                    <div class="abs tl:0 fit radius:15px mask radius:0@m transform scale:0.8 anim-in:scale:1 tween:transform,1.8s,easeOut">
                        <div class="abs tl:0 fit transform scale:1.2 anim-in:scale:1 tween:transform,1.8s,easeOut">
                            <scroll-object 
                                class="abs tl:0 fit object:cover" 
                                parallax="true">
                                <img 
                                    src="${ content.image?.sizes?.base64 }"
                                    srcset="${ srcSet(content.image?.sizes) }"
                                    loading=lazy 
                                    decoding="async"
                                    alt=""  
                                    class="abs tl:0 fit object:cover scale:1.1" />
                                <video 
                                    muted playsinline preload="none" loop autoplay 
                                    src="${content.video && content.video.url}"
                                    loading="lazy"
                                    class="abs tl:0 fit object:cover transform scale:1.1">
                                </video>
                            </scroll-object>
                        </div>
                    </div>

                    <scroll-object class=" 
                        | abs tl:0 fit flex align-x:center 
                        | items:center justify:center dir:column c:#fff">
                        <h3 class="block fw:500 lh:1.06 underline m-b:30fy ${content.text_size=='medium'?'fs:70fx':'fs:94fx'} fs:67fx@m">
                            <core-multiline word-class="${(content.text_size=='medium'?'fs:70fx':'fs:94fx') + ' lh:1.06 fs:67fx@m'}">
                                ${content.title && content.title.replace(/(?:\r\n|\r|\n)/g, '<br>')}
                            </core-multiline>
                        </h3>
                        <div>
                            ${ content.links && content.links.map(link=>{
                                return html`
                                    <stroke-button
                                        mobile="true"
                                        url="${link.url}"
                                        external="${link.external}"
                                        title="${link.title}">
                                    </stroke-button>`
                            }) }
                        </div>
                    </scroll-object>
                
                </scroll-object>

            </section>`
    }
}

customElements.define('block-push', BlockPush);

class BlockTitle extends Component {
    get props() {
        return {
            content: Object
        }
    }
    render() {
        let {content} = this.data;
        return !content ? html`` : html`
            <section 
                class="
                    m-t:152fy p-x:1c m-b:180fy 
                    ${'align:'+content.align}
                    (page-block:first-child &):m-t:285fy
                    m-t:30px@m m-b:130fy@m (page-block:first-child &):m-t:140fy@m ">
                <h2 
                    class="
                        rel l:-0.045em lh:1
                        ${`fs:${content.size=='medium'?140:180}fx`} 
                        fs:86fx@m lh:80fx@m">
                    <core-multiline 
                        word-class="${`fs:${content.size=='medium'?140:180}fx lh:1 fs:86fx@m lh:80fx@m`}">
                        ${content.title && content.title.replace(/(?:\r\n|\r|\n)/g, '<br>')}
                    </core-multiline>
                </h2>
            </section>`
    }
}

customElements.define('block-title', BlockTitle);

class WebApplication extends Component {

    get props() {
        return {
            apiBase: String,
        }
    }
    
    created() {
        this.toggleMenu = this.toggleMenu.bind(this);
        this.onContentChange = this.onContentChange.bind(this);
        this.onLinkDown= this.onLinkDown.bind(this);
        this.onPageBlockLoaded = this.onPageBlockLoaded.bind(this);
        this.onSignUpDown = this.onSignUpDown.bind(this);
        this.closeDialog = this.closeDialog.bind(this);
        
        this.data = {
            isLoading: true,
            menuOpened: false,
            showDialog: false,
        };
    }

    toggleMenu() {
        this.set({ menuOpened: !this.data.menuOpened });
    }

    onSignUpDown() {
        console.log("onSignUpDown");
        this.set({ showDialog: true });
    }

    closeDialog() {
        this.set({ showDialog: false });
    }

    

    attached() {        
        let {apiBase} = this.data;
        let page  = window.location.pathname;
        let route = apiBase + '/page' + page;
        
        this.loadPage(route);

        let xmlhttpG = new XMLHttpRequest();
        xmlhttpG.onreadystatechange = ()=>{
            if(xmlhttpG.readyState === 4){
                let globalContent = JSON.parse(xmlhttpG.responseText);
                globalContent = { ...globalContent, ...{apiBase} };
                this.set({ globalContent });
            }
        };
        xmlhttpG.open('GET', apiBase + '/global', true);
        xmlhttpG.send();
    }
    

    loadPage(route) {
        let xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = () => {
            if(xmlhttp.readyState === 4){
                let content = JSON.parse(xmlhttp.responseText);
                if (content.length == 0) {
                    this.loadPage(  this.data.apiBase + '/page/404' );
                }
                else {
                    content.blocks.forEach((block)=>{
                        this.onPageBlockLoaded();
                    });
                    this.set({ content,  path: window.location.pathname.replace(/\/$/, '')});
                }
            }
        };
        xmlhttp.open('GET', route, true);
        xmlhttp.send();
    }

    onBlockReady(e) {
        console.log('onBlockReady', e);
    }

    render() {

        let { content, globalContent, isLoading, 
              isLoaderEnd, path, menuOpened, showDialog } = this.data;
        
        return html`
            <scroll-manager smooth-scroll="true">
                <app-header 
                    @togglemenu="${ this.toggleMenu }"
                    @signupdown="${ this.onSignUpDown }"
                    content="${globalContent}" 
                    menuopened="${menuOpened}"
                    path="${path}"
                    class="pointer:none fixed w:fit z:10 is-active"
                    >
                </app-header>
                <main>
                    ${ !content ? html``: content.blocks && content.blocks.map(slide=>{
                        return html`
                            <page-block 
                                name="${slide.name}"
                                content="${{...slide, ...{global:globalContent} } }}"
                                @contentchange="${ this.onContentChange }"
                                @ready="${ ()=>{this.onBlockReady();} }"
                                >
                            </page-block>`
                    }) }
                </main>
                <app-footer 
                    content="${globalContent}">
                </app-footer>

                <div class="
                    | z:20 w:fit h:100vh fixed tl:0 flex items:center just:center (.is-ready &):tween:opacity,1.3s,easeOut
                    | ${showDialog?'o:1 pointer:auto is-active':'o:0 pointer:none'}
                    | p-x:6.25%@m">
                    <div 
                        class="bg:dark abs fit tl:0 o:0.85" 
                        @click="${ this.closeDialog }">
                    </div>
                    <div class="
                        | rel bg:#fff radius:5px w:40% flex items:center just:start mask
                        | transform scale:1.2 anim-in:scale:1 (.is-ready &):tween:all,1.3s,easeOut
                        | wrap:wrap@m w:fit@m">
                        <div class="w:50% rel before before:p-t:100% mask | w:fit@m before:p-t:60%@m">
                            <img 
                                src="https://d2v6doicvavr5y.cloudfront.net/signup-dialog.jpg" 
                                class="abs tl:0 fit object:cover transform scale:1.2 anim-in:scale:1 tween:all,1.3s,easeOut"
                            />
                        </div>
                        <div class="
                            | w:50% p-x:40fx 
                            | w:fit@m p-x:6.25vw@m p-y:30fy@m align-x:center@m">
                            <h3 class="fs:20fx lh:40fx fw:bold p-b:20fy b-b:solid,1px,#d7d7d7 m-b:20fy">
                                <core-multiline word-class="fs:20fx lh:40fx">
                                    Launching Soon!
                                </core-multiline>
                            </h3>
                            <div class="fs:16fx lh:22fx c:#7d7d7d m-b:35fy">
                                <core-multiline word-class="fs:16fx lh:22fx">We’re launchinng our platform soon, stay tuned for updates!</core-multiline>
                            </div>
                            <button 
                                @click="${ this.closeDialog }"
                                class="
                                   | bg:blue border:solid,2px,blue radius:100px rel fs:15fx iblock c:light p-y:13fy p-x:30fx lh:1.05
                                   | min-w:150px@m lh:16fx@m p-y:24fy@m fw:500@m
                                   | hover:bg:#fff hover:c:#000 hover:border:solid,2px,#d7d7d7
                                   | tween:all,0.6s,easeOut">
                                Close
                            </button>
                        </div>
                    </div>
                </div>

            </scroll-manager>
            <app-loader 
                content="${globalContent}" 
                active="${isLoading}" 
                reset="${isLoaderEnd}" 
                class="tl:0 fixed w:fit h:100vh z:100 pointer:none">
            </app-loader>`
    }

    afterRender() {
        let $scrollManager = this.querySelector("scroll-manager");
        if ($scrollManager) {
            this.$scrollManager = $scrollManager;
        }
    }

    onPageBlockLoaded() {
        
        this.loaderTimer && clearTimeout(this.loaderTimer);
        this.loaderTimer = setTimeout(()=>{
            this.onContentChange();
            this.$scrollManager && this.$scrollManager.resize();
            
            if ( document.querySelector('block-home') && !document.querySelector('block-home').data.canPlay ) {
                //wait for video to be ready
                console.log('Block Home, wait', document.querySelector('block-home').data);
                document.querySelector('block-home').addEventListener('videoready', ()=>{
                    console.log('VIDEO IS READY');
                    this.set({ isLoading: false });
                    document.body.classList.add('is-ready');
                    this.loaderTimer = setTimeout(()=>{
                        document.body.classList.add('is-ready');
                        this.set({ isLoaderEnd: true });
                    }, 1600);
                });
            }
            else {
                this.set({ isLoading: false });
                document.body.classList.add('is-ready');
                this.loaderTimer = setTimeout(()=>{
                    document.body.classList.add('is-ready');
                    this.set({ isLoaderEnd: true });
                }, 1600);
            }
        }, 500);
    }

    resize() {
        this.onContentChange();
    }

    onContentChange() {
        this.$anchors = document.querySelectorAll('a');
        this.$anchors.forEach((el,i)=>{
            el.removeEventListener('click', this.onLinkDown, false);
            el.addEventListener('click', this.onLinkDown, false);
        });
    }

    onLinkDown(e) {

        let href = e.currentTarget.getAttribute('href');
        let currOrigin = window.location.origin.replace('https://', '://').replace(/\/$/, '');
        
        // console.log('JS LINK DOWN', window.location.hash == '' , href.indexOf('://') == -1, href.indexOf(currOrigin) != -1 )

        if ( window.location.hash == '' && (href.indexOf('://') == -1 || href.indexOf(currOrigin) != -1)  ) {
            
            // console.log('USE_TRANSITION')

            e.preventDefault();
            e.stopPropagation();
            history.pushState({}, '', href);

            let page = href.replace(currOrigin, ''); 
            let route = this.data.apiBase + '/page' + page;
            this.set({ isLoading: true , isLoaderEnd: false});

            setTimeout(()=>{

                window.scrollTo(0,0);
                this.set({ menuOpened: false });

                requestAnimationFrame(()=>{
                    this.set({ content: null });
                    requestAnimationFrame(()=>{
                        requestAnimationFrame(()=>{
                            this.loadPage(route);
                        });
                    });
                });

            }, 1600);

            return false;

            
        }

    }


}

customElements.define('web-application', WebApplication);
