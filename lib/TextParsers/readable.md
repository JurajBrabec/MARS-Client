# Readable

#### Readable

#### File

#### Process

#### SQL

## Readable

Basic EventEmitter class extension, where all functionality must be defined in the `command` function.

#### Usage

First, instantiate the class with `{options}` and call `.execute([args])` method with an optional `args` parameter.  
Then handle the returning promise:

```
new Emitter( options ).execute( [ args ] )
.then( result => { //handle result } )
.catch( error => { //handle error  } );
```

or asynchronously using _await_:

```
try {
    const result = await new Emitter( options ).execute( [ args );
    // handle result
} catch( error ) {
    //handle error
}
```

or by listening to events:

```
new Emitter( options )
    .on( "progress", value => { //report progress } )
    .on( "error", error =>{ //handle error } )
    .on( "result", result => { //handle result } )
    .on( "exit", status => { //report status } )
    .execute( [ args ] )
```

#### Options

Object with a single property `command` that contains callback function with four arguments. Three callback functions `failure`, `progress` and `success`, and one optional `args` which is passed from the `.execute([args])` method.

```
{
    command : ( failure, progress, success, args) => {
        let result;
        progress( 10 )
    ...
        if ( error ) return failure( error );
        return success( result );
    }
}
```

#### Returns

The `.execute([args])` method returns a promise, that resolves by calling `success(result)` or rejects by calling `failure(error)` from within the `command` function.

#### Emits events

- `execute(args)` - when the `.execute()` method is called, where `args` is the argument provided to the method.
- `progress(value)` - when `progress()` is called from within the `command` function, where `value` is the argument provided to the method.
- `success(result)`- when `success()` is called from within the `command` function, where `result` is the argument provided to the method.
- `failure (error)` - when `failure()` is called from within the `command` function, where `error` is the argument provided to the method.
- `exit (status)` - After either success or failure, the `status` object contains detailed information.

#### Status

- `source` - the class name
- `args` - the `args` parameter provided to `.execute([args])` method
- `state` - the state/result of the command. Either `pending` or `failure` or `success`.
- `error` - In case of a failure, the `error` is in status as well.
- `result` - In case of a success, the `result` is in status as well.
- `duration` - number of miliseconds necessary to perform the operation.
