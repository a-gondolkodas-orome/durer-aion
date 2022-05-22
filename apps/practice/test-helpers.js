import createStore from './src/store/store';
import createRouter from './src/router';
import { mount, flushPromises } from '@vue/test-utils';

export const mountComponent = async (component, { store = createStore(), path = '/', propsData } = {}) => {
  const router = createRouter();
  router.push(path);
  await router.isReady();
  const wrapper = mount(component, { propsData, global: { plugins: [store, router] } });
  await flushPromises();
  return { store, wrapper };
};
