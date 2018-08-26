var a = require("./astEval.js")
var t = require("./tokParse.js")
var p = require("./prelude.js")
var wrapString = (string) => {
    return [0, string]
}
var getRepl = () => {
    var gloSco = a.emptyScope(p.Prelude)
    return (string) => {
        var wrappedString = wrapString(string)
        var ret = t.matchProgram(wrappedString)
        if (ret.status !== "success") {
            return "Syntax Error!"
        }
        return a.evaluateExpression(gloSco)(ret.treeNode)
    }
}
module.exports = {
    getRepl: getRepl
}