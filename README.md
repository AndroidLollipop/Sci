# sci - the sic compiler/interpreter
'sic' stands for 'sci interpreter/compiler'  
see how that kinda matches the structure of a recursive descent parser? (except that it's left recursive so it wouldn't work without conversion)  
the name of this repository is outdated. this language is too dynamic, it'll never compile to performant native code without a ton of effort. i guess this is the scam/interpreter now.
## the most legit thing that this can do right now
### closures!
var e = require("./simpleAndCleanInterfaceForRepl.js")  
var repl = e.getRepl()  
console.log(repl("num closure(){num add(){skye = skye + 1; return skye}; num skye = 1; return add}"))  
console.log(repl("num clo = closure()"))  
console.log(repl("clo()"))  
console.log(repl("clo()"))  
console.log(repl("clo()"))  
//skye is trapped  
console.log(repl("skye"))  
  
output:  
{ type: 'number', value: 2 }  
{ type: 'number', value: 3 }  
{ type: 'number', value: 4 }  
undefined <- this is expected! this shows that skye is not in the global scope
### recursion!
var e = require("./simpleAndCleanInterfaceForRepl.js")  
var repl = e.getRepl()  
console.log(repl("num slowFibonacci(n){if(n < 3){return 1};return slowFibonacci(n-1)+slowFibonacci(n-2)}"))  
console.log(repl("slowFibonacci(10)"))  
  
output:  
{ type: 'number', value: 55 }
## example output for repl (ok, more like a pseudo-repl)
var e = require("./simpleAndCleanInterfaceForRepl.js")  
var repl = e.getRepl()  
console.log(repl("(123\*456)+(789\*0.12)"))  
console.log(repl("num camila = 5"))  
console.log(repl("camila"))  
console.log(repl("num young = 7+3\*6"))  
console.log(repl("young"))  
console.log(repl("num havana = camila + young"))  
console.log(repl("havana"))  
console.log(repl("str youAre = 'autistic'"))  
console.log(repl("((1+2)\*(3+(4\*5)))+havana"))  
console.log(repl("1+2-3+4-5"))  
console.log(repl("7+3\*6\*7\*9"))  
console.log(repl("7\*3+6\*7\*9"))  
  
output:  
{ type: 'number', value: 56182.68 }  
{ type: 'number', value: 5 }  
{ type: 'number', value: 5 }  
{ type: 'number', value: 25 }  
{ type: 'number', value: 25 }  
{ type: 'number', value: 30 }  
{ type: 'number', value: 30 }  
{ type: 'string', value: 'autistic' }  
{ type: 'number', value: 99 }  
{ type: 'number', value: -1 }  
{ type: 'number', value: 1141 }  
{ type: 'number', value: 399 }
## example output for tokparse (ast constructor)
### string declaration
youClod(matchDefine(wrapString("str autism = 'you'"))) ->  
{ status: 'success',  
  next: \[ 18, 'str autism = \'you\'' \],  
  treeNode:  
   { type: 'variable declaration',  
     canonicalString: 'str autism = \'you\'',  
     children:  
      \[ { type: 'string declaration', canonicalString: 'str', children: \[\] },  
        { type: 'identifier', canonicalString: 'autism', children: \[\] },  
        { type: 'equals', canonicalString: '=', children: \[\] },  
        { type: 'string literal',  
          canonicalString: '\'you\'',  
          children: \[ { type: 'alphanumeric literal', canonicalString: 'you', children: \[\] } \] } \] } }
### expression
youClod(matchExpr(wrapString("(123\*456)+(789\*012)"))) ->  
{ status: 'success',  
  next: \[ 20, '(123\*456)+(789\*0.12)' \],  
  treeNode:  
   { type: 'expression',  
     canonicalString: '(123\*456)+(789\*0.12)',  
     children:  
      \[ { type: 'parenthesized expression',  
          canonicalString: '(123\*456)',  
          children:  
           \[ { type: 'expression',  
               canonicalString: '123\*456',  
               children:  
                \[ { type: 'integral literal', canonicalString: '123', children: \[\] },  
                  { type: 'operator: dm', canonicalString: '\*', children: \[\] },  
                  { type: 'integral literal', canonicalString: '456', children: \[\] } \] } \] },  
        { type: 'operator: as', canonicalString: '+', children: \[\] },  
        { type: 'parenthesized expression',  
          canonicalString: '(789\*0.12)',  
          children:  
           \[ { type: 'expression',  
               canonicalString: '789\*0.12',  
               children:  
                \[ { type: 'integral literal', canonicalString: '789', children: \[\] },  
                  { type: 'operator: dm', canonicalString: '\*', children: \[\] },  
                  { type: 'float literal',  
                    canonicalString: '0.12',  
                    children:  
                     \[ { type: 'integral literal', canonicalString: '0', children: \[\] },  
                       { type: 'fractional literal', canonicalString: '12', children: \[\] } \] } \] } \] } \] } }
