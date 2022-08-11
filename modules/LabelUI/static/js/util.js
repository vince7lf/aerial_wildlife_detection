/**
 * Utility functions for the labeling interface.
 *
 * 2020-21 Benjamin Kellenberger
 */


// enable/disable interface
window.setUIblocked = function (blocked) {
    window.uiBlocked = blocked;
    $('button').prop('disabled', blocked);
}

// loading overlay
window.showLoadingOverlay = function (visible) {
    if (visible) {
        window.setUIblocked(true);
        $('#overlay').css('display', 'block');
        $('#overlay-loader').css('display', 'block');
        $('#overlay-card').css('display', 'none');

    } else {
        $('#overlay').fadeOut({
            complete: function () {
                $('#overlay-loader').css('display', 'none');
            }
        });
        window.setUIblocked(false);
    }
}

window.getCookie = function (name, decodeToObject) {
    let match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    if (match) match = match[2];

    if (typeof (match) === 'string' && decodeToObject) {
        let tokens = match.split(',');
        if (tokens.length >= 2 && tokens.length % 2 == 0) {
            match = {};
            for (var t = 0; t < tokens.length; t += 2) {
                match[tokens[t]] = tokens[t + 1];
            }
        }
    }
    return match;
}
window.setCookie = function (name, value, days) {
    if (typeof (value) === 'object') {
        let objStr = '';
        for (var key in value) {
            let val = value[key];
            objStr += key + ',' + val + ',';
        }
        value = objStr.slice(0, -1);
    }
    var d = new Date;
    d.setTime(d.getTime() + 24 * 60 * 60 * 1000 * days);
    document.cookie = name + "=" + value + ";path=/;expires=" + d.toGMTString();
}


// time util
window.msToTime = function (duration) {
    var seconds = Math.floor((duration / 1000) % 60),
        minutes = Math.floor((duration / (1000 * 60)) % 60),
        hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

    if (hours > 0) {
        hours = (hours < 10) ? '0' + hours : hours;
        minutes = (minutes < 10) ? '0' + minutes : minutes;
        seconds = (seconds < 10) ? '0' + seconds : seconds;
        result = hours + ':' + minutes + ':' + seconds;
        return result;

    } else {
        minutes = (minutes < 10) ? '0' + minutes : minutes;
        seconds = (seconds < 10) ? '0' + seconds : seconds;
        return minutes + ':' + seconds;
    }
}


/* color functions */
window.getColorValues = function (color) {
    if (color instanceof Array || color instanceof Uint8ClampedArray) return color;
    color = color.toLowerCase();
    if (color.startsWith('rgb')) {
        var match = /rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*\d+[\.\d+]*)*\)/g.exec(color);
        return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3]), (match.length === 4 ? parseInt(match[4]) : 255)];
    } else {
        return window.getColorValues(window.hexToRgb(color));
    }
}

window.rgbToHex = function (rgb) {
    var componentToHex = function (c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
    if (!(rgb instanceof Array || rgb instanceof Uint8ClampedArray)) {
        rgb = rgb.toLowerCase();
        if (rgb.startsWith('#')) {
            return rgb;
        } else if (rgb.startsWith('rgb')) {
            rgb = /rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*\d+[\.\d+]*)*\)/g.exec(rgb);
        }
    }
    return "#" + componentToHex(rgb[0]) + componentToHex(rgb[1]) + componentToHex(rgb[2]);
}

window.hexToRgb = function (hex) {
    if (hex.toLowerCase().startsWith('rgb')) return hex;
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function (m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 'rgb(' +
        parseInt(result[1], 16) + ',' +
        parseInt(result[2], 16) + ',' +
        parseInt(result[3], 16) + ')' : null;
}

window._addAlpha = function (color, alpha) {
    a = alpha > 1 ? (alpha / 100) : alpha;
    if (color.startsWith('#')) {
        // HEX color string
        color = window.hexToRgb(color);
    }
    var match = /rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*\d+[\.\d+]*)*\)/g.exec(color);
    return "rgba(" + [match[1], match[2], match[3], a].join(',') + ")";
}

