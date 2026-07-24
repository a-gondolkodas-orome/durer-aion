// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { useHoverPreview } from './use-hover-preview';

describe('useHoverPreview', () => {
  it('starts with no value', () => {
    const { result } = renderHook(() => useHoverPreview<string>(0));
    expect(result.current.value).toBeNull();
  });

  it('sets the value on enter/focus and clears on leave/blur', () => {
    const { result } = renderHook(() => useHoverPreview<string>(1));

    act(() => result.current.hoverProps('x').onPointerEnter());
    expect(result.current.value).toBe('x');
    act(() => result.current.hoverProps('x').onPointerLeave());
    expect(result.current.value).toBeNull();

    act(() => result.current.hoverProps('y').onFocus());
    expect(result.current.value).toBe('y');
    act(() => result.current.hoverProps('y').onBlur());
    expect(result.current.value).toBeNull();
  });

  it('invalidates a stale hover once moveCount advances (the sticky-hover guard)', () => {
    const { result, rerender } = renderHook(
      ({ moveCount }) => useHoverPreview<string>(moveCount),
      { initialProps: { moveCount: 2 } }
    );

    act(() => result.current.hoverProps('a').onPointerEnter());
    expect(result.current.value).toBe('a');

    rerender({ moveCount: 3 }); // a move happened
    expect(result.current.value).toBeNull();

    // re-hovering after the move stamps the new moveCount
    act(() => result.current.hoverProps('b').onPointerEnter());
    expect(result.current.value).toBe('b');
  });
});
