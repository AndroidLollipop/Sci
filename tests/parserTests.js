var t = require("../tokParse.js")
var youClod = (x) => console.log(require("util").inspect(x, { showHidden: false, depth: null }))
var wrapString = (string) => {
    return [0, string]
}
var c = (s) => youClod(t.matchProgram(wrapString(s)))
c("1*(2+3)*4-5+6*7*9*3==3&&1-2*3+1==2||3!=1")