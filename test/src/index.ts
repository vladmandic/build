import * as module from './module';

export async function idle(): Promise<void> {
  // this function does nothing
}

export async function first(msg: string): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('test', msg);
}

export async function second(): Promise<void> {
  module.call('test module');
}

first('message');
