import { shallowMount } from '@vue/test-utils';
import HelloWorld from './hello-world';

describe('HelloWorld', () => {
  it('should say hello to the entire world', () => {
    const { vm } = shallowMount(HelloWorld);
    expect(vm.name).toEqual('World');
  });
});
