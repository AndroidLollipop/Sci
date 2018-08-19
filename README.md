# sci - the sic compiler/interpretrer
'sic' stands for 'sci interpreter/compiler'  
see how that kinda matches the structure of a recursive descent parser? (except that it's left recursive so it wouldn't work without conversion)
## example output for tokparse (ast constructor)
youClod(matchDefine(wrapString("str autism = 'you'"))) ->  
{ status: 'success',  
  next: [ 18, 'str autism = \'you\'' ],  
  treeNode:  
   { type: 'variable declaration',  
     canonicalString: 'str autism = \'you\'',  
     children:  
      [ { type: 'string declaration', canonicalString: 'str', children: [] },  
        { type: 'identifier', canonicalString: 'autism', children: [] },  
        { type: 'equals', canonicalString: '=', children: [] },  
        { type: 'string literal',  
          canonicalString: '\'you\'',  
          children: [ { type: 'alphanumeric literal', canonicalString: 'you', children: [] } ] } ] } }  
youClod(matchExpr(wrapString("(123\*456)+(789\*012)"))) ->  
{ status: 'success',  
  next: [ 20, '(123\*456)+(789\*0.12)' ],  
  treeNode:  
   { type: 'expression',  
     canonicalString: '(123\*456)+(789\*0.12)',  
     children:  
      [ { type: 'parenthesized expression',  
          canonicalString: '(123\*456)',  
          children:  
           [ { type: 'expression',  
               canonicalString: '123\*456',  
               children:  
                [ { type: 'integral literal', canonicalString: '123', children: [] },  
                  { type: 'operator: dm', canonicalString: '\*', children: [] },  
                  { type: 'integral literal', canonicalString: '456', children: [] } ] } ] },  
        { type: 'operator: as', canonicalString: '+', children: [] },  
        { type: 'parenthesized expression',  
          canonicalString: '(789\*0.12)',  
          children:  
           [ { type: 'expression',  
               canonicalString: '789\*0.12',  
               children:  
                [ { type: 'integral literal', canonicalString: '789', children: [] },  
                  { type: 'operator: dm', canonicalString: '\*', children: [] },  
                  { type: 'float literal',  
                    canonicalString: '0.12',  
                    children:  
                     [ { type: 'integral literal', canonicalString: '0', children: [] },  
                       { type: 'fractional literal', canonicalString: '12', children: [] } ] } ] } ] } ] } }
## refactoring considerations
tokparse.js really needs to be refactored.  
specifically, all functions should return next even on failure. this will save about 50 lines of code.