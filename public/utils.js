var utils = {
    patterns: {
        avatar: /^(https?:)?\/\/[^\s]+\.(jpeg|jpg|gif|png)(\?[^\s]+)?/
    }
};

if (typeof exports !== 'undefined') {
    exports.patterns = utils.patterns;
} else {
    window.utils = utils;
}
