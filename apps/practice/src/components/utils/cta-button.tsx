import React from 'react';

interface CtaButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string
}

export const CtaButton = ({ className, children, ...props }: CtaButtonProps) => {
  return (
    <button
      className={[
        'border-none rounded-lg block my-1 py-1.5 px-3 w-full',
        'text-center text-lg whitespace-normal font-semibold',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'bg-blue-500 text-white enabled:hover:bg-blue-600 enabled:focus:bg-blue-600',
        className
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}
