
var utils = {
    patterns: {
        avatar: /^(https?:)?\/\/[^\s]+\.(jpeg|jpg|gif|png)(\?[^\s]+)?/,
        name: /^([^`°~@#$%,.<>;*':"^\\/[\]|{}()=+\s][ ]?){2,}$/
    }
};

if (typeof exports !== 'undefined') {
    exports.patterns = utils.patterns;
} else {
    window.utils = utils;
}