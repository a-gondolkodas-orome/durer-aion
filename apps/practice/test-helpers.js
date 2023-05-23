import createRouter from './src/router';
import { mount, flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';

export const mountComponent = async (component, { path = '/', propsData } = {}) => {
  const pinia = createTestingPinia({ stubActions: false });
  const router = createRouter();
  router.push(path);
  await router.isReady();
  const wrapper = mount(component, {
    propsData,
    global: { plugins: [pinia, router] }
  });
  await flushPromises();
  return { wrapper };
};
