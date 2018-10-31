const a = require("./astEval.js")
const t = require("./tokParse.js")
const p = require("./prelude.js")
const wrapString = t.wrapString
const getRepl = () => {
    const gloSco = a.emptyScope(p.Prelude)
    return (string) => {
        const wrappedString = wrapString(string)
        const ret = t.matchProgram(wrappedString)
        if (ret.status !== "success") {
            return "Syntax Error!"
        }
        return a.evaluateExpression(gloSco)(ret.treeNode)
    }
}
module.exports = {
    getRepl: getRepl
}