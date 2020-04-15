# Sci - the Sic compiler/interpreter
'Sic' stands for 'Sci interpreter/compiler'  
Just an interpreter at the moment
## How to use
Install node current from https://nodejs.org  
Clone this repository  
Cd to this repository in your shell and run "node exampleProgram.js"
## Feature demonstrations (see featureDemo.js for a completely up-to-date demo)
### Closures!
```
var e = require("./simpleAndCleanInterfaceForRepl.js")
var repl = e.getRepl()
console.log(repl("var closure(){num add(){skye = skye + 1; return skye}; num skye = 1; return add}"))
console.log(repl("var clo = closure()"))
console.log(repl("clo()"))
console.log(repl("clo()"))
console.log(repl("clo()"))
//skye is trapped
console.log(repl("skye"))
```
  
output:  
```
{ type: 'number', value: 2 }
{ type: 'number', value: 3 }
{ type: 'number', value: 4 }
{ type: 'undefined' } <- this is expected! this shows that skye is not in the global scope
```
### Recursion!
```
var e = require("./simpleAndCleanInterfaceForRepl.js")
var repl = e.getRepl()
console.log(repl("num slowFibonacci(n){if(n < 3){return 1};return slowFibonacci(n-1)+slowFibonacci(n-2)}"))
console.log(repl("slowFibonacci(10)"))
```
  
output:  
```
{ type: 'number', value: 55 }
```
## Important files
See exampleProgram.js for an example program and featureDemo.js for a feature demonstration  
The parser is defined in tokParse.js  
The ast evaluator is defined in astEval.js
## Example output for repl
```
var e = require("./simpleAndCleanInterfaceForRepl.js")
var repl = e.getRepl()
console.log(repl("(123*456)+(789*0.12)"))
console.log(repl("num camila = 5"))
console.log(repl("camila"))
console.log(repl("num young = 7+3*6"))
console.log(repl("young"))
console.log(repl("num havana = camila + young"))
console.log(repl("havana"))
console.log(repl("str youAre = 'autistic'"))
console.log(repl("((1+2)*(3+(4*5)))+havana"))
console.log(repl("1+2-3+4-5"))
console.log(repl("7+3*6*7*9"))
console.log(repl("7*3+6*7*9"))
```
  
output:  
```
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
```
## Example output for tokparse (ast constructor) using interface provided in oldExamples/miscExamples.js
### String declaration
`youClod(t.matchDefine(wrapString("str autism = 'you'")))` ->  
```
{ status: 'success',
  next: [ 18, 'str autism = \'you\'' ],
  treeNode:
   { type: 'variable declaration',
     canonicalString: 'str autism = \'you\'',
     children:
      [ { type: 'typed declaration',
          canonicalString: 'str',
          children: [],
          declaredType: 'str' },
        { type: 'identifier', canonicalString: 'autism', children: [] },
        { type: 'equals', canonicalString: '=', children: [] },
        { type: 'string literal',
          canonicalString: '\'you\'',
          children:
           [ { type: 'alphanumeric literal',
               canonicalString: 'you',
               children: [] } ] } ] } }
```
### Expression
`youClod(t.matchExprExtern(wrapString("123*456+789*012")))` ->  
```
{ status: 'success',
  next: [ 15, '123*456+789*012' ],
  treeNode:
   { type: 'expression',
     canonicalString: '123*456+789*012',
     children:
      [ { type: 'expression',
          associativity: 0,
          canonicalString: '123*456+789*012',
          children:
           [ { type: 'expression',
               canonicalString: '123*456',
               children:
                [ { type: 'expression',
                    associativity: 0,
                    canonicalString: '123*456',
                    children:
                     [ { type: 'integral literal',
                         canonicalString: '123',
                         children: [] },
                       { type: 'operator: dm', canonicalString: '*', children: [] },
                       { type: 'integral literal',
                         canonicalString: '456',
                         children: [] } ] } ] },
             { type: 'operator: as', canonicalString: '+', children: [] },
             { type: 'expression',
               associativity: 0,
               canonicalString: '789*012',
               children:
                [ { type: 'integral literal',
                    canonicalString: '789',
                    children: [] },
                  { type: 'operator: dm', canonicalString: '*', children: [] },
                  { type: 'integral literal',
                    canonicalString: '012',
                    children: [] } ] } ] } ] } }
```
### Function
`youClod(t.matchFundef(wrapString("num potato(p1, p2, p3){num skye = 1;num scotland = 2; return p1+p2+p3+skye+scotland}")))` ->  
```
{ status: 'success',
  next:
   [ 84,
     'num potato(p1, p2, p3){num skye = 1;num scotland = 2; return p1+p2+p3+skye+scotland}' ],
  treeNode:
   { type: 'function declaration',
     canonicalString:
      'num potato (p1, p2, p3) {num skye = 1;num scotland = 2;return p1+p2+p3+skye+scotland;}',
     children:
      [ { type: 'typed declaration',
          canonicalString: 'num',
          children: [],
          declaredType: 'num' },
        { type: 'identifier', canonicalString: 'potato', children: [] },
        { type: 'parameter declaration',
          canonicalString: '(p1, p2, p3)',
          children:
           [ { type: 'identifier', canonicalString: 'p1', children: [] },
             { type: 'identifier', canonicalString: 'p2', children: [] },
             { type: 'identifier', canonicalString: 'p3', children: [] } ] },
        { type: 'function body',
          canonicalString:
           '{num skye = 1;num scotland = 2;return p1+p2+p3+skye+scotland;}',
          children:
           [ { type: 'variable declaration',
               canonicalString: 'num skye = 1',
               children:
                [ { type: 'typed declaration',
                    canonicalString: 'num',
                    children: [],
                    declaredType: 'num' },
                  { type: 'identifier', canonicalString: 'skye', children: [] },
                  { type: 'equals', canonicalString: '=', children: [] },
                  { type: 'integral literal', canonicalString: '1', children: [] } ] },
             { type: 'variable declaration',
               canonicalString: 'num scotland = 2',
               children:
                [ { type: 'typed declaration',
                    canonicalString: 'num',
                    children: [],
                    declaredType: 'num' },
                  { type: 'identifier', canonicalString: 'scotland', children: [] },
                  { type: 'equals', canonicalString: '=', children: [] },
                  { type: 'integral literal', canonicalString: '2', children: [] } ] },
             { type: 'return statement',
               canonicalString: 'return p1+p2+p3+skye+scotland',
               children:
                [ { type: 'expression',
                    canonicalString: 'p1+p2+p3+skye+scotland',
                    children:
                     [ { type: 'expression',
                         associativity: 0,
                         canonicalString: 'p1+p2+p3+skye+scotland',
                         children:
                          [ { type: 'identifier', canonicalString: 'p1', children: [] },
                            { type: 'operator: as', canonicalString: '+', children: [] },
                            { type: 'identifier', canonicalString: 'p2', children: [] },
                            { type: 'operator: as', canonicalString: '+', children: [] },
                            { type: 'identifier', canonicalString: 'p3', children: [] },
                            { type: 'operator: as', canonicalString: '+', children: [] },
                            { type: 'identifier', canonicalString: 'skye', children: [] },
                            { type: 'operator: as', canonicalString: '+', children: [] },
                            { type: 'identifier', canonicalString: 'scotland', children: [] } ] } ] } ] } ] } ] } }
```
