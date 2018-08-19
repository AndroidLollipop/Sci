# sci - the sic compiler/interpretrer
'sic' stands for the 'sci interpreter/compiler'  
see how that kinda matches the structure of a recursive descent parser?
## example output for tokparse (ast constructor)
youClod(matchDefine(wrapString("str autism = 'you'"))) ->  
{ status: 'success',  
  next: [ 13, 'str autism = \'you\'' ],  
  treeNode:  
   { type: 'variable declaration',  
     data: 'str autism = \'you\'',  
     children:  
      [ { type: 'string declaration', data: 'str', children: [] },  
        { type: 'identifier', data: 'autism', children: [] },  
        { type: 'equals', data: '=', children: [] },  
        { type: 'string literal',  
          data: '\'you\'',  
          children: [ { type: 'alphanumeric literal', data: 'you', children: [] } ] } ] } }  