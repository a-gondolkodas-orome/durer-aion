import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import { RecoilRoot } from 'recoil';

test('renders', () => {
  render(<RecoilRoot><App /></RecoilRoot>);
  const linkElement = screen.getByText(/Üdvözlünk a XVI. Dürer/);
  expect(linkElement).toBeInTheDocument();
});
