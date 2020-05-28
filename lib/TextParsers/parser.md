# Parser

Toool for parsing text to rows/fields (arrays of arrays) by chaining predefined actions.

### Usage

#### Inline chaining:

Initiate class instance and call necessary actions in chain. At the end of the chain, a _final_ action should be called (which returns _Array_ instead of _Object_).  
Parsed **text** can be provided either in _constructor_, or in _set( )_ action.

```
new Parser( text ).action( )[.action( )]
```

or

```
new Parser( ).set( text ).action( )[.action( )]
```

#### Callback function:

Similar to inline chaining, with exception of:

- Action chain is encapsulated in _callback_: ( source )=>source._action( )_[ ._action( )_ ]
- **text** is provided in _.parse( )_ method instead of _constructor_
- _.parse( **text** )_ method is called

```
new Parser( ( source )=>source._action( )[.action( )] ).parse( text )
```

#### Extending class:

Similar to _callback function_, with exception of:

- Extended class is used
- _callback function_ is hardcoded as _\_parse(parser)_ method

```
MyParser extends Parser {
 _parse( source )=> source.action( )[.action( )]
}
...
new MyParser( ).parse( text )
```

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
- `.get( )` - Returns array of arrays (rows/fields)
- `.match( object/callback )` - calls the _callback_ function (or _Object_ with _.assign()_ method) once for each **field**. Returns array of callback returns.

#### Method

`.parse( [ text ] )` - This method should be used with _callback_ or _class extension_ and **must not** be used with _action chaining_.

### Examples

#### CSV (simple)

Text:

```
#name,age,points
John,33,145
Peter,25,29
```

`new Parser(text).split("\n").filter(/#/).separate(",").expect(3).get()`

```
[
    ["John","33","145"],
    ["Peter","25","29"]
]
```