### function
youClod(t.matchFundef(wrapString("num potato(p1, p2, p3){num skye = 1;num scotland = 2; return p1+p2+p3+skye+scotland}"))) ->  
{ status: 'success',  
  next:  
   \[ 84,  
     'num potato(p1, p2, p3){num skye = 1;num scotland = 2; return p1+p2+p3+skye+scotland}' \],  
  treeNode:  
   { type: 'function declaration',  
     canonicalString: 'num potato (p1, p2, p3) {num skye = 1;num scotland = 2;return p1+p2+p3+skye+scotland;}',  
     children:  
      \[ { type: 'number declaration',  
          canonicalString: 'num',  
          children: \[\] },  
        { type: 'identifier', canonicalString: 'potato', children: \[\] },  
        { type: 'parameter declaration',  
          canonicalString: '(p1, p2, p3)',  
          children:  
           \[ { type: 'identifier', canonicalString: 'p1', children: \[\] },  
             { type: 'identifier', canonicalString: 'p2', children: \[\] },  
             { type: 'identifier', canonicalString: 'p3', children: \[\] } ] },  
        { type: 'function body',  
          canonicalString: '{num skye = 1;num scotland = 2;return p1+p2+p3+skye+scotland;}',  
          children:  
           \[ { type: 'variable declaration',  
               canonicalString: 'num skye = 1',  
               children:  
                \[ { type: 'number declaration',  
                    canonicalString: 'num',  
                    children: \[\] },  
                  { type: 'identifier', canonicalString: 'skye', children: \[\] },  
                  { type: 'equals', canonicalString: '=', children: \[\] },  
                  { type: 'integral literal', canonicalString: '1', children: \[\] } ] },  
             { type: 'variable declaration',  
               canonicalString: 'num scotland = 2',  
               children:  
                \[ { type: 'number declaration',  
                    canonicalString: 'num',  
                    children: \[\] },  
                  { type: 'identifier', canonicalString: 'scotland', children: \[\] },  
                  { type: 'equals', canonicalString: '=', children: \[\] },  
                  { type: 'integral literal', canonicalString: '2', children: \[\] } ] },  
             { type: 'return statement',  
               canonicalString: 'return p1+p2+p3+skye+scotland',  
               children:  
                \[ { type: 'expression',  
                    canonicalString: 'p1+p2+p3+skye+scotland',  
                    children:  
                     \[ { type: 'identifier', canonicalString: 'p1', children: \[\] },  
                       { type: 'operator: as', canonicalString: '+', children: \[\] },  
                       { type: 'identifier', canonicalString: 'p2', children: \[\] },  
                       { type: 'operator: as', canonicalString: '+', children: \[\] },  
                       { type: 'identifier', canonicalString: 'p3', children: \[\] },  
                       { type: 'operator: as', canonicalString: '+', children: \[\] },  
                       { type: 'identifier', canonicalString: 'skye', children: \[\] },  
                       { type: 'operator: as', canonicalString: '+', children: \[\] },  
                       { type: 'identifier', canonicalString: 'scotland', children: \[\] } \] } \] } \] } \] } }
## refactoring considerations
tokparse.js really needs to be refactored.  
specifically, all functions should return next even on failure. this will save about 50 lines of code.
## this doesn't really do anything new...
that's not the point. this is meant to be a learning experience.
## important note on hacky code
because i used an extremely hacky method to implement DMAS from BODMAS, you must remember to save and reset mulPrecedence before and restore it after the appropriate calls when editing the code
## note on save restore calling conventions
all parse functions take care of whitespace and global variable saving/restoring for their callees.
