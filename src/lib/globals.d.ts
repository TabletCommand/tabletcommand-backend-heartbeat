
declare type Resolve<T> = (value: T, resolved: boolean) => void;
declare type Callback<T> = (err: Error | null, result: T) => void;
declare type CallbackErr = (err: Error | null) => void;
