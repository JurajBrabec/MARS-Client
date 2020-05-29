# Parser

Toool for parsing text to rows/fields (arrays of arrays) by chaining predefined actions.

### Usage

#### Inline chaining:

Initiate class instance and call necessary actions in chain. At the end of the chain, a _final_ action should be called (which returns _Array_ instead of _Object_).  
Parsed **text** can be provided either in _constructor_, or in _set( )_ action.

```
result = new Parser( text ).action( )[.action( )]
```

or

```
result = new Parser( ).set( text ).action( )[.action( )]
```

#### Callback function:

Similar to inline chaining, with exception of:

- Action chain is encapsulated in _callback_ function: ( source )=>source._action( )_[ ._action( )_ ]
- **text** is provided in _.parse( )_ method instead of _constructor_
- _.parse( **text** )_ method is called

```
actionChain = ( source )=>source._action( )[.action( )]
```

then

```
result = new Parser( actionChain ).parse( text )
```

or

```
parser = new Parser( { actionChain: actionChain, splitBuffer:<splitBuffer> } )
... // repeatedly supply text from stream
partial = parser.buffer( text )
if (partial) .... // process partial results
... // finally process the remaining text
final = parser.flush( )
```

#### Extending class:

Similar to _callback function_, with exception of:

- Extended class is used
- _callback function_ is hardcoded as _\_parse(parser)_ method

```
MyParser extends Parser {
 chain( source )=> source.action( )[.action( )]
}
...
new MyParser( ).parse( text )
```

or

```
parser = new MyParser( { splitBuffer:<splitBuffer> } )
... // repeatedly supply text from stream
partialResult = parser.buffer( text )
if (partialResult) .... // process partial results
... // finally process the remaining text
finalResult = parser.flush( )
```

#### Methods

`.parse( [ text ] )` - This method should be used with _callback_ or _class extension_ and **must not** be used with _action chaining_.  
Parses provided text immediately, return results.

#### Method

`.buffer( text )` - This method should be used with _callback_ or _class extension_ and **must not** be used with _action chaining_. Don't forget to call _.flush()_ at the end.  
Text is stored in internal buffer until _splitBuffer_ occurs. Then the text until _splitBuffer_ will be parsed, rest will be stored in buffer.  
Returns results or `false`.

### Parsing actions

#### Setting actions

Actions which do set something

- `.set( text )` - called internally by constructor or parse() if text provided
- `.delimited( delimiter )`
- `.escaped( _escapeCharacter )`
- `.quoted( quoteCharacter )`
- `.separated( separator )`

#### Checking actions

Actions which do check something

- `.check( )` - **throw** if any row has more/less of fields (handy before final action)
- `.expect( text/regExp/number )` - **throw** if any field doesn't equal [ _text_ ] or match [ _regExp_ ] or number of fields is not [ _number_ ]
- `.reject( text/regExp )` - **throw** if any field equals [ _text_ ] or match [ _regExp_ ]

#### Breeding actions

Actions which multiply the number of fields/rows as a result

- `.split( text/regExp )`
- `.separate( text/regExp )`

#### Reducing actions

Actions which reduce the number of fields/rows as a result

- `.filter( text/regExp )`
- `.pop( )`
- `.shift( )`
- `.unpivot( )`

#### Altering actions

Actions which modify fields, but not reduce them (except of empty fields after _.replace()_ or _.trim()_)

- `.lcase( )`
- `.ucase( )`
- `.replace( string/regExp[ ,string ] )`
- `.quote( quoteCharacter )`
- `.unquote( quoteCharacter )`
- `.trim( )`

#### Final actions

Actions which return results (_Array_ instead of _Object_), _must_ be used at the end of the action chain

- `.assign( object/callback )` - calls the _callback_ function (or _Object_ with _.assign()_ method) once for each **row**. Returns array of callback returns.
- `.flush( )` - Use only with _.buffer( )_. Returns array of arrays (rows/fields)
- `.get( )` - Returns array of arrays (rows/fields)
- `.match( object/callback )` - calls the _callback_ function (or _Object_ with _.assign()_ method) once for each **field**. Returns array of callback returns.

### Examples

#### CSV (simple)

Text:

```
#name,age,points
John,33,145
Peter,25,29
```

`new Parser( text ).split( "\n" ).filter( /#/ ).separate( "," ).expect( 3 ).get( )`

```
[
    ["John","33","145"],
    ["Peter","25","29"]
]
```

#### Buffer without _bufferSplit_

`actionChain = ( source ) => source.split( "\n" ).filter( /#/ ).separate( "," ).get( )`

`parser = new Parser( actionChain )`

`parser.buffer( "#name,age,points\n" ) // false`  
`parser.buffer( "John,33,145\n" ) // false`  
`parser.buffer( "Peter,25,29\n" ) // false`

`parser.flush( )`

```
[
["John","33","145"],
["Peter","25","29"]
]

```

#### Buffer with _bufferSplit_

`actionChain = ( source ) => source.filter( /#/ ).separate( "," ).get( )`

`parser = new Parser( { actionChain: actionChain, bufferSplit : "\n" } )`

`parser.buffer( "#name,age,points\n" ) // [[]]`  
`parser.buffer( "John,33,145\n" ) // [["John","33","145"]]`  
`parser.buffer( "Peter,25,29\n" ) // [["Peter","25","29"]]`

`parser.flush( ) //[[]]`