window.addAlpha = function (color, alpha) {
    if (color === null || color === undefined) return null;
    if (alpha === null || alpha === undefined) return color;
    if (alpha <= 0.0) return null;
    alpha = alpha > 1 ? (alpha / 100) : alpha;
    if (alpha >= 1.0) return color;
    return window._addAlpha(color, alpha);
}

window.getBrightness = function (color) {
    var rgb = window.hexToRgb(color);
    var match = /rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*\d+[\.\d+]*)*\)/g.exec(rgb);
    return (parseInt(match[1]) + parseInt(match[2]) + parseInt(match[3])) / 3;
}

window.shuffle = function (a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}


// base64 conversion
window.bufferToBase64 = function (buf) {
    var binstr = Array.prototype.map.call(buf, function (ch) {
        return String.fromCharCode(ch);
    }).join('');
    return btoa(binstr);
}

window.base64ToBuffer = function (base64) {
    var binstr = atob(base64);
    var buf = new Uint8Array(binstr.length);
    Array.prototype.forEach.call(binstr, function (ch, i) {
        buf[i] = ch.charCodeAt(0);
    });
    return buf;
}

// Levenshtein distance for word comparison
window.levDist = function (s, t) {
    var d = []; //2d matrix

    // Step 1
    var n = s.length;
    var m = t.length;

    if (n == 0) return m;
    if (m == 0) return n;

    //Create an array of arrays in javascript (a descending loop is quicker)
    for (var i = n; i >= 0; i--) d[i] = [];

    // Step 2
    for (var i = n; i >= 0; i--) d[i][0] = i;
    for (var j = m; j >= 0; j--) d[0][j] = j;

    // Step 3
    for (var i = 1; i <= n; i++) {
        var s_i = s.charAt(i - 1);

        // Step 4
        for (var j = 1; j <= m; j++) {

            //Check the jagged ld total so far
            if (i == j && d[i][j] > 4) return n;

            var t_j = t.charAt(j - 1);
            var cost = (s_i == t_j) ? 0 : 1; // Step 5

            //Calculate the minimum
            var mi = d[i - 1][j] + 1;
            var b = d[i][j - 1] + 1;
            var c = d[i - 1][j - 1] + cost;

            if (b < mi) mi = b;
            if (c < mi) mi = c;

            d[i][j] = mi; // Step 6

            //Damerau transposition
            if (i > 1 && j > 1 && s_i == t.charAt(j - 2) && s.charAt(i - 2) == t_j) {
                d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost);
            }
        }
    }

    // Step 7
    return d[n][m];
}

// misc.
window.parseBoolean = function (value) {
    if (value === null || value === undefined) return false;
    return (value === 1 || ['yes', '1', 'true'].includes(value.toString().toLowerCase()));
}

window.getCurrentDateString = function () {
    var date = new Date();
    return date.toString();
}

window.getRandomString = function () {
    // only used for temporary IDs, never for sensitive hashing
    return Math.random().toString(36).substring(7);
}

window.getRandomID = function () {
    return window.getCurrentDateString() + window.getRandomString();
}

window.argMin = function (array) {
    return [].reduce.call(array, (m, c, i, arr) => c < arr[m] ? i : m, 0)
}

window.argMax = function (array) {
    return [].reduce.call(array, (m, c, i, arr) => c > arr[m] ? i : m, 0)
}

window.argsort = function (array, descending) {
    const arrayObject = array.map((value, idx) => {
        return {value, idx};
    });
    arrayObject.sort((a, b) => {
        if (a.value < b.value) {
            return descending ? 1 : -1;
        }
        if (a.value > b.value) {
            return descending ? -1 : 1;
        }
        return 0;
    });
    const argIndices = arrayObject.map(data => data.idx);
    return argIndices;
}

window.getColRowFromTileName = function (location) {
    // code snippet from regex101.com
    const regex = /.*(\d{1,2})_(\d{1,2})\.jpg/gm;
    let m;
    let colRow = "No tile selected";
    while ((m = regex.exec(location)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }

        // The result can be accessed through the `m`-variable.
        // Match 0 2018-Boucherville-13571792-13572097-1_tile_24_27.jpg
        // Group 1 24
        // Group 2 27
        colRow = `Row ${m[1]} : Col ${m[2]}`
    }
    return colRow;
    // code snippet from regex101.com
}